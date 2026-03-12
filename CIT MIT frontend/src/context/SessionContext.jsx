import { createContext, useContext, useReducer, useCallback } from 'react';

const SessionContext = createContext(null);

const initialState = {
  demoSessionId: null,
  gatewaySessionId: null,
  plan: null,
  currentAct: 1,
  currentStep: 0,
  cardholderConsent: false,
  storedToken: null,
  agreementId: null,
  transactions: [],
  apiLogs: [],
  loading: false,
  error: null,
  // Act 1 state
  subscriptionComplete: false,
  threeDSComplete: false,
  authData: null,
  // Guide mode
  guideMode: false,
  guideStep: 0,
  // Dev console
  devConsoleOpen: false,
  selectedLog: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, demoSessionId: action.payload.sessionId, plan: action.payload.plan };
    case 'SET_GATEWAY_SESSION':
      return { ...state, gatewaySessionId: action.payload };
    case 'SET_ACT':
      return { ...state, currentAct: action.payload, currentStep: 0 };
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_CONSENT':
      return { ...state, cardholderConsent: action.payload };
    case 'SET_AUTH_DATA':
      return { ...state, authData: action.payload };
    case 'SET_3DS_COMPLETE':
      return { ...state, threeDSComplete: true };
    case 'SET_SUBSCRIPTION_COMPLETE':
      return {
        ...state,
        subscriptionComplete: true,
        storedToken: action.payload.token,
        agreementId: action.payload.agreementId,
      };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'ADD_API_LOGS':
      return { ...state, apiLogs: [...state.apiLogs, ...action.payload] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'TOGGLE_GUIDE':
      return { ...state, guideMode: !state.guideMode };
    case 'SET_GUIDE_STEP':
      return { ...state, guideStep: action.payload };
    case 'TOGGLE_DEV_CONSOLE':
      return { ...state, devConsoleOpen: !state.devConsoleOpen };
    case 'SET_SELECTED_LOG':
      return { ...state, selectedLog: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function SessionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addApiLogs = useCallback((logs) => {
    dispatch({ type: 'ADD_API_LOGS', payload: Array.isArray(logs) ? logs : [logs] });
    // Auto-select the latest log
    const latest = Array.isArray(logs) ? logs[logs.length - 1] : logs;
    dispatch({ type: 'SET_SELECTED_LOG', payload: latest });
  }, []);

  return (
    <SessionContext.Provider value={{ state, dispatch, addApiLogs }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
