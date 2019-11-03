# netstatsMySQLLoader

[![Build Status](https://travis-ci.org/ThatOneNeji/netstatsMySQLLoader.svg?branch=master)](https://travis-ci.org/ThatOneNeji/netstatsMySQLLoader)

MySQL Loader
netstatsMySQLLoader does all the loading of data for the netstats group of applications

## Overview
This node application is one of the five main applications within the "netstats" collection of applications. While running it sends command requests to an AMQP instance which in turn is processed by **netstats<_protocol_>Poller**.

## Hierarchy of netstats applications
* netstatsCron - Manages the cron for netstats group of applications
* netstatsSNMPPoller - The poller application that actions the requests from netstatsCron for the SNMP protocol
* netstatsSSHPoller - The poller application that actions the requests from netstatsCron for the SSH protocol
* netstatsSNMPProcessor - The processing application that actions returned data from netstatsSNMPPoller
* netstatsMySQLLoader - **This application**

## Getting started
* Create the required user in RabbitMQ:
  ```shell
  rabbitmqctl add_user netstatsMySQLLoader netstatsMySQLLoader
  ```
* Update the configuration in settings.json to reflect the correct IP address for your AMQP instance:
```json
    "amqp": {
        "server": "127.0.0.1",
        "user": "netstatsMySQLLoader",
        "password": "netstatsMySQLLoader",
        "consumeQueueName": "netstats/mysql/data"
    }
```
* Added faQueue.js to handle the interactions with the message queuing broker. In this case RabbitMQ with AMQP

## Planned/In progress 
* Should faQueue.js work out good, I'll bump it into its own git repo and npm it.

