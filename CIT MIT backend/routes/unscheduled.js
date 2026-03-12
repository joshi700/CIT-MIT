const express = require('express');
const mastercard = require('../services/mastercard');
const router = express.Router();

let sessions;

router.init = (sessionsMap) => {
  sessions = sessionsMap;
};

// Process MIT unscheduled payment (prorated or penalty)
router.post('/', async (req, res, next) => {
  try {
    const { demoSessionId, amount, description } = req.body;
    const session = sessions.get(demoSessionId);
    if (!session) {
      return res.status(404).json({ error: { message: 'Demo session not found' } });
    }
    if (!session.storedCredentialToken) {
      return res.status(400).json({ error: { message: 'No stored credential. Complete Act 1 (CIT) first.' } });
    }

    const chargeAmount = amount || '5.00';
    const orderId = `ORD-UNS-${Date.now()}`;
    const transactionId = `TXN-UNS-${Date.now()}`;

    const result = await mastercard.payMITUnscheduled(
      orderId,
      transactionId,
      session.storedCredentialToken,
      chargeAmount,
      'USD',
      session.agreementId
    );

    const transaction = {
      id: transactionId,
      type: 'MIT',
      subType: 'UNSCHEDULED',
      amount: parseFloat(chargeAmount),
      currency: 'USD',
      status: result.success ? 'SUCCESS' : 'FAILED',
      threeDSRequired: false,
      threeDSResult: null,
      orderId,
      description: description || 'Unscheduled charge',
      apiLogs: [{ step: `Pay (MIT - Unscheduled: ${description || 'charge'})`, ...result.apiLog }],
      timestamp: new Date().toISOString(),
    };
    session.transactions.push(transaction);

    res.json({ transaction, apiLogs: transaction.apiLogs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
