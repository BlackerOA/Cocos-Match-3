cc.Class({
    extends: cc.Component,

    properties: {
        gameScene: {
            type: cc.Node,
            default: null
        }
    },

    onLoad() {
        this.label = this.getComponent(cc.Label);
    },

    start () {
        if (!this.gameScene) {
            this.gameScene = cc.find("Canvas/GameScene");
            if (!this.gameScene) {
                console.error("GameScene node not found!");
                return;
            }
        }

        const gameController = this.gameScene.getComponent("GameController");
        if (gameController) {
            this.gameModel = gameController.getGameModel();
            this.updateDisplay();
        } else {
            console.error("GameController not found on gameScene.");
        }
    },

    update (dt) {
        if (this.gameModel) {
            this.updateDisplay();
        }
    },

    updateDisplay() {
        if (!this.gameModel) return;

        const currentScore = this.gameModel.getCoin();
        const targetScore = this.gameModel.getCurrentStageTargetScore();
        const movesLeft = this.gameModel.movesLeft;

        // Bug #7 修復：直接比較顯示分數和目標分數，不依賴 stageReachedTarget
        // 這樣可以確保顏色變化和顯示分數同步
        const isReached = targetScore !== null && currentScore >= targetScore;

        // 更新文字內容
        if (targetScore !== null) {
            this.label.string = `${currentScore} / ${targetScore}`;
        } else {
            // 階段3沒有目標，只顯示當前分數
            this.label.string = `${currentScore}`;
        }

        // 更新顏色
        if (isReached) {
            // 已達標 -> 金色
            this.node.color = cc.color(255, 215, 0);
        } else if (movesLeft <= 3 && targetScore !== null && currentScore < targetScore) {
            // 剩餘步數<=3且未達標 -> 紅色
            this.node.color = cc.color(255, 0, 0);
        } else {
            // 正常狀態 -> 白色
            this.node.color = cc.color(255, 255, 255);
        }
    }
});
