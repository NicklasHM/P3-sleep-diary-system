import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export const Skeleton = ({ width, height, borderRadius = '4px', className = '' }: SkeletonProps) => {
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || '1em',
    borderRadius,
  };

  return <div className={`skeleton ${className}`} style={style} />;
};

export default Skeleton;






