---
layout: post
title: "ipython的一些高级用法(二)"
date: 2014-12-11 17:04
comments: true
categories:
- python
- ipython
tags:
- python
- ipython

---

#### 今天我们学习下写ipython的magic命令. 好, magic是什么? 它是ipython自带的一些扩展命令, 类似%history, %prun, %logstart..
想查看全部的magic可以使用ismagic, 列出可用的全部magics

```python
%lsmagic
```

magic分为2类:

- line magic: 一些功能命令
- cell magic: 主要是渲染ipython notebook页面效果以及执行某语言的代码

##### [idb](https://github.com/dongweiming/idb) - python db.py shell extension

idb是我最近写的一个magic. 主要是给ipython提供[db.py](https://github.com/yhat/db.py)的接口,我们直接分析代码(我只截取有代表性的一段):

```python
import os.path
from functools import wraps
from operator import attrgetter
from urlparse import urlparse

from db import DB # db.py提供的接口
from IPython.core.magic import Magics, magics_class, line_magic # 这三个就是我们需要做magic插件的组件


def get_or_none(attr):
    return attr if attr else None


def check_db(func):
    @wraps(func)
    def deco(*args):
        if args[0]._db is None: # 每个magic都需要首页实例化过db，so 直接加装饰器来判断
            print '[ERROR]Please make connection: `con = %db_connect xx` or `%use_credentials xx` first!'  # noqa
            return
        return func(*args)
    return deco


@magics_class  # 每个magic都需要加这个magics_class装饰器
class SQLDB(Magics): # 要继承至Magics
    _db = None # 每次打开ipython都是一次实例化

    @line_magic('db_connect') # 这里用了line_magic 表示它是一个line magic.(其他2种一会再说) magic的名字是db_connect. 注意 函数名不重要
                              # 最后我们用 %db_connect而不是%conn
    def conn(self, parameter_s): # 每个这样的方法都接收一个参数 就是你在ipython里输入的内容
        """Conenct to database in ipython shell.
        Examples::
            %db_connect
            %db_connect postgresql://user:pass@localhost:port/database
        """
        uri = urlparse(parameter_s) # 剩下的都是解析parameter_s的逻辑

        if not uri.scheme:
            params = {
                'dbtype': 'sqlite',
                'filename': os.path.join(os.path.expanduser('~'), 'db.sqlite')
            }
        elif uri.scheme == 'sqlite':
            params = {
                'dbtype': 'sqlite',
                'filename': uri.path
            }
        else:
            params = {
                'username': get_or_none(uri.username),
                'password': get_or_none(uri.password),
                'hostname': get_or_none(uri.hostname),
                'port': get_or_none(uri.port),
                'dbname': get_or_none(uri.path[1:])
            }

        self._db = DB(**params) # 这里给_db赋值

        return self._db # return的结果就会被ipython接收,显示出来

    @line_magic('db') # 一个新的magic 叫做%db -- 谨防取名冲突
    def db(self, parameter_s):
        return self._db

    @line_magic('table')
    @check_db
    def table(self, parameter_s):
        p = parameter_s.split() # 可能传进来的是多个参数,但是对ipython来说,传进来的就是一堆字符串，所以需要按空格分隔下
        l = len(p)
        if l == 1:
            if not p[0]:
                return self._db.tables
            else:
                return attrgetter(p[0])(self._db.tables)
        else:
            data = self._db.tables
            for c in p:
                if c in ['head', 'sample', 'unique', 'count', 'all', 'query']:
                    data = attrgetter(c)(data)()
                else:
                    data = attrgetter(c)(data)
            return data

def load_ipython_extension(ipython): # 注册一下. 假如你直接去ipython里面加 就不需要这个了
    ipython.register_magics(SQLDB)
```

PS:

1. 调试中可以使用%reloa_ext idb 的方式重启magic
2. %install_ext 之后默认放在你的ipython自定义目录/extensions里. 我这里是~/.ipython/extensions

好了,大家是不是觉得ipython的magic也不是很难嘛

##### 来了解ipython都提供了什么?

1. magic装饰器的类型:

- line_magic # 刚才我们见识了, 就是%xx, xx就是magic的名字
- cell_magic # 就是%%xx
- line_cell_magic # 可以是%xx, 也可以是%%xx

先说cell_magic 来个例子，假如我想执行个ruby,本来应该是:

```python
In [1]: !ruby -e 'p "hello"'
"hello"

In [2]: %%ruby # 也可以这样
   ...: p "hello"
      ...:
      "hello"

再说个notebook的:

In [3]: %%javascript
   ...: require.config({
   ...:     paths: {
   ...:         chartjs: '//code.highcharts.com/highcharts'
   ...:     }
   ...: });
   ...:
   <IPython.core.display.Javascript object>
});
```

然后再说line_cell_magic:

```python
In [4]: %time 2**128
CPU times: user 2 µs, sys: 1 µs, total: 3 µs
Wall time: 5.01 µs
Out[4]: 340282366920938463463374607431768211456L

In [5]: %%time
   ...: 2**128
   ...:
   CPU times: user 4 µs, sys: 0 ns, total: 4 µs
   Wall time: 9.06 µs
   Out[5]: 340282366920938463463374607431768211456L
```

Ps: line_cell_magic方法的参数是2个:

```python
@line_cell_magic
def xx(self, line='', cell=None):
```

##### 带参数的magic（我直接拿ipython源码提供的magic来说明):

一共2种风格:

- 使用getopt: self.parse_options
- 使用argparse: magic_arguments

###### self.parse_options

```python
@line_cell_magic
def prun(self, parameter_s='', cell=None):
    opts, arg_str = self.parse_options(parameter_s, 'D:l:rs:T:q',
                                       list_all=True, posix=False)
    ...
```

getopt用法可以看这里 http://pymotw.com/2/getopt/index.html#module-getopt

我简单介绍下'D:l:rs:T:q'就是可以使用 -D, -l, -r, -s, -T, -q这些选项. `:`号是告诉你是否需要参数,split下就是:
D:,l:,r,s:,T:,q 也就是-r和-q不需要参数其他的都是参数 类似 %prun -D <filename>

###### magic_arguments

```python
@magic_arguments.magic_arguments() # 最上面
@magic_arguments.argument('--breakpoint', '-b', metavar='FILE:LINE',
    help="""
    Set break point at LINE in FILE.
    """
) # 这种argument可以有多个
@magic_arguments.argument('statement', nargs='*',
    help="""
    Code to run in debugger.
    You can omit this in cell magic mode.
    """
)
@line_cell_magic
def debug(self, line='', cell=None):
    args = magic_arguments.parse_argstring(self.debug, line) # 要保持第一个参数等于这个方法名字,这里就是self.debug
    ...
```

还有个magic方法集: 用于并行计算的magics: [IPython/parallel/client/magics.py](https://github.com/ipython/ipython/blob/master/IPython/parallel/client/magics.py)
