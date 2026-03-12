const axios = require('axios');
const config = require('../config');

const client = axios.create({
  baseURL: config.baseUrl,
  auth: config.auth,
  headers: { 'Content-Type': 'application/json' },
});

// Wrap API calls to capture request/response for dev console
async function apiCall(method, path, data = null) {
  const url = `${config.baseUrl}${path}`;
  const requestLog = {
    method: method.toUpperCase(),
    url,
    body: data,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await client({ method, url: path, data });
    return {
      success: true,
      data: response.data,
      apiLog: {
        request: requestLog,
        response: {
          status: response.status,
          body: response.data,
          timestamp: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    const errData = error.response?.data || { message: error.message };
    return {
      success: false,
      data: errData,
      apiLog: {
        request: requestLog,
        response: {
          status: error.response?.status || 500,
          body: errData,
          timestamp: new Date().toISOString(),
        },
      },
    };
  }
}

// Create a gateway session for Hosted Session
async function createSession() {
  return apiCall('post', '/session', {});
}

// Update session with order info (used before 3DS)
async function updateSession(sessionId, orderData) {
  return apiCall('put', `/session/${sessionId}`, orderData);
}

// Initiate 3DS Authentication
async function initiateAuthentication(orderId, transactionId, sessionId, orderInfo) {
  return apiCall('put', `/order/${orderId}/transaction/${transactionId}`, {
    apiOperation: 'INITIATE_AUTHENTICATION',
    authentication: {
      acceptVersions: '3DS1,3DS2',
      channel: 'PAYER_BROWSER',
      purpose: 'PAYMENT_TRANSACTION',
    },
    correlationId: 'test',
    order: {
      amount: orderInfo.amount,
      currency: orderInfo.currency,
    },
    session: {
      id: sessionId,
    },
    sourceOfFunds: {
      type: 'CARD',
    },
  });
}

// Authenticate Payer (3DS challenge)
async function authenticatePayer(orderId, transactionId, sessionId, redirectResponseUrl) {
  return apiCall('put', `/order/${orderId}/transaction/${transactionId}`, {
    apiOperation: 'AUTHENTICATE_PAYER',
    authentication: {
      redirectResponseUrl,
    },
    correlationId: 'test',
    device: {
      browser: 'MOZILLA',
      browserDetails: {
        '3DSecureChallengeWindowSize': 'FULL_SCREEN',
        acceptHeaders: 'application/json',
        colorDepth: 24,
        javaEnabled: true,
        language: 'en-US',
        screenHeight: 640,
        screenWidth: 480,
        timeZone: 0,
      },
    },
    session: {
      id: sessionId,
    },
  });
}

// Authorize payment (CIT - first stored)
async function authorizeCIT(orderId, transactionId, sessionId, orderInfo) {
  return apiCall('put', `/order/${orderId}/transaction/${transactionId}`, {
    apiOperation: 'AUTHORIZE',
    authentication: {
      transactionId,
    },
    order: {
      amount: orderInfo.amount,
      currency: orderInfo.currency,
      reference: orderId,
    },
    session: {
      id: sessionId,
    },
    sourceOfFunds: {
      type: 'CARD',
    },
    transaction: {
      source: 'INTERNET',
      reference: orderId,
    },
    agreement: {
      type: 'RECURRING',
      id: `agree-${orderId}`,
    },
  });
}

// Capture (complete) the authorized payment
async function capture(orderId, transactionId, amount, currency) {
  return apiCall('put', `/order/${orderId}/transaction/${transactionId}`, {
    apiOperation: 'CAPTURE',
    transaction: {
      amount,
      currency,
      reference: orderId,
    },
  });
}

// Tokenize card for future MIT
async function tokenize(sessionId) {
  return apiCall('post', '/token', {
    session: {
      id: sessionId,
    },
    sourceOfFunds: {
      type: 'CARD',
    },
  });
}

// Pay MIT - Recurring
async function payMITRecurring(orderId, transactionId, token, amount, currency, agreementId) {
  return apiCall('put', `/order/${orderId}/transaction/${transactionId}`, {
    apiOperation: 'PAY',
    order: {
      amount,
      currency,
      reference: orderId,
    },
    sourceOfFunds: {
      type: 'CARD',
      token,
    },
    transaction: {
      source: 'MERCHANT',
      reference: orderId,
    },
    agreement: {
      type: 'RECURRING',
      id: agreementId,
    },
  });
}

// Pay MIT - Unscheduled
async function payMITUnscheduled(orderId, transactionId, token, amount, currency, agreementId) {
  return apiCall('put', `/order/${orderId}/transaction/${transactionId}`, {
    apiOperation: 'PAY',
    order: {
      amount,
      currency,
      reference: orderId,
    },
    sourceOfFunds: {
      type: 'CARD',
      token,
    },
    transaction: {
      source: 'MERCHANT',
      reference: orderId,
    },
    agreement: {
      type: 'UNSCHEDULED',
      id: agreementId,
    },
  });
}

module.exports = {
  createSession,
  updateSession,
  initiateAuthentication,
  authenticatePayer,
  authorizeCIT,
  capture,
  tokenize,
  payMITRecurring,
  payMITUnscheduled,
};
