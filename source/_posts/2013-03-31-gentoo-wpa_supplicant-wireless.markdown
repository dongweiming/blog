---
layout: post
title: "gentoo使用wpa_supplicant配置无线网卡"
date: 2013-03-31 23:22
comments: true
categories: 
- gentoo
tags:
- gentoo
- wpa_supplicant
- wireless
---

####*前言*

公司全部使用了无线网络，我也被‘逼’的开始研究gentoo的无线上网，看了网上很多文章，以及gentoo文档，但是感觉都让我很迷糊，以下是我使用wpa_supplicant是一些总结

####总结

* 查看本机的无线网卡

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
emerge pciutils #这样就有了lspci这个命令
localhost ~ # lspci |grep -i wire
02:00.0 Network controller: Atheros Communications Inc. AR9285 Wireless Network Adapter (PCI-Express) (rev 01)
</pre></figure></notextile></div>

可以发现，网卡是Atheros的AR9285

* 安装wpa_supplicant

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
emerge -s wpa_supplicant
</pre></figure></notextile></div>

* 生成一个配置配置文件

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
zcat /usr/share/doc/wpa_supplicant-2.0/wpa_supplicant.conf.bz2 > /etc/wpa_supplicant/wpa_supplicant.conf
</pre></figure></notextile></div>

* 配置，以下是我去掉注释行，空白行等剩下的配置，其中的psk的字符串这样生成：

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
localhost ~ # wpa_passphrase 我的ssid 我的key
network={
	ssid="我的ssid"
	#psk="我的key"
	psk=e596aa911775ed47e04f5b9a9540978203210874eb258208b87cf82b5cf72588
}
</pre></figure></notextile></div>

把这段加在配置文件中

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
localhost ~ # cat /etc/wpa_supplicant.conf 

ctrl_interface=/var/run/wpa_supplicant
eapol_version=1
ap_scan=1
fast_reauth=1
network={
	ssid="我的ssid"
	psk=e596aa911775ed47e04f5b9a9540978203210874eb258208b87cf82b5cf72588
	priority=2
}
</pre></figure></notextile></div>

* 命令行启动wpa(如果想看详细的信息用于调试，加-d选项)

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
localhost ~ # wpa_supplicant -i wlan0 -c /etc/wpa_supplicant/wpa_supplicant.conf   
Successfully initialized wpa_supplicant
wlan0: Trying to associate with 20:dc:c6:61:ab:34 (SSID='我的ssid' freq=2437 MHz)
ioctl[SIOCSIWFREQ]: Device or resource busy
wlan0: Association request to the driver failed
wlan0: Associated with 20:dc:c6:61:ab:34
wlan0: WPA: Key negotiation completed with 20:dc:c6:61:ab:34 [PTK=CCMP GTK=CCMP]
wlan0: CTRL-EVENT-CONNECTED - Connection to 20:dc:c6:61:ab:34 completed [id=0 id_str=]
</pre></figure></notextile></div>

其中wlan0: Association request to the driver failed 没关系

* 安装udhcpc

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
emerge udhcpc
</pre></figure></notextile></div>

* 通过dhcp自动获得

<div class="bogus-wrapper"><notextile><figure class="code"><pre class="sh_python">
localhost ~ # dhcpcd wlan0
dhcpcd[12395]: version 5.6.4 starting
dhcpcd[12395]: wlan0: waiting for carrier
dhcpcd[12395]: wlan0: carrier acquired
dhcpcd[12395]: wlan0: carrier lost
dhcpcd[12395]: wlan0: waiting for carrier
dhcpcd[12395]: wlan0: carrier acquired
dhcpcd[12395]: wlan0: sending IPv6 Router Solicitation
dhcpcd[12395]: wlan0: sendmsg: Cannot assign requested address
dhcpcd[12395]: wlan0: rebinding lease of 192.168.0.106
dhcpcd[12395]: wlan0: acknowledged 192.168.0.106 from 192.168.0.1 `�'
dhcpcd[12395]: wlan0: checking for 192.168.0.106
dhcpcd[12395]: wlan0: sending IPv6 Router Solicitation
dhcpcd[12395]: wlan0: leased 192.168.0.106 for 7200 seconds
dhcpcd[12462]: wlan0: wlan0: MTU set to 576
dhcpcd[12395]: forked to background, child pid 12479
</pre></figure></notextile></div>

看到了吧 获得了192.168.0.106这个地址


