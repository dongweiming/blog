---
layout: post
title: "推荐pre-commit/pre-push: 本地在commit或者push的时候做各种检查(pep8/pylint/pyflakes8)"
date: 2015-01-12 18:16
comments: true
categories:
- pre-commit
tags:
- pre-commit
- pre-push

---


#### 前言

使用git的同学想必都有这样的工作场景-保证生产环境的ci不挂. 也就是检查python是否符合pep8/csslint/jslint/pylint/pyflake8等.
我在我的emacs配置中加入了这一项[py-autopep8](https://github.com/dongweiming/emacs.d/blob/master/custom/py-autopep8.el),
就是在保存缓存区的时候把当前缓存区的文本放到一个临时文件, 然后执行autopep8, 再检查pep8/flake8


但是不能对css/js/html做规范检查. 而且也不通用. 周末看到了Yelp的[pre-commit](https://github.com/pre-commit/pre-commit).
感觉是个很有意思的东西，虽然之前也写过类似的hook. 但是没有它灵活. 看完他的源码后, 我今天给大家介绍下这个东西

#### pre-commit

玩过svn/git的同学应该都知道他们有各种的hook. 也就是准备/完成什么事件的时候做些额外的工作. 一般是shell脚本,
版本控制工具会判断脚本的退出码, 如果不是0, 就不会继续完成. pre-commit顾名思义就是在commit之前做的准备, 也就是每次执行

```
git commit -m 'xxx'
```

的时候去做一些检查. 启用的插件都放到这个版本库目录的根目录下, 名字叫做.pre-commit-config.yaml -> 详细文档请看: [http://pre-commit.com/](http://pre-commit.com/)


这里有我的一个配置例子:

```python
-   repo: https://github.com/pre-commit/pre-commit-hooks
    sha: b03733bc86d9e8b2564a5798ade40d64baae3055
    hooks:
    -   id: trailing-whitespace
    -   id: end-of-file-fixer
    -   id: autopep8-wrapper
    args: ['-i', '--ignore=E265,E309,E501']
    -   id: check-docstring-first
    -   id: check-json
    -   id: check-yaml
    -   id: debug-statements
    -   id: name-tests-test
    -   id: requirements-txt-fixer
    -   id: flake8
-   repo: https://github.com/pre-commit/pre-commit
    sha: 86c99c6b870a261d2aff0b4cdb36995764edce1b
    hooks:
    -   id: validate_config
    -   id: validate_manifest
-   repo: https://github.com/asottile/reorder_python_imports
    sha: ea9fa14a757bb210d849de5af8f8ba2c9744027a
    hooks:
    -   id: reorder-python-imports
```

#### 安装使用

```python
pip install pre-commit
pre-commit install
# PS: 第一次执行commit会比较慢，因为他会clone对应的源, 之后就会用这个缓存的源
# 其他的可选源和用法直接参照[https://github.com/pre-commit](https://github.com/pre-commit)里面的项目或者[http://pre-commit.com/hooks.html](http://pre-commit.com/hooks.html)
```

####  看一个失败的例子(有颜色效果, 不能展示出来)

```python
$git commit -m 'test'

Trim Trailing Whitespace.................................................................................................................Passed
Fix End of Files.........................................................................................................................Passed
autopep8 wrapper.........................................................................................................................Passed
Check docstring is first.................................................................................................................Passed
Check JSON..........................................................................................................(no files to check) Skipped
Check Yaml..........................................................................................................(no files to check) Skipped
Debug Statements (Python)................................................................................................................Passed
Tests should end in _test.py........................................................................................(no files to check) Skipped
Fix requirements.txt................................................................................................(no files to check) Skipped
Flake8...................................................................................................................................Failed
hookid: flake8

pre_commit/__init__.py:2:1: F401 'os' imported but unused
pre_commit/__init__.py:3:1: F401 'sys' imported but unused

Validate Pre-Commit Config..........................................................................................(no files to check) Skipped
Validate Pre-Commit Manifest........................................................................................(no files to check) Skipped
Reorder python imports...................................................................................................................Passed
# 因为我的flake8有问题 所以commit失败了
```

#### pre-commit的问题

我觉得对每次commit做一次审查, 第一是需要时间, 第二是没有必要, 因为经常一个pr有多个commit,
我只保证整体结果是正确的就好了 - 也就是说应该是在push的时候. 整个过程我可能对commit做多次rebase/--amend等等. 某一次的检查失败其实完全不
影响我做后的结果 - 我是手快党

so. 我基于它修改了一个版本[pre-push](https://github.com/dongweiming/pre-push/), 只是我对push做了拦截. 并且我会经常和它保持同步

```python
pre-commit install -t pre-commit # 默认安装pre-commit钩子, 每次commit触发
pre-commit install -t pre-push # 默认安装pre-push钩子, 每次push触发
```

其他用法完全一样.

假如push的时候想要不检查而强制push, 可以加上`--no-verify`参数


#### Update from 2015-01-15

我的这个分支已经合并到[pre-commit](https://github.com/pre-commit/pre-commit). [pull189](https://github.com/pre-commit/pre-commit/pull/189)

大家可以不要用我的分支了. PS: 这是我见到测试覆盖最高的项目.
