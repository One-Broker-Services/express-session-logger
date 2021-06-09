/* eslint-disable no-underscore-dangle */
const { transports, format } = require('winston');
// const { ElasticsearchTransport } = require('winston-elasticsearch');
// const Sentry = require('winston-transport-sentry');
// TODO: integrate sentry
// logger.add(new Sentry({
//   level: process.env.LOG_LEVEL_SENTRY,
//   dsn: '{{ YOUR SENTRY DSN }}',
//   tags: { key: 'value' },
//   extra: { key: 'value' },
//   patchGlobal: false,
// }));

// require('winston-logstash');

//   winston.add(winston.transports.Logstash, {
//     port: 28777,
//     node_name: 'my node name',
//     host: '127.0.0.1'
//   });

const cliConsole = new transports.Console({
  format: format.combine(
    format.colorize(),
    format.printf((info) => {
      let msg = `${info.level} ${info.message}`;
      if (info.sessionId) msg = `${info.sessionId} ${msg}`;
      return msg;
    }),
  ),
});

const jsonConsole = new transports.Console({
  format: format.combine(
    format.json(),
  ),
});

const getFileTransporter = (level) => {
  // eslint-disable-next-line global-require
  require('winston-daily-rotate-file');
  return new transports.DailyRotateFile({
    // handleExceptions: true,
    filename: `logs/%DATE%-${level}.log`,
    // auditFile: 'logs/%DATE%-audit.json',
    level,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '32m',
    maxFiles: '24h',
    stream: null,
    format: format.combine(
      format.json(),
    ),
  });
};

// const esl = new ElasticsearchTransport({
//   level: 'error',
// });

module.exports = {
  cliConsole,
  jsonConsole,
  file: (level) => getFileTransporter(level),
  // esl,
};
