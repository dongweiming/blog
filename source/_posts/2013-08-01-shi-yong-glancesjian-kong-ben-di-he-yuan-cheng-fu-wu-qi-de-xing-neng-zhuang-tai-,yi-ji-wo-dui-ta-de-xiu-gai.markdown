---
layout: post
title: "使用glances监控本地和远程服务器的性能状态，以及我对它的修改"
date: 2013-08-01 11:43
comments: true
categories:
- 运维
tags:
- glances

---


####前言

首先开始感谢[Vpsee](http://www.vpsee.com)的那篇[安装和使用系统监控工具 Glances](http://www.vpsee.com/2013/07/a-new-system-monitoring-tool-glances-installation-and-usage/)，让我发现了[glances](https://github.com/nicolargo/glances)这个新的系统监控工具.并且可以通过xml-rpc
监控远程服务器的系统情况显示到本地.它其实类似于top,支持键盘按键.使用了psutil库获取了硬盘分区，负载，内存使用，交换分区使用，进程(支持根据cpu占用,内存占用，进程名和
io使用的排序).并且在安装了lm-sensor后还可以监控服务器的温度.记录日志,高亮显示可配置的阀值的预警颜色.就像一个超级版的top,但是它的优点其实就是2个:

1. 它是python的，你可以定制化
1. 它可以使用rpc获取其他服务端的系统信息,top可不行额


####我对它做了些贡献


1. 首先我给他添加了中文的国际化,但是因为显示英文比汉语占用得长度要小，我没有在太多的地方全部显示中文，而且我觉得作为运维本来就应该好好用英语...如果有必要我可以做一个glance-cn，完全汉化
1. 我读了它的源码,发现它的代码已经超过4000行，但是好几个地方其实有很大的优化空间,比如它的glancesScreen类，有下面这样的代码:


```python
    def __getMemAlert(self, current=0, max=100):                               
        # If current < CAREFUL of max then alert = OK                          
        # If current > CAREFUL of max then alert = CAREFUL                     
        # If current > WARNING of max then alert = WARNING                     
        # If current > CRITICAL of max then alert = CRITICAL                   
        try:                                                                   
            variable = (current * 100) / max                                   
        except ZeroDivisionError:                                              
            return 'DEFAULT'                                                   
                                                                               
        if variable > limits.getMEMCritical():                                 
            return 'CRITICAL'                                                  
        elif variable > limits.getMEMWarning():                                
            return 'WARNING'                                                   
        elif variable > limits.getMEMCareful():                                
            return 'CAREFUL'                                                   
                                                                               
        return 'OK'                                                            
                                                                               
    def __getMemColor(self, current=0, max=100):                               
        return self.__colors_list[self.__getMemAlert(current, max)]            
                                                                               
    def __getMemColor2(self, current=0, max=100):                              
        return self.__colors_list2[self.__getMemAlert(current, max)]           
                                                                               
    def __getSwapAlert(self, current=0, max=100):                              
        # If current < CAREFUL of max then alert = OK                          
        # If current > CAREFUL of max then alert = CAREFUL                     
        # If current > WARNING of max then alert = WARNING                     
        # If current > CRITICAL of max then alert = CRITICAL                   
        try:                                                                   
            variable = (current * 100) / max                                   
        except ZeroDivisionError:                                              
            return 'DEFAULT'                                                   
                                                                               
        if variable > limits.getSWAPCritical():                                
            return 'CRITICAL'                                                  
        elif variable > limits.getSWAPWarning():                               
            return 'WARNING'                                                   
        elif variable > limits.getSWAPCareful():                               
            return 'CAREFUL'                                                   
                                                                               
        return 'OK'                                                            
                                                                               
    def __getSwapColor(self, current=0, max=100):                              
        return self.__colors_list[self.__getSwapAlert(current, max)]           
                                                                                                                                                                                  
    def __getSwapColor2(self, current=0, max=100):                             
        return self.__colors_list2[self.__getSwapAlert(current, max)]       
```

我来分析下,每种模块都有__getXXXAlert，__getXXXColor， __getxxxColor2，其中__getXXXColor， __getxxxColor2都会调用__getXXXAlert,他们的参数可能不同

你看到了很多好相似的代码了嘛?其实待遇代码的可读性和可理解性已经代码的紧凑和不易懂一直就需要一个折中，我提了一个pull request，其实对这个类的属性做了下拦截


```python
# 使用__getattr__是为了只获取类中没有定义的属性
def __getattr__(self, name):                                               
        base_type = ['Mem', 'Swap', 'Fs', 'HDDTemp', 'Sensors']                
        get_alert_list = ['_glancesScreen__get' + m + 'Alert' for m in base_type]
        base_type.extend(['Load', 'Cpu']) #我没有也处理_getCpu/LoadAlert,因为他们的调用略有不同,保留了
        get_color_list = ['_glancesScreen__get' + m + 'Color' for m in base_type]
        get_color_list2 = ['_glancesScreen__get' + m + 'Color2' for m in base_type]
                                                                               
        if name in get_alert_list:                                             
            return partial(self.getAlert, name[19:-5].upper())                 
        elif name in get_color_list:                                           
            return partial(self.getColor, name[19:-5])                         
        elif name in get_color_list2:                                          
            return partial(self.getColor2, name[19:-6])                        
                                                                               
    def getColor(self, type, *args, **kwargs):                                 
        """                                                                    
        default: current=0, max=100, stat='', core=1                           
        """                                                                    
        return self.__colors_list[getattr(                                     
            self, ''.join(['_glancesScreen__get', type, 'Alert']))(*args, **kwargs)]
                                                                               
    def getColor2(self, type, *args, **kwargs):                                
        """                                                                    
        default: current=0, max=100, stat='', core=1                           
        """                                                                    
        return self.__colors_list2[getattr(                                    
            self, ''.join(['_glancesScreen__get', type, 'Alert']))(*args, **kwargs)]

```

--- update 2013-08-10 ----- 

它已经接收了我的代码

1. 我在服务器用pip，安装的是1.6.1，而本地是1.7.1a，但是有一个功能hddtemp支持实在1.6.1之后添加的,我用本地使用-c连接远程服务器,本
地有-y选项，但是远程是没有的，按'h'就会报错,我修改了这个问题

####如何使用国际化

1. 它自带了这个脚本i18n-gen.sh

1. 我在我的gentoo和mac下都实验了,没有作用，难道是我理解有问题?

首先我先把本地的locale换成中文:

```
export LANG=zh_CN.UTF-8
```
后来我发现它使用国际化的原理是:

1. 在安装的时候将.mo文件一起拷贝到glances的安装目录下得share/locale/XX/LC_MESSAGES下(XX代表你的生成的国际化名字)
1. 它使用了这样的方法加载国际化

```
locale.setlocale(locale.LC_ALL, '')
gettext.install(__appname__)
```

但是没有去作用，因为没有找到.mo文件

我提了pull req, 这样修改(其实就是去目录下找到那个语言的.mo):

```
cur_dir = os.path.split(os.path.realpath(__file__))[0]
gettext.install(__appname__, '{0}/../share/locale'.format(cur_dir))
```

--- update 2013-08-10 -----

它没有采用我的方法而是比较复杂的实现了


我在想，难道以前得几种语言是可以实现的?其实原来的方式在程序目录下是可以的，但是setup.py install后目录结构变化了

####远程连接服务器

这是glances最大的一个特点，但是不能让谁都可以使用serverproxy链接查看你的状态吧?所以你需要指定-P选项，加一个随机密码(其实账号是glances，没有提供参数，在程序里面写死了)
