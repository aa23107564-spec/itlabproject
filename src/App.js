import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { use43Fullscreen } from './hooks/use43Fullscreen';
import Login from './components/Login';
import Chapter1 from './components/Chapter1';
import Chapter2 from './components/Chapter2';
import Chapter3 from './components/Chapter3';
import TestPage from './components/TestPage';

function AppContent() {
  const location = useLocation();
  const scale = use43Fullscreen();

  // 只有 Chapter3 使用 4:3 全螢幕縮放，其他頁面使用 16:9 全螢幕
  const shouldUse43Scaling = location.pathname === '/chapter3';

  return (
    <div 
      className="app-wrapper"
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      <div 
        className="app-container"
        style={{
          width: shouldUse43Scaling ? `${window.innerHeight * (4/3)}px` : '100vw',
          height: shouldUse43Scaling ? '100vh' : '100vh',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div className="App" style={{
          width: '100%',
          height: '100%'
        }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/chapter1" element={<Chapter1 />} />
            <Route path="/chapter2" element={<Chapter2 />} />
            <Route path="/chapter3" element={<Chapter3 />} />
            <Route path="/test" element={<TestPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router basename="/itlabproject">
      <AppContent />
    </Router>
  );
}

export default App;
