---
layout: post
title: "怎样不退出交互模式自动reload模块"
date: 2013-05-24 11:54
comments: true
categories: 
- python
- ipython
- bpython
- django-extensions
- django shell
tags:
- python
- ipython
- bpython
- django-extensions
- django shell

---


####*前言*

我想做python开发的人尤其是django开发都会有一种经历:进入python交互模式(直接 执行python回车)或者进入django-shell调试某功能，然后修改源码，退出交互模式或者djangoshell，重新进入在吧那些模块一一import... 问题是什么呢？浪费时间，为啥不像web 框架那样修改源码自动reload？ 

本来我花了2个多礼拜一直在做这件事情，其实原理就是封装ipython到我的shell，然后在我的shell加这个autoreload功能，但是昨晚看ipython源码发现：ipython早已经实现了...

我的系统的实现的源码文件是 /usr/lib64/python2.7/site-packages/IPython/Extensions/ipy_autoreload.py


####在ipython交互模式实现

和ipython版本有关，大于0.11 这样加载

```
%load_ext autoreload
%autoreload 2
```
小于0.11的就要这样加载
```
import ipy_autoreload
%autoreload 2
```

####ipython交互模式自动加载 

你总不像每次进入ipython都执行这么2句吧, 那么可以加到ipython的自定义配置里面.因操作系统和ipython版本不同，ipython的用户自定义目录有所不同，增加的配置也 有所不同

首先创建ipython个人配置 

```
ipython profile create
```

gentoo ~/.ipython  ipython :0.10.2 

配置文件是.ipython/ipy_user_conf.py 添加

```
import ipy_autoreload
o.autoexec.append('%autoreload 2')

```

opensuse ~/.config/ipython  :0.13

配置文件是~/.config/ipython/profile_default/ipython_config.py

```
c.InteractiveShellApp.exec_lines.append('%load_ext autoreload')
c.InteractiveShellApp.exec_lines.append('%autoreload 2')
```

####Django shell的实现

遗憾的是改django源码中的core/management/commands/shell.py,没有提供自动reload,但是当你修改了ipython配置 他也是会起作用(这个操作系统有关，下面我会说不起作用的geek方法)

PS： 你还可以使用[django-extensions](https://github.com/dongweiming/django-extensions)中的shell_plus.py

####当你系统有ipython,bpython和默认的python，django shell选择的顺序

* 当你系统没有ipython和bpython，那么就会选择默认的python

* 上面说的shell_plus的遍历列表顺序是bpython->ipython  

* django自带的shell的遍历顺序是ipython->bpython

上面说djangoshell不起作用怎么办？首先看了django/ipython源码(0.13.2)，其实djangoshell甚至django-extensions里面的shell_plus都没有问题，关键是ipython的问题

我只说在用户配置里面的外部模块为啥没有正确执行

ipython进入交互模式的流程

1. 当调用ipython，都是通过IPython.frontend.terminal.ipapp的launch_new_instance函数开始
2. 通过IPython.core.shellapp的InteractiveShellApp类里面的init_code方法去初始化启动后的加载
3. 在init_code方法会执行self._run_exec_lines(),这个就是上面的模块导入执行

djangoshell进入交互模式的流程

1. 通过IPython.frontend.terminal.embed的TerminalInteractiveShell类开始
2. 在TerminalInteractiveShell初始化中,没有执行上面的第三条

解决办法就是暴力修改IPython/frontend/terminal/interactiveshell.py源码 给他加上模块初始化的操作

在326行开始的地方，这样添加一段(包含存在的代码帮你你理解在什么位置添加代码,也就是下面的3-8行)

```
self.init_usage(usage)                                                 
self.init_banner(banner1, banner2, display_banner) 
exex_lines = self.config['InteractiveShellApp']['exec_lines']          
for line in exex_lines:                                                
    try:                                                                        
        self.run_cell(line, store_history=False)                       
    except:                                                                     
        pass
#-------------------------------------------------------------------------          
# Overrides of init stages                                                          
#-------------------------------------------------------------------------
```


