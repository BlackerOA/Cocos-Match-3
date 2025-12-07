import {CELL_STATUS, CELL_WIDTH, CELL_HEIGHT, ANITIME, CELL_TYPE} from '../Model/ConstValue';

cc.Class({
    extends: cc.Component,

    properties: {
        defaultFrame:{
            default: null,
            type: cc.SpriteFrame
        },
        blueFrame:{
            default: null,
            type: cc.SpriteFrame
        },
        orangeFrame:{
            default: null,
            type: cc.SpriteFrame
        }
    },

    // use this for initialization
    onLoad: function () {
        this.isSelect = false;

        // 創建一個用於提示效果的邊框節點
        this.hintBorder = new cc.Node("HintBorder");
        this.hintBorder.parent = this.node;

        // 為邊框添加圖形組件
        let graphics = this.hintBorder.addComponent(cc.Graphics);

        // 設置較寬的邊框線寬，使其更明顯
        graphics.lineWidth = 6;

        // 使用鮮豔的紅色，在任何背景下都非常醒目
        graphics.strokeColor = cc.color(255, 0, 0, 255); // 鮮紅色

        // 繪製略大於方塊的矩形
        const borderSize = Math.min(CELL_WIDTH, CELL_HEIGHT) - 8;
        graphics.rect(-borderSize/2, -borderSize/2, borderSize, borderSize);
        graphics.stroke();

        // 初始時隱藏邊框
        this.hintBorder.active = false;

        // 獲取 ArrowEffect 節點及其子節點引用
        this.arrowEffect = this.node.getChildByName("ArrowEffect");
        if (this.arrowEffect) {
            this.arrowUp = this.arrowEffect.getChildByName("ArrowUp");
            this.arrowDown = this.arrowEffect.getChildByName("ArrowDown");
            this.arrowLeft = this.arrowEffect.getChildByName("ArrowLeft");
            this.arrowRight = this.arrowEffect.getChildByName("ArrowRight");

            // 初始化時隱藏所有箭頭
            this.hideAllArrows();
        }
    },
    
    initWithModel: function(model){
        this.model = model;
        var x = model.startX;
        var y = model.startY;
        this.node.x = CELL_WIDTH * (x - 0.5);
        this.node.y = CELL_HEIGHT * (y - 0.5);

        // 根據 status 更新 sprite 和 arrow 顯示
        this.updateSpriteAndArrow();
    },
    
    setGridViewScript: function(gridViewScript) {
        this.gridViewScript = gridViewScript;
    },

    // 执行移动动作
    updateView: function(){
        var cmd = this.model.cmd;
        if(cmd.length <= 0){
            return ;
        }

        // 在執行動作前，先更新 sprite 和 arrow 顯示（重要！）
        // 這確保了當 cell 交換位置時，外觀也會正確更新
        this.updateSpriteAndArrow();

        var actionArray = [];
        var curTime = 0;
        let deathTime = 0;
        for(var i in cmd){
            if( cmd[i].playTime > curTime){
                var delay = cc.delayTime(cmd[i].playTime - curTime);
                actionArray.push(delay);
            }
            if(cmd[i].action == "moveTo"){
                var x = (cmd[i].pos.x - 0.5) * CELL_WIDTH;
                var y = (cmd[i].pos.y - 0.5) * CELL_HEIGHT;
                var move = cc.moveTo(ANITIME.TOUCH_MOVE, cc.v2(x,y));
                actionArray.push(move);
            }
            else if(cmd[i].action == "toDie"){
                // 所有水果（包括榴槤）都使用相同的消除邏輯
                // 搖晃動畫由 "toShake" 命令處理，這裡只負責銷毀節點
                var callFunc = cc.callFunc(function(){
                    this.node.destroy();
                },this);
                actionArray.push(callFunc);
                deathTime += curTime;
            }
            else if(cmd[i].action == "setVisible"){
                let isVisible = cmd[i].isVisible;
                actionArray.push(cc.callFunc(function(){
                    if(isVisible){
                        this.node.opacity = 255;
                    }
                    else{
                        this.node.opacity = 0;
                    }
                },this));
            }
            else if(cmd[i].action == "toShake"){
                let rotateRight = cc.rotateBy(0.06,30);
                let rotateLeft = cc.rotateBy(0.12, -60);
                actionArray.push(cc.repeat(cc.sequence(rotateRight, rotateLeft, rotateRight), 2));
            }
            curTime = cmd[i].playTime + cmd[i].keepTime;
        }

        // goalLeft--(view)
        if (this.model.goalMinus) {
            setTimeout(() => { this.gridViewScript.goalLeftMinus(); }, deathTime * 1000);
        }
        /**
         * 智障的引擎设计，一群SB
         */
        if(actionArray.length == 1){
            this.node.runAction(actionArray[0]);
        }
        else{
            this.node.runAction(cc.sequence(...actionArray));
        }

    },

    setSelect: function(flag){
        var bg = this.node.getChildByName("select");

        if(flag == false && this.isSelect){
            // 取消選擇時只停止選擇動畫，不要停止移動動畫
            // 我們通過保存選擇動畫的引用來只停止它
            if (this.selectAction) {
                this.node.stopAction(this.selectAction);
                this.selectAction = null;
            }
            this.node.scale = 1.0;
            this.updateSpriteAndArrow();
        }
        else if(flag){
            // 選擇時播放縮放動畫
            this.playClickAnimation();
        }

        bg.active = flag;
        this.isSelect = flag;
    },

    // 啟動更醒目的提示效果
    startHintEffect: function() {
        if (this.hintAction) return; // 如果已經有提示動畫正在運行則不重複開始
        
        // 確保邊框可見
        this.hintBorder.active = true;
        
        // 重置邊框透明度和縮放
        this.hintBorder.opacity = 255;
        this.hintBorder.scale = 1.0;
        
        // 建立更醒目的邊框動畫：縮放 + 閃爍效果
        const scaleUp = cc.scaleTo(0.5, 1.1);
        const scaleDown = cc.scaleTo(0.5, 0.9);
        const fadeOut = cc.fadeTo(0.5, 180);
        const fadeIn = cc.fadeTo(0.5, 255);
        
        // 組合動畫：同時進行縮放和透明度變化
        const pulseAction = cc.spawn(
            cc.sequence(scaleUp, scaleDown),
            cc.sequence(fadeOut, fadeIn)
        );
        
        // 重複執行動畫
        this.hintAction = this.hintBorder.runAction(cc.repeatForever(pulseAction));
        
        // 設置自動停止計時器
        this.hintTimer = setTimeout(() => {
            this.stopHintEffect();
        }, 4000); // 4秒後自動停止提示
    },

    // 停止高亮邊框提示效果
    stopHintEffect: function() {
        // 清除計時器
        if (this.hintTimer) {
            clearTimeout(this.hintTimer);
            this.hintTimer = null;
        }
        
        // 停止動畫
        if (this.hintAction) {
            this.hintBorder.stopAction(this.hintAction);
            this.hintAction = null;
        }
        
        // 隱藏邊框
        this.hintBorder.active = false;
    },

    // 替換舊的閃爍方法，調用新的提示效果
    startBlinking: function() {
        this.startHintEffect();
    },

    // 替換舊的停止閃爍方法
    stopBlinking: function() {
        this.stopHintEffect();
    },

    // ==================== 水果 Sprite 切換和箭頭控制 ====================

    // 更新 sprite 和箭頭顯示
    updateSpriteAndArrow: function() {
        if (!this.model) return;

        let sprite = this.node.getComponent(cc.Sprite);
        if (!sprite) return;

        // 根據 status 切換 sprite frame
        switch(this.model.status) {
            case CELL_STATUS.COMMON:
            case CELL_STATUS.CLICK:
                // 一般狀態使用 defaultFrame
                sprite.spriteFrame = this.defaultFrame;
                this.hideAllArrows();
                break;

            case CELL_STATUS.LINE:
            case CELL_STATUS.COLUMN:
                // 直線狀態使用藍色 frame
                sprite.spriteFrame = this.blueFrame;
                this.showArrowsForStatus(this.model.status);
                break;

            case CELL_STATUS.WRAP:
                // 爆炸狀態使用橘色 frame
                sprite.spriteFrame = this.orangeFrame;
                this.showArrowsForStatus(this.model.status);
                break;

            case CELL_STATUS.BIRD:
                // BIRD 狀態使用 defaultFrame（榴槤沒有藍框橘框版本）
                sprite.spriteFrame = this.defaultFrame;
                this.hideAllArrows();
                break;

            default:
                sprite.spriteFrame = this.defaultFrame;
                this.hideAllArrows();
                break;
        }
    },

    // 根據 status 顯示對應箭頭
    showArrowsForStatus: function(status) {
        this.hideAllArrows();

        if (!this.arrowEffect) return;

        switch(status) {
            case CELL_STATUS.LINE:
                // 橫向直線：顯示左右箭頭
                this.playHorizontalArrowAnimation();
                break;

            case CELL_STATUS.COLUMN:
                // 縱向直線：顯示上下箭頭
                this.playVerticalArrowAnimation();
                break;

            case CELL_STATUS.WRAP:
                // 爆炸：顯示四個方向箭頭
                this.playWrapArrowAnimation();
                break;
        }
    },

    // 隱藏所有箭頭
    hideAllArrows: function() {
        if (!this.arrowEffect) return;

        if (this.arrowUp) {
            this.arrowUp.stopAllActions();
            this.arrowUp.active = false;
        }
        if (this.arrowDown) {
            this.arrowDown.stopAllActions();
            this.arrowDown.active = false;
        }
        if (this.arrowLeft) {
            this.arrowLeft.stopAllActions();
            this.arrowLeft.active = false;
        }
        if (this.arrowRight) {
            this.arrowRight.stopAllActions();
            this.arrowRight.active = false;
        }
    },

    // 橫向箭頭動畫（左右箭頭向外移動）
    playHorizontalArrowAnimation: function() {
        if (!this.arrowLeft || !this.arrowRight) return;

        this.arrowLeft.active = true;
        this.arrowRight.active = true;

        // 左箭頭：向左移動再回來
        let leftMoveOut = cc.moveBy(0.5, cc.v2(-10, 0));
        let leftMoveIn = cc.moveBy(0.5, cc.v2(10, 0));
        let leftSequence = cc.sequence(leftMoveOut, leftMoveIn);
        this.arrowLeft.runAction(cc.repeatForever(leftSequence));

        // 右箭頭：向右移動再回來
        let rightMoveOut = cc.moveBy(0.5, cc.v2(10, 0));
        let rightMoveIn = cc.moveBy(0.5, cc.v2(-10, 0));
        let rightSequence = cc.sequence(rightMoveOut, rightMoveIn);
        this.arrowRight.runAction(cc.repeatForever(rightSequence));
    },

    // 縱向箭頭動畫（上下箭頭向外移動）
    playVerticalArrowAnimation: function() {
        if (!this.arrowUp || !this.arrowDown) return;

        this.arrowUp.active = true;
        this.arrowDown.active = true;

        // 上箭頭：向上移動再回來
        let upMoveOut = cc.moveBy(0.5, cc.v2(0, 10));
        let upMoveIn = cc.moveBy(0.5, cc.v2(0, -10));
        let upSequence = cc.sequence(upMoveOut, upMoveIn);
        this.arrowUp.runAction(cc.repeatForever(upSequence));

        // 下箭頭：向下移動再回來
        let downMoveOut = cc.moveBy(0.5, cc.v2(0, -10));
        let downMoveIn = cc.moveBy(0.5, cc.v2(0, 10));
        let downSequence = cc.sequence(downMoveOut, downMoveIn);
        this.arrowDown.runAction(cc.repeatForever(downSequence));
    },

    // 爆炸箭頭動畫（四個方向箭頭向外移動）
    playWrapArrowAnimation: function() {
        if (!this.arrowUp || !this.arrowDown || !this.arrowLeft || !this.arrowRight) return;

        this.arrowUp.active = true;
        this.arrowDown.active = true;
        this.arrowLeft.active = true;
        this.arrowRight.active = true;

        // 上箭頭：向上移動再回來
        let upMoveOut = cc.moveBy(0.5, cc.v2(0, 10));
        let upMoveIn = cc.moveBy(0.5, cc.v2(0, -10));
        let upSequence = cc.sequence(upMoveOut, upMoveIn);
        this.arrowUp.runAction(cc.repeatForever(upSequence));

        // 下箭頭：向下移動再回來
        let downMoveOut = cc.moveBy(0.5, cc.v2(0, -10));
        let downMoveIn = cc.moveBy(0.5, cc.v2(0, 10));
        let downSequence = cc.sequence(downMoveOut, downMoveIn);
        this.arrowDown.runAction(cc.repeatForever(downSequence));

        // 左箭頭：向左移動再回來
        let leftMoveOut = cc.moveBy(0.5, cc.v2(-10, 0));
        let leftMoveIn = cc.moveBy(0.5, cc.v2(10, 0));
        let leftSequence = cc.sequence(leftMoveOut, leftMoveIn);
        this.arrowLeft.runAction(cc.repeatForever(leftSequence));

        // 右箭頭：向右移動再回來
        let rightMoveOut = cc.moveBy(0.5, cc.v2(10, 0));
        let rightMoveIn = cc.moveBy(0.5, cc.v2(-10, 0));
        let rightSequence = cc.sequence(rightMoveOut, rightMoveIn);
        this.arrowRight.runAction(cc.repeatForever(rightSequence));
    },

    // 點擊動畫（縮放效果）
    playClickAnimation: function() {
        // 停止之前的選擇動畫（如果存在）
        if (this.selectAction) {
            this.node.stopAction(this.selectAction);
            this.selectAction = null;
        }

        // 縮放動畫：放大到1.1倍再縮小到0.9倍，循環播放
        let scaleUp = cc.scaleTo(0.3, 1.1);
        let scaleDown = cc.scaleTo(0.3, 0.9);
        let sequence = cc.sequence(scaleUp, scaleDown);
        this.selectAction = this.node.runAction(cc.repeatForever(sequence));
    }
});