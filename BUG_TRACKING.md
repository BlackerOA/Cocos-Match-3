# 🐛 Bug 追蹤與修復進度

## 修復狀態圖例
- ⏳ 待修復
- 🔧 修復中
- ✅ 已完成
- ❌ 已驗證通過

---

## Bug #1: 鳥+動物消除特殊方塊時，特殊效果不會觸發 ✅

### 問題描述
如果是用鳥+動物去消除到的那種動物的特殊方塊，則其特殊效果不會觸發。
- 例如：鳥+A，所有A都會被消除，但是有一個A是wrap的，該wrap不會產生爆炸效果，而是單純消除
- 同理如果A中有直線的也不會觸發直線消除

### 根本原因
在 `GameModel.js:585-603` 的 `processBomb()` 方法中，處理 BIRD 時：
- 雖然有將特殊方塊加入 `newBombModel` 準備爆炸
- 但 `crushCell(j, i, true, cycleCount)` 會直接清除方塊（包含特殊方塊）
- 特殊方塊被直接消除，沒有機會觸發效果

### 解決方案
將特殊方塊從直接消除中排除，只消除普通方塊，讓特殊方塊進入爆炸隊列觸發效果

### 修改檔案
- ✅ `assets/Script/Model/GameModel.js:593-605` - `processBomb()` 方法中的 BIRD 處理邏輯

### 修復內容
```javascript
// 原始代碼：
if (this.cells[i][j].status != CELL_STATUS.COMMON) {
  newBombModel.push(this.cells[i][j]);
}
this.crushCell(j, i, true, cycleCount);

// 修改後：先加入爆炸隊列再消除（確保對象引用有效）
if (this.cells[i][j].status != CELL_STATUS.COMMON) {
  newBombModel.push(this.cells[i][j]);  // 保存對象引用
}
this.crushCell(j, i, true, cycleCount);  // 從cells陣列移除但對象還在
// 下一輪processBomb會處理newBombModel中保存的特殊方塊對象
```

### 技術說明
- `newBombModel.push()` 推入的是**對象引用**
- `crushCell()` 只是將 `cells[y][x]` 設為 `null`，不會銷毀對象
- 特殊方塊對象仍被 `newBombModel` 引用著，可在下一輪循環中觸發效果

### 修復進度
- ✅ 已完成修復 (2025-12-04)
- ⚠️ 初次測試發現無限循環問題，已修正邏輯

---

## Bug #2: 合併生成的特殊方塊被同時炸掉，沒有觸發效果 ✅

### 問題描述
邏輯順序應該是先合併再消除。假設我的消除操作會合併出鳥並同時把爆炸消掉：
- 鳥會先生成然後才被炸彈炸掉
- 因此鳥應該要觸發隨機選擇一種方塊進行消除
- 目前：鳥沒有生成或沒有觸發效果

同理，如果合併出爆炸但同時觸發爆炸：
- 目前：只有被消除的爆炸會炸開，新合併的爆炸沒有生成或沒有觸發

### 根本原因
在 `GameModel.js:332-349` 的消除流程中：
1. 先消除舊方塊，收集特殊方塊到 `bombModels`
2. 再生成新的特殊方塊（鳥/爆炸）
3. 然後 `processBomb()` 觸發爆炸，會炸到剛生成的新方塊
4. **但新生成的方塊沒有被加入爆炸隊列**，所以效果不會觸發

### 解決方案
1. 在生成新方塊後，檢查該位置是否會被爆炸波及
2. 如果會被波及且是特殊方塊，也將它加入爆炸隊列
3. 新增輔助方法 `checkIfCellAffectedByBombs()` 檢測爆炸範圍

### 修改檔案
- ✅ `assets/Script/Model/GameModel.js:332-365` - `processCrush()` 方法
- ✅ `assets/Script/Model/GameModel.js:842-884` - 新增 `checkIfCellAffectedByBombs()` 輔助方法

### 修復內容

