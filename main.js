var appConfig = require('./settings.json');
var appQueue = require('./faQueue.js');
var log4js = require('log4js'), moment = require('moment'), mysql = require('mysql'), fs = require('fs');

var genLogger = log4js.getLogger('general'), mysqlLogger = log4js.getLogger('mysql');

log4js.configure(appConfig.logger);

genLogger.info('Starting...');

function bail(err) {
    genLogger.error(err);
    process.exit(1);
}

let queueSettings = {
    url: 'amqp://' + appConfig.amqp.user + ':' + appConfig.amqp.password + '@' + appConfig.amqp.server,
    consumeQueueName: appConfig.amqp.consumeQueueName,
    isWorkerEnabled: true
};

appQueue.init(log4js, queueSettings, mysqlHandler);

var pool = mysql.createPool({
    connectionLimit: appConfig.database.connectionLimit,
    host: appConfig.database.host,
    user: appConfig.database.user,
    password: appConfig.database.password,
    database: appConfig.database.database
});

function defaultValue(value) {
    if (value) {
        return value;
    } else {
        return "N/A";
    }
}

function mysqlServerStatusStr(value) {
    let msg = ' ';

    if (value & 1)
        msg += "[SERVER_STATUS_IN_TRANS] ";

    if (value & 2)
        msg += "[SERVER_STATUS_AUTOCOMMIT] ";

    if (value & 8)
        msg += "[SERVER_MORE_RESULTS_EXISTS] ";

    if (value & 16)
        msg += "[SERVER_QUERY_NO_GOOD_INDEX_USED] ";

    if (value & 32)
        msg += "[SERVER_QUERY_NO_INDEX_USED] ";

    if (value & 64)
        msg += "[SERVER_STATUS_CURSOR_EXISTS] ";

    if (value & 128)
        msg += "[SERVER_STATUS_LAST_ROW_SENT] ";

    if (value & 256)
        msg += "[SERVER_STATUS_DB_DROPPED] ";

    if (value & 512)
        msg += "[SERVER_STATUS_NO_BACKSLASH_ESCAPES] ";

    if (value & 1024)
        msg += "[SERVER_STATUS_METADATA_CHANGED] ";

    if (value & 2048)
        msg += "[SERVER_QUERY_WAS_SLOW] ";

    if (value & 4096)
        msg += "[SERVER_PS_OUT_PARAMS] ";

    if (value & 8192)
        msg += "[SERVER_STATUS_IN_TRANS_READONLY] ";

    if (value & 16384)
        msg += "[SERVER_SESSION_STATE_CHANGED] ";

    return msg;
}

function writeData(data, service) {
    fn = moment().format("YYYYMMDD") + "_" + service + ".sql";
    let msg = "/* " + moment().format("YYYY/MM/DD HH:mm:ss.SSS") + " */ " + "\r\n" + data + "\r\n";
    fs.appendFile(fn, msg, (err) => {
        if (err)
            genLogger.error(err);
    });
}

function mysqlHandler(msg) {
    let JSONPayload = JSON.parse(msg);
    pool.query(JSONPayload.sql, function (error, results, fields) {
        if (error) {
            mysqlLogger.error("Error; Code: " + error.code + " ; Errno: " + error.errno + " ; sqlState: " + error.sqlState + " ;   " + JSON.stringify(JSONPayload.sql));
            writeData(JSONPayload.sql, JSONPayload.service);
        } else {
            mysqlLogger.info('Results from row insert for service -> ' + JSONPayload.service + ' affectedRows -> ' + results.affectedRows + ' serverStatus -> (' + results.serverStatus + ')' + mysqlServerStatusStr(results.serverStatus) + ' message -> ' + defaultValue(results.message));
            //   mysqlLogger.debug('[MySQL] Results from row insert for service -> ' + JSONPayload.service + ' results -> ' + JSON.stringify(results));
        }
    });
}
