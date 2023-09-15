#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

#variables
usname="usmanmughalji"
ghmail="usmanmughalji@gmail.com"

sudo chmod +x run.py && python3 run.py

#setting up git and push files to repository
git_aio () {
    git config --global user.name ${usname}
    git config --global user.email ${ghmail}
    tmd=$(TZ=":Asia/Karachi" date +%d-%b-%y-%I:%M:%S:%p)
    git add -u .
    git add .
    git commit -m "${tmd}"
    git push origin HEAD:main
}
git_aio

#unsetting variables
unset usname && unset ghmail && unset tmd
