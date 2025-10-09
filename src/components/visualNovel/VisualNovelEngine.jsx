import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatboxMe from './ChatboxMe';
import ChatboxEditor from './ChatboxEditor';
import SelectOption from './SelectOption';
import '../../styles/visualNovel.css';

/**
 * 視覺小說引擎核心組件
 * 功能：
 * - 對話流程管理
 * - 打字機效果
 * - 鍵盤控制（左右方向鍵）
 * - 歷史記錄與回退
 */
const VisualNovelEngine = ({ script, onComplete }) => {
  // 狀態管理
  const [currentBranch, setCurrentBranch] = useState('opening');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedChoice, setSelectedChoice] = useState(0); // 0 for choice A, 1 for choice B
  const [isChoicePressed, setIsChoicePressed] = useState(false);

  // Refs
  const typewriterTimer = useRef(null);
  const currentDialogues = script[currentBranch] || [];
  const currentNode = currentDialogues[currentIndex];

  /**
   * 打字機效果（在逗號處停頓0.4秒，支持 HTML 標籤）
   */
  const startTypewriter = useCallback((text) => {
    setDisplayedText('');
    setIsTyping(true);
    
    // 提取純文本內容（去除 HTML 標籤）
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // 建立字符到完整 HTML 的映射
    const getHTMLUpToChar = (targetLength) => {
      let result = '';
      let textLength = 0;
      let inTag = false;
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char === '<') {
          inTag = true;
          result += char;
        } else if (char === '>') {
          inTag = false;
          result += char;
        } else if (inTag) {
          result += char;
        } else {
          if (textLength < targetLength) {
            result += char;
            textLength++;
          } else {
            break;
          }
        }
      }
      
      // 確保所有開啟的標籤都被關閉
      const openTags = [];
      const tagRegex = /<(\/?)([\w]+)[^>]*>/g;
      let match;
      const tempResult = result;
      
      while ((match = tagRegex.exec(tempResult)) !== null) {
        if (match[1] === '') {
          // 開始標籤
          openTags.push(match[2]);
        } else {
          // 結束標籤
          openTags.pop();
        }
      }
      
      // 為未關閉的標籤添加關閉標籤
      for (let i = openTags.length - 1; i >= 0; i--) {
        result += `</${openTags[i]}>`;
      }
      
      return result;
    };
    
    let charIndex = 0;

    const type = () => {
      if (charIndex < plainText.length) {
        const displayHTML = getHTMLUpToChar(charIndex + 1);
        setDisplayedText(displayHTML);
        const currentChar = plainText[charIndex];
        charIndex++;
        
        // 在所有標點符號處停頓0.4秒，其他字符50ms
        const punctuationMarks = ['，', '。', '！', '？', '；', '：', '、', '…', '─', '—', '～', '‧'];
        const delay = punctuationMarks.includes(currentChar) ? 400 : 50;
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
    }
  }, [currentNode]);

  /**
   * 前進到下一個對話
   */
  const goNext = useCallback(() => {
    // 如果正在打字，跳過動畫
    if (isTyping) {
      skipTypewriter();
      return;
    }

    // 檢查是否有下一個節點
    if (!currentNode) return;

    // 立即清理顯示文字，避免閃現
    setDisplayedText('');
    setIsTyping(false);

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
          if (onComplete) onComplete();
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
  }, [currentNode, currentIndex, currentBranch, currentDialogues, isTyping, skipTypewriter, script, onComplete]);

  /**
   * 回退到上一個對話
   */
  const goBack = useCallback(() => {
    if (history.length === 0) return;

    // 立即清理顯示文字，避免閃現
    setDisplayedText('');
    setIsTyping(false);

    const lastState = history[history.length - 1];
    setCurrentBranch(lastState.branch);
    setCurrentIndex(lastState.index);
    setHistory(prev => prev.slice(0, -1));
  }, [history]);

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

    // 儲存當前狀態到歷史
    setHistory(prev => [...prev, { branch: currentBranch, index: currentIndex }]);

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
   * 當節點變化時，啟動打字機效果
   */
  useEffect(() => {
    if (currentNode && currentNode.type === 'dialogue' && currentNode.text) {
      startTypewriter(currentNode.text);
    }

    return () => {
      if (typewriterTimer.current) {
        clearTimeout(typewriterTimer.current);
      }
    };
  }, [currentNode, startTypewriter]);

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
            <ChatboxMe text={displayedText} isTyping={isTyping} className={currentNode.className} />
          )}
          {currentNode.speaker === 'editor' && (
            <ChatboxEditor text={displayedText} name="編輯" isTyping={isTyping} className={currentNode.className} />
          )}
        </>
      )}

      {/* 選項模式 */}
      {currentNode.type === 'choice' && (
        <div className="visual-novel-choices">
          {currentNode.choices.map((choice, index) => (
            <SelectOption
              key={index}
              text={choice.text}
              onClick={() => selectChoice(index)}
              isPressed={isChoicePressed && selectedChoice === index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VisualNovelEngine;


