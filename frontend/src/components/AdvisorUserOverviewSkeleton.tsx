import Skeleton from './Skeleton';
import './AdvisorUserOverviewSkeleton.css';

const AdvisorUserOverviewSkeleton = () => {
  return (
    <div className="advisor-overview">
      <header className="dashboard-header">
        <Skeleton width="200px" height="32px" />
        <div className="header-actions">
          <Skeleton width="100px" height="40px" borderRadius="6px" />
          <Skeleton width="100px" height="40px" borderRadius="6px" />
        </div>
      </header>

      <div className="container">
        <div className="search-filter-section">
          <div className="search-box">
            <Skeleton width="120px" height="16px" />
            <Skeleton width="100%" height="40px" borderRadius="6px" />
          </div>
          <div className="filter-box">
            <Skeleton width="150px" height="16px" />
            <Skeleton width="100%" height="40px" borderRadius="6px" />
          </div>
        </div>

        <div className="citizens-table-container">
          <div className="citizens-table-header">
            <Skeleton width="80px" height="16px" />
            <Skeleton width="100px" height="16px" />
            <Skeleton width="150px" height="16px" />
            <Skeleton width="100px" height="16px" />
          </div>
          <div className="citizens-table-body">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="citizen-row-skeleton">
                <div className="table-cell">
                  <Skeleton width="120px" height="18px" />
                </div>
                <div className="table-cell">
                  <Skeleton width="100px" height="16px" />
                </div>
                <div className="table-cell">
                  <div className="sleep-params-skeleton">
                    <Skeleton width="80px" height="32px" borderRadius="4px" />
                    <Skeleton width="80px" height="32px" borderRadius="4px" />
                    <Skeleton width="80px" height="32px" borderRadius="4px" />
                    <Skeleton width="80px" height="32px" borderRadius="4px" />
                  </div>
                </div>
                <div className="table-cell">
                  <Skeleton width="150px" height="36px" borderRadius="6px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorUserOverviewSkeleton;

