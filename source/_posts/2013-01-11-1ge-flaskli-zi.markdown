---
layout: post
title: "一个flask例子"
date: 2013-01-11 14:34
comments: true
categories: 
- flask
- python
tags:
- flask
- jinja2
- python

---


####前言：

上段时间做了个demo, 使用了flask和mongodb，以及bootstrap, jquery，分享给大家当作入门flask的例子


####启动程序代码

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
#!/usr/bin/env python2
# encoding=utf-8
# Version 2 by Dongwm 2012/12/18

import os
from pymongo import Connection

from flask import Flask, request, render_template, redirect, url_for, jsonify
from paginate import Pagination
import setting

def static(filename):
    filepath = os.path.join(os.path.dirname(__file__), 'static', filename)
    last_modification = '%d' % os.path.getmtime(filepath)
    return url_for('.static', filename=filename) + '?' + last_modification  #我这里给每个文件加了一个唯一性质的时间戳

def create_app():
    app = Flask(__name__)
    app.config.from_object(setting)  #把一些可以控制的参数放在setting模块里面
    @app.context_processor
    def inject_static():
        return dict(static=static)
    return app

def conMongo(): #因为我很多地方都需要mongodb的游标，封装了下
	mongo = Connection(host='127.0.0.1',port=28012)
	return mongo

app = create_app()

@app.route('/list')  #flask使用装饰器的作为路由方式 表示访问你网站（比如http://localhost/list）的请求都会通过这个函数处理
def list(): #函数名字不重要，只要你能理解好维护，通过名字了解用途就好
	pagesize = 100  
	page = int(request.args.get('page',0))
	data = get_list_MongoData(page, pagesize) #这个获得mongodb的函数我就不提供了 简单理解就是更具页数和每页条目获取数据
	pagination = Pagination(total=data[1], per_page=pagesize, page=page)
	return render_template("list.html", tables=data[0], pagination=pagination) #有点像django的render_to_response,但是flask直接把要渲染的数据用K=V的方式传进来，而django需要放在字典里面，作为第二个参数传

@app.route('/')  
def index():
	return redirect(url_for('list')) #到网站跟目录的请求定向到/list

@app.route('/json')  
def getJson():

	db = conMongo()
	res = results(db)
	return jsonify(res)  #类似django的HttpResponse(simplejson.dumps(res), mimetype='application/json') 返回json数据

@app.route('/dev')
def dev():
	
	return render_template("dev.html")

if __name__ == '__main__':
	app.run(host="0.0.0.0")

</pre></figure></notextile></div>

####settings.py

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
DEBUG = True  #指定开启debug模式
PORT = 5000  #指定监听端口
</pre></figure></notextile></div>

####dev.html

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">


<xmp>
<!-- 注意这段代码我把 {/}和%分开了 为了和octoress生成的模板语法不冲突-->
{ % extends 'base.html' % }  //这里是先继承base.html模板 
{ % block title %}Dev{ % endblock % }  //重新设定title块的内容
{ %- block css % }  //重新设定css块  注意引用静态文件的方式
    <link rel="stylesheet" href="{{ static(filename='css/devstyle.css') }}" />
    <style>
	.col_content{ height:500px; }
	h2 {text-align:center;}
	</style>
{ %- endblock % }
{ %- block js % }
    <script type="text/javascript" src="{{ static(filename='js/amcharts.js') }}"></script>
    <script type="text/javascript" src="{{ static(filename='js/raphael.js') }}"></script>
    <script language="javascript" type="text/javascript">
		</script>
		{ %- endblock % }
		{ %- block diejs % }
			pie2html();  //这个js函数在core.js定义（base.html有引用）
		{ %- endblock % }
		{ %- block dev % }
	<div>
		<h2>服务器服务信息</h2>
		<div class="well col_content" id="webserver_content">
		Loading......
		</div>
		<h2>服务器应用信息</h2>
		<div class="well col_content" id="webapp_content">
		Loading......
		</div>
		<h2>Nginx服务具体版本</h2>
		<div class="well col_content" id="nginx_content">
		Loading......
		</div>
		<h2>Apache服务具体版本</h2>
		<div class="well col_content" id="apache_content">
		Loading......
		</div>
		<h2>Asp服务具体版本</h2>
		<div class="well col_content" id="asp_content">
		Loading......
		</div>
		<h2>网站技术信息</h2>
		<div class="well col_content" id="tech_content">
		Loading......
		</div>
		<h2>系统分类</h2>
		<div class="well col_content" id="system_content">
		Loading......
		</div>
		<h2>系统分类</h2>
		<div class="well col_content" id="version_content">
		Loading......
		</div>
		<h2>os</h2>
		<div class="well col_content" id="os_content">
		Loading......
		</div>
	</div>
{ %- endblock % }
</xmp>

