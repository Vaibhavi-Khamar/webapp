#!/bin/bash
sudo apt-get update
echo "installing pm2"
sudo npm install -g pm2
cd /opt/codedeploy-agent/deployment-root/deployment-instructions/
echo "removing webapp"
sudo rm -rf /home/ubuntu/webapp
echo "removed webapp"
