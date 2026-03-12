const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');

const sessionRoutes = require('./routes/session');
const subscribeRoutes = require('./routes/subscribe');
const recurringRoutes = require('./routes/recurring');
const unscheduledRoutes = require('./routes/unscheduled');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Share session store across routes
const sessions = sessionRoutes.sessions;
subscribeRoutes.init(sessions);
recurringRoutes.init(sessions);
unscheduledRoutes.init(sessions);

// API routes
app.use('/api/session', sessionRoutes);
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/unscheduled', unscheduledRoutes);

// Gateway config endpoint (for frontend to load session.js)
app.get('/api/config', (req, res) => {
  res.json({
    merchantId: config.merchantId,
    gatewayUrl: config.gatewayUrl,
    apiVersion: config.apiVersion,
  });
});

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`CIT/MIT Demo Server running on http://localhost:${config.port}`);
  console.log(`Merchant ID: ${config.merchantId}`);
  console.log(`Gateway: ${config.gatewayUrl}`);
});
