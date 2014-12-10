---
layout: post
title: "gentle - 帮助你快速部署代码到测试环境"
date: 2013-12-02 21:58
comments: true
categories:
- gentle
- fabric
tags:
- gentle
- fabric
- docopt

---


####前言

我想很多开发的同学都经历过这样的开发流程:

- 本地修改代码
- 把代码推到测试环境
- 重启测试环境需要的服务
- 本地看效果,改bug重复1-3
- 功能稳定后上线

这个过程有什问题呢?

- 假设你是一个做过运维或者能力很强的人,比如我这种,本地跑测试环境,但是假如一个新人,或者对测试环境中的某些
部分不是很了解的人, 甚至需要和生产环境完全一样的条件下, 本地可能就不好使了. 那么这需要一个测试服务器

- 首先你每次修改代码, push ,重启环境都需要你登陆测试环境,至少不够自动化.然后退回本地看效果,这个过程有点浪费时间和经理
- 其次是你可能有好几个项目,他们之间可能都没什么共通点. 你需要多个测试环境
- 当然你可以写几个脚本,为你每个测试环境写一个东西去自动化这些，未尝不可. 只是需要重复造很多轮子
- 假如为了安全有跳板机,你需要登陆跳板机才能跳到你的测试服务器,你可能要写很复杂的expect脚本

然后是我认为最重要的:

**凡是屁大点事就放个deamon的运维都是耍流氓, 就拿小屁几台服务器还搞神马salt, ansible之类的事情,真是太无聊了.**

这些东西帮助你做了很多事情,但是会让你变得更懒.而且重要的是-它们写的并不一定只符合你的需要或者就不符合你的需要. 我喜欢简单粗暴的实现,最近在看[fabric](https://github.com/fabric/fabric)的代码, 作为做过op,也给[salt](https://github.com/saltstack/salt)贡献过代码的我,写了这个东西: [gentle](https://github.com/dongweiming/gentle), 帮助我自动化提交代码到我的测试环境. 这个东西是我认为符合我需要，或者大部分开发同学需要的小东西,基于fabric, [docopt](https://github.com/docopt/docopt) 和yaml.


####我的工作的一些特点

我负责几个项目, 它们有以下特点

- 项目在不同的机房, 有完整的测试环境和相关数据
- 项目依赖的服务基本不同,比如有的使用了supervisor, 有的是程序fork后退出了父进程;有的使用了nginx+uwsgi,有的就是nginx+服务等.
- 项目之间需要的依赖应用不同,且启动顺序有区别. 这个很好理解, 启动需要先启动A,再启动B,才能启动C
- 项目有的需要登陆跳板机

####我以前的个人的开发习惯和流程

- 我有一个专门的存放服务配置的目录, 后缀是ip或者项目的名字. git版本库, 每次更新后上传到测试环境
- 我有专门的op PATH, 做了很多alias, 都是一些python或者shell的脚本,用来同步测试环境,登陆测试环境撑起服务的脚本

看起来以前用的也不错. 但是gentle能怎么样提高呢?

####gentle的开发流程

- 切换到你要开发的目录
- 初始化这个目录,其实就是在当前目录增加一个.gentle.yaml
- 根据你的需要配置测试环境账号ip密码, 想要同步的目录, 需要重启的服务和优先级已经命令
- 以后每次只需在这个目录下,使用`gt publish` 或者更懒 `gt p`, 他就会帮你自动rsync然后重启相关服务.

具体使用可以去我的github或者[readthedocs.org](http://gentle.readthedocs.org/en/latest/)

####安装和依赖

我已经放到了pypi, 你可以使用pip或者easy_install

```python
sudo pip install gentle
```

这样在系统环境下会有一个`gt`命令

fabric有2个对于项目更新的函数,一个是rsync_project,一个是upload_project, upload是把项目压缩在服务器上解压缩,实际上很浪费时间,但是rsync_project不能使用env.password,需要手动输入一次密码,都很不爽,我找到一个解决办法就是`sshpass`, 帮助自动输入rsync的密码, 我也给fabric提了PR. 我的项目使用了我个人的改进版的rsync_project

如果你是ubuntu 直接:

```
sudo apt-get install sshpass
```

其他操作系统可以在这里下载 http://sourceforge.net/projects/sshpass/ 然后编译

```
tar zxvf sshpass-1.05.tar.gz && cd sshpass-1.05 && ./configure &&
make && sudo make install
```

####一个我的测试环境的例子, 我加注释说明

```python
host: 192.168.3.11 #测试服务器, 格式是user@host:port
password: dongwmspassword #登录服务器需要的密码
gateway: #可以不存在,中间服务器,格式是user@host:port
gatewaypassword: #中间服务器(jump跳板机)的密码
rsync: #这个操作是rsync
  lpath: $ROOT #你可以使用全路径, $ROOT表示当前路径,本地目录
  rpath: /opt/tornado # 测试环境的目录
services: # 每个段落就是一个服务,这里有nginx和supervisor
  nginx:
    command: kill -9 `ps -ef |grep nginx|grep -v grep|awk '{print $2}'` && /opt/nginx/sbin/nginx #启动的命令
    lpath: /usr/local/etc/nginx/nginx.conf #nginx.conf的本地地址
    priority: 1 #优先级越高越先执行
    rpath: /opt/nginx/conf/nginx.conf #测试环境的nginx.conf路径
    sudo: false # 因为这个环境很宽松 不需要sudo
    user: #sudo使用的用户,默认是登陆的用户
  supervisor:
    command: supervisorctl -c /etc/supervisor/supervisord.conf reload
    lpath: /Users/dongwm/settings/supervisord.conf.31
    priority: 2
    rpath: /etc/supervisor/supervisord.conf
    sudo: false
    user:
username: root #登陆服务器的默认用户, 你可以在使用host的时候指定用户
```

####欢迎给我issue和PR

####TODO

- 因为很多人会用到跳板机,我想加入跳板机的用法, 看起来就像直接在本地操作远程一样 # 更新2013-12-03 完成
- 设置输出是否隐藏,目前保留就是为了让我看到执行的过程
- 设置支持多测试环境一起部署,或者说让生成环境的部署一样方便
