import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../index.css';

const Navbar = ({ searchTerm, onSearch }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Series', path: '/series' },
    { name: 'Movies', path: '/movies' },
    { name: 'New & Popular', path: '/new' },
    { name: 'My List', path: '/list' }
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container">
        <div className="nav-left">
          <Link to="/" className="brand-logo">
            NEON<span className="text-gradient">STREAM</span>
          </Link>
          
          <ul className="desktop-links">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link 
                  to={link.path} 
                  className={location.pathname === link.path ? 'active' : ''}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="nav-right">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input 
                type="text" 
                placeholder="Search titles..." 
                className="search-input"
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          <div className="icon-wrapper">
            <Bell size={22} />
          </div>
          <div className="profile-wrapper">
             <Link to="/login"> 
                <div className="avatar">
                    <User size={20} />
                </div>
             </Link>
          </div>
          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-links">
          {navLinks.map((link) => (
             <Link 
                key={link.name} 
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
             >
                {link.name}
            </Link>
          ))}
          <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: var(--nav-height);
          z-index: var(--z-fixed);
          transition: background 0.3s ease, padding 0.3s ease;
          background: linear-gradient(to bottom, rgba(3,7,18,0.8) 0%, rgba(3,7,18,0) 100%);
        }

        .navbar.scrolled {
          background: rgba(3, 7, 18, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          height: 70px;
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 48px;
        }

        .brand-logo {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -1px;
          text-decoration: none;
          color: white;
        }

        .desktop-links {
          display: flex;
          gap: 24px;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .desktop-links a {
          font-size: 0.95rem;
          color: var(--text-secondary);
          transition: var(--transition-fast);
          font-weight: 500;
        }

        .desktop-links a:hover, .desktop-links a.active {
          color: white;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px; /* Reduced gap */
        }

        @media (max-width: 600px) {
            .nav-left { gap: 16px; }
            .brand-logo { font-size: 1.4rem; }
            /* Hide Search and Bell on mobile to save space */
            .icon-wrapper { display: none; }
        }

        .icon-wrapper {
          cursor: pointer;
          color: white;
          transition: var(--transition-fast);
        }

        .icon-wrapper:hover {
            color: var(--neon-blue);
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 6px;
          background: var(--bg-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
          cursor: pointer;
        }
        
        .avatar:hover {
            border-color: var(--neon-blue);
        }

        .mobile-toggle {
          display: none;
          background: none;
          color: white;
        }

        /* Mobile Menu */
        .mobile-menu {
          position: fixed;
          top: var(--nav-height);
          left: 0;
          width: 100%;
          background: rgba(3,7,18,0.98);
          padding: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          transform: translateY(-150%);
          transition: transform 0.4s var(--ease-spring);
          z-index: var(--z-modal);
        }

        .mobile-menu.open {
          transform: translateY(0);
        }

        .mobile-links {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .mobile-links a {
            font-size: 1.2rem;
            font-weight: 600;
            color: var(--text-secondary);
        }
        
        .mobile-links a:hover {
            color: white;
            padding-left: 10px;
        }

        @media (max-width: 900px) {
          .desktop-links {
            display: none;
          }
          .mobile-toggle {
            display: block;
          }
           /* On mobile, shrink search or hide text */
          .search-container { width: 40px; background: transparent; border: none; }
          .search-input { display: none; }
          .search-icon { color: white; }
        }

        /* Search Bar Styles */
        .search-container {
            position: relative;
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 6px 12px;
            transition: all 0.3s ease;
            width: 240px;
        }

        .search-container:focus-within {
            background: rgba(0, 0, 0, 0.6);
            border-color: var(--neon-blue);
            box-shadow: 0 0 10px rgba(6, 182, 212, 0.3);
            width: 280px;
        }

        .search-icon {
            color: #94a3b8;
            min-width: 18px;
        }

        .search-input {
            background: transparent;
            border: none;
            outline: none;
            color: white;
            margin-left: 8px;
            font-size: 0.9rem;
            width: 100%;
        }

        .search-input::placeholder {
            color: #64748b;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
