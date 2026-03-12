const express = require('express');
const mastercard = require('../services/mastercard');
const router = express.Router();

let sessions;

router.init = (sessionsMap) => {
  sessions = sessionsMap;
};

// Process MIT recurring payment
router.post('/', async (req, res, next) => {
  try {
    const { demoSessionId } = req.body;
    const session = sessions.get(demoSessionId);
    if (!session) {
      return res.status(404).json({ error: { message: 'Demo session not found' } });
    }
    if (!session.storedCredentialToken) {
      return res.status(400).json({ error: { message: 'No stored credential. Complete Act 1 (CIT) first.' } });
    }

    const orderId = `ORD-REC-${Date.now()}`;
    const transactionId = `TXN-REC-${Date.now()}`;

    const result = await mastercard.payMITRecurring(
      orderId,
      transactionId,
      session.storedCredentialToken,
      session.plan.price.toString(),
      'USD',
      session.agreementId
    );

    const transaction = {
      id: transactionId,
      type: 'MIT',
      subType: 'RECURRING',
      amount: session.plan.price,
      currency: 'USD',
      status: result.success ? 'SUCCESS' : 'FAILED',
      threeDSRequired: false,
      threeDSResult: null,
      orderId,
      apiLogs: [{ step: 'Pay (MIT - Recurring)', ...result.apiLog }],
      timestamp: new Date().toISOString(),
    };
    session.transactions.push(transaction);

    res.json({ transaction, apiLogs: transaction.apiLogs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
