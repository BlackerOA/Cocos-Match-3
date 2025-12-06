# 🍎 水果圖片替換實作計畫

## 📅 創建日期：2025-12-06

---

## 🎯 目標

將遊戲中的動物方塊替換為水果，並添加箭頭動畫區分特殊方塊類型。

## 🔄 實作方式：選項 B - 創建新的水果 Prefabs

**為什麼選擇選項 B：**
- ✅ Prefab 名稱與內容一致（Banana.prefab 內容就是香蕉）
- ✅ 代碼可讀性更高，易於維護
- ✅ 保留原始動物 Prefabs 作為備份
- ✅ 未來如果需要還原或同時支援兩套皮膚，更容易實作

**具體做法：**
1. 複製現有動物 Prefabs（Bear.prefab, Cat.prefab 等）
2. 重新命名為水果 Prefabs（Banana.prefab, Grape.prefab 等）
3. 修改 Prefab 內的圖片資源為對應水果
4. 更新 Game.fire 場景中 GridView 的 `aniPre` 陣列引用
5. 原始動物 Prefabs 保留但不被使用

### 視覺效果設計

| Cell 類型 | 水果圖片 | 箭頭效果 | 範例 |
|----------|---------|---------|------|
| **普通** | 原版水果 | 無 | 🍌 |
| **橫向消除** | 藍框水果 | 左右箭頭動畫 | 🍌 ←→ |
| **縱向消除** | 藍框水果 | 上下箭頭動畫 | 🍌 ↑↓ |
| **爆炸** | 橘框水果 | 十字箭頭/脈動 | 🍌 ✳️ |
| **鳥** | 榴槤 | 旋轉/光環 | 🌰 ✨ |

---

## 📋 替換對應表

| 原動物 | CELL_TYPE | 原 Prefab | 新 Prefab | 替換水果 | 圖片資源 |
|--------|-----------|-----------|-----------|----------|----------|
| 棕熊 Bear | A (1) | Bear.prefab | **Watermelon.prefab** | 🍉 西瓜 | watermelon.png / watermelon_blue.png / watermelon_orange.png |
| 紫貓 Cat | B (2) | Cat.prefab | **Grape.prefab** | 🍇 葡萄 | grape.png / grape_blue.png / grape_orange.png |
| 黃雞 Chicken | C (3) | Chicken.prefab | **Banana.prefab** | 🍌 香蕉 | banana.png / banana_blue.png / banana_orange.png |
| 紅狐 Fox | D (4) | Fox.prefab | **Orange.prefab** | 🍊 柳丁 | orange.png / orange_blue.png / orange_orange.png |
| 青蛙 Frog | E (5) | Frog.prefab | **Strawberry.prefab** | 🍓 草莓 | strawberry.png / strawberry_blue.png / strawberry_orange.png |
| 馬 Horse | F (6) | Horse.prefab | **Coconut.prefab** | 🥥 椰子 | coconut.png / coconut_blue.png / coconut_orange.png |
| 鳥 Bird | BIRD (7) | Bird.prefab | **Durian.prefab** | 🌰 榴槤 | durian.png |

---

## 📦 資源清單

### 已有資源（位於 `E:\Github\Cocos-Match-3-origin\水果圖片\`）

- [x] 西瓜.png / 西瓜(藍框).png / 西瓜(橘框).png
- [x] 柳丁.png / 柳丁(藍框).png / 柳丁(橘框).png
- [x] 香蕉.png / 香蕉(藍框).png / 香蕉(橘框).png
- [x] 草莓.png / 草莓(藍框).png / 草莓(橘框).png
- [x] 椰子.png / 椰子(藍框).png / 椰子(橘框).png
- [x] 葡萄.png / 葡萄(藍框).png / 葡萄(橘框).png
- [x] 榴槤.png

### 需要新增資源

