import AWS from 'aws-sdk';
import logger from '../../../logger';
import config from '../../../config';
import WarehouseEvent from '../../../domain/Table';

// Credentials are loaded from enviroment variables by AWS SDK. (AWS_ACCESS_KEY_ID)(AWS_SECRET_ACCESS_KEY)
const snsClient: AWS.SNS = new AWS.SNS({ region: config.awsConfig.region });

async function publishMessageToTopic(event: WarehouseEvent) {
  const messageAttributes: AWS.SNS.MessageAttributeMap = {
    eventType: { DataType: 'String', StringValue: event.warehouseEventType.value },
  };
  const params: AWS.SNS.PublishInput = {
    Message: JSON.stringify(event.data),
    MessageAttributes: messageAttributes,
    MessageGroupId: event.warehouse.id,
    TopicArn: config.awsConfig.warehouseServiceTopicARN,
    MessageDeduplicationId: event.id,
  };

  try {
    logger.info(`Publishing event with id ${event.id} to WarehouseServiceTopic`);
    await snsClient.publish(params).promise();
  } catch (error) {
    logger.error(
      `Error publishing event with id (${event.id}) to SNS WarehouseServiceTopic. Error: ${error.message}: ${error.stack}`
    );
    throw new Error('Error publishing event to SNS topic');
  }
}
export default {
  publishMessageToTopic,
};
