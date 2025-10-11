import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ChatboxMe from './ChatboxMe';
import ChatboxEditor from './ChatboxEditor';
import SelectOption from './SelectOption';
import DrinkCoffeeAnimation from './DrinkCoffeeAnimation';
import '../../styles/visualNovel.css';

/**
 * 視覺小說引擎核心組件
 * 功能：
 * - 對話流程管理
 * - 打字機效果
 * - 鍵盤控制（左右方向鍵）
 * - 歷史記錄與回退
 */
const VisualNovelEngine = ({ script, onComplete, isEndingBA = false, hideParticles = false }) => {
  // 狀態管理
  const [currentBranch, setCurrentBranch] = useState('opening');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(0); // 0 for choice A, 1 for choice B
  const [isChoicePressed, setIsChoicePressed] = useState(false);
  const [lastDialogue, setLastDialogue] = useState(null); // 保存上一個對話節點，用於選項顯示時同時展示
  const [showFadeOut, setShowFadeOut] = useState(false); // 控制淡出效果顯示
  const [isBlackScreen, setIsBlackScreen] = useState(false); // 控制黑屏狀態持續性
  const [showParticles, setShowParticles] = useState(false); // 控制白色顆粒動畫
  const [blackScreenActivated, setBlackScreenActivated] = useState(false); // 标记黑屏是否已激活，一旦激活就不会被重置
  const [fadeOutInProgress, setFadeOutInProgress] = useState(false); // 标记淡出动画是否正在进行中
  const [particlesFadeInProgress, setParticlesFadeInProgress] = useState(false); // 标记颗粒淡入动画是否正在进行中
  const [isPaused, setIsPaused] = useState(false); // 控制暂停功能
  const [showDrinkCoffeeAnimation, setShowDrinkCoffeeAnimation] = useState(false); // 控制喝咖啡動畫顯示
  const [drinkCoffeeAnimationInProgress, setDrinkCoffeeAnimationInProgress] = useState(false); // 標記喝咖啡動畫進行中

  // Refs
  const typewriterTimer = useRef(null);
  const currentDialogues = script[currentBranch] || [];
  const currentNode = currentDialogues[currentIndex];

  /**
   * 生成白色顆粒 - 使用 useMemo 確保只生成一次，避免重新渲染導致動畫重啟
   */
  const particles = useMemo(() => {
    const particleArray = [];
    const particleCount = 300; // 增加顆粒數量到300個
    
    for (let i = 0; i < particleCount; i++) {
      particleArray.push({
        id: i,
        left: Math.random() * 100, // 0-100% 的水平位置
        top: Math.random() * 100, // 0-100% 的垂直位置
        animationDelay: Math.random() * 2, // 減少延遲範圍到0-2秒
        animationDuration: 5 + Math.random() * 2, // 5-7秒的動畫時長，更平穩
      });
    }
    return particleArray;
  }, []); // 空依賴數組，確保只生成一次

  /**
   * 打字機效果（在逗號處停頓0.4秒，支持 HTML 標籤）- 優化版本
   */
  const startTypewriter = useCallback((text) => {
    setDisplayedText('');
    setIsTyping(true);
    
    // 提取純文本內容（去除 HTML 標籤）
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // 預處理：建立字符索引到 HTML 片段的映射表（只處理一次，避免重複計算）
    const charToHTMLMap = [];
    const charIsSlowMap = []; // 記錄哪些字符需要慢速顯示
    let currentHTML = '';
    let textLength = 0;
    let inTag = false;
    const openTags = [];
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (char === '<') {
        inTag = true;
        currentHTML += char;
        // 檢測標籤類型
        const tagMatch = text.substring(i).match(/^<(\/?)([\w]+)[^>]*>/);
        if (tagMatch) {
          if (tagMatch[1] === '') {
            // 開始標籤
            openTags.push(tagMatch[2]);
          } else {
            // 結束標籤
            openTags.pop();
          }
        }
      } else if (char === '>') {
        inTag = false;
        currentHTML += char;
      } else if (inTag) {
        currentHTML += char;
      } else {
        // 可見字符
        currentHTML += char;
        
        // 為當前字符添加關閉標籤
        let closedHTML = currentHTML;
        for (let j = openTags.length - 1; j >= 0; j--) {
          closedHTML += `</${openTags[j]}>`;
        }
        
        charToHTMLMap[textLength] = closedHTML;
        
        // 檢查是否在 slow 標籤內（通過檢查 openTags 數組）
        const isInSlowTag = openTags.includes('slow');
        charIsSlowMap[textLength] = isInSlowTag;
        textLength++;
      }
    }
    
    let charIndex = 0;

    const type = () => {
      if (charIndex < plainText.length) {
        // 直接從映射表獲取 HTML，避免重複計算
        setDisplayedText(charToHTMLMap[charIndex]);
        const currentChar = plainText[charIndex];
        const isSlow = charIsSlowMap[charIndex]; // 檢查是否需要慢速顯示
        charIndex++;
        
        // 在所有標點符號處停頓0.4秒，slow標籤內字符150ms，其他字符40ms
        const punctuationMarks = ['，', '。', '！', '？', '；', '：', '、', '…', '─', '—', '～', '‧'];
        let delay;
        if (punctuationMarks.includes(currentChar)) {
          delay = 400; // 標點符號停頓
        } else if (isSlow) {
          delay = 150; // slow 標籤內的字符慢速顯示
        } else {
          delay = 40; // 普通速度
        }
        typewriterTimer.current = setTimeout(type, delay);
      } else {
        setDisplayedText(text); // 確保最終顯示完整的原始 HTML
        setIsTyping(false);
      }
    };

    type();
  }, []);

  /**
   * 停止打字機效果並顯示完整文字
   */
  const skipTypewriter = useCallback(() => {
    if (typewriterTimer.current) {
      clearTimeout(typewriterTimer.current);
      typewriterTimer.current = null;
    }
    if (currentNode && currentNode.text) {
      setDisplayedText(currentNode.text);
      setIsTyping(false);
      
      // 檢查是否需要立即觸發特殊效果（跳過打字機動畫時）
      if (currentNode.id === 'ending-b-a-1') {
        console.log('跳过打字机动画，开始淡出效果:', currentNode.id);
        setBlackScreenActivated(true); // 标记黑屏已激活
        
        // 重置淡出状态，确保每次都能触发
        setShowFadeOut(false);
        setIsBlackScreen(false);
        
        // 延遲 0.2 秒後開始淡出效果（提前播放）
        const fadeOutTimer = setTimeout(() => {
          console.log('跳过动画 - 开始淡出动画，设置 showFadeOut = true');
          setFadeOutInProgress(true); // 标记淡出动画开始
          setShowFadeOut(true);
          // 淡出動畫完成後（2秒）設置黑屏狀態
          setTimeout(() => {
            console.log('跳过动画 - 设置黑屏状态，设置 isBlackScreen = true');
            setIsBlackScreen(true);
            setShowFadeOut(false); // 淡出动画完成后隐藏淡出层
            setFadeOutInProgress(false); // 标记淡出动画结束，允许前进
          }, 2000); // 從 3000ms 改為 2000ms
        }, 200); // 從 500ms 改為 200ms
        
        // 清理定时器
        return () => {
          clearTimeout(fadeOutTimer);
        };
      } else if (currentNode.id === 'ending-b-a-3') {
        console.log('跳过打字机动画，延迟触发颗粒动画:', currentNode.id);
        
        // 标记颗粒淡入动画开始
        setParticlesFadeInProgress(true);
        
        // 延遲 0.2 秒後開始顆粒動畫（與正常流程保持一致）
        setTimeout(() => {
          console.log('跳过动画 - 开始颗粒动画');
          setShowParticles(true);
          
          // 淡入动画持续 2 秒，之后标记完成
          setTimeout(() => {
            console.log('跳过动画 - 颗粒淡入动画完成');
            setParticlesFadeInProgress(false); // 标记淡入动画结束，允许前进
          }, 2000); // 2秒淡入时间
        }, 200);
      }
      
      // 跳過打字機動畫後，自動執行跳轉邏輯
      // 如果是淡出效果節點，延遲更長時間確保淡出動畫完成
      const jumpDelay = currentNode.id === 'ending-b-a-1' ? 2400 : 100; // 從 4000ms 改為 2400ms (200ms延遲 + 2000ms動畫 + 200ms緩衝)
      setTimeout(() => {
        // 儲存當前狀態到歷史
        setHistory(prev => [...prev, { branch: currentBranch, index: currentIndex }]);
        
        // 執行跳轉邏輯
        if (currentNode.next) {
          const nextId = currentNode.next;
          
          // 檢查是否是跳轉到其他分支
          if (nextId.startsWith('branch-') || nextId.startsWith('ending-') || nextId === 'end') {
            // 查找包含該節點的分支
            for (const branchName in script) {
              const branch = script[branchName];
              const nodeIndex = branch.findIndex(node => node.id === nextId);
              if (nodeIndex !== -1) {
                setCurrentBranch(branchName);
                setCurrentIndex(nodeIndex);
                return;
              }
            }
            
            // 如果是 'end'，觸發完成回調
            if (nextId === 'end') {
              console.log('觸發完成回調，當前分支:', currentBranch);
              // 傳遞當前分支信息給 Chapter2
              if (onComplete) onComplete(currentBranch);
              return;
            }
          }
          
          // 同一分支內的下一個節點
          const nextIndex = currentDialogues.findIndex(node => node.id === nextId);
          if (nextIndex !== -1) {
            setCurrentIndex(nextIndex);
          } else {
            // 否則就是下一個索引
            if (currentIndex + 1 < currentDialogues.length) {
              setCurrentIndex(currentIndex + 1);
            }
          }
        } else if (currentIndex + 1 < currentDialogues.length) {
          // 沒有 next 屬性，直接前進
          setCurrentIndex(currentIndex + 1);
        }
      }, jumpDelay); // 根據節點類型調整延遲時間
    }
  }, [currentNode, currentIndex, currentBranch, currentDialogues, script, onComplete]);

  /**
   * 前進到下一個對話
   */
  const goNext = useCallback(() => {
    // 如果处于暂停状态，阻止前进
    if (isPaused) {
      console.log('对话暂停中，阻止前进');
      return;
    }

    // 如果淡出动画正在进行中，阻止前进
    if (fadeOutInProgress) {
      console.log('淡出动画进行中，阻止前进');
      return;
    }

    // 如果颗粒淡入动画正在进行中，阻止前进
    if (particlesFadeInProgress) {
      console.log('颗粒淡入动画进行中，阻止前进');
      return;
    }

    // 如果喝咖啡动画正在进行中，阻止前进
    if (drinkCoffeeAnimationInProgress) {
      console.log('喝咖啡动画进行中，阻止前进');
      return;
    }

    // 如果正在打字，跳過動畫
    if (isTyping) {
      skipTypewriter();
      return;
    }

    // 檢查是否有下一個節點
    if (!currentNode) return;

    // 如果下一個節點是 'end' 且是 ending-b-a 分支，不清除文字
    const isEndingBAEnd = currentBranch === 'ending-b-a' && currentNode.next === 'end';
    
    if (!isEndingBAEnd) {
      // 立即清理顯示文字，避免閃現
      setDisplayedText('');
      setIsTyping(false);
    }

    // 儲存當前狀態到歷史
    setHistory(prev => [...prev, { branch: currentBranch, index: currentIndex }]);

    // 如果有 next 屬性，處理跳轉
    if (currentNode.next) {
      const nextId = currentNode.next;
      
      // 檢查是否是跳轉到其他分支
      if (nextId.startsWith('branch-') || nextId.startsWith('ending-') || nextId === 'end') {
        // 查找包含該節點的分支
        for (const branchName in script) {
          const branch = script[branchName];
          const nodeIndex = branch.findIndex(node => node.id === nextId);
          if (nodeIndex !== -1) {
            setCurrentBranch(branchName);
            setCurrentIndex(nodeIndex);
            return;
          }
        }
        
        // 如果是 'end'，觸發完成回調
        if (nextId === 'end') {
          console.log('skipTypewriter: 觸發完成回調，當前分支:', currentBranch);
          if (onComplete) onComplete(currentBranch);
          return;
        }
      }
      
      // 同一分支內的下一個節點
      const nextIndex = currentDialogues.findIndex(node => node.id === nextId);
      if (nextIndex !== -1) {
        setCurrentIndex(nextIndex);
      } else {
        // 否則就是下一個索引
        if (currentIndex + 1 < currentDialogues.length) {
          setCurrentIndex(currentIndex + 1);
        }
      }
    } else if (currentIndex + 1 < currentDialogues.length) {
      // 沒有 next 屬性，直接前進
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentNode, currentIndex, currentBranch, currentDialogues, isTyping, skipTypewriter, script, onComplete, fadeOutInProgress, particlesFadeInProgress, drinkCoffeeAnimationInProgress, isPaused]);

  /**
   * 回退到上一個對話
   */
  const goBack = useCallback(() => {
    // 如果在 ending-b-a 分支中，禁止回退
    if (currentBranch === 'ending-b-a') {
      console.log('ending-b-a 分支中，禁止回退');
      return;
    }

    if (history.length === 0) return;

    // 立即清理顯示文字，避免閃現
    setDisplayedText('');
    setIsTyping(false);
    
    // 重置淡出进行中状态
    setFadeOutInProgress(false);
    // 重置颗粒淡入进行中状态
    setParticlesFadeInProgress(false);
    // 重置喝咖啡动画状态
    setShowDrinkCoffeeAnimation(false);
    setDrinkCoffeeAnimationInProgress(false);

    const lastState = history[history.length - 1];
    
    // 只有在回退到非 ending-b-a 分支時才重置特殊效果狀態
    if (!lastState.branch.startsWith('ending-b-a')) {
      setShowFadeOut(false);
      setIsBlackScreen(false);
      setShowParticles(false);
      setBlackScreenActivated(false); // 重置黑屏激活状态
    }

    setCurrentBranch(lastState.branch);
    setCurrentIndex(lastState.index);
    setHistory(prev => prev.slice(0, -1));
  }, [currentBranch, history]);

  /**
   * 選擇選項
   */
  const selectChoice = useCallback((choiceIndex) => {
    if (!currentNode || currentNode.type !== 'choice') return;
    
    const choice = currentNode.choices[choiceIndex];
    if (!choice) return;

    // 立即清理顯示文字，避免閃現
    setDisplayedText('');
    setIsTyping(false);

    // 不需要額外儲存歷史記錄，因為 goNext 已經儲存了選項前的對話位置
    // 我們只需要確保歷史記錄中的位置是正確的
    // 如果歷史記錄中最後一個位置是當前選項，則更新為選項前的對話
    setHistory(prev => {
      if (prev.length > 0) {
        const lastHistory = prev[prev.length - 1];
        // 如果最後一個歷史記錄是當前選項位置，則更新為選項前的對話位置
        if (lastHistory.branch === currentBranch && lastHistory.index === currentIndex) {
          const newPrev = [...prev];
          newPrev[newPrev.length - 1] = {
            branch: currentBranch,
            index: Math.max(0, currentIndex - 1),
            isFromChoice: true
          };
          return newPrev;
        }
      }
      return prev;
    });

    // 跳轉到選擇的分支
    const nextBranch = choice.next;
    if (script[nextBranch]) {
      setCurrentBranch(nextBranch);
      setCurrentIndex(0);
    }
  }, [currentNode, currentBranch, currentIndex, script]);

  /**
   * 鍵盤事件處理
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 阻止默認行為
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      // 如果當前是選項模式
      if (currentNode && currentNode.type === 'choice') {
        if (e.key === 'ArrowLeft') {
          setSelectedChoice(0);
          setIsChoicePressed(true);
        } else if (e.key === 'ArrowRight') {
          setSelectedChoice(1);
          setIsChoicePressed(true);
        }
      } else {
        // 對話模式
        if (e.key === 'ArrowRight') {
          goNext();
        } else if (e.key === 'ArrowLeft') {
          goBack();
        }
      }
    };

    const handleKeyUp = (e) => {
      // 選項模式下，按鍵釋放時執行選擇
      if (currentNode && currentNode.type === 'choice' && isChoicePressed) {
        if (e.key === 'ArrowLeft' && selectedChoice === 0) {
          selectChoice(0);
        } else if (e.key === 'ArrowRight' && selectedChoice === 1) {
          selectChoice(1);
        }
        setIsChoicePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentNode, isTyping, goNext, goBack, selectChoice, selectedChoice, isChoicePressed]);

  /**
   * 當節點變化時，啟動打字機效果或保存對話節點或處理動畫
   */
  useEffect(() => {
    if (currentNode && currentNode.type === 'dialogue' && currentNode.text) {
      startTypewriter(currentNode.text);
      // 保存完整的對話節點（包含完整文字），用於選項顯示時展示
      setLastDialogue({
        ...currentNode,
        displayedText: currentNode.text // 保存完整文字
      });
    } else if (currentNode && currentNode.type === 'animation') {
      // 處理動畫節點
      if (currentNode.animationType === 'drinkCoffee') {
        // 清除對話框文字，觸發喝咖啡動畫
        setDisplayedText('');
        setIsTyping(false);
        setShowDrinkCoffeeAnimation(true);
        setDrinkCoffeeAnimationInProgress(true);

        // 動畫持續時間後自動前進到下一個對話
        const jumpTimer = setTimeout(() => {
          setDrinkCoffeeAnimationInProgress(false);
          // 前進到下一個節點（對話框顯示）
          if (currentNode.next) {
            const nextNode = currentDialogues.find(n => n.id === currentNode.next);
            if (nextNode) {
              const nextIndex = currentDialogues.indexOf(nextNode);
              if (nextIndex !== -1) {
                setCurrentIndex(nextIndex);
              }
            }
          }
        }, currentNode.duration || 2500);

        // 1秒後才隱藏動畫組件（讓22.jpg淡入動畫完成）
        const hideTimer = setTimeout(() => {
          setShowDrinkCoffeeAnimation(false);
        }, (currentNode.duration || 2500) + 1000);

        return () => {
          clearTimeout(jumpTimer);
          clearTimeout(hideTimer);
        };
      }
    }

    return () => {
      if (typewriterTimer.current) {
        clearTimeout(typewriterTimer.current);
      }
    };
  }, [currentNode, startTypewriter, currentDialogues]);

  /**
   * 處理 pauseNext 暫停功能
   */
  useEffect(() => {
    if (!currentNode) return;
    
    // 如果當前節點有 pauseNext 屬性
    if (currentNode.pauseNext && !isTyping) {
      console.log(`對話暫停 ${currentNode.pauseNext}ms`);
      setIsPaused(true);
      
      const pauseTimer = setTimeout(() => {
        console.log('暫停結束，允許前進');
        setIsPaused(false);
      }, currentNode.pauseNext);
      
      return () => {
        clearTimeout(pauseTimer);
      };
    } else {
      setIsPaused(false);
    }
  }, [currentNode, isTyping]);

  /**
   * 專門處理特殊效果的 useEffect
   */
  useEffect(() => {
    if (!currentNode) return;

    // 檢查是否是需要淡出效果的對話節點
    if (currentNode.id === 'ending-b-a-1') {
      console.log('触发淡出效果:', currentNode.id);
      setBlackScreenActivated(true); // 标记黑屏已激活
      
      // 重置淡出状态，确保每次都能触发
      setShowFadeOut(false);
      setIsBlackScreen(false);
      
      // 延遲 0.2 秒後開始淡出效果（提前播放）
      const fadeOutTimer = setTimeout(() => {
        console.log('开始淡出动画，设置 showFadeOut = true');
        setFadeOutInProgress(true); // 标记淡出动画开始
        setShowFadeOut(true);
        // 淡出動畫完成後（2秒）設置黑屏狀態
        const blackScreenTimer = setTimeout(() => {
          console.log('设置黑屏状态，设置 isBlackScreen = true');
          setIsBlackScreen(true);
          setShowFadeOut(false); // 淡出动画完成后隐藏淡出层
          setFadeOutInProgress(false); // 标记淡出动画结束，允许前进
        }, 2000); // 從 3000ms 改為 2000ms
        
        // 清理黑屏定时器
        return () => {
          clearTimeout(blackScreenTimer);
        };
      }, 200); // 從 500ms 改為 200ms
      
      return () => {
        clearTimeout(fadeOutTimer);
      };
    } 
    // 檢查是否是需要顆粒動畫的對話節點
    else if (currentNode.id === 'ending-b-a-3') {
      console.log('触发颗粒动画:', currentNode.id);
      
      // 标记颗粒淡入动画开始
      setParticlesFadeInProgress(true);
      
      // 延遲 0.2 秒後開始顆粒動畫（更早開始）
      const particlesTimer = setTimeout(() => {
        console.log('开始颗粒动画');
        setShowParticles(true);
        
        // 淡入动画持续 2 秒，之后标记完成
        const fadeInCompleteTimer = setTimeout(() => {
          console.log('颗粒淡入动画完成');
          setParticlesFadeInProgress(false); // 标记淡入动画结束，允许前进
        }, 2000); // 2秒淡入时间
        
        return () => {
          clearTimeout(fadeInCompleteTimer);
        };
      }, 200);
      
      return () => {
        clearTimeout(particlesTimer);
      };
    } 
    else {
      // 如果不是特殊節點，只重置淡出狀態，不干擾 ending-b-a-1 的淡出動畫
      if (currentNode.id !== 'ending-b-a-1') {
        setShowFadeOut(false);
      }
      // 只有在不是 ending-b-a 分支時才重置黑屏狀態
      if (!currentBranch.startsWith('ending-b-a')) {
        setIsBlackScreen(false);
        setShowParticles(false);
        setBlackScreenActivated(false);
      }
    }
    
    // 如果黑屏已激活且在 ending-b-a 分支內，確保黑屏狀態保持
    if (blackScreenActivated && currentBranch.startsWith('ending-b-a')) {
      // 只有在不是 ending-b-a-1 節點時才直接設置黑屏狀態
      if (currentNode.id !== 'ending-b-a-1') {
        setIsBlackScreen(true);
      }
    }
  }, [currentNode, currentBranch, blackScreenActivated]);

  // 渲染
  if (!currentNode) {
    return (
      <div className="visual-novel-content">
        <div style={{ textAlign: 'center', color: '#666', fontSize: '24px' }}>
          故事結束
        </div>
      </div>
    );
  }

  return (
    <div className="visual-novel-content">
      {/* 對話模式 */}
      {currentNode.type === 'dialogue' && (
        <>
          {currentNode.speaker === 'protagonist' && (
            <ChatboxMe text={displayedText} isTyping={isTyping} className={`${currentNode.className || ''} ${isEndingBA ? 'ending-b-a-fade' : ''}`.trim()} />
          )}
          {currentNode.speaker === 'editor' && (
            <ChatboxEditor text={displayedText} name="編輯" isTyping={isTyping} className={`${currentNode.className || ''} ${isEndingBA ? 'ending-b-a-fade' : ''}`.trim()} />
          )}
        </>
      )}

      {/* 選項模式 - 同時顯示上一個對話框和選項 */}
      {currentNode.type === 'choice' && (
        <>
          {/* 顯示上一個對話框 */}
          {lastDialogue && (
            <>
              {lastDialogue.speaker === 'protagonist' && (
                <ChatboxMe text={lastDialogue.displayedText} isTyping={false} className={lastDialogue.className} />
              )}
              {lastDialogue.speaker === 'editor' && (
                <ChatboxEditor text={lastDialogue.displayedText} name="編輯" isTyping={false} className={lastDialogue.className} />
              )}
            </>
          )}
          
          {/* 顯示選項 - 居中顯示 */}
          <div className="visual-novel-choices visual-novel-choices-centered">
            {currentNode.choices.map((choice, index) => (
              <SelectOption
                key={index}
                text={choice.text}
                onClick={() => selectChoice(index)}
                isPressed={isChoicePressed && selectedChoice === index}
              />
            ))}
          </div>
        </>
      )}

      {/* 喝咖啡動畫 */}
      {showDrinkCoffeeAnimation && (
        <DrinkCoffeeAnimation />
      )}

      {/* 淡出覆蓋層 */}
      {(showFadeOut || isBlackScreen) && (
        <div className={`fade-out-overlay ${isBlackScreen ? 'black-screen' : ''}`}></div>
      )}

      {/* 白色顆粒動畫 */}
      {showParticles && !hideParticles && (
        <div className="particles-container">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.animationDelay}s`,
                animationDuration: `${particle.animationDuration}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VisualNovelEngine;


