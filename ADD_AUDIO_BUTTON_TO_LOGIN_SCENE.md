# 在Login場景添加音頻按鈕的步驟

## 方法 1: 使用 Cocos Creator 編輯器（推薦）

### 步驟 1: 打開Login場景
1. 打開 Cocos Creator 編輯器
2. 在資源管理器中找到 `assets/Scene/Login.fire`
3. 雙擊打開該場景

### 步驟 2: 複製Game場景的audioButton節點
1. 先打開 `assets/Scene/Game.fire` 場景
2. 在層級管理器中找到 `Canvas/audioButton` 節點
3. 右鍵點擊 `audioButton` 節點，選擇「複製」(Ctrl+C)

### 步驟 3: 貼上到Login場景
1. 切換回 `Login.fire` 場景
2. 在層級管理器中選擇 `Canvas` 節點
3. 右鍵點擊，選擇「貼上」(Ctrl+V)
4. 這樣會將audioButton節點複製到Login場景的Canvas下

### 步驟 4: 調整按鈕位置
1. 選中剛貼上的 `audioButton` 節點
2. 在屬性檢查器中調整位置:
   - 建議位置: X: 213.789, Y: -361.289 (與Game場景相同位置)
   - 或者根據Login場景的UI布局自行調整

### 步驟 5: 配置LoginController組件
1. 選擇 `Canvas` 節點
2. 在屬性檢查器中找到 `LoginController` 組件
3. 將以下屬性拖拽連接:
   - `Audio Button`: 拖入剛才添加的 `audioButton` 節點
   - `Sound Icon`: 拖入 `assets/Texture/ui/sound` 圖片資源
   - `Mute Icon`: 拖入 `assets/Texture/ui/mute` 圖片資源

### 步驟 6: 配置GameController組件（重要！）
1. 打開 `assets/Scene/Game.fire` 場景
2. 選擇 `Canvas/GameScene` 節點
3. 在屬性檢查器中找到 `GameController` 組件
4. 將以下屬性拖拽連接:
   - `Game Scene BGM`: 拖入Game場景的背景音樂資源（AudioClip）
   - 注意：這個音樂應該與原本GameScene的AudioSource組件使用的音樂相同

### 步驟 7: 保存場景
1. 按 `Ctrl+S` 或選擇 「文件 > 保存場景」
2. 完成！

---

## 方法 2: 手動創建按鈕（如果複製不可行）

### 步驟 1: 創建audioButton節點
1. 打開 `Login.fire` 場景
2. 在層級管理器中右鍵點擊 `Canvas` 節點
3. 選擇 「創建 > 創建空節點」
4. 將新節點重命名為 `audioButton`

### 步驟 2: 設置audioButton屬性
1. 選中 `audioButton` 節點
2. 在屬性檢查器中設置:
   - Position: X: 213.789, Y: -361.289
   - Size: Width: 80, Height: 80
   - Anchor: X: 0.5, Y: 0.5

### 步驟 3: 添加Button組件
1. 選中 `audioButton` 節點
2. 點擊「添加組件」按鈕
3. 選擇 「UI組件 > Button」
4. 在Button組件中設置:
   - Transition: SCALE
   - Duration: 0.1
   - Zoom Scale: 1.2

### 步驟 4: 創建Background子節點
1. 右鍵點擊 `audioButton` 節點
2. 選擇 「創建 > 創建Sprite節點」
3. 將新節點重命名為 `Background`
4. 設置Background屬性:
   - Position: X: 0, Y: 0
   - Size: Width: 80, Height: 80
   - Anchor: X: 0.5, Y: 0.5

### 步驟 5: 設置Background的Sprite
1. 選中 `Background` 節點
2. 在Sprite組件中:
   - Sprite Frame: 拖入 `assets/Texture/ui/sound` 圖片
   - Type: SIMPLE
   - Size Mode: CUSTOM

### 步驟 6: 添加Widget組件到Background
1. 選中 `Background` 節點
2. 點擊「添加組件」
3. 選擇 「UI組件 > Widget」
4. 設置Widget屬性:
   - 勾選所有對齊選項 (Left, Right, Top, Bottom, Horizontal Center, Vertical Center)

### 步驟 7: 配置Button的Target
1. 選中 `audioButton` 節點
2. 在Button組件中:
   - Target: 拖入 `Background` 子節點
   - Normal Sprite: 拖入 `assets/Texture/ui/sound` 圖片

### 步驟 8: 連接到LoginController
1. 選擇 `Canvas` 節點
2. 在LoginController組件中設置:
   - `Audio Button`: 拖入 `audioButton` 節點
   - `Sound Icon`: 拖入 `assets/Texture/ui/sound` 圖片
   - `Mute Icon`: 拖入 `assets/Texture/ui/mute` 圖片

### 步驟 9: 配置GameController組件（重要！）
1. 打開 `assets/Scene/Game.fire` 場景
2. 選擇 `Canvas/GameScene` 節點
3. 在屬性檢查器中找到 `GameController` 組件
4. 將以下屬性拖拽連接:
   - `Game Scene BGM`: 拖入Game場景的背景音樂資源（AudioClip）

### 步驟 10: 保存場景
1. 按 `Ctrl+S` 保存場景

---

## 驗證步驟

完成後，請確認以下內容:

1. ✅ Login場景的Canvas下有audioButton節點
2. ✅ audioButton有Button組件
3. ✅ audioButton下有Background子節點，且有Sprite組件
4. ✅ LoginController組件的三個新屬性都已正確連接
5. ✅ 測試運行遊戲:
   - Login場景應顯示音頻按鈕
   - 點擊按鈕應切換圖標（sound ↔ mute）
   - 音樂應正確開關
   - 切換到Game場景時，音樂狀態應保持

---

## 注意事項

- 確保 `soundIcon` 和 `muteIcon` 圖片資源存在於 `assets/Texture/ui/` 目錄
- 按鈕的位置可以根據Login場景的UI布局自行調整
- 音頻狀態會通過 `GlobalAudioManager` 跨場景保存
- **重要**：必須在GameController組件中設置 `Game Scene BGM` 屬性，否則Game場景將沒有背景音樂
- 如果遇到問題，可以參考Game.fire場景中的audioButton配置

## 如何找到Game場景原本的背景音樂？

1. 打開 `assets/Scene/Game.fire` 場景
2. 找到 `Canvas/GameScene` 節點
3. 查看該節點的 `AudioSource` 組件（如果有的話）
4. 記下 `Clip` 屬性中使用的音樂資源
5. 將同樣的音樂資源拖入 `GameController` 的 `Game Scene BGM` 屬性

---

## 程式碼部分已完成

以下程式碼已經完成，無需修改:

1. ✅ `assets/Script/Utils/GlobalAudioManager.js` - 全局音頻管理器
2. ✅ `assets/Script/Controller/LoginController.js` - 添加了音頻按鈕事件處理
3. ✅ `assets/Script/Controller/GameController.js` - 更新為使用全局音頻管理器

只需要在Cocos Creator編輯器中完成場景編輯即可！
