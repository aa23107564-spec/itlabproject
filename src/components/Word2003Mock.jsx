import React from "react";
import "../styles/word2003.css";

/**
 * Word2003Mock
 * 固定 1024x768（4:3）的純視覺頁面，無互動、無 hover、無對話框。
 * 僅模擬 Word 2003 / Windows XP 風格介面。
 */
export default function Word2003Mock() {
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

        {/* Menu Bar (no hover) */}
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
            <div className="word2003-toolbtn" title="編號">1.</div>
          </div>
        </div>

        {/* Workspace */}
        <div className="word2003-workspace">
          <div className="word2003-workspace-spacer"></div>
          <div className="word2003-paper">
            {/* 邊界直角記號 */}
            <div className="corner-mark top-left"></div>
            <div className="corner-mark top-right"></div>
            
            <div className="hint-line">
              <span className="paragraph-mark">↵</span>
            </div>
            <div className="hint-line">
              <span className="paragraph-mark">↵</span>
            </div>
            <div style={{ fontSize: 14, color: "#666", position: "relative" }}>
              （此區為靜態白紙頁示意，無法編輯，僅展示版面。）<span className="paragraph-mark">↵</span>
            </div>
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
