import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageTransition } from '../components/PageTransition';
import '../index.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Mock login
    navigate('/');
  };

  return (
    <PageTransition>
    <div className="auth-page">
      <div className="auth-bg">
        <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80&w=1600" alt="Background" />
        <div className="auth-overlay"></div>
      </div>

      <div className="auth-container">
        <div className="brand-logo mb-4">
            NEON<span className="text-gradient">STREAM</span>
        </div>
        
        <div className="glass-panel auth-card">
          <h2>Sign In</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <input 
                    type="email" 
                    className="input-modern" 
                    placeholder="Email or phone number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                />
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <input 
                    type="password" 
                    className="input-modern" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                />
            </div>
            
            <button type="submit" className="btn-primary w-100">Sign In</button>
            
            <div className="auth-help">
                <div className="remember-me">
                    <input type="checkbox" id="remember" />
                    <label htmlFor="remember">Remember me</label>
                </div>
                <a href="#" className="link-hover">Need help?</a>
            </div>
          </form>
          
          <div className="auth-footer">
            <p className="text-muted">
                New to NeonStream? <Link to="/register" className="text-white fw-bold">Sign up now</Link>.
            </p>
            <p className="recaptcha-text">
                This page is protected by Google reCAPTCHA to ensure you're not a bot.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
            position: relative;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .auth-bg {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: var(--z-negative);
        }
        
        .auth-bg img {
            width: 100%; height: 100%; object-fit: cover;
        }
        
        .auth-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6);
            background-image: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%, rgba(0,0,0,0.8) 100%);
        }
        
        .auth-container {
            width: 100%;
            max-width: 450px;
            padding: 20px;
            z-index: var(--z-raised);
        }

        .auth-card {
            padding: 60px 68px 40px;
            border-radius: 4px; /* Netflix style is boxy */
            background: rgba(0,0,0,0.75);
            border: none;
        }
        
        .auth-card h2 {
            color: white;
            font-size: 2rem;
            margin-bottom: 28px;
        }
        
        .w-100 { width: 100%; justify-content: center; margin-top: 20px; }
        
        .auth-help {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            color: #b3b3b3;
            margin-top: 15px;
        }
        
        .remember-me {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .link-hover:hover {
            text-decoration: underline;
        }
        
        .auth-footer {
            margin-top: 40px;
            color: #737373;
            font-size: 1rem;
        }
        
        .text-white { color: white; }
        .fw-bold { font-weight: 500; }
        
        .recaptcha-text {
            font-size: 0.8rem;
            margin-top: 15px;
        }
        
        .mb-4 { margin-bottom: 20px; text-align: center; font-size: 2rem; }

        @media (max-width: 768px) {
            .auth-card {
                padding: 40px 20px;
                background: black; /* Full black on mobile usually */
            }
            .auth-bg { display: none; }
            .auth-page { background: black; align-items: flex-start; }
            .auth-container { margin-top: 40px; }
            .mb-4 { text-align: left; }
        }
      `}</style>
    </div>
    </PageTransition>
  );
};

export default Login;