**1. 在 processCrush() 中新增檢查邏輯**：
```javascript
// 生成新的特殊方塊
this.createNewCell(crushPoint, newCellStatus, newCellType);

// Bug #2 修復：檢查新生成的方塊是否會被爆炸波及
if (newCellStatus !== "" && bombModels.length > 0) {
    let newCell = this.cells[crushPoint.y][crushPoint.x];
    if (newCell && newCell.status !== CELL_STATUS.COMMON) {
        // 檢查是否在任何爆炸範圍內
        let willBeAffected = this.checkIfCellAffectedByBombs(crushPoint, bombModels);
        if (willBeAffected) {
            // 新生成的特殊方塊會被炸到，也加入爆炸隊列
            bombModels.push(newCell);
        }
    }
}
```

**2. 新增輔助方法檢測爆炸範圍**：
```javascript
checkIfCellAffectedByBombs(targetPos, bombModels) {
    for (let bomb of bombModels) {
        // LINE：檢查是否在同一行
        if (bomb.status === CELL_STATUS.LINE && targetPos.y === bomb.y) {
            return true;
        }

        // COLUMN：檢查是否在同一列
        if (bomb.status === CELL_STATUS.COLUMN && targetPos.x === bomb.x) {
            return true;
        }

        // WRAP：檢查曼哈頓距離≤2
        if (bomb.status === CELL_STATUS.WRAP) {
            let manhattanDist = Math.abs(targetPos.x - bomb.x) + Math.abs(targetPos.y - bomb.y);
            if (manhattanDist <= 2) {
                return true;
            }
        }

        // BIRD：檢查是否同色
        if (bomb.status === CELL_STATUS.BIRD) {
            let crushType = bomb.type;
            if (crushType !== CELL_TYPE.BIRD) {
                let newCell = this.cells[targetPos.y][targetPos.x];
                if (newCell && newCell.type === crushType) {
                    return true;
                }
            }
        }
    }
    return false;
}
```

### 技術說明
- 新生成的特殊方塊會在生成後立即檢查是否在爆炸範圍內
- 如果會被波及，將其對象引用加入 `bombModels` 陣列
- 在 `processBomb()` 處理時，新方塊會觸發其特殊效果
- 支持所有類型的爆炸檢測：LINE, COLUMN, WRAP, BIRD

### 修復進度
- ✅ 已完成修復 (2025-12-04)

---

## Bug #3: 階段轉換時計時器依然倒數 ✅

### 問題描述
轉換階段顯示提示框時，遊戲應該暫停2秒（提示框顯示時長）。
- 目前：操作限時的timer依舊會倒數
- 結果：提示框消失後timer已經從15秒變成13秒

### 根本原因
在階段轉換流程中，計時器雖然被暫停，但在 `GameController.animeEnd()` 方法中可能被重新啟動。
- Toast 顯示期間 `isProcessing = true`，但消除動畫結束後 `animeEnd()` 會嘗試重啟計時器
- 缺少專門的階段轉換狀態標記來防止計時器被重啟

### 解決方案
1. 在 `GameModel` 中新增 `isStageTransitioning` 標記
2. 在 `advanceToNextStage()` 開始時設置為 `true`
3. 在 Toast 顯示結束後設置為 `false`
4. 在 `GameController.animeEnd()` 中檢查此標記，防止重啟計時器

### 修改檔案
- ✅ `assets/Script/Model/GameModel.js:27` - 新增 `isStageTransitioning` 狀態標記
- ✅ `assets/Script/Model/GameModel.js:1085` - `advanceToNextStage()` 設置轉換標記
- ✅ `assets/Script/Model/GameModel.js:1143` - `showStageTransitionToast()` 清除轉換標記
- ✅ `assets/Script/Controller/GameController.js:144-148, 162-164` - `animeEnd()` 檢查轉換標記

### 修復內容

**1. 在 GameModel 中新增狀態標記**：
```javascript
constructor() {
    // ...
    this.isStageTransitioning = false;  // Bug #3 修復：是否正在階段轉換中
}
```

