/* eslint-disable import/prefer-default-export */
import { BaseContext } from 'koa';
import StatusCodes from 'http-status-codes';

export function permit(...permittedRoles: Array<string>) {
  return async (ctx: BaseContext, next: Function) => {
    let roles: Array<string>;
    try {
      roles = JSON.parse(ctx.headers.roles as string);
    } catch (e) {
      ctx.body = { message: 'Warehouse service Access Denied. You do not have permission to access this resource' };
      ctx.status = StatusCodes.FORBIDDEN;
      return;
    }
    if (!permittedRoles.some((role) => roles?.includes(role))) {
      ctx.body = { message: 'Warehouse service Access Denied. You do not have the required Rol to access this resource' };
      ctx.status = StatusCodes.FORBIDDEN;
      return;
    }
    await next();
  };
}
