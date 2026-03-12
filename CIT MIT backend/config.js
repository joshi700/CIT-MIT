require('dotenv').config({ path: '../.env' });

module.exports = {
  merchantId: process.env.MERCHANT_ID || 'TESTMIDtesting00',
  apiUsername: process.env.API_USERNAME || 'merchant.TESTMIDtesting00',
  apiPassword: process.env.API_PASSWORD || '9233298fcaa1c01f578759954343aca1',
  gatewayUrl: process.env.GATEWAY_URL || 'https://na.gateway.mastercard.com',
  apiVersion: process.env.API_VERSION || '81',
  port: process.env.PORT || 3001,

  get baseUrl() {
    return `${this.gatewayUrl}/api/rest/version/${this.apiVersion}/merchant/${this.merchantId}`;
  },

  get auth() {
    return {
      username: this.apiUsername,
      password: this.apiPassword,
    };
  },
};
