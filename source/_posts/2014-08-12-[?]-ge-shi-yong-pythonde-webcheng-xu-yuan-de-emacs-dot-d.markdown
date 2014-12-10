---
layout: post
title: "一个使用python的web程序员的emacs.d"
date: 2014-08-12 06:49
comments: true
categories:
- emacs
tags:
- emacs

---

#### 前言

越来越多的人使用emacs作为开发工具. 甚至skype,gmail,豆瓣FM都能通过emacs.
作为一个产品开发,肯定使用很多插件,设置一些快捷键来提高开发效率.以前一直使用
[prelude](https://github.com/bbatsov/prelude),很久之后发现有以下问题:

1. 比如开启python语言支持需要在prelude-modules.el里面把python这样的注释去掉
2. 我不需要支持这么多的语言,也不需要那么多快捷键
3. aotupair实在太难用了
4. scss/css模式不好自定义缩进空格数, tab和空格混用. 不好定制
5. 看过源码后发现,其实很来很简单粗暴的事情弄得有点复杂了

我造了个轮子[.emacs.d](https://github.com/dongweiming/emacs.d),主要针对python和web开发

####Update

2014-09-28, 经过这一个月的继续研究,已经有了很大的改变

#### 项目目录结构

```
├── Cask ; 我使用[cask](https://github.com/cask/cask)做包管理工具
├── auto-insert ; 使用auto-insert设置新增elisp/python文件自动添加基于yasnippet的模板
│   ├── elisp-auto-insert
│   └── python-auto-insert
├── custom ; 自定义插件目录,你也可以把你写的程序放进来然后在init.el里面require
│   ├── flycheck.el ; 定制flycheck,让它在保存python程序时自动执行pep8和flake8,有问题的条目会打开新的buffer打印出来
│   └── py-autopep8.el ; 我自己实现了autopep8插件,保存时自动根据pep8标准处理文件
├── functions.el ; 用到的相关函数
├── helper.el ; 我自己写了个类似`C-h b`的介绍绑定的快捷键的预览表
├── hs-minor-mode-conf.el ; python函数/类折叠
├── init.el ; emacs启动的主程序
├── keys.el ; Key-chord配置,默认被注释了,因为它和我经常大片粘贴代码中代码重复造成很多麻烦
├── local-settings.el ; 本机的本地配置,比如用户名,单独的快捷键等
├── misc.el ; 对emacs本身的一些配置
├── mode-mappings.el ; 模式映射,比如Cask会自动用emacs-lisp-mode
├── modeline.el ; 我重新定制了modeline，使用了nyan-mode和powerline,一些加颜色的hack
├── osx.el ; Mac下的一些独立配置,为我的hhkb定制
├── smartparens-config.el ; 定制了smartparens配置
├── tmp
│   └── README.md
└── xiaoming-theme.el ; 我自己写了一个主题,好吧 我就是`小明`
```

#### 使用的插件列表

1. f - 处理文件相关的库
2. s - 处理字符串相关的库
3. ag - 据说比ack更快的文本搜索工具`the_silver_searcher`的emacs插件
4. ht - 处理哈希相关的库
6. anzu - 显示当前匹配文本，预览替换效果和总匹配数的插件
7. dash - 常用函数集合
8. helm - 方便查找各种文件内容,buffer切换,emacs命令执行等
9. jedi - python代码补全，快速需要函数/模块定义的插件
10. smex - M-x 的命令行补全的功能
11. direx - 展示目录树
12. magit - git插件
13. slime - commonlisp交互模式
14. ac-js2 - js2-mode支持js函数定义查找
15. rinari - 依赖,需要安装
16. diff-hl - 在行首用颜色表示git状态-只支持图形界面的emacs
17. dired-k - 用带不同颜色的高亮显示文件/目录,大小等信息
18. bind-key - 本项目绑定快捷键的用法都根据这个包,没有用global-set-key
19. css-mode - css-mode
20. js2-mode - js-mode的升级版
21. web-mode - 前端开发必备, html缩进,支持根据tag/元素/属性/block/dom跳转,语法高亮,支持mako,jinja2等模板
22. git-blame - git-blame,单独版
23. key-chord - 可以快速按键达到快捷键的作用
24. nyan-mode - 一直可爱的小猫
25. plim-mode - 我写的编辑plim的major-mode
26. powerline - 提供一个漂亮的状态栏
27. sass-mode - 编辑sass
28. scss-mode - 编辑scss
29. sublimity - 在图形界面的emacs能缩小预览代码-sublime-text有类似的插件
30. undo-tree - 让undo可视化
31. yaml-mode - 编辑yaml
32. yasnippet - 一个神奇的模板系统,定义缩写并通过tab键自动帮你展开(一些自动的"填空题"机制)
33. drag-stuff - 可以将代码块整体拖动
34. helm-swoop - 项目内关键词查找,并能自动跳到对应文件和对应行
35. ibuffer-vc - 支持版本空的ibuffer模式
36. projectile - 管理项目，可快速访问项目里任何文件，支持全项目关键词搜索 
37. coffee-mode - 编辑coffee
38. python-mode - 编辑python
39. smartparens - 自动括号匹配,可以按块删除,tag跳转
40. use-package - 本项目引用包的方式
41. crontab-mode - 高亮编辑crontab
42. golden-ratio - 黄金分割展示当前window
43. helm-ipython - helm的ipython插件
44. rainbow-mode - 在代码中通过背景色标示颜色值
45. ace-jump-mode - 快速让光标位置到你想去的地方
46. expand-region - 按层次块区域选择
47. helm-css-scss - helm的css/scss插件
48. markdown-mode - 编辑markdown
49. switch-window - 可视化切换窗口
50. visual-regexp - 可视化正则匹配
51. gitconfig-mode - 单独的gitconfig-mode
52. gitignore-mode - 单独的gitignore-mode
53. helm-descbinds - 让默认的`C-h b`高亮并且按组分开
54. imenu-anywhere - 类似于etag, 可直接跳到对应的标签
55. multiple-cursors - 一次编辑多处/行文字
56. discover-my-major - 告诉你当前mode的一些说明/快捷键设置
57. virtualenvwrapper - virtualenvwrapper
58. gitattributes-mode - 独立的gitattributes-mode
59. rainbow-delimiters - 对内嵌的括号等pair符号加不同颜色  
60. idle-highlight-mode - 在设置的一段设置时间未操作电脑会自动高亮当前关键词,并且全文高亮相同关键词
61. exec-path-from-shell - 可以使用$PATH环境变量
62. find-file-in-repository - 根据git属性在项目里查找文件
63. emmet-mode - 类似于zencoding，但是能编辑css,使用很少的代码就能构造一个复杂的div/css
64. browse-kill-ring - 查看最近操作的删除文本,以及恢复后的效果

#### 安装使用

```
curl -fsSkL https://raw.github.com/cask/cask/master/go | python
git clone https://github.com/dongweiming/emacs.d .emacs.d
cd .emacs.d
cask
sudo pip install jedi pep8 autopep8 flake8
```

#### 快捷键分布

请参看项目的[README.md](https://github.com/dongweiming/emacs.d/blob/master/README.md)
