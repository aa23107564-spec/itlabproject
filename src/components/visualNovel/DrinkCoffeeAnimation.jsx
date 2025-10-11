import React, { useState, useEffect } from 'react';
import '../../styles/drinkCoffeeAnimation.css';

const DrinkCoffeeAnimation = () => {
  const [imageOpacities, setImageOpacities] = useState({
    img22: 0,    // 22.jpg 的透明度，用於第二次轉場
    imgDrink: 0  // drinkcoffee.jpg 的透明度
  });

  useEffect(() => {
    // 第一階段：drinkcoffee.jpg 淡入（0.05-1秒）
    const timer1 = setTimeout(() => {
      setImageOpacities({
        img22: 0,
        imgDrink: 1  // 淡入
      });
    }, 50); // 給50ms延遲，確保初始狀態先渲染

    // 第二階段：22.jpg 淡入覆蓋 drinkcoffee（2.5-3.5秒）
    const timer2 = setTimeout(() => {
      setImageOpacities({
        img22: 1,    // 淡入覆蓋
        imgDrink: 1
      });
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="drink-coffee-animation">
      {/* 背景層：當前的 22.jpg（從 Chapter2 繼承） */}
      
      {/* 第二層：drinkcoffee.jpg - z-index: 2 */}
      <img 
        src="/images/backgrounds/drinkcoffee.jpg" 
        alt="Drink Coffee" 
        className="drink-coffee-layer"
        style={{ 
          opacity: imageOpacities.imgDrink,
          zIndex: 2,
          transition: 'opacity 1s ease-in-out'
        }}
      />
      
      {/* 第三層：22.jpg - z-index: 3 */}
      <img 
        src="/images/backgrounds/22.jpg" 
        alt="Background 22" 
        className="drink-coffee-layer"
        style={{ 
          opacity: imageOpacities.img22,
          zIndex: 3,
          transition: 'opacity 1s ease-in-out'
        }}
      />
    </div>
  );
};

export default DrinkCoffeeAnimation;


