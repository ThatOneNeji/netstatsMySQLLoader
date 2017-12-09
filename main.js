var appConfig = require('./settings.json');
var log4js = require('log4js');
var moment = require('moment');
var mysql = require('mysql');
var fs = require('fs');


function bail(err) {
    logger.error(err);
    process.exit(1);
}

function initLogger() {
    log4js.configure({
        appenders: {
            out: {type: 'console'},
            task: {
                type: 'file',
                filename: 'logs/wugmsNodeMySQLLoader',
                maxLogSize: 10485760,
                backups: 5
            }
        },
        categories: {
            default: {appenders: ['out', 'task'], level: 'info'},
            task: {appenders: ['task'], level: 'debug'}
        }
    });
}

function defaultValue(value) {
    if (value) {
        return value;
    } else {
        return "N/A";
    }
}

function loadDataMySQL(sql_query_param, service) {
    var connection = mysql.createConnection({
        host: appConfig.database.host,
        user: appConfig.database.username,
        password: appConfig.database.password,
        database: appConfig.database.schema
    });
    connection.connect(function (err) {
        if (err) {
            logger.error('[MySQL] MySQL connecting... ' + err);
            writeData(sql_query_param, service);
            return;
        }
        logger.debug('[MySQL] Connected as ID ' + connection.threadId);
    });
    connection.query(sql_query_param, function (error, results, fields) {
        if (error) {
            logger.error("[MySQL] Error; Code: " + error.code + " ; Errno: " + error.errno + " ; sqlState: " + error.sqlState + " ;   " + sql_query_param);
            writeData(sql_query_param, service);
        } else {
            logger.info('[MySQL] Results from row insert for service -> ' + service + ' affectedRows -> ' + results.affectedRows + ' serverStatus -> ' + results.serverStatus + ' message -> ' + defaultValue(results.message));
        }
    });
//    connection.end(function (err) {
//        if (err)
//            logger.error("[MySQL] Error; Code: " + err);
//        return msg;
//    });
    connection.end();
}

function writeData(data, service) {
    fn = moment().format("YYYYMMDD") + "_" + service + ".sql";
    date_comment = "/* " + moment().format("YYYY/MM/DD HH:mm:ss.SSS") + " */ ";
    fs.appendFileSync(fn, date_comment + "\r\n");
    fs.appendFileSync(fn, data + "\r\n");
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
                strMsg = msg.content.toString();
                JSONPayload = JSON.parse(strMsg);
                loadDataMySQL(JSONPayload.sql, JSONPayload.service);
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