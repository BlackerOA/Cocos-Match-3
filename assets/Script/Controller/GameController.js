import GameModel from "../Model/GameModel";
import Toast from '../Utils/Toast';

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
    audioSource: { 
      default: null, // 設置默認值
      type: cc.AudioSource
    },
    goalLabel: {
      default: null,
      type: cc.Node
    }
  },

  // use this for initialization
  onLoad: function () {
    if (!this.audioSource) {
      // 動態查找並初始化
      this.audioSource = cc.find("Canvas/AudioSource").getComponent(cc.AudioSource);
    }
    let audioButton = this.node.parent.getChildByName('audioButton')
    audioButton.on('click', this.callback, this)
    this.gameModel = new GameModel();
    this.gameModel.init(4);
    var gridScript = this.grid.getComponent("GridView");
    gridScript.setController(this);
    gridScript.initWithCellModels(this.gameModel.getCells());
    this.audioSource = cc.find('Canvas/GameScene')._components[1].audio;
    this.goalLabel = cc.find("Canvas/Goals/Goal1/Goal Left");
  },

  callback: function () {
    let state = this.audioSource._state;
    state === 1 ? this.audioSource.pause() : this.audioSource.play()
    Toast(state === 1 ? '关闭背景音乐🎵' : '打开背景音乐🎵' )
  },

  selectCell: function (pos) {
    return this.gameModel.selectCell(pos);
  },
  cleanCmd: function () {
    this.gameModel.cleanCmd();
  },

  getGameModel: function () {
    console.log("getGameModel called");
    return this.gameModel;
  },

  minusGoalLeftLabel: function() {
    console.log("controller minus called");
    goalLabel.minusGoalLeftLabel();
  }
});
