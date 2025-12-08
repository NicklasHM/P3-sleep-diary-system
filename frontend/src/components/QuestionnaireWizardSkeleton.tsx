import Skeleton from './Skeleton';
import './QuestionnaireWizardSkeleton.css';

const QuestionnaireWizardSkeleton = () => {
  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <Skeleton width="200px" height="32px" />
        <Skeleton width="100px" height="40px" borderRadius="6px" />
      </div>

      <div className="wizard-progress-container">
        <div className="wizard-progress-info">
          <Skeleton width="150px" height="16px" />
        </div>
        <div className="wizard-progress-bar">
          <Skeleton width="45%" height="8px" borderRadius="4px" />
        </div>
        <div className="wizard-progress-steps">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="progress-step">
              <Skeleton width="16px" height="16px" borderRadius="50%" />
            </div>
          ))}
        </div>
      </div>

      <div className="wizard-content">
        <div className="wizard-question-card">
          <Skeleton width="80%" height="32px" className="skeleton-question-text" />
          <Skeleton width="60%" height="24px" className="skeleton-question-text skeleton-question-text-second" />
          
          <div className="wizard-input-container">
            <Skeleton width="100%" height="48px" borderRadius="6px" />
          </div>

          <div className="wizard-actions">
            <Skeleton width="100px" height="40px" borderRadius="6px" />
            <Skeleton width="100px" height="40px" borderRadius="6px" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireWizardSkeleton;

