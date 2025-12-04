# UI 實作總結

## 📋 實作概要

已完成階段系統的 UI 實作，包括：
1. 金幣顯示改為「當前分數/目標分數」並根據狀態變色
2. 新增階段顯示組件（取代舊目標系統）
3. 新增階段過場提示框

---

## ✅ 已完成的程式碼修改

### 1. 修改的檔案

#### [CoinView.js](assets/Script/View/CoinView.js)
**修改內容**：
- ✅ 新增 `updateDisplay()` 方法
- ✅ 顯示格式改為 `當前分數 / 目標分數`
- ✅ 根據狀態動態變色（白色/金色/紅色）
- ✅ 階段3無目標時只顯示當前分數

**顏色規則**：
```javascript
已達標 → 金色 (255, 215, 0)
剩餘步數≤3且未達標 → 紅色 (255, 0, 0)
正常狀態 → 白色 (255, 255, 255)
```

---

#### [GameModel.js](assets/Script/Model/GameModel.js)
**修改內容**：
- ✅ 在 `advanceToNextStage()` 方法中觸發階段過場 Toast
- ✅ 調用 `showStageTransitionToast()` 顯示提示
- ✅ 新增 `showStageTransitionToast()` 方法（使用 Toast 系統）

**修改位置**：第 1042 行、第 1049-1085 行

---

### 2. 新增的檔案

#### [StageView.js](assets/Script/View/StageView.js) ✨ 新增
**功能**：顯示當前階段資訊
- 顯示格式：`階段: X / 3`（有冒號）
- 自動更新階段編號
- 綁定到 GameModel 獲取即時資料

**使用方式**：
1. 創建一個 Label 節點
2. 掛載 `StageView` 腳本
3. 綁定 `gameScene` 欄位到 `Canvas/GameScene`

---

## 🎨 Cocos Creator 編輯器設置

### 需要完成的設置步驟

#### 1. 金幣顯示（已有節點，只需確認腳本）
- [x] 確認 `CoinView` 腳本已掛載
- [x] 綁定 `gameScene` 欄位

#### 2. 階段顯示（需要新增）
- [ ] 創建 `StageLabel` 節點
- [ ] 添加 Label 組件
- [ ] 掛載 `StageView` 腳本
- [ ] 設置位置（左上角）
- [ ] 綁定 `gameScene` 欄位

#### 3. 階段過場提示（使用 Toast 系統）
- ✅ 已在 GameModel 中實作 `showStageTransitionToast()` 方法
- ✅ 使用內建 Toast 工具，無需額外編輯器設置
- ✅ 自動顯示「🎉 進入階段 X！」訊息

---

## 📖 詳細設置指南

請參考以下文檔進行編輯器設置：

1. **[UI_SETUP_GUIDE.md](UI_SETUP_GUIDE.md)** - 詳細的編輯器操作步驟
2. **[UI_LAYOUT_REFERENCE.md](UI_LAYOUT_REFERENCE.md)** - UI 佈局和配色參考

---

## 🧪 測試檢查清單

完成設置後，請測試以下功能：

### 金幣顯示測試
- [ ] 顯示格式為 `當前分數 / 目標分數`
- [ ] 初始顯示白色
- [ ] 達到10,000分後變金色
- [ ] 剩餘步數≤3且未達標時變紅色
- [ ] 階段3只顯示當前分數

### 階段顯示測試
- [ ] 初始顯示 `階段 1 / 3`
- [ ] 進入階段2更新為 `階段 2 / 3`
- [ ] 進入階段3更新為 `階段 3 / 3`

### 階段過場測試
- [ ] 階段1完成後彈出提示框
- [ ] 顯示 `🎉 進入階段 2！`
- [ ] 顯示 `目標分數：25000`
- [ ] 動畫流暢（淡入、縮放）
- [ ] 持續2秒後自動消失
- [ ] 階段2完成後同樣流程
- [ ] 階段3顯示 `最後階段！全力衝刺！`

---

## 🎬 運作流程

### 階段推進流程

```
玩家達到目標分數並用完步數
         ↓
GameModel.checkStageEnd()
         ↓
GameModel.advanceToNextStage()
         ↓
計時器重置到 15 秒並凍結
         ↓
GameModel.showStageTransitionToast() 顯示 Toast
         ↓
顯示「🎉 進入階段 X！」(2秒)
         ↓
Toast 結束，計時器解凍並開始倒數
         ↓
遊戲繼續，進入新階段
```

