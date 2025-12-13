import GameModel from "../Model/GameModel";
import Toast from '../Utils/Toast';
import GlobalAudioManager from '../Utils/GlobalAudioManager';

cc.Class({
  extends: cc.Component,

  properties: {
    grid: {
        default: null,
        type: cc.Node
    },
    audioButton: {
        default: null,
        type: cc.Node
    },
    soundIcon: {
        default: null,
        type: cc.SpriteFrame,
        tooltip: "音樂播放圖標"
    },
    muteIcon: {
        default: null,
        type: cc.SpriteFrame,
        tooltip: "音樂靜音圖標"
    },
    audioSource: {
        default: null,
        type: cc.AudioSource
    },
    gameSceneBGM: {
        default: null,
        type: cc.AudioClip,
        tooltip: "遊戲場景背景音樂"
    },
    hintTimer: {
      default: null,
      type: cc.Node
    },
    thinkingTimer: {
      default: null,
      type: cc.Node,
    },
    comboLabel: {
      default: null,
      type: cc.Node,
      tooltip: "顯示連擊數的標籤"
    }
  },

  // use this for initialization
  onLoad: function () {
    if (!this.thinkingTimer) {
      this.thinkingTimer = cc.find("Canvas/ThinkingTimeLabel");
    }
    if (!this.comboLabel) {
      this.comboLabel = cc.find("Canvas/ComboLabel");
    }

    // 使用全局音頻管理器播放Game場景的背景音樂
    if (this.gameSceneBGM) {
      GlobalAudioManager.playBGM('Game', this.gameSceneBGM, true, 1);
    }

    let audioButton = this.node.parent.getChildByName('audioButton')
    audioButton.on('click', this.callback, this)
    this.gameModel = new GameModel();
    this.gameModel.setGameController(this);
    this.gameModel.init(4);
    this.gridScript = this.grid.getComponent("GridView");
    this.gridScript.setController(this);
    this.gridScript.initWithCellModels(this.gameModel.getCells());
    this.hintTimerScript = this.hintTimer.getComponent("HintTimer");
    this.hintTimerScript.setGameController(this);
    this.thinkingTimerScript = this.thinkingTimer.getComponent("ThinkingTimer");
    this.thinkingTimerScript.setGameController(this);

    // 初始化 comboLabel
    if (this.comboLabel) {
      this.comboLabelComponent = this.comboLabel.getComponent(cc.Label);
      if (this.comboLabelComponent) {
        this.comboLabelComponent.string = "";  // 初始時不顯示
        this.comboLabel.opacity = 0;  // 初始時隱藏
      }
    }

    // 更新音頻按鈕圖標為當前狀態
    this.updateAudioButtonIcon();
  },

  start: function() {
    // ========== 舊目標系統（已停用） ==========
    // this.gameModel.nextGoal();

    this.gridScript.setHints(this.getHints());
    this.hintTimerScript.setInterval(2);
    this.hintTimerScript.setWorkable(true);

    // 設置思考計時器
    this.thinkingTimerScript.setTimeLimit(15); // 設置15秒思考時間
    this.thinkingTimerScript.setWorkable(true); // 啟動計時器
  },

  callback: function () {
    // 使用全局音頻管理器切換Game場景的靜音狀態
    const isMuted = GlobalAudioManager.toggleMute('Game');

    // 更新按鈕圖標
    this.updateAudioButtonIcon();

    // 顯示 Toast
    Toast(isMuted ? '關閉背景音樂🎵' : '打開背景音樂🎵');
  },

  /**
   * 更新音頻按鈕圖標
   */
  updateAudioButtonIcon: function() {
    let audioButton = this.node.parent.getChildByName('audioButton');
    if (!audioButton) return;

    let buttonComponent = audioButton.getComponent(cc.Button);
    let background = audioButton.getChildByName('Background');

    if (background && buttonComponent) {
      let sprite = background.getComponent(cc.Sprite);
      if (sprite) {
        // 根據Game場景的靜音狀態選擇圖標
        let targetIcon = GlobalAudioManager.isMuted('Game') ? this.muteIcon : this.soundIcon;

        // 同時更新 Sprite 和 Button 的 normalSprite
        sprite.spriteFrame = targetIcon;
        buttonComponent.normalSprite = targetIcon;
      }
    }
  },

  selectCell: function (pos) {
    if (this.isGameOver) {
      console.log("遊戲已結束，無法進行操作。");
      return [[], []];
    }
    return this.gameModel.selectCell(pos);
  },

  cleanCmd: function () {
    this.gameModel.cleanCmd();
  },

  getGameModel() {
    return this.gameModel;
  },

  getCoin() {
    return this.gameModel.getCoin();
  },

  setCoin(amount) {
    this.gameModel.setCoin(amount);
  },

  checkEndGame() {
    this.gameModel.checkEndGame();
  },
  isEndGame() {
    return this.gameModel.isEndGame();
  },

  hintTimerTrigger: function() {
    this.gridScript.showHint();
  },

  getHints: function() {
    return this.gameModel.findAllHints();
  },

  consumeMove() {
    this.hintTimerScript.setWorkable(false);
    this.thinkingTimerScript.setWorkable(false);
  },

  logicCalculateEnd: function() {
    this.gridScript.setHints(this.getHints());
  },

  animeEnd: function() {
    this.hintTimerScript.setWorkable(true);

    // 只有在步數用完時才需要等待分數計算完成
    // 如果步數還有，立刻重置計時器
    if (this.gameModel.movesLeft > 0) {
      // Bug #3 修復：階段轉換期間不重啟計時器
      if (!this.gameModel.isStageTransitioning) {
        // 步數還有，立刻重置計時器
        this.thinkingTimerScript.setWorkable(true, true);
      }
      return;
    }

    // 步數用完的情況，需要等待分數計算完成
    if (this.gameModel.isScoringComplete === false) {
      setTimeout(() => {
        this.animeEnd(); // 重新呼叫自己
      }, 100);
      return;
    }

    // 分數計算完成，且步數用完
    // Bug #3 修復：只有在不處於暫停狀態且不在階段轉換中時才恢復計時器
    if (!this.gameModel.isProcessing && !this.gameModel.isStageTransitioning) {
      this.thinkingTimerScript.setWorkable(true, true);
    }
  },

  autoSelectCells: function (pos1, pos2) {
    console.log(`自動執行消除操作: (${pos1.x},${pos1.y}) <-> (${pos2.x},${pos2.y})`);
    this.gridScript.selectCell(pos1);
    this.gridScript.selectCell(pos2);
  },

  restartGame() {
    console.log("GameController: 正在重啟遊戲...");
    
    // 停止所有計時器
    if (this.gameModel) {
        // 標記遊戲結束，避免任何進行中的邏輯
        this.gameModel.isGameOver = true;
    }
    
    // 停止提示計時器
    if (this.hintTimerScript) {
        this.hintTimerScript.setWorkable(false);
    }

    // 停止思考計時器
    if (this.thinkingTimerScript) {
      this.thinkingTimerScript.setWorkable(false);
    }
    
    // 清除所有運行中的動作
    this.node.stopAllActions();
    
    // 找到場景中所有節點並停止動作
    let canvas = cc.director.getScene().getChildByName('Canvas');
    if (canvas) {
        let allNodes = [];
        this.collectAllNodes(canvas, allNodes);
        
        // 停止所有節點的動作和計時器
        allNodes.forEach(node => {
            node.stopAllActions();
        });
    }
    
    // 確保音效停止
    if (this.audioSource && this.audioSource._state === 1) {
        this.audioSource.pause();
    }

    cc.loader.onProgress = null; // 清除載入進度回調
    
    // 預加載登入場景，然後載入
    try {
        cc.director.preloadScene("Login", function() {
            cc.director.loadScene("Login");
        });
    } catch (e) {
        console.error("載入Login場景失敗，嘗試直接切換:", e);
        try {
            // 直接切換場景
            cc.director.loadScene("Login");
        } catch (err) {
            console.error("直接載入場景失敗，嘗試重啟遊戲:", err);
            try {
                cc.game.restart();
            } catch (finalErr) {
                console.error("重啟遊戲失敗:", finalErr);
                // 顯示錯誤提示給用戶
                const Toast = require('../Utils/Toast');
                if (Toast) {
                    Toast("遊戲重啟失敗，請重新開啟應用", { duration: 3, gravity: "CENTER" });
                }
            }
        }
    }
  },

  collectAllNodes(node, result) {
    if (!node) return;
    
    result.push(node);
    
    const children = node.children;
    if (children && children.length > 0) {
        for (let i = 0; i < children.length; i++) {
            this.collectAllNodes(children[i], result);
        }
    }
  },

  // ========== 舊目標系統方法已完全移除 ==========

  startThinkingTimer() {
    this.gameModel.startThinkingTimer();
  },

  thinkingTimerTrigger: function() {
    if (!this.gameModel.isGameOver && !this.gameModel.isProcessing) {
        // 時間到自動消除提示的組合
        const currentHint = this.gameModel.currentHint;
        if (currentHint && currentHint.swapPositions.length >= 2) {
            console.log(`思考時間到，自動執行提示的消除操作`);
            const pos1 = cc.v2(currentHint.swapPositions[0][1], currentHint.swapPositions[0][0]);
            const pos2 = cc.v2(currentHint.swapPositions[1][1], currentHint.swapPositions[1][0]);
            this.autoSelectCells(pos1, pos2);
        }
    }
  },

  getCurrentThinkingTime: function() {
    if (this.thinkingTimerScript) {
        return Math.ceil(this.thinkingTimerScript.getCurrentTime());
    }
    return 0;
  },

  showCombo: function(comboCount) {
    if (!this.comboLabel || !this.comboLabelComponent) return;
    
    // 停止當前可能正在運行的動作
    this.comboLabel.stopAllActions();
    
    // 設置 Combo 文字
    this.comboLabelComponent.string = "Combo " + comboCount + "!";
    
    // 重置屬性
    this.comboLabel.opacity = 255;
    this.comboLabel.scale = 0;  // 從0開始，實現彈出效果
    
    // 根據 combo 數量設置不同顏色
    if (comboCount >= 10) {
        this.comboLabel.color = cc.color(255, 0, 0);  // 紅色
    } else if (comboCount >= 5) {
        this.comboLabel.color = cc.color(255, 165, 0);  // 橙色
    } else {
        this.comboLabel.color = cc.color(255, 255, 255);  // 白色
    }
    
    // 創建更生動的動畫效果
    const popIn = cc.scaleTo(0.2, 1.3).easing(cc.easeBackOut());  // 彈出效果
    const scaleNormal = cc.scaleTo(0.1, 1.0);  // 回到正常大小
    const stay = cc.delayTime(0.8);  // 停留時間
    
    // 創建淡出效果
    const fadeOut = cc.fadeTo(0.3, 0);
    
    // 重置位置的回調
    const resetPosition = cc.callFunc(() => {
        if (this.comboLabel) {
            this.comboLabel.y = this.comboLabel.y + 0;  // 重置 y 坐標
        }
    });
    
    // 組合動畫序列
    const sequence = cc.sequence(
      popIn,                         // 彈出
      scaleNormal,                   // 恢復正常大小
      stay,                          // 停留
      fadeOut,                       // 淡出
      resetPosition                  // 重置位置
    );
    
    // 運行動畫序列
    this.comboLabel.runAction(sequence);
  },

  /**
   * 顯示階段過場提示框
   * @param {number} stage - 新階段編號
   * @param {number|null} targetScore - 目標分數
   */
  showStageTransition: function(stage, targetScore) {
    if (!this.stageTransition) {
      console.warn("StageTransition node not found!");
      return;
    }

    const stageTransitionScript = this.stageTransition.getComponent("StageTransitionView");
    if (!stageTransitionScript) {
      console.error("StageTransitionView component not found!");
      return;
    }

    // 顯示提示框，持續2秒
    stageTransitionScript.show(stage, targetScore, 2, () => {
      console.log(`階段過場動畫完成，繼續遊戲`);
    });
  },
});