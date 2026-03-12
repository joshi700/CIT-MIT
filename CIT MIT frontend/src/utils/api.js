import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export async function createDemoSession() {
  const { data } = await api.post('/session');
  return data;
}

export async function getDemoSession(sessionId) {
  const { data } = await api.get(`/session/${sessionId}`);
  return data;
}

export async function createHostedSession(demoSessionId) {
  const { data } = await api.post('/session/hosted-session', { demoSessionId });
  return data;
}

export async function initiateSubscription(demoSessionId, gatewaySessionId) {
  const { data } = await api.post('/subscribe', { demoSessionId, gatewaySessionId });
  return data;
}

export async function authenticatePayer(demoSessionId, orderId, authTransactionId, gatewaySessionId) {
  const { data } = await api.post('/subscribe/authenticate', {
    demoSessionId,
    orderId,
    authTransactionId,
    gatewaySessionId,
    redirectResponseUrl: `${window.location.origin}/api/subscribe/auth-callback`,
  });
  return data;
}

export async function completeSubscription(demoSessionId) {
  const { data } = await api.post('/subscribe/complete', { demoSessionId });
  return data;
}

export async function processRecurring(demoSessionId) {
  const { data } = await api.post('/recurring', { demoSessionId });
  return data;
}

export async function processUnscheduled(demoSessionId, amount, description) {
  const { data } = await api.post('/unscheduled', { demoSessionId, amount, description });
  return data;
}

export async function getGatewayConfig() {
  const { data } = await api.get('/config');
  return data;
}
