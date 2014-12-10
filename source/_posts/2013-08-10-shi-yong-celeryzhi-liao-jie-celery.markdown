---
layout: post
title: "使用celery之了解celery"
date: 2013-08-10 20:12
comments: true
categories:
- celery
tags:
- celery

---

####前言

我想很多做开发和运维的都会涉及一件事:crontab, 也就是在服务器上设定定时任务,按期执行一些任务.但是假如你有上千台的服务器，
你有上千种任务,那么对于这个定时任务的管理恐怕是一件很头疼的事情.哪怕你只是几十个任务分配的不同的机器上怎么样合理的管理和实现以下功能呢:

1. 查看定时任务的执行情况.比如执行是否成功，当前状态，执行花费的时间.
1. 一个友好的界面或者命令行下实现添加,删除任务
1. 怎么样简单实现不同的机器设定不同种任务,某些机器执行不同的队列
1. 假如你需要生成一个任务怎么样不阻塞剩下来的过程(异步了呗)
1. 怎么样并发的执行任务

####几种选择

1. 有钱有人有时间自己实现一套,优点是完全符合公司业务的需要,有专门的团队维护和服务
1. 使用[Gearman](http://gearman.org/),听说过没用过，因为是C/java/perl,对我们这种python开发者或者运维来说,假如没有这方面经验之后没有能力了解底层实现和二次开发的能力
1. 使用[rq](http://python-rq.org/), rq是搞gitflow的那个作者写的，简介里面说的很清楚:Simple job queues for Python. 怕它不够复杂,但是假如业务没有那么复杂或者应用不是那么严格，完全可以尝试下
1. 好吧我选择了[celery](https://github.com/celery/celery), 现在用了快半年，可能是历史遗留问题,版本较低.有很多坑.但是很不错

####消息队列

RabbitMQ,ZeroMQ这样的消息队列总是出现在我们视线中, 其实意义是很简单: 消息就是一个要传送的数据,celery是一个分布式的任务队列.这个"任务"其实就是一种消息,
任务被生成到队列中，被RabbitMQ等容器接收和存储，在适当的时候又被要执行的机器把这个消息取走.

celery任务可以使用RabbitMQ/Redis/SQLAlchemy/Django的orm/Mongodb等等容器(这里叫做Broker).我使用的是RabbitMQ,因为作者在github主页的介绍里面很明确的写了这个

所谓队列,你可以设想一个问题,我有一大推的东西要执行,但是我并不是需要每个服务器都执行这个任务,因为业务不同嘛. 所以就要做个队列, 比如任务A,B,C A可以在X,Y服务器执行,
但是不需要或者不能在Z服务器上执行.那么在X,Y你启动worker(下面会说，其实就是消费者和生产者的消费者)加上这个队列,Z服务器就不需要指定这个队列,也就不会执行这个队列的任务

#####celery的原理,我这里的角度是django+celery+django-celery

首先说一下流程:

1. 使用django-celery或者直接操作数据库(settings.py里面指定)添加任务,设置的相关属性(包含定时任务的间隔)存入数据库.
1. celerybeat通过djcelery.schedulers.DatabaseScheduler获取django内你设置的任务周期性的检查(默认5s),发现需要执行某任务讲其丢入你设置的broker(我这里是rabbitmq),他会更具settings.py的设置放到对应的队列
1. 在你启动了celery worker(以前是celeryd)的服务器上,根据worker也会定期(默认5s)去broker里面查找需要它执行的队列里面是否有任务
1. 当发现队列有要执行的任务,worker将它取出来执行,执行完的结果通过celerycam(默认30s,所以这个进程也要启动)写入django设置的数据库,更新了这个任务的状态.比如花费的时间

####supervisor进程管理

不知道有没有人用过[supervise](http://cr.yp.to/daemontools/supervise.html)，我以前经常在最初的项目开发中经常使用它监视我的程序,当程序死掉自动启动, [supervisor](https://github.com/Supervisor/supervisor)确是一个
进程管理的工具，我在这里使用它管理celery的程序和uwsgi

粘贴下我的一个本地环境的配置,并直接进行一下说明:

```python
;程序名字
[program:celery-queue-fetch]
;程序要执行的命令, -Q 指定了生成和接受任务的队列,多个用都好分开 -c为workr的数量,原意为并发数量
command=python /home/dongwm/work/manage.py celery worker -E --settings=settings_local --loglevel=INFO -Q fetch_ -c 30
;程序执行时候所在目录
directory=/home/dongwm/work/
;执行程序使用的用户
user=dongwm
;启动的程序的实例数,默认是1
numprocs=1
stdout_logfile=/home/dongwm/work/celerylog/celery.log
stderr_logfile=/home/dongwm/work/celerylog/celery.log
;在启动supervisor时候自动启动
autostart=true
;当程序可能因为某些原因没有启动成功会自动重启
autorestart=true
;启动的等待时候,我想是为了重启能杀掉原来进程预留的时间
startsecs=10
;进程发送停止信号等待os返回SIGCHILD的时间
stopwaitsecs=10
;低优先级的会首先启动最后关闭
priority=998
;以下2句是为了保证杀掉进程和其子进程而不会只杀死其控制的程序主进程而留下子进程变为孤立进程的问题
stopsignal=KILL
stopasgroup=true

[program:celery-queue-feed]
command=python /home/dongwm/work/manage.py celeryd -E --settings=settings_local --loglevel=INFO -Q feed
directory=/home/dongwm/work/
user=dongwm
numprocs=1
stdout_logfile=/home/dongwm/work/celerylog/celery.log
stderr_logfile=/home/dongwm/work/celerylog/celery.log
autostart=true
autorestart=true
startsecs=10
stopwaitsecs=10
priority=998
stopsignal=KILL
stopasgroup=true

[program:celerycam]
;任务快照的间隔时间为10s
command=python /home/dongwm/work/manage.py celerycam -F 10 --settings=settings_local
directory=/home/dongwm/work/
user=dongwm
numprocs=1
stdout_logfile=/home/dongwm/work/celerylog/celerycam.log
stderr_logfile=/home/dongwm/work/celerylog/celerycam.log
autostart=true
autorestart=true
startsecs=5
stopwaitsecs=5
priority=998
stopsignal=KILL
stopasgroup=true

[program:celerybeat]
command=python /home/dongwm/work/manage.py celerybeat --settings=settings_real_old --loglevel=DEBUG
directory=/home/dongwm/work/
user=dongwm
numprocs=1
stdout_logfile=/home/dongwm/work/celerylog/celery_beat.log
stderr_logfile=/home/dongwm/work/celerylog/celery_beat.log
autostart=true
autorestart=true
startsecs=10
priority=999
stopsignal=KILL
stopasgroup=true

;这是supervisor官方的一个监控进程状态异常退出的脚本,我对它进行了较大的修改,这样在程序奇怪退出的时候会给我发邮件
[eventlistener:crashmail]
command=python /home/dongwm/superlance/superlance/crashmail.py -a -m ciici123@163.com
events=PROCESS_STATE_EXITED

[program:uwsgi]
user = dongwm
numprocs=1
command=/usr/local/bin/uwsgi -s /tmp/uwsgi-sandbox.sock --processes 4  --enable-threads \
     --pythonpath /home/dongwm/uwsgi --buffer-size 32768 --listen 100 --daemonize /home/dongwm/ulog/uwsgi_out.log
directory=/home/dongwm/work
autostart=true
autorestart=true
redirect_stderr=true
stopsignal=KILL
stopasgroup=true
```

####nginx+uwsgi的实践

nginx进程数会直接影响性能, 如何使用到的模块不会出现阻塞式的调用，应该有多少cpu就配多少worker_processes,否则才需要配置更多的进程数.
比如你的用户大量读取你的本地静态文件，并且服务器上面内存较少，硬盘的I/O调用可能会阻塞worker少量时间,那么就要多配

为了更好利用多核的优势,我绑定了worker和对应的内核:

```python
worker_processes     4;
worker_cpu_affinity 0001 0010 0100 1000;
```
