import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image shimmer"></div>
      <style>{`
        .skeleton-card {
            width: 240px;
            height: 140px;
            margin-right: 12px;
            border-radius: var(--radius-sm);
            background: var(--bg-surface);
            overflow: hidden;
            flex-shrink: 0;
            position: relative;
        }

        .skeleton-image {
            width: 100%;
            height: 100%;
            background: #1e293b;
        }

        .shimmer {
            position: relative;
        }

        .shimmer::after {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
            animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SkeletonCard;
