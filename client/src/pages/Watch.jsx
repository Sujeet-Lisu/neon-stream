import React from 'react';
import { useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import { mockMovies } from '../data';
import { PageTransition } from '../components/PageTransition';
import { API_BASE_URL } from '../config';
import '../index.css';

const Watch = () => {
  const { id } = useParams();
  
  // Logic to find movie:
  // 1. Try finding in mockMovies first (since we don't have a global store for fetched ones yet in this simple app)
  // 2. Ideally we should pass state or fetch again.
  // For this demo, let's assume if ID is string/number conflict or just fetch fresh.
  
  // ACTUALLY: The best way without Redux/Context for this "Upload" feature to work 
  // matches the Home.jsx logic where we might have mixed data.
  // Let's simplified fetch the specific movie from API if it seems like a real ID, 
  // or fall back to mock.
  
  const [movie, setMovie] = React.useState(null);
  const [videoSrc, setVideoSrc] = React.useState(null);

  React.useEffect(() => {
      const fetchMovie = async () => {
          // Check if it's a mock movie (ids prefixed with 'mock-')
          const isMock = id.toString().startsWith('mock-');
           
          if (isMock) {
              const mockId = parseInt(id.replace('mock-', ''));
              const mock = mockMovies.find(m => m.id === mockId);
              if (mock) {
                  setMovie(mock);
                  setVideoSrc("http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
                  return;
              }
          } 
          
          // If not mock (or mock not found), try fetching from API
          try {
              const response = await fetch(`${API_BASE_URL}/api/movies/${id}`);
              if (!response.ok) throw new Error('Not found');
              
              const result = await response.json();
              if (result.data) {
                  const m = result.data;
                  setMovie({
                      title: m.title,
                      desc: m.description,
                      hero: m.poster_path ? `${API_BASE_URL}/uploads/${m.poster_path}` : null,
                  });
                  
                  // If it's a full URL (Drive), use it directly. Else use local stream API.
                  if (m.video_path && m.video_path.startsWith('http')) {
                      setVideoSrc(m.video_path);
                  } else {
                      setVideoSrc(`${API_BASE_URL}/api/stream/${m.video_path}`);
                  }
              }
          } catch (e) {
              console.error("Error fetching movie", e);
              // Fallback for demo if API fails but ID matches a mock ID by coincidence (optional, but effectively disabled by prefix logic now)
          }
      };
      
      fetchMovie();
  }, [id]);

  if (!movie || !videoSrc) return <div className="watch-container" style={{display:'flex', justifyContent:'center', alignItems:'center', color:'white'}}>Loading...</div>;

  return (
    <div className="watch-container">
      <VideoPlayer src={videoSrc} poster={movie.hero} />
      
      {/* Optional: Add "You are watching" overlay or similar below if not fullscreen */}
      {/* However, the VideoPlayer component currently takes up 100vh. */}
      {/* We can overlay a title temporarily */}
      
      <div className="watch-meta-overlay">
         {movie && <h3>{movie.title}</h3>}
      </div>

      <style>{`
        .watch-container {
            width: 100vw;
            height: 100vh;
            background: black;
            position: relative;
        }
        
        .watch-meta-overlay {
            position: absolute;
            top: 20px;
            left: 80px; /* Right of back button */
            color: white;
            z-index: var(--z-raised);
            opacity: 0;
            transition: opacity 0.5s;
            pointer-events: none;
        }
        
        .watch-container:hover .watch-meta-overlay {
            opacity: 1;
        }
        
        .watch-meta-overlay h3 {
            font-size: 1.2rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
        }
      `}</style>
    </div>
  );
};

export default Watch;
