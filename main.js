var appConfig = require('./settings.json');
var log4js = require('log4js'), moment = require('moment'), mysql = require('mysql'), fs = require('fs');

function bail(err) {
    logger.error(err);
    process.exit(1);
}

function initLogger() {
    log4js.configure(appConfig.logger);
}

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

//function loadDataMySQL(sql_query_param, service) {
//    var pool = mysql.createPool({
//        connectionLimit: appConfig.database.connectionLimit,
//        host: appConfig.database.host,
//        user: appConfig.database.user,
//        password: appConfig.database.password,
//        database: appConfig.database.database
//    });
//    var connection = mysql.createConnection({
//        host: appConfig.database.host,
//        user: appConfig.database.username,
//        password: appConfig.database.password,
//        database: appConfig.database.schema
//    });
//    connection.connect(function (err) {
//        if (err) {
//            logger.error('[MySQL] MySQL connecting... ' + err);
//            writeData(sql_query_param, service);
//            return;
//        }
//        logger.debug('[MySQL] Connected as ID ' + connection.threadId);
//    });
//    connection.query(sql_query_param, function (error, results, fields) {
//        if (error) {
//            logger.error("[MySQL] Error; Code: " + error.code + " ; Errno: " + error.errno + " ; sqlState: " + error.sqlState + " ;   " + sql_query_param);
//            writeData(sql_query_param, service);
//        } else {
//            logger.info('[MySQL] Results from row insert for service -> ' + service + ' affectedRows -> ' + results.affectedRows + ' serverStatus -> ' + results.serverStatus + ' message -> ' + defaultValue(results.message));
//        }
//    });
//    connection.end();
//}

function writeData(data, service) {
    fn = moment().format("YYYYMMDD") + "_" + service + ".sql";
    let msg = "/* " + moment().format("YYYY/MM/DD HH:mm:ss.SSS") + " */ " + "\r\n" + data + "\r\n";
//    let msg = "/* " + moment().format("YYYY/MM/DD HH:mm:ss.SSS") + " */ " + "\r\n" + data.sql + "\r\n";

    fs.appendFile(fn, msg, (err) => {
        if (err)
            logger.error(err);
    });
}

// Consumer 
function consumer(conn) {
    var ok = conn.createChannel(on_open);
    function on_open(err, ch) {
        if (err != null)
            bail(err);
        ch.assertQueue(appConfig.amqp.queuename);
        ch.prefetch(1);
        ch.consume(appConfig.amqp.queuename, function (msg) {
            if (msg !== null) {
                let strMsg = msg.content.toString();
                let JSONPayload = JSON.parse(strMsg);
                pool.query(JSONPayload.sql, function (error, results, fields) {
                    if (error) {
                        logger.error("[MySQL] Error; Code: " + error.code + " ; Errno: " + error.errno + " ; sqlState: " + error.sqlState + " ;   " + JSON.stringify(JSONPayload.sql));
                        writeData(JSONPayload.sql, JSONPayload.service);
                    } else {
                        logger.info('[MySQL] Results from row insert for service -> ' + JSONPayload.service + ' affectedRows -> ' + results.affectedRows + ' serverStatus -> (' + results.serverStatus + ')' + mysqlServerStatusStr(results.serverStatus) + ' message -> ' + defaultValue(results.message));
                    }
                });
                //       loadDataMySQL(JSONPayload.sql, JSONPayload.service);
                ch.ack(msg);
//                ch.ack(loadDataMySQL(JSONPayload.sql, JSONPayload.service));
            }
        });
    }
}

initLogger();
var logger = log4js.getLogger('wugmsNodeMySQLLoader');
logger.info('Starting... ');
require('amqplib/callback_api')
        .connect('amqp://' + appConfig.amqp.user + ':' + appConfig.amqp.password + '@' + appConfig.amqp.server, function (err, conn) {
            if (err != null)
                bail(err);
            consumer(conn);
        });