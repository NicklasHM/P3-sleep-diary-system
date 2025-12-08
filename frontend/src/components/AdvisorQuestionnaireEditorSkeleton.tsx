import Skeleton from './Skeleton';
import './AdvisorQuestionnaireEditorSkeleton.css';

const AdvisorQuestionnaireEditorSkeleton = () => {
  return (
    <div className="editor-container">
      <header className="dashboard-header">
        <Skeleton width="250px" height="32px" />
        <div className="header-actions">
          <Skeleton width="100px" height="40px" borderRadius="6px" />
          <Skeleton width="100px" height="40px" borderRadius="6px" />
        </div>
      </header>

      <div className="container">
        <div className="editor-actions">
          <Skeleton width="180px" height="44px" borderRadius="6px" />
        </div>

        <div className="questions-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="question-item-skeleton">
              <div className="question-header-skeleton">
                <Skeleton width="40px" height="24px" borderRadius="6px" />
                <div className="question-content-skeleton">
                  <div className="question-top-skeleton">
                    <Skeleton width="50px" height="20px" borderRadius="6px" />
                    <Skeleton width="100px" height="20px" borderRadius="6px" />
                  </div>
                  <Skeleton width="90%" height="24px" className="skeleton-question-line" />
                  <Skeleton width="70%" height="24px" className="skeleton-question-line-second" />
                  <div className="question-options-preview-skeleton">
                    <Skeleton width="200px" height="36px" borderRadius="6px" className="skeleton-option" />
                    <Skeleton width="180px" height="36px" borderRadius="6px" className="skeleton-option-second" />
                  </div>
                </div>
                <div className="question-actions-skeleton">
                  <Skeleton width="80px" height="36px" borderRadius="6px" />
                  <Skeleton width="70px" height="36px" borderRadius="6px" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdvisorQuestionnaireEditorSkeleton;

