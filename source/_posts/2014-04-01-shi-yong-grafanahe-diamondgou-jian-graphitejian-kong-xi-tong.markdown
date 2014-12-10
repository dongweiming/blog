---
layout: post
title: "使用grafana和Diamond构建Graphite监控系统"
date: 2014-04-01 13:56
comments: true
categories:
- grafana
- Diamond
- Graphite
tags:
- grafana
- Diamond
- Graphite

---

#### 前言

在豆瓣开源项目里面有个[graph-index](https://github.com/douban/graph-index), 提供监控服务器的状态的目录索引,基于[graph-explorer](https://github.com/vimeo/graph-explorer). 类似衍生物很多,就包括我要说的本文用到的项目.先看看我的测试环境的几个截图


![](https://cloud.githubusercontent.com/assets/841395/9101045/7a64742a-3c14-11e5-92e7-012c713596e3.png)
![](https://cloud.githubusercontent.com/assets/841395/9101046/7a6a2ec4-3c14-11e5-8aeb-0158c20e8c6b.png)


#### 一些关键词说明

1. graphite-web # graphite组件之一, 提供一个django的可以高度扩展的实时画图系统
2. Whisper # graphite组件之一, 实现数据库存储. 它比rrdtool要慢，因为whisper是使用python写的，而rrdtool是使用C写的。然而速度之间的差异很小
3. Carbon # 数据收集的结果会传给它, 它会解析数据让它可用于实时绘图. 它默认可会提示一些类型的数据,监听2003和2004端口
4. [Diamond](https://github.com/BrightcoveOS/Diamond) # 他是一个提供了大部分数据收集结果功能的结合,类似cpu, load, memory以及mongodb,rabbitmq,nginx等指标.这样就不需要我大量的写各种类型,因为它都已经提供,并且它提供了可扩展的自定义类型(最后我会展示一个我自己定义的类型)
5. [grafana](https://github.com/torkelo/grafana) # 这个面板是基于node, [kibana](https://github.com/elasticsearch/kibana),并且可以在线编辑. 因为是kibana,所以也用到了开元搜索框架[elasticsearch](https://github.com/elasticsearch/elasticsearch)

PS: 其他工具可以参考这里[Tools That Work With Graphite](http://graphite.readthedocs.org/en/1.0/tools.html)

#### 原理解析

我没有看实际全部代码,大概的流程是这样的:

1. 启动Carbon-cache等待接收数据(carbon用的是twisted)
2. 启动graphite-web给grafana提供实时绘图数据api
3. 启动grafana,调用graphite-web接口获取数据展示出来
4. Diamond定期获取各类要监测的类型数据发给carbon(默认是5分钟,默认一小时自动重载一次配置)

#### 实现我这个系统需要做的事情

##### 安装graphite相关组件(我这里用的是centos)

```
yum --enablerepo=epel install graphite-web python-carbon -y
```

###### 安装grafana需要的组件

```
# 增加elasticsearch的repo:
sudo  rpm --import http://packages.elasticsearch.org/GPG-KEY-elasticsearch
$cat /etc/yum.repos.d/elasticsearch.repo
[elasticsearch-1.0]
name=Elasticsearch repository for 1.0.x packages
baseurl=http://packages.elasticsearch.org/elasticsearch/1.0/centos
gpgcheck=1
gpgkey=http://packages.elasticsearch.org/GPG-KEY-elasticsearch
enabled=1
sudo yum install nginx nodejs npm java-1.7.0-openjdk elasticsearch -y
```

##### 下载Diamond和grafana

```
git clone https://github.com/torkelo/grafana
cd grafana
sudo npm install
sudo pip install django-cors-headers configobj # 这可能因为我环境中已经有了一些模块，看缺什么安装什么
git clone https://github.com/BrightcoveOS/Diamond
cd Diamond
```
##### 开始修改配置

1. 添加cors支持

在/usr/lib/python2.6/site-packages/graphite/app_settings.py:

INSTALLED_APPS里面添加corsheaders, MIDDLEWARE_CLASSES里面添加'corsheaders.middleware.CorsMiddleware'

2. 使用nginx使用grafana

在nginx.conf 添加类型的一段配置

```
server {
  listen                *:80 ;

  server_name           monitor.dongwm.com; # 我用了虚拟主机
  access_log            /var/log/nginx/kibana.myhost.org.access.log;

  location / {
    add_header 'Access-Control-Allow-Origin' "$http_origin";
    add_header 'Access-Control-Allow-Credentials' 'true';
    root  /home/operation/dongwm/grafana/src;
    index  index.html  index.htm;
  }

  location ~ ^/_aliases$ {
    proxy_pass http://127.0.0.1:9200;
    proxy_read_timeout 90;
  }
  location ~ ^/_nodes$ {
    proxy_pass http://127.0.0.1:9200;
    proxy_read_timeout 90;
  }
  location ~ ^/.*/_search$ {
    proxy_pass http://127.0.0.1:9200;
    proxy_read_timeout 90;
  }
  location ~ ^/.*/_mapping$ {
    proxy_pass http://127.0.0.1:9200;
    proxy_read_timeout 90;
  }

  # Password protected end points
  location ~ ^/kibana-int/dashboard/.*$ {
    proxy_pass http://127.0.0.1:9200;
    proxy_read_timeout 90;
    limit_except GET {
      proxy_pass http://127.0.0.1:9200;
      auth_basic "Restricted";
      auth_basic_user_file /etc/nginx/conf.d/dongwm.htpasswd;
    }
  }
  location ~ ^/kibana-int/temp.*$ {
    proxy_pass http://127.0.0.1:9200;
    proxy_read_timeout 90;
    limit_except GET {
      proxy_pass http://127.0.0.1:9200;
      auth_basic "Restricted";
      auth_basic_user_file /etc/nginx/conf.d/dongwm.htpasswd;
    }
  }
```

3. 修改grafana的src/config.js:

graphiteUrl: "http://"+window.location.hostname+":8020", # 下面会定义graphite-web启动在8020端口

4. 修改Diamond的配置conf/diamond.conf

```
cp conf/diamond.conf.example conf/diamond.conf
```

主要修改监听的carbon服务器和端口,以及要监控什么类型的数据,看我的一个全文配置

```
################################################################################
# Diamond Configuration File
################################################################################

################################################################################
### Options for the server
[server]

# Handlers for published metrics.
handlers = diamond.handler.graphite.GraphiteHandler, diamond.handler.archive.ArchiveHandler

# User diamond will run as
# Leave empty to use the current user
user =

# Group diamond will run as
# Leave empty to use the current group
group =

# Pid file
pid_file = /home/dongwm/logs/diamond.pid # 换了pid的地址,因为我的服务都不会root启动

# Directory to load collector modules from
collectors_path = /home/dongwm/Diamond/src/collectors # 收集器的目录,这个/home/dongwm/Diamond就是克隆代码的地址

# Directory to load collector configs from
collectors_config_path = /home/dongwm/Diamond/src/collectors

# Directory to load handler configs from
handlers_config_path = /home/dongwm/Diamond/src/diamond/handler

handlers_path = /home/dongwm/Diamond/src/diamond/handler

# Interval to reload collectors
collectors_reload_interval = 3600 # 收集器定期会重载看有没有配置更新

################################################################################
### Options for handlers
[handlers]

# daemon logging handler(s)
keys = rotated_file

### Defaults options for all Handlers
[[default]]

[[ArchiveHandler]]

# File to write archive log files
log_file = /home/dongwm/logs/diamond_archive.log

# Number of days to keep archive log files
days = 7

[[GraphiteHandler]]
### Options for GraphiteHandler

# Graphite server host
host = 123.126.1.11

# Port to send metrics to
port = 2003

# Socket timeout (seconds)
timeout = 15

# Batch size for metrics
batch = 1

[[GraphitePickleHandler]]
### Options for GraphitePickleHandler

# Graphite server host
host = 123.126.1.11

# Port to send metrics to
port = 2004

# Socket timeout (seconds)
timeout = 15

# Batch size for pickled metrics
batch = 256

[[MySQLHandler]]
### Options for MySQLHandler

# MySQL Connection Info 这个可以你的会不同
hostname    = 127.0.0.1
port        = 3306
username    = root
password    =
database    = diamond
table       = metrics
# INT UNSIGNED NOT NULL
col_time    = timestamp
# VARCHAR(255) NOT NULL
col_metric  = metric
# VARCHAR(255) NOT NULL
col_value   = value

[[StatsdHandler]]
host = 127.0.0.1
port = 8125

[[TSDBHandler]]
host = 127.0.0.1
port = 4242
timeout = 15

[[LibratoHandler]]
user = user@example.com
apikey = abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz01

[[HostedGraphiteHandler]]
apikey = abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopqrstuvwxyz01
timeout = 15
batch = 1

# And any other config settings from GraphiteHandler are valid here

[[HttpPostHandler]]

### Urp to post the metrics
url = http://localhost:8888/
### Metrics batch size
batch = 100


################################################################################
### Options for collectors
[collectors]
[[TencentCollector]] # 本来[collectors]下试没有东西的,这个是我定制的一个类型
ttype = server
[[MongoDBCollector]] # 一般情况,有一些类型是默认enabled = True,也就是启动的,但是大部分是默认不启动《需要显示指定True
enabled = True
host = 127.0.0.1 # 每种类型的参数不同
[[TCPCollector]]
enabled = True
[[NetworkCollector]]
enabled = True
[[NginxCollector]]
enabled = False # 没开启nginx_status 开启了也没用
[[ SockstatCollector]]
enabled = True
[[default]]
### Defaults options for all Collectors

# Uncomment and set to hardcode a hostname for the collector path
# Keep in mind, periods are seperators in graphite
# hostname = my_custom_hostname

# If you prefer to just use a different way of calculating the hostname
# Uncomment and set this to one of these values:

# smart             = Default. Tries fqdn_short. If that's localhost, uses hostname_short

# fqdn_short        = Default. Similar to hostname -s
# fqdn              = hostname output
# fqdn_rev          = hostname in reverse (com.example.www)

# uname_short       = Similar to uname -n, but only the first part
# uname_rev         = uname -r in reverse (com.example.www)

# hostname_short    = `hostname -s`
# hostname          = `hostname`
# hostname_rev      = `hostname` in reverse (com.example.www)

# hostname_method = smart

# Path Prefix and Suffix
# you can use one or both to craft the path where you want to put metrics
# such as: %(path_prefix)s.$(hostname)s.$(path_suffix)s.$(metric)s
# path_prefix = servers
# path_suffix =

# Path Prefix for Virtual Machines
# If the host supports virtual machines, collectors may report per
# VM metrics. Following OpenStack nomenclature, the prefix for
# reporting per VM metrics is "instances", and metric foo for VM
# bar will be reported as: instances.bar.foo...
# instance_prefix = instances

# Default Poll Interval (seconds)
# interval = 300

################################################################################
### Options for logging
# for more information on file format syntax:
# http://docs.python.org/library/logging.config.html#configuration-file-format

[loggers]

keys = root

# handlers are higher in this config file, in:
# [handlers]
# keys = ...

[formatters]

keys = default

[logger_root]

# to increase verbosity, set DEBUG
level = INFO
handlers = rotated_file
propagate = 1

[handler_rotated_file]

class = handlers.TimedRotatingFileHandler
level = DEBUG
formatter = default
# rotate at midnight, each day and keep 7 days
args = ('/home/dongwm/logs/diamond.log', 'midnight', 1, 7)

[formatter_default]

format = [%(asctime)s] [%(threadName)s] %(message)s
datefmt =
```

##### 启动相关服务

```
sudo /etc/init.d/nginx reload
sudo /sbin/chkconfig --add elasticsearch
sudo service elasticsearch start
sudo service carbon-cache restart
sudo python /usr/lib/python2.6/site-packages/graphite/manage.py runserver 0.0.0.0:8020 # 启动graphite-web到8020端口
```

###### 在每个要搜集信息的agent上面安装Diamond,并启动:

```
cd /home/dongm/Diamond
python ./bin/diamond --configfile=conf/diamond.conf

# PS: 也可以添加 -l -f在前台显示
```

##### 自定义数据搜集类型，也就是上面的TencentCollector

```
# coding=utf-8

"""
获取腾讯微博爬虫的业务指标
"""

import diamond.collector
import pymongo
from pymongo.errors import ConnectionFailure


class TencentCollector(diamond.collector.Collector): # 需要继承至diamond.collector.Collector
    PATH = '/home/dongwm/tencent_data'

    def get_default_config(self):
        config = super(TencentCollector, self).get_default_config()
        config.update({
            'enabled':  'True',
            'path':     'tencent',
            'method':   'Threaded',
            'ttype':    'agent' # 服务类型 包含agent和server
        })
        return config

    def collect(self):
        ttype = self.config['ttype']
        if ttype == 'server':
            try:
                db = pymongo.MongoClient()['tmp']
            except ConnectionFailure:
                return
            now_count = db.data.count()
            try:
                last_count = db.diamond.find_and_modify(
                    {}, {'$set': {'last': now_count}}, upsert=True)['last']
            except TypeError:
                last_count = 0
            self.publish('count', now_count)
            self.publish('update', abs(last_count - now_count))
        if ttype == 'agent':
            # somethings..........
```

##### 添加你要绘图的类型. 这个就是打开grafana, 添加不同的row.给每个添加panel.选择metric的类型就好了
