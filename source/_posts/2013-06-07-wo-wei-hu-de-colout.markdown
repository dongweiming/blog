---
layout: post
title: "我维护的colout"
date: 2013-06-07 23:14
comments: true
categories: 
- python
tags:
- colout

---

####前言

一直在努力进步，其实也在想做点项目，也作了一些东西，最近的计划就是看[celery](https://github.com/celery/celery),[pelican](https://github.com/getpelican/pelican),然后开始看django，看[requests](https://github.com/kennethreitz/requests), 其实任务还是很重的。
上段时间github转悠，发现一个挺有意思的东西[colout](https://github.com/nojhan/colout)：一个python的命令行显示彩色字符的软件，支持正则，支持各种语法的插件，但是作者呢..怎么说呢 也算是我为了练手,给他维护这个项目,

####我维护的内容

正如我给它修改的README

```
Pypi(the Python Package Index)

    sudo pip install colout

or

    sudo easy_install colout

Ubuntu 13.04's ppa

    sudo add-apt-repository ppa:ciici123/colout
    sudo apt-get update
    sudo apt-get/aptitude install colout

Gentoo overlay

    1. Install layman
    
    echo "app-portage/layman git" >> $EPREFIX/etc/portage/package.Use
    sudo emerge layman
    
    2. Edit `$EPREFIX/etc/layman/layman.cfg`. Add a line after
    
    overlays   : http://www.gentoo.org/proj/en/overlays/repositories.xml
    
    so that it becomes
    
    overlays   : http://www.gentoo.org/proj/en/overlays/repositories.xml
                 file://$EPREFIX/var/lib/layman/my-list.xml

    3. Edit `$EPREFIX/var/lib/layman/my-list.xml`.  The content of this file should be:
    
    <?xml version="1.0" ?>
    <repositories version="1.0">
    <repo priority="50" quality="experimental" status="unofficial">
        <name>dongwm-overlay</name>
        <description>dongweiming's gentoo overlay</description>
        <homepage>https://github.com/dongweiming/dongwm-overlay.git</homepage>
        <owner>
            <email>ciici1234@hotmail.com</email>
        </owner>
        <source type="git">git://github.com/dongweiming/dongwm-overlay.git</source>
    </repo>
    </repositories>

    4. Add this overlay and installation
    
    layman -a dongwm-overlay && sudo emerge colout
```

其实现在已经放到了gentoo的portage主干，你可以直接安装

```
sudo emerge colout
```

####也就是说我维护了pypi，ubuntu's ppa和gentoo

这个经验讲起来，很多很多，时间有点长了...

* pypi

我这部分源码是从作者项目拿下来的分支[colout](https://github.com/dongweiming/colout), 里面加了一些必要的东西，还有setup.py的格式
其中的'classifiers'是从官网文档分析的[classifiers](https://pypi.python.org/pypi?:action=list_classifiers), 而且要注意的是,根据
最近的[PEP438](http://www.python.org/dev/peps/pep-0438/), 以后的pypi不要容许来自外部软件的网站连接，直接使用pypi的地址已加快速度

#####流程

1. 注册pypi,你可以去网站 也可以python setup.py register
1. 添加相关文件和setup.py
1. python setup.py sdist upload  #上传到pypi

技巧:

你可以写.pypirc配置文件就不用每次输入帐号密码了

```
[distutils]
index-servers = pypi

[pypi]
username:xxx
password:xxx
```

表示构建dist包后并且上传，当然你还能再加'bdist_egg' 构建eggs

* gentoo 本来就是我的一个layman,但是看来gentoo的开发者也挺喜欢这个小玩意，后来把它放在了主干

流程:

1. 写ebuild脚本 请参看我的[overlay for Gentoo](https://github.com/dongweiming/dongwm-overlay)
1. 假如你想用第三方的overlay，上面README有安装方法，假如你想放到gentoo主干，继续...
1. 建立一个Bugzilla帐号
1. 创建一个bug，填写表单，附件加入你写的那个ebuild脚本，看我的例子[app-misc/colout - a simple command to add colors to a text stream in your terminal](https://bugs.gentoo.org/show_bug.cgi?id=469562)

技巧:

* ubuntu ppa 是最闹残，最无奈的，源文件在我虚拟机里面，有时间我再补
