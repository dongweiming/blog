---
layout: post
title: "vary.vim-自动去掉行尾空格"
date: 2013-09-08 21:03
comments: true
categories:
- vim
tags:
- vary.vim

---

####前言

一直想改成emacs无奈工作需要效率，所以vim还没有完全放弃. 我想做python的同学很可能有我一样的困扰:

1. 在维护别人的代码的时候发现有很多tab和空格混用或者行尾空格没有删除

我以前可能没有注意这个问题，就是自觉的使用ed模式: :%s/\s\+$//g和:retab，最近老大的一句话提醒
了我:他问我是否vim可以配置成自动模式? 以我对vim的了解它肯定不会介入个人的编辑,那么可能就要使用hook的方法.

这也就是我的[vary.vim](https://github.com/dongweiming/vary.vim)的原理:当保存文件的时候(:w)自动执行命令.
其实我想你可能会问，为啥是我保存的时候而不是打开的时候呢?额 下面会讲到

####安装配置请看项目的README

安装后就算不配置默认只对python语言生效-团队和语言风格不同


####修改我的vim插件

我一直在想究竟哪种方式更合理(打开文件就修改还是保存的时候再修改),我默认是保存，但是其实你可以修改我的autocmd命令为:

```bash
autocmd BufReadPost * :call StripTrailingWhite()
autocmd BufReadPost * :call RetabIndents()
```

表示打开文件之前就修改，把修改后的结果呈现给你
