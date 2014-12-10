---
layout: post
title: "使用celery之深入celery配置"
date: 2013-08-24 14:08
comments: true
categories:
- celery
tags:
- celery
- topic
- direct
- fanout

---

####前言

celery的官方文档其实相对还是写的很不错的.但是在一些深层次的使用上面却显得杂乱甚至就没有某些方面的介绍, 通过我的一个测试环境的settings.py来说明一些使用celery的技巧和解决办法

####amqp交换类型

其实一共有4种交换类型，还有默认类型和自定义类型. 但是对我们配置队列只会用到其中之三，我来一个个说明，英语好的话可以直接去看英文文档

首先思考一下流程:

1. celerybeat生成任务消息，然后发送消息到一个exchange(交换机)

1. 交换机决定那个(些)队列会接收这个消息，这个其实就是根据下面的exchange的类型和绑定到这个交换机所用的bindingkey

我们这里要说的其实就是怎么样决定第二步谁接收的问题

1. Direct Exchange

如其名，直接交换，也就是指定一个消息被那个队列接收， 这个消息被celerybeat定义个一个routing key，如果你发送给交换机并且那个队列绑定的bindingkey 那么就会直接转给这个队列

2. Topic Exchange

你设想一下这样的环境(我举例个小型的应该用场景): 你有三个队列和三个消息, A消息可能希望被X,Y处理,B消息你希望被,X,Z处理,C消息你希望被Y,Z处理.并且这个不是队列的不同而是消息希望被相关的队列都去执行,看一张图可能更好理解:

![](https://access.redhat.com/site/documentation/resources/docs/en-US/Red_Hat_Enterprise_MRG/1.1/html/Messaging_User_Guide/images/topic-exchange.png)

对，Topic可以根据同类的属性进程通配, 你只需要routing key有'.'分割:比如上图中的usa.news, usa.weather, europe.news, europe.weather

3. Fanout Exchange

先想一下广播的概念, 在设想你有某个任务，相当耗费时间，但是却要求很高的实时性,那么你可以需要多台服务器的多个workers一起工作，每个服务器负担其中的一部分,但是celerybeat只会生成一个任务,被某个worker取走就没了,
所以你需要让每个服务器的队列都要收到这个消息.这里很需要注意的是:你的fanout类型的消息在生成的时候为多份,每个队列一份，而不是一个消息发送给单一队列的次数

####我的settings.py

这里只是相关于celery的部分:

```python
import djcelery
djcelery.setup_loader()

INSTALLED_APPS = (
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    #'django.contrib.staticfiles',
    'django.contrib.messages',
    # Uncomment the next line to enable the admin:
    'django.contrib.admin',
    'django.contrib.staticfiles',
    # Uncomment the next line to enable admin documentation:
    # 'django.contrib.admindocs',
    'dongwm.smhome',
    'dongwm.apply',
    'djcelery', # 这里增加了djcelery 也就是为了在django admin里面可一直接配置和查看celery
    'django_extensions',
    'djsupervisor',
    'django.contrib.humanize',
    'django_jenkins'
)

BROKER_URL = 'amqp://username:password@localhost:5672/yourvhost'

CELERY_IMPORTS = (
    'dongwm.smhome.tasks',
    'dongwm.smdata.tasks',
)

CELERY_RESULT_BACKEND = "amqp" # 官网优化的地方也推荐使用c的librabbitmq
CELERY_TASK_RESULT_EXPIRES = 1200 # celery任务执行结果的超时时间，我的任务都不需要返回结果,只需要正确执行就行
CELERYD_CONCURRENCY = 50 # celery worker的并发数 也是命令行-c指定的数目,事实上实践发现并不是worker也多越好,保证任务不堆积,加上一定新增任务的预留就可以
CELERYD_PREFETCH_MULTIPLIER = 4 # celery worker 每次去rabbitmq取任务的数量，我这里预取了4个慢慢执行,因为任务有长有短没有预取太多
CELERYD_MAX_TASKS_PER_CHILD = 40 # 每个worker执行了多少任务就会死掉，我建议数量可以大一些，比如200
CELERYBEAT_SCHEDULER = 'djcelery.schedulers.DatabaseScheduler' # 这是使用了django-celery默认的数据库调度模型,任务执行周期都被存在你指定的orm数据库中
CELERY_DEFAULT_QUEUE = "default_dongwm" # 默认的队列，如果一个消息不符合其他的队列就会放在默认队列里面

CELERY_QUEUES = {
    "default_dongwm": { # 这是上面指定的默认队列
        "exchange": "default_dongwm",
        "exchange_type": "direct",
        "routing_key": "default_dongwm"
    },
    "topicqueue": { # 这是一个topic队列 凡是topictest开头的routing key都会被放到这个队列
        "routing_key": "topictest.#",
        "exchange": "topic_exchange",
        "exchange_type": "topic",
    },
    "test2": { # test和test2是2个fanout队列,注意他们的exchange相同
        "exchange": "broadcast_tasks",
        "exchange_type": "fanout",
        "binding_key": "broadcast_tasks",
    },
    "test": {
        "exchange": "broadcast_tasks",
        "exchange_type": "fanout",
        "binding_key": "broadcast_tasks2",
    },
}

class MyRouter(object):

    def route_for_task(self, task, args=None, kwargs=None):

        if task.startswith('topictest'):
            return {
                'queue': 'topicqueue',
            }
        # 我的dongwm.tasks文件里面有2个任务都是test开头
        elif task.startswith('dongwm.tasks.test'):
            return {
                "exchange": "broadcast_tasks",
            }
        # 剩下的其实就会被放到默认队列
        else:
            return None

# CELERY_ROUTES本来也可以用一个大的含有多个字典的字典,但是不如直接对它做一个名称统配
CELERY_ROUTES = (MyRouter(), )
```