**箭頭圖片**（需要設計/生成）：
- [ ] `arrow_horizontal.png` - 橫向箭頭 (←→) 約 40×20 px
- [ ] `arrow_vertical.png` - 縱向箭頭 (↑↓) 約 20×40 px
- [ ] `arrow_cross.png` - 十字箭頭 (✳️) 約 40×40 px
- [ ] `glow_ring.png` - 光環（鳥用）約 80×80 px（可選）

**設計規格**：
- 白色或黃色箭頭
- 半透明（opacity 70-80%）
- 簡單清晰的設計
- PNG 格式，透明背景

---

## 🚀 實作步驟

### **階段 0：準備工作** ⏳

#### 0.1 備份現有資源
- [ ] 備份 `assets/Prefabs/` 資料夾
  ```bash
  cp -r assets/Prefabs assets/Prefabs_backup_animals
  ```
- [ ] 備份 `assets/Texture/Cells/animals/` 資料夾
  ```bash
  cp -r assets/Texture/Cells/animals assets/Texture/Cells/animals_backup
  ```
- [ ] 創建 Git commit 作為還原點
  ```bash
  git add -A
  git commit -m "備份：水果替換前的狀態"
  ```

#### 0.2 創建新資源資料夾
- [ ] 創建 `assets/Texture/Cells/fruits/` 資料夾
- [ ] 創建 `assets/Texture/Effects/` 資料夾（存放箭頭）

---

### **階段 1：整理水果圖片資源** ⏳

#### 1.1 重新命名並複製水果圖片
將 `水果圖片/` 中的檔案重新命名（去除中文和括號）並複製到專案中。

**命名規則**：
```
原檔名 → 新檔名
香蕉.png → banana.png
香蕉(藍框).png → banana_blue.png
香蕉(橘框).png → banana_orange.png
```

**完整清單**：
- [ ] 香蕉 → `fruits/banana.png`, `banana_blue.png`, `banana_orange.png`
- [ ] 葡萄 → `fruits/grape.png`, `grape_blue.png`, `grape_orange.png`
- [ ] 柳丁 → `fruits/orange.png`, `orange_blue.png`, `orange_orange.png`
- [ ] 草莓 → `fruits/strawberry.png`, `strawberry_blue.png`, `strawberry_orange.png`
- [ ] 椰子 → `fruits/coconut.png`, `coconut_blue.png`, `coconut_orange.png`
- [ ] 西瓜 → `fruits/watermelon.png`, `watermelon_blue.png`, `watermelon_orange.png`
- [ ] 榴槤 → `fruits/durian.png`

**執行方式**：
- 手動複製並重新命名
- 或使用腳本批量處理（待提供）

#### 1.2 檢查圖片尺寸
- [ ] 確認所有水果圖片尺寸一致（建議 140×138 px，2 倍圖）
- [ ] 如果尺寸不一致，需要調整

---

### **階段 2：準備箭頭圖片** ⏳

#### 2.1 設計/生成箭頭圖片
- [ ] 使用 AI 工具或 Photoshop 生成 4 張箭頭圖片
- [ ] 確保透明背景
- [ ] 尺寸符合規格

#### 2.2 導入箭頭圖片到專案
- [ ] 將箭頭圖片放入 `assets/Texture/Effects/`
- [ ] 在 Cocos Creator 中檢查顯示是否正常

---

### **階段 3：創建新的水果 Prefab（Watermelon）** ⏳

#### 3.1 在 Cocos Creator 中導入水果圖片
- [ ] 打開 Cocos Creator 專案
- [ ] 確認 `fruits/` 資料夾中的圖片已被識別
- [ ] 確認 SpriteFrame 資源已生成

#### 3.2 複製 Bear.prefab 創建 Watermelon.prefab
- [ ] 在 Cocos Creator 資源管理器中找到 `assets/Prefabs/Bear.prefab`
- [ ] 複製 Bear.prefab，重新命名為 `Watermelon.prefab`
- [ ] 打開 Watermelon.prefab 編輯

#### 3.3 修改 Watermelon.prefab 的圖片
- [ ] 選中 Watermelon 根節點的 Sprite 組件
- [ ] 將 SpriteFrame 從 bear 圖改為 `watermelon.png`
- [ ] 修改根節點名稱從 "Bear" 改為 "Watermelon"

