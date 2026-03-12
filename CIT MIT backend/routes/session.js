const express = require('express');
const { v4: uuidv4 } = require('uuid');
const mastercard = require('../services/mastercard');
const router = express.Router();

// In-memory session store
const sessions = new Map();

// Create a new demo session
router.post('/', (req, res) => {
  const sessionId = uuidv4();
  const session = {
    sessionId,
    plan: { name: 'Monthly Subscription', price: 9.99, interval: 'monthly' },
    cardholderConsent: false,
    storedCredentialToken: null,
    agreementId: null,
    gatewaySessionId: null,
    transactions: [],
    createdAt: new Date().toISOString(),
  };
  sessions.set(sessionId, session);
  res.json({ session });
});

// Get session state
router.get('/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: { message: 'Session not found' } });
  }
  res.json({ session });
});

// Create Mastercard Gateway session for Hosted Session
router.post('/hosted-session', async (req, res, next) => {
  try {
    const { demoSessionId } = req.body;
    const session = sessions.get(demoSessionId);
    if (!session) {
      return res.status(404).json({ error: { message: 'Demo session not found' } });
    }

    const result = await mastercard.createSession();
    if (result.success) {
      session.gatewaySessionId = result.data.session.id;
      res.json({
        gatewaySessionId: result.data.session.id,
        apiLog: result.apiLog,
      });
    } else {
      res.status(400).json({ error: result.data, apiLog: result.apiLog });
    }
  } catch (err) {
    next(err);
  }
});

// Export sessions map for other routes to access
router.sessions = sessions;

module.exports = router;
