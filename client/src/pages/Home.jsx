import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import MovieCard from '../components/MovieCard';
import SkeletonCard from '../components/SkeletonCard';
import { PageTransition } from '../components/PageTransition';
import { mockMovies } from '../data';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import '../index.css';

import { useQuery } from '@tanstack/react-query';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');

  const { data: movies = [], isLoading: loading, error } = useQuery({
    queryKey: ['movies'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/movies');
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    select: (result) => {
        const rawMovies = [...(result.data || []), ...mockMovies.map(m => ({...m, id: `mock-${m.id}`}))];
        
        return rawMovies.map(m => {
            const posterPath = m.poster_path;
            const hasPoster = posterPath && posterPath !== 'null';
            const imageUrl = hasPoster 
                ? (posterPath.startsWith('http') ? posterPath : `http://localhost:5000/uploads/${posterPath}`)
                : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800'; 

            // Auto-Assign Genre based on keywords
            let genres = ['Action'];
            const text = (m.title + ' ' + m.description).toLowerCase();
            if (text.includes('cyber') || text.includes('future') || text.includes('space') || text.includes('robot')) genres.push('Sci-Fi');
            if (text.includes('love') || text.includes('romance')) genres.push('Romance');
            if (text.includes('dark') || text.includes('fear') || text.includes('horror')) genres.push('Horror');
            if (text.includes('anime') || text.includes('animation')) genres.push('Anime');

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
                genre: genres,
                is_uploaded: true
            };
        });
    }
  });

  // Filter Logic
  const filteredMovies = movies.filter(movie => {
      const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = activeGenre === 'All' || movie.genre.includes(activeGenre);
      return matchesSearch && matchesGenre;
  });

  const featuredMovie = movies.length > 0 ? movies[0] : mockMovies[0];
  const genres = ['All', 'Action', 'Sci-Fi', 'Anime', 'Horror', 'Romance'];

  if (error) console.error("Failed to fetch movies:", error);

  const scrollRow = (id, direction) => {
    const row = document.getElementById(id);
    if (row) {
        const scrollAmount = window.innerWidth * 0.8;
        row.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <PageTransition>
      <div className="home">
        <Navbar searchTerm={searchQuery} onSearch={setSearchQuery} />
        
        {!loading && !searchQuery && activeGenre === 'All' && <Hero movie={featuredMovie} />}
        
        <div className={`content-container container ${searchQuery || activeGenre !== 'All' ? 'filtered-view' : ''}`}>
          
          {/* Genre Filter Bar */}
          <div className="genre-filters">
            {genres.map(genre => (
                <button 
                    key={genre}
                    className={`genre-chip ${activeGenre === genre ? 'active' : ''}`}
                    onClick={() => setActiveGenre(genre)}
                >
                    {genre}
                </button>
            ))}
          </div>

          {/* Search/Filter Results or Default Sections */}
          {(searchQuery || activeGenre !== 'All') ? (
              <section className="row-section">
                <h2 className="section-title">
                    {searchQuery ? `Results for "${searchQuery}"` : `${activeGenre} Movies`}
                </h2>
                <div className="movie-grid">
                    {filteredMovies.length > 0 ? (
                        filteredMovies.map((movie, index) => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))
                    ) : (
                        <p className="no-results">No movies found.</p>
                    )}
                </div>
              </section>
          ) : (
            <>
              <section className="row-section">
                <div className="section-header"><h2 className="section-title">Trending Now</h2></div>
                <div className="row-wrapper">
                   <button className="row-control left" onClick={() => scrollRow('row-1', 'left')}><ChevronLeft size={32} /></button>
                   <div className="movie-row" id="row-1">
                      {loading 
                        ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                        : filteredMovies.map((movie, index) => <MovieCard key={`trend-${movie.id}`} movie={movie} />)
                      }
                   </div>
                   <button className="row-control right" onClick={() => scrollRow('row-1', 'right')}><ChevronRight size={32} /></button>
                </div>
              </section>

              <section className="row-section">
                <h2 className="section-title">New Releases</h2>
                <div className="row-wrapper">
                   <div className="movie-row" id="row-2">
                      {loading
                        ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
                        : [...filteredMovies].reverse().map((movie, idx) => <MovieCard key={`new-${movie.id}`} movie={movie} />)
                      }
                  </div>
                </div>
              </section>
            </>
          )}
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

        /* Filtered View Adjustments */
        .filtered-view {
            padding-top: 120px; /* More space for fixed nav + filter bar if needed */
            min-height: 100vh;
        }

        .genre-filters {
            display: flex;
            gap: 12px;
            overflow-x: auto;
            padding: 10px 0 30px 0;
            scrollbar-width: none;
        }

        .genre-chip {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #94a3b8;
            padding: 8px 20px;
            border-radius: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
        }

        .genre-chip:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }

        .genre-chip.active {
            background: rgba(6, 182, 212, 0.1);
            border-color: var(--neon-blue);
            color: var(--neon-blue);
            box-shadow: 0 0 10px rgba(6, 182, 212, 0.2);
        }

        .movie-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            padding-bottom: 50px;
        }

        .no-results {
            color: #64748b;
            text-align: center;
            font-size: 1.2rem;
            margin-top: 50px;
            width: 100%;
        }

        @media (max-width: 768px) {
            .hero-container { margin-bottom: 0; }
            .content-container { padding-left: 20px; padding-right: 20px; }
            .movie-row { padding: 0; margin: 0; }
            .movie-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }
        `}</style>
      </div>
    </PageTransition>
  );
};

export default Home;