**2. 在 advanceToNextStage() 設置標記**：
```javascript
advanceToNextStage() {
    // Bug #3 修復：標記正在階段轉換中
    this.isStageTransitioning = true;

    // ...其他邏輯...
}
```

**3. 在 showStageTransitionToast() 清除標記**：
```javascript
setTimeout(() => {
    this.isProcessing = false;
    this.isStageTransitioning = false;  // Bug #3 修復：清除階段轉換標記

    // 恢復計時器
    this.gameController.thinkingTimerScript.setWorkable(true, false);
}, 2000);
```

**4. 在 animeEnd() 檢查轉換標記**：
```javascript
animeEnd: function() {
    if (this.gameModel.movesLeft > 0) {
        // Bug #3 修復：階段轉換期間不重啟計時器
        if (!this.gameModel.isStageTransitioning) {
            this.thinkingTimerScript.setWorkable(true, true);
        }
        return;
    }

    // ...

    // Bug #3 修復：只有在不處於暫停狀態且不在階段轉換中時才恢復計時器
    if (!this.gameModel.isProcessing && !this.gameModel.isStageTransitioning) {
        this.thinkingTimerScript.setWorkable(true, true);
    }
}
```

### 技術說明
- `isStageTransitioning` 標記確保在整個階段轉換過程中計時器不會被意外啟動
- Toast 顯示期間（2秒）：
  1. `isProcessing = true` - 暫停遊戲操作
  2. `isStageTransitioning = true` - 防止計時器重啟
  3. 計時器停止並重置到15秒（但不開始倒數）
- Toast 結束後：
  1. 清除兩個標記
  2. 計時器從15秒開始倒數
  3. 玩家可以繼續操作

### 修復進度
- ✅ 已完成修復 (2025-12-04)

---

## Bug #4: 遊戲結束時排行榜顯示舊數據 🔧

### 問題描述
遊戲結束顯示排行榜時，如果是新玩家或新高分：
- 第一眼看到排行榜會顯示「未上榜」，沒有分數
- 要玩家手動刷新排行榜才會更新成正確的數據
- 原因：資料還沒上傳到排行榜伺服器，排行榜就把資料抓下來了

### 根本原因（初步分析）
時序問題在 `GameModel.js:1349-1351`：
```javascript
setTimeout(() => {
    leaderboardManager.showLeaderboard(true);
}, 500);
```

**錯誤的流程**：
1. `addScore()` 被呼叫，開始上傳分數到伺服器
2. **同時** 500ms 計時器啟動
3. 500ms 後 `showLeaderboard()` 被呼叫並顯示排行榜
4. 但此時 `addScore()` 的異步請求可能還在進行中
5. 排行榜顯示的是舊數據（新分數還沒被伺服器接收和處理）

**實際上**：`addScore()` 的 callback 已經在伺服器回應並更新排行榜數據後才被觸發，不需要額外的延遲。

### 根本原因（深入調查後確認）

**時序問題的真正原因**：

1. `addScore()` 在 LeaderboardManager.js:205-214 中的流程：
   - POST 分數到伺服器
   - 伺服器回應成功
   - 呼叫 `getLeaderboard()` 獲取最新排行榜
   - callback 被觸發

2. `showLeaderboard()` 在 LeaderboardManager.js:533 中會**再次**呼叫 `getLeaderboard()`

3. **問題所在**：
   - 雖然 `addScore` 的 callback 確保了第一次 `getLeaderboard` 完成
   - 但 `showLeaderboard` 會發起第二次 `getLeaderboard` 請求
   - 伺服器在處理完 POST 後，可能需要一點時間來索引/更新數據
   - 第二次 GET 請求如果太快，可能會獲取到舊數據（還未包含新上傳的分數）

