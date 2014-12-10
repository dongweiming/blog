---
layout: post
title: "封装pymongo自动关闭连接"
date: 2013-08-16 21:42
comments: true
categories:
- pymongo
- mongodb
tags:
- pymongo

---

####前言

在我工作的项目里面使用了mongodb.自然也用到了pymongo.但是它都是在大片的函数里面使用类似于这样的方式

```python
import db
def test():
    ...
    db.test.find_one()
    ...
```

但是问题是在使用完都没有关闭连接,这样多台服务器连接我这台mongodb服务器，在业务高峰期就会占满我的连接, 我当时总结造成这个原因的问题有以下三种:

1. 上面说的用完db不关闭连接而是等着db超时

1. 注意上面的import，其实在import文件的时候数据库连接就已经生成了，没有在需要的时候才创建, 占满我连接的应用其实有很多没有用，浪费了

1. nginx、uwsgi，celery等应用配置的问题，造成过多的实例，其实根本无益

####我今天写的一个封装pymongo和关闭数据库连接的装饰器

```python
#/usr/bin/env python
# coding=utf-8

"""
1. 封装数据库操作(INSERT,FIND,UPDATE)
2. 函数执行完MONGODB操作后关闭数据库连接
"""

from functools import wraps
from pymongo.database import Database

try:
    from pymongo import MongoClient
except ImportError:
    # 好像2.4之前的pymongo都没有MongoClient,现在官网已经把Connection抛弃了
    import warnings
    warnings.warn("Strongly recommend upgrading to the latest version pymongo version,"
                  "Connection is DEPRECATED: Please use mongo_client instead.")
    from pymongo import Connection as MongoClient


class Mongo(object):

    '''封装数据库操作'''

    def __init__(self, host='localhost', port=27017, database='test',
                 max_pool_size=10, timeout=10):
        self.host = host
        self.port = port
        self.max_pool_size = max_pool_size
        self.timeout = timeout
        self.database = database

    @property
    def connect(self):
        # 我这里是为了使用类似"db.集合.操作"的操作的时候才会生成数据库连接,其实pymongo已经实现了进程池,也可以把这个db放在__init__里面,
        # 比如我把db关掉有其他的数据库调用连接又会生成,并且不影响使用.我这里只是想每次执行数据库生成一个连接用完关掉-自己控制自己的
        return MongoClientself.host, self.port, max_pool_size=self.max_pool_size,
                  connectTimeoutMS=60 * 60 * self.timeout)

    def __getitem__(self, collection):
        # 为了兼容db[集合].操作的用法
        return self.__getattr__(collection)

    def __getattr__(self, collection_or_func):
        db = self.connect[self.database]
        if collection_or_func in Database.__dict__:
            # 当调用的是db的方法就直接返回
            return getattr(db, collection_or_func)
        # 否则委派给Collection
        return Collection(db, collection_or_func)


class Collection(object):

    def __init__(self, db, collection):
        self.collection = getattr(db, collection)

    def __getattr__(self, operation):
        # 我这个封装只是为了拦截一部分操作,不符合的就直接raise属性错误
        control_type = ['disconnect', 'insert', 'update', 'find', 'find_one']
        if operation in control_type:
            return getattr(self.collection, operation)
        raise AttributeError(operation)


def close_db(dbs=['db']):
    '''
    关闭mongodb数据库连接
    db : 在执行函数里面使用的db的名字(大部分是db，也会有s_db)
        Usage::
            >>>s_db = Mongo()
            >>>@close_db(['s_db'])
            ...: def test():
            ...:     print s_db.test.insert({'a': 1, 'b': 2})
            ...:
    '''
    def _deco(func):
        @wraps(func)
        def _call(*args, **kwargs):
            result = func(*args, **kwargs)
            for db in dbs:
                try:
                    func.func_globals[db].connection.disconnect()
                except KeyError:
                    pass
            return result
        return _call
    return _deco
```

PS: 在我测试的时候发现,使用Mongo()类生成的db，操作完会自动关闭连接了...

####怎么样给一个很大的文件每个函数都加上面的这个装饰器？

项目每个脚本的代码都很长，函数也很多，并且每个函数里面使用的db的名字都不同,比如有一些一些风格:


```python
db.test.find_one()
s_db.test.insert(dict(test='test'))
...
```

每个函数加一个装饰器,好费劲，就想能不能自动分辨文件中的函数然后给他们自动加装饰器，然后就有以下的一个做好的脚本:

```python
#coding=utf-8

from functools import wraps
import copy
import types

def wrap(func):
    @wraps(func)
    def _call(*args, **kwargs):
        result = func(*args, **kwargs)
        print 'wrap you'
        return result
    return _call

def test():
    print 'test'

def test2():
    print 'test3'

glocal_dict = copy.copy(globals())

func_list = [[k, v] for k, v in glocal_dict.iteritems() if not k.startswith('__')]

for func_name, func in func_list:
    if  func_name in ['wraps', 'copy', 'wrap', 'types']:
        continue
    if types.FunctionType  == type(func):
        globals()[func_name]= wrap(func)
```

这样当你调用的时候自动就有了装饰器:

```bash
>>> from test import test
>>> test()
test
wrap you
>>>
```
