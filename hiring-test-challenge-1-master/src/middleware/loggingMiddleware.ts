import Koa from 'koa';
import logger from '../logger';

export default async (ctx: Koa.Context, next: () => Promise<any>) => {
  const start = new Date().getTime();

  await next();

  const ms = new Date().getTime() - start;

  let logLevel: string;
  if (ctx.status >= 500) {
    logLevel = 'error';
  } else if (ctx.status >= 400) {
    logLevel = 'warn';
  } else if (ctx.status >= 100) {
    logLevel = 'info';
  }

  const msg: string = `${ctx.method} ${ctx.originalUrl} ${ctx.status} ${ms}ms`;

  logger.log(logLevel, msg);
};

