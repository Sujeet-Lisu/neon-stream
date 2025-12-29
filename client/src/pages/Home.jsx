import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MovieCard from '../components/MovieCard';
import SkeletonCard from '../components/SkeletonCard';
import { PageTransition } from '../components/PageTransition';
import { mockMovies } from '../data';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import '../index.css';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [featuredMovie, setFeaturedMovie] = useState(mockMovies[0]);

  useEffect(() => {
    const fetchMovies = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/movies');
            const result = await response.json();
            
                // Transform API data to match MovieCard expected format
            // Transform API data to match MovieCard expected format
            const apiMovies = (result.data || []).map(m => {
                const posterPath = m.poster_path;
                // Check if posterPath is valid and not a string like "null" or "undefined"
                const hasPoster = posterPath && posterPath !== 'null' && posterPath !== 'undefined';
                const imageUrl = hasPoster 
                    ? `http://localhost:5000/uploads/${posterPath}` 
                    : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800'; // Fallback

                return {
                    id: m.id,
                    title: m.title,
                    desc: m.description,
                    hero: imageUrl,
                    cover: imageUrl,
                    video_url: m.video_path,
                    match: 'NEW',
                    year: m.year,
                    duration: '1h 50m',
                    genre: ['Action'],
                    is_uploaded: true
                };
            });

            // Merge with mock movies: Give mock movies unique IDs if necessary or just use them
            // To avoid key conflicts, we'll ensure IDs don't clash or use a prefix
            const processedMock = mockMovies.map(m => ({...m, id: `mock-${m.id}`}));
            
            setMovies([...apiMovies, ...processedMock]);
            
            if (apiMovies.length > 0) {
                setFeaturedMovie(apiMovies[0]); 
            } else {
                 setFeaturedMovie(mockMovies[0]);
            }
        } catch (error) {
            console.error("Failed to fetch movies:", error);
            setMovies(mockMovies);
        } finally {
            setLoading(false);
        }
    };

    const timer = new Promise(resolve => setTimeout(resolve, 800));
    Promise.all([fetchMovies(), timer]);
    
  }, []);

  const scrollRow = (id, direction) => {
    const row = document.getElementById(id);
    if (row) {
        const scrollAmount = window.innerWidth * 0.8;
        row.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }
  };

  return (
    <PageTransition>
      <div className="home">
        <Navbar />
        
        {loading ? (
             <div className="skeleton-hero" style={{height: '85vh', background: '#0f172a'}}></div>
        ) : (
             <Hero movie={featuredMovie} />
        )}
        
        <div className="content-container container">
          <section className="row-section">
            <div className="section-header">
              <h2 className="section-title">Trending Now</h2>
            </div>
            
            <div className="row-wrapper">
               <button className="row-control left" onClick={() => scrollRow('row-1', 'left')}>
                  <ChevronLeft size={32} />
               </button>
               
               <div className="movie-row" id="row-1">
                  {loading 
                    ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    : movies.map((movie, index) => (
                        <MovieCard key={`trend-${movie.id}-${index}`} movie={movie} />
                    ))
                  }
               </div>

               <button className="row-control right" onClick={() => scrollRow('row-1', 'right')}>
                  <ChevronRight size={32} />
               </button>
            </div>
          </section>

          <section className="row-section">
            <h2 className="section-title">New Releases</h2>
            <div className="row-wrapper">
               <div className="movie-row" id="row-2">
                  {loading
                    ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                    : [...movies].reverse().map((movie, idx) => (
                        <MovieCard key={`${movie.id}-new-${idx}`} movie={movie} />
                    ))
                  }
              </div>
            </div>
          </section>
        </div>

        <style>{`
          .home {
              background-color: var(--bg-primary);
              min-height: 100vh;
              padding-bottom: 50px;
          }
          
        .content-container {
            position: relative;
            z-index: var(--z-overlay);
            padding-top: 80px;
        }

        .row-section {
            margin-bottom: 60px;
            position: relative;
        }
        
        /* Show controls on hover */
        .row-section:hover .row-control {
            opacity: 1;
        }

        .section-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 16px;
            color: #e5e5e5;
            padding-left: 0;
        }
        
        .row-wrapper {
            position: relative;
        }

        .movie-row {
            display: flex;
            overflow-x: auto;
            padding: 20px 0;
            scroll-behavior: smooth;
            scrollbar-width: none;
            -ms-overflow-style: none;
            margin: 0 -4%; /* Bleed out to edges */
            padding: 0 4%; /* Push content in to match container */
            gap: 15px; 
        }
        
        .movie-row::-webkit-scrollbar {
            display: none;
        }
        
        .row-control {
            position: absolute;
            top: 0; bottom: 0;
            width: 50px;
            background: rgba(0,0,0,0.5);
            border: none;
            color: white;
            z-index: var(--z-controls);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .row-control:hover {
            background: rgba(0,0,0,0.7);
            color: var(--neon-blue);
        }
        
        .row-control.left { left: -50px; }
        .row-control.right { right: -50px; }
        
        @media (max-width: 1700px) {
            .row-control.left { left: 0; }
            .row-control.right { right: 0; }
        }

        @media (max-width: 768px) {
            .hero-container { margin-bottom: 0; }
            .content-container { padding-left: 20px; padding-right: 20px; }
            .movie-row { padding: 0; margin: 0; }
        }
        `}</style>
      </div>
    </PageTransition>
  );
};

export default Home;
