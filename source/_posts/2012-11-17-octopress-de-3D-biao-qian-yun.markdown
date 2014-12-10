---
layout: post
title: "octopress的3D标签云插件"
date: 2012-11-17 14:22
comments: true
categories:
- ruby
tags:
- cumulus
- word-cumulus
- jsapi

---

####*前言*

最近看了《社交网站的数据挖掘与分析》，了解到关于谷歌可视化工具，正好有2次都说到了标签的3D展现，以前用wordpress的时候有个插件叫做wp-cumulus，而octopress里面有一个相应的标签插件，但是却是静态展示，一直不爽，然后就萌发了改一个3D的octoress标签云插件的想法，其中word cumulus借用了[谷歌api](https://www.google.com/jsapi)，ruby程序还是借以前的[topress-tagcloud](https://github.com/tokkonopapa/octopress-tagcloud)，思路参考了[word-cumulus-goog-vis](http://code.google.com/p/word-cumulus-goog-vis),我的设计是这样的如下：


<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_bash">

1. jekyll生成静态页面的时候，根据相关插件计算标签的地址，数量和标签内容
2. 将这些数据用json.dump的方式写入到一个json文件（因为octopress是静态页面，不能从数据库抓取数据）
3. 新增一个javascript脚本（需要添加到source/_includes/head.html，具体看我的后面的例子程序中的注释），实现调取谷歌可视化工具的接口，把数据写到swf文件中
4. 当打开网页的时候会调用jquery的getjson（我用的是.ajax）读取数据，将数据格式化，通过js脚本写入div（div所在的html已经放在边栏）


</pre></figure></notextile></div>



#####插件代码如下


<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
# encoding: utf-8

require 'json' #导入json依赖
require 'pathname'
  

module Jekyll 

  class TagCloud < Liquid::Tag  #标签云的类继承至Liquid::Tag，liquid是一个ruby的模版引擎，

    def initialize(tag_name, markup, tokens)
      @opts = {}
      if markup.strip =~ /\s*counter:(\w+)/i  #检查是否定义参数，没有的话不计算标签数量
        @opts['counter'] = ($1 == 'true') #哈希项的结果就是这个参数是否为true的布尔值
        markup = markup.strip.sub(/counter:\w+/i,'')
      end
      super
    end

    def render(context)
      lists = {}
      max, min = 1, 1
      config = context.registers[:site].config #内置检查站点配置
      category_dir = config['root'] + config['category_dir'] + '/' #标签基目录
      categories = context.registers[:site].categories
      categories.keys.sort_by{ |str| str.downcase }.each do |category| #标签根据小写字符串排序 挨个计算其存在数量
        count = categories[category].count
        lists[category] = count
        max = count if count > max
      end

      li = []
      lists.each do | category, counter |
        nli = []
        url = category_dir + category.gsub(/_|\P{Word}/, '-').gsub(/-{2,}/, '-').downcase
        nli[0] = category + '[' + categories[category].count.to_s + ']' #第一个参数是标签和数量的字符串
        nli[1] = url #第二个标签是标签集合的地址
        if @config['category_counter']
          nli[2] = categories[category].count
        else nli[2] = 8
        end
        li.push(nli)
      end
      f = File.open('%s/../source/javascripts/tag.json' % \
          Pathname.new(File.dirname(__FILE__)).realpath,'w') #操作文件
      f.puts(JSON.dump(li)) #写入数据
      f.close()
    end
  end

end

Liquid::Template.register_tag('tag_cloud', Jekyll::TagCloud)  #让标签生效


</pre></figure></notextile></div>



#####javascript代码如下

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_bash">

var json_data = (function () {
    var json = null;
    $.ajax({   //通过jquery方法获取json文件的数据
        'async': false,
        'global': false,
        'url': '/javascript/tag.json',  //这里地址是错误的，因为静态页面会把握的标签当成真实环境，其实是javascripts，具体代码请看github项目
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
})(); 
      google.setOnLoadCallback(drawVisualization);  //设定可视化load后调用函数

    function drawVisualization() {

        var data = new google.visualization.DataTable(); //创建数据表
        data.addColumn('string', 'Tag'); //加三个字段
        data.addColumn('string', 'URL'); 
        data.addColumn('number', 'Font size');

        data.addRows(json_data.length);  //确定标签的数量
        for (var i = 0; i < json_data.length; i++) {
            var url = window.location.href + json_data[i][1];
            data.setCell(i, 0, json_data[i][0]); // 标签
            data.setCell(i, 1, url); // 标签的真实集合url
            data.setCell(i, 2, 2+1.5*json_data[i][2]); // 标签字体大小
        }

        var vis = new gviz_word_cumulus.WordCumulus(document.getElementById('tag-clouds'));  //找到id为‘tag-clou’的div，这里数据也有问题，原因如上

        vis.draw(data, {text_color: '#00ff00', speed: 50, width:220, height:220});  //画图  注意，修改效果云的大小在这里制定 我这里宽高都是220px
       }

</pre></figure></notextile></div>


#####被包含的html代码如下(我放在了source/_includes/custom/asides/category_cloud.html)


<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_bash">
<xmp>
<section class="well">  //这个主要根据你的主题而定吧，我的主题右边栏的风格都是这样
   <ul id="gh_repos" class="nav">
    <li class="nav-header">标签Cloud</li>
  </ul>
  <div id="tag-clou">{% tag_cloud counter:true %}</div>   //{% tag_cloud [counter:true] %} 制定counter为true就会根据你的标签符合的文章数对画图效果显示的该标签字体大小比例而定，不指定或者制定其他值都按照一个字体大小显示所有标签
</section>
</xmp>        
        
并且将这个html放在默认的右边栏的配置中，修改_config.yaml，其中：

default_asides: [asides/recent_posts.html, custom/asides/links.html, asides/github.html, asides/delicious.html, asides/pinboard.html, asides/googleplus.html,custom/asides/category_cloud.html, custom/asides/douban.html, asides/article_total_sidebar.html]            


</pre></figure></notextile></div>


#####剩下就是修改你的主页的html（我直接修改了head.html[source/_includes/head.html],愿意的话你可以修改源码的foot.html甚至其它，只要保证它在jquery加载之后加载就好，我只粘贴新增的一部分和它附近的内容）

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_bash">

<xmp>
  <script src="{{ root_url }}/javascripts/libs/bootstrap.js"></script>
  <script src="{{ root_url }}/javascripts/octopress.js" type="text/javascript"></script>  //原来就有
  <script type="text/javascript" src="/javascripts/api.js"></script>  //这里是谷歌的jsapi，我直接保存在我脚本里面，因为谷歌可能访问不稳定，你懂得
  <script type="text/javascript" src="/javascripts/wordcumulus.js"></script> //这是操作word-cumulus的
  <script type="text/javascript" src="/javascripts/swfobject.js"></script> //这里是操作wp-cumulus的flash文件的
  <script type="text/javascript" src="/javascripts/tagcumulus.js"></script> //这是我新建的上述js脚本地址
  <link href="{{ site.subscribe_rss }}" rel="alternate" title="{{site.title}}" type="application/atom+xml"> //原来就有
</xmp>

</pre></figure></notextile></div>



打包相关文件以及详情请参看我的github项目：[octopress-wp_cumulus_for_tagcloud](https://github.com/dongweiming/octopress-wp_cumulus_for_tagcloud)