#### 3.4 添加箭頭效果節點
- [ ] 在 Watermelon 節點下新增子節點，命名為 `ArrowEffect`
- [ ] 為 ArrowEffect 添加 Sprite 組件
- [ ] 設置 ArrowEffect 的位置（Position: 0, 0）
- [ ] 設置初始狀態為隱藏（Active = false）
- [ ] 保存 Prefab

#### 3.5 在場景中替換 Prefab 引用
- [ ] 打開 `assets/Scene/Game.fire` 場景
- [ ] 選中 Canvas → GameScene → GridView 節點
- [ ] 在屬性面板中找到 GridView 組件的 `Ani Pre` 陣列
- [ ] 找到索引 1（對應 CELL_TYPE.A = Bear）
- [ ] 將 Prefab 從 Bear.prefab 改為 Watermelon.prefab
- [ ] 保存場景

**Ani Pre 陣列說明**：
```
aniPre[0] = EMPTY (通常為空)
aniPre[1] = Bear.prefab  → 改為 Watermelon.prefab (CELL_TYPE.A)
aniPre[2] = Cat.prefab   (暫時不改)
aniPre[3] = Chicken.prefab
aniPre[4] = Fox.prefab
aniPre[5] = Frog.prefab
aniPre[6] = Horse.prefab
aniPre[7] = Bird.prefab
```

#### 3.6 測試遊戲運行
- [ ] 保存場景和 Prefab
- [ ] 運行遊戲
- [ ] 確認原本 Bear 的位置現在顯示的是西瓜
- [ ] 確認其他動物仍正常顯示
- [ ] 檢查控制台是否有錯誤

---

### **階段 4：修改 CellView.js 代碼** ⏳

#### 4.1 添加水果類型映射
在 CellView.js 中添加 CELL_TYPE 到水果名稱的映射。

#### 4.2 修改 initWithModel() 方法
- [ ] 添加圖片切換邏輯（普通/藍框/橘框）
- [ ] 添加箭頭顯示/隱藏邏輯
- [ ] 停止原有的 Animation 播放

#### 4.3 添加箭頭動畫方法
- [ ] `playHorizontalArrowAnimation()` - 橫向箭頭（左右移動）
- [ ] `playVerticalArrowAnimation()` - 縱向箭頭（上下移動）
- [ ] `playWrapArrowAnimation()` - 爆炸箭頭（旋轉/脈動）
- [ ] `playBirdAnimation()` - 鳥的特效（旋轉/光環）

#### 4.4 測試代碼
- [ ] 運行遊戲
- [ ] 測試普通西瓜（無箭頭）
- [ ] 測試藍框西瓜 + 橫向箭頭
- [ ] 測試藍框西瓜 + 縱向箭頭
- [ ] 測試橘框西瓜 + 爆炸效果
- [ ] 檢查動畫流暢度

---

### **階段 5：創建其他水果 Prefab** ⏳

#### 5.1 創建 Grape.prefab（葡萄）
- [ ] 複製 Cat.prefab，重新命名為 `Grape.prefab`
- [ ] 打開 Grape.prefab，修改根節點名稱從 "Cat" 改為 "Grape"
- [ ] 將 Sprite 組件的 SpriteFrame 改為 `grape.png`
- [ ] 確認 ArrowEffect 子節點存在（可從 Watermelon.prefab 複製結構）
- [ ] 保存 Prefab

#### 5.2 創建 Banana.prefab（香蕉）
- [ ] 複製 Chicken.prefab，重新命名為 `Banana.prefab`
- [ ] 打開 Banana.prefab，修改根節點名稱從 "Chicken" 改為 "Banana"
- [ ] 將 Sprite 組件的 SpriteFrame 改為 `banana.png`
- [ ] 確認 ArrowEffect 子節點存在
- [ ] 保存 Prefab

