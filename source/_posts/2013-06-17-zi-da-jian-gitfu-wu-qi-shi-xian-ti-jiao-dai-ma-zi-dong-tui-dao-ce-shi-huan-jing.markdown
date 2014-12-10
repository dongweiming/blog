---
layout: post
title: "自搭建git服务器实现提交代码自动推到测试环境"
date: 2013-06-17 23:15
comments: true
categories: 
- git
tags:
- git hooks

---

####前言

假如公司有很多项目，很可能你要自建git服务器，然后有不同的分支管理各个项目。尤其是web开发，每次push不仅在测试环境需要pull代码，
可能还有nginx，uwsgi，supervisor等都需要重启。那么有没有什么办法让你在push代码的时候触发这一系列的重新部署呢？

####思路和例子

假设你的开发分支是feature_example_develop(你要是在master分支直接push也可以，呵呵)有A，B，C等等同事都会往这个分支提交东西
测试环境的IP为192.168.22.34

1. 在你的git版本库的hooks里面这些修改post-update(表示代码提交到版本库后触发)

```
#!/bin/sh
#
# An example hook script to prepare a packed repository for use over
# dumb transports.
#
# To enable this hook, rename this file to "post-update".

# 获取本次提交的分支名字
branch=$(git rev-parse --symbolic --abbrev-ref $1)
        
case "$branch" in
    feature_example_develop)
        echo This is a develop push
        # 远程执行测试环境下的sync_develop_code.sh脚本
        ssh dongwm@192.168.22.34  -p 9922 "source sync_develop_code.sh"
        ;;
    master)
        echo This is a master push
        ;;
    *)
        echo This is only some push ops.
        ;;
esac

exec git update-server-info
```

1. 测试环境的更新环境脚本 sync_develop_code.sh

```
#! /bin/bash
# 切换到git版本库目录下
cd /home/dongwm/test_develop
# '拉'下最新代码
git pull origin feature_example_develop
# 重启supervisor管理的进程
sudo supervisorctl -c /home/dongwm/test_develop/server/supervisor_develop.conf restart all
# 重启uwsgi
sudo /etc/init.d/uwsgi restart
```

####一个很重要的问题

post-update不会检查你的代码是不是有问题，当提交了错误的代码会造成测试环境问题
解决办法：修改update钩子-在提交前对你设置的操作的执行的$?做判断-非0就会拒绝你的提交，在这个时候你可以做pylint/coverage/nosetests等，下次我再说我做的这个工作
