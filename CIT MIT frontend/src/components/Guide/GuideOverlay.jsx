import { useSession } from '../../context/SessionContext';
import { guideSteps } from '../../utils/annotations';
import './GuideOverlay.css';

export default function GuideOverlay() {
  const { state, dispatch } = useSession();

  if (!state.guideMode) return null;

  const actKey = `act${state.currentAct}`;
  const steps = guideSteps[actKey] || [];
  const currentStep = Math.min(state.guideStep, steps.length - 1);
  const step = steps[currentStep];

  if (!step) return null;

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      dispatch({ type: 'SET_GUIDE_STEP', payload: nextStep });
      dispatch({ type: 'SET_STEP', payload: nextStep });
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      dispatch({ type: 'SET_GUIDE_STEP', payload: prevStep });
      dispatch({ type: 'SET_STEP', payload: prevStep });
    }
  };

  return (
    <div className="guide-overlay">
      <div className="guide-step-indicator">
        {steps.map((_, i) => (
          <div key={i} className={`guide-dot ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}`} />
        ))}
      </div>

      <div className="guide-card">
        <div className="guide-step-number">
          Step {currentStep + 1} of {steps.length}
        </div>
        <h3 className="guide-step-title">{step.title}</h3>
        <p className="guide-step-instruction">{step.instruction}</p>

        <div className="guide-nav">
          <button className="guide-btn" onClick={goPrev} disabled={currentStep === 0}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Previous
          </button>
          <button className="guide-btn guide-btn-primary" onClick={goNext} disabled={currentStep === steps.length - 1}>
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
