---
layout: post
title: "迁移octpress,Rakefile修改以及豆瓣推荐,豆瓣收藏秀,新浪微博分享按钮等实现"
date: 2012-09-28 12:11
categories:
- ruby
tags:
- ruby
- octopress
comments: true
index: true
excerpted: true


---

####*前言*

首先感谢吴钊的[inove](http://www.neoease.com/inove),从博客建立就一直用它,昨天就开始研究迁移成octopress,以下是一些经验和总结

####1. octopress目录结构说明

#####首先看git出来的octopress目录结构:

```
├─ config.rb  #指定额外的compass插件
├─ config.ru  
├─ Rakefile   #rake的配置文件,类似于makefile,这个我修改了一些内容
├─ Gemfile    #bundle要下载需要的gem依赖关系的指定文件
├─ Gemfile.lock  #这些gem依赖的对应关系,比如A的x本依赖于B的y版本,我也修改了
├─ _config.yml  #站点的配置文件
├─ public/  #在静态编译完成后的目录,网站只需要这个目录下的文件树
├─ _deploy/  #deploy时候生成的缓存文件夹,和public目录一样
├─ sass/  #css文件的源文件,过程中会compass成css
├─ plugins/  #放置自带以及第三方插件的目录,ruby程序
│  └── xxx.rb
└─ source/  #这个是站点的源文件目录,public目录就是根据这个目录下数据生成的
   └─ _includes/
      └─ custom/  #自定义的模板目录,被相应上级html include
         └─ asides/  #边栏模板自定义模板目录
      └─ asides/  #边栏模板目录
      └─ post/  #文章页面相应模板目录
   └─ _layouts/  #默认网站html相关文件,最底层
   └─ _posts/  #新增以及从其它程序迁移过来的数据都存在这里
   └─ stylesheets/ #css文件目录
   └─ javascripts/  #js文件目录
```
<!-- more --> 

#####*我根据需要对它的修改*

    1. Rakefile的修改

```
  editor = "~/Sublime/sublime_text" #设置编辑器
  open(filename, 'w') do |post|
    post.puts "---"
    post.puts "layout: post"
    post.puts "title: \"#{title.gsub(/&/,'&amp;')}\""
    post.puts "date: #{Time.now.strftime('%Y-%m-%d %H:%M')}"
    post.puts "comments: true"
    post.puts "categories: "
    post.puts "---"
    system "sleep 1; #{editor} #{filename}"  #增加这行,表示使用new_post后自动用我上面open设置的编辑器打开这个文件
  end
end
```
```
  task :generate do
  raise "### You haven't set anything up yet. First run `rake install` to set up an Octopress theme." unless File.directory?(source_dir)
  puts "## Generating Site with Jekyll"
  system "compass compile --css-dir #{source_dir}/stylesheets"
  system "jekyll"
  cp_r "#{source_dir}/.htaccess", "#{public_dir}" #因为我的事wordpress迁移过来,其中图片目录需要重定向,所以使用.htaccess,但是默认不会自动拷贝
end
```
    2. 一个问题:在我使用默认的pygments.rb对python高亮编码出现这个报错:

```
  /Could not open library 'lib.so': lib.so: cannot open shared object file: No such file or directory (LoadError)
修改Gemfile.lock:
rubypython (0.6.1)  #从0.5.3修改掉
      blankslate (>= 2.1.2.3)
      ffi (~> 1.0.7)
gem uninstall rubypython
gem install rubypython --version 0.6.1
gem install pygments.rb
```


####2. 从wordpress主题inove迁移到octopress

#####这里我只说一些我的思路,其它的具体步骤请参看其它文章,我这里假设你有linux shell

    1.迁移网站文章

因为涉及中文,我用的是[wordpressdotcom.rb](https://gist.github.com/1394128),然后我把我的网站程序导出,使用自带的xml方式,生成一个文件,把它重命名为:wordpress.xml放在当前目录,然后执行:

```
dongwm@dongwm ~/octopress $ ruby -r './wordpressdotcom.rb' -e 'Jekyll::WordpressDotCom.process' #wordpressdotcom.rb文件路径要正确
```

这样就会在source/_post下生成你的文章内容,都是html文件类型

    2. 对这些文章文件修改

PS:因为wordpress都是使用插件支持高亮,并且p,pre很泛滥,比如我这里用过的高亮方式:
```
<p>[codesyntax lang="python"]
CODE
```

```
[cceW_bash width=”99%” height=”100%”]CODE
[/cceW_bash]
```

而我在octopress使用的是[SHJS](shjs.sourceforge.net),它的语法是:

```
<pre class="sh_python"></pre> #其中X语言就是sh_X
```

因为我有自己的独特性 我使用了如下shell程序完成修改,大家可以参照

```
dongwm@dongwm ~/octopress $ find source/_posts -name "*.html" -exec sed -i 's/<\/pre>//g' {} \;  #去掉</pre>
dongwm@dongwm ~/octopress $ find source/_posts -name "*.html" -exec sed -i 's/<pre>//g' {} \; #去掉<pre>
dongwm@dongwm ~/octopress $ find source/_posts -name "*.html" -exec sed -i 's/\[\/codesyntax\]/<\/pre>/g' {} \;  #把原来的修改成SHJS的</pre>
dongwm@dongwm ~/octopress $ find source/_posts -name "*.html" -exec sed -i 's/\[\/cceW_bash\]/<\/pre>/g' {} \; #把原来的修改成SHJS的</pre>
dongwm@dongwm ~/octopress $ find source/_posts -name "*.html" -exec sed -i 's/\[cceW_\(.*\) width=\"99\%\" height=\"100\%\"\]/<pre class=\"sh_\1\">/g' {} \;  #根据原来的原来类型修改成SHJS的相应类型
dongwm@dongwm ~/octopress $ find source/_posts -name "*.html" -exec sed -i 's/\[codesyntax lang=\"\(.*\)\"\]/<pre class=\"sh_\1\">/g' {} \;
dongwm@dongwm ~/octopress $ find source/_posts -name "*.html" -exec sed -i '/---/{x;s/^/./;/^\.\{2\}$/{x;s/.*/indexer: true\n---/;x};x;}' {} \;
dongwm@dongwm ~/octopress $ find source/_posts -name "*.html" -exec sed -i 's/<\/br>//g' {} \;  #去掉相关<br>
dongwm@dongwm ~/octopress $ find source/_posts -name "*.html" -exec sed -i 's/<br>//g' {} \;
dongwm@dongwm ~/octopress $ find source/_posts -name "*.html" -exec sed -i 's/<br \/>//g' {} \;
```

    3. 去掉twitter相关显示

因为我使用SHJS,需要在页面加载完毕后显示效果,但是因为'墙'造成其一直加载,所以只能在相关页面去掉:
修改_config.yml

```
# Twitter
twitter_user: dongweiming
twitter_tweet_count: 4
twitter_show_replies: false
twitter_follow_button: false #变成
twitter_show_follower_count: false
twitter_tweet_button: false #变成
```

修改source/_includes/post/sharing.html 去掉twitter那一段判断

    4. 修改head.html

```
wget http://shjs.sourceforge.net/css/sh_ide-anjuta.css
mv sh_ide-anjuta.css source/stylesheets/
wget http://shjs.sourceforge.net/sh_main.min.js
wget http://shjs.sourceforge.net/lang/sh_python.min.js
mv sh_python.min.js source/javascripts/
mv sh_main.min.js source/javascripts/
wget http://blog.neten.de//javascripts/jimdoclockzip.js
```

修改原始页面增加加载后显示高亮,source/_layouts/default.html

```
{% capture root_url %}{{ site.root | strip_slash }}{% endcapture %}
{% include head.html %}
<body {% if page.body_id %} id="{{ page.body_id }}" {% endif %} {% if page.sidebar == false %} class="no-sidebar" {% endif %} {% if page.sidebar == 'collapse' or site.sidebar == 'collapse' %} class="collapse-sidebar sidebar-footer" {% endif %} onload="sh_highlightDocument('', '.js');">
```

```
<script type="text/javascript" src="/javascripts/jimdoclockzip.js"></script>
<script type="text/javascript" src="/javascripts/sh_python.min.js"></script>
<script type="text/javascript" src="/javascripts/sh_main.min.js"></script>
<script type="text/javascript" src="/javascripts/sh_bash.min.js"></script>
<link href="/stylesheets/sh_ide-anjuta.css" rel="stylesheet" type="text/css">
```
其中包含了SHJS需要的js以及高亮显示的css,以及一个我网站的小玩笑-一个爱跑的时钟

    5. 增加分类标签云

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_bash">
git clone https://github.com/alswl/octopress-category-list
</pre></figure></notextile></div>
相应的请看README

    6. 增加导航栏
默认的就是blog和archives,请看我修改后的source/_includes/custom/navigation.html

```
<ul class="nav">
  <li><a href="{{ root_url }}/">博客主页</a></li>
  <li><a href="{{ root_url }}/blog/archives">文章列表</a></li>
  <li><a href="{{ root_url }}/blog/categories/关于我">关于</a></li>
</ul>
```
PS:迁移后,网站结构变了,路径根据_config.yml设置修改,以下是我的根目录下的.htaccess:

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_bash">
RewriteEngine On

RewriteBase /
RewriteRule "^wp-content/uploads/(.*)" http://www.dongwm.com/uploads/$1 [R=301,L,NC]  #主要自定义上传图片的路径
</pre></figure></notextile></div>

    7. 侧边栏显示豆瓣收藏,我自己弄了个页面:

https://github.com/dongweiming/octopress-douban_favorite_show

    8. 微博分享和豆瓣推荐

我对于前端也不熟.这里主要是定位iframe,放一个html文件,html文件包含相应的显示图标和js点击链接按钮
以下是我的source/_includes/post/sharing.html

```
  <div class="sharing">
  {% if site.weibo_share %}
  <span>
  <iframe
    width="55"
    scrolling="no"
    height="66"
    frameborder="0"
    src=
      "http://hits.sinajs.cn/A1/weiboshare.html?url={{ site.url }}{{ page.url }}&amp;appkey=site.weiboapp&amp;type=1&amp;{% if site.weibo_uid %}ralateUid={{ site.weibo_uid }}&amp;{% endif %}language=zh_cn" allowtransparency="true">
  </iframe>
  {% endif %}
  {% if site.douban_user %}
  <iframe
    width="55"
    scrolling="no"
    height="74"
    frameborder="0"
    src="/douban.html">
  </iframe>
  </span> 
  {% endif %}
  {% if site.google_plus_one %}
  <div class="g-plusone" data-size="{{ site.google_plus_one_size }}"></div>
  {% endif %}
  {% if site.facebook_like %}
    <div class="fb-like" data-send="true" data-width="450" data-show-faces="false"></div>
  {% endif %}
</div>
  <hr style="border-bottom:1px dotted #bdbabd;height:1px;border-top:0px;border-left:0px;border-right:0px;" />
```
其中douban.html:

```bash
<a href="javascript:void(function(){var d=document,e=encodeURIComponent,s1=window.getSelection,s2=d.getSelection,s3=d.selection,s=s1?s1():s2?s2():s3?s3.createRange().text:'',r='http://www.douban.com/recommend/?url='+e(d.location.href)+'&title='+e(d.title)+'&sel='+e(s)+'&v=1',x=function(){if(!window.open(r,'douban','toolbar=0,resizable=1,scrollbars=yes,status=1,width=450,height=330'))location.href=r+'&r=1'};if(/Firefox/.test(navigator.userAgent)){setTimeout(x,0)}else{x()}})()" ><img src="/douban.png" width=35 height=35 alt="推荐到豆瓣" /></a>
```

    9. 我的_config.yml文件:

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_bash">
# ----------------------- #
#      Main Configs       #
# ----------------------- #


url: http://www.dongwm.com
title: 小明明s à domicile
subtitle: 沉浸于linux艺术（首先是态度，然后再是技术）
author: Dongweiming
simple_search: http://google.com/search
description:

# Default date format is "ordinal" (resulting in "July 22nd 2007")
# You can customize the format as defined in
# http://www.ruby-doc.org/core-1.9.2/Time.html#method-i-strftime
# Additionally, %o will give you the ordinal representation of the day
date_format: "ordinal"

# RSS / Email (optional) subscription links (change if using something like Feedburner)
subscribe_rss: /atom.xml
subscribe_email:
# RSS feeds can list your email address if you like
email:

# ----------------------- #
#    Jekyll & Plugins     #
# ----------------------- #

# If publishing to a subdirectory as in http://site.com/project set 'root: /project'
root: /
permalink: /archives/:title/
source: source
destination: public
plugins: plugins
code_dir: downloads/code
category_dir: blog/categories  
category_title_prefix: "分类: "
markdown: rdiscount
pygments: True # default python pygments have been replaced by pygments.rb

paginate: 10          # Posts per page on the blog index
pagination_dir:  # Directory base for pagination URLs eg. /blog/page/2/
recent_posts: 5       # Posts in the sidebar Recent Posts section
excerpt_link: "继续阅读 &rarr;"  # "Continue reading" link text at the bottom of excerpted articles

titlecase: true       # Converts page and post titles to titlecase

default_asides: [asides/recent_posts.html,  asides/github.html, asides/delicious.html, asides/pinboard.html, asides/googleplus.html,custom/asides/category_cloud.html, custom/asides/douban.html, asides/article_total_sidebar.html]

page_asides: [custom/asides/indexer.html]
article_total: true
article_total_title: 文章统计
article_my_site_has: 本站共有
article_my_site_article : 篇文章
article_total_sidebar: true

# ----------------------- #
#   3rd Party Settings    #
# ----------------------- #

#QQ
qq_share: true

#Douban
douban_user: 62943420
douban_people: 小明明
douban_apikey: 0ec15d10bdd1901a2c4417323974b04e
douban_show:  #dolist,wishlist,collection 
douban_display_category: book|music #''(book music blog movie) format: movie|book|music
douban_display: random #favorite and ''(new add)
douban_total_show: 10
douban_percolumn: 2
douban_img_style: medium #''(small)
douban_hidelogo: true #''(false)
douban_hideself:  true #''(false)

# Weibo
weibo_uid: 1994497175
weibo_verifier: abd54ad9
weibokey: 2642268232
weibo_fansline: 0 
weibo_show: true 
weibo_pic: true 
weibo_skin: 10 
weibo_share: true 

# Github repositories
github_user: dongweiming
github_repo_count: 0
github_show_profile_link: true
github_skip_forks: true

# Twitter
twitter_user: dongweiming
twitter_tweet_count: 4
twitter_show_replies: false
twitter_follow_button: false
twitter_show_follower_count: false
twitter_tweet_button: false

</pre></figure></notextile></div>


    10. 我下一步的想法:
时间太短,没来得及做一些工作,节后我准备
        - 写个第三方分类插件bootstrap-theme
        - 写个第三方相关分享按钮的插件
        - 写个第三方相关登录的插件
        - 研究bootstrap-theme,对其进行一些修改和更新
