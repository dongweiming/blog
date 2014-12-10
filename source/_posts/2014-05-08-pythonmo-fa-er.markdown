---
layout: post
title: "python的魔法二:开发的'坑'"
date: 2014-05-08 23:15
comments: true
categories:
- python
tags:
- python

---

#### 有了第一篇[python的魔法(-)之基础知识](http://www.dongwm.com/archives/pythonde-mo-fa/), 我们再来说说python开发中的坑


#### 不要使用可变对象作为函数默认值

```python
In [1]: def append_to_list(value, def_list=[]):
   ...:         def_list.append(value)
   ...:         return def_list
   ...: 

In [2]: my_list = append_to_list(1)

In [3]: my_list
Out[3]: [1]

In [4]: my_other_list = append_to_list(2)

In [5]: my_other_list
Out[5]: [1, 2] # 看到了吧，其实我们本来只想生成[2] 但是却把第一次运行的效果页带了进来

In [6]: import time

In [7]: def report_arg(my_default=time.time()):
   ...:         print(my_default)
   ...:     

In [8]: report_arg() # 第一次执行
1399562371.32

In [9]: time.sleep(2) # 隔了2秒

In [10]: report_arg()
1399562371.32 # 时间竟然没有变

```

这2个例子说明了什么? 字典,集合,列表等等对象是不适合作为函数默认值的. 因为这个默认值实在函数建立的时候就生成了, 每次调用都是用了这个对象的"缓存". 我在上段时间的分享[python高级编程](http://dongweiming.github.io/Expert-Python/)也说到了这个问题,这个是实际开发遇到的问题，好好检查你学过的代码, 也许只是问题没有暴露

可以这样改:

```python
def append_to_list(element, to=None):
    if to is None:
        to = []
    to.append(element)
    return to
```

#### 生成器不保留迭代过后的结果

```python
In [12]: gen = (i for i in range(5))

In [13]: 2 in gen
Out[13]: True

In [14]: 3 in gen
Out[14]: True

In [15]: 1 in gen
Out[15]: False # 1为什么不在gen里面了? 因为调用1->2,这个时候1已经不在迭代器里面了,被按需生成过了

In [20]: gen = (i for i in range(5))

In [21]: a_list = list(gen) # 可以转化成列表，当然a_tuple = tuple(gen) 也可以

In [22]: 2 in a_list
Out[22]: True

In [23]: 3 in a_list
Out[23]: True

In [24]: 1 in a_list # 就算循环过,值还在
Out[24]: True
```

#### lambda在闭包中会保存局部变量

```python
In [29]: my_list = [lambda: i for i in range(5)]

In [30]: for l in my_list:
   ....:         print(l())
   ....:     
4
4
4
4
4
```

这个问题还是上面说的[python高级编程](http://dongweiming.github.io/Expert-Python/)中说过具体原因. 其实就是当我赋值给my_list的时候,lambda表达式就执行了i会循环,直到 i =4,i会保留

但是可以用生成器

```python
In [31]: my_gen = (lambda: n for n in range(5))

In [32]: for l in my_gen:
   ....:         print(l())
   ....:     
0
1
2
3
4
```

也可以坚持用list：

```python
In [33]: my_list = [lambda x=i: x for i in range(5)] # 看我给每个lambda表达式赋了默认值

In [34]: for l in my_list:
   ....:         print(l())
   ....:     
0
1
2
3
4
```

有点不好懂是吧,在看看python的另外一个魔法:

```python
In [35]: def groupby(items, size):
   ....:     return zip(*[iter(items)]*size)
   ....: 

In [36]: groupby(range(9), 3)
Out[36]: [(0, 1, 2), (3, 4, 5), (6, 7, 8)]
```

一个分组的函数,看起来很不好懂,对吧? 我们来解析下这里

```python
In [39]: [iter(items)]*3
Out[39]: 
[<listiterator at 0x10e155fd0>,
 <listiterator at 0x10e155fd0>,
 <listiterator at 0x10e155fd0>] # 看到了吧, 其实就是把items变成可迭代的, 重复三回（同一个对象哦）, 但是别忘了,每次都.next(), 所以起到了分组的作用
 In [40]: [lambda x=i: x for i in range(5)]
Out[40]: 
[<function __main__.<lambda>>,
 <function __main__.<lambda>>,
 <function __main__.<lambda>>,
 <function __main__.<lambda>>,
 <function __main__.<lambda>>] # 看懂了吗?
```

#### 在循环中修改列表项

```python
In [44]: a = [1, 2, 3, 4, 5]

In [45]: for i in a:
   ....:     if not i % 2:
   ....:         a.remove(i)
   ....:         

In [46]: a
Out[46]: [1, 3, 5] # 没有问题

In [50]: b = [2, 4, 5, 6]

In [51]: for i in b:
   ....:      if not i % 2:
   ....:          b.remove(i)
   ....:         

In [52]: b
Out[52]: [4, 5] # 本来我想要的结果应该是去除偶数的列表
```

思考一下,为什么 -- 是因为你对列表的remove,影响了它的index

```python
In [53]: b = [2, 4, 5, 6]

In [54]: for index, item in enumerate(b):
   ....:     print(index, item)
   ....:     if not item % 2:
   ....:         b.remove(item)
   ....:         
(0, 2) # 这里没有问题 2被删除了
(1, 5) # 因为2被删除目前的列表是[4, 5, 6], 所以索引list[1]直接去找5, 忽略了4
(2, 6)
```

#### IndexError - 列表取值超出了他的索引数

```python
In [55]: my_list = [1, 2, 3, 4, 5]

In [56]: my_list[5] # 根本没有这个元素
---------------------------------------------------------------------------
IndexError                                Traceback (most recent call last)
<ipython-input-56-037d00de8360> in <module>()
----> 1 my_list[5]

IndexError: list index out of range # 抛异常了

In [57]: my_list[5:] # 但是可以这样， 一定要注意, 用好了是trick,用错了就是坑啊
Out[57]: []
```

#### 重用全局变量

```python
In [58]: def my_func():
   ....:         print(var) # 我可以先调用一个未定义的变量
   ....:     

In [59]: var = 'global' # 后赋值

In [60]: my_func() # 反正只要调用函数时候变量被定义了就可以了
global

In [61]: def my_func():
   ....:     var = 'locally changed'
   ....:     

In [62]: var = 'global'

In [63]: my_func()

In [64]: print(var)
global # 局部变量没有影响到全局变量

In [65]: def my_func():
   ....:         print(var) # 虽然你全局设置这个变量, 但是局部变量有同名的, python以为你忘了定义本地变量了
   ....:         var = 'locally changed'
   ....:         

In [66]: var = 'global'

In [67]: my_func()
---------------------------------------------------------------------------
UnboundLocalError                         Traceback (most recent call last)
<ipython-input-67-d82eda95de40> in <module>()
----> 1 my_func()

<ipython-input-65-0ad11d690936> in my_func()
      1 def my_func():
----> 2         print(var)
      3         var = 'locally changed'
      4 

UnboundLocalError: local variable 'var' referenced before assignment

In [68]: def my_func():
   ....:         global var # 这个时候得加全局了
   ....:         print(var) # 这样就能正常使用
   ....:         var = 'locally changed' 
   ....:     

In [69]: var = 'global'

In [70]: 

In [70]: my_func()
global

In [71]: print(var)
locally changed # 但是使用了global就改变了全局变量
```

#### 拷贝可变对象

```python
In [72]: my_list1 = [[1, 2, 3]] * 2

In [73]: my_list1
Out[73]: [[1, 2, 3], [1, 2, 3]]

In [74]: my_list1[1][0] = 'a' # 我只修改子列表中的一项

In [75]: my_list1
Out[75]: [['a', 2, 3], ['a', 2, 3]] # 但是都影响到了

In [76]: my_list2 = [[1, 2, 3] for i in range(2)] # 用这种循环生成不同对象的方法就不影响了

In [77]: my_list2[1][0] = 'a'

In [78]: my_list2
Out[78]: [[1, 2, 3], ['a', 2, 3]]
```