#!/bin/bash
sudo apt-get update
sudo npm install -g pm2
cd /opt/codedeploy-agent/deployment-root/deployment-instructions/
sudo rm -rf *-cleanup
