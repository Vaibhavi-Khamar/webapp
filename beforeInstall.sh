#!/bin/bash
sudo apt-get update
echo "installing pm2"
sudo npm install -g pm2
sudo rm -rf node_modules/bcrypt
cd /opt/codedeploy-agent/deployment-root/deployment-instructions/
echo "removing webapp"
sudo rm -rf webapp
echo "removed webapp"
