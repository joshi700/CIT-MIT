import { useSession } from '../../context/SessionContext';
import './Header.css';

export default function Header() {
  const { state, dispatch } = useSession();

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <h1 className="header-title">CIT/MIT Payment Demo</h1>
        </div>
        <span className="header-subtitle">Mastercard Gateway Integration</span>
      </div>
      <div className="header-right">
        <button
          className={`header-btn ${state.guideMode ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_GUIDE' })}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Guide Mode
        </button>
        <button
          className={`header-btn ${state.devConsoleOpen ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'TOGGLE_DEV_CONSOLE' })}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          Dev Console
        </button>
      </div>
    </header>
  );
}
