---
layout: post
title: "gentoo下的lxc和docker"
date: 2013-07-13 20:03
comments: true
categories: 
- lxc
tags:
- docker
- lxc

---


####前言

上次就说要写一篇gentoo下安装使用docker的文章，顺便也学习了下gentoo下的lxc，记录下来

####升级你的内核

docker要求升级到3.8以上的内核,假如你的已经是3.8.XX,那么你就要重新编译内核,参看[Wiki](http://wiki.gentoo.org/wiki/LXC)
很多人比较怕编译内核，一看那个启动的简陋的页面就不知道该干什么了,出现问题不知道该去选择什么或者去掉什么选项.我来说一些小窍门,简单的说就是
根据提示去内核界面按'/'搜索这个参数，根据提示的位置找到那个项

问题1: 假如符合项很多怎么判断那个是真正要我选择的呢?

回答: 首先是上下文的判断，一般的情况都是符合某写关键字的项都是某项和它的子项，当你去掉其父项，子项的选项也就消失了，还有个使用的经验的积累.
比如下面的提示:

```
*   CONFIG_NETFILTER_XT_MATCH_ADDRTYPE:  is not set when it should be.
```

意思就是提示你"NETFILTER_XT_MATCH_ADDRTYPE", 没有设置，然后你使用/输入"NETFILTER_XT_MATCH_ADDRTYPE",回车，会显示类似下面的东西:

```
 Search Results ─────────────────────────────┐
  │ Symbol: NETFILTER_XT_MATCH_ADDRTYPE [=n]                                │  
  │ Type  : tristate                                                        │  
  │ Prompt: "addrtype" address type match support                           │  
  │   Defined at net/netfilter/Kconfig:798                                  │  
  │   Depends on: NET [=y] && INET [=y] && NETFILTER [=y] && NETFILTER_XTAB │  
  │   Location:                                                             │  
  │     -> Networking support (NET [=y])                                    │  
  │       -> Networking options                                             │  
  │         -> Network packet filtering framework (Netfilter) (NETFILTER [= │  
  │           -> Core Netfilter Configuration                               │  
  │ (1)         -> Netfilter Xtables support (required for ip_tables) (NETF │ 
```

注意其中的'Prompt',他是帮助你在实际找对应项判断主题的关键字,'Location'告诉你它的位置是
'Networking support'下的'Networking options'子项下的'Network packet filtering framework'...

问题2： 为什么我选择了这个项依然还是没有显示成功，比如上面'NETFILTER_XT_MATCH_ADDRTYPE [=n]' n就是no，y就是yes
一个严重的问题就是某项其实会有很多依赖，只有这些依赖都是'y'的时候它才生效.比如lxc要求的'USER_NS',
默认内核中是没有显示出来的,原因是存在很多依赖和他冲突，必须去掉那些项他才会显示, 你打开它的搜索去看还有那个依赖还是'n'.
这个过程可能好几次，直到最后，就显示了UIDGID_CONVERTED的bool值为n，这个时候你就要去看这个内核参数的依赖,打开/usr/src/linux/init/Kconfig,
找到依赖挨个去掉，直到能显示


####安装docker

[tianon](https://github.com/tianon/gentoo-overlay)做好了一个docker的overlay源，而且docker的gentoo镜像也是他贡献的，感谢.
把三方layman增加到你的gentoo系统在以前的[我维护的colout](http://www.dongwm.com/archives/wo-wei-hu-de-colout)说过就不说了,假设这里你已经添加了tianon的源

然后安装

```
sudo emerge app-emulation/lxc-docker
```

这个依赖过程当然也会安装lxc

因为docker依赖aufs,但是安装aufs的时候出现问题，我还记得一句:

```
You need to apply a patch to your kernel to compile and run the aufs3 module
```

然后就异常退出了,看了下源码也的确有这些patch,当我手动打了第一个patch,依然报错...只能一个个的补丁手动打进去？
看它的ebuild,有这样一行:

```
IUSE="debug doc fuse hfs inotify kernel-patch nfs pax_kernel ramfs"
```

可是kernel-patch没有起作用,那么你在你的/etc/make.conf的USE里面添加'kernel-patch'就好了

####增加docker0网卡
增加一个配置，这个配置也是创建容器可选的配置，都放在/etc/lxc目录下

cat /etc/lxc/guest.conf

```
lxc.network.type = veth
lxc.network.flags = up
lxc.network.link = docker0
```

####启动docker

```
docker -d &
```
当提示类似:

```
2013/07/13 13:36:46 Listening for HTTP on 127.0.0.1:4243 (tcp)
```

表示搞定了


但是我这里出现了一个报错

```
iptables v1.4.16.3: can't initialize iptables table `nat': Table does not exist (do you need to insmod?)
```

iptables的版本够高，但是很明显还是内核模块的问题，查看下,果然如此

```
localhost ~ # zgrep NF_NAT /proc/config.gz
# CONFIG_NF_NAT_IPV4 is not set
# CONFIG_NF_NAT_IPV6 is not set
```

还是需要设置在重新编译内核,重启生效


####使用lxc

比如我想创建个debian的容器

```
emerge dev-util/debootstrap #不同的系统依赖不同的这个包，比如fedora/centos就是sys-apps/yum, arch就是sys-apps/pacman...
lxc-create -t debian -n debian_test #也可以加-p 指定配置文件 ，配置类似上面的guest.conf，可以配置ip之类
# 假如想要ubuntu
# lxc-create -t ubuntu -n ubuntu_test

```
这个时间会下载debian的基础镜像，包含一些基础的包

你要设置root密码,比如我这个debian_test， 相关数据都在/etc/lxc/debian_test

```
cd /etc/lxc/debian_test
chroot rootfs /bin/bash
```

然后登录设置密码

启动和关闭容器的命令是 

```
lxc-start -n debian_test
lxc-stop -n debian_test
```

当然你也可以设置个开机启动

```
ln -s lxc /etc/init.d/lxc.debian_test
/etc/init.d/lxc.debian_test stop
/etc/init.d/lxc.debian_test start
rc-update add lxc.debian_test default
```

还可以使用终端连接

```
lxc-console -n debian_test
```

####创建gentoo容器

当我想创建gentoo的容器,可以借用[lxc-gentoo](https://github.com/globalcitizen/lxc-gentoo),它提供一个命令行的选择.简单粗暴，以下是一个例子
创建一个ip为192.168.0.10，网关为192.168.0.1，容器叫做gentoo_test，主机名为test1的容器

```
sudo lxc-gentoo/lxc-gentoo create -i 192.168.0.10/26 -g 192.168.0.1 -n gentoo_test -u test1 
```

默认会把容器安装在执行命令的当前目录,这样启动

```
sudo /usr/sbin/lxc-start -f test1.conf -n gentoo_test
```

你也可以chroot进去， 为什么这样用？比如我经常用到的场景，我安装了gentoo/opensuse的双系统，可能我把其中一个系统玩坏(比如升级产生的问题，我安装或者卸载了某些东西等)
，我就可以在没有u盘，livecd的前提下进入另外一个系统，chroot到这个系统去修复,而且不影响工作，因为我的很多目录之类都是软连接，修改一个地方切换另外的系统继续用

```
mount -t proc proc ./gentoo_test/proc
mount -o bind /dev ./gentoo_test/dev
chroot ./gentoo_test /bin/bash
export PS1="(gentoo_test) $PS1"
# 现在你就进来了,而不需要启动系统
```

####创建Archlinux容器

我没有用gentoo的lxc自带的/usr/share/lxc/templates/lxc-archlinux,因为它根本用不了,并且存在以下一些问题:

1. arch早已不用initscripts，改用systemd

1. 安装基础系统不需要chroot到其系统,直接pacman指定系统根目录即可,并且它chroot进去指定根系统,那肯定永远也成功不了

1. 在一个新的系统的pacman.conf没有指定XferCommand,那么也就不知道用什么下载了

我新建个一个项目[gentoo-lxc-templates](https://github.com/dongweiming/gentoo-lxc-templates),目前包含了我修改的lxc-archlinux,我很少用arch,有问题欢迎pullme

