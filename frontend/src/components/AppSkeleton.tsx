import Skeleton from './Skeleton';
import './AppSkeleton.css';

const AppSkeleton = () => {
  return (
    <div className="app-skeleton">
      <Skeleton width="100%" height="60px" />
      <div className="container">
        <Skeleton width="100%" height="200px" borderRadius="8px" className="skeleton-content" />
      </div>
    </div>
  );
};

export default AppSkeleton;

