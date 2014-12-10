---
layout: post
title: "分享一个准备给公司讲python高级编程的slide"
date: 2014-04-04 11:07
comments: true
categories:
- python
tags:
- python

---


#### 前言

我以前在学习python模块的时候,曾经翻译[pymotw](http://pymotw.com/2/py-modindex.html#)的文章,其实还是有抄袭的嫌疑,从最近开始逐渐直接阅读python标准库源码, 收获颇多. 我现在不愿意教一些从网上或者书里提到的知识点,而更愿意根据我工作中常见的需求去挖掘对应的python的解法.也是在过程中对一些东西有了比较深的理解. 这个ppt是从[像黑客一样使用 Linux 命令行](https://linuxtoy.org/archives/using-cli-like-a-hacker.html)获得的灵感. 然后角度为<python高级编程>, 还用到了webfonts娃娃体^.^

![](https://dl.dropboxusercontent.com/u/95512723/images/expert_python.png)

PS: 特别推荐github上看到的"雨痕"的[学习笔记](https://github.com/qyuhen/book). 建议大家都好好看看.


#### 找到它

[Expert-Python](http://dongweiming.github.io/Expert-Python)
或者直接下载代码: [github](https://github.com/dongweiming/Expert-Python)

但是注意我的字体内嵌项目里面, 请注意流量,避免移动设备直接访问或者强制刷新

##### UPDATE: 2015-02-02

我已经把视频放到youtube上了: https://www.youtube.com/watch?v=bf5qpFFxo9g 大家可以选择在线看

#### 目录

1. XX不理解python竟然没有end....
1. 设置全局变量
1. 字符串格式化
1. 操作列表
1. 操作字典
1. 字典视图
1. vars
1. from __future__ import unicode_literals
1. from __future__ import absolute_import
1. 不是支持了绝对引入,而是拒绝隐式引入
1. 我靠,我的需求呢? -- 在很多开源项目是拒绝你第一次的隐式用法的,
1. 一个关于编码的问题
1. 原因是: encoding_example里面没有对文字自动转化为unicode,默认是ascii编码
1. super 当子类调用父类属性时一般的做法是这样
1. super的一种用法
1. 假如不用super会这么惨
1. 手写一个迭代器
1. 标准迭代器
1. 生成器
1. 斐波那契数列
1. 其实yield和协程关系很密切
1. 来个回调(阻塞的)
1. 来个回调(异步的)
1. 看到这里, 就得说说contextmanager
1. 包导入
1. 包构建\_\_all\_\_
1. 包构建\_\_path\_\_
1. 静态方法和类方法的区别
1. 静态方法和类方法的区别其实是在这里
1. \_\_slots\_\_
1. Packaging Tools的未来
1. wheel(即将替代Eggs的二进制包格式)的优点
1. 装饰器
1. 给函数的类装饰器
1. 给类的函数装饰器
1. 带参数的装饰器
1. @property
1. @property的另外使用方法
1. 元类是什么
1. 模拟生成一个类
1. 元类: \_\_metaclass\_\_(实现前面的Hello类)
1. 一个难懂的元类
1. 描述符
1. 模块: itertools
1. 模块: collections(一)
1. 模块: collections(二)
1. 模块: collections(三)
1. 模块: collections(四)
1. operator模块(一)
1. operator模块(二)
1. operator模块(三)
1. functools模块之partial
1. functools模块之wraps
1. functools模块之cmp_to_key
1. functools模块之total_ordering
1. 开发陷阱(一) 可变默认参数
1. 开发陷阱(二) 闭包变量绑定
1. 开发陷阱(二) 闭包应该的用法
1. 在合适的地方用合适的技巧
1. 不是它不好,而是你没有用好
1. ipython的技巧(一)
1. ipython的技巧(二)
1. 联系方式

#### UPDATE 2014.04.11

今天下午分享了这个ppt. 并且用quicktime录像. 想听的可以从[百度网盘](http://pan.baidu.com/s/1bnnaJaZ)下载或者在线看(793.6M). 时长2小时零一分.

中间有个列表去重. 有同学说去重后无法保证第一次出现重复数据位置的顺序.

刚才想起来试了一下:

```python
>>> l = [1, 2, 4, 7, 2, 1, 8, 6, 1]
    >>> list(set(l))
    [1, 2, 4, 6, 7, 8]
    >>> {}.fromkeys(l).keys()
    [1, 2, 4, 6, 7, 8]  # 注意这个和上面结果是一样的,也就是内部实现的去重原理相同
    >>> l = ['a', 'b', 'c', 'd', 'b', 'a']
    >>> list(set(l))
    ['a', 'c', 'b', 'd']
    >>> {}.fromkeys(l).keys()
    ['a', 'c', 'b', 'd']
    >>> from collections import OrderedDict
    >>> OrderedDict().fromkeys(l).keys()  # 只能使用这样的方法实现保证顺序的实现
    [1, 2, 4, 7, 8, 6]                                 # 感谢@杨博的提醒
```
新的PYPI的DEMO: [http://pypi-preview.a.ssl.fastly.net](http://pypi-preview.a.ssl.fastly.net)
