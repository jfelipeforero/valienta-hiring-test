import { BaseContext } from 'koa';
import healthController from '../../../src/application/messageController';

describe('Ping', () => {
  test('should return pong', async () => {
    const context: BaseContext = {} as unknown as BaseContext;

    await healthController.ping(context);
    expect(context.status).toBe(200);
    expect(context.body).toStrictEqual({ pong: 'pong' });
  });
});
