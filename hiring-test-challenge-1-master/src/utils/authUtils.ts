import crypto from 'crypto';

function generateHMAC(dataToHash: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  const data = hmac.update(dataToHash);
  const genHmac = data.digest('hex');

  return genHmac;
}

export default {
  generateHMAC
};