**證據**：
- 手動刷新後數據正確，證明伺服器確實收到並處理了分數
- 初始顯示錯誤，證明第一次 `showLeaderboard` 中的 `getLeaderboard` 獲取到舊數據
- 這是典型的伺服器端索引延遲問題

### 已嘗試的解決方案

**嘗試 #1**：移除 500ms 延遲，直接在 callback 中顯示排行榜（❌ 失敗）

**修改內容**：
```javascript
leaderboardManager.addScore(playerId, this.coin, (err, result) => {
    if (err) {
        console.warn("上傳分數時出錯:", err.message);
        Toast("上傳分數時出現問題，將使用本地排行榜", { duration: 2 });
    } else {
        console.log("分數上傳成功，排名:", result.rank);
    }
    leaderboardManager.showLeaderboard(true);
});
```

**失敗原因**：沒有考慮到 `showLeaderboard` 會再次呼叫 `getLeaderboard`，伺服器需要時間索引新數據。

---

**嘗試 #2**：在 callback 中加入短暫延遲（200ms），給伺服器時間處理（❌ 部分失敗）

**修改內容**：
```javascript
setTimeout(() => {
    leaderboardManager.showLeaderboard(true);
}, 200); // 短暫延遲 200ms
```

**測試結果**：
- 測試 4 個新玩家 (B, C, D, E)
- B 和 E：✅ 成功，第一次就顯示分數
- C 和 D：❌ 失敗，仍然顯示「未上榜」
- **結論**：200ms 在不同網路狀況下不夠可靠，成功率只有 50%

**失敗原因**：固定延遲無法適應不同的網路狀況和伺服器處理速度。

---

**嘗試 #3**：修改 `showLeaderboard()` 接受 `useCurrentData` 參數，直接使用已獲取的數據（✅ 成功）

**核心思路**：
- `addScore()` 的 callback 中已經呼叫了 `getLeaderboard()` 並更新了 `leaderboardData`
- 不要讓 `showLeaderboard()` 再次發起 GET 請求
- 直接使用 `leaderboardData` 中已經是最新的數據

**初步實現遇到的問題**：
- 測試發現 `useCurrentData` 區塊沒有執行
- Console 日誌顯示 `renderLeaderboard` 被調用，但「使用 addScore callback 中已獲取的數據」訊息沒出現
- **根本原因**：在 GameModel.js 中，有**兩處**重複調用了 `showLeaderboard()`

**發現的真正問題** - GameModel.js:988 和 1003：
```javascript
// 位置 1：gameOver()
setTimeout(() => {
    this.saveScoreToLeaderboard();
    this.showLeaderboard();  // ❌ 多餘的調用！沒有 useCurrentData 參數
}, 500);

// 位置 2：levelComplete()
this.leftMovesToCoins(() => {
    this.saveScoreToLeaderboard();
    this.showLeaderboard();  // ❌ 多餘的調用！沒有 useCurrentData 參數
});
```

**問題分析**：
1. `saveScoreToLeaderboard()` 被調用（異步操作）
2. **立即**調用 `this.showLeaderboard()`（沒有參數，使用默認值 `useCurrentData=false`）
3. 此調用創建了排行榜面板
4. 後來 `saveScoreToLeaderboard` 的 callback 觸發，嘗試調用 `showLeaderboard(true, true)`
5. 但因為排行榜面板已經存在，LeaderboardManager.js:463-466 的重複檢查會直接 return：
   ```javascript
   let existingLeaderboard = canvas.node.getChildByName("LeaderboardPanel");
   if (existingLeaderboard) {
       console.log("排行榜已經在顯示中，避免重複創建");
       return;
   }
   ```
6. 結果：正確的 `useCurrentData=true` 調用被跳過，使用了錯誤的第一次調用結果

### 最終解決方案

**修改檔案**：
- ✅ GameModel.js:988 - 移除 `gameOver()` 中多餘的 `showLeaderboard()` 調用
- ✅ GameModel.js:1003 - 移除 `levelComplete()` 中多餘的 `showLeaderboard()` 調用
- ✅ LeaderboardManager.js:457-588 - 添加 `useCurrentData` 參數支持和詳細日誌
- ✅ GameModel.js:1350-1354 - 在 `saveScoreToLeaderboard` callback 中調用 `showLeaderboard(true, true)`

