/* eslint-disable no-underscore-dangle */
const debug = require('@dabh/diagnostics')('logger');
const uuid = require('uuid').v4;
const context = require('./async_context');

/**
 * env variables
 * process.env.LOG_LEVEL - manage log verbosity
 */

// logger instance
let { logger } = require('./default-loggers/winston-logger');

// proxify logger instances to use child logger from context if it exists
module.exports.logger = new Proxy(logger, {
  get(target, property, receiver) {
    debug(`proxify logger.${property}`);
    const store = context.getStore();
    // debug('current store', store);
    target = store
      ? store.get('logger')
      : target;
    return Reflect.get(target, property, receiver);
  },
});

// const mergeContext = (meta) => {
//   const store = context.getStore();

//   const currentLogger = store
//     ? store.get('logger')
//     : logger;
//   const currentMeta = currentLogger.defaultMeta;
//   console.log(currentMeta);
// };
const withContext = (meta) => (next) => {
  debug('add context', meta);
  meta = meta || { };

  const currentStore = context.getStore();
  debug('current store', currentStore);

  const child = logger.child({
    ...meta,
    sessionId: meta.sessionId || uuid(),
  });
  // const child = logger.child(meta);
  const store = new Map();
  store.set('logger', child);
  store.set('sessionId', meta.sessionId);
  return context.run(store, next);
};

/**
 * Attach context info to context to logger in current session
 *
 * @param {*} opt options
 * @param {string=} opt.idField - idField
 * @param {string=} opt.ontextField - contextField
 * @param {function=} opt.id - id mapper
 * @param {function=} opt.context - context mapper
 * @param {Object=} opt.loggerInstance - custom loggerInstance
 * @returns
 */
module.exports.contextMiddleware = (opt) => (req, res, next) => {
  debug('contextMiddleware');
  opt = opt || {};

  if (opt.loggerInstance && !opt.loggerInstance.child) {
    throw new Error('invalid logger instance');
  }
  if (opt.idField && typeof opt.idField !== 'string') {
    throw new Error('idField must be a string');
  }
  if (opt.contextField && typeof opt.contextField !== 'string') {
    throw new Error('contextField must be a string');
  }
  if (opt.context && typeof opt.context !== 'function') {
    throw new Error('context must be a function');
  }
  if (opt.id && typeof opt.id !== 'function') {
    throw new Error('id must be a function');
  }

  opt.idField = opt.idField || 'id';
  opt.contextField = opt.contextField || 'context';
  opt.context = opt.context || function (req) { return null; };
  opt.id = opt.id || function (req) { return null; };

  opt.loggerInstance = opt.loggerInstance || logger;
  logger = opt.loggerInstance;

  const ctx = opt.context(req);
  const id = opt.id(req) || uuid();

  const withCurrentContext = withContext({
    [opt.idField]: id,
    [opt.contextField]: ctx,
  });
  return withCurrentContext(next);
};

module.exports.withContext = withContext;
