---
layout: post
title: "python几个特别的__开头的方法"
date: 2014-12-06 22:51
comments: true
categories:
- python
tags:
- python

---


#### 前言

[A Guide to Python's Magic Methods](http://www.rafekettler.com/magicmethods.html)python的绝大多数这样的特殊方法都
在这里面被提到了. 今天我来说3个他没有提到的[\_\_dir\_\_, \_\_slots\_\_, \_\_weakref\_\_], 再强调下他提到的2个[\_\_missing\_\_, \_\_contains\_\_]


##### \_\_dir\_\_ -> 看个小例子就知道了

```python
In [1]: class T(object):
   ...:     pass
   ...:
In [2]: t = T()
In [3]: t.<Tab>
啥也没有...
```

```python
In [4]: class T2(object):
   ...:     def __dir__(self):
   ...:         return ['a', 'b']
   ...:
In [5]: t = T2()
In [6]: t.
t.a  t.b
In [7]: dir(t)
Out[7]: ['a', 'b']
```

看出来了把, 不解释, 但是这个\_\_dir\_\_是相对于类的实例有效果的.

##### \_\_slots\_\_

这个在我初学python的时候就被模糊了, 原来的理解是它的出现替代了\_\_dict\_\_，也就是说你只能给\_\_slots\_\_
这个变量列表项的属性赋值. 对外的接口减少了,也安全了. 后来看了这篇[Saving 9 GB of RAM with Python’s __slots__](http://tech.oyster.com/save-ram-with-python-slots/).
好久不做运维了,在生产环境究竟怎么样我无法定论, <python cookbook>也提到了,在对象实例很多的时候他能帮助减少内存, 详见https://www.safaribooksonline.com/library/view/python-cookbook-3rd/9781449357337/ch08s04.html.
这里来个小实验(在Hacker News也被讨论过https://news.ycombinator.com/item?id=6750187)

代码例子(我对细节做注释):

```python
# coding=utf-8
import sys
from itertools import starmap, product


class SlotTest(object):
    # __slots__ = ['x', 'y', 'z'] 主要对比去掉这句和包含这句程序内存占用

    def __init__(self, x, y, z):
            self.x = x
                    self.y = y
                            self.z = z

    def __str__(self):
            return "{} {} {}".format(self.x, self.y, self.z)

p = product(range(10000), range(20), [4]) # 创建0-1000 & 0-20 & 4 的笛卡尔积
a = list(starmap(SlotTest, p)) # 相当于对每个SlotTest实例化,实例化的格式是p的长度

print a[0]
sys.stdin.read(1)
```

结果对比:

```bash
$pmap -x `ps -ef|grep test_slot.py|grep -v grep|awk '{print $2}'`|grep total # 未使用__slots__
  total kB          103496   76480   73728
$pmap -x `ps -ef|grep test_slot.py|grep -v grep|awk '{print $2}'`|grep total # 使用了__slots__
  total kB           49960   22888   20136
```

结果很明显,内存占用减少了很多...

##### \_\_weakref\_\_ 弱引用

首先先说下[weakref](http://zh.wikipedia.org/wiki/%E5%BC%B1%E5%BC%95%E7%94%A8): 弱引用，与强引用相对，是指不能确保其引用的对象不会被垃圾回收器回收的引用。一个对象若只被弱引用所引用，则被认为是不可访问（或弱可访问）的，并因此可能在任何时刻被回收.
在Python中,当一个对象的引用数目为0的时候，才会被从内存中回收. 但是被循环引用呢?

```python
In [1]: import weakref

In [2]: import gc

In [3]: class Obj(object):
   ...:     def a(self):
   ...:         return 1
   ...:
In [4]: obj = Obj()

In [5]: s = obj

In [6]: gc.collect() # 不可达引用对象的数量
Out[6]: 3

In [7]: print s is obj
True

In [8]: obj = 1 # 最初的被引用的对象改变了.

In [9]: gc.collect()
Out[9]: 0

In [10]: s is None # s还是指向了Obj 引用计数为1
Out[10]: False

In [11]: s
Out[11]: <__main__.Obj at 0x2b36510>

----华丽的分割一下

In [12]: obj = Obj()

In [13]: r = weakref.ref(obj) # 让obj变成那个弱引用

In [14]: gc.collect()
Out[14]: 211

In [15]: r() is obj
True

In [16]: obj = 1

In [17]: gc.collect()
Out[17]: 0

In [18]: r() is None # 弱引用计数器没有增加，所以当obj不在引用Obj的时候，Obj对象就被释放了
Out[18]: True
```

好吧, 我的总结是弱引用是个好东西, 但是加了\_\_slots\_\_就不支持弱引用了. 所以需要\_\_weakref\_\_

```python
In [9]: class T3(object):
   ...:     __slots__ = []
      ...:

In [10]: class T4(object):
   ....:     __slots__ = '__weakref__'  # 这样就支持了weakref
      ....:

In [11]:  import weakref

In [12]: t3 = T3()

In [13]: t4 = T4()

In [14]: weakref.ref(t3)
---------------------------------------------------------------------------
TypeError                                 Traceback (most recent call last)
<ipython-input-14-bdb7ab7ac3bc> in <module>()
----> 1 weakref.ref(t3)

TypeError: cannot create weak reference to 'T3' object

In [15]: weakref.ref(t4)
Out[15]: <weakref at 0x2766f70; to 'T4' at 0x2586fd8>
```

##### \_\_contains\_\_ 判断某值 in/not in 实例

```python
In [1]: class NewList(object):
   ...:     def __init(self, values):
   ...:         self.values = values
   ...:     def __contains__(self, value):
   ...:         return value in self.values
   ...:
In [2]: l = NewList([1, 2, 3, 4])

In [3]: 4 in l
Out[3]: True

In [4]: 10 in l
Out[4]: False
```

##### \_\_missing\_\_

最初看这个特殊方法是看python标准库的源码的时候(collections#L421):

```python
class Counter(dict):
    ...

    def __missing__(self, key):
        'The count of elements not in the Counter is zero.'
        # Needed so that self[missing_item] does not raise KeyError
        return 0
```

什么意思呢?

```python
In [6]: c = collections.Counter({'a':1})

In [7]: c['b'] # 没有键的count设置默认值0
Out[7]: 0

```

很多人可能看过这个(关于defaultdict的ppt)[http://discorporate.us/jek/talks/defaultdict/]. 内容就不说了, 讲的非常好.