#### 5.3 創建 Orange.prefab（柳丁）
- [ ] 複製 Fox.prefab，重新命名為 `Orange.prefab`
- [ ] 打開 Orange.prefab，修改根節點名稱從 "Fox" 改為 "Orange"
- [ ] 將 Sprite 組件的 SpriteFrame 改為 `orange.png`
- [ ] 確認 ArrowEffect 子節點存在
- [ ] 保存 Prefab

#### 5.4 創建 Strawberry.prefab（草莓）
- [ ] 複製 Frog.prefab，重新命名為 `Strawberry.prefab`
- [ ] 打開 Strawberry.prefab，修改根節點名稱從 "Frog" 改為 "Strawberry"
- [ ] 將 Sprite 組件的 SpriteFrame 改為 `strawberry.png`
- [ ] 確認 ArrowEffect 子節點存在
- [ ] 保存 Prefab

#### 5.5 創建 Coconut.prefab（椰子）
- [ ] 複製 Horse.prefab，重新命名為 `Coconut.prefab`
- [ ] 打開 Coconut.prefab，修改根節點名稱從 "Horse" 改為 "Coconut"
- [ ] 將 Sprite 組件的 SpriteFrame 改為 `coconut.png`
- [ ] 確認 ArrowEffect 子節點存在
- [ ] 保存 Prefab

#### 5.6 創建 Durian.prefab（榴槤）
- [ ] 複製 Bird.prefab，重新命名為 `Durian.prefab`
- [ ] 打開 Durian.prefab，修改根節點名稱從 "Bird" 改為 "Durian"
- [ ] 將 Sprite 組件的 SpriteFrame 改為 `durian.png`
- [ ] 確認 ArrowEffect 子節點存在（榴槤可能需要特殊光環效果）
- [ ] 保存 Prefab

#### 5.7 更新場景中的所有 Prefab 引用
- [ ] 打開 `assets/Scene/Game.fire` 場景
- [ ] 選中 Canvas → GameScene → GridView 節點
- [ ] 在屬性面板中找到 GridView 組件的 `Ani Pre` 陣列
- [ ] 更新所有 Prefab 引用：
  - [ ] aniPre[1]: Bear.prefab → **Watermelon.prefab** (已完成)
  - [ ] aniPre[2]: Cat.prefab → **Grape.prefab**
  - [ ] aniPre[3]: Chicken.prefab → **Banana.prefab**
  - [ ] aniPre[4]: Fox.prefab → **Orange.prefab**
  - [ ] aniPre[5]: Frog.prefab → **Strawberry.prefab**
  - [ ] aniPre[6]: Horse.prefab → **Coconut.prefab**
  - [ ] aniPre[7]: Bird.prefab → **Durian.prefab**
- [ ] 保存場景

#### 5.8 測試所有水果
- [ ] 保存所有 Prefab 和場景
- [ ] 運行遊戲
- [ ] 確認所有 6 種水果 + 榴槤都正常顯示
- [ ] 確認沒有出現原本的動物圖片
- [ ] 測試每種水果的特殊狀態（藍框/橘框）
- [ ] 測試箭頭動畫
- [ ] 檢查控制台是否有錯誤

---

### **階段 6：優化和調整** ⏳

#### 6.1 調整動畫參數
- [ ] 調整箭頭移動速度
- [ ] 調整箭頭大小/透明度
- [ ] 調整爆炸效果（如果不滿意，改為脈動光環）

#### 6.2 性能測試
- [ ] 測試大量方塊同時顯示是否卡頓
- [ ] 如果卡頓，優化動畫複雜度

#### 6.3 視覺調整
- [ ] 確認顏色搭配協調
- [ ] 確認藍框/橘框清晰可見
- [ ] 確認箭頭不會遮擋水果主體

---

### **階段 7：清理和文檔** ⏳

#### 7.1 清理舊資源
- [ ] **保留原始動物 Prefabs**（Bear.prefab, Cat.prefab 等）作為備份
  - 這些 Prefabs 不會被遊戲使用（因為 aniPre 已改為水果 Prefabs）
  - 可選擇移到 `assets/Prefabs/animals_backup/` 資料夾整理
