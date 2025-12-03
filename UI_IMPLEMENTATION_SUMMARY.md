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
- ✅ 在 `advanceToNextStage()` 方法中觸發階段過場提示框
- ✅ 調用 `gameController.showStageTransition()` 顯示提示

**修改位置**：第1023-1026行

---

#### [GameController.js](assets/Script/Controller/GameController.js)
**修改內容**：
- ✅ 新增 `stageTransition` 屬性（需在編輯器中綁定）
- ✅ 新增 `showStageTransition()` 方法控制階段過場顯示

**新增位置**：第42-46行（屬性），第364-385行（方法）

---

### 2. 新增的檔案

#### [StageView.js](assets/Script/View/StageView.js) ✨ 新增
**功能**：顯示當前階段資訊
- 顯示格式：`階段 X / 3`
- 自動更新階段編號
- 綁定到 GameModel 獲取即時資料

**使用方式**：
1. 創建一個 Label 節點
2. 掛載 `StageView` 腳本
3. 綁定 `gameScene` 欄位到 `Canvas/GameScene`

---

#### [StageTransitionView.js](assets/Script/View/StageTransitionView.js) ✨ 新增
**功能**：階段過場提示框動畫控制
- 顯示標題：`🎉 進入階段 X！`
- 顯示目標：`目標分數：XXXXX`
- 淡入淡出動畫（0.3秒）
- 縮放效果（0.8 → 1.0 → 0.8）
- 停留時間：2秒

**方法**：
```javascript
show(stage, targetScore, duration = 2, callback)
```

**參數說明**：
- `stage`：新階段編號
- `targetScore`：目標分數（null 表示無目標）
- `duration`：停留時間（預設2秒）
- `callback`：完成後的回調函數

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

#### 3. 階段過場提示框（需要新增）
- [ ] 創建 `StageTransition` 節點
- [ ] 創建子節點：Background、Panel、TitleLabel、TargetLabel
- [ ] 掛載 `StageTransitionView` 腳本
- [ ] 綁定 `titleLabel`、`targetLabel`、`backgroundNode` 欄位
- [ ] 設置初始狀態為隱藏（Active: false）

#### 4. GameController 綁定
- [ ] 將 `StageTransition` 節點綁定到 `GameController` 的 `stageTransition` 欄位

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
觸發 gameController.showStageTransition()
         ↓
StageTransitionView.show() 顯示提示框
         ↓
淡入 + 縮放動畫 (0.3秒)
         ↓
停留顯示 (2秒)
         ↓
淡出 + 縮放動畫 (0.3秒)
         ↓
隱藏提示框，執行回調
         ↓
遊戲繼續，進入新階段
```

---

## 🎨 UI 元素位置參考

```
畫面佈局：

左上角                              右上角
┌─────────────────────────────────────┐
│ 階段 1 / 3                          │
│                                     │
│          ┌───────────────┐          │
│          │ 🎉 進入階段 2  │          │ ← 中央提示框
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
- ✅ `assets/Script/View/CoinView.js`
- ✅ `assets/Script/Model/GameModel.js`
- ✅ `assets/Script/Controller/GameController.js`

### 新增的檔案
- ✅ `assets/Script/View/StageView.js`
- ✅ `assets/Script/View/StageTransitionView.js`

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
   - `GameController` 的 `stageTransition` 欄位必須綁定才能顯示過場

3. **初始狀態**
   - `StageTransition` 節點的初始 `Active` 必須設為 `false`
   - 否則會在遊戲開始時就顯示提示框

4. **顏色設置**
   - 金幣顏色會動態改變，不要在編輯器中手動設置
   - Label 的初始顏色設為白色即可

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

**程式碼部分已完成，請按照 [UI_SETUP_GUIDE.md](UI_SETUP_GUIDE.md) 完成編輯器設置！** 🎮✨
