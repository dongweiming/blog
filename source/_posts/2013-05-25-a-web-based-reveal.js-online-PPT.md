---
layout: post
title: "仿slid.es的在线PPT编辑网站"
date: 2013-05-25 12:22
comments: true
categories: 
- reveal.js
- flask
- mongoengine
tags:
- hakimel
- python-social-auth
- reveal.js
- flask-script
- flask-login
- flask
- mongoengine

---


####前言

[slid.es](https://slid.es)是我最喜欢的前端之一[hakimel](https://github.com/hakimel)的作品，前身叫做rvl.io, 网站已经改版。源于去年年底在上家公司做年终总结PPT，对我这种不搞office，没有美感的小程序员太痛苦了，然后就找到了[reveal.js](https://github.com/hakimel/reveal.js), 后来萌发做个基于它的网站, 其实也是为了练手学习mongoengine和oauth

项目地址 [flask_reveal](https://github.com/dongweiming/flask_reveal)

####它能做什么

* 保存漂亮的在线PPT(我认为的)
* 记录浏览次数
* 多种主题和字体
* 可以把PPT私有化(默认是公开的)
* 自动保存修改
* 支持Bitbucket/Google/Github/Instagram/Linkdln/Trello/Tumblr/Stackoverflow oauth/oauth2登陆
* PPT预览

####使用了什么

* flask
* mongoengine (忍不了非orm)
* flask-script (像django那样的命令行启动)
* 前端js借用我做喜欢的原作者的90%，然后根据我的需要改动，css基本没动
* [python-social-auth](https://github.com/omab/python-social-auth)的oauth后端，但是它使用的是flask+sqlalchemy，不支持flask+mongoengine，我改写了这部分

####Usage

设置hosts文件

唉，本来申请了很多oauth想放在sae上面，但是遗憾的是新浪不支持，所以只能本地加hosts，让验证后的回调正确返回 linux 在你的/etc/hosts 文件里面添加一行

```
YOURIP   YOURDOMAIN
```

复制配置文件然后把你注册的ouauth放进去

```
cp settings.py.example settings.py
```

象django那样启动

```
python manage.py runserver -t 0.0.0.0 -p 80
```

And 访问主页`http://revealcn.sinaapp.com`


####使用nginx+uwsgi

这里是我的配置nginx的这段（假设你git clone 后在/home/dongwm/flask_reveal）

```
server {
		listen 80;
		server_name revealcn.sinaapp.com;

		access_log /var/log/nginx/revealcn.access_log main;
		error_log /var/log/nginx/revealcn.error_log info;
		location / {
                include uwsgi_params;
                uwsgi_pass unix:///tmp/uwsgi.sock;
        	}
		location /zongjie {
		root   /home/dongwm/flask_reveal;
		index index.html;
		}
	}

```

uwsgi的xml配置

```
<uwsgi>
     <pythonpath>/home/dongwm/flask_reveal</pythonpath>
     <module>manage</module>
     <socket>/tmp/uwsgi.sock</socket>    
    <callable>manager</callable>
     <master/>
     <processes>4</processes>       
     <memory-report/>
</uwsgi>
```

这里有个坑，我的gentoo的uwsgi安装后是有插件的，你需要这样启动

```
uwsgi_python27 -x uwsgi.xml 
```




