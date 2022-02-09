import winston from 'winston';
import config from './config';

export default winston.createLogger({
  level: config.debugLogging ? 'debug' : 'info',
  format: 
      winston.format.combine(
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.simple(),
    ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});
