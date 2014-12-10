---
layout: post
title: "udev升级的网卡重命名问题和解决"
date: 2013-04-27 15:32
comments: true
categories: 
- gentoo
- udev
tags:
- udev
---

####故障描述

最近终于更新了下gentoo，重启发现我的eth0网卡启动失败：

```
 * Bringing up interface eth0
 *   ERROR: interface eth0 does not exist
 *   Ensure that you have loaded the correct kernel module for your hardware
 * ERROR: net.eth0 failed to start
```
而启动某些我常用的服务，比如mongodb，也报错：

```
~ # /etc/init.d/mongodb restart
 * Bringing up interface eth0
 *   ERROR: interface eth0 does not exist
 *   Ensure that you have loaded the correct kernel module for your hardware
 * ERROR: net.eth0 failed to start
 * ERROR: cannot start mongodb as net.eth0 would not start
```

竟然也需要启动网卡？

######查看内核和dmesg：

查看内核模块已经选中，而且以前eth0也有，再看dmesg

```
dmesg |grep network 
[   74.261872] systemd-udevd[14259]: renamed network interface wlan0 to wlp2s0
[   74.391865] systemd-udevd[14259]: renamed network interface eth0 to enp0s4

```

原来被重命名了

####为什么？

从udev-197将自动分配更好的接口名字，具体解释请看[PredictableNetworkInterfaceNames]
(http://www.freedesktop.org/wiki/Software/systemd/PredictableNetworkInterfaceNames),

####解决办法，有三种

1. 临时办法，重启还是会失效

ifrename -i enp0s4 -n eth0 #修改网卡名字变成原来的eth0

2. 使用新的名字

```
rm /etc/init.d/net.eth0 #删除不存在的引用

localhost ~ # rc-update delete net.eth0 default #删除不存在的开机启动
 * service net.eth0 removed from runlevel default
localhost ~ # rc-update add net.enp0s4 default #使用新名字
```

3. 重置udev的rules，还是用原来的方法

```
ln -s /dev/null /etc/udev/rules.d/80-net-name-slot.rules
```

第二种，和第三种需要重启

####启动应用为什么也需要启动应该启动的网卡

查看/etc/init.d/mongodb脚本，发现是因为depend，一般的初始化脚本结构是

```
#!/sbin/runscript

depend() {
  （依赖关系信息）
}

start() {
  （启动服务所必需的命令）
}

stop() {
  （停止服务所必需的命令）
}

restart() {
  （重启服务所必需的命令）
}
```
比如 mongodb 的依赖是

```
depend() {
  need net #需要依赖net.X
}
```

下次我专门研究一篇gentoo初始化脚本的文章
