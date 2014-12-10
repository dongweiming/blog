---
layout: post
title: "python的魔法(一): 基本知识"
date: 2014-05-08 00:40
comments: true
categories:
- python
tags:
- python

---

#### 前言

最近读了一篇[A collection of not-so-obvious Python stuff you should know!](http://nbviewer.ipython.org/github/rasbt/python_reference/blob/master/not_so_obvious_python_stuff.ipynb),感觉受益颇多. 翻译过来(非直接翻译),再加上一些我的理解和注释. 让大家注意python鲜为人知的"魔法". 我会分2篇

##### python多继承(C3)

```python
In [1]: class A(object):
   ...:         def foo(self):
   ...:                 print("class A")
   ...:         

In [2]: class B(object):
   ...:         def foo(self):
   ...:                 print("class B")
   ...:         

In [3]: class C(A, B):
   ...:         pass
   ...: 

In [4]: C().foo()
class A # 例子很好懂, C继承了A和B，从左到右,发现A有foo方法,返回了
```

看起来都是很简单, 有次序的从底向上,从前向后找,找到就返回. 再看例子:

```python
In [5]: class A(object):
   ...:        def foo(self):
   ...:               print("class A")
   ...:         

In [6]: class B(A):
   ...:        pass
   ...: 

In [7]: class C(A):
   ...:        def foo(self):
   ...:               print("class C")
   ...:         

In [8]: class D(B,C):
   ...:        pass
   ...: 

In [9]: D().foo()
class C # ? 按道理, 顺序是 D->B->A,为什么找到了C哪去了
```

这也就涉及了MRO([Method Resolution Order](http://python-history.blogspot.ru/2010/06/method-resolution-order.html)):

```python
In [10]: D.__mro__
Out[10]: (__main__.D, __main__.B, __main__.C, __main__.A, object)
```

简单的理解其实就是新式类是广度优先了， D->B, 但是发现C也是继承A，就先找C，最后再去找A

#### 列表的+和+=, append和extend

```python
In [17]: print('ID:', id(a_list))
('ID:', 4481323592)

In [18]: a_list += [1]

In [19]: print('ID (+=):', id(a_list))
('ID (+=):', 4481323592) # 使用+= 还是在原来的列表上操作

In [20]: a_list = a_list + [2]

In [21]: print('ID (list = list + ...):', id(a_list))
('ID (list = list + ...):', 4481293056) # 简单的+其实已经改变了原有列表
In [28]: a_list = []

In [29]: id(a_list)
Out[29]: 4481326976

In [30]: a_list.append(1)

In [31]: id(a_list)
Out[31]: 4481326976 # append 是在原有列表添加

In [32]: a_list.extend([2])

In [33]: id(a_list)
Out[33]: 4481326976 # extend 也是在原有列表上添加
```

#### datetime也有布尔值

这是一个[坑](http://lwn.net/SubscriberLink/590299/bf73fe823974acea/)

```python
In [34]: import datetime

In [35]: print('"datetime.time(0,0,0)" (Midnight) ->', bool(datetime.time(0,0,0)))
('"datetime.time(0,0,0)" (Midnight) ->', False)

In [36]: print('"datetime.time(1,0,0)" (1 am) ->', bool(datetime.time(1,0,0)))
('"datetime.time(1,0,0)" (1 am) ->', True)
```

#### '==' 和 is 的区别
我的理解是"is"是判断2个对象的身份, ==是判断2个对象的值

```python
In [37]: a = 1

In [38]: b = 1

In [39]: print('a is b', bool(a is b))
('a is b', True)

In [40]: c = 999

In [41]: d = 999

In [42]: print('c is d', bool(c is d))
('c is d', False) # 原因是python的内存管理,缓存了-5 - 256的对象

In [43]: print('256 is 257-1', 256 is 257-1)
('256 is 257-1', True)

In [44]: print('257 is 258-1', 257 is 258 - 1)
('257 is 258-1', False)

In [45]: print('-5 is -6+1', -5 is -6+1)
('-5 is -6+1', True)

In [46]: print('-7 is -6-1', -7 is -6-1)
('-7 is -6-1', False)
In [47]: a = 'hello world!'

In [48]: b = 'hello world!'

In [49]: print('a is b,', a is b)
('a is b,', False) # 很明显 他们没有被缓存,这是2个字段串的对象

In [50]: print('a == b,', a == b)
('a == b,', True) # 但他们的值相同
# But, 有个特例
In [51]: a = float('nan')

In [52]: print('a is a,', a is a)
('a is a,', True)

In [53]: print('a == a,', a == a)
('a == a,', False) # 亮瞎我眼睛了~

```

#### 浅拷贝和深拷贝

我们在实际开发中都可以向对某列表的对象做修改,但是可能不希望改动原来的列表. **浅拷贝只拷贝父对象，深拷贝还会拷贝对象的内部的子对象**

```python
In [65]: list1 = [1, 2]

In [66]: list2 = list1 # 就是个引用, 你操作list2,其实list1的结果也会变

In [67]: list3 = list1[:]

In [69]: import copy

In [70]: list4 = copy.copy(list1) # 他和list3一样 都是浅拷贝

In [71]: id(list1), id(list2), id(list3), id(list4)
Out[71]: (4480620232, 4480620232, 4479667880, 4494894720)

In [72]: list2[0] = 3

In [73]: print('list1:', list1)
('list1:', [3, 2])

In [74]: list3[0] = 4

In [75]: list4[1] = 4

In [76]: print('list1:', list1)
('list1:', [3, 2]) # 对list3和list4操作都没有对list1有影响

# 再看看深拷贝和浅拷贝的区别

In [88]: from copy import copy, deepcopy

In [89]: list1 = [[1], [2]]

In [90]: list2 = copy(list1) # 还是浅拷贝

In [91]: list3 = deepcopy(list1) # 深拷贝

In [92]: id(list1), id(list2), id(list3)
Out[92]: (4494896592, 4495349160, 4494896088)

In [93]: list2[0][0] = 3

In [94]: print('list1:', list1)
('list1:', [[3], [2]]) # 看到了吧 假如你操作其子对象 还是和引用一样 影响了源

In [95]: list3[0][0] = 5

In [96]: print('list1:', list1)
('list1:', [[3], [2]]) # 深拷贝就不会影响
```

#### bool其实是int的子类

这篇[bool-is-int](http://www.peterbe.com/plog/bool-is-int)很有趣:

```python
In [97]: isinstance(True, int)
Out[97]: True

In [98]: True + True
Out[98]: 2

In [99]: 3 * True + True
Out[99]: 4

In [100]: 3 * True - False
Out[100]: 3

In [104]: True << 10
Out[104]: 1024 
```

#### 元组是不是真的不可变?

```python
In [111]: tup = ([],)

In [112]: tup[0] += [1]
---------------------------------------------------------------------------
TypeError                                 Traceback (most recent call last)
<ipython-input-112-d4f292cf35de> in <module>()
----> 1 tup[0] += [1]

TypeError: 'tuple' object does not support item assignment

In [113]: tup
Out[113]: ([1],) # 我靠 又是亮瞎我眼睛,明明抛了异常 还能修改?

In [114]: tup = ([],)

In [115]: tup[0].extend([1])

In [116]: tup[0]
Out[116]: [1] # 好吧,我有点看明白了, 虽然我不能直接操作元组，但是不能阻止我操作元组中可变的子对象(list)
```

这里有个不错的解释[Python's += Is Weird, Part II ](http://emptysqua.re/blog/python-increment-is-weird-part-ii/):

```python
In [117]: my_tup = (1,)

In [118]: my_tup += (4,)

In [119]: my_tup = my_tup + (5,)

In [120]: my_tup
Out[120]: (1, 4, 5) # ? 嗯 不是不能操作元组嘛?

In [121]: my_tup = (1,)

In [122]: print(id(my_tup))
4481317904

In [123]: my_tup += (4,)

In [124]: print(id(my_tup))
4480606864 # 操作的不是原来的元组 所以可以

In [125]: my_tup = my_tup + (5,)

In [126]: print(id(my_tup))
4474234912

```

#### python没有私有方法/变量? 但是可以有"伪"的

```python
In [127]: class my_class(object^E):
   .....:     def public_method(self):
   .....:         print('Hello public world!')
   .....:     def __private_method(self): # 私有以双下划线开头
   .....:         print('Hello private world!')
   .....:     def call_private_method_in_class(self):
   .....:         self.__private_method()
   
In [132]: my_instance = my_class()

In [133]: my_instance.public_method()
Hello public world! # 普通方法

In [134]: my_instance._my_class__private_method()
Hello private world! # 私有的可以加"_ + 类名字 + 私有方法名字”

In [135]: my_instance.call_private_method_in_class()
Hello private world! # 还可以通过类提供的公有接口内部访问

In [136]: my_instance._my_class__private_variable
Out[136]: 1

```

#### 异常处理加else

```python
In [150]: try:
   .....:     print('third element:', a_list[2])
   .....: except IndexError:
   .....:     print('raised IndexError')
   .....: else:
   .....:     print('no error in try-block') # 只有在try里面没有异常的时候才会执行else里面的表达式
   .....:     
raised IndexError # 抛异常了 没完全完成
In [153]: i = 0

In [154]: while i < 2:
   .....:     print(i)
   .....:     i += 1
   .....: else:
   .....:     print('in else')
   .....:     
0
1
in else # while也支持哦~
In [155]: i = 0

In [156]: while i < 2:
   .....:         print(i)
   .....:         i += 1
   .....:         break
   .....: else:
   .....:         print('completed while-loop')
   .....:     
0 # 被break了 没有完全执行完 就不执行else里面的了
In [158]: for i in range(2):
   .....:         print(i)
   .....: else:
   .....:         print('completed for-loop')
   .....:     
0
1
completed for-loop

In [159]: for i in range(2):
   .....:         print(i)
   .....:         break
   .....: else:
   .....:         print('completed for-loop')
   .....:     
0 # 也是因为break了
```