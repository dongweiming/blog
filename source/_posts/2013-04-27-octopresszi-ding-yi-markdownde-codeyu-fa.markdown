---
layout: post
title: "octopress自定义markdown的code语法"
date: 2013-04-27 14:17
comments: true
categories: 
- octopress
- ruby
tags:
- pygments_code.rb
- markdown
---


####前言

octopress自带的markdown语法高亮代码，最后展示在页面上的效果比较不友好-不能复制粘贴代码，不高亮，还有很丑的行数提示。
我一直使[SHJS](shjs.sourceforge.net),还算比较喜欢，但是以前每次都是编辑markdown文章，在使用

```python
```XX```
```

的时候，使用

```python
<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
XXX
</pre></figure></notextile></div>
```

这样的苦逼方式，最近实在是不了了，自定义octopress的解析过程

其实就是修改plugins/pygments_code.rb

```python
require 'pygments'
require 'fileutils'
require 'digest/md5'

PYGMENTS_CACHE_DIR = File.expand_path('../../.pygments-cache', __FILE__)
FileUtils.mkdir_p(PYGMENTS_CACHE_DIR)

module HighlightCode
  def highlight(str, lang)
    lang = 'ruby' if lang == 'ru'
    lang = 'objc' if lang == 'm'
    lang = 'perl' if lang == 'pl'
    lang = 'yaml' if lang == 'yml'
    str = pygments(str, lang).match(/<pre>(.+)<\/pre>/m)[1].to_s.gsub(/ *$/, '') #strip out divs <div class="highlight">
    tableize_code(str, lang)
  end

  def pygments(code, lang)
    if defined?(PYGMENTS_CACHE_DIR)
      path = File.join(PYGMENTS_CACHE_DIR, "#{lang}-#{Digest::MD5.hexdigest(code)}.html")
      if File.exist?(path)
        highlighted_code = File.read(path)
      else
        highlighted_code = Pygments.highlight(code, :lexer => lang, :formatter => 'html', :options => {:encoding => 'utf-8'})
        File.open(path, 'w') {|f| f.print(highlighted_code) }
      end
    else
      highlighted_code = Pygments.highlight(code, :lexer => lang, :formatter => 'html', :options => {:encoding => 'utf-8'})
    end
    highlighted_code
  end
  def tableize_code (str, lang = 'python') #主要是修改这个方法
    table = "<pre class='sh_#{lang}'>"
    str.lines.each_with_index do |line,index|
      table += "<span class='line'>#{line}</span>"
    end
    table += "</pre>"
  end
end
```

####使用方法

和过去一样，在md的文章中使用:

```python
```XX```
```

要是想指定某语言，需要先引用这个css，然后在md中
比如这里用bash语法（也是我的默认）

```
```bash
XX
\``` # 这里不能正常显示，加个反斜杠
```
