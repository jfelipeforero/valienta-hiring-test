import promiseBackoffClient, { IExponentialConfig } from '../../../src/gateway/promiseBackoffClient';

describe('exponential backoff', () => {
  describe('when promise resolves immediately', () => {
    test('should return result', async () => {
      const promiseFunction = async (p: number): Promise<number> => p;

      const result: number = await promiseBackoffClient.exponential<number>(undefined, promiseFunction, 5);

      expect(result).toEqual(5);
    });
  });

  describe('when promise resolves after some tries', () => {
    test('should return result', async () => {
      const promiseFunction = jest.fn()
        .mockRejectedValueOnce(new Error('failed first attempt'))
        .mockResolvedValueOnce(5);

      const result = await promiseBackoffClient.exponential<number>(undefined, promiseFunction, 5);

      expect(result).toBe(5);
      expect(promiseFunction).toHaveBeenNthCalledWith(1, 5);
      expect(promiseFunction).toHaveBeenNthCalledWith(2, 5);
    });
  });

  describe('when promise does not resolve', () => {
    test('should throw error', async () => {
      const promiseFunction = jest.fn()
        .mockRejectedValue(new Error('failed all attempts'));

      const config: IExponentialConfig = {
        waitTimeMillis: 10,
        maximumTries: 3
      };

      await expect(promiseBackoffClient.exponential<number>(config, promiseFunction, 5)).rejects.toThrowError('failed all attempts');

      expect(promiseFunction).toHaveBeenNthCalledWith(1, 5);
      expect(promiseFunction).toHaveBeenNthCalledWith(2, 5);
      expect(promiseFunction).toHaveBeenNthCalledWith(3, 5);
    });
  });
});
