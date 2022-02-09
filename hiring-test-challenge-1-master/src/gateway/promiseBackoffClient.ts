import logger from '../logger';

const DEFAULT_CONFIG: IExponentialConfig = {
  waitTimeMillis: 500,
  maximumTries: 5
};

async function exponential<T>(config: IExponentialConfig, promiseFunction: (...args: any) => Promise<T>, ...promiseArgs: any): Promise<T> {
  const { maximumTries, waitTimeMillis }: IExponentialConfig = config ? { ...DEFAULT_CONFIG, ...config } : DEFAULT_CONFIG;

  let success: boolean = false;
  let tries: number = 1;
  let result: T;
  let lastError: Error;

  while (!success && tries <= maximumTries) {
    try {
      // eslint-disable-next-line no-await-in-loop
      result = await promiseFunction(...promiseArgs);

      success = true;
    } catch (e) {
      lastError = e;

      const waitTime = waitTimeMillis * (2 ** tries - 1);

      if (tries < maximumTries) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      tries += 1;
      logger.warn(`Attempt ${tries} failed, backing off for ${waitTime}, error: ${e}`);
    }
  }

  if (result === undefined) {
    throw lastError;
  }

  return result;
}

export interface IExponentialConfig {
  waitTimeMillis?: number,
  maximumTries?: number
}

export default {
  exponential
};
