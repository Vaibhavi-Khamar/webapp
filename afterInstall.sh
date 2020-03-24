#!/bin/bash
echo "creating dir"
mkdir /home/ubuntu/webapp
sudo mkdir /home/ubuntu/webapp/logs
sudo touch /home/ubuntu/webapp/logs/csye6225.log
sudo chmod 776 /home/ubuntu/webapp/logs/csye6225.log
cd /home/ubuntu/webapp
echo "installing npm"
sudo npm install

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/home/ubuntu/webapp/AmazonCloudWatch-config.json \
    -s