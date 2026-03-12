import { useSession } from '../../context/SessionContext';
import { annotations } from '../../utils/annotations';
import './SidePanel.css';

export default function SidePanel() {
  const { state } = useSession();

  const actKey = `act${state.currentAct}`;
  const actAnnotations = annotations[actKey];
  if (!actAnnotations) return null;

  // Determine current annotation based on step
  const annotationKeys = Object.keys(actAnnotations);
  const stepIndex = Math.min(state.currentStep, annotationKeys.length - 1);
  const currentKey = annotationKeys[stepIndex];
  const annotation = actAnnotations[currentKey];

  if (!annotation) return null;

  const badgeClass = annotation.badge === 'CIT' ? 'badge-cit'
    : annotation.badge === 'RECURRING' ? 'badge-recurring'
    : 'badge-unscheduled';

  return (
    <aside className="side-panel">
      <div className="side-panel-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>Annotations</span>
      </div>

      <div className="side-panel-content">
        <div className="annotation-header">
          <span className={`badge ${badgeClass}`}>{annotation.badge}</span>
          <h3 className="annotation-title">{annotation.title}</h3>
        </div>

        <p className="annotation-description">{annotation.description}</p>

        <div className="annotation-details">
          {annotation.details.map((detail, i) => (
            <div key={i} className="annotation-detail">
              <div className="annotation-bullet" />
              <p>{detail}</p>
            </div>
          ))}
        </div>

        {annotation.flags.length > 0 && (
          <div className="annotation-flags">
            <h4 className="annotation-flags-title">Transaction Flags</h4>
            {annotation.flags.map((flag, i) => (
              <div key={i} className="annotation-flag">
                <code className="annotation-flag-key">{flag.key}</code>
                <code className="annotation-flag-value">{flag.value}</code>
              </div>
            ))}
          </div>
        )}

        {/* Cardholder presence indicator */}
        <div className="annotation-indicators">
          <div className={`indicator ${state.currentAct === 1 ? 'indicator-present' : 'indicator-absent'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Cardholder {state.currentAct === 1 ? 'Present' : 'Not Present'}</span>
          </div>
          <div className={`indicator ${state.currentAct === 1 ? 'indicator-required' : 'indicator-not-required'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>3DS {state.currentAct === 1 ? 'Required' : 'Not Required'}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
