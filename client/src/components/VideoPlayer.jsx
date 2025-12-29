import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, ArrowLeft, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../index.css';

const VideoPlayer = ({ src, poster }) => {
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(!src.includes('drive.google.com')); // Skip loading state for Drive to avoid infinite spinner

  // Auto-hide controls
  useEffect(() => {
    let timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isPlaying && !isLoading) setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isPlaying, isLoading]);

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    setProgress((current / duration) * 100);
  };

  const handleSeek = (e) => {
    const width = e.currentTarget.clientWidth;
    const clickX = e.nativeEvent.offsetX;
    const duration = videoRef.current.duration;
    videoRef.current.currentTime = (clickX / width) * duration;
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    videoRef.current.muted = newMutedState;
    if (newMutedState) setVolume(0);
    else setVolume(1);
  };

  /* Keyboard Controls */
  useEffect(() => {
    const handleKeyDown = (e) => {
        if (!showControls && !isPlaying) return; // Don't capture if completely idle/hidden context unless we want global keys
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
                break;
            case 'ArrowRight':
                e.preventDefault();
                videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 5);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setVolume(v => {
                    const newV = Math.min(1, v + 0.1);
                    videoRef.current.volume = newV;
                    setIsMuted(newV === 0);
                    return newV;
                });
                break;
            case 'ArrowDown':
                e.preventDefault();
                setVolume(v => {
                    const newV = Math.max(0, v - 0.1);
                    videoRef.current.volume = newV;
                    setIsMuted(newV === 0);
                    return newV;
                });
                break;
            case 'KeyM':
                toggleMute();
                break;
            case 'KeyF':
                toggleFullscreen();
                break;
        }
        setShowControls(true); // Show controls on key interaction
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, showControls]); // Dependencies for keeping state fresh if needed

  /* View Counting Logic */
  const hasCountedView = useRef(false);
  useEffect(() => {
      // Only count view once per session when playing starts
      if (isPlaying && !hasCountedView.current) {
          // Assume ID is passed or derived. Since we only have src/poster props here, 
          // we might need to pass the ID prop.
          // However, for this MVP we can parse the URL or just skip if no ID is available.
          // Ideally VideoPlayer should accept `movieId` prop.
          // Let's see if we can extract it from the URL since we are on /watch/:id
          const pathSegments = window.location.pathname.split('/');
          const possibleId = pathSegments[pathSegments.indexOf('watch') + 1];
          
          if (possibleId && !possibleId.startsWith('mock-')) {
             fetch(`http://localhost:5000/api/movies/${possibleId}/view`, { method: 'POST' })
             .catch(err => console.error("View count error", err));
             hasCountedView.current = true;
          }
      }
  }, [isPlaying]);

  // Safety timeout for loading state (in case iframe/video onLoad doesn't fire)
  useEffect(() => {
    const timer = setTimeout(() => {
        if (isLoading) setIsLoading(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (videoRef.current.parentElement.requestFullscreen) {
        videoRef.current.parentElement.requestFullscreen();
      }
    } else {
       if (document.exitFullscreen) {
        document.exitFullscreen();
       }
    }
  };
  
  const formatTime = (time) => {
      if (!time) return "0:00";
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="player-wrapper">
      <div className={`back-btn ${showControls ? 'visible' : 'hidden'}`} onClick={() => navigate(-1)}>
        <ArrowLeft size={30} />
      </div>

      {isLoading && !src.includes('drive.google.com') && (
        <div className="loading-overlay">
            <Loader className="spinner" size={50} />
        </div>
      )}

      {src.includes('drive.google.com') ? (
        <>
         <iframe 
            src={`https://drive.google.com/file/d/${src.match(/[-\w]{25,}/)?.[0] || ""}/preview`}
            className="video-element" 
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            style={{border: 'none'}}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
         />
         <div style={{
             position: 'absolute',
             bottom: '20px', 
             right: '20px',
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'end',
             zIndex: 50
         }}>
             <a 
                href={src.replace('/preview', '/view')} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                    color: 'rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    marginBottom: '5px'
                }}
             >
                Open in Drive ↗
             </a>
             <span style={{color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem'}}>
                (If video is blank, Google is still processing it)
             </span>
         </div>
        </>
      ) : (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            className="video-element"
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
            onWaiting={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
            onLoadedData={() => setIsLoading(false)}
          />
      )}

      {/* Only show custom controls for native video, OR maybe a simple overlay for Drive? 
          Drive player has its own controls. We should probably hide our custom controls if it's Drive.
      */}
      {!src.includes('drive.google.com') && (
      <div className={`controls-overlay ${showControls ? 'visible' : 'hidden'}`}>
        {/* Progress Bar */}
        <div className="progress-container" onClick={handleSeek}>
          <div className="progress-bar" style={{ width: `${progress}%` }}>
            <div className="scrubber-head"></div>
          </div>
        </div>

        <div className="controls-row">
          <div className="left-controls">
            <button onClick={togglePlay} className="control-btn play-btn">
                {isPlaying ? <Pause size={28} /> : <Play size={28} fill="currentColor" />}
            </button>
            
            <div className="volume-control">
                <button onClick={toggleMute} className="control-btn">
                {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    value={volume} 
                    onChange={handleVolumeChange} 
                    className="volume-slider"
                />
            </div>
            
            <span className="time-display">
                {formatTime(videoRef.current?.currentTime)} / {formatTime(videoRef.current?.duration)}
            </span>
          </div>

          <div className="right-controls">
            <button onClick={toggleFullscreen} className="control-btn">
                <Maximize size={24} />
            </button>
          </div>
        </div>
      </div>
      )}

      <style>{`
        .player-wrapper {
          position: relative;
          width: 100vw;
          height: 100vh;
          background: black;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: 'Outfit', sans-serif;
        }

        .video-element {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .back-btn {
          position: absolute;
          top: 30px;
          left: 30px;
          z-index: var(--z-controls);
          color: white;
          cursor: pointer;
          background: rgba(0,0,0,0.5);
          width: 50px; height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .back-btn:hover {
            background: white;
            color: black;
            transform: scale(1.1);
        }
        
        .back-btn.hidden { opacity: 0; pointer-events: none; }

        .loading-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.5);
            z-index: var(--z-overlay);
        }
        
        .spinner {
            animation: spin 1s linear infinite;
            color: var(--neon-blue);
        }
        
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .controls-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, transparent 100%);
          padding: 40px 60px;
          transition: opacity 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 15px;
          z-index: var(--z-controls);
        }

        .controls-overlay.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .progress-container {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.2);
          cursor: pointer;
          border-radius: 4px;
          position: relative;
          transition: height 0.2s;
        }
        
        .progress-container:hover { height: 10px; }

        .progress-bar {
          height: 100%;
          background: var(--neon-blue);
          border-radius: 4px;
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .scrubber-head {
            width: 16px; height: 16px;
            background: white;
            border-radius: 50%;
            position: absolute;
            right: -8px;
            transform: scale(0);
            transition: transform 0.2s;
        }
        
        .progress-container:hover .scrubber-head { transform: scale(1); }

        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .left-controls, .right-controls {
            display: flex; align-items: center; gap: 20px;
        }
        
        .volume-control {
            display: flex; align-items: center; gap: 10px;
        }
        
        .volume-slider {
            width: 0;
            overflow: hidden;
            transition: width 0.3s;
            appearance: none;
            height: 4px;
            background: rgba(255,255,255,0.3);
            border-radius: 2px;
        }
        
        .volume-control:hover .volume-slider { width: 100px; }
        
        .volume-slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px; height: 12px;
            background: white;
            border-radius: 50%;
            cursor: pointer;
        }

        .control-btn {
          background: none;
          border: none;
          color: #e5e5e5;
          cursor: pointer;
          transition: transform 0.2s, color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .control-btn:hover {
          color: white;
          transform: scale(1.1);
        }
        
        .play-btn:hover {
            color: var(--neon-blue);
        }
        
        .time-display {
            color: #d1d5db;
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        @media (max-width: 768px) {
            .controls-overlay { padding: 20px; }
            .volume-slider { width: 80px; } /* Always show on mobile if space allows */
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
