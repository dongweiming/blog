---
layout: post
title: "一个flask+mongoengine的site"
date: 2013-11-20 17:39
comments: true
categories:
- flask
- mongoengine
tags:
- flask
- mongoengine
- jquery
- d3
- pure
- amcharts
- toastr

---

####前言

最近一直学习emacs和elisp, 也在做关于mongodb相关的研究,闲来无事就做了个网站,后端使用了flask, mongoengine, 前端css框架用的是
雅虎的[pure](https://github.com/yui/pure), 还是用了神奇的[grunt](https://github.com/gruntjs/grunt)做页面修改的livereload, 然后有d3,
jquery, amchart和一个最近发现的页面消息弹出[toastr](https://github.com/CodeSeven/toastr).想学习flask和mongoengine的童鞋可直接拿去,开源地址是
[data-analysis](https://github.com/dongweiming/data-analysis)

####下载依赖和启动

```python
cd /path/to/data-analysis
pip install -r requirements.txt
# 安装grunt
npm install
# 我的后端样例数据
mongorestore -d fetch_data --directoryperdb dump/fetch_data
cd data_analysis
# 启动Grunt
grunt
# 启动
python run.py
# 然后打开 http://Youip:5000
```
