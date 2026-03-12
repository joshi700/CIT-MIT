const express = require('express');
const { v4: uuidv4 } = require('uuid');
const mastercard = require('../services/mastercard');
const config = require('../config');
const router = express.Router();

let sessions; // Will be set from app.js

router.init = (sessionsMap) => {
  sessions = sessionsMap;
};

// Process CIT subscription: 3DS + Authorize + Tokenize
router.post('/', async (req, res, next) => {
  try {
    const { demoSessionId, gatewaySessionId } = req.body;
    const session = sessions.get(demoSessionId);
    if (!session) {
      return res.status(404).json({ error: { message: 'Demo session not found' } });
    }

    const orderId = `ORD-${Date.now()}`;
    const transactionId = `TXN-${Date.now()}`;
    const authTransactionId = `AUTH-${Date.now()}`;
    const agreementId = `AGREE-${Date.now()}`;
    const apiLogs = [];

    // Step 1: Update session with order details
    const updateResult = await mastercard.updateSession(gatewaySessionId, {
      order: {
        amount: session.plan.price.toString(),
        currency: 'USD',
      },
    });
    apiLogs.push({ step: 'Update Session', ...updateResult.apiLog });

    // Step 2: Initiate 3DS Authentication
    const initAuthResult = await mastercard.initiateAuthentication(
      orderId,
      authTransactionId,
      gatewaySessionId,
      { amount: session.plan.price.toString(), currency: 'USD' }
    );
    apiLogs.push({ step: 'Initiate Authentication', ...initAuthResult.apiLog });

    if (!initAuthResult.success) {
      return res.status(400).json({
        error: initAuthResult.data,
        apiLogs,
        step: 'INITIATE_AUTHENTICATION',
      });
    }

    // Return authentication data for frontend 3DS handling
    session.currentOrder = {
      orderId,
      transactionId,
      authTransactionId,
      agreementId,
      gatewaySessionId,
    };
    session.cardholderConsent = true;

    res.json({
      orderId,
      transactionId,
      authTransactionId,
      agreementId,
      gatewaySessionId,
      authenticationData: initAuthResult.data,
      gatewayRecommendation: initAuthResult.data?.response?.gatewayRecommendation ||
        initAuthResult.data?.authentication?.['3ds']?.gatewayRecommendation,
      apiLogs,
    });
  } catch (err) {
    next(err);
  }
});

// Authenticate payer (3DS challenge step)
router.post('/authenticate', async (req, res, next) => {
  try {
    const { demoSessionId, orderId, authTransactionId, gatewaySessionId, redirectResponseUrl } = req.body;
    const session = sessions.get(demoSessionId);
    if (!session) {
      return res.status(404).json({ error: { message: 'Demo session not found' } });
    }

    const result = await mastercard.authenticatePayer(
      orderId,
      authTransactionId,
      gatewaySessionId,
      redirectResponseUrl || `http://localhost:${config.port}/api/subscribe/auth-callback`
    );

    res.json({
      authenticationData: result.data,
      success: result.success,
      apiLog: result.apiLog,
    });
  } catch (err) {
    next(err);
  }
});

// Complete payment after 3DS (Authorize + Tokenize)
router.post('/complete', async (req, res, next) => {
  try {
    const { demoSessionId } = req.body;
    const session = sessions.get(demoSessionId);
    if (!session || !session.currentOrder) {
      return res.status(404).json({ error: { message: 'Session or order not found' } });
    }

    const { orderId, transactionId, authTransactionId, agreementId, gatewaySessionId } = session.currentOrder;
    const apiLogs = [];

    // Step 3: Authorize (CIT)
    const authResult = await mastercard.authorizeCIT(
      orderId,
      transactionId,
      gatewaySessionId,
      { amount: session.plan.price.toString(), currency: 'USD' }
    );
    apiLogs.push({ step: 'Authorize (CIT)', ...authResult.apiLog });

    // Step 4: Capture
    const captureTransactionId = `CAP-${Date.now()}`;
    const captureResult = await mastercard.capture(
      orderId,
      captureTransactionId,
      session.plan.price.toString(),
      'USD'
    );
    apiLogs.push({ step: 'Capture', ...captureResult.apiLog });

    // Step 5: Tokenize for future MIT
    const tokenResult = await mastercard.tokenize(gatewaySessionId);
    apiLogs.push({ step: 'Tokenize (Store COF)', ...tokenResult.apiLog });

    const token = tokenResult.success ? tokenResult.data?.token : null;
    session.storedCredentialToken = token;
    session.agreementId = agreementId;

    // Record CIT transaction
    const transaction = {
      id: transactionId,
      type: 'CIT',
      subType: 'FIRST_STORED',
      amount: session.plan.price,
      currency: 'USD',
      status: authResult.success ? 'SUCCESS' : 'FAILED',
      threeDSRequired: true,
      threeDSResult: 'AUTHENTICATED',
      orderId,
      apiLogs,
      timestamp: new Date().toISOString(),
    };
    session.transactions.push(transaction);

    res.json({
      transaction,
      token,
      agreementId,
      apiLogs,
    });
  } catch (err) {
    next(err);
  }
});

// 3DS redirect callback
router.post('/auth-callback', (req, res) => {
  // Return an HTML page that posts back to the frontend
  res.send(`
    <html>
    <body>
      <script>
        window.opener?.postMessage({ type: '3DS_CALLBACK', data: ${JSON.stringify(req.body)} }, '*');
        window.parent?.postMessage({ type: '3DS_CALLBACK', data: ${JSON.stringify(req.body)} }, '*');
      </script>
      <p>Authentication complete. This window will close automatically.</p>
    </body>
    </html>
  `);
});

router.get('/auth-callback', (req, res) => {
  res.send(`
    <html>
    <body>
      <script>
        window.opener?.postMessage({ type: '3DS_CALLBACK', data: ${JSON.stringify(req.query)} }, '*');
        window.parent?.postMessage({ type: '3DS_CALLBACK', data: ${JSON.stringify(req.query)} }, '*');
      </script>
      <p>Authentication complete. This window will close automatically.</p>
    </body>
    </html>
  `);
});

module.exports = router;
