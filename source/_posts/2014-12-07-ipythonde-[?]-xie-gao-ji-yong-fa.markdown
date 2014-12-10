---
layout: post
title: "ipython的一些高级用法(一)"
date: 2014-12-07 09:56
comments: true
categories:
- python
- ipython
tags:
- python
- ipython

---

#### 前言

以前在我的PPT[python高级编程](http://dongweiming.github.io/Expert-Python/)也提到了一些关于ipython的用法. 今天继续由浅入深的看看ipython,
本文作为读者的你已经知道ipython并且用了一段时间了.

##### %run

这是一个magic命令, 能把你的脚本里面的代码运行, 并且把对应的运行结果存入ipython的环境变量中:

```
$cat t.py
# coding=utf-8
l = range(5)

$ipython
In [1]: %run t.py # `%`可加可不加

In [2]: l # 这个l本来是t.py里面的变量, 这里直接可以使用了
Out[2]: [0, 1, 2, 3, 4]
```

##### alias

```python
In [3]: %alias largest ls -1sSh | grep %s
In [4]: largest to
total 42M
 20K tokenize.py
 16K tokenize.pyc
8.0K story.html
4.0K autopep8
4.0K autopep8.bak
4.0K story_layout.html
```

PS 别名需要存储的, 否则重启ipython就不存在了:

```
In [5]: %store largest
Alias stored: largest (ls -1sSh | grep %s)
```

下次进入的时候`%store -r`

##### bookmark - 对目录做别名

```python
In [2]: %pwd
Out[2]: u'/home/vagrant'

In [3]: %bookmark dongxi ~/shire/dongxi

In [4]: %cd dongxi
/home/vagrant/shire/dongxi_code

In [5]: %pwd
Out[5]: u'/home/vagrant/shire/dongxi_code'
```

##### ipcluster - 并行计算

其实ipython提供的方便的并行计算的功能. 先回答ipython做并行计算的特点:

1.

```bash
$wget http://www.gutenberg.org/files/27287/27287-0.txt
```

第一个版本是直接的, 大家习惯的用法.

```python
In [1]: import re

In [2]: import io

In [3]: non_word = re.compile(r'[\W\d]+', re.UNICODE)

In [4]: common_words = {
   ...: 'the','of','and','in','to','a','is','it','that','which','as','on','by',
   ...: 'be','this','with','are','from','will','at','you','not','for','no','have',
   ...: 'i','or','if','his','its','they','but','their','one','all','he','when',
   ...: 'than','so','these','them','may','see','other','was','has','an','there',
   ...: 'more','we','footnote', 'who', 'had', 'been',  'she', 'do', 'what',
   ...: 'her', 'him', 'my', 'me', 'would', 'could', 'said', 'am', 'were', 'very',
   ...: 'your', 'did', 'not',
   ...: }

In [5]: def yield_words(filename):
   ...:     import io
   ...:     with io.open(filename, encoding='latin-1') as f:
   ...:         for line in f:
   ...:             for word in line.split():
   ...:                 word = non_word.sub('', word.lower())
   ...:                 if word and word not in common_words:
   ...:                     yield word
   ...:

In [6]: def word_count(filename):
   ...:     word_iterator = yield_words(filename)
   ...:     counts = {}
   ...:     counts = defaultdict(int)
   ...:     while True:
   ...:         try:
   ...:             word = next(word_iterator)
   ...:         except StopIteration:
   ...:             break
   ...:         else:
   ...:             counts[word] += 1
   ...:     return counts
   ...:

In [6]: from collections import defaultdict # 脑残了 忘记放进去了..
In [7]: %time counts = word_count(filename)
CPU times: user 88.5 ms, sys: 2.48 ms, total: 91 ms
Wall time: 89.3 ms
```

现在用ipython来跑一下:

```python
ipcluster start -n 2 # 好吧, 我的Mac是双核的
```

先讲下ipython 并行计算的用法:

```python
In [1]: from IPython.parallel import Client # import之后才能用%px*的magic

In [2]: rc = Client()

In [3]: rc.ids # 因为我启动了2个进程
Out[3]: [0, 1]

In [4]: %autopx # 如果不自动 每句都需要: `%px xxx`
%autopx enabled

In [5]: import os # 这里没autopx的话 需要: `%px import os`

In [6]: print os.getpid() # 2个进程的pid
[stdout:0] 62638
[stdout:1] 62636

In [7]: %pxconfig --targets 1 # 在autopx下 这个magic不可用
[stderr:0] ERROR: Line magic function `%pxconfig` not found.
[stderr:1] ERROR: Line magic function `%pxconfig` not found.

In [8]: %autopx # 再执行一次就会关闭autopx
%autopx disabled

In [10]: %pxconfig --targets 1 # 指定目标对象, 这样下面执行的代码就会只在第2个进程下运行

In [11]: %%px --noblock # 其实就是执行一段非阻塞的代码
   ....: import time
   ....: time.sleep(1)
   ....: os.getpid()
   ....:
Out[11]: <AsyncResult: execute>

In [12]: %pxresult # 看 只返回了第二个进程的pid
Out[1:21]: 62636

In [13]: v = rc[:] # 使用全部的进程, ipython可以细粒度的控制那个engine执行的内容

In [14]: with v.sync_imports(): # 每个进程都导入time模块
   ....:     import time
   ....:
importing time on engine(s)

In [15]: def f(x):
   ....:     time.sleep(1)
   ....:     return x * x
   ....:

In [16]: v.map_sync(f, range(10)) # 同步的执行

Out[16]: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

In [17]: r = v.map(f, range(10)) # 异步的执行

In [18]: r.ready(), r.elapsed # celery的用法
Out[18]: (True, 5.87735)

In [19]: r.get() # 获得执行的结果
Out[19]: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

入正题:

```python
In [20]: def split_text(filename):
....:    text = open(filename).read()
....:    lines = text.splitlines()
....:    nlines = len(lines)
....:    n = 10
....:    block = nlines//n
....:    for i in range(n):
....:        chunk = lines[i*block:(i+1)*(block)]
....:        with open('count_file%i.txt' % i, 'w') as f:
....:            f.write('\n'.join(chunk))
....:    cwd = os.path.abspath(os.getcwd())
....:    fnames = [ os.path.join(cwd, 'count_file%i.txt' % i) for i in range(n)] # 不用glob是为了精准
....:    return fnames

In [21]: from IPython import parallel

In [22]: rc = parallel.Client()

In [23]: view = rc.load_balanced_view()

In [24]: v = rc[:]

In [25]: v.push(dict(
   ....:     non_word=non_word,
   ....:     yield_words=yield_words,
   ....:     common_words=common_words
   ....: ))
Out[25]: <AsyncResult: _push>

In [26]: fnames = split_text(filename)

In [27]: def count_parallel():
   .....:     pcounts = view.map(word_count, fnames)
   .....:     counts = defaultdict(int)
   .....:     for pcount in pcounts.get():
   .....:         for k, v in pcount.iteritems():
   .....:             counts[k] += v
   .....:     return counts, pcounts
   .....:

In [28]: %time counts, pcounts = count_parallel() # 这个时间包含了我再聚合的时间
CPU times: user 47.6 ms, sys: 6.67 ms, total: 54.3 ms # 是不是比直接运行少了很多时间?
Wall time: 106 ms # 这个时间是

In [29]: pcounts.elapsed, pcounts.serial_time, pcounts.wall_time
Out[29]: (0.104384, 0.13980499999999998, 0.104384)
```

更多地关于并行计算请看这里: [Parallel Computing with IPython](http://nbviewer.ipython.org/url/www.astro.washington.edu/users/vanderplas/Astr599/notebooks/21_IPythonParallel.ipynb)
