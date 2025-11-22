#!/usr/bin/env node

/**
 * 章節二測試運行腳本
 * 運行所有章節二相關的測試
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 開始運行章節二測試套件...\n');

const testFiles = [
  'src/components/__tests__/Chapter2.test.js',
  'src/components/visualNovel/__tests__/VisualNovelEngine.test.js',
  'src/components/visualNovel/__tests__/DrinkCoffeeAnimation.test.js',
  'src/components/visualNovel/__tests__/SlowTypingEffect.test.js',
  'src/components/__tests__/Chapter2Integration.test.js'
];

const testPattern = testFiles.join(' ');

try {
  console.log('📋 測試文件列表:');
  testFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  console.log('');

  // 運行測試
  const command = `npm test -- --testPathPattern="(${testFiles.map(f => f.replace('src/', '').replace(/\.test\.js$/, '')).join('|')})" --verbose --coverage`;
  
  console.log('🚀 執行測試命令:');
  console.log(`   ${command}\n`);
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });

  console.log('\n✅ 章節二測試套件運行完成！');
  
} catch (error) {
  console.error('\n❌ 測試運行失敗:');
  console.error(error.message);
  process.exit(1);
}

console.log('\n📊 測試覆蓋範圍:');
console.log('   - Chapter2 主組件功能');
console.log('   - VisualNovelEngine 核心功能');
console.log('   - DrinkCoffeeAnimation 動畫效果');
console.log('   - SlowTypingEffect 慢速打字');
console.log('   - Chapter2 集成測試');
console.log('\n🎯 測試重點:');
console.log('   - 開場動畫序列 (8秒)');
console.log('   - 背景圖片轉場效果');
console.log('   - 視覺小說引擎交互');
console.log('   - 喝咖啡動畫 (5秒)');
console.log('   - 慢速打字效果 (<slow>標籤)');
console.log('   - 結局分支處理');
console.log('   - 狀態管理和清理');
























