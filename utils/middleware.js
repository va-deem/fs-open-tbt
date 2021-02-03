const morgan = require('morgan');
const logger = require('./logger');

morgan.token('body', (req) => JSON.stringify(req.body));

const requestLogger = morgan(':method :url :status :res[content-length] - :response-time ms :body');

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' });
};

const errorHandler = (err, req, res, next) => {
  console.error(err.message);

  if (err.name === 'CastError') {
    return res.status(400).send({ error: 'malformatted id' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'invalid token' });
  }

  logger.error(err.message);

  next(err);
};

const tokenExtractor = (req, res, next) => {
  const authorization = req.get('authorization');
  if (authorization && authorization.toLowerCase()
    .startsWith('bearer ')) {
    req.token = authorization.substring(7);
  } else {
    req.token = null;
  }

  next();
};

module.exports = {
  requestLogger, unknownEndpoint, errorHandler, tokenExtractor,
};
