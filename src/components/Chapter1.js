import React from 'react';
import LongPressBackToLogin from './LongPressBackToLogin';

function Chapter1() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      <div style={{ fontSize: '24px', color: '#666' }}>章節一</div>
      
      {/* Long Press Back to Login Component */}
      <LongPressBackToLogin />
    </div>
  );
}

export default Chapter1;