</pre></figure></notextile></div>

	
####base.html

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">

<xmp>
<!doctype html>
<html>
  <head>
    <title> { % block title % }{ % endblock % }</title>  //block会设置的一个块，每个模板文件要是重新定义会覆盖，否则继承它的值
    <link rel="stylesheet" href="{{ static(filename='css/bootstrap.css') }}" />
    <link rel="stylesheet" href="{{ static(filename='css/bootstrap-responsive.css') }}" />  
    <link rel="stylesheet" href="{{ static(filename='css/style.css') }}" />
    { %- block css % }
    { %- endblock % }
    <script type="text/javascript" src="{{ static(filename='js/jquery-1.8.0.min.js') }}"></script>
    <script type="text/javascript" src="{{ static(filename='js/core.js') }}"></script>
    { %- block js % }
    { %- endblock % }
	<script language="javascript" type="text/javascript">
		$(document).ready(function() {
		var i = 0;
		$('#control').click(function() {
				if(i%2 == 0) {
					$('#zt-user').slideDown(500);  //加载完成的一个特效,都在style.css中定义
					$('#control').removeClass('bkg-control-down').addClass('control-up');
				}
				else {
					$('#zt-user').slideUp(500);
					$('#control').removeClass('bkg-control-up').addClass('control-down');
				}
				i++;
		});
		{ %- block diejs % }  //这个块定义在这里是为了每个模板文件都能定义文档加载完成执行的函数，一个页面只能有一个$(document).ready
		{ %- endblock % }
		</script>
</head>
	<body>
		<div id="zt-user">
			<div class="container">
				<div id="zt-user-inner" class="row-fluid">
					<div id="zt-top1" class="span12">
						<div class="zt-box-inside">
							<div class="moduletable">
								<div class="modulecontent">
						<form action="/" method="post">
							<div class="search">
								<input name="searchword" maxlength="20"  class="inputbox" type="text" size="20" value="Start Searching ... "  onblur="if (this.value=='') this.value='Start Searching ... ';" onfocus="if (this.value=='Start Searching ... ') this.value='';" /><input type="submit" value="Search" class="button" onclick="this.form.searchword.focus();"/>
							</div>
						</form>
								</div>
							</div>
						</div>
					</div>																		
				</div>
			</div>
		</div>
		{ %- block dev % }{ %- endblock % }   //上面的dev.html重新声明了这个块，那么数据就会显示在这个位置
		{ %- block top % }
		<div id="zt-top">
			<div class="container">						
				<div class="row-fluid">
					<div class="control-up span6" id="control"><span>Search</span></div>
				<ul id="zt-topright" class="pull-right">
				<li class="blue" target="_blank"><a title="Demo" href="/list">列表</a></li>
				<li class="green" target="_blank"><a title="Demo" href="/dev">画图</a></li>
				</ul>
					</div>
				</div>
			</div>
		{ %- endblock % }
		{ %- block ttable % }{ %- endblock % }
		{ %- block footer % }
		<div id="zt-footer">
			<div class="container">				
				<p id="copyright">
				Copyright &copy; 2009 - 2013 <a href="http://www.dongwm.com" title="dongwm">(C)dongwm</a>. All Rights Reserved
				</p>
			</div>						
		</div>
		{ %- endblock % }
	</body>
</html>
</xmp>

</pre></figure></notextile></div>

