#!/bin/sh
# Fix SSH key permissions
chmod 600 /root/.ssh/bitbucket_rsa
chmod 644 /root/.ssh/known_hosts

exec java -jar /app/app.jar
