---
layout: post
title: "使用celery之怎么让celery跑起来"
date: 2013-11-24 16:46
comments: true
categories:
- celery
tags:
- celery

---

####前言

自从发了上次的文章[使用celery之深入celery配置](http://www.dongwm.com/archives/shi-yong-celeryzhi-shen-ru-celerypei-zhi/),
有一些网友再问我怎么让celery跑起来. 其实说来也是,celery在新手眼里真的是比较重量级,不好懂,今天先让他跑起来吧
本文大部分代码和使用方法都可以在celery官网看到

####我想要的效果

我想实现一个定时任务, 每3个小时的12分启动,假如是定时任务大概是这样的:

```
12 */3 * * * python /where/is/the/path/that.py
```

####选择MQ

使用消息队列其实就是为了给任务一个时序,保证任务消息不丢失,想想你的一个任务是关乎公司核心业务,犹豫某种原因失败或者丢失怎么办?
celery就需要这个消息的存储,我这里还是选择rabbitmq  mongodb,redis都无所谓 只是存储的位置的问题.
选择其他的工具没有远程控制和监控

写法就是:

```
BROKER_URL = 'amqp://myuser:mypassword@localhost:5672/vhost'
```

其中可以这样解析

```
amqp://user:password@hostname:port/vhost
```

vhost是命名空间,就像网站的子域名,在这里由于权限控制我们需要先创建账号和密码

```
$ rabbitmqctl add_user myuser mypassword
$ rabbitmqctl add_vhost myvhost
$ rabbitmqctl set_permissions -p myvhost myuser ".*" ".*" ".*"
```

#### 编写tasks.py脚本

```
from celery import Celery

app = Celery('tasks', broker='amqp://myuser:mypassword@localhost:5672/vhost')

@app.task
def add(x, y):
    return x + y
```
#### 简单的使用

```
$celery -A tasks worker --loglevel=debug
```

-A指定的就是任务的程序 tasks.py  worker表示他是一个执行任务角色. 后面的记录日志类型,默认是info

这个时候,你可以在当前目录下使用python交互模式生成一个任务

```
>>> from tasks import add
>>> add.delay(4, 4)
```

这个时候可以看见上面的日志里面多了一些消息,然后里面多了这个任务的信息,比如下面这样:

```
[2013-11-24 17:11:59,369: INFO/MainProcess] Received task: tasks.add[f27994b0-3628-43a1-b136-540a360e3d64]
[2013-11-24 17:11:59,371: INFO/MainProcess] Task tasks.add[f27994b0-3628-43a1-b136-540a360e3d64] succeeded in 0.00102571400021s: 8
```

可以看见你的任务被执行了

#### 假如我使用python的包, 就像一个应用,让代码结构化一些

```
$tree proj
proj
├── __init__.py
├── celery.py
└── tasks.py
```

```
$cat proj/celery.py
from __future__ import absolute_import
from celery import Celery
app = Celery('proj',
              broker='amqp://myuser:mypassword@localhost:5672/vhost',
              backend='amqp://',
              include=['proj.tasks'])
app.conf.update(CELERY_TASK_RESULT_EXPIRES=3600,)
if __name__ == '__main__':
    app.start()
```

上面的broker就是消息存储的地址
backend是存储任务执行情况的,比如正在执行，执行失败, 已经执行结果.
include表示执行的任务的代码都放在哪个程序里面,比如这里的proj.tasks就是proj/tasks.py

```
$cat proj/tasks.py
from __future__ import absolute_import

from proj.celery import app


@app.task
def add(x, y):
    return x + y
```

其中的app.task是一个装饰器, 你可以在tasks.py里面加很多函数,但是celery只会找带这个装饰器的函数当成一种任务去执行
你可以有多个这样的脚本,只要在上面的celery.py的include的列表中指定

好吧 我们可以这样启动

```
$celery worker --app=proj -l info
```

proj 就是我们刚才应用的项目目录

#### 给我们的项目任务放到特定的队列

可能你有很多的任务,但是你希望某些机器跑某些任务, 你可以希望有些任务优先级比较高,而不希望
先进先出的等待. 那么需要引入一个队列的问题. 也就是说在你的broker的消息存储里面有一些队列，他们并行运行，但是worker只从对应
的队列里面取任务.

我们要修改配置

```
$cat proj/celery.py
from __future__ import absolute_import
from celery import Celery
app = Celery('proj',
              broker='amqp://myuser:mypassword@localhost:5672/vhost',
              backend='amqp://',
              include=['proj.tasks'])
app.conf.update(
    CELERY_ROUTES = {
            'proj.tasks.add': {'queue': 'hipri'},
                },
                )
if __name__ == '__main__':
    app.start()
```

```
celery -A proj worker -Q hipri #这个worker只处理hipri这个队列的任务
```

你会发现add这个函数任务被放在一个叫做'hipri'的队列里面，想要执行那么也需要改:

```
from proj.tasks import add
add.apply_async((2, 2), queue='hipri')
```

#### 使用beat自动调度

想想吧. 目前还是交互模式去手动执行, 我们要是想crontab的定时生成和执行,那么就是celery beat干的事情

```
from __future__ import absolute_import

from datetime import timedelta
from celery import Celery

app = Celery('proj',
             broker='amqp://myuser:mypassword@localhost:5672/vhost',
             backend='amqp://',
              include=['proj.tasks'])

app.conf.update(
    CELERY_ROUTES = {
        'proj.tasks.add': {'queue': 'hipri'},
    },

    CELERYBEAT_SCHEDULE = {
        "add": {
                "task": "proj.tasks.add",
                "schedule": timedelta(seconds=10),
                "args": (16, 16)
                }, },
                )

if __name__ == '__main__':
    app.start()

```

注意发现了一个CELERYBEAT_SCHEDULE,里面的调度其实就是表示10秒生成一次,worker启动方法一样,
这里启动beat,他就是按时生成任务发到MQ里面,让worker取走去执行

```
celery -A proj beat
```

其实也可以在worker命令中加-B

```
celery -A proj worker -B -Q hipri -l debug
```

刚才的CELERYBEAT_SCHEDULE也可以使用crontab的风格，比如我说的没3小时的12分就可以这样:

```
from celery.schedules import crontab

CELERYBEAT_SCHEDULE = {
        "add": {
                "task": "tasks.add",
                "schedule": crontab(hour="*/3", minute=12),
                "args": (16, 16),
                },
            }
```
