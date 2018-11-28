# netstatsNodeMySQLLoader

[![Build Status](https://travis-ci.org/ThatOneNeji/netstatsNodeMySQLLoader.svg?branch=master)](https://travis-ci.org/ThatOneNeji/netstatsNodeMySQLLoader)

MySQL Loader
netstatsNodeMySQLLoader does all the loading of data for the netstats group of applications

## Overview
This node application is one of the five main applications within the "netstats" collection of applications. While running it sends command requests to an AMQP instance which in turn is processed by **netstatsNode<_protocol_>Poller**.

## Hierarchy of netstats applications
* netstatsNodeCron - Manages the cron for netstats group of applications
* netstatsNodeSNMPPoller - The poller application that actions the requests from netstatsNodeCron for the SNMP protocol
* netstatsNodeSSHPoller - The poller application that actions the requests from netstatsNodeCron for the SSH protocol
* netstatsNodeSNMPProcessor - The processing application that actions returned data from netstatsNodeSNMPPoller
* netstatsNodeMySQLLoader - **This application**

## Getting started
* Create the required user in RabbitMQ:
  ```shell
  rabbitmqctl add_user netstatsNodeMySQLLoader netstatsNodeMySQLLoader
  ```
* Update the configuration in settings.json to reflect the correct IP address for your AMQP instance:
```json
    "amqp": {
        "server": "127.0.0.1",
        "user": "netstatsNodeMySQLLoader",
        "password": "netstatsNodeMySQLLoader",
        "consumeQueueName": "netstats/mysql/data"
    }
```
* Added faQueue.js to handle the interactions with the message queuing broker. In this case RabbitMQ with AMQP

## Planned/In progress 
* Should faQueue.js work out good, I'll bump it into its own git repo and npm it.

