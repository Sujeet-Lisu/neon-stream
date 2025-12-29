import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Upload, FileVideo, Image as ImageIcon, CheckCircle, AlertCircle, Cloud, Trash2, Edit2, X, Search, Plus, Film } from 'lucide-react';
import { PageTransition } from '../components/PageTransition';
import '../index.css';

const Admin = () => {
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'upload'
  const [movies, setMovies] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [driveConnected, setDriveConnected] = useState(false);
  
  // Upload State
  const [formData, setFormData] = useState({ title: '', description: '', year: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [posterFile, setPosterFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, success, error
  const [message, setMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const xhrRef = useRef(null);

  // Edit/Delete State
  const [editingMovie, setEditingMovie] = useState(null);
  const [deletingMovie, setDeletingMovie] = useState(null);

  useEffect(() => {
      const token = localStorage.getItem('admin_token');
      if (token) {
          setIsAuthenticated(true);
          checkDriveStatus(token);
          fetchMovies(token);
      }
  }, [isAuthenticated]);

  const checkDriveStatus = (token) => {
    fetch('http://localhost:5000/api/drive/status', {
        headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setDriveConnected(data.connected))
    .catch(err => console.error("Drive Check Error", err));
  };

  const fetchMovies = (token) => {
      const t = token || localStorage.getItem('admin_token');
      fetch('http://localhost:5000/api/movies', {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      .then(res => res.json())
      .then(data => setMovies(data.data || []))
      .catch(err => console.error("Fetch Movies Error:", err));
  };

  const handleLogin = async (e) => {
      e.preventDefault();
      try {
          const res = await fetch('http://localhost:5000/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password })
          });
          const data = await res.json();
          if (res.ok) {
              localStorage.setItem('admin_token', data.token);
              setIsAuthenticated(true);
          } else {
              alert("Invalid Password");
          }
      } catch (err) {
          console.error("Login Error:", err);
      }
  };

  /* --- UPLOAD LOGIC --- */

  const handleFileChange = (e, type) => {
    if (e.target.files[0]) {
        if (type === 'video') setVideoFile(e.target.files[0]);
        if (type === 'poster') setPosterFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) return;

    setStatus('uploading');
    setUploadProgress(0);
    setMessage('Uploading to Server...');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('year', formData.year);
    data.append('video', videoFile);
    if (posterFile) data.append('poster', posterFile);

    const token = localStorage.getItem('admin_token');

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open('POST', 'http://localhost:5000/api/upload');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
            if (percent === 100) {
                setStatus('processing');
                setMessage('Please Wait: Uploading to Google Drive... (This may take a few mins)');
            }
        }
    };

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            setStatus('success');
            setMessage('Movie Published Successfully!');
            setFormData({ title: '', description: '', year: '' });
            setVideoFile(null);
            setPosterFile(null);
            setUploadProgress(0);
            fetchMovies(token); // Refresh list
            setTimeout(() => {
                setStatus('idle');
                setView('dashboard'); // Return to dashboard
            }, 2000);
        } else {
            setStatus('error');
            try {
                const res = JSON.parse(xhr.responseText);
                setMessage(res.error || "Upload Failed");
            } catch (e) {
                setMessage("Upload Failed");
            }
        }
    };

    xhr.onerror = () => {
        setStatus('error');
        setMessage("Network Error during upload");
    };

    xhr.onabort = () => {
        setStatus('idle');
        setMessage("Upload Cancelled");
        setUploadProgress(0);
    };

    xhr.send(data);
  };

  const cancelUpload = () => {
      if (xhrRef.current) {
          xhrRef.current.abort();
          xhrRef.current = null;
      }
  };

  /* --- EDIT LOGIC --- */
  
  const handleEditSubmit = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem('admin_token');
      try {
          const res = await fetch(`http://localhost:5000/api/movies/${editingMovie.id}`, {
              method: 'PUT',
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(editingMovie)
          });
          if (res.ok) {
              setEditingMovie(null);
              fetchMovies(token);
          } else {
              alert("Update failed");
          }
      } catch (err) {
          console.error(err);
      }
  };

  /* --- DELETE LOGIC --- */

  const confirmDelete = async () => {
      if (!deletingMovie) return;
      const token = localStorage.getItem('admin_token');
      
      try {
          const res = await fetch(`http://localhost:5000/api/movies/${deletingMovie.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (res.ok) {
              setDeletingMovie(null);
              fetchMovies(token);
          } else {
              alert("Delete failed");
          }
      } catch (err) {
          console.error(err);
      }
  };

  return (
    <PageTransition>
    <div className="admin-page">
      <Navbar />
      
      <div className="admin-container">
        {!isAuthenticated ? (
            <div className="glass-panel login-card">
                <h2>Admin Access</h2>
                <form onSubmit={handleLogin}>
                    <input 
                        type="password" 
                        className="input-modern"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter Admin Password"
                    />
                    <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '20px'}}>Login</button>
                </form>
            </div>
        ) : (
        <>
            {/* Header */}
            <div className="admin-header">
                <div>
                    <h1 className="page-title">Command Center</h1>
                    <p className="page-subtitle">
                        {driveConnected ? 
                            <span className="badge-saas connected"><Cloud size={14}/> Drive Connected</span> : 
                            <span className="badge-saas disconnected"><AlertCircle size={14}/> Drive Disconnected</span>
                        }
                    </p>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    {!driveConnected && (
                        <a href="http://localhost:5000/api/auth/google" target="_blank" className="btn-secondary">
                            Connect Drive
                        </a>
                    )}
                    <button onClick={() => { localStorage.removeItem('admin_token'); setIsAuthenticated(false); }} className="btn-secondary">
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            {view === 'dashboard' ? (
                <div className="dashboard-view">
                    <div className="dash-toolbar">
                        <h2>Library ({movies.length})</h2>
                        <button onClick={() => setView('upload')} className="btn-primary">
                            <Plus size={18} style={{marginRight: '6px'}}/> Add Movie
                        </button>
                    </div>

                    <div className="movie-list">
                        {movies.map(movie => (
                            <div key={movie.id} className="movie-row glass-panel">
                                <img 
                                    src={movie.poster_path ? `http://localhost:5000/uploads/${movie.poster_path}` : 'https://via.placeholder.com/150'} 
                                    alt={movie.title} 
                                    className="row-poster"
                                />
                                <div className="row-info">
                                    <h3>{movie.title}</h3>
                                    <p>{movie.year} • {movie.views} views</p>
                                </div>
                                <div className="row-actions">
                                    <button onClick={() => setEditingMovie(movie)} className="action-btn edit">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => setDeletingMovie(movie)} className="action-btn delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {movies.length === 0 && (
                            <div className="empty-state">
                                <Film size={40} style={{opacity: 0.3}} />
                                <p>No movies yet. Add your first one!</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="glass-panel upload-card">
                    <div className="card-header">
                        <h2>Upload New Movie</h2>
                        <button onClick={() => setView('dashboard')} className="btn-secondary sm">
                            <X size={18} /> Cancel
                        </button>
                    </div>

                    <form onSubmit={handleUpload} className="upload-grid">
                        <div className="left-col">
                            <div className="form-group">
                                <label>Title</label>
                                <input type="text" name="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="input-modern" />
                            </div>
                            <div className="form-group">
                                <label>Year</label>
                                <input type="text" name="year" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="input-modern" />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows="4" className="input-modern textarea" />
                            </div>
                        </div>

                        <div className="right-col">
                            <div className={`file-drop-zone ${posterFile ? 'active' : ''}`}>
                                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'poster')} id="poster-upload" hidden />
                                <label htmlFor="poster-upload" className="drop-label">
                                    <ImageIcon size={30} className="drop-icon" />
                                    <span className="drop-text">{posterFile ? posterFile.name : "Select Poster"}</span>
                                </label>
                            </div>
                            <div className={`file-drop-zone ${videoFile ? 'active' : ''}`}>
                                <input type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} id="video-upload" hidden />
                                <label htmlFor="video-upload" className="drop-label">
                                    <FileVideo size={30} className="drop-icon" />
                                    <span className="drop-text">{videoFile ? videoFile.name : "Select Video File"}</span>
                                </label>
                            </div>
                        </div>

                        {/* Progress & Actions */}
                        <div className="upload-footer">
                            {status === 'uploading' || status === 'processing' ? (
                                <div className="progress-section">
                                    <div className="progress-bar-track">
                                        <div className="progress-fill" style={{width: `${uploadProgress}%`}}></div>
                                    </div>
                                    <div className="progress-meta">
                                        <span>{status === 'processing' ? 'Processing...' : `${uploadProgress}% Uploaded`}</span>
                                        <button type="button" onClick={cancelUpload} className="btn-text-danger">Cancel</button>
                                    </div>
                                    <p className="status-text">{message}</p>
                                </div>
                            ) : (
                                <button type="submit" className="btn-primary full-width" disabled={!videoFile}>
                                    Start Upload <Upload size={18} style={{marginLeft:'8px'}}/>
                                </button>
                            )}
                            {status === 'success' && <div className="success-msg"><CheckCircle size={18}/> {message}</div>}
                            {status === 'error' && <div className="error-msg"><AlertCircle size={18}/> {message}</div>}
                        </div>
                    </form>
                </div>
            )}
        </>
        )}
      </div>

      {/* Edit Modal */}
      {editingMovie && (
          <div className="modal-overlay">
              <div className="modal-content glass-panel">
                  <h3>Edit Movie</h3>
                  <form onSubmit={handleEditSubmit}>
                      <div className="form-group">
                          <label>Title</label>
                          <input type="text" value={editingMovie.title} onChange={e => setEditingMovie({...editingMovie, title: e.target.value})} className="input-modern"/>
                      </div>
                      <div className="form-group">
                          <label>Year</label>
                          <input type="text" value={editingMovie.year} onChange={e => setEditingMovie({...editingMovie, year: e.target.value})} className="input-modern"/>
                      </div>
                      <div className="form-group">
                          <label>Description</label>
                          <textarea value={editingMovie.description} onChange={e => setEditingMovie({...editingMovie, description: e.target.value})} rows="3" className="input-modern textarea"/>
                      </div>
                      <div className="modal-actions">
                          <button type="button" onClick={() => setEditingMovie(null)} className="btn-secondary">Cancel</button>
                          <button type="submit" className="btn-primary">Save Changes</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Delete Modal */}
      {deletingMovie && (
          <div className="modal-overlay">
              <div className="modal-content glass-panel">
                  <h3 className="text-danger">Delete Movie?</h3>
                  <p>Are you sure you want to delete <strong>{deletingMovie.title}</strong>?</p>
                  <p className="warning-text">This will permanently delete the video from Google Drive and the database.</p>
                  <div className="modal-actions">
                      <button onClick={() => setDeletingMovie(null)} className="btn-secondary">Cancel</button>
                      <button onClick={confirmDelete} className="btn-danger">Yes, Delete Forever</button>
                  </div>
              </div>
          </div>
      )}

      <style>{`
        .admin-page {
          min-height: 100vh;
          background: radial-gradient(circle at top right, #1e1b4b 0%, var(--bg-primary) 40%);
          padding-top: 100px;
          padding-bottom: 60px;
        }
        .admin-container { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
        .admin-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; }
        .page-title { font-size: 2.2rem; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
        
        .badge-saas { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; margin-top: 8px; }
        .badge-saas.connected { background: rgba(6, 182, 212, 0.1); color: var(--neon-blue); border: 1px solid rgba(6, 182, 212, 0.3); }
        .badge-saas.disconnected { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

        .dashboard-view { animation: fadeIn 0.4s ease; }
        .dash-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .dash-toolbar h2 { font-size: 1.5rem; color: white; }

        .movie-list { display: flex; flex-direction: column; gap: 15px; }
        .movie-row { display: flex; align-items: center; padding: 15px; border-radius: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; }
        .movie-row:hover { background: rgba(255,255,255,0.06); transform: translateX(5px); }
        .row-poster { width: 50px; height: 75px; object-fit: cover; border-radius: 6px; margin-right: 20px; }
        .row-info { flex: 1; }
        .row-info h3 { margin: 0 0 5px 0; font-size: 1.1rem; color: white; }
        .row-info p { margin: 0; color: #94a3b8; font-size: 0.9rem; }
        .row-actions { display: flex; gap: 10px; }
        
        .action-btn { width: 36px; height: 36px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .action-btn.edit { background: rgba(255,255,255,0.1); color: white; }
        .action-btn.edit:hover { background: white; color: black; }
        .action-btn.delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        .action-btn.delete:hover { background: #ef4444; color: white; }

        .upload-card { padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.08); }
        .upload-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; margin-top: 30px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; color: #94a3b8; margin-bottom: 8px; font-size: 0.9rem; }
        
        .file-drop-zone { border: 2px dashed rgba(255,255,255,0.1); border-radius: 12px; height: 120px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; margin-bottom: 20px; }
        .file-drop-zone:hover { border-color: var(--neon-blue); background: rgba(6, 182, 212, 0.05); }
        .file-drop-zone.active { border-color: #46d369; background: rgba(70, 211, 105, 0.05); }
        .drop-icon { margin-bottom: 8px; color: #94a3b8; }
        .drop-label { text-align: center; width: 100%; }

        .progress-section { margin-top: 20px; }
        .progress-bar-track { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 10px; }
        .progress-fill { height: 100%; background: var(--neon-blue); transition: width 0.3s ease; }
        .progress-meta { display: flex; justify-content: space-between; font-size: 0.85rem; color: #94a3b8; }
        .status-text { text-align: center; margin-top: 10px; font-size: 0.9rem; color: white; }
        .btn-text-danger { background: none; border: none; color: #ef4444; cursor: pointer; text-decoration: underline; font-size: 0.85rem; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
        .modal-content { width: 100%; max-width: 500px; padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); background: #0f172a; }
        .modal-content h3 { margin: 0 0 20px 0; color: white; font-size: 1.5rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 30px; }
        .warning-text { color: #ef4444; font-size: 0.9rem; margin-top: 10px; background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 6px; }
        
        .btn-danger { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 500; }
        .btn-danger:hover { background: #dc2626; }
        .btn-secondary.sm { padding: 6px 12px; font-size: 0.85rem; display: flex; alignItems: center; gap: 6px; }
        
        .login-card { max-width: 400px; margin: 40px auto; padding: 40px; text-align: center; }
        .full-width { width: 100%; }
        .text-danger { color: #ef4444; }
        .success-msg { color: #46d369; margin-top: 15px; display: flex; align-items: center; gap: 8px; justify-content: center; }
        .error-msg { color: #ef4444; margin-top: 15px; display: flex; align-items: center; gap: 8px; justify-content: center; }
        .empty-state { text-align: center; padding: 60px; color: #64748b; }

        @media (max-width: 768px) {
            .upload-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
    </PageTransition>
  );
};

export default Admin;
