#!/bin/bash
sudo npm install -g loadtest
loadtest http://dev.vaibhavikhamar.me/v1/bill  -c 500 -k --rps 2000