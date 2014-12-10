---
layout: post
title: "使用http和websocket连接服务器"
date: 2013-07-19 22:53
comments: true
categories: 
- github
- gevent
- flask
tags:
- wssh
- websocket
- gevent
- flask
- paramiko

---

####前言

想想吧，通过网页ssh登录服务器是一件多么酷的事情?今天看了[使用浏览器访问 Linux 终端](http://www.vpsee.com/2013/06/invoke-a-linux-shell-with-ssh-account-from-browser),
也就是这个[wssh](https://github.com/dongweiming/wssh),你也可以理解为websocket-ssh, 觉得有点意思就拿出来

####原路

它是一个库，很简单，作者写了2个flask+gevent+websocket+paramiko的例子，其中网页版的使用了bootstrap.
简单的理解就是不通过ssh连接服务器，而是通过网页或者一个client请求url+相应参数调用
shell到服务器的方式，但是遗憾的是作者一年没有再维护，bootstrap的网页竟然没有指定ssh端口的选项，但是很多时候为了安全
都会把ssh端口换成其它端口，这样就不能用了,好吧 我动手给它加了这个功能，也提了pull request.目前大家可以用我的这版:[wssh](https://github.com/dongweiming/wssh)

####**update**

wssh作者已经合并了我的修改

####使用说明

当你使用

```
sudo python setup.py install
```

安装后，就能直接使用wssh和wsshd,wsshd是一个flask作为httpserver和gevent作为wsgi的服务端，默认启动在你本机的5000端口.
网页登录就能看见简单大气的选项页面，可以指定用户，服务器ip，端口，以及使用密钥或者密码登录.输入点击连接就会登录到那台服务器,数据通过websocket实时显示到页面上


而wssh是一个命令行登录的带选项的命令，其实就是页面输入的参数通过命令行的方式输入然后直接登录服务器，比如我下面的用法:

```
wssh dongwm@dongwm.com -p XXX -s 58404
```

####我觉得有空可以基于这个做点好玩的东西
