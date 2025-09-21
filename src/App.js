import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { use43Fullscreen } from './hooks/use43Fullscreen';
import Login from './components/Login';
import Chapter1 from './components/Chapter1';
import Chapter2 from './components/Chapter2';
import Chapter3 from './components/Chapter3';
import TestPage from './components/TestPage';

function App() {
  const scale = use43Fullscreen();

  return (
    <Router>
      <div 
        className="app-container"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center'
        }}
      >
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/chapter1" element={<Chapter1 />} />
            <Route path="/chapter2" element={<Chapter2 />} />
            <Route path="/chapter3" element={<Chapter3 />} />
            <Route path="/test" element={<TestPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