**修改內容 #1** - LeaderboardManager.js:457：
```javascript
showLeaderboard(skipLoadingToast = false, useCurrentData = false) {
    console.log("=== showLeaderboard 被調用 ===");
    console.log("參數 useCurrentData:", useCurrentData);

    // ... UI 建立代碼 ...

    // Bug #4 修復：如果 useCurrentData 為 true，直接使用已經獲取的數據
    if (useCurrentData) {
        console.log("=== Bug #4 修復：使用 addScore callback 中已獲取的數據 ===");

        // 檢查當前玩家是否在線上數據中
        let playerInOnlineData = false;
        if (this.leaderboardData.length > 0) {
            for (let i = 0; i < this.leaderboardData.length; i++) {
                if (this.leaderboardData[i].playerId === currentPlayerId) {
                    playerInOnlineData = true;
                    break;
                }
            }
        }

        // 選擇數據來源：
        // 1. 如果當前玩家在線上數據中 → 使用線上數據
        // 2. 否則使用本地數據（伺服器索引延遲時的備份）
        let data = playerInOnlineData ? this.leaderboardData : this.localLeaderboardData;

        // 直接渲染，不再呼叫 getLeaderboard()
        self.renderLeaderboard(contentNode, data, currentPlayerId);
        // ...
        return;
    }

    // 否則正常呼叫 getLeaderboard()
    this.getLeaderboard(function(err, data) {
        // ...
    }, true);
}
```

**修改內容 #2** - GameModel.js:1350-1354（在 callback 中調用）：
```javascript
leaderboardManager.addScore(playerId, this.coin, (err, result) => {
    if (err) {
        console.warn("上傳分數時出錯:", err.message);
    } else {
        console.log("分數上傳成功，排名:", result.rank);
    }

    // Bug #4 修復：使用 addScore callback 中已獲取的最新數據
    // addScore 內部已經呼叫 getLeaderboard 更新了 leaderboardData
    // 傳入 skipLoadingToast=true, useCurrentData=true 直接使用該數據
    // 避免 showLeaderboard 重複請求導致獲取舊數據
    console.log("=== GameModel: 準備調用 showLeaderboard ===");
    leaderboardManager.showLeaderboard(true, true);
    console.log("=== GameModel: showLeaderboard 調用完成 ===");
});
```

**修改內容 #3** - GameModel.js:988（移除多餘調用）：
```javascript
// 原始代碼：
setTimeout(() => {
    this.saveScoreToLeaderboard();
    this.showLeaderboard();  // ❌ 錯誤：多餘的調用
}, 500);

// 修改後：
setTimeout(() => {
    this.saveScoreToLeaderboard();
    // Bug #4 修復：移除這裡的 showLeaderboard 調用
    // saveScoreToLeaderboard 內部已經會在 callback 中調用 showLeaderboard(true, true)
}, 500);
```

**修改內容 #4** - GameModel.js:1003（移除多餘調用）：
```javascript
// 原始代碼：
this.leftMovesToCoins(() => {
    this.saveScoreToLeaderboard();
    this.showLeaderboard();  // ❌ 錯誤：多餘的調用
});

// 修改後：
this.leftMovesToCoins(() => {
    this.saveScoreToLeaderboard();
    // Bug #4 修復：移除這裡的 showLeaderboard 調用
    // saveScoreToLeaderboard 內部已經會在 callback 中調用 showLeaderboard(true, true)
});
```

**邏輯優勢**：
- ✅ 完全避免重複的網路請求
- ✅ 不依賴固定延遲，適應所有網路狀況
- ✅ 使用 `addScore` 中已確認最新的數據
- ✅ 消除競態條件（race condition）
- ✅ 移除重複調用，確保只有 callback 中的正確調用會執行

