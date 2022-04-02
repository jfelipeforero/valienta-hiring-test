import axios from 'axios';

const sendSlackNotification = async (message): Promise<void> => {
  await axios.post(process.env.SLACK_WEBHOOKURL, message);
};

export default sendSlackNotification;
