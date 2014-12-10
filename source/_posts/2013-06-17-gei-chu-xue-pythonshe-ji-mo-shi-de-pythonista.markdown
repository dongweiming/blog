---
layout: post
title: "给初学python设计模式的pythonista"
date: 2013-06-17 22:16
comments: true
categories: 
- python
tags:
- Design Patterns

---

####前言

从2011年5月4日买了第一本《python学习手册》到现在，我学python已经2年多了，python也是我第一门除bash外的语言。
学'设计模式'这么神秘的东西还是源于去年一次面试，在我说了我想做某个东西，然后有什么思路后，面试官很不屑的问我：你知道设计模式嘛？
然后我就懵了-从来没听过。我特别赞赏提供良好扩展功能的项目，比如[Sublime Text2](http://www.sublimetext.com/2), 它提供第三方插件功能，你可以使用别人开发的插件，也可以自己写插件，让项目更好的维护和扩展而不需要动基础的代码。
后来换工作一直在熟悉业务，学一些东西。但是我一直记得这个'设计模式'，上个月花了一些时间去了解，所以有了此文，假如你也想了解'设计模式',也很怕它，你会python，希望本文带给你帮助

我也写了一组python设计模式的文章: [小明明s Github - 设计模式](http://dongweiming.github.io/category/she-ji-mo-shi.html)

####我的角度

GoF（“四人帮”，又称Gang of Four，即Erich Gamma, Richard Helm, Ralph Johnson & John Vlissides四人）的《设计模式》这本书我没看过，我也不怎么会java，看不懂例子.我没有受到其他语言的毒害(因为python是我一开始的语言)，我的角度应该是最靠近python

####什么是设计模式

设计模式其实是一些被很多人反复使用而总结出来的代码设计经验，这些技术被GOF在大概20年前编辑成《编程模式》，其实不要害怕，
因为**设计模式就在你写代码过程中已经体现了，被叫做'设计模式'只是被很好的总结出来**，

####python程序员的成长

* 当你初学python，可能还是翻阅手册或者去google出一些你想要问题的答案，而后举一反三修改它符合你想要的东西。那么这是阶段一：堆代码，这个时候主要是为了实现功能，不重视代码编码规范，代码运行效率，代码可读性等

* 用过一段时间python，你对python很熟悉了，可以copy代码写东西了。那么这是阶段二：码农初长成

* 我是这样的人：当一个类似的功能出现，我就想思考重构(重构这个词太大了，好吧，为了减少我的代码量);当经常出现某些相同的情况的过程，我就会思考更好的抽象出来;当项目大了，、
会思考如何在不改动或者少改动的前提下更好的扩展新功能。那么这是阶段三: 码农中的愤青 这里你会对自己有更高的要求，其实总结一些更好的表达和实现，就是设计模式了

* 埋头写代码毕竟进步有限，这个时候可能你会读一些好的开源代码，保存了很多别人的代码片段等，你会发现:哦，原来可以这么写.. 哇 这个实现好酷... 然后你会记下来，
等以后在合适的场景里面借用这些思想, 这是阶段四：在很多开源代码中会看见一些很好的设计模式的体现，就是这样看别人，然后理解吸收

####如何学习python的设计模式

github上面有2个这方面的项目: [python-patterns](https://github.com/faif/python-patterns)和[Design-Patterns-in-Python](https://github.com/gennad/Design-Patterns-in-Python), 但是都不怎么维护了
当然了，做广告,可以看我的GithubPages[小明明s Github - 设计模式](http://dongweiming.github.io/category/she-ji-mo-shi.html),都是我自己的理解，欢迎大家提意见

####python的设计模式

通过我学习和写这些模式的文章，我有很多感悟

* 对于python，装饰器模式其实都已经是内置代码级别;

* [flyweight模式](http://dongweiming.github.io/python-flyweight.html)原来还可以这样玩;

* [单例模式](http://dongweiming.github.io/python-singleton.html)已经落伍，完全可以被[borg模式](http://dongweiming.github.io/python-borg.html)取代

* [NUll模式](http://dongweiming.github.io/python-null.html)可以帮助你省去很多代码和异常处理

* [对象池模式](http://dongweiming.github.io/python-object-pool.html)是一个很实用的模式

* 终于理解游戏人物设计用到了[原型模式](http://dongweiming.github.io/python-pototype.html)

...

基本是学了每个模式都有很深的触动

####学习设计模式有没有必要

没有学习设计模式不会影响你写代码的水平，但是学习了会提高你的代码质量和拓宽你解决问题的思路


