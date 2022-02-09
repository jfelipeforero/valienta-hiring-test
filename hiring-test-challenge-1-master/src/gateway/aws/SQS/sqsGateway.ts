import AWS from 'aws-sdk';
import https from 'https';
import config from '../../../config';
import logger from '../../../logger';

// This is to reuse the http connection and reduce latency. (https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/node-reusing-connections.html)
const agent = new https.Agent({
  keepAlive: true,
  // Infinity is read as 50 sockets
  maxSockets: Infinity
});
// Credentials are loaded from enviroment variables by AWS SDK. (AWS_ACCESS_KEY_ID)(AWS_SECRET_ACCESS_KEY)
const sqsClient: AWS.SQS = new AWS.SQS({ region: config.awsConfig.region, httpOptions: { agent } });

async function pollMessages(): Promise<AWS.SQS.Message[]> {
  const params: AWS.SQS.ReceiveMessageRequest = {
    QueueUrl: config.awsConfig.warehouseServiceQueueUrl,
    WaitTimeSeconds: 20, // Long polling
    MaxNumberOfMessages: 10,
    VisibilityTimeout: 30,
    AttributeNames: ['MessageGroupId'],
    MessageAttributeNames: ['All']
  };

  try {
    const receivedMessage: AWS.SQS.ReceiveMessageResult = await sqsClient.receiveMessage(params).promise();

    if (receivedMessage.Messages && receivedMessage.Messages.length > 0) {
      return receivedMessage.Messages;
    }
    return null;
  } catch (error) {
    logger.error(`Error polling messages from queue. Error: ${error.message}: ${error.stack}`);
    throw new Error('Error polling messages from queue');
  }
}

async function deleteMessage(messageToDelete: AWS.SQS.Message) {
  const params: AWS.SQS.DeleteMessageRequest = {
    QueueUrl: config.awsConfig.warehouseServiceQueueUrl,
    ReceiptHandle: messageToDelete.ReceiptHandle
  };

  try {
    await sqsClient.deleteMessage(params).promise();
  } catch (error) {
    logger.error(`Error deleting message from queue. Error: ${error.message}: ${error.stack}`);
    throw new Error('Error deleting message from queue.');
  }
}

async function processMessagesInBatch(messages: AWS.SQS.Message[], handler: (data: AWS.SQS.Message)=> Promise<void>) {
  for (let index = 0; index < messages.length; index += 1) {
    const currentMessage: AWS.SQS.Message = messages[index];

    // eslint-disable-next-line no-await-in-loop
    await handler(currentMessage);
    // eslint-disable-next-line no-await-in-loop
    await deleteMessage(currentMessage);
    logger.info('Message from queue processed successfully.');
  }
}

/**
 * If the handler runs without throwing exemptions, the message will be removed from the queue.
 * @param handler Handler of event data
 */
async function pollAndDeleteMessagesFromSQS(handler: (data: AWS.SQS.Message)=> Promise<void>) {
  const messages: AWS.SQS.Message[] = await pollMessages();

  if (!messages) {
    // There are no new messages to process
    return;
  }
  logger.info(`${messages.length} messages polled from queue`);
  const messageGroups: {[groupId: string]: AWS.SQS.Message[]} = {};

  for (let index = 0; index < messages.length; index += 1) {
    const currentMessage: AWS.SQS.Message = messages[index];
    const groupId: string = currentMessage.Attributes.MessageGroupId;

    if (!messageGroups[groupId]) {
      messageGroups[groupId] = [];
    }
    messageGroups[groupId].push(currentMessage);
  }
  const messageGroupsArray: AWS.SQS.Message[][] = Object.values(messageGroups);

  for (let index = 0; index < messageGroupsArray.length; index += 1) {
    processMessagesInBatch(messageGroupsArray[index], handler).catch((error) => {
      logger.error(`Error processing message from queue. Error: ${error.message}: ${error.stack}`);
    });
  }
}

export default {
  pollAndDeleteMessagesFromSQS
};
