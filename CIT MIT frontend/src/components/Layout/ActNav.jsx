import { useSession } from '../../context/SessionContext';
import './ActNav.css';

const acts = [
  {
    id: 1,
    label: 'Act 1',
    title: 'CIT — Subscribe',
    description: 'Cardholder signs up, authenticates via 3DS, card stored on file',
    color: 'cit',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: 2,
    label: 'Act 2',
    title: 'MIT — Recurring',
    description: 'Automatic monthly billing, no cardholder present',
    color: 'recurring',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
    ),
  },
  {
    id: 3,
    label: 'Act 3',
    title: 'MIT — Unscheduled',
    description: 'Prorated charges, no-show penalties',
    color: 'unscheduled',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function ActNav() {
  const { state, dispatch } = useSession();

  const canNavigate = (actId) => {
    if (actId === 1) return true;
    // Acts 2 and 3 require Act 1 completion
    return state.subscriptionComplete;
  };

  return (
    <nav className="act-nav">
      <div className="act-nav-header">
        <span className="act-nav-label">Payment Flow</span>
      </div>
      {acts.map((act) => {
        const isActive = state.currentAct === act.id;
        const isLocked = !canNavigate(act.id);
        return (
          <button
            key={act.id}
            className={`act-nav-item act-nav-item--${act.color} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
            onClick={() => !isLocked && dispatch({ type: 'SET_ACT', payload: act.id })}
            disabled={isLocked}
          >
            <div className="act-nav-icon">{act.icon}</div>
            <div className="act-nav-content">
              <div className="act-nav-act-label">{act.label}</div>
              <div className="act-nav-title">{act.title}</div>
              <div className="act-nav-desc">{act.description}</div>
            </div>
            {isLocked && (
              <svg className="act-nav-lock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
            {isActive && <div className="act-nav-indicator" />}
          </button>
        );
      })}

      {/* Transaction History */}
      {state.transactions.length > 0 && (
        <div className="act-nav-history">
          <div className="act-nav-header">
            <span className="act-nav-label">Transaction Log</span>
          </div>
          {state.transactions.map((txn, i) => (
            <div key={i} className="txn-log-item" onClick={() => {
              if (txn.apiLogs?.length) {
                dispatch({ type: 'SET_SELECTED_LOG', payload: txn.apiLogs[txn.apiLogs.length - 1] });
                if (!state.devConsoleOpen) dispatch({ type: 'TOGGLE_DEV_CONSOLE' });
              }
            }}>
              <div className="txn-log-top">
                <span className={`badge badge-${txn.type === 'CIT' ? 'cit' : txn.subType === 'RECURRING' ? 'recurring' : 'unscheduled'}`}>
                  {txn.type}
                </span>
                <span className={`badge badge-${txn.status === 'SUCCESS' ? 'success' : 'failed'}`}>
                  {txn.status}
                </span>
              </div>
              <div className="txn-log-amount">${txn.amount.toFixed(2)} USD</div>
              <div className="txn-log-sub">{txn.subType}</div>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}
