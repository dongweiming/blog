---
layout: post
title: "搜集系统信息的dashboard"
date: 2014-02-09 22:21
comments: true
categories:
-  django-linux-dash
tags:
- django-linux-dash

---


#### 前言

过年在家无聊, 发现个挺有意思的项目: [linux-dash](https://github.com/afaqurk/linux-dash),就是使用Twitter的Bootstrap做的管理模板,可以显示服务器信息, 负载, 内存,进程,硬盘,用户,安装/未安装的软件信息,网卡IP,网速,以及网络状态,在线用户等. 但是有2个问题:

1. 它是php的...
2. 它获取信息都是通过shell下得系统命令

我就用django写了一个python版的[django-linux-dash](https://github.com/dongweiming/django-linux-dash):本来想用flask,结果被人用了,但是问题也是通过subprocess调用命令获取数据,这个轮子有以下优点:

1. 不仅支持linux,也支持OS X
2. 使用[psutil](http://code.google.com/p/psutil/), 项目完全不调用shell命令

#### 安装和使用

需要django>=1.4以及psutils模块

```
$pip install/easy_install django
$pip install/easy_install psutil
```

PS: OS X 还需要[netifaces](https://pypi.python.org/pypi/netifaces)模块用于获取网卡ip

```
$pip install/easy_install netifaces
```

启动:

```
$cd /You/install/path
$git clone https://github.com/dongweiming/django-linux-dash && cd django-linux-dash
$python manage.py runserver 0.0.0.0:8000
```

打开浏览器输入 http://localhost:8000 就可以看见了...

TODO:

1. 目前还没有添加测速功能,因为我希望不要一直傻瓜式的下载某文件,根据用时计算平均值,因为第一它需要时间才会显示个速度,其次是不实时不能循环实时
2. 添加更多信息模块
3. 增加用户登陆和权限控制
...
