---
layout: post
title: "speakerdeck"
date: 2014-04-18 16:49
comments: true
categories:
- python
- tornado
- celery
- restapi
- expect
tags:
- python
- tornado
- celery
- restapi
- expect
- portforward

---

#### 前言

今天是在Ad的最后一天,本来准备了一个分享.关于业务中一些吐槽和我一些trick的用法, 有兴趣的可以下载[speakerdeck](https://github.com/dongweiming/speakerdeck)

#### 主题

1. celery celery2/celery3, py-amqp, kombu的用法, celery和djangocelery的集合
2. expect 使用expect自动登录复杂的服务器
3. mapreduce 一个并行处理文件的例子,说明使用python跑mapreduce多么厉害
4. portforward 端口转发
5. restapi 我眼中的restapi(pdf)
6. tornado 使用tornado一部非阻塞

演示的tmux脚本:

```
#!/bin/bash
SESSION=$USER
COMMAND='http Space http://localhost:8000/sleep'

tmux new-session -d -s $SESSION

tmux new-window -t $SESSION -n 'Logs'
tmux split-window -h
tmux select-pane -t 0
tmux send-keys $COMMAND C-m
tmux select-pane -t 1
tmux send-keys $COMMAND C-m
tmux split-window -v
tmux send-keys $COMMAND C-m
tmux select-pane -t 0
tmux split-window -v
tmux send-keys $COMMAND C-m
# Attach to session
tmux attach-session -t $SESSION
```
