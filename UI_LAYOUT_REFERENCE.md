# UI 佈局參考

## 📐 畫面佈局示意圖

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌──────────────┐                              │ ← 頂部
│  │ 階段 1 / 3   │  (左上角 - StageLabel)        │
│  └──────────────┘                              │
│                                                 │
│                                                 │
│              ┌──────────────────┐              │
│              │  🎉 進入階段 2！  │              │ ← 中央
│              │ ─────────────── │              │   過場提示框
│              │ 目標分數：25000  │              │
│              └──────────────────┘              │
│                                                 │
│                                                 │
│              [ 遊戲網格區域 ]                  │
│                                                 │
│                                                 │
│  ┌──────────────────┐                          │ ← 底部
│  │ 5000 / 10000 💰  │  (左下角 - Coin)          │
│  └──────────────────┘                          │
└─────────────────────────────────────────────────┘
```

---

## 🎨 UI 元素詳細說明

### 1. 左上角 - 階段顯示 (StageLabel)

**位置**：左上角
**顯示內容**：`階段 X / 3`
**腳本**：`StageView.js`

```
建議屬性：
- Position: (-400, 300)
- Anchor: (0, 1)
- Font Size: 28-32
- Color: 白色
```

---

### 2. 左下角 - 金幣顯示 (Coin)

**位置**：左下角
**顯示內容**：`當前分數 / 目標分數`
**腳本**：`CoinView.js`

```
建議屬性：
- Position: (-400, -300)
- Anchor: (0, 0)
- Font Size: 24-28

顏色規則：
- 白色 (255, 255, 255) - 正常狀態
- 金色 (255, 215, 0)   - 已達標
- 紅色 (255, 0, 0)     - 步數≤3且未達標
```

---

### 3. 中央 - 階段過場提示框 (StageTransition)

**位置**：畫面中央
**顯示時機**：階段推進時自動彈出
**腳本**：`StageTransitionView.js`

```
層級結構：
StageTransition (主容器)
├── Background (半透明黑色遮罩)
└── Panel (提示框背景)
    ├── TitleLabel (標題：🎉 進入階段 X！)
    └── TargetLabel (目標：目標分數：XXXXX)

建議屬性：
StageTransition:
  - Position: (0, 0)
  - Anchor: (0.5, 0.5)
  - Size: (600, 300)

Background:
  - Size: (1920, 1080) 全屏
  - Color: rgba(0, 0, 0, 180) 半透明

Panel:
  - Size: (500, 250)
  - Color: 自定義（建議淺色）

TitleLabel:
  - Position: (0, 50)
  - Font Size: 36-40
  - Align: Center

TargetLabel:
  - Position: (0, -30)
  - Font Size: 28-32
  - Align: Center
```

---

## 🔗 組件綁定關係圖

```
GameController (Canvas/GameScene)
│
├─→ stageTransition → StageTransition 節點
│
└─→ (其他已有的綁定...)

─────────────────────────────────────

StageTransition 節點
├─→ StageTransitionView 腳本
│   ├─→ titleLabel → TitleLabel 的 Label 組件
│   ├─→ targetLabel → TargetLabel 的 Label 組件
│   └─→ backgroundNode → Background 節點

─────────────────────────────────────

StageLabel 節點
└─→ StageView 腳本
    └─→ gameScene → Canvas/GameScene 節點

─────────────────────────────────────

Coin 節點
└─→ CoinView 腳本
    └─→ gameScene → Canvas/GameScene 節點
```

---

## 🎬 動畫時間軸

### 階段過場動畫序列

```
時間軸：
0.0s ─┬─ 開始顯示
      │
0.0s ─┼─ 淡入 + 縮放 (0.8 → 1.0)
      │  ↓ 0.3秒
0.3s ─┼─ 完全顯示
      │  ↓ 停留
2.3s ─┼─ 淡出 + 縮放 (1.0 → 0.8)
      │  ↓ 0.3秒
2.6s ─┼─ 完全隱藏
      │
      └─ 執行回調，遊戲繼續
```

---

## 🎨 配色建議

### 主題色方案

#### 方案一：藍色主題
- 階段顯示：白色 `#FFFFFF`
- 金幣正常：白色 `#FFFFFF`
- 金幣達標：金色 `#FFD700`
- 金幣警告：紅色 `#FF0000`
- 提示框背景：淺藍 `#E3F2FD`
- 提示框文字：深藍 `#1565C0`

#### 方案二：紫色主題
- 階段顯示：白色 `#FFFFFF`
- 金幣正常：白色 `#FFFFFF`
- 金幣達標：金色 `#FFD700`
- 金幣警告：紅色 `#FF0000`
- 提示框背景：淺紫 `#F3E5F5`
- 提示框文字：深紫 `#6A1B9A`

#### 方案三：漸變主題
- 提示框背景：線性漸變（從 `#667EEA` 到 `#764BA2`）
- 提示框文字：白色 `#FFFFFF` + 陰影效果

---

## 📱 響應式建議

### 不同解析度的適配

```
16:9 (1920x1080) - 標準設置
├─ StageLabel: (-400, 300)
├─ Coin: (-400, -300)
└─ StageTransition: (0, 0) Size: (600, 300)

4:3 (1024x768) - 較窄屏幕
├─ StageLabel: (-300, 250)
├─ Coin: (-300, -250)
└─ StageTransition: (0, 0) Size: (500, 250)

18:9 (2160x1080) - 較寬屏幕
├─ StageLabel: (-500, 300)
├─ Coin: (-500, -300)
└─ StageTransition: (0, 0) Size: (700, 350)
```

---

## 🔧 快速調試技巧

### 測試各種狀態

#### 測試金幣顏色變化
1. 打開 `CoinView.js`
2. 暫時修改顏色判斷條件進行測試
3. 確認無誤後恢復原始邏輯

#### 測試階段過場動畫
1. 在 `GameModel.js` 的 `advanceToNextStage()` 開頭加入：
   ```javascript
   // 測試用：直接觸發階段2
   // this.currentStage = 1;
   ```
2. 運行遊戲立即看到過場效果
3. 測試完成後移除

#### 調整動畫速度
1. 打開 `StageTransitionView.js`
2. 修改 `show()` 方法的參數：
   ```javascript
   show(stage, targetScore, duration = 2, callback)
   //                        ↑ 調整這個值
   ```

---

## ✅ 完成檢查清單

設置完成後，請逐項檢查：

### 金幣顯示
- [ ] 顯示格式正確（`分數 / 目標`）
- [ ] 白色狀態正常
- [ ] 達標後變金色
- [ ] 步數不足時變紅色
- [ ] 階段3只顯示分數（無目標）

### 階段顯示
- [ ] 左上角顯示正確
- [ ] 隨階段推進自動更新
- [ ] 文字清晰可讀

### 階段過場
- [ ] 進入階段2時彈出
- [ ] 進入階段3時彈出
- [ ] 標題文字正確
- [ ] 目標分數正確
- [ ] 動畫流暢
- [ ] 2秒後自動消失
- [ ] 消失後遊戲繼續

### 腳本綁定
- [ ] CoinView 綁定到 Coin 節點
- [ ] StageView 綁定到 StageLabel 節點
- [ ] StageTransitionView 綁定到 StageTransition 節點
- [ ] GameController 的 stageTransition 欄位已設置

---

**參考此文檔完成 UI 設置，祝你順利！** 🎮✨
