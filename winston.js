'use strict';
const winston = require('winston');
const fs = require('fs');
const env = process.env.NODE_ENV || 'development';
const logDir = 'log';
// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}
const alignedWithColorsAndTime = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.align(),
    winston.format.printf((info) => {
      const {
        timestamp, level, message, ...args
      } = info;

      const ts = timestamp.slice(0, 19).replace('T', ' ');
      return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
    }),
  );
  
module.exports = winston.createLogger({
    transports: [
        // colorize the output to the console
        new (winston.transports.Console)({
            format:alignedWithColorsAndTime,
            timestamp: true,
            colorize: true,
            level: 'info',
        }),
        new (winston.transports.File)({
            format: alignedWithColorsAndTime,
            filename: `${logDir}/results.log`,
            level: env === 'development' ? 'debug' : 'info'
        })
    ]
});