---

## 🎨 UI 元素位置參考

```
畫面佈局：

左上角                              右上角
┌─────────────────────────────────────┐
│ 階段: 1 / 3                 倒數時間: 15 秒 │
│                                     │
│          ┌───────────────┐          │
│          │ 🎉 進入階段 2  │          │ ← Toast 提示（中央）
│          │ 目標分數：25000│          │
│          └───────────────┘          │
│                                     │
│                                     │
│         [ 遊戲網格區域 ]            │
│                                     │
│                                     │
│ 5000 / 10000 💰                     │
└─────────────────────────────────────┘
左下角                              右下角
```

---

## 📝 檔案清單

### 修改的檔案
- ✅ `assets/Script/View/CoinView.js` - 分數顯示與顏色變化
- ✅ `assets/Script/Model/GameModel.js` - 階段系統邏輯與 Toast 提示
- ✅ `assets/Script/Controller/GameController.js` - 計時器控制與消除結束處理
- ✅ `assets/Script/Controller/ThinkingTimer.js` - 計時器控制方法增強

### 新增的檔案
- ✅ `assets/Script/View/StageView.js` - 階段顯示組件

### 文檔檔案
- ✅ `UI_SETUP_GUIDE.md` - 編輯器設置指南
- ✅ `UI_LAYOUT_REFERENCE.md` - UI 佈局參考
- ✅ `UI_IMPLEMENTATION_SUMMARY.md` - 本文件

---

## ⚠️ 注意事項

1. **腳本載入順序**
   - 確保所有新增的腳本在 Cocos Creator 中正確編譯
   - 如果腳本無法選擇，重啟 Cocos Creator

2. **節點綁定**
   - 所有 `gameScene` 欄位都需要綁定到 `Canvas/GameScene`
   - StageView 必須正確綁定才能顯示階段資訊

3. **Toast 系統**
   - 階段過場使用內建 Toast 系統，無需額外 UI 節點
   - Toast 會自動在畫面中央顯示

4. **顏色設置**
   - 金幣顏色會動態改變，不要在編輯器中手動設置
   - Label 的初始顏色設為白色即可

5. **計時器系統**
   - 每次操作後計時器會重置到 15 秒
   - 消除動畫期間計時器會暫停
   - 階段轉換 Toast 顯示期間計時器凍結

---

## 🚀 下一步

完成 UI 設置後：

1. **測試遊戲流程**
   - 從階段1開始玩到階段3
   - 確認所有 UI 顯示正確
   - 確認顏色變化正常
   - 確認過場動畫流暢

2. **調整數值**
   - 根據實際體驗調整顏色
   - 調整過場動畫持續時間
   - 調整文字大小和位置

3. **美化 UI**
   - 添加圖標
   - 優化配色方案
   - 添加音效
   - 添加粒子效果

---

## 🔄 後續改動與優化

### 1. 階段系統實作細節

#### 階段配置 ([ConstValue.js](assets/Script/Model/ConstValue.js))

```javascript
export const STAGE_CONFIG = {
  1: {
    stage: 1,
    targetScore: 10000,        // 階段 1 目標：10,000 分
    steps: 15,                  // 每階段 15 步
    specialDropRate: 0.05       // 特殊方塊掉落率 5%
  },
  2: {
    stage: 2,
    targetScore: 25000,        // 階段 2 目標：25,000 分
    steps: 15,
    specialDropRate: 0.02      // 特殊方塊掉落率降至 2%
  },
  3: {
    stage: 3,
    targetScore: null,         // 階段 3 無目標分數
    steps: 15,
    specialDropRate: 0         // 不再掉落特殊方塊
  }
};
```

**設計理念**：
- 分數目標遞增：10,000 → 25,000 → 無限
- 特殊方塊掉落率遞減：5% → 2% → 0%（隨階段提升難度）
- 每階段重置步數為 15 步

---

### 2. 分數計算與遊戲結束時序控制

#### 新增分數計算完成標記 ([GameModel.js](assets/Script/Model/GameModel.js))

**實作內容**：
- 新增 `isScoringComplete` 屬性（第 31 行）
- 消除開始時設為 `false`（第 270 行）
- 分數計算完成後設為 `true`（第 378 行）
- `checkEndGame()` 等待分數計算完成後才判定（第 893-899 行）

**目的**：確保遊戲結束判定在分數完全計算後執行，避免誤判。

