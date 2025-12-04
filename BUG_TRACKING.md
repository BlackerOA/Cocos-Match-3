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

## Bug #3: 階段轉換時計時器依然倒數 ⏳

### 問題描述
轉換階段顯示提示框時，遊戲應該暫停2秒（提示框顯示時長）。
- 目前：操作限時的timer依舊會倒數
- 結果：提示框消失後timer已經從15秒變成13秒

### 根本原因
在階段轉換流程中，計時器雖然被暫停，但可能在某個環節被重新啟動。
需要新增狀態標記防止在階段轉換期間重啟計時器。

### 解決方案
1. 在 `GameModel` 中新增 `isStageTransitioning` 標記
2. 在 `advanceToNextStage()` 開始時設置為 `true`
3. 在 Toast 顯示結束後設置為 `false`
4. 在 `GameController.animeEnd()` 中檢查此標記，防止重啟計時器

### 修改檔案
- `assets/Script/Model/GameModel.js` - 新增狀態標記和修改階段轉換邏輯
- `assets/Script/Controller/GameController.js` - 修改 `animeEnd()` 方法

### 修復進度
- ⏳ 待開始修復

---

## Bug #4: 遊戲結束時排行榜顯示舊數據 ⏳

### 問題描述
遊戲結束顯示排行榜時，如果是新玩家或新高分：
- 第一眼看到排行榜會顯示「未上榜」，沒有分數
- 要玩家手動刷新排行榜才會更新成正確的數據
- 原因：資料還沒上傳到排行榜伺服器，排行榜就把資料抓下來了

### 根本原因
時序問題：
1. `addScore()` 發送分數到伺服器（需要時間）
2. 500ms 後 `showLeaderboard()` 被呼叫
3. `showLeaderboard()` 從伺服器獲取資料
4. **但此時伺服器可能還沒處理完新分數**
5. 所以顯示的是舊的排行榜資料

### 解決方案
修改流程，確保在分數確認上傳成功並重新獲取排行榜後，才顯示排行榜：
- 移除 500ms 延遲顯示
- 在 `addScore()` 的 callback 中直接顯示排行榜
- 此時排行榜資料已經更新完成

### 修改檔案
- `assets/Script/Model/GameModel.js` - `saveScoreToLeaderboard()` 方法

### 修復進度
- ⏳ 待開始修復

---

## Bug #5: 第一階段達到第二階段目標，進入第二階段後分數顏色不立即變黃 ⏳

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
- `assets/Script/Model/GameModel.js` - `advanceToNextStage()` 方法

### 修復進度
- ⏳ 待開始修復

---

## 修復優先級

1. **高優先級**（影響遊戲邏輯）
   - Bug #1: 特殊方塊效果不觸發
   - Bug #2: 合併生成的特殊方塊沒有生成/觸發

2. **中優先級**（影響遊戲體驗）
   - Bug #3: 計時器異常倒數
   - Bug #4: 排行榜顯示舊數據

3. **低優先級**（視覺顯示問題）
   - Bug #5: 分數顏色延遲更新

---

## 測試清單

### Bug #1 測試
- [ ] 使用鳥+A組合消除
- [ ] 確認A中的wrap方塊會產生爆炸效果
- [ ] 確認A中的直線方塊會觸發直線消除

### Bug #2 測試
- [ ] 製造4個A連線的消除，同時有爆炸在附近
- [ ] 確認新生成的直線特殊方塊會被炸掉並觸發效果
- [ ] 製造5個A連線的消除，同時有爆炸在合併位置
- [ ] 確認新生成的鳥會被炸掉並觸發隨機消除

### Bug #3 測試
- [ ] 達到第一階段目標
- [ ] 觀察階段轉換Toast顯示期間，計時器是否停止
- [ ] 確認Toast消失後計時器從15秒開始

### Bug #4 測試
- [ ] 新玩家完成遊戲
- [ ] 確認排行榜第一次顯示就包含新分數
- [ ] 刷新排行榜確認數據一致

### Bug #5 測試
- [ ] 第一階段達到25000分以上
- [ ] 進入第二階段
- [ ] 確認分數立即顯示為金色

---

**最後更新**: 2025-12-04
**修復進度**: 2/5 (40%)