- [ ] 決定是否刪除 `animals_backup` 資料夾（備份的動物圖片）
- [ ] 刪除未使用的 Animation Clips（可選）

#### 7.2 更新文檔
- [ ] 更新專案 README（如果有）
- [ ] 記錄修改內容：
  - 記錄新的 Prefab 命名規則（Banana, Grape, Orange, etc.）
  - 記錄水果與 CELL_TYPE 的對應關係
  - 記錄箭頭效果的實作方式

#### 7.3 創建最終 Commit
```bash
git add -A
git commit -m "完成水果替換：新增所有水果 Prefabs + 箭頭特效

- 新增 7 個水果 Prefabs（Watermelon, Grape, Banana, Orange, Strawberry, Coconut, Durian）
- 更新 Game.fire 場景的 aniPre 陣列引用
- 修改 CellView.js 添加箭頭動畫效果
- 保留原始動物 Prefabs 作為備份
- 對應關係：熊→西瓜、貓→葡萄、雞→香蕉、狐→柳丁、蛙→草莓、馬→椰子、鳥→榴槤"
git push
```

---

## ✅ 進度追蹤

### 當前狀態：**階段 0 - 準備工作**

- [ ] 階段 0：準備工作
- [ ] 階段 1：整理水果圖片資源
- [ ] 階段 2：準備箭頭圖片
- [ ] 階段 3：測試單一水果替換
- [ ] 階段 4：修改 CellView.js 代碼
- [ ] 階段 5：批量應用到其他 Prefab
- [ ] 階段 6：優化和調整
- [ ] 階段 7：清理和文檔

---

## 🔧 技術細節

### Prefab 結構設計

```
Watermelon.prefab (西瓜，對應原 Bear)
├── Sprite Component
│   └── SpriteFrame: 根據狀態切換
│       ├── 普通: watermelon.png
│       ├── 直線: watermelon_blue.png
│       └── 爆炸: watermelon_orange.png
│
└── ArrowEffect (子節點)
    ├── Sprite Component
    │   └── SpriteFrame: 根據狀態切換箭頭圖
    └── 初始狀態: active = false
```

### 代碼邏輯流程

```
initWithModel(model)
  ↓
判斷 model.status
  ↓
├─ COMMON → watermelon.png + 隱藏箭頭
├─ LINE → watermelon_blue.png + 顯示橫向箭頭 + 左右動畫
├─ COLUMN → watermelon_blue.png + 顯示縱向箭頭 + 上下動畫
├─ WRAP → watermelon_orange.png + 顯示十字箭頭 + 旋轉動畫
└─ BIRD → durian.png + 特殊效果
```

---

## 📝 注意事項

1. **圖片命名**：避免使用中文、空格、括號
2. **尺寸一致**：所有水果圖片應該相同尺寸
3. **透明背景**：確保 PNG 有正確的透明通道
4. **備份優先**：每個階段完成後做 Git commit
5. **逐步測試**：不要一次改完，要逐步測試
6. **性能考量**：注意動畫數量，避免卡頓

---

## 🐛 可能遇到的問題

### 問題 1：水果顯示錯位
**解決**：檢查圖片的 anchor point 是否為 (0.5, 0.5)

### 問題 2：箭頭不顯示
**解決**：
1. 檢查 ArrowEffect 節點是否設為 active = true
2. 檢查 Sprite 組件的 SpriteFrame 是否正確

### 問題 3：動畫卡頓
**解決**：減少同時播放的動畫數量，或簡化動畫效果

### 問題 4：藍框/橘框不明顯
**解決**：調整邊框粗細，或增加對比度

---

## 📞 需要幫助？

如果遇到問題，請記錄：
1. 在哪個階段
2. 具體錯誤訊息
3. 已嘗試的解決方法

---

**最後更新**：2025-12-06
**負責人**：[你的名字]
**預計完成時間**：[填入預計時間]
