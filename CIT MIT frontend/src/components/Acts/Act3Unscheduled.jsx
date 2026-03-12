import { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { processUnscheduled } from '../../utils/api';
import './Acts.css';

export default function Act3Unscheduled() {
  const { state, dispatch, addApiLogs } = useSession();
  const [step, setStep] = useState('intro'); // intro | prorated | penalty | complete
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const updateStep = (newStep) => {
    setStep(newStep);
    const stepMap = { intro: 0, prorated: 1, penalty: 2, complete: 3 };
    dispatch({ type: 'SET_STEP', payload: stepMap[newStep] || 0 });
  };

  const handleProrated = async () => {
    try {
      setError(null);
      dispatch({ type: 'SET_LOADING', payload: true });
      updateStep('prorated');

      const result = await processUnscheduled(state.demoSessionId, '5.00', 'Plan Upgrade (Prorated)');
      addApiLogs(result.apiLogs);
      dispatch({ type: 'ADD_TRANSACTION', payload: result.transaction });
      setTransactions((prev) => [...prev, result.transaction]);

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handlePenalty = async () => {
    try {
      setError(null);
      dispatch({ type: 'SET_LOADING', payload: true });
      updateStep('penalty');

      const result = await processUnscheduled(state.demoSessionId, '25.00', 'No-Show Penalty');
      addApiLogs(result.apiLogs);
      dispatch({ type: 'ADD_TRANSACTION', payload: result.transaction });
      setTransactions((prev) => [...prev, result.transaction]);

      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="act-content">
      <div className="act-header">
        <span className="badge badge-unscheduled">ACT 3 — MIT UNSCHEDULED</span>
        <h2>Event-Driven Charges</h2>
        <p className="act-subtitle">Merchant Initiated Transactions triggered by specific events</p>
      </div>

      <div className="mit-card">
        {/* Scene 1: Plan Upgrade */}
        <div className="mit-scene">
          <div className="mit-scene-header">
            <div className="mit-scene-icon" style={{ color: 'var(--color-mit-unscheduled)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </div>
            <div>
              <h3>Scene: Plan Upgrade — Prorated Charge</h3>
              <p>The customer previously agreed to upgrade their plan. The merchant processes a prorated charge of <strong>$5.00</strong> for the remaining days in the billing cycle.</p>
            </div>
          </div>

          <div className="mit-scene-flags">
            <code>credentialOnFile: SUBSEQUENT</code>
            <code>initiator: MERCHANT</code>
            <code>agreement.type: UNSCHEDULED</code>
          </div>

          {error && step === 'prorated' && <div className="error-message">{error}</div>}

          <button
            className="btn btn-unscheduled"
            onClick={handleProrated}
            disabled={state.loading}
          >
            {state.loading && step === 'prorated' ? 'Processing...' : 'Simulate Plan Upgrade — Charge $5.00'}
          </button>

          {transactions.find((t) => t.description === 'Plan Upgrade (Prorated)') && (
            <div className="mit-scene-result">
              <span className="badge badge-success">$5.00 charged</span>
              <span>Prorated charge processed successfully</span>
            </div>
          )}
        </div>

        <div className="mit-scene-divider" />

        {/* Scene 2: No-Show Penalty */}
        <div className="mit-scene">
          <div className="mit-scene-header">
            <div className="mit-scene-icon" style={{ color: 'var(--color-error)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3>Scene: No-Show / Penalty Charge</h3>
              <p>The cardholder failed to show for a scheduled service. The merchant charges a penalty of <strong>$25.00</strong> per the terms agreed during sign-up.</p>
            </div>
          </div>

          <div className="mit-scene-flags">
            <code>credentialOnFile: SUBSEQUENT</code>
            <code>initiator: MERCHANT</code>
            <code>agreement.type: UNSCHEDULED</code>
          </div>

          {error && step === 'penalty' && <div className="error-message">{error}</div>}

          <button
            className="btn btn-danger"
            onClick={handlePenalty}
            disabled={state.loading}
          >
            {state.loading && step === 'penalty' ? 'Processing...' : 'Simulate Penalty Charge — $25.00'}
          </button>

          {transactions.find((t) => t.description === 'No-Show Penalty') && (
            <div className="mit-scene-result">
              <span className="badge badge-success">$25.00 charged</span>
              <span>Penalty charge processed successfully</span>
            </div>
          )}
        </div>

        {/* Comparison: Recurring vs Unscheduled */}
        <div className="mit-comparison">
          <h4>Recurring vs. Unscheduled MIT</h4>
          <div className="mit-comp-table">
            <div className="mit-comp-row mit-comp-header">
              <span></span>
              <span>Recurring (Act 2)</span>
              <span>Unscheduled (Act 3)</span>
            </div>
            <div className="mit-comp-row">
              <span>Schedule</span>
              <span>Fixed interval (monthly)</span>
              <span>Event-driven</span>
            </div>
            <div className="mit-comp-row">
              <span>Amount</span>
              <span>Same each time ($9.99)</span>
              <span>Varies per event</span>
            </div>
            <div className="mit-comp-row">
              <span>agreement.type</span>
              <code>RECURRING</code>
              <code>UNSCHEDULED</code>
            </div>
            <div className="mit-comp-row">
              <span>Examples</span>
              <span>Subscription billing</span>
              <span>Top-up, penalty, prorated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
