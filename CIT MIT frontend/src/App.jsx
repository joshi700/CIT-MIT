import { useEffect } from 'react';
import { SessionProvider, useSession } from './context/SessionContext';
import Header from './components/Layout/Header';
import ActNav from './components/Layout/ActNav';
import SidePanel from './components/Layout/SidePanel';
import DevConsole from './components/Layout/DevConsole';
import GuideOverlay from './components/Guide/GuideOverlay';
import Act1CIT from './components/Acts/Act1CIT';
import Act2Recurring from './components/Acts/Act2Recurring';
import Act3Unscheduled from './components/Acts/Act3Unscheduled';
import { createDemoSession } from './utils/api';
import './App.css';

function AppContent() {
  const { state, dispatch } = useSession();

  // Create demo session on mount
  useEffect(() => {
    if (!state.demoSessionId) {
      createDemoSession()
        .then((data) => {
          dispatch({ type: 'SET_SESSION', payload: data.session });
        })
        .catch((err) => {
          console.error('Failed to create demo session:', err);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to connect to server. Make sure the backend is running on port 3001.' });
        });
    }
  }, [state.demoSessionId, dispatch]);

  const renderAct = () => {
    switch (state.currentAct) {
      case 1: return <Act1CIT />;
      case 2: return <Act2Recurring />;
      case 3: return <Act3Unscheduled />;
      default: return <Act1CIT />;
    }
  };

  if (state.error && !state.demoSessionId) {
    return (
      <div className="app-error">
        <h2>Connection Error</h2>
        <p>{state.error}</p>
        <p>Run <code>cd server && npm install && npm run dev</code> to start the backend.</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="app-body">
        <ActNav />
        <main className="app-main">
          <GuideOverlay />
          {renderAct()}
        </main>
        <SidePanel />
      </div>
      <DevConsole />
    </>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
