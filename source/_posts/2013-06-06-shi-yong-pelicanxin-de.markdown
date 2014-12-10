---
layout: post
title: "使用pelican心得"
date: 2013-06-06 23:32
comments: true
categories: 
- pelican
tags:
- pelican
- new_post
- gh-pages
- ghp-import

---

####前言

最近在用[pelican](http://getpelican.com/)借用[GitHub Pages](http://pages.github.com)搭建我的[小明明s Github](http://dongweiming.github.io), 总结了些心得

####写好Makefile

ruby有rake，但是python的好像没什么好用的，还是用Makefile，简单粗暴.先看用的

```
help:                                       
    @echo 'Makefile for a pelican Web site                                        '
    @echo '                                                                       '
    @echo 'Usage:                                                                 '
    @echo '   make html                        (re)generate the web site          '
    @echo '   make clean                       remove the generated files         '
                                                              
local:                                                           
    ./regen -q                                                  
github:-                                                       
    ./regen                                                   
    ghp-import -b master $(OUTPUTDIR)                        
    git push origin gh-pages:gh-pages-                      
    git push origin master:master                          
                                                          
.PHONY: help github local 

```

其中的regen是封装的脚本, 主要是为了加参数让我在本地生成html(其中的文件连接都指到我本地),然后我用python -m SimpleHTTPServer启动:

```
#!/usr/bin/env bash

set -e

quiet=""
output="output"
if [ "$1" = "-q" ] ; then
    shift
    quiet="1"
    output="output-local"
    export OVERRIDE_SITEURL=http://localhost:8000
fi

echo -n "regenerating..."
pelican content/ -o $output -s pelicanconf.py "$@"
echo done.

```

####我提交到github的方式

上面的脚本已经很明显了，我直接执行make github

其中的[ghp-import](http://github.com/davisp/ghp-import)的介绍很明显了:Easily import docs to your gh-pages branch

但是有个大坑: githubpages是要从你的项目的master分支去获取html页面，而不是gh-pages分支,所以Makefile我修改了下用法

####自动push不需要帐号密码

其实就是添加~./netrc

machine github.com
login XXX@gmail.com
password XXX

####可配置的创建文章

想想octopress的Rakefile，里面定义了一个new_post的方法，额pelican什么都没有，好吧，我用shell做了个

```
#!/bin/bash
category='设计模式'
title_resource='python设计模式之'
tags='Design Patterns'

while getopts ":c:r:g:s:t:" opt; do
  case $opt in
    c)
    category=$OPTARG
      ;;
    r)
    title_resource=$OPTARG
        ;;
    g)
    tags=$OPTARG
        ;;
    t)
    title=$OPTARG
        ;;
    s)
    slug=$PTARG
        ;;
    ?)
      echo "How to use: $0 [-c category] [-r title_resource] [-g tags] [-t title] [-s slug]" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done
test "x$title" = "x" && read -r -p "Post title [前缀是 ${title_resource}]> " && title=${REPLY}
test "x$slug" = "x" && read -r -p "Post slug [比如abstract-factory]> " && slug=${REPLY}
title=`echo $title | tr "[:upper:]" "[:lower:]"]`
title=`echo $title | tr -d "[:blank:]"`
slug=`echo $slug | tr " " "-"`
fileslug=`echo $slug | tr "-" '_'`
cur_date=`date "+%Y-%m-%d"`
filename="${category}/${fileslug}.md"
author=`git config --get user.name`
echo "Creating preview"
echo "_________________________________"
echo "filename: content/$filename"
echo "title: ${title_resource}${title}"
echo "slug: python-${slug}"
echo "date: ${cur_date}"
echo "category: ${category}"
echo "tags: ${tags}"
echo "_________________________________"
echo ""
read -r -p "Are you ready to create(Y or N) >"
reply=${REPLY}
reply=`echo $reply | tr "[:upper:]" "[:lower:]"]`
test "x$reply" != "xy" && exit 1
cat > "content/"$filename <<EOF
title: ${title_resource}${title}
slug: python-${slug}
date: ${cur_date}
category: ${category}
tags: ${tags}

EOF

$EDITOR "content/"$filename

```

####PS：以上脚本都可以到我的项目[dongweiming.github.io](https://github.com/dongweiming/dongweiming.github.io)的gh-pages分支去拿
