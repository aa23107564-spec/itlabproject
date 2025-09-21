import React from 'react';
import WordGame from './WordGame';
import LongPressBackToLogin from './LongPressBackToLogin';

function Chapter3() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#6B6B6B'
    }}>
      <WordGame />
      
      {/* Long Press Back to Login Component */}
      <LongPressBackToLogin />
    </div>
  );
}

export default Chapter3;

