import React from 'react';
import LongPressBackToLogin from './LongPressBackToLogin';

function Chapter2() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ fontSize: '24px', color: '#666' }}>章節二</div>
      
      {/* Long Press Back to Login Component */}
      <LongPressBackToLogin />
    </div>
  );
}

export default Chapter2;

