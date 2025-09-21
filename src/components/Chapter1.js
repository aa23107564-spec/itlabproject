import React from 'react';
import LongPressBackToLogin from './LongPressBackToLogin';

function Chapter1() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ fontSize: '24px', color: '#666' }}>章節一</div>
      
      {/* Long Press Back to Login Component */}
      <LongPressBackToLogin />
    </div>
  );
}

export default Chapter1;

