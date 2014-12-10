---
layout: post
title: "python程序员Mac初始化环境"
date: 2013-06-22 18:28
comments: true
categories: 
---

####前言

早就想总结一篇python程序员的Mac配置笔记，趁这次就写一下我初始化的一些实践

####安装Xcode, Command line tools

作为开发者，肯定需要gcc,clang这些环境，Xcode界面也能下载Command line tools，但是下载好几次都有签名错误的问题，直接去官网下载

使用浏览器下载一段时间锁屏会停止下载，又不能续传。所以我还是习惯命令行下载.可以在这里找到https://github.com/orzrd/mytools/blob/master/adc_download.sh
比如下载xcode:

```
./adc_download.sh http://adcdownload.apple.com/Developer_Tools/xcode_4.6.3/xcode4630916281a.dmg
```

####安装git

在这里 http://git-scm.com/download/mac，但是你需要注意[版本和你的os的版本的对应关系](http://support.apple.com/kb/ht1633?viewlocale=zh_CN)

####安装brew-包管理工具

##### 以后我通过brew安装的软件都放在这个目录

```
sudo chown -R `whoami` /usr/local
git init
git remote add origin git://github.com/mxcl/homebrew.git
git pull origin master
```

####安装一些常用工具

```
brew install wget the_silver_searcher tree tmux htop mysql autojump mongodb zsh-completions
sudo easy_install pip
sudo pip install virtualenv
sudo pip install virtualenvwrapper
# 设置mysql和mongodb开机自启动
ln -sfv /usr/local/opt/mysql/*.plist ~/Library/LaunchAgents 
iln -sfv /usr/local/opt/mongodb/*.plist ~/Library/LaunchAgents
```

####安装配置oh-my-zsh和dotfiles


```
git clone https://github.com/robbyrussell/oh-my-zsh.git .oh-my-zsh
chsh -s /bin/zsh
git clone https://github.com/dongweiming/dotfiles.git ~/dotfiles
cd dotfiles
./install.sh vim
```

####配置一个虚拟python环境

```
export WORKON_HOME=~/envs
mkdir $WORKON_HOME -p
source /usr/local/bin/virtualenvwrapper.sh
mkvirtualenv --no-site-packages XXX # 这里新建了一个叫做XXX的环境,并且不会依赖site-package，需要你在环境中自定义下载
pip install -r requirements.txt #根据文件安装依赖
```

##### zshrc的配置可以看我的[dotfiles](https://github.com/dongweiming/dotfiles/blob/master/_zshrc)，我粘贴出来

```
export ANTIGEN_DEFAULT_REPO_URL=https://github.com/dongweiming/oh-my-zsh       
source ~/dotfiles/antigen/antigen.zsh                                          
                                                                               
antigen use oh-my-zsh                                                          
                                                                               
if [ "${OSTYPE:0:6}"="darwin" ]; then                                          
  antigen-bundle osx                                                           
  antigen-bundle brew                                                          
  export PATH=$(brew --prefix ruby)/bin:$PATH:/usr/local/sbin:~/bin
else                                                                           
  export PATH=$PATH:~/bin                                                      
fi                                                                             
antigen bundles <<EOB                                                          
  git-extras                                                                   
  pip                                                                          
  python                                                                       
  autojump
  django                                                                       
  ruby                                                                         
  git-flow                                                                     
  virtualenvwrapper                                                            
  git                                                                          
  github                                                                       
  supervisor                                                                   
  tmux                                                                         
  vagrant                                                                      
  history                                                                      
  zsh-users/zsh-syntax-highlighting                                            
  zsh-users/zaw                                                                
  zsh-users/zsh-history-substring-search                                       
  ~/.oh-my-zsh --no-local-clone                                                
EOB                                                                            
                                                                               
antigen theme sheerun/oh-my-zsh-powerline-theme powerline                     
                                                                               
antigen apply                                                                  
                                                                               
autoload -U zmv                                                                
export SSH_ASKPASS=""                                                          
alias rake='noglob rake'                                                       
export WORKON_HOME=~/envs                                                      
source `which virtualenvwrapper.sh`                                            
alias social='workon social;cd ~/social_master' 
alias ls='ls -hF --color=auto'
source ~/.oh-my-zsh/custom/powerline.zsh
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"

for keycode in '[' 'O'; do
  bindkey "^[${keycode}A" history-substring-search-up
  bindkey "^[${keycode}B" history-substring-search-down
done
unset keycode


# bind k and j for VI mode
bindkey -M vicmd 'k' history-substring-search-up
bindkey -M vicmd 'j' history-substring-search-down
```

####安装coreutils

##### Mac说白了就是freeBSD+一些插件的组合，所以常用工具例如ls 、grep也都是freeBSD版本,比如我使用rm删除文件,就必须rm -rf xx 而不能 rm xx -rf s实在脑残

```
brew install coreutils
```

添加PATH到.zshrc

```
PATH="$(brew --prefix coreutils)/libexec/gnubin:$PATH"                           
MANPATH="$(brew --prefix coreutils)/libexec/gnuman:$MANPATH"
```

####修改ls配色

```
git clone git@github.com:seebi/dircolors-solarized.git
# dircolors就在上面的coreutils中
echo 'eval `dircolors ~/lib/dircolors-solarized/dircolors.256dark`' >> ~/.zshrc
```

####安装octopress-为我的博客  仅供参考

```
# 默认的ruby是1.8.7的，我想要2.0的
brew install ruby
gem install bundler
bundle install
bundle update rake #安装的版本和octoress要求的9.2.2要高，所以需要升级
git clone https://github.com/imathis/octopress.git oc
cd oc
# 为啥会有下面的一堆cp?其实是为了升级我的octopress
cp ../octopress/Rakefile .
cp ../octopress/_config.yml .
cp -rp ../octopress/source .
# 以下是我自己写的几个脚本
cp ../octopress/plugins/pygments_code.rb plugins
cp ../octopress/plugins/shjs.rb plugins
cp ../octopress/plugins/tag_cloud.rb plugins
cp ../octopress/sass . -rp
# 然后你就可以生成了
rake generate
```