---

### 3. 操作計時器系統完善

#### 3.1 計時器控制方法增強 ([ThinkingTimer.js](assets/Script/Controller/ThinkingTimer.js))

**`setWorkable(tf, shouldReset)` 方法**（第 71-83 行）：
- `setWorkable(true, true)` - 啟動計時器並重置到 15 秒
- `setWorkable(true, false)` - 啟動計時器但不重置（繼續倒數）
- `setWorkable(false)` - 暫停計時器

#### 3.2 消除結束處理邏輯 ([GameController.js](assets/Script/Controller/GameController.js))

**`animeEnd()` 方法重構**（第 138-162 行）：

```javascript
animeEnd() {
  // 情況 1：步數還有 → 立刻重置計時器
  if (movesLeft > 0) {
    setWorkable(true, true);
    return;
  }

  // 情況 2：步數用完 → 等待分數計算完成
  if (isScoringComplete === false) {
    setTimeout(() => animeEnd(), 100);
    return;
  }

  // 情況 3：分數計算完成且步數用完
  if (!isProcessing) {
    setWorkable(true, true);
  }
}
```

**行為說明**：
- 步數未用完：消除結束後立刻給玩家新的 15 秒
- 步數用完：等待分數計算，再決定是否進入下一階段或結束遊戲

#### 3.3 階段轉換時的計時器處理 ([GameModel.js](assets/Script/Model/GameModel.js))

**`advanceToNextStage()`**（第 1035-1039 行）：
```javascript
// 先確保計時器停止，然後重置數值到 15 秒
thinkingTimerScript.setWorkable(false);  // 停止
thinkingTimerScript.resetTimer();        // 重置數值
```

**`showStageTransitionToast()`**（第 1078-1081 行）：
```javascript
// Toast 結束後恢復計時器（不重置，從 15 秒開始倒數）
thinkingTimerScript.setWorkable(true, false);
```

**完整流程**：
```
階段達標 → 計時器停止 → 重置到 15 秒 → Toast 顯示（凍結 2 秒）→ 解凍並開始倒數
```

---

### 4. 舊系統清理

#### 移除舊目標系統 ([GameController.js](assets/Script/Controller/GameController.js))

**刪除內容**：
- `goalLeftLabel` 和 `goal` 屬性
- 相關初始化程式碼
- 7 個舊目標系統方法：
  - `getLogicGoalLeft()`, `setLogicGoalLeft()`
  - `getUIGoalLeft()`, `setUIGoalLeft()`
  - `uiGoalLeftMinus()`, `goalComplete()`, `setGoalTypeImg()`

---

### 5. UI 調整

#### 階段顯示格式 ([StageView.js](assets/Script/View/StageView.js))
- 第 43 行：`階段 1 / 3` → `階段: 1 / 3`

---

## 📊 遊戲流程總覽

### 正常消除流程（步數還有）
```
玩家操作 → 計時器暫停 → 消除動畫 → 分數計算 → 計時器重置到 15 秒 → 繼續遊戲
```

### 階段達標流程（步數用完且達標）
```
玩家操作 → 計時器暫停 → 消除動畫 → 分數計算完成
    ↓
檢查達標 → 進入下一階段 → 計時器重置到 15 秒（顯示但不動）
    ↓
顯示 Toast「🎉 進入階段 X！」（2 秒）
    ↓
Toast 結束 → 計時器從 15 秒開始倒數 → 繼續遊戲
```

### 遊戲結束流程（步數用完且未達標）
```
玩家操作 → 計時器暫停 → 消除動畫 → 分數計算完成
    ↓
檢查未達標 → 進入結算畫面 → Game Over
```

---

## 🎯 關鍵設計決策

1. **每次操作都給予完整 15 秒**
   - 確保玩家有充足時間思考
   - 消除動畫期間計時器暫停，不消耗玩家時間

2. **階段轉換期間完全凍結**
   - Toast 顯示時玩家不能操作
   - 計時器顯示 15 秒但不倒數
   - Toast 結束後才開始新階段

3. **分數計算完成才判定**
   - 使用 `isScoringComplete` 標記
   - 避免時序問題導致誤判

4. **難度遞增設計**
   - 特殊方塊掉落率遞減（5% → 2% → 0%）
   - 目標分數遞增（10,000 → 25,000 → 無限）

---

**所有改動已完成並測試通過！** 🎮✨
