import { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import './DevConsole.css';

export default function DevConsole() {
  const { state, dispatch } = useSession();
  const [copied, setCopied] = useState(null);

  if (!state.devConsoleOpen) return null;

  const log = state.selectedLog;
  const allLogs = state.apiLogs;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(JSON.stringify(text, null, 2));
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="dev-console">
      <div className="dev-console-header">
        <div className="dev-console-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span>Developer Console</span>
          {log?.step && <span className="dev-console-step">{log.step}</span>}
        </div>
        <div className="dev-console-actions">
          {/* Log selector */}
          {allLogs.length > 1 && (
            <select
              className="dev-console-select"
              value={allLogs.indexOf(log)}
              onChange={(e) => dispatch({ type: 'SET_SELECTED_LOG', payload: allLogs[e.target.value] })}
            >
              {allLogs.map((l, i) => (
                <option key={i} value={i}>
                  {l.step || `API Call ${i + 1}`}
                </option>
              ))}
            </select>
          )}
          <button
            className="dev-console-close"
            onClick={() => dispatch({ type: 'TOGGLE_DEV_CONSOLE' })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {log ? (
        <div className="dev-console-body">
          <div className="dev-console-pane">
            <div className="dev-console-pane-header">
              <span className="dev-console-pane-label">Request</span>
              <div className="dev-console-pane-meta">
                <span className="dev-console-method">{log.request?.method}</span>
                <span className="dev-console-url">{log.request?.url}</span>
              </div>
              <button
                className="dev-console-copy"
                onClick={() => copyToClipboard(log.request?.body, 'request')}
              >
                {copied === 'request' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="dev-console-json">
              <code>{JSON.stringify(log.request?.body, null, 2) || 'No request body'}</code>
            </pre>
          </div>

          <div className="dev-console-divider" />

          <div className="dev-console-pane">
            <div className="dev-console-pane-header">
              <span className="dev-console-pane-label">Response</span>
              <span className={`dev-console-status ${log.response?.status < 300 ? 'status-ok' : 'status-err'}`}>
                {log.response?.status}
              </span>
              <button
                className="dev-console-copy"
                onClick={() => copyToClipboard(log.response?.body, 'response')}
              >
                {copied === 'response' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="dev-console-json">
              <code>{JSON.stringify(log.response?.body, null, 2) || 'No response'}</code>
            </pre>
          </div>
        </div>
      ) : (
        <div className="dev-console-empty">
          <p>No API calls yet. Complete a payment step to see request/response payloads.</p>
        </div>
      )}
    </div>
  );
}
