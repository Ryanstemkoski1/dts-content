#!/bin/bash

dt=$(date '+%d/%m/%Y %H:%M:%S');
echo "$dt Starting the application version $1"

if [ -z "$NODE_ENV" ]; then
    NODE_ENV=staging
fi

/usr/bin/xray --log-level error &

DEBUG= NODE_ENV=$NODE_ENV forever --spinSleepTime 1000 --minUptime 1000 --killSignal=SIGTERM -o /dev/null -c "npm start" .
