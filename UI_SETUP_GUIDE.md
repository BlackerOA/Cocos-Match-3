# UI 設置指南 - Cocos Creator 編輯器操作

本指南將幫助你在 Cocos Creator 編輯器中設置新的階段系統 UI。

---

## 📋 目錄

1. [修改金幣顯示（左下角）](#1-修改金幣顯示左下角)
2. [新增階段顯示（左上角，取代舊目標）](#2-新增階段顯示左上角取代舊目標)
3. [新增階段過場提示框](#3-新增階段過場提示框)

---

## 1. 修改金幣顯示（左下角）

### 📍 位置
左下角的金幣數字（Coin Label）

### ✅ 操作步驟

#### 步驟 1：找到金幣節點
1. 在 **層級管理器** 中找到金幣顯示節點
   - 路徑通常是：`Canvas/Coin` 或 `Canvas/CoinLabel`

#### 步驟 2：確認腳本綁定
1. 選中金幣節點
2. 在 **屬性檢查器** 中確認已經掛載 `CoinView` 腳本
3. 如果沒有，點擊 **添加組件** → **自定義組件** → 選擇 `CoinView`

#### 步驟 3：設置 GameScene 參考
1. 在 `CoinView` 組件屬性中找到 `Game Scene` 欄位
2. 將 `Canvas/GameScene` 節點拖拽到此欄位
   - 或者留空，腳本會自動查找

### ✨ 完成效果
- 顯示格式：`當前分數 / 目標分數`（例如：`5000 / 10000`）
- 顏色變化：
  - 白色：正常狀態
  - 金色：已達標
  - 紅色：剩餘步數≤3且未達標

---

## 2. 新增階段顯示（左上角，取代舊目標）

### 📍 位置
左上角原本的目標顯示區域

### ✅ 操作步驟

#### 步驟 1：隱藏或移除舊目標節點
1. 找到舊目標節點：`Canvas/Goal`
2. 選擇以下其中一種方式：
   - **方式A（推薦）**：在 **屬性檢查器** 中取消勾選 **Active**（暫時隱藏）
   - **方式B**：直接刪除此節點

#### 步驟 2：創建新的階段顯示節點
1. 在 **層級管理器** 中右鍵點擊 `Canvas`
2. 選擇 **創建** → **創建空節點**
3. 重命名為 `StageLabel`

#### 步驟 3：添加 Label 組件
1. 選中 `StageLabel` 節點
2. 點擊 **添加組件** → **渲染組件** → **Label**
3. 設置 Label 屬性：
   - **String**：`階段 1 / 3`（初始文字，會自動更新）
   - **Font Size**：28-32（建議大小）
   - **Horizontal Align**：Left（左對齊）
   - **Vertical Align**：Top（頂部對齊）
   - **Overflow**：None

#### 步驟 4：添加 StageView 腳本
1. 選中 `StageLabel` 節點
2. 點擊 **添加組件** → **自定義組件** → 選擇 `StageView`
3. 在 `Game Scene` 欄位中拖入 `Canvas/GameScene` 節點

#### 步驟 5：設置位置
1. 在 **屬性檢查器** 中設置 `StageLabel` 的 **Position**：
   - **X**：`-400`（左上角，根據需要調整）
   - **Y**：`300`（左上角，根據需要調整）
2. 調整 **Anchor**：
   - **X**：`0`（左對齊）
   - **Y**：`1`（頂對齊）

### ✨ 完成效果
- 顯示格式：`階段 1 / 3`
- 會隨著遊戲進度自動更新

---

## 3. 新增階段過場提示框

### 📍 位置
畫面中央的彈出提示框

### ✅ 操作步驟

#### 步驟 1：創建主容器節點
1. 在 **層級管理器** 中右鍵點擊 `Canvas`
2. 選擇 **創建** → **創建空節點**
3. 重命名為 `StageTransition`
4. 設置屬性：
   - **Position**：`(0, 0)`（畫面中央）
   - **Anchor**：`(0.5, 0.5)`（居中）
   - **Size**：`(600, 300)`（建議大小）

#### 步驟 2：創建背景遮罩（可選）
1. 右鍵點擊 `StageTransition` → **創建** → **創建空節點**
2. 重命名為 `Background`
3. 添加 **Sprite** 組件：
   - 點擊 **添加組件** → **渲染組件** → **Sprite**
4. 設置屬性：
   - **Sprite Frame**：選擇一個半透明的黑色圖片，或使用內建的 `default_sprite`
   - **Size Mode**：Custom
   - **Size**：`(1920, 1080)`（全屏）
   - **Color**：`rgba(0, 0, 0, 180)`（半透明黑色）
5. 調整 **Position**：`(0, 0)`

#### 步驟 3：創建提示框背景
1. 右鍵點擊 `StageTransition` → **創建** → **創建空節點**
2. 重命名為 `Panel`
3. 添加 **Sprite** 組件
4. 設置屬性：
   - **Sprite Frame**：選擇一個白色或淺色背景圖片
   - **Type**：Sliced（九宮格）
   - **Size**：`(500, 250)`
   - **Color**：自定義顏色（建議：淺藍色或白色）
5. 調整 **Position**：`(0, 0)`

#### 步驟 4：創建標題文字
1. 右鍵點擊 `Panel` → **創建** → **創建空節點**
2. 重命名為 `TitleLabel`
3. 添加 **Label** 組件
4. 設置屬性：
   - **String**：`🎉 進入階段 2！`（範例，會自動更新）
   - **Font Size**：36-40
   - **Horizontal Align**：Center
   - **Vertical Align**：Middle
   - **Color**：自定義（建議：深色或金色）
5. 調整 **Position**：`(0, 50)`（面板上方）

#### 步驟 5：創建目標分數文字
1. 右鍵點擊 `Panel` → **創建** → **創建空節點**
2. 重命名為 `TargetLabel`
3. 添加 **Label** 組件
4. 設置屬性：
   - **String**：`目標分數：25000`（範例，會自動更新）
   - **Font Size**：28-32
   - **Horizontal Align**：Center
   - **Vertical Align**：Middle
   - **Color**：自定義（建議：深色）
5. 調整 **Position**：`(0, -30)`（面板下方）

#### 步驟 6：添加 StageTransitionView 腳本
1. 選中最上層的 `StageTransition` 節點
2. 點擊 **添加組件** → **自定義組件** → 選擇 `StageTransitionView`
3. 設置腳本屬性：
   - **Title Label**：拖入 `TitleLabel` 節點的 **Label** 組件
   - **Target Label**：拖入 `TargetLabel` 節點的 **Label** 組件
   - **Background Node**：拖入 `Background` 節點（如果有創建）

#### 步驟 7：綁定到 GameController
1. 選中 `Canvas/GameScene` 節點
2. 找到 `GameController` 組件
3. 在 **Stage Transition** 欄位中拖入剛剛創建的 `StageTransition` 節點

#### 步驟 8：設置初始狀態
1. 選中 `StageTransition` 節點
2. 在 **屬性檢查器** 中取消勾選 **Active**
   - （腳本會在需要時自動顯示）

### ✨ 完成效果
- 階段推進時自動彈出
- 顯示新階段編號和目標分數
- 帶有淡入淡出和縮放動畫
- 持續2秒後自動消失

---

## 🎨 層級結構參考

完成後的層級結構應該類似：

```
Canvas
├── GameScene (GameController)
├── Coin (CoinView) ← 已修改
├── StageLabel (StageView) ← 新增
├── StageTransition (StageTransitionView) ← 新增
│   ├── Background (Sprite)
│   └── Panel (Sprite)
│       ├── TitleLabel (Label)
│       └── TargetLabel (Label)
└── Goal (已隱藏或刪除) ← 舊目標系統
```

---

## ⚙️ GameController 設定檢查清單

選中 `Canvas/GameScene` 節點，確認 `GameController` 組件的屬性：

- ✅ **Grid**：拖入遊戲網格節點
- ✅ **Audio Button**：拖入音樂按鈕
- ✅ **Audio Source**：拖入音效源
- ✅ **Hint Timer**：拖入提示計時器
- ✅ **Thinking Timer**：拖入思考計時器
- ❌ **Goal Left Label**：可以留空或移除（已停用）
- ❌ **Goal**：可以留空或移除（已停用）
- ✅ **Combo Label**：拖入 Combo 顯示標籤
- ✅ **Stage Transition**：拖入階段過場提示框節點 ← **新增**

---

## 🧪 測試檢查

完成設置後，運行遊戲並檢查：

### 金幣顯示測試
1. ✅ 左下角顯示 `當前分數 / 目標分數`
2. ✅ 正常時顯示白色
3. ✅ 達到10,000分後變成金色
4. ✅ 剩餘步數≤3且未達標時變紅色

### 階段顯示測試
1. ✅ 左上角顯示 `階段 1 / 3`
2. ✅ 進入階段2時自動更新為 `階段 2 / 3`
3. ✅ 進入階段3時自動更新為 `階段 3 / 3`

### 階段過場測試
1. ✅ 階段1完成後彈出提示框
2. ✅ 提示框顯示 `🎉 進入階段 2！`
3. ✅ 提示框顯示 `目標分數：25000`
4. ✅ 提示框持續2秒後消失
5. ✅ 動畫流暢（淡入、縮放、淡出）

---

## 🎨 可選的美化建議

### 金幣顯示美化
- 添加金幣圖標在文字旁邊
- 添加背景框增加可讀性
- 顏色變化時添加過渡動畫

### 階段顯示美化
- 添加階段圖標或徽章
- 使用更醒目的字體
- 添加背景框

### 階段過場美化
- 使用更精美的面板背景圖
- 添加粒子效果（煙花、星星等）
- 添加音效
- 使用更豐富的動畫（旋轉、彈跳等）

---

## ❓ 常見問題

### Q1: 金幣顯示沒有變色
**A**: 確認 `CoinView.js` 腳本已正確掛載，且 `gameModel` 有正確取得。

### Q2: 階段顯示一直是 `階段 1 / 3`
**A**: 檢查 `StageView` 的 `Game Scene` 欄位是否正確綁定到 `Canvas/GameScene`。

### Q3: 階段過場提示框不顯示
**A**: 檢查以下項目：
1. `StageTransition` 節點是否綁定到 `GameController` 的 `Stage Transition` 欄位
2. `StageTransitionView` 腳本是否正確掛載
3. `Title Label` 和 `Target Label` 是否正確綁定

### Q4: 提示框顯示後不消失
**A**: 檢查動畫序列是否正確設置，確認 `show()` 方法中的 `hideNode` 回調有執行。

---

## 📝 腳本檔案清單

確認以下新增的腳本檔案存在：

- ✅ `assets/Script/View/CoinView.js`（已修改）
- ✅ `assets/Script/View/StageView.js`（新增）
- ✅ `assets/Script/View/StageTransitionView.js`（新增）

---

**完成以上步驟後，保存場景並運行遊戲進行測試！** 🎮✨

如有任何問題，請參考 Console 輸出的錯誤訊息進行調試。
