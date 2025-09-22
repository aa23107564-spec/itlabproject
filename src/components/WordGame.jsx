import React, { useState, useEffect, useRef } from 'react';
import '../styles/word2003.css';

// 遊戲數據
const gameData = [
  {
    id: 1,
    text: "又回到保健室躺著，數不清是開學後的第幾次了，無法抵抗的恐懼如同海水沖刷夾帶的砂石附著在腳上、膝上、腿上。隔簾內，我所有的只不過用人臉的相反色填充而成的視野。",
    interactiveWords: [
      { id: 1, word: "相反色", startIndex: 67, endIndex: 70, options: ["相反色", "互補色", "對比色"] }
    ]
  },
  {
    id: 2,
    text: "「直子，睜開眼睛！看著我！」綠子的眼睛，眼珠是暗沉的十六芒星，浸泡在稀釋過的牛奶中浮沉。",
    interactiveWords: [
      { id: 1, word: "十六芒星", startIndex: 26, endIndex: 30, options: ["十六芒星", "十六邊形"] }
    ]
  },
  {
    id: 3,
    text: "從雙眼皮夾縫的波浪起伏得知她隨波逐流性格。靠近眼頭的線條圓潤、夾角堅挺，總是向四方發射一雙對似是而非不屑一顧的眼神。",
    interactiveWords: [
      { id: 1, word: "波浪起伏", startIndex: 7, endIndex: 11, options: ["波浪起伏", "坡度緩急", "抑揚頓挫"] },
      { id: 2, word: "隨波逐流", startIndex: 14, endIndex: 18, options: ["隨波逐流", "快慢不定", "不善隱晦"] }
    ]
  },
  {
    id: 4,
    text: "「認真聽我接下來要說的，」綠子的耳朵，比一般人占據頭部的面積比例大了些，不知是否因為這樣時常被稱作機靈，但耳朵大等於腦子好是什麼道理？因為耳朵是最不善欺騙的器官嗎？有「視錯覺」這個詞彙，但好像從未聽過有人提過「聽錯覺」什麼的。總之我大概是屬於耳朵小的人，連自身的感官經驗都在欺騙自己，這是我這種人一輩子都沒有機會明白的那種道理吧。",
    interactiveWords: [
      { id: 1, word: "耳朵", startIndex: 16, endIndex: 18, options: ["耳朵", "聽覺"] },
      { id: 2, word: "不善欺騙的器官", startIndex: 73, endIndex: 80, options: ["不善欺騙的器官", "誠心誠意的感官"] }
    ]
  },
  {
    id: 5,
    text: "「死了就死了吧！至少你吃過我做的湯烏龍麵呢！」綠子的唇，興味盎然的一抹艷紅。",
    interactiveWords: [
      { id: 1, word: "興味盎然", startIndex: 28, endIndex: 32, options: ["興味盎然", "意興闌珊"] },
      { id: 2, word: "一抹艷紅", startIndex: 33, endIndex: 37, options: ["一抹艷紅", "一撮淡紅"] }
    ]
  }
];

