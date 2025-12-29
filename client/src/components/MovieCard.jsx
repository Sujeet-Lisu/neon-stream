import React, { useState } from 'react';
import { Play, Info, ThumbsUp, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  // We can add simple hover states here if needed, but CSS is usually performant enough

  const handlePlay = (e) => {
    e.stopPropagation();
    navigate(`/watch/${movie.id}`);
  };

  return (
    <div 
      className="movie-card-container"
      onClick={() => navigate(`/watch/${movie.id}`)}
    >
      <div className="movie-card">
        <img 
          src={movie.cover || '/default-poster.jpg'} 
          alt={movie.title} 
          loading="lazy" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=500&q=60'; // High quality fallback
          }}
        />
        
        <div className="card-overlay">
          {/* Centered Play Button */}
          <button className="play-btn-center" onClick={handlePlay} aria-label={`Play ${movie.title}`}>
            <Play size={28} fill="currentColor" />
          </button>

          <div className="card-content">
             <div className="card-meta">
                <span className="match">98% Match</span>
                <span className="rating">16+</span>
                <span className="duration">1h 45m</span>
             </div>
             
             <div className="genres">
                <span>Sci-Fi</span>
                <span className="separator">•</span>
                <span>Action</span>
             </div>

             <div className="secondary-actions">
                <button className="icon-btn xs" aria-label="Add to My List"><Plus size={16} /></button>
                <button className="icon-btn xs" aria-label="Rate Thumbs Up"><ThumbsUp size={16} /></button>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        .movie-card-container {
          width: 240px;
          height: 140px;
          flex-shrink: 0;
          margin-right: 12px;
          position: relative;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1), z-index 0s;
          border-radius: var(--radius-sm);
        }
        
        .movie-card {
            width: 100%;
            height: 100%;
            border-radius: var(--radius-sm);
            overflow: hidden;
            position: relative;
            background: #141414;
        }

        .movie-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        
        .card-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 12px;
        }

        /* Desktop Hover Effects */
        @media (hover: hover) {
            .movie-card-container:hover {
                transform: scale(1.15); 
                z-index: var(--z-hover);
                box-shadow: 0 10px 20px rgba(0,0,0,0.5);
                transition-delay: 0.1s; /* Slight delay to prevent accidental flutters */
            }
            
            .movie-card-container:hover .card-overlay {
                opacity: 1;
            }
            
            /* Center Play Button Animation */
            .play-btn-center {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                width: 48px; height: 48px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.5);
                color: white;
                display: flex;
                align-items: center; justify-content: center;
                backdrop-filter: blur(4px);
                transition: all 0.3s var(--ease-spring);
                opacity: 0;
            }

            .movie-card-container:hover .play-btn-center {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
            }

            .play-btn-center:hover {
                background: white;
                color: black;
                transform: translate(-50%, -50%) scale(1.1);
                border-color: white;
            }
        }

        /* Mobile / Touch adjustments */
        @media (hover: none) {
            .movie-card-container:active {
                transform: scale(0.96);
            }
        }
        
        .card-content {
            transform: translateY(10px);
            transition: transform 0.3s ease;
        }
        
        .movie-card-container:hover .card-content {
            transform: translateY(0);
        }
        
        .card-meta {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 10px;
            font-weight: 600;
            margin-bottom: 4px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }
        
        .match { color: #46d369; }
        .rating { 
            border: 1px solid rgba(255,255,255,0.4);
            padding: 0 4px;
            border-radius: 2px;
        }
        .duration { color: var(--text-secondary); }
        
        .genres {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 10px;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }
        
        .secondary-actions {
            display: flex;
            gap: 8px;
            margin-top: 4px;
        }

        .icon-btn.xs {
            width: 28px; height: 28px;
            padding: 4px;
        }
        
        .separator { color: var(--text-muted); }
      `}</style>
    </div>
  );
};

export default MovieCard;
