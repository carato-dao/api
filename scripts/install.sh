#!/bin/bash

apt-get install -y build-essential

#INSTALL NODEJS
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install pm2 -g

#INSTALL MONGODB
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
mkdir /usr/db
mkdir /usr/db/data
ulimit -n 640000
echo "#Unit contains the dependencies to be satisfied before the service is started.
[Unit]
Description=MongoDB Database
After=network.target
Documentation=https://docs.mongodb.org/manual
# Service tells systemd, how the service should be started.
# Key `User` specifies that the server will run under the mongodb user and
# `ExecStart` defines the startup command for MongoDB server.
[Service]
User=mongodb
Group=mongodb
ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf
# Install tells systemd when the service should be automatically started.
# `multi-user.target` means the server will be automatically started during boot.
[Install]
WantedBy=multi-user.target" > /etc/systemd/system/mongodb.service
systemctl daemon-reload
systemctl start mongodb
systemctl enable mongodb

#UPDATING NPM
npm install -g npm
npm install -g pm2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 * * * *'

#SETTING UP FIREWALL
ufw allow 22
ufw deny 42223
ufw deny 27017
ufw allow 42222
ufw enable y

#SETTING UP NGINX
sudo apt update
sudo apt install nginx -y
sudo ufw allow 'Nginx Full'

#INSTALL CERTBOT
sudo add-apt-repository ppa:certbot/certbot -y
sudo apt update
sudo apt install python-certbot-nginx -y
