# 修復 Game 場景雙重音樂問題

## 問題描述

Game 場景中有兩個音頻源同時播放音樂：
1. `Canvas/GameScene` 節點上的 **AudioSource 組件**（舊的自動播放方式）
2. **GameController** 通過 `GlobalAudioManager.playBGM()` 播放的音樂（新的方式）

這導致同一首音樂播放了兩遍，而音頻按鈕只能控制其中一個。

## 解決方法

### 方法 1: 禁用 AudioSource 組件的自動播放（推薦）

1. **打開 Cocos Creator 編輯器**
2. **打開 `assets/Scene/Game.fire` 場景**
3. **在層級管理器中找到 `Canvas/GameScene` 節點**
4. **在屬性檢查器中找到 `AudioSource` 組件**
5. **取消勾選 `Play On Load` 選項**
   - 這樣場景載入時就不會自動播放音樂
   - 音樂將完全由 GlobalAudioManager 控制
6. **保存場景** (Ctrl+S)

### 方法 2: 直接移除 AudioSource 組件（更徹底）

如果你確定不再需要舊的 AudioSource 組件：

1. **打開 Cocos Creator 編輯器**
2. **打開 `assets/Scene/Game.fire` 場景**
3. **在層級管理器中找到 `Canvas/GameScene` 節點**
4. **在屬性檢查器中找到 `AudioSource` 組件**
5. **點擊 AudioSource 組件右上角的齒輪圖標**
6. **選擇 "移除組件"**
7. **保存場景** (Ctrl+S)

## 推薦方案

**使用方法 1**（禁用 Play On Load）比較安全，因為：
- 保留了組件，以防將來需要
- 只是停止自動播放
- 如果出問題可以輕易恢復

## 驗證修復

修復後，測試以下情況：

1. ✅ 進入 Game 場景時，只聽到一層音樂（不是兩層）
2. ✅ 點擊音頻按鈕，音樂完全停止（沒有殘留的音樂）
3. ✅ 再次點擊按鈕，音樂恢復播放
4. ✅ 從 Login 切換到 Game，音樂正常切換

## 技術細節

### Game.fire 中的 AudioSource 組件位置

- **節點**: `Canvas/GameScene` (node id: 5)
- **組件**: AudioSource (id: "4baJDi8m5I8YsfWagtEQUk")
- **音樂資源**: UUID `f0bbf861-9d72-4734-b012-26ba8614bf11`
- **問題設定**:
  - `playOnLoad: true` ← 這個導致自動播放
  - `_loop: true`
  - `_enabled: true`

### 新的音樂播放方式

現在音樂由 **GameController.onLoad()** 控制：

```javascript
// GameController.js line 55-57
if (this.gameSceneBGM) {
  GlobalAudioManager.playBGM('Game', this.gameSceneBGM, true, 1);
}
```

這個新方式的優點：
- ✅ 支援場景獨立的靜音狀態
- ✅ 刷新後重置為預設開啟
- ✅ 與 Login 場景完全獨立
- ✅ 可以用音頻按鈕控制

## 其他注意事項

如果你使用**方法 2（移除組件）**，請確保：
- GameController 的 `Game Scene BGM` 屬性已正確設置
- 否則 Game 場景將完全沒有音樂

## 完成後

修復完成後，你的音頻系統應該：
- Login 場景：獨立控制，記住狀態
- Game 場景：獨立控制，記住狀態，**只有一層音樂**
- 刷新後：兩個場景都重置為開啟狀態