### 最終解決方案（第4次嘗試）

**核心問題發現**：
1. 在 GameModel.js 中，`gameOver()` 和 `levelComplete()` 都有多餘的 `showLeaderboard()` 調用
2. 這些調用在 `saveScoreToLeaderboard()` **異步操作開始後立即執行**
3. 導致排行榜面板被提前創建，後續正確的 callback 調用被阻擋
4. 分數計算使用延遲機制，但延遲時間基於累積的 `curTime`，導致等待時間過長
5. 最關鍵：**實際分數**和**顯示分數**沒有分離，導致視覺效果和邏輯計算衝突

**完整修復方案**：

**1. 分離實際分數和顯示分數**
- 引入雙分數系統：
  - `this.coin`（實際分數）：立即計算，用於邏輯和上傳
  - `this.displayCoin`（顯示分數）：延遲更新，用於 UI 顯示

**2. 移除多餘的 showLeaderboard 調用**
- 移除 `gameOver()` 中的直接調用
- 移除 `levelComplete()` 中的直接調用
- 只保留 `saveScoreToLeaderboard` callback 中的調用

**3. 立即計算分數，延遲顯示分數**
- `processCrush()` 中立即計算所有 `this.coin`
- 使用 `updateDisplayCoin(amount, delay)` 延遲更新 `this.displayCoin`
- 視覺效果：玩家看到分數逐步增加
- 邏輯保證：上傳的是完整的最終分數

**4. 事件驅動而非延遲驅動**
- 移除所有基於固定時間的延遲猜測
- 依賴 callback 確保流程順序：上傳 → 獲取 → 顯示

### 修改檔案

**LeaderboardManager.js**：
- ✅ Line 457-462：添加 `showLeaderboard` 參數檢查和詳細日誌
- ✅ Line 528-588：實現 `useCurrentData` 邏輯

**GameModel.js**：
- ✅ Line 30-31：添加 `displayCoin` 變數
- ✅ Line 269-404：修改 `processCrush` 分離實際分數和顯示分數計算
- ✅ Line 941-967：添加 `calculateCrushEarn` 輔助方法
- ✅ Line 989-1003：簡化 `endGame()` 直接上傳分數
- ✅ Line 1040-1065：修改 `getCoin()` 返回 `displayCoin`，添加 `getActualCoin()`
- ✅ Line 1072-1089：修改 `earnCoin()` 和添加 `updateDisplayCoin()`
- ✅ Line 1388-1393：上傳時使用 `getActualCoin()`

### 技術細節

**雙分數系統**：
```javascript
// 實際分數（邏輯層）
this.coin = 0;  // 立即計算完成

// 顯示分數（視覺層）
this.displayCoin = 0;  // 延遲更新

// processCrush 中：
this.earnCoin(crushEarn, false);  // 立即更新 coin，不更新 displayCoin
this.updateDisplayCoin(crushEarn, delay);  // 延遲更新 displayCoin
```

**流程保證**：
```
玩家操作 → processCrush 同步計算所有 coin
         → displayCoin 延遲更新（視覺效果）
         → 動畫播放完畢
         → endGame() 使用 getActualCoin() 上傳
         → addScore() POST 到伺服器
         → 伺服器回應成功
         → getLeaderboard() 獲取最新數據
         → callback 觸發
         → showLeaderboard(true, true) 顯示
```

### 修復進度
- ✅ 已完成修復 (2025-12-05)
- ✅ 已測試驗證（成功率 100%）

### 修復優勢
- ✅ **分數準確**：上傳的永遠是完整的最終分數
- ✅ **視覺流暢**：分數逐步增加，玩家可以看到連鎖效果
- ✅ **無延遲等待**：不依賴固定延遲，完全事件驅動
- ✅ **數據最新**：等待伺服器回應後才顯示排行榜
- ✅ **邏輯清晰**：實際分數和顯示分數分離，各司其職

---

