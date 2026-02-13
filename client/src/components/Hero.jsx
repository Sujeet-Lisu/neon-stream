import React from 'react';
import { Play, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const Hero = ({ movie }) => {
  const navigate = useNavigate();

  return (
    <div className="hero-container">
      <div className="hero-backdrop">
        <img src={movie.hero} alt={movie.title} />
        <div className="hero-vignette"></div>
      </div>
      
      <div className="hero-content container">
        <div className="content-wrapper">
            {/* Animated Title or Logo can go here */}
            <h1 className="hero-title">{movie.title}</h1>
            
            <div className="hero-meta">
                <span className="match-score">98% Match</span>
                <span className="year">{movie.year}</span>
                <span className="badge-hd">4K Ultra HD</span>
            </div>

            <p className="hero-desc">{movie.desc}</p>
            
            <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate(`/watch/${movie.id}`)}>
                <Play size={24} fill="currentColor" /> Play
            </button>
            <button className="btn-secondary">
                <Info size={24} /> More Info
            </button>
            </div>
        </div>
      </div>

      <style>{`
        .hero-container {
          position: relative;
          width: 100%;
          height: 85vh; /* Taller hero */
          margin-bottom: -150px; /* Pull content up */
          overflow: hidden;
        }

        .hero-backdrop {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
        }

        .hero-backdrop img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          /* Subtle parallax or zoom effect could go here */
        }

        .hero-vignette {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: radial-gradient(circle at center, transparent 0%, var(--bg-primary) 120%),
                      linear-gradient(to top, var(--bg-primary) 10%, transparent 60%);
        }

        .hero-content {
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          z-index: var(--z-raised);
        }

        .content-wrapper {
            max-width: 600px;
            margin-top: 100px; /* Offset for navbar */
        }

        .hero-title {
          font-size: 5rem;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 24px;
          text-transform: uppercase;
          background: linear-gradient(to bottom, #fff 0%, #ccc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 4px 20px rgba(0,0,0,0.5));
        }

        .hero-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
            font-weight: 600;
            font-size: 1.1rem;
        }

        .match-score { color: #46d369; }
        
        .badge-hd {
            border: 1px solid rgba(255,255,255,0.4);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.8rem;
            color: rgba(255,255,255,0.8);
        }

        .hero-desc {
          font-size: 1.25rem;
          color: rgba(255,255,255,0.9);
          margin-bottom: 32px;
          line-height: 1.6;
          text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }

        .hero-actions {
          display: flex;
          gap: 16px;
        }

        @media (max-width: 768px) {
            .hero-title { font-size: 3rem; }
            .hero-desc { font-size: 1rem; }
            .hero-container { height: 70vh; }
        }
      `}</style>
    </div>
  );
};

export default Hero;
