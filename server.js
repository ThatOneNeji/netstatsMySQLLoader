/**
 * @typedef {Object} queueBase
 * @property {string} consumeBaseName This is the base queue name to use for consume
 * @property {string} publishBaseName This is the base queue name to use for publish
 * @description This object contains the queue information for the message broker subsystem
 */
/**
 * @typedef {Object} loggingConfiguration
 * @property {string} appenders Appenders serialise log events to some form of output
 * @property {string} categories The category (or categories if you provide an array
 *     of values) that will be excluded from the appender.
 * @description This defines the way the logger works
 */
/**
 * @typedef {Object} loggingOptions
 * @property {string} level The level of logging to use
 * @property {array} areas This is the various areas used for getLogger
 * @property {string} owner Application name
 * @description This object contains the configuration information for the logging subsystem
 */
/**
 * @typedef {object} ApplicationConfiguration
 * @property {loggingConfiguration} logger This defines the way the logger works
 * @property {loggingOptions} logging This object contains the configuration information for the logging subsystem
 * @property {messageBrokerServerSettings} messagebrokers This object contains the configuration information for the message broker sub system
 * @property {queueBase} queues This object contains the queue information for the message broker subsystem
 * @description Configuration from config.json
 */
/**
 * @property {ApplicationConfiguration} appConfig
 */
var appConfig;

/* Load internal libraries */
/**
 * @function logging
 * @description  description
 */
var logging = require('./lib/logger.js');

/**
 * @function MessageBroker
 * @description description
 */
//var Common = require('./lib/nejiutils.js');

/**
 * @function MessageBroker
 * @description description
 */
var MessageBroker = require('./lib/messagebroker.js');

/* 3rd party libraries */
/**
 * @function moment
 * @description description
 */
var moment = require('moment');

/**
 * @function mysql
 * @description description
 */
var mysql = require('mysql');

/**
 * @function fs
 * @description description
 */
var fs = require('fs');

/* Global vars */
var Logging;

/**
 * @function bail
 * @param {*} err String/object from sender
 * @description We use this to exit out of the application if fatal
 */
function bail(err) {
    console.error(err);
    process.exit(1);
}

/**
 * @function loadConfigurationFile
 * @description Reads configuration from local file
 */
function loadConfigurationFile() {
    try {
        appConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    } catch (err) {
        bail(err);
    }
}

/**
 * @function initialiseApplication
 * @description Starts up the application
 */
function initialiseApplication() {
    loadConfigurationFile();
    Logging = new logging(appConfig.logging);
    Logging.system.info('Starting');
}

/**
 * Initialise the application
 */
initialiseApplication();

Logging.system.info('Starting...');

/**
 * @typedef {Object} messageBrokerOptions
 * @property {function} logger - Logger to pass on to the messagebroker so that it can log messages
 * @property {messageBrokerServerSettings} config - Configuration for the RabbitMQ server
 * @property {string} receiveQueue - This is the queue to consume from
 * @property {string} receiveQueueName - This is the name of the consume instance
 * @property {function} externalHandover - This function is called from the message broker in order to action incoming data
 */
var messageBrokerOptions = {
    logger: Logging.messagebroker,
    config: appConfig.messagebrokers,
    receiveQueue: appConfig.queues.consumeBaseName,
    externalHandover: receiveHandler
};

MessageBroker.init(messageBrokerOptions);


/**
 * @function pool
 * @description Creates a pool for MySQL connections
 */
var pool = mysql.createPool({
    connectionLimit: appConfig.database.connectionLimit,
    host: appConfig.database.host,
    user: appConfig.database.user,
    password: appConfig.database.password,
    database: appConfig.database.database
});

/**
 * @function defaultValue
 * @param {string} value String/object from sender
 * @return {*} Value if successful
 * @description Returns a default value if the supplied variable is null
 */
function defaultValue(value) {
    if (value) {
        return value;
    } else {
        return "N/A";
    }
}

/**
 * @function returnedMysqlServerStatus
 * @param {integer} value String/object from sender
 * @return {array} Built up status
 * @description 'Converts' the value into a string
 */
function returnedMysqlServerStatus(value) {
    let statusMessage = [];

    if (value & 1)
        statusMessage.push('SERVER_STATUS_IN_TRANS');

    if (value & 2)
        statusMessage.push('SERVER_STATUS_AUTOCOMMIT');

    if (value & 8)
        statusMessage.push('SERVER_MORE_RESULTS_EXISTS');

    if (value & 16)
        statusMessage.push('SERVER_QUERY_NO_GOOD_INDEX_USED');

    if (value & 32)
        statusMessage.push('SERVER_QUERY_NO_INDEX_USED');

    if (value & 64)
        statusMessage.push('SERVER_STATUS_CURSOR_EXISTS');

    if (value & 128)
        statusMessage.push('SERVER_STATUS_LAST_ROW_SENT');

    if (value & 256)
        statusMessage.push('SERVER_STATUS_DB_DROPPED');

    if (value & 512)
        statusMessage.push('SERVER_STATUS_NO_BACKSLASH_ESCAPES');

    if (value & 1024)
        statusMessage.push('SERVER_STATUS_METADATA_CHANGED');

    if (value & 2048)
        statusMessage.push('SERVER_QUERY_WAS_SLOW');

    if (value & 4096)
        statusMessage.push('SERVER_PS_OUT_PARAMS');

    if (value & 8192)
        statusMessage.push('SERVER_STATUS_IN_TRANS_READONLY');

    if (value & 16384)
        statusMessage.push('SERVER_SESSION_STATE_CHANGED');

    return statusMessage.join();
}

/**
 * @function writeData
 * @param {*} data Data from 'pool.query'
 * @param {string} service Name of service
 * @description Writes a failed SQL statement to file
 */
function writeData(data, service) {
    let fileName;
    let lineMessage;

    if (data.constructor === String) {
        fileName = moment().format("YYYYMMDDHH") + "_" + service + ".sql";
        lineMessage = "/* " + moment().format("YYYY/MM/DD HH:mm:ss.SSS") + " */ " + "\r\n" + data + "\r\n";
    } else {
        fileName = moment().format("YYYYMMDDHH") + "_" + service + ".error";
        lineMessage = "/* " + moment().format("YYYY/MM/DD HH:mm:ss.SSS") + " */ " + "\r\n" + JSON.stringify(data) + "\r\n";
    }

    fs.appendFile(fileName, lineMessage, (err) => {
        if (err)
            Logging.fs.error(err);
    });
}

function receiveHandler(msg) {
    let JSONPayload = JSON.parse(msg.content.toString());
    pool.query(JSONPayload.sql, function(error, results, fields) {
        if (error) {
            Logging.mysql.error("Error; Code: " + error.code + " ; Errno: " + error.errno + " ; sqlState: " + error.sqlState + " ; sqlMessage: " + error.sqlMessage + " ;    " + JSON.stringify(JSONPayload.sql));
            writeData(JSONPayload.sql, JSONPayload.service);
        } else {
            Logging.mysql.info('Results from row insert for service:: ' + JSONPayload.service + ' affectedRows:: ' + results.affectedRows + ' serverStatus:: ' + results.serverStatus + ' [' + returnedMysqlServerStatus(results.serverStatus) + '] message:: ' + defaultValue(results.message));
            //            Logging.mysql.debug('Results from row insert for service -> ' + JSON.stringify(results));
            if (fields) {
                Logging.mysql.debug(fields);
            }
        }
    });
    return true;
}