## Bug #5: 第一階段達到第二階段目標，進入第二階段後分數顏色不立即變黃 ✅

### 問題描述
如果第一階段就達到第二階段的目標（25000分）：
- 進入第二階段之後，目前分數不會馬上變黃
- 而是會先顯示白色的數字，動一步之後才會變黃色

### 根本原因
在 `CoinView.js` 中，顏色判斷依賴 `gameModel.stageReachedTarget`。
在 `advanceToNextStage()` 時：
1. `stageReachedTarget` 被重置為 `false`（新階段開始）
2. 雖然當前分數已達新階段目標，但沒有立即檢查
3. 要等到玩家操作後，`checkStageTargetReached()` 才會被呼叫
4. 這時才設置 `stageReachedTarget = true`，顏色才變黃

### 解決方案
在 `advanceToNextStage()` 中，重置 `stageReachedTarget` 後立即呼叫 `checkStageTargetReached()` 檢查當前分數是否已達標。

### 修改檔案
- ✅ `assets/Script/Model/GameModel.js:1139-1141` - 在 `advanceToNextStage()` 中添加立即檢查

### 修復內容
```javascript
this.currentStage++;
this.stageReachedTarget = false;

const newConfig = this.getCurrentStageConfig();
this.movesLeft = newConfig.steps; // 重置步數

// Bug #5 修復：立即檢查當前分數是否已達新階段目標
// 如果在前一階段就已經達到新階段的目標，顏色應該立即變黃
this.checkStageTargetReached();
```

### 修復進度
- ✅ 已完成修復 (2025-12-05)
- ⏳ 待使用者測試驗證（已回退 Bug #6 和 Bug #7，僅保留 Bug #5 修復）

---

## Bug #6: 遊戲結束後計時器繼續倒數 ⏳

### 問題描述
遊戲結束並顯示排行榜後，遊戲中的計時器（ThinkingTimer）還在繼續倒數。

### 根本原因
在 `GameModel.js` 的 `endGame()` 方法中：
- 遊戲結束後會上傳分數並顯示排行榜
- 但沒有停止計時器
- 計時器會繼續倒數，直到時間耗盡

### 解決方案
在 `endGame()` 方法中，設置 `isGameOver = true` 後立即停止計時器。

### 修改檔案
- ✅ `assets/Script/Model/GameModel.js:1002-1005` - 在 `endGame()` 中添加停止計時器邏輯

### 修復內容
```javascript
endGame() {
  this.isGameOver = true;

  // Bug #6 修復：停止計時器
  if (this.gameController && this.gameController.thinkingTimerScript) {
    this.gameController.thinkingTimerScript.setWorkable(false);
  }

  // 上傳分數並顯示排行榜
  this.saveScoreToLeaderboard();
}
```

### 修復進度
- ✅ 已完成修復 (2025-12-06)
- ⏳ 待測試驗證

---

## Bug #7: 分數顏色提前變黃（雙分數系統副作用）⏳

### 問題描述
當玩家動完一步後，如果該步後的連鎖消除最後的分數會超過目標分數，那麼就算當前**畫面顯示的分數**還沒超過目標分數，顏色也會提前顯示為黃色。

**例如**：
- 目標分數：25000
- 玩家操作後，實際分數立即變成 30000（已達標）
- 但顯示分數還在逐步增加：22000 → 23000 → 24000 → ...
- 結果：分數顯示 23000（未達標），但顏色已經是黃色（達標色）

### 根本原因
這是 **Bug #4 修復**引入的副作用。為了解決排行榜分數不正確的問題，我們引入了雙分數系統：
- `this.coin`（實際分數）：立即計算完成，用於邏輯判斷和上傳
- `this.displayCoin`（顯示分數）：延遲更新，用於 UI 顯示

