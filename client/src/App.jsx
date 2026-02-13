import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Watch = lazy(() => import('./pages/Watch'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));

import { AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Simple Loading Component
const PageLoader = () => (
  <div style={{
    height: '100vh', 
    width: '100%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    background: '#030712', 
    color: '#06b6d4'
  }}>
    <div className="loader-spinner"></div>
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/login" element={<Login />} />
            {/* Placeholder routes for now */}
            <Route path="/movies" element={<Home />} />
            <Route path="/series" element={<Home />} />
            <Route path="/new" element={<Home />} />
            <Route path="*" element={<Home />} /> {/* Catch-all redirect to Home */}
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AnimatedRoutes />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
