---
layout: post
title: "多master/develop分支使用gitflow"
date: 2013-06-04 20:30
comments: true
categories: 
- gitflow
tags:
- gitflow

---

####*前言*

公司都是git作为版本控制，公司一些项目组在用gitflow，但是我们组没有强制，
但是我上月出了一次事故，总结就是分支管理问题，所以开始强迫自己使用gitflow,
以前的项目是一个master和一个develop，自己checkout一个分支，然后merge(不理解的可以看看[a-successful-git-branching-model](http://nvie.com/posts/a-successful-git-branching-model/)).

问题出现了: 项目有几个主分支和开发分支，比如master_sina, master_qq. master_buzz ,而gitflow的时候只能指定一个master/develop, 这样你start一个feature/hotfix之前就要去.git/config里面修改
\[gitflow "branch"\]项的相关主分支和开发分支，so不方便。看了下源码，给gitflow加点料

####添加功能

* 当你打开了feature/hotfix分支，但是你不想要它了(当然你可以直接git branch -D xx)，使用git flow hotfix/feature delete ,自动帮你删除这个分支，以便你新建其他分支(git flow只容许你一次存在一个hotfix/feature分支)
* 你想使用gitflow删除其它存在分支嘛？不需要 git branch -D ，你还可以git flow hotfix/feature delete XX 
* 比如我在init的时候指定了master为master_sina,  而当我想创建master_qq的hotfix，我只需要在start的是否给它取名字是'qq_'开头的即可，要是有其它的需要你可以直接在源码里面添加对应的内容

####例子 git-flow-hotfix  我主要标记我修改的部分

```
init() {
  require_git_repo
  require_gitflow_initialized
  gitflow_load_settings
  VERSION_PREFIX=$(eval "echo `git config --get gitflow.prefix.versiontag`")
  PREFIX=$(git config --get gitflow.prefix.hotfix)
}
# 增加help的选项说明
usage() {
    echo "usage: git flow hotfix [list] [-v]"
    echo "       git flow hotfix start [-F] <version> [<base>]"
    echo "       git flow hotfix finish [-Fsumpk] <version>"
    echo "       git flow hotfix publish <version>"
    echo "       git flow hotfix delete [branch]"
    echo "       git flow hotfix track <version>"
}
cmd_default() {
    cmd_list "$@"
}

cmd_list() {
    DEFINE_boolean verbose false 'verbose (more) output' v
    parse_args "$@"

    local hotfix_branches
    local current_branch
    local short_names
    hotfix_branches=$(echo "$(git_local_branches)" | grep "^$PREFIX")
    if [ -z "$hotfix_branches" ]; then
        warn "No hotfix branches exist."
                warn ""
                warn "You can start a new hotfix branch:"
                warn ""
                warn "    git flow hotfix start <version> [<base>]"
                warn ""
        exit 0
    fi
    current_branch=$(git branch --no-color | grep '^\* ' | grep -v 'no branch' | sed 's/^* //g')
    short_names=$(echo "$hotfix_branches" | sed "s ^$PREFIX  g")

    # determine column width first
    local width=0
    local branch
    for branch in $short_names; do
        local len=${#branch}
        width=$(max $width $len)
    done
    width=$(($width+3))

    local branch
    for branch in $short_names; do
        local fullname=$PREFIX$branch
        local base=$(git merge-base "$fullname" "$MASTER_BRANCH")
        local master_sha=$(git rev-parse "$MASTER_BRANCH")
        local branch_sha=$(git rev-parse "$fullname")
        if [ "$fullname" = "$current_branch" ]; then
            printf "* "
        else
            printf "  "
        fi
        if flag verbose; then
            printf "%-${width}s" "$branch"
            if [ "$branch_sha" = "$master_sha" ]; then
                printf "(no commits yet)"
            else
                local tagname=$(git name-rev --tags --no-undefined --name-only "$base")
                local nicename
                if [ "$tagname" != "" ]; then
                    nicename=$tagname
                else
                    nicename=$(git rev-parse --short "$base")
                fi
                printf "(based on $nicename)"
            fi
        else
            printf "%s" "$branch"
        fi
        echo
    done
}

cmd_help() {
    usage
    exit 0
}

parse_args() {
    # parse options
    FLAGS "$@" || exit $?
    eval set -- "${FLAGS_ARGV}"
    # read arguments into global variables
    VERSION=$1
    BRANCH=$PREFIX$VERSION
    # 这里就是我多master/develop的技巧，我这里会判断要新建的分支的前缀，
    # 要是qq_开头就会基于master_qq和develop_qq创建分支。所以你可以根据你的需要在这里加一些方法
    test `expr match "$@" "qq_"` -ne 0 && MASTER_BRANCH="$MASTER_BRANCH"_qq &&
    DEVELOP_BRANCH="$DEVELOP_BRANCH"_qq
}

require_version_arg() {
    if [ "$VERSION" = "" ]; then
        warn "Missing argument <version>"
        usage
        exit 1
    fi
}

require_base_is_on_master() {
    if ! git branch --no-color --contains "$BASE" 2>/dev/null \
            | sed 's/[* ] //g' \
            | grep -q "^$MASTER_BRANCH\$"; then
        die "fatal: Given base '$BASE' is not a valid commit on '$MASTER_BRANCH'."
    fi
}

require_no_existing_hotfix_branches() {
    local hotfix_branches=$(echo "$(git_local_branches)" | grep "^$PREFIX")
    local first_branch=$(echo ${hotfix_branches} | head -n1)
    first_branch=${first_branch#$PREFIX}
    [ -z "$hotfix_branches" ] || \
        die "There is an existing hotfix branch ($first_branch). Finish that one first."
}
# 添加delete 参数，函数需要cmd_开头
cmd_delete() {
    if [ "$1" = "" ]; then
        # 当不指定参数自动去找存在的未关闭的gitflow分支
        local hotfix_branches=$(echo "$(git_local_branches)" | grep "^$PREFIX")
        test "$hotfix_branches" = "" && die "There has not existing hotfix branch can delete" && exit 1
    else
        # 指定参数先判断参数是不是的数量格式
        test $# != 1 && die "There only need one parameter indicates the branch to be deleted" && exit 1
        hotfix_branches="$1"
    fi
    # 当要删除的分支就是当前分支，先checkout到develop分支
    test "$hotfix_branches" = "$(git_current_branch)" && echo 'First checkout develp branch'; git_do checkout "$DEVELOP_BRANCH"
    git branch -D  ${hotfix_branches} > /dev/null 2>&1&& echo 'Delete Successed'|| die "Did not find branch: [$hotfix_branches]"

}
cmd_start() {
    DEFINE_boolean fetch false "fetch from $ORIGIN before performing finish" F
    parse_args "$@"
    BASE=${2:-$MASTER_BRANCH}
    require_version_arg
    require_base_is_on_master
    require_no_existing_hotfix_branches

    # sanity checks
    require_clean_working_tree
    require_branch_absent "$BRANCH"
    require_tag_absent "$VERSION_PREFIX$VERSION"
    if flag fetch; then
        git_do fetch -q "$ORIGIN" "$MASTER_BRANCH"
    fi
    if has "$ORIGIN/$MASTER_BRANCH" $(git_remote_branches); then
        require_branches_equal "$MASTER_BRANCH" "$ORIGIN/$MASTER_BRANCH"
    fi

    # create branch
    git_do checkout -b "$BRANCH" "$BASE"

    echo
    echo "Summary of actions:"
    echo "- A new branch '$BRANCH' was created, based on '$BASE'"
    echo "- You are now on branch '$BRANCH'"
    echo
    echo "Follow-up actions:"
    echo "- Bump the version number now!"
    echo "- Start committing your hot fixes"
    echo "- When done, run:"
    echo
    echo "     git flow hotfix finish '$VERSION'"
    echo
}

cmd_publish() {
    parse_args "$@"
    require_version_arg

    # sanity checks
    require_clean_working_tree
    require_branch "$BRANCH"
    git_do fetch -q "$ORIGIN"
    require_branch_absent "$ORIGIN/$BRANCH"

    # create remote branch
    git_do push "$ORIGIN" "$BRANCH:refs/heads/$BRANCH"
    git_do fetch -q "$ORIGIN"

    # configure remote tracking
    git config "branch.$BRANCH.remote" "$ORIGIN"
    git config "branch.$BRANCH.merge" "refs/heads/$BRANCH"
    git_do checkout "$BRANCH"

    echo
    echo "Summary of actions:"
    echo "- A new remote branch '$BRANCH' was created"
    echo "- The local branch '$BRANCH' was configured to track the remote branch"
    echo "- You are now on branch '$BRANCH'"
    echo
}

cmd_track() {
    parse_args "$@"
    require_version_arg

    # sanity checks
    require_clean_working_tree
    require_branch_absent "$BRANCH"
    git_do fetch -q "$ORIGIN"
    require_branch "$ORIGIN/$BRANCH"

    # create tracking branch
    git_do checkout -b "$BRANCH" "$ORIGIN/$BRANCH"

    echo
    echo "Summary of actions:"
    echo "- A new remote tracking branch '$BRANCH' was created"
    echo "- You are now on branch '$BRANCH'"
    echo
}

cmd_finish() {
    DEFINE_boolean fetch false "fetch from $ORIGIN before performing finish" F
    DEFINE_boolean sign false "sign the release tag cryptographically" s
    DEFINE_string signingkey "" "use the given GPG-key for the digital signature (implies -s)" u
    DEFINE_string message "" "use the given tag message" m
    DEFINE_string messagefile "" "use the contents of the given file as tag message" f
    DEFINE_boolean push false "push to $ORIGIN after performing finish" p
    DEFINE_boolean keep false "keep branch after performing finish" k
    DEFINE_boolean notag false "don't tag this release" n
    parse_args "$@"
    require_version_arg

    # handle flags that imply other flags
    if [ "$FLAGS_signingkey" != "" ]; then
        FLAGS_sign=$FLAGS_TRUE
    fi

    # sanity checks
    require_branch "$BRANCH"
    require_clean_working_tree
    if flag fetch; then
        git_do fetch -q "$ORIGIN" "$MASTER_BRANCH" || \
          die "Could not fetch $MASTER_BRANCH from $ORIGIN."
        git_do fetch -q "$ORIGIN" "$DEVELOP_BRANCH" || \
          die "Could not fetch $DEVELOP_BRANCH from $ORIGIN."
    fi
    if has "$ORIGIN/$MASTER_BRANCH" $(git_remote_branches); then
        require_branches_equal "$MASTER_BRANCH" "$ORIGIN/$MASTER_BRANCH"
    fi
    if has "$ORIGIN/$DEVELOP_BRANCH" $(git_remote_branches); then
        require_branches_equal "$DEVELOP_BRANCH" "$ORIGIN/$DEVELOP_BRANCH"
    fi

    # try to merge into master
    # in case a previous attempt to finish this release branch has failed,
    # but the merge into master was successful, we skip it now
    if ! git_is_branch_merged_into "$BRANCH" "$MASTER_BRANCH"; then
        git_do checkout "$MASTER_BRANCH" || \
          die "Could not check out $MASTER_BRANCH."
        git_do merge --no-ff "$BRANCH" || \
          die "There were merge conflicts."
          # TODO: What do we do now?
    fi

    if noflag notag; then
        # try to tag the release
        # in case a previous attempt to finish this release branch has failed,
        # but the tag was set successful, we skip it now
        local tagname=$VERSION_PREFIX$VERSION
        if ! git_tag_exists "$tagname"; then
            local opts="-a"
            flag sign && opts="$opts -s"
            [ "$FLAGS_signingkey" != "" ] && opts="$opts -u '$FLAGS_signingkey'"
            [ "$FLAGS_message" != "" ] && opts="$opts -m '$FLAGS_message'"
            [ "$FLAGS_messagefile" != "" ] && opts="$opts -F '$FLAGS_messagefile'"
            eval git_do tag $opts "$VERSION_PREFIX$VERSION" "$BRANCH" || \
            die "Tagging failed. Please run finish again to retry."
        fi
    fi

    # try to merge into develop
    # in case a previous attempt to finish this release branch has failed,
    # but the merge into develop was successful, we skip it now
    if ! git_is_branch_merged_into "$BRANCH" "$DEVELOP_BRANCH"; then
        git_do checkout "$DEVELOP_BRANCH" || \
          die "Could not check out $DEVELOP_BRANCH."

        # TODO: Actually, accounting for 'git describe' pays, so we should
        # ideally git merge --no-ff $tagname here, instead!
        git_do merge --no-ff "$BRANCH" || \
          die "There were merge conflicts."
          # TODO: What do we do now?
    fi

    # delete branch
    if noflag keep; then
        # 这个问题很奇怪，在完成分支删除它也会存在当前分支是
        # 要删除的分支删除报错的问题，所以先切换走
        test "$BRANCH" = "$(git_current_branch)" && git_do checkout "$DEVELOP_BRANCH"
        git_do branch -d "$BRANCH"
    fi

    if flag push; then
        git_do push "$ORIGIN" "$DEVELOP_BRANCH" || \
            die "Could not push to $DEVELOP_BRANCH from $ORIGIN."
        git_do push "$ORIGIN" "$MASTER_BRANCH" || \
            die "Could not push to $MASTER_BRANCH from $ORIGIN."
        if noflag notag; then
            git_do push --tags "$ORIGIN" || \
                die "Could not push tags to $ORIGIN."
        fi
    fi

    echo
    echo "Summary of actions:"
    echo "- Latest objects have been fetched from '$ORIGIN'"
    echo "- Hotfix branch has been merged into '$MASTER_BRANCH'"
    if noflag notag; then
        echo "- The hotfix was tagged '$VERSION_PREFIX$VERSION'"
    fi
    echo "- Hotfix branch has been back-merged into '$DEVELOP_BRANCH'"
    if flag keep; then
        echo "- Hotfix branch '$BRANCH' is still available"
    else
        echo "- Hotfix branch '$BRANCH' has been deleted"
    fi
    if flag push; then
        echo "- '$DEVELOP_BRANCH', '$MASTER_BRANCH' and tags have been pushed to '$ORIGIN'"
    fi
    echo
    }
```
