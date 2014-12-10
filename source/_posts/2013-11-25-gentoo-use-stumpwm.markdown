---
layout: post
title: "gentoo使用stumpwm做桌面管理器"
date: 2013-11-25 23:52
comments: true
categories:
- stumpwm
- commonlisp
tags:
- stumpwm

---

####前言

以前一直使用gentoo+gnome的方法使用,说实话,gentoo做个人桌面是在很一般, 尤其是跑起来
firefox, 虽然依然性能要比其他linux桌面发行版要好,可是我自己清楚.
尤其是gnome的很多功能对我个人完全没有用处,还浪费了内存. 最近神奇的同事@刘喆告诉我原来还有个神奇的
[stumpwm](git://github.com/sabetts/stumpwm.git), 基于common lisp的桌面管理.
我想很多人听过awesome,但是是lua的版本. 我当然希望用我熟悉的语言.这是一篇安装配置过程的博客

####安装遇到了一些问题

本来一般的软件都是包管理emerge stumpwm 就好啦,但是我安装后依然找不到stumpwm,
在手动编译stumpwm的过程发现很多奇葩报错. 所以连sbcl也编译了一个


#### 安装过程

```python
# 安装sbcl到/usr/local
wget http://downloads.sourceforge.net/project/sbcl/sbcl/1.1.13/sbcl-1.1.13-source.tar.bz2
tar jxvf sbcl-1.1.13-source.tar.bz2
cd sbcl-1.1.13
sh make.sh
unset SBCL_HOME
unset INSTALL_ROOT
sudo sh install.sh

#使用commonlisp的包管理工具quicklisp.lisp

curl -O http://beta.quicklisp.org/quicklisp.lisp
sbcl --load quicklisp.lisp
(quicklisp-quickstart:install)
(ql:add-to-init-file)
# 还需要以下2个依赖
(ql:quickload "clx")
(ql:quickload "cl-ppcre")

# 可选安装swank
(ql:quickload "swank")
(ql:quickload "quicklisp-slime-helper")

# 退出
(quit)

# 下载stumpwm

git clone git://git.savannah.nongnu.org/stumpwm.git
cd stumpwm && ./autogen.sh && ./configure && make
PS: 这个make时候就算报错,也没有太大关系

#生成2进制文件 再次进入sbcl交互模式

(asdf:oos 'asdf:load-op :stumpwm)
(sb-ext:save-lisp-and-die "stumpwm" :executable t
    :toplevel #'(lambda () (stumpwm:stumpwm ":0")))

# 拷贝文件到PATH

sudo cp -rp stumpwm /usr/bin/

# 设置启动 注意是你的普通用户

$ echo "exec stumpwm" >> ~/.xinitrc

# 这样你就可以使用startx启动啦

stumpwm的命令都是ctrl+t 开头的
```
