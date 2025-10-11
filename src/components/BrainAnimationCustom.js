import React from 'react';

function BrainAnimationCustom() {
  return (
    <div style={{
      width: '150px',
      height: '150px',
      marginBottom: '5px',
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '8px'
    }}>
      {/* 直接使用 GIF 動畫 */}
      <img
        src={`${process.env.PUBLIC_URL || ''}/images/icons/brain.gif`}
        alt="腦部動畫"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </div>
  );
}

export default BrainAnimationCustom;
