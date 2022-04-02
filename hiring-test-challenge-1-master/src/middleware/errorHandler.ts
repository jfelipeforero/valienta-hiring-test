import StatusCodes from 'http-status-codes';
import logger from '../logger';

async function handler(ctx: any, next: any) {
  try {
    await next();
  } catch (err) {
    ctx.status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    ctx.body = {
      err: err.message || 'Internal server error',
      errorCode: err.statusCode || 'NoErrorCodeProvided',
    };
    logger.error(`Unhandled error has been caught: ${err.name}-${err.message}: ${err.stack}`);
  }
}

export default handler;
