let moment = require('moment');
let now = new moment();
let fl = require('./fileLogs');
let fileLogs = new fl();

class Logs {
    static log(type, action, message) {
        let timestamp = now.format("DD/MM/YYYY HH:mm:ss:SSS");
        let logEntry = "[ " + timestamp + " ] [ " + type + " ] [ " + action + " ] " + message;

        console.log(logEntry);
        
        if(!process.env.DOMAIN)
            fileLogs.logToFile(logEntry + "\r\n");
    }

    static error(action, message) {
        log("ERROR", action, message);
    }

    static logToFile(message) {
        fileLogs.logToFile(message + "\r\n\r\n");
    }
}

module.exports = Logs;