export default function WordGame() {
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [selectedWordId, setSelectedWordId] = useState(null);
  const [showChoiceMenu, setShowChoiceMenu] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(0);
  const [wordChoices, setWordChoices] = useState([]);
  const [gameState, setGameState] = useState('typing'); // typing, selecting, choosing, completing
  const [replacedWords, setReplacedWords] = useState({}); // 儲存已替換的詞彙
  const [showCompleteHint, setShowCompleteHint] = useState(false); // 顯示完成提示
  
  const textContainerRef = useRef(null);
  const cursorRef = useRef(null);
  const choiceMenuRef = useRef(null);

  // 逐字顯示動畫
  useEffect(() => {
    if (isTyping && currentPosition < gameData[currentParagraph].text.length) {
      const delay = 100; // 固定速度 100ms
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + gameData[currentParagraph].text[currentPosition]);
        setCurrentPosition(prev => prev + 1);
      }, delay);
      
      return () => clearTimeout(timer);
    } else if (isTyping && currentPosition >= gameData[currentParagraph].text.length) {
      setIsTyping(false);
      setGameState('selecting');
    }
  }, [isTyping, currentPosition, currentParagraph]);

  // 開始新段落
  const startNewParagraph = () => {
    if (currentParagraph < gameData.length - 1) {
      setCurrentParagraph(prev => prev + 1);
      setDisplayedText('');
      setCurrentPosition(0);
      setIsTyping(true);
      setGameState('typing');
      setSelectedWordId(null);
      setShowChoiceMenu(false);
      setReplacedWords({}); // 重置替換的詞彙
      setShowCompleteHint(false); // 重置完成提示
    }
  };

  // 鍵盤控制
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState === 'typing' && e.key === 'ArrowDown') {
        // 跳過逐字動畫，直接顯示完整段落
        setDisplayedText(gameData[currentParagraph].text);
        setCurrentPosition(gameData[currentParagraph].text.length);
        setIsTyping(false);
        setGameState('selecting');
      } else if (gameState === 'selecting') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          // 在可互動詞彙和段落結尾之間切換
          const interactiveWords = gameData[currentParagraph].interactiveWords;
          const currentIndex = selectedWordId ? 
            interactiveWords.findIndex(w => w.id === selectedWordId) : -1;
          
          if (e.key === 'ArrowLeft') {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : interactiveWords.length - 1;
            setSelectedWordId(interactiveWords[newIndex].id);
          } else {
            const newIndex = currentIndex < interactiveWords.length - 1 ? currentIndex + 1 : -1;
            setSelectedWordId(newIndex === -1 ? null : interactiveWords[newIndex].id);
          }
          
          // 檢查是否在段尾
          const isAtEnd = selectedWordId === null;
          setShowCompleteHint(isAtEnd);
        } else if (e.key === 'ArrowDown' && selectedWordId) {
          // 開啟選詞選單
          const word = gameData[currentParagraph].interactiveWords.find(w => w.id === selectedWordId);
          const currentWord = replacedWords[selectedWordId] || word.word;
          
          // 重新排列選項，將當前顯示的詞彙放在第一位
          const reorderedOptions = [currentWord];
          word.options.forEach(option => {
            if (option !== currentWord) {
              reorderedOptions.push(option);
            }
          });
          
          setWordChoices(reorderedOptions);
          setShowChoiceMenu(true);
          setSelectedChoice(0);
          setGameState('choosing');
        }
      } else if (gameState === 'choosing') {
        if (e.key === 'ArrowLeft') {
          setSelectedChoice(prev => prev > 0 ? prev - 1 : wordChoices.length - 1);
        } else if (e.key === 'ArrowRight') {
          setSelectedChoice(prev => prev < wordChoices.length - 1 ? prev + 1 : 0);
        } else if (e.key === 'ArrowDown') {
          // 確認選擇
          const selectedWord = gameData[currentParagraph].interactiveWords.find(w => w.id === selectedWordId);
          const newWord = wordChoices[selectedChoice];
          
          // 更新替換的詞彙
          setReplacedWords(prev => ({
            ...prev,
            [selectedWordId]: newWord
          }));
          
          setShowChoiceMenu(false);
          setGameState('selecting');
        }
      } else if (gameState === 'selecting' && e.key === 'ArrowDown' && !selectedWordId) {
        // 在段尾按下下鍵，進入下一段
        startNewParagraph();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, selectedWordId, selectedChoice, wordChoices, currentParagraph]);

  // 開始第一段
  useEffect(() => {
    setIsTyping(true);
  }, []);

  // 渲染文字內容
  const renderText = () => {
    const paragraph = gameData[currentParagraph];
    const text = displayedText;
    const elements = [];
    let lastIndex = 0;

    // 處理已顯示的文字
    paragraph.interactiveWords.forEach(word => {
      if (word.startIndex < text.length) {
        // 添加前面的文字
        if (word.startIndex > lastIndex) {
          elements.push(
            <span key={`text-${lastIndex}`}>
              {text.substring(lastIndex, word.startIndex)}
            </span>
          );
        }
        
        // 添加可互動詞彙
        const originalWordText = text.substring(word.startIndex, word.endIndex);
        const displayWordText = replacedWords[word.id] || originalWordText;
        const isSelected = selectedWordId === word.id;
        elements.push(
          <span 
            key={`word-${word.id}`}
            data-word-id={word.id}
            className={`interactive-word ${isSelected ? 'selected' : ''}`}
          >
            {displayWordText}
            {isSelected && !isTyping && gameState === 'selecting' && (
              <span className="cursor-blink cursor-on-word" style={{ position: 'absolute', marginLeft: '-4px' }}>|</span>
            )}
          </span>
        );
        
        lastIndex = word.endIndex;
      }
    });

    // 添加剩餘文字
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    return elements;
  };

  // 計算選單位置
  const calculateMenuPosition = () => {
    if (!showChoiceMenu || !selectedWordId) return { top: 0, left: 0 };
    
    const wordElement = document.querySelector(`[data-word-id="${selectedWordId}"]`);
    
    if (wordElement && textContainerRef.current) {
      const rect = wordElement.getBoundingClientRect();
      const containerRect = textContainerRef.current.getBoundingClientRect();
      
       // 基本位置：詞彙下方，上緣與藍底白字下緣間隔3px，再往下移50px
       let top = rect.bottom - containerRect.top + 3 + 50;
       let left = rect.left - containerRect.left;
      
       // 檢查是否超出容器邊界
       const menuWidth = 120; // 縮小後的選單寬度
       const menuHeight = 30; // 縮小後的選單高度
      
      // 如果右側超出，調整到左側
      if (left + menuWidth > containerRect.width) {
        left = rect.right - containerRect.left - menuWidth;
      }
      
      // 如果下方空間不足，調整到上方
      if (top + menuHeight > containerRect.height) {
        top = rect.top - containerRect.top - menuHeight - 5;
      }
      
      return { top, left };
    }
    
    return { top: 0, left: 0 };
  };

  const menuPosition = calculateMenuPosition();

  return (
    <div className="word2003-canvas">
      <div className="word2003-window">
        {/* Window Frame / Title Bar */}
        <div className="word2003-titlebar">
          <div className="win-icon">W</div>
          <div className="title-text">Wcrd</div>
          <div className="system-buttons">
            <div className="sys-btn">─</div>
            <div className="sys-btn">▢</div>
            <div className="sys-btn close-btn">✕</div>
          </div>
        </div>
        <div className="word2003-sep" />

        {/* Menu Bar */}
        <div className="word2003-menubar">
          <div className="menu-item">檔案(F)</div>
          <div className="menu-item">編輯(E)</div>
          <div className="menu-item">檢視(V)</div>
          <div className="menu-item">插入(I)</div>
          <div className="menu-item">格式(O)</div>
          <div className="menu-item">工具(T)</div>
          <div className="menu-item">表格(A)</div>
          <div className="menu-item">視窗(W)</div>
          <div className="menu-item">說明(H)</div>
        </div>

        {/* Toolbars */}
        <div className="word2003-toolbars">
          <div className="word2003-toolbar-row">
            <div className="word2003-toolbtn" title="新建">N</div>
            <div className="word2003-toolbtn" title="開啟">O</div>
            <div className="word2003-toolbtn" title="儲存">S</div>
            <div className="word2003-toolbtn" title="列印">P</div>
            <div className="word2003-toolbtn" title="剪下">✂</div>
            <div className="word2003-toolbtn" title="複製">⎘</div>
            <div className="word2003-toolbtn" title="貼上">📋</div>
            <div className="word2003-toolbtn" title="復原">↶</div>
            <div className="word2003-toolbtn is-disabled" title="取消復原">↷</div>
            <div className="word2003-toolbtn" title="搜尋">🔍</div>
            <div className="word2003-select small">100%</div>
          </div>

          <div className="word2003-toolbar-row">
            <div className="word2003-select">Times New Roman</div>
            <div className="word2003-select small">12</div>
            <div className="word2003-toolbtn" title="粗體">B</div>
            <div className="word2003-toolbtn" title="斜體">I</div>
            <div className="word2003-toolbtn" title="底線">U</div>
            <div className="word2003-toolbtn" title="字色">A</div>
            <div className="word2003-toolbtn" title="底色">▇</div>
            <div className="word2003-toolbtn" title="靠左">≡</div>
            <div className="word2003-toolbtn" title="置中">≣</div>
            <div className="word2003-toolbtn" title="靠右">≡</div>
            <div className="word2003-toolbtn" title="項目符號">•</div>
            <div className="word2003-toolbtn" title="項目符號">1.</div>
          </div>
        </div>

        {/* Workspace */}
        <div className="word2003-workspace">
          <div className="word2003-workspace-spacer"></div>
          <div className="word2003-paper">
            {/* 邊界直角記號 */}
            <div className="corner-mark top-left"></div>
            <div className="corner-mark top-right"></div>
            
            {/* 文字容器 */}
            <div 
              ref={textContainerRef}
              className="word-game-text-container"
            >
              {renderText()}
              {isTyping && (
                <span className="cursor-static" style={{ position: 'absolute', marginLeft: '-6px' }}>|</span>
              )}
              {!isTyping && gameState === 'selecting' && !selectedWordId && (
                <span className="cursor-blink" style={{ position: 'absolute', marginLeft: '-6px' }}>|</span>
              )}
              
              {/* 完成提示 */}
              {showCompleteHint && (
                <div className="complete-hint">
                  左右移動以選擇字詞，按下確認可開啟選單，在段尾按下確認以繼續
                </div>
              )}
            </div>
            
            {/* 選詞選單 */}
            {showChoiceMenu && (
              <div 
                ref={choiceMenuRef}
                className="word-choice-menu"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left
                }}
              >
                {wordChoices.map((choice, index) => (
                  <div 
                    key={index}
                    className={`word-choice-item ${index === selectedChoice ? 'selected' : ''}`}
                  >
                    <span className="word-choice-number">{index + 1}.</span>
                    <span className="word-choice-text">{choice}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* 垂直捲軸 */}
          <div className="word2003-scrollbar">
            <div className="word2003-scrollbar-track">
              <div className="word2003-scrollbar-arrow-up">▲</div>
              <div className="word2003-scrollbar-thumb"></div>
              <div className="word2003-scrollbar-arrow-down">▼</div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="word2003-statusbar">
          <div className="word2003-status-seg">頁 1</div>
          <div className="word2003-status-seg">節 1</div>
          <div className="word2003-status-seg">於</div>
          <div className="word2003-status-seg">行 1</div>
          <div className="word2003-status-seg">欄 1</div>
          <div className="word2003-status-seg">REC</div>
          <div className="word2003-status-seg">TRK</div>
          <div className="word2003-status-seg">EXT</div>
          <div className="word2003-status-seg">OVR</div>
          <div className="word2003-status-seg">100%</div>
        </div>
      </div>
    </div>
  );
}