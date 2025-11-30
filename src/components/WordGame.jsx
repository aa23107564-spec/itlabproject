import React, { useState, useEffect, useRef, useCallback } from 'react';
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
      { id: 1, word: "耳朵", startIndex: 69, endIndex: 71, options: ["耳朵", "聽覺"] },
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

export default function WordGame({ startDelay = 2000, onGameComplete }) {
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  
  // 音效引用
  const typingSoundRef = useRef(null);
  
  // 初始化音效
  useEffect(() => {
    // 檢查是否在測試環境中
    if (typeof window !== 'undefined' && window.Audio) {
      typingSoundRef.current = new Audio(`${process.env.PUBLIC_URL || ''}/audio/sfx/打字持續聲.mp3`);
      typingSoundRef.current.loop = true; // 循環播放
      typingSoundRef.current.volume = 0.6; // 設置音量（從 0.3 調高到 0.6）
    }
    
    return () => {
      if (typingSoundRef.current) {
        try {
          typingSoundRef.current.pause();
        } catch (e) {
          // 忽略測試環境中的錯誤
        }
        typingSoundRef.current = null;
      }
    };
  }, []);
  
  const [selectedWordId, setSelectedWordId] = useState(null);
  const [showChoiceMenu, setShowChoiceMenu] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(0);
  const [wordChoices, setWordChoices] = useState([]);
  const [gameState, setGameState] = useState('typing'); // typing, selecting, choosing, completing
  const [replacedWords, setReplacedWords] = useState({}); // 儲存已替換的詞彙
  const [showCompleteHint, setShowCompleteHint] = useState(false); // 顯示完成提示
  const [completedParagraphs, setCompletedParagraphs] = useState([]); // 儲存已完成的段落
  const [isGameCompleted, setIsGameCompleted] = useState(false); // 遊戲是否已完成
  const [shouldHideCurrentParagraph, setShouldHideCurrentParagraph] = useState(false); // 是否隱藏當前段落
  
  const textContainerRef = useRef(null);
  const cursorRef = useRef(null);
  const choiceMenuRef = useRef(null);
  
  // 使用 ref 來獲取最新的狀態值
  const stateRef = useRef({
    gameState,
    selectedWordId,
    currentParagraph,
    selectedChoice,
    wordChoices
  });
  
  // 更新 ref 中的狀態
  useEffect(() => {
    stateRef.current = {
      gameState,
      selectedWordId,
      currentParagraph,
      selectedChoice,
      wordChoices
    };
  }, [gameState, selectedWordId, currentParagraph, selectedChoice, wordChoices]);

  // 逐字顯示動畫
  useEffect(() => {
    if (isTyping && currentPosition < gameData[currentParagraph].text.length) {
      // 開始播放打字音效
      if (typingSoundRef.current && typingSoundRef.current.paused) {
        try {
          const playPromise = typingSoundRef.current.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(e => {
              console.log('音效播放失敗:', e);
            });
          }
        } catch (e) {
          console.log('音效播放失敗:', e);
        }
      }
      
      const delay = 100; // 固定速度 100ms
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + gameData[currentParagraph].text[currentPosition]);
        setCurrentPosition(prev => prev + 1);
      }, delay);
      
      return () => clearTimeout(timer);
    } else if (isTyping && currentPosition >= gameData[currentParagraph].text.length) {
      setIsTyping(false);
      setGameState('selecting');
      setSelectedWordId(null); // 游標停在段尾
    }
  }, [isTyping, currentPosition, currentParagraph]);

  // 處理打字狀態變化，控制音效播放
  useEffect(() => {
    if (!isTyping && typingSoundRef.current && !typingSoundRef.current.paused) {
      try {
        typingSoundRef.current.pause();
      } catch (e) {
        // 忽略測試環境中的錯誤
      }
    }
  }, [isTyping]);

  // 渲染已完成的段落（純文字）
  const renderCompletedParagraph = (paragraphData) => {
    const elements = [];
    let lastIndex = 0;
    const text = paragraphData.displayText;

    // 處理已完成的段落，將互動詞彙替換為最終選擇
    paragraphData.interactiveWords.forEach(word => {
      // 添加前面的文字
      if (word.startIndex > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, word.startIndex)}
          </span>
        );
      }
      
      // 添加已替換的詞彙（純文字，不可互動）
      const displayWordText = paragraphData.replacedWords[word.id] || word.word;
      elements.push(
        <span key={`word-${word.id}`} className="completed-word">
          {displayWordText}
        </span>
      );
      
      lastIndex = word.endIndex;
    });

    // 添加剩餘的文字
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      );
    }

    // 為已完成的段落添加回車符號
    elements.push(
      <span key="paragraph-mark" className="paragraph-mark">↵</span>
    );

    return elements;
  };

  // 當段落完成時顯示提示
  useEffect(() => {
    if (!isTyping && gameState === 'selecting' && selectedWordId === null) {
      setShowCompleteHint(true);
    }
  }, [isTyping, gameState, selectedWordId]);

  // 開始新段落
  const startNewParagraph = useCallback(() => {
    if (currentParagraph < gameData.length - 1) {
      
      // 保存當前段落到已完成列表
      const currentParagraphData = {
        ...gameData[currentParagraph],
        replacedWords: { ...replacedWords },
        displayText: gameData[currentParagraph].text
      };
      setCompletedParagraphs(prev => [...prev, currentParagraphData]);
      
      setCurrentParagraph(prev => prev + 1);
      setDisplayedText('');
      setCurrentPosition(0);
      setIsTyping(true);
      setGameState('typing');
      setSelectedWordId(null);
      setShowChoiceMenu(false);
      setReplacedWords({}); // 重置替換的詞彙
      setShowCompleteHint(false); // 重置完成提示
    } else {
      // 遊戲完成：保存最後一個段落並觸發完成回調（只觸發一次）
      if (!isGameCompleted) {
        setIsGameCompleted(true);
        setShouldHideCurrentParagraph(true); // 隱藏當前段落，避免重複顯示
        
        const currentParagraphData = {
          ...gameData[currentParagraph],
          replacedWords: { ...replacedWords },
          displayText: gameData[currentParagraph].text
        };
        setCompletedParagraphs(prev => [...prev, currentParagraphData]);
        
        // 觸發遊戲完成回調
        if (onGameComplete) {
          onGameComplete();
        }
      }
    }
  }, [currentParagraph, replacedWords, onGameComplete]);

  // 鍵盤控制
  useEffect(() => {
    const handleKeyPress = (e) => {
      const currentState = stateRef.current;
      
      // 檢查是否為左鍵或右鍵，如果是則短暫延遲以檢測組合按鍵
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setTimeout(() => {
          // 檢查遊戲互動是否被阻擋（組合按鍵檢測）
          const gameInteractionBlocked = window.gameInteractionBlocked || false;
          const combinationDetected = window.combinationDetected || false;
          
          if (gameInteractionBlocked || combinationDetected) {
            return; // 不執行遊戲操作
          }
          
          // 執行正常的遊戲操作
          executeGameOperation(e, currentState);
        }, 50); // 50ms 延遲
        return;
      }
      
      // 其他按鍵（如下鍵）正常處理
      executeGameOperation(e, currentState);
    };
    
    const executeGameOperation = (e, currentState) => {
      // 如果遊戲已完成，不處理任何按鍵
      if (isGameCompleted) {
        return;
      }
      
      // 在段尾按下下鍵，進入下一段
      if (e.key === 'ArrowDown' && currentState.gameState === 'selecting' && currentState.selectedWordId === null) {
        startNewParagraph();
        return;
      }
      
      // 檢查所有條件
      if (currentState.gameState === 'typing' && e.key === 'ArrowDown') {
        // 跳過逐字動畫，直接顯示完整段落
        setDisplayedText(gameData[currentParagraph].text);
        setCurrentPosition(gameData[currentParagraph].text.length);
        setIsTyping(false);
        setGameState('selecting');
      } else if (currentState.gameState === 'selecting') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          // 在可互動詞彙和段落結尾之間切換
          const interactiveWords = gameData[currentState.currentParagraph].interactiveWords;
          const currentIndex = currentState.selectedWordId !== null ? 
            interactiveWords.findIndex(w => w.id === currentState.selectedWordId) : -1;
          
          
          let newSelectedWordId;
          if (e.key === 'ArrowLeft') {
            // 左鍵：從段尾移動到最後一個詞彙，或從詞彙間移動
            if (currentIndex === -1) {
              // 在段尾，移動到最後一個詞彙
              newSelectedWordId = interactiveWords[interactiveWords.length - 1].id;
            } else if (currentIndex === 0) {
              // 在第一個詞彙，不移動
              newSelectedWordId = currentState.selectedWordId;
            } else {
              // 在其他詞彙，移動到前一個詞彙
              newSelectedWordId = interactiveWords[currentIndex - 1].id;
            }
          } else if (e.key === 'ArrowRight') {
            // 右鍵：從詞彙移動到下一個詞彙，或移動到段尾
            if (currentIndex === -1) {
              // 在段尾，不移動
              newSelectedWordId = null;
            } else if (currentIndex === interactiveWords.length - 1) {
              // 在最後一個詞彙，移動到段尾
              newSelectedWordId = null;
            } else {
              // 在其他詞彙，移動到下一個詞彙
              newSelectedWordId = interactiveWords[currentIndex + 1].id;
            }
          }
          
          setSelectedWordId(newSelectedWordId);
        } else if (e.key === 'ArrowDown' && currentState.selectedWordId !== null) {
          // 開啟選詞選單
          const word = gameData[currentState.currentParagraph].interactiveWords.find(w => w.id === currentState.selectedWordId);
          const currentWord = replacedWords[currentState.selectedWordId] || word.word;
          
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
      } else if (currentState.gameState === 'choosing') {
        if (e.key === 'ArrowLeft') {
          // 左鍵：如果已經在第一個選項，就不再移動
          setSelectedChoice(prev => prev > 0 ? prev - 1 : prev);
        } else if (e.key === 'ArrowRight') {
          // 右鍵：如果已經在最後一個選項，就不再移動
          setSelectedChoice(prev => prev < currentState.wordChoices.length - 1 ? prev + 1 : prev);
        } else if (e.key === 'ArrowDown') {
          // 確認選擇
          const selectedWord = gameData[currentState.currentParagraph].interactiveWords.find(w => w.id === currentState.selectedWordId);
          const newWord = currentState.wordChoices[currentState.selectedChoice];
          
          // 更新替換的詞彙
          setReplacedWords(prev => ({
            ...prev,
            [currentState.selectedWordId]: newWord
          }));
          
          setShowChoiceMenu(false);
          setGameState('selecting');
        }
      } else if (currentState.gameState === 'selecting' && e.key === 'ArrowDown' && currentState.selectedWordId === null) {
        // 在段尾按下下鍵，進入下一段或完成遊戲
        if (!isGameCompleted) {
          startNewParagraph();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [startNewParagraph, isGameCompleted]);

  // 開始第一段
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
    }, startDelay); // 使用傳入的延遲時間
    
    return () => clearTimeout(timer);
  }, [startDelay]);

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

    // 如果段落顯示完畢，添加回車符號
    if (!isTyping && text.length === paragraph.text.length) {
      elements.push(
        <span key="paragraph-mark" className="paragraph-mark">
          {!isTyping && gameState === 'selecting' && !selectedWordId && (
            <span className="cursor-blink" style={{ position: 'absolute', marginLeft: '-6px' }}>|</span>
          )}
          ↵
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
       const menuHeight = 30; // 縮小後的選單高度
      
      // 先設置基本位置，然後檢查邊界
      // 如果右側超出，調整到左側
      if (left > containerRect.width - 150) { // 預留150px空間
        left = containerRect.width - 150;
      }
      
      // 確保不會超出左邊界
      if (left < 10) {
        left = 10; // 留10px左邊距
      }
      
      // 額外往左移，確保不會超出白紙
      if (left > containerRect.width - 200) {
        left = Math.max(10, containerRect.width - 200);
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
            
            {/* 文字容器 */}
            <div 
              ref={textContainerRef}
              className="word-game-text-container"
            >
              {/* 文字邊界直角標示 */}
              <div className="text-boundary-mark top-left"></div>
              <div className="text-boundary-mark top-right"></div>
              
              {/* 已完成的段落 */}
              {completedParagraphs.map((paragraphData, index) => (
                <div key={`completed-${index}`} className="completed-paragraph">
                  {renderCompletedParagraph(paragraphData)}
                </div>
              ))}
              
              {/* 當前段落 */}
              {!shouldHideCurrentParagraph && (
                <div className="current-paragraph">
                  {renderText()}
                  {isTyping && (
                    <span className="cursor-static" style={{ position: 'absolute', marginLeft: '-6px' }}>|</span>
                  )}
                  
                  {/* 完成提示 */}
                  {showCompleteHint && (
                    <div className="complete-hint">
                      左右移動以選擇字詞，按下確認可開啟選單，在段尾按下確認以繼續
                    </div>
                  )}
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