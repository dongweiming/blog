---
layout: post
title: "关于expect研究(四)"
date: 2013-04-11 17:11
comments: true
categories: 
- expect
tags:
- expect
---

前言
=======

最近又开始开始了expect的一些更深层次的东西，分享出来

字典
----

expect没有严格意义的字典，但是确实可以使用

创建字典:

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
set mydict [dict create tbj tbjpass server serverpass]
它表示创建一个字典叫做mydict，包含2个kv对：tbj & tbjpass 和server & serverpass
</pre></figure></notextile></div>

你也可以这样添加数据:

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
set mydict .dongwm dongwmpass 
 表示添加一个键为.dongwm 值为dongwmpass的新数据到mydict
</pre></figure></notextile></div>

根据key获取值可以这样:

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
[dict get $mydict server]
表示从mydict获取server的值
</pre></figure></notextile></div>

NB的事，可以直接这样写，看我的片段:

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
expect "password:"
send "[dict get $mydict s70]\n"
也就是直接把这个看起来像列表的东东直接写到字符串里面
</pre></figure></notextile></div>

判断变量是否存在
--------------

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
if {[info exists serverpass]!=1} {
    puts 'sd'
}
表示如果serverpass这个变量要是不存在，就puts，但是注意的是，
假如上面你已经set 这个变量，不管有没有值，这个变量都已经被*定义*了
</pre></figure></notextile></div>

判断列表包含
-----------

一种使用switch结构，还有一种是if方式，将属于一类的放在一个列表，
看它是不是'in':

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
set listserver "1 2 3 4 "
if {1 in $listserver} {puts 11}
当1在列表$listserver里面puts
</pre></figure></notextile></div>

switch多条件
----------

 假如有一些switch的结果，但是他们有一些需要做一样的操作，
 那么就可以吧他们放在一起

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
switch $port {
    100  -
    200  { puts 1}
    300  -
    400 {puts 2}
    }
这里表示当port是100,或者200会puts1,当port是300或者400，会puts2
</pre></figure></notextile></div>