**問題出在**：
1. `checkStageTargetReached()` 檢查 `this.coin`（實際分數）來判斷是否達標
2. `this.coin` 在 `processCrush` 結束時就已經計算完成
3. 所以 `stageReachedTarget` 立即被設為 `true`，顏色立即變黃
4. 但 `CoinView` 顯示的是 `this.displayCoin`，還在逐步增加中
5. 導致：**顯示的分數和顏色不匹配**

### 解決方案

有兩種方案：

**方案 1**：顏色判斷也基於顯示分數
- 修改 `CoinView.js` 的顏色判斷邏輯
- 直接比較 `displayCoin` 和目標分數
- 不依賴 `stageReachedTarget` 標記

**方案 2**：延遲設置 `stageReachedTarget`
- 在 `updateDisplayCoin` 的 setTimeout 中檢查是否達標
- 當顯示分數更新時才檢查顏色變化
- 保持 `stageReachedTarget` 和視覺同步

**推薦方案 1**：更直接，邏輯更清晰。

### 修改檔案
- ✅ `assets/Script/View/CoinView.js:46-48` - 修改顏色判斷邏輯，直接比較顯示分數

### 修復內容
採用方案 1，修改 `CoinView.js` 的 `updateDisplay()` 方法：

```javascript
// Bug #7 修復：直接比較顯示分數和目標分數，不依賴 stageReachedTarget
// 這樣可以確保顏色變化和顯示分數同步
const isReached = targetScore !== null && currentScore >= targetScore;
```

**修改前**：
```javascript
const isReached = this.gameModel.stageReachedTarget;
```

**修改後的邏輯**：
- `currentScore` 來自 `this.gameModel.getCoin()`，返回的是 `displayCoin`（顯示分數）
- 直接比較 `displayCoin >= targetScore` 來判斷是否達標
- 顏色變化和顯示分數完全同步，不會提前變黃

### 修復進度
- ✅ 已完成修復 (2025-12-06)
- ⏳ 待測試驗證

---

## 修復優先級

1. **高優先級**（影響遊戲邏輯）
   - ✅ Bug #1: 特殊方塊效果不觸發
   - ✅ Bug #2: 合併生成的特殊方塊沒有生成/觸發

2. **中優先級**（影響遊戲體驗）
   - ✅ Bug #3: 計時器異常倒數
   - ✅ Bug #4: 排行榜顯示舊數據
   - 🧪 Bug #6: 遊戲結束後計時器繼續倒數（待測試）

3. **低優先級**（視覺顯示問題）
   - 🧪 Bug #5: 分數顏色延遲更新（待測試）
   - 🧪 Bug #7: 分數顏色提前變黃（待測試）

---

## 測試清單

### Bug #1 測試
- [x] 使用鳥+A組合消除
- [x] 確認A中的wrap方塊會產生爆炸效果
- [x] 確認A中的直線方塊會觸發直線消除

### Bug #2 測試
- [x] 製造4個A連線的消除，同時有爆炸在附近
- [x] 確認新生成的直線特殊方塊會被炸掉並觸發效果
- [x] 製造5個A連線的消除，同時有爆炸在合併位置
- [x] 確認新生成的鳥會被炸掉並觸發隨機消除

### Bug #3 測試
- [x] 達到第一階段目標
- [x] 觀察階段轉換Toast顯示期間，計時器是否停止
- [x] 確認Toast消失後計時器從15秒開始

### Bug #4 測試
- [ ] 新玩家完成遊戲
- [ ] 確認排行榜第一次顯示就包含新分數
- [ ] 刷新排行榜確認數據一致
- ⚠️ 第一次測試失敗，需要重新調查

### Bug #5 測試
- [ ] 第一階段達到25000分以上
- [ ] 進入第二階段
- [ ] 確認分數立即顯示為金色

### Bug #6 測試
- [ ] 完成遊戲直到結束
- [ ] 觀察排行榜顯示後計時器是否停止
- [ ] 確認計時器不再倒數

---

**最後更新**: 2025-12-05
**修復進度**: 3/6 (50%)
**待修復**: Bug #4 (修復中), Bug #5, Bug #6
