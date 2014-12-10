---
layout: post
title: "用python跑mapreduce"
date: 2014-01-09 23:04
comments: true
categories:
- mapreduce
tags:
- mapreduce

---

####前言

mapreduce在我的理解里一直都是java等语言的专利,介于python乃至于pypy的性能局限，
一直没想过用python写分布式任务,最多就是多workers从消息队列取任务执行这样,但是最近一件事真的颠覆
了我对python的认识.

####先说说起因

某天分享[sed和awk](http://www.dongwm.com/archives/sed-and-awk/),领导突发奇想让我用一些顾问的实际工作需要去我们的大量数据里面获取想要的数据的需求作为一些演示的例子.其中有这样一个需求(我去掉实际一些专业晦涩的用语,用实际的内容来表达):

##### 需求

```python
1. 有大量的gz压缩文件, 找到其中某2天的数据, 每一行都是一条实际数据
2. 需要解压缩每个文件,遍历每行找到用逗号隔开的第21列为16233,第23列为27188的行. 以第2列为键计算符合的数量
3. 在全部统计结果里面根据值计算符合的键的数量: 比如{'a':2, 'b':1, 'c':1},结果就是{1:2, 2:1},也就是2次的有2个,1次的只有一个

```

###### 分析

一上来真的想用awk来搞.但是和其他同事一聊,有几个难点:

```
1. 2天数据总量在400G以上,用awk还要保留2次哈希结果-不可能用awk
2. 用python,据同事经验说:只是解压缩这些小文件后读取什么都不做也大概1天多的时间,完全不能忍
3. 数据还没有放到hadoop, 没有其他更好更快的方法

```

#####解题思路:

1. 最初我想做成这样:

    1. 把需要处理的这些压缩文件放到队列里面
    2. 启动多进程出队列里面获取要处理的文件,执行,把符合的结果放到共享变量叠加
    3. 计算完成后从共享变量里面或者数据在生成上面第三条的结果

但是今天讲的是python得mapreduce,也就是我后续的版本,它源于伟大的Doug Hellmann的[Implementing MapReduce with multiprocessing](http://pymotw.com/2/multiprocessing/mapreduce.html)

```python
#!/usr/bin/env python
#coding=utf-8
# python mapreduce 跑数实现
# Author: Dongweiming
import gzip
import time
import os
import glob
import collections
import itertools
import operator
import multiprocessing


class AdMapReduce(object):

    def __init__(self, map_func, reduce_func, num_workers=None):
        '''
        num_workers: 不指定就是默认可用cpu的核数
        map_func: map函数: 要求返回格式类似:[(a, 1), (b, 3)]
        reduce_func: reduce函数: 要求返回格式类似: (c, 10)
        '''
        self.map_func = map_func
        self.reduce_func = reduce_func
        self.pool = multiprocessing.Pool(num_workers)

    def partition(self, mapped_values):
        partitioned_data = collections.defaultdict(list)
        for key, value in mapped_values:
            partitioned_data[key].append(value)
        return partitioned_data.items()

    def __call__(self, inputs, chunksize=1):
        '''调用类的时候被触发'''
        # 其实都是借用multiprocessing.Pool.map这个函数, inputs是一个需要处理的列表,想想map函数
        # chunksize表示每次给mapper的量, 这个根据需求调整效率
        map_responses = self.pool.map(self.map_func, inputs, chunksize=chunksize)
        # itertools.chain是把mapper的结果链接起来为一个可迭代的对象
        partitioned_data = self.partition(itertools.chain(*map_responses))
        # 大家想,上面的就是[(a, [1,2]), (b, [2,3]),列表中的数就是当时符合的次数,reduce就是吧列表符合项sum
        reduced_values = self.pool.map(self.reduce_func, partitioned_data)
        return reduced_values


def mapper_match(one_file):
    '''第一次的map函数,从每个文件里面获取符合的条目'''
    output = []
    for line in gzip.open(one_file).readlines():
        l = line.rstrip().split(',')
        if int(l[20]) == 16309 and int(l[22]) == 2656:
            cookie = l[1]
            output.append((cookie, 1))
    return output


def reduce_match(item):
    '''第一次的reduce函数,给相同的key做统计'''
    cookie, occurances = item
    return (cookie, sum(occurances))


def mapper_count(item):
    '''第二次mapper函数,其实就是把某key的总数做键,但是值标1'''
    _, count = item
    return [(count, 1)]


def reduce_count(item):
    '''第二次reduce函数'''
    freq, occurances = item
    return (freq, sum(occurances))


if __name__ == '__main__':
    start = time.time()
    input_files = glob.glob('/datacenter/input/2013-12-1[01]/*')
    mapper = AdMapReduce(mapper_match, reduce_match)
    cookie_feq = mapper(input_files)
    mapper = AdMapReduce(mapper_count, reduce_count)
    cookie_feq = mapper(cookie_feq)
    cookie_feq.sort(key=operator.itemgetter(1))
    for freq, count in cookie_feq:
        print '{0}\t{1}\t{2}'.format(freq, count, freq*count)
    #cookie_feq.reverse()
    end = time.time()
    print 'cost:', end - start
```


#### 后话

哇,看python做mapreduce也是可以这样优雅的, 我是用pypy跑下来,竟然只有了61分钟....

但是其实他只是借助mapreduce思想和多核的硬件基础,其实pool做的还是文件级别的处理.假如是少量的大文件,就未必有这样好的效果了.

我想很多时候这样的工作都可以交给这个Admapreduce类来做
