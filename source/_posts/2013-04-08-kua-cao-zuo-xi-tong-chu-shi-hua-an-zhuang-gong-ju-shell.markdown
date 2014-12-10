---
layout: post
title: "跨操作系统初始化安装工具(laptop)"
date: 2013-04-08 18:07
comments: true
categories: 
- shell
- opensuse
- ubuntu
- gentoo
tags:
- shell
- bash
- ubuntu
- opensuse
- gentoo
- 初始化
---

####前言

上周看了[docopt](https://github.com/docopt/docopt), 感想很多。最近因为工作需要用opensuse，用ubuntu，个人pc用gentoo，
实在够折腾，每个系统都要相应的安装那些软件，搭建环境。早就想好好整理下思路，更geek的做这件事情。上段时间还看了个
[laptop](https://github.com/thoughtbot/laptop),觉得能力很一般，但是fork真不少。但是确实这个想法很不错，很有必要。
然后周末就构思了我的[laptop](https://github.com/orzrd/laptop.git)

####它的特性

* 记录操作记录，当某处出现故障，下次会从这个位置继续执行，而不需要全部执行一遍
* 受[docopt](https://github.com/docopt/docopt)启发，根据我特定的语法写配置文件，不需要修改初始化脚本initialize.sh
* 只需要添加你要安装的软件包的安装命令（使用包管理器的就需要修改相应操作系统的install文件）
* 支持对已安装软件的确认，不再安装而跳过
* 根据特定语法打印安装过程的提示
* 提供绿色，红色的asciilinux终端显示字体
* 执行在没有git等环境下git clone项目安装

####目前每个版本会安装那些软件？

* gcc|g++|automake
* tmux|htop|dstat
* ruby|python|python库|expect
* zsh|oh-my-zsh
* easy_install|pip
* django|torando|flask
* nginx|uwsgi
* redis|mongodb
* mit-scheme|commonlisp
* emacs
* gitflow
* celery
* colout
* MySQLdb|pymongo
* taglist
* gevent|twisted
* the_silver_searcher
* 检查vim是否自带python/ruby支持，否则下载编译一个执行的版本
* 我的常用脚本[mytools](https://github.com/orzrd/mytools.github),目前包含一个expect脚本和orzdba
* 我的[dotfiles](https://github.com/dongweiming/dotfiles.git)

gentoo系统一些软件
-----------------

* gentoolkit|module-rebuild|genlop|eix|euses|elogv
* fcitx
* iproute2|netkit-telnetd

####使用方法

1. 有git的情况：

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_bash">
shell>git clone https://github.com/orzrd/laptop
shell>cd laptop
shell>bash initialize.sh
</pre></figure></notextile></div>

2. 没有git的情况：

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_bash">
shell>bash <(curl -s https://raw.github.com/orzrd/laptop/master/setup_laptop)
</pre></figure></notextile></div> 

#####脚本语法

可操作文件
-------

1. common.install: 用户自定义的软件安装脚本，推荐非操作系统包管理器的都放在这里，注意逻辑顺序
2. opensuse/ubuntu/gentoo.install: 相应系统的安装脚本，这个只需要修改，我的脚本会自动根据系统信息找到
3. initialize.sh： 假如你想把需要我的安装方法，添加功能等，修改他，他是主入口
4. setup_laptop： 当用户没有git环境不能git clone  直接远程curl我，主要是下载git，clone我的laptop


1. '#'  以'#'开头的行表示这个信息会被安装过程以绿色字体打印，提示一下你要安装的东西等
2. ： 以':'开头的行，表示后面的字符串是个命令，也就是检查这个软件包有没有被安装需要的，假如which找到了路径说明被安装
3. ; 以';'开头的行为注释
4. 其它行就是要执行的语句，请不要当作shell注释等，因为他会把你写的东西当成要执行的命令

TODO
---

* 文件下载后就不需要再下载而直接使用
* 在执行某软件的安装过程中其他进程继续下载其他软件包（也就是实现shell版本的emerge）
* 进度条或者python_koans的提示已完成/剩余，更多的异常处理等
* 更多的异常处理
* 打印彩色字体内容嵌其他颜色字体（比如提示出错，高亮错误的原因或者软件包）

注意我的项目地址，欢迎各种fork，pull request，issue
---

###https://github.com/orzrd/laptop


