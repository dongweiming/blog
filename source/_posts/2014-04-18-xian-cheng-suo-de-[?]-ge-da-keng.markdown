---
layout: post
title: "线程锁的一个大坑"
date: 2014-04-18 16:56
comments: true
categories:
- python
tags:
- threading
- Lock
---

#### 前言

原来的一位同事@炮哥, 昨天在QQ问我: "想请教下一个线程获得lock之后，也可能被其他的线程释放掉？这个是因为线程之间的资源是共享的吗？这样的话普通的thread lock 都是不安全的了？". 我第一反应就是怎么可能:'谁加锁谁解锁呗,别的线程怎么能解锁？'

炮哥发来一段python官网的文档说明:

```
A factory function that returns a new primitive lock object. Once a thread has acquired it, subsequent attempts to acquire it block, until it is released; any thread may release it.
```

最有最后一句前是分号. 简单地说,一个线程获取锁, 以后的尝试获取都会被阻塞,除非它会释放. 但是**同时**其他其他线程可以释放

好,写个例子验证下:

```
import threading
import time

lock = threading.Lock()

def lock_holder(lock):
    print('Starting')
    while True:
        lock.acquire()
        print('Holding')
        time.sleep(100)
        print('Sleep done')

def lock_release(lock):
    time.sleep(1) # 保证顺序
    lock.release()
    print('Release it')


holder = threading.Thread(target=lock_holder, args=(lock,), name='LockHolder')
holder.setDaemon(True)
holder.start()

#lock_release(lock)
release = threading.Thread(target=lock_release, args=(lock,), name='release')
release.start()

holder = threading.Thread(target=lock_holder, args=(lock,), name='LockHolder')
holder.setDaemon(True)
holder.start()
```

奇迹发生了.... 线程b果然可以释放线程a的锁,颠覆人生观啊.

PS: 但是Rlock不会被其他线程释放,因为它记录该线程的所有者
