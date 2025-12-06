import CellModel from "./CellModel";
import { mergePointArray, exclusivePoint } from "../Utils/ModelUtils";
import { CELL_TYPE, CELL_BASENUM, CELL_STATUS, GRID_WIDTH, GRID_HEIGHT, ANITIME, STAGE_CONFIG, SPECIAL_DROP_DISTRIBUTION } from "./ConstValue";
import { GoalModel } from "./GoalModel";
import Toast from '../Utils/Toast';
const LeaderboardManager = require("../Manager/LeaderboardManager");
const GlobalData = require("../Utils/GlobalData");

export default class GameModel {
  constructor() {
    this.cells = null;
    this.cellBgs = null;
    this.lastPos = cc.v2(-1, -1);
    this.cellTypeNum = 4;
    this.cellCreateType = [];                             // 升成种类只在这个数组里面查找
    this.movesLeft = 15;                                  
    this.isGameOver = false;

    // ========== 舊目標系統（將被階段系統取代） ==========
    this.goalLeft = 99999;
    this.goalCompleteCoins = 0;
    this.goalModel = new GoalModel();

    // ========== 新階段系統 ==========
    this.currentStage = 1;                                // 當前階段
    this.stageReachedTarget = false;                      // 當前階段是否已達標
    this.isStageTransitioning = false;                    // Bug #3 修復：是否正在階段轉換中

    this.totalCrushed = 0;                                // 記錄一輪要消除的數量
    this.coin = 0;                                        // 實際分數（邏輯層，立即計算）
    this.displayCoin = 0;                                 // 顯示分數（視覺層，延遲更新）
    this.isProcessing = false;                            // 是否正在執行消除動畫
    this.isScoringComplete = true;                        // 分數計算是否完成（初始為true）
    this.currentHint = null;                              // 當前提示
  }

  setGameController(gameController) {
    this.gameController = gameController;
  }

  init(cellTypeNum) {
    // 測試 localStorage 訪問
    const playerId = cc.sys.localStorage.getItem('playerId');
    console.log("遊戲初始化時讀取到的玩家 ID:", playerId);

    this.cells = [];
    this.setCellTypeNum(cellTypeNum || this.cellTypeNum);
    for (var i = 1; i <= GRID_WIDTH; i++) {
      this.cells[i] = [];
      for (var j = 1; j <= GRID_HEIGHT; j++) {
        this.cells[i][j] = new CellModel();
      }
    }

    // this.mock();

    for (var i = 1; i <= GRID_WIDTH; i++) {
      for (var j = 1; j <= GRID_HEIGHT; j++) {
        //已经被mock数据生成了
        if (this.cells[i][j].type != null) {
          continue;
        }
        let flag = true;
        while (flag) {
          flag = false;

          this.cells[i][j].init(this.getRandomCellType());
          let result = this.checkPoint(j, i)[0];
          if (result.length > 2) {
            flag = true;
          }
          this.cells[i][j].setXY(j, i);
          this.cells[i][j].setStartXY(j, i);
        }
      }
    }

    /* Testing */
    // this.cells[1][1].type = CELL_TYPE.BIRD;
    // this.cells[1][1].status = CELL_STATUS.COLUMN;
    // this.cells[1][2].type = CELL_TYPE.BIRD;
    // this.cells[1][2].status = CELL_STATUS.WRAP;
    // this.cells[2][1].status = CELL_STATUS.WRAP;
    // this.cells[2][2].status = CELL_STATUS.WRAP;
    // this.cells[2][4].type = CELL_TYPE.BIRD;
    // this.cells[2][4].status = CELL_STATUS.BIRD;

    // 輸出初始階段資訊
    console.log("\n🎮 ========== 遊戲開始 ==========");
    console.log(`🎯 階段系統：共3個階段`);
    console.log(`📊 階段1目標：10,000分`);
    console.log(`📊 階段2目標：25,000分`);
    console.log(`📊 階段3目標：無（最後階段）`);
    console.log(`👟 每階段步數：15步`);
    console.log(`\n🎲 特殊方塊掉落機率：`);
    console.log(`   階段1：5% (直線60% 爆炸30% 鳥10%)`);
    console.log(`   階段2：2% (直線60% 爆炸30% 鳥10%)`);
    console.log(`   階段3：0% (不掉落)`);
    console.log("================================\n");
    this.logStageInfo();
  }

  mock() {
    this.mockInit(5, 1, CELL_TYPE.A);
    this.mockInit(5, 3, CELL_TYPE.A);
    this.mockInit(4, 2, CELL_TYPE.A);
    this.mockInit(3, 2, CELL_TYPE.A);
    this.mockInit(5, 2, CELL_TYPE.B);
    this.mockInit(6, 2, CELL_TYPE.B);
    this.mockInit(7, 3, CELL_TYPE.B);
    this.mockInit(8, 2, CELL_TYPE.A);
  }
  mockInit(x, y, type) {
    this.cells[x][y].init(type)
    this.cells[x][y].setXY(y, x);
    this.cells[x][y].setStartXY(y, x);
  }

  initWithData(data) {
    // to do
  }

  nextGoal() {
    [this.goalLeft, this.goalCompleteCoins] = this.goalModel.getRandomGoalModel(this.cellTypeNum);
    this.gameController.setUIGoalLeft(this.goalLeft);
    this.gameController.setGoalTypeImg(this.goalModel.getGoalType(), this.goalModel.getSpecifyColor());
  }

  /**
   *
   * @param x
   * @param y
   * @param recursive 是否递归查找
   * @returns {([]|string|*)[]}
   */
  checkPoint(x, y, recursive) {
    let rowResult = this.checkWithDirection(x, y, [cc.v2(1, 0), cc.v2(-1, 0)]);
    let colResult = this.checkWithDirection(x, y, [cc.v2(0, -1), cc.v2(0, 1)]);
    let samePoints = [];
    let newCellStatus = "";
    if (rowResult.length >= 5 || colResult.length >= 5) {
      newCellStatus = CELL_STATUS.BIRD;
    }
    else if (rowResult.length >= 3 && colResult.length >= 3) {
      newCellStatus = CELL_STATUS.WRAP;
    }
    else if (rowResult.length >= 4) {
      newCellStatus = CELL_STATUS.LINE;
    }
    else if (colResult.length >= 4) {
      newCellStatus = CELL_STATUS.COLUMN;
    }
    if (rowResult.length >= 3) {
      samePoints = rowResult;
    }
    if (colResult.length >= 3) {
      samePoints = mergePointArray(samePoints, colResult);
    }
    let result = [samePoints, newCellStatus, this.cells[y][x].type, cc.v2(x, y)];
    // 检查一下消除的其他节点， 能不能生成更大范围的消除
    if (recursive && result.length >= 3) {
      let subCheckPoints = exclusivePoint(samePoints, cc.v2(x, y));
      for (let point of subCheckPoints) {
        let subResult = this.checkPoint(point.x, point.y, false);
        if (subResult[1] > result[1] || (subResult[1] === result[1] && subResult[0].length > result[0].length)) {
          result = subResult;
        }
      }
    }
    return result;
  }

  checkWithDirection(x, y, direction) {
    let queue = [];
    let vis = [];
    vis[x + y * 9] = true;
    queue.push(cc.v2(x, y));
    let front = 0;
    while (front < queue.length) {
      //let direction = [cc.v2(0, -1), cc.v2(0, 1), cc.v2(1, 0), cc.v2(-1, 0)];
      let point = queue[front];
      let cellModel = this.cells[point.y][point.x];
      front++;
      if (!cellModel) {
        continue;
      }
      for (let i = 0; i < direction.length; i++) {
        let tmpX = point.x + direction[i].x;
        let tmpY = point.y + direction[i].y;
        if (tmpX < 1 || tmpX > 9
          || tmpY < 1 || tmpY > 9
          || vis[tmpX + tmpY * 9]
          || !this.cells[tmpY][tmpX]) {
          continue;
        }
        if (cellModel.type === this.cells[tmpY][tmpX].type) {
          vis[tmpX + tmpY * 9] = true;
          queue.push(cc.v2(tmpX, tmpY));
        }
      }
    }
    return queue;
  }

  printInfo() {
    for (var i = 1; i <= 9; i++) {
      var printStr = "";
      for (var j = 1; j <= 9; j++) {
        printStr += this.cells[i][j].type + " ";
      }
      console.log(printStr);
    }
  }

  getCells() {
    return this.cells;
  }
  // controller调用的主要入口
  // 点击某个格子
  selectCell(pos) {
    if (this.isGameOver) {
      console.log("遊戲已結束，無法進行操作。"); // 提示遊戲已結束
      return [[], []];
    }
    if (this.isProcessing) {
      return [[], []]; // 避免動畫期間觸發操作
    }
    this.changeModels = [];// 发生改变的model，将作为返回值，给view播动作
    this.effectsQueue = []; // 动物消失，爆炸等特效
    var lastPos = this.lastPos;
    var delta = Math.abs(pos.x - lastPos.x) + Math.abs(pos.y - lastPos.y);
    if (delta != 1) { //非相邻格子， 直接返回
      this.lastPos = pos;
      return [[], []];
    }

    let curClickCell = this.cells[pos.y][pos.x]; //当前点击的格子
    let lastClickCell = this.cells[lastPos.y][lastPos.x]; // 上一次点击的格式
    this.exchangeCell(lastPos, pos);
    var result1 = this.checkPoint(pos.x, pos.y)[0];
    var result2 = this.checkPoint(lastPos.x, lastPos.y)[0];
    this.curTime = 0; // 动画播放的当前时间
    this.pushToChangeModels(curClickCell);
    this.pushToChangeModels(lastClickCell);
    let isCanBomb = (curClickCell.status != CELL_STATUS.COMMON && // 判断两个是否是特殊的动物
      lastClickCell.status != CELL_STATUS.COMMON) ||
      curClickCell.status == CELL_STATUS.BIRD ||
      lastClickCell.status == CELL_STATUS.BIRD;
    if (result1.length < 3 && result2.length < 3 && !isCanBomb) {//不会发生消除的情况
      this.exchangeCell(lastPos, pos);
      curClickCell.moveToAndBack(lastPos);
      lastClickCell.moveToAndBack(pos);
      this.lastPos = cc.v2(-1, -1);
      return [this.changeModels];
    }
    else {
      this.gameController.consumeMove();
      this.movesLeft--;
      console.log(`剩餘步數: ${this.movesLeft}`);
      this.lastPos = cc.v2(-1, -1);
      curClickCell.moveTo(lastPos, this.curTime);
      lastClickCell.moveTo(pos, this.curTime);
      var checkPoint = [pos, lastPos];
      this.curTime += ANITIME.TOUCH_MOVE;
      this.processCrush(checkPoint);
      return [this.changeModels, this.effectsQueue];
    }
  }
  // 消除
  processCrush(checkPoint) {
    let cycleCount = 1;
    this.isProcessing = true;
    this.isScoringComplete = false; // 標記分數計算尚未完成

    while (checkPoint.length > 0) {
        this.totalCrushed = 0;
        let bombModels = [];
        let specialCrush = false;

        if (cycleCount == 1 && checkPoint.length == 2) {
            let pos1 = checkPoint[0];
            let pos2 = checkPoint[1];
            let model1 = this.cells[pos1.y][pos1.x];
            let model2 = this.cells[pos2.y][pos2.x];
            let lineQuantity = 0, wrapQuantity = 0, birdQuantity = 0;
            lineQuantity += (model1.status == CELL_STATUS.LINE || model1.status == CELL_STATUS.COLUMN);
            lineQuantity += (model2.status == CELL_STATUS.LINE || model2.status == CELL_STATUS.COLUMN);
            wrapQuantity += (model1.status == CELL_STATUS.WRAP);
            wrapQuantity += (model2.status == CELL_STATUS.WRAP);
            birdQuantity += (model1.status == CELL_STATUS.BIRD);
            birdQuantity += (model2.status == CELL_STATUS.BIRD);

            specialCrush = (lineQuantity + wrapQuantity + birdQuantity === 2 || birdQuantity);

            if (!lineQuantity && !wrapQuantity && birdQuantity === 1) {
                if (model1.status == CELL_STATUS.BIRD) {
                    model1.type = model2.type;
                    bombModels.push(model1);
                } else {
                    model2.type = model1.type;
                    bombModels.push(model2);
                }

                this.processBomb(bombModels, cycleCount);
            }
            else if (lineQuantity === 2) {// 直線 * 2
                this.straightPlusStraight(model1, model2);
            }
            else if (lineQuantity && wrapQuantity) {// 直線 + 爆破
                this.straightPlusWrap(model1, model2);
            }
            else if (lineQuantity && birdQuantity) {// 直線 + 鳥
                this.straightPlusBird(model1, model2);
            }
            else if (wrapQuantity === 2) {// 爆破 * 2
                this.wrapPlusWrap(model1, model2);
            }
            else if (wrapQuantity && birdQuantity) {// 爆破 + 鳥
                this.wrapPlusBird(model1, model2);
            }
            else if (birdQuantity === 2) {// 鳥 * 2
                this.birdPlusBird();
            }
            
            // ========== 舊目標系統（已停用） ==========
            // if (lineQuantity + wrapQuantity + birdQuantity === 2) {
            //     if (this.goalLeft > 0 && this.goalModel.isConformGoal(model1, model2)) {
            //         this.goalLeft--;
            //         this.gameController.uiGoalLeftMinus();
            //     }
            // }
        }

        if (!specialCrush) {
            for (let i in checkPoint) {
                let pos = checkPoint[i];
                if (!this.cells[pos.y][pos.x]) continue;
                let [result, newCellStatus, newCellType, crushPoint] = this.checkPoint(pos.x, pos.y, true);
                if (result.length < 3) continue;

                for (let j in result) {
                    let model = this.cells[result[j].y][result[j].x];
                    this.crushCell(result[j].x, result[j].y, false, cycleCount);
                    if (model.status != CELL_STATUS.COMMON) {
                        bombModels.push(model);
                    }
                }

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
            }

            this.processBomb(bombModels, cycleCount);
        }

        let copyTotalCrushed = this.totalCrushed;
        let copyCycleCount = cycleCount;

        // Bug #9 修復：在累加 curTime 之前計算 displayDelay
        // 這樣 combo 顯示會在當前消除動畫時顯示，而不是延遲到下一個循環
        let displayDelay = this.curTime * 1000;

        this.curTime += ANITIME.DIE;
        let nextCheckPoint = this.down();
        let hasNextCrush = nextCheckPoint.length > 0;

        // Bug #4 修復：分離邏輯和視覺
        // 1. 立即計算實際分數（用於邏輯判斷和上傳）
        // 2. 延遲更新顯示分數（配合動畫）

        // 計算本次消除的分數
        let crushEarn = this.calculateCrushEarn(copyTotalCrushed);
        let stepEarn = 0;
        if (copyCycleCount > 1 && hasNextCrush) {
            stepEarn = 3 * Math.pow(copyCycleCount, 2);
        }

        // 立即更新實際分數（不更新顯示分數，displayCoin 會延遲更新）
        this.earnCoin(crushEarn + stepEarn, false);
        this.updateDisplayCoin(crushEarn, displayDelay);
        if (stepEarn > 0) {
            // Combo 分數稍微延遲一點
            this.updateDisplayCoin(stepEarn, displayDelay + 100);

            // Bug #8 修復：延遲顯示 combo，且從 combo 2 開始才顯示
            // 玩家第一次消除是 combo 1，不顯示
            if (this.gameController && copyCycleCount >= 2) {
                setTimeout(() => {
                    this.gameController.showCombo(copyCycleCount);
                }, displayDelay);
            }
        }

        checkPoint = nextCheckPoint;
        cycleCount++;
    }

    this.isProcessing = false;

    // Bug #4 修復：分數已經在 while 循環中立即計算完成了
    // 不需要延遲，直接標記為完成
    this.isScoringComplete = true; // 標記分數計算完成
    this.checkStageTargetReached();

    this.gameController.logicCalculateEnd();
  }

  //生成新cell
  createNewCell(pos, status, type) {
    if (status == "") {
      return;
    }
    if (status == CELL_STATUS.BIRD) {
      type = CELL_TYPE.BIRD
    }
    let model = new CellModel();
    this.cells[pos.y][pos.x] = model
    model.init(type);
    model.setStartXY(pos.x, pos.y);
    model.setXY(pos.x, pos.y);
    model.setStatus(status);
    model.setVisible(0, false);
    model.setVisible(this.curTime, true);
    this.changeModels.push(model);
  }
  // 下落
  down() {
    let newCheckPoint = [];
    for (var i = 1; i <= GRID_WIDTH; i++) {
      for (var j = 1; j <= GRID_HEIGHT; j++) {
        if (this.cells[i][j] == null) {
          var curRow = i;
          for (var k = curRow; k <= GRID_HEIGHT; k++) {
            if (this.cells[k][j]) {
              this.pushToChangeModels(this.cells[k][j]);
              newCheckPoint.push(this.cells[k][j]);
              this.cells[curRow][j] = this.cells[k][j];
              this.cells[k][j] = null;
              this.cells[curRow][j].setXY(j, curRow);
              this.cells[curRow][j].moveTo(cc.v2(j, curRow), this.curTime);
              curRow++;
            }
          }
          var count = 1;
          for (var k = curRow; k <= GRID_HEIGHT; k++) {
            this.cells[k][j] = new CellModel();

            // 使用新的生成方法，有機率生成特殊方塊
            const cellData = this.generateNewCellWithSpecialChance();
            this.cells[k][j].init(cellData.type);
            this.cells[k][j].setStatus(cellData.status);

            this.cells[k][j].setStartXY(j, count + GRID_HEIGHT);
            this.cells[k][j].setXY(j, count + GRID_HEIGHT);
            this.cells[k][j].moveTo(cc.v2(j, k), this.curTime);
            count++;
            this.changeModels.push(this.cells[k][j]);
            newCheckPoint.push(this.cells[k][j]);
          }

        }
      }
    }
    this.curTime += ANITIME.TOUCH_MOVE + 0.3
    return newCheckPoint;
  }

  pushToChangeModels(model) {
    if (this.changeModels.indexOf(model) != -1) {
      return;
    }
    this.changeModels.push(model);
  }

  cleanCmd() {
    for (var i = 1; i <= GRID_WIDTH; i++) {
      for (var j = 1; j <= GRID_HEIGHT; j++) {
        if (this.cells[i][j]) {
          this.cells[i][j].cmd = [];
        }
      }
    }
  }

  exchangeCell(pos1, pos2) {
    var tmpModel = this.cells[pos1.y][pos1.x];
    this.cells[pos1.y][pos1.x] = this.cells[pos2.y][pos2.x];
    this.cells[pos1.y][pos1.x].x = pos1.x;
    this.cells[pos1.y][pos1.x].y = pos1.y;
    this.cells[pos2.y][pos2.x] = tmpModel;
    this.cells[pos2.y][pos2.x].x = pos2.x;
    this.cells[pos2.y][pos2.x].y = pos2.y;
  }
  // 设置种类
  // Todo 改成乱序算法
  setCellTypeNum(num) {
    console.log("num = ", num);
    this.cellTypeNum = num;
    this.cellCreateType = [];
    let createTypeList = this.cellCreateType;
    for (let i = 1; i <= CELL_BASENUM; i++) {
      createTypeList.push(i);
    }
    for (let i = 0; i < createTypeList.length; i++) {
      let index = Math.floor(Math.random() * (CELL_BASENUM - i)) + i;
      createTypeList[i], createTypeList[index] = createTypeList[index], createTypeList[i]
    }
  }
  // 随要生成一个类型
  getRandomCellType() {
    var index = Math.floor(Math.random() * this.cellTypeNum);
    return this.cellCreateType[index];
  }

  /**
   * 根據當前階段機率生成新方塊（可能是特殊方塊）
   * @returns {Object} { type: CELL_TYPE, status: CELL_STATUS }
   */
  generateNewCellWithSpecialChance() {
    const config = this.getCurrentStageConfig();
    const baseRate = config.specialDropRate;

    // 如果基礎機率為0，直接返回普通方塊
    if (baseRate === 0) {
      return {
        type: this.getRandomCellType(),
        status: CELL_STATUS.COMMON
      };
    }

    // 判斷是否生成特殊方塊
    const rand = Math.random();
    if (rand < baseRate) {
      // 生成特殊方塊
      const specialRand = Math.random();
      let specialStatus;
      let cellType = this.getRandomCellType(); // 特殊方塊的顏色

      if (specialRand < SPECIAL_DROP_DISTRIBUTION.LINE) {
        // 60% - 直線型（隨機橫向或縱向）
        specialStatus = Math.random() < 0.5 ? CELL_STATUS.LINE : CELL_STATUS.COLUMN;
      } else if (specialRand < SPECIAL_DROP_DISTRIBUTION.LINE + SPECIAL_DROP_DISTRIBUTION.WRAP) {
        // 30% - 爆炸型
        specialStatus = CELL_STATUS.WRAP;
      } else {
        // 10% - 鳥型
        specialStatus = CELL_STATUS.BIRD;
        cellType = CELL_TYPE.BIRD; // 鳥型使用特殊類型
      }

      return {
        type: cellType,
        status: specialStatus
      };
    }

    // 生成普通方塊
    return {
      type: this.getRandomCellType(),
      status: CELL_STATUS.COMMON
    };
  }

  // TODO bombModels去重
  processBomb(bombModels, cycleCount) {
    while (bombModels.length > 0) {
      let newBombModel = [];
      let bombTime = ANITIME.BOMB_DELAY;
      bombModels.forEach(function (model) {
        if (model.status == CELL_STATUS.LINE) {
          for (let i = 1; i <= GRID_WIDTH; i++) {
            if (this.cells[model.y][i]) {
              if (this.cells[model.y][i].status != CELL_STATUS.COMMON) {
                newBombModel.push(this.cells[model.y][i]);
              }
              this.crushCell(i, model.y, false, cycleCount);
            }
          }
          this.addRowBomb(this.curTime, cc.v2(model.x, model.y));
        }
        else if (model.status == CELL_STATUS.COLUMN) {
          for (let i = 1; i <= GRID_HEIGHT; i++) {
            if (this.cells[i][model.x]) {
              if (this.cells[i][model.x].status != CELL_STATUS.COMMON) {
                newBombModel.push(this.cells[i][model.x]);
              }
              this.crushCell(model.x, i, false, cycleCount);
            }
          }
          this.addColBomb(this.curTime, cc.v2(model.x, model.y));
        }
        else if (model.status == CELL_STATUS.WRAP) {
          let x = model.x;
          let y = model.y;
          for (let i = 1; i <= GRID_HEIGHT; i++) {
            for (let j = 1; j <= GRID_WIDTH; j++) {
              let delta = Math.abs(x - j) + Math.abs(y - i);
              if (this.cells[i][j] && delta <= 2) {
                if (this.cells[i][j].status != CELL_STATUS.COMMON) {
                  newBombModel.push(this.cells[i][j]);
                }
                this.crushCell(j, i, false, cycleCount);
              }
            }
          }
        }
        else if (model.status == CELL_STATUS.BIRD) {
          let crushType = model.type
          if (bombTime < ANITIME.BOMB_BIRD_DELAY) {
            bombTime = ANITIME.BOMB_BIRD_DELAY;
          }
          if (crushType == CELL_TYPE.BIRD) {
            crushType = this.getRandomCellType();
          }
          for (let i = 1; i <= GRID_HEIGHT; i++) {
            for (let j = 1; j <= GRID_WIDTH; j++) {
              if (this.cells[i][j] && this.cells[i][j].type == crushType) {
                // Bug #1 修復：先檢查是否為特殊方塊並加入爆炸隊列
                if (this.cells[i][j].status != CELL_STATUS.COMMON) {
                  newBombModel.push(this.cells[i][j]);
                }
                // 所有匹配的方塊都要消除（包括特殊方塊）
                this.crushCell(j, i, true, cycleCount);
              }
            }
          }
        }
      }, this);
      if (bombModels.length > 0) {
        this.curTime += bombTime;
      }
      bombModels = newBombModel;
    }
  }

  straightPlusStraight(model1, model2) {
    let bombPos = {x: model1.x, y: model1.y};
    let bombModels = [];
    
    this.crushCell(model1.x, model1.y, false, 1);
    this.crushCell(model2.x, model2.y, false, 1);
    
    for (let col = 1; col <= GRID_WIDTH; col++) {
        if (col === model1.x || col === model2.x)
            continue;

        if (this.cells[bombPos.y][col]) {
            if (this.cells[bombPos.y][col].status != CELL_STATUS.COMMON) {
                bombModels.push(this.cells[bombPos.y][col]);
            }
            this.crushCell(col, bombPos.y, false, 1);
        }
    }
    
    for (let row = 1; row <= GRID_HEIGHT; row++) {
        if (row === model1.y || row === model2.y)
            continue;

        if (this.cells[row][bombPos.x]) {
            if (this.cells[row][bombPos.x].status != CELL_STATUS.COMMON) {
                bombModels.push(this.cells[row][bombPos.x]);  
            }
            this.crushCell(bombPos.x, row, false, 1);
        }
    }
    
    this.addRowBomb(this.curTime, cc.v2(bombPos.x, bombPos.y));
    this.addColBomb(this.curTime, cc.v2(bombPos.x, bombPos.y));

    this.processBomb(bombModels, 1);

    // 獎勵 250 金幣
    this.earnSpecialComboBonusCoin(250, "直線+直線");
  }

  straightPlusWrap(model1, model2) {
    let bombModels = [];
    let bombPos = {x: model1.x, y: model1.y};

    this.crushCell(model1.x, model1.y, false, 1);
    this.crushCell(model2.x, model2.y, false, 1);
    
    for (let col = 1; col <= GRID_WIDTH; col++) {
        for (let offset = -1; offset <= 1; offset++) {
            let row = bombPos.y + offset;
            if (row === model1.y && col === model2.x ||
                row === model2.y && col === model2.x)
                continue;
                
            if (row >= 1 && row <= GRID_HEIGHT && this.cells[row][col]) {
                if (this.cells[row][col].status != CELL_STATUS.COMMON) {
                    bombModels.push(this.cells[row][col]);
                }
                this.crushCell(col, row, false, 1);
            }
        }
    }
    
    for (let row = 1; row <= GRID_HEIGHT; row++) {
        for (let offset = -1; offset <= 1; offset++) {
            let col = bombPos.x + offset;
            if (col >= 1 && col <= GRID_WIDTH && this.cells[row][col]) {
                let inHorizontalRange = Math.abs(row - bombPos.y) <= 1;
                if (!inHorizontalRange || col !== bombPos.x || row !== bombPos.y) {
                    if (this.cells[row][col].status != CELL_STATUS.COMMON) {
                        bombModels.push(this.cells[row][col]);
                    }
                    this.crushCell(col, row, false, 1);
                }
            }
        }
    }
    
    this.addRowBomb(this.curTime, cc.v2(bombPos.x, bombPos.y+1));
    this.addRowBomb(this.curTime, cc.v2(bombPos.x, bombPos.y));
    this.addRowBomb(this.curTime, cc.v2(bombPos.x, bombPos.y-1));
    this.addColBomb(this.curTime, cc.v2(bombPos.x+1, bombPos.y));
    this.addColBomb(this.curTime, cc.v2(bombPos.x, bombPos.y));
    this.addColBomb(this.curTime, cc.v2(bombPos.x-1, bombPos.y));

    this.processBomb(bombModels, 1);

    // 獎勵 400 金幣
    this.earnSpecialComboBonusCoin(400, "直線+爆炸");
  }

  straightPlusBird(model1, model2) {
    let bombModels = [];
    let changeType = (model1.status === CELL_STATUS.BIRD) ? model2.type : model1.type;
    for (let row = 1; row <= GRID_HEIGHT; row++) {
      for (let col = 1; col <= GRID_WIDTH; col++) {
        if (!this.cells[row][col]) continue;
                        
        if (this.cells[row][col].type === changeType) {
          this.cells[row][col].status = (Math.random() < 0.5) ? CELL_STATUS.LINE : CELL_STATUS.COLUMN;
          bombModels.push(this.cells[row][col]);
        }
      }
    }
    this.processBomb(bombModels, 1);

    // 獎勵 600 金幣
    this.earnSpecialComboBonusCoin(600, "直線+鳥");
  }

  wrapPlusWrap(model1, model2) {
    let bombModels = [];
    let bombPos = {x: model1.x, y: model1.y};

    this.crushCell(model1.x, model1.y, false, 1);
    this.crushCell(model2.x, model2.y, false, 1);

    for (let row = 1; row <= GRID_HEIGHT; row++) {
        for (let col = 1; col <= GRID_WIDTH; col++) {
            if (row === model1.y && col === model2.x ||
                row === model2.y && col === model2.x)
                continue;

            let chebyshevDist = Math.max(
                Math.abs(col - bombPos.x),
                Math.abs(row - bombPos.y)
            );
            
            if (chebyshevDist <= 2 && this.cells[row][col]) {
                if (this.cells[row][col].status != CELL_STATUS.COMMON) {
                    bombModels.push(this.cells[row][col]);
                }
                this.crushCell(col, row, false, 1);
            }
        }
    }
    this.processBomb(bombModels, 1);

    // 獎勵 500 金幣
    this.earnSpecialComboBonusCoin(500, "爆炸+爆炸");
  }

  wrapPlusBird(model1, model2) {
    let bombModels = [];
    let changeType = (model1.status === CELL_STATUS.BIRD) ? model2.type : model1.type;
    for (let row = 1; row <= GRID_HEIGHT; row++) {
      for (let col = 1; col <= GRID_WIDTH; col++) {
        if (!this.cells[row][col]) continue;
                        
        if (this.cells[row][col].type === changeType) {
          this.cells[row][col].status = CELL_STATUS.WRAP;
          bombModels.push(this.cells[row][col]);
        }
      }
    }
    this.processBomb(bombModels, 1);

    // 獎勵 750 金幣
    this.earnSpecialComboBonusCoin(750, "爆炸+鳥");
  }

  birdPlusBird() {
    for (let row = 1; row <= GRID_HEIGHT; row++) {
      for (let col = 1; col <= GRID_WIDTH; col++) {
        this.crushCell(col, row, true, 1);
      }
    }
    this.curTime += ANITIME.BOMB_BIRD_DELAY;

    // 獎勵 1000 金幣
    this.earnSpecialComboBonusCoin(1000, "鳥+鳥");
  }


  /**
   * 
   * @param {开始播放的时间} playTime 
   * @param {*cell位置} pos 
   * @param {*第几次消除，用于播放音效} step 
   */
  addCrushEffect(playTime, pos, step) {
    this.effectsQueue.push({
      playTime,
      pos,
      action: "crush",
      step
    });
  }

  addRowBomb(playTime, pos) {
    this.effectsQueue.push({
      playTime,
      pos,
      action: "rowBomb"
    });
  }

  addColBomb(playTime, pos) {
    this.effectsQueue.push({
      playTime,
      pos,
      action: "colBomb"
    });
  }

  addWrapBomb(playTime, pos) {
    this.effectsQueue.push({
        playTime,
        pos,
        action: "wrapBomb"  // 確保使用 wrapBomb 而不是其他動作名稱
    });
  }

  /**
   * Bug #2 修復：檢查指定位置的方塊是否會被炸彈陣列波及
   * @param {cc.v2} targetPos - 要檢查的位置
   * @param {Array} bombModels - 炸彈方塊陣列
   * @returns {boolean} - 是否會被波及
   */
  checkIfCellAffectedByBombs(targetPos, bombModels) {
    for (let bomb of bombModels) {
      // LINE：消除同一行
      if (bomb.status === CELL_STATUS.LINE && targetPos.y === bomb.y) {
        return true;
      }

      // COLUMN：消除同一列
      if (bomb.status === CELL_STATUS.COLUMN && targetPos.x === bomb.x) {
        return true;
      }

      // WRAP：消除曼哈頓距離≤2的範圍
      if (bomb.status === CELL_STATUS.WRAP) {
        let manhattanDist = Math.abs(targetPos.x - bomb.x) + Math.abs(targetPos.y - bomb.y);
        if (manhattanDist <= 2) {
          return true;
        }
      }

      // BIRD：消除同色方塊（需要檢查新生成方塊的顏色）
      // 注意：新生成的特殊方塊可能跟被消除的方塊同色
      if (bomb.status === CELL_STATUS.BIRD) {
        let crushType = bomb.type;
        if (crushType === CELL_TYPE.BIRD) {
          // 如果鳥自己是BIRD類型，會隨機選擇顏色，這裡無法預測
          // 為安全起見，暫不處理這種情況
          continue;
        }
        let newCell = this.cells[targetPos.y][targetPos.x];
        if (newCell && newCell.type === crushType) {
          return true;
        }
      }
    }
    return false;
  }

  // cell消除逻辑
  crushCell(x, y, needShake, step) {
    let model = this.cells[y][x];
    this.pushToChangeModels(model);
    if (needShake) {
      model.toShake(this.curTime);
    }

    // ========== 舊目標系統（已停用） ==========
    // let goalMinus = false;
    // if (this.goalLeft > 0 && this.goalModel.isConformGoal(model)) {
    //   goalMinus = true;
    //   this.goalLeft--;
    // }

    this.totalCrushed++;

    let shakeTime = needShake ? ANITIME.DIE_SHAKE : 0;
    model.toDie(this.curTime + shakeTime, false); // goalMinus 固定為 false
    this.addCrushEffect(this.curTime + shakeTime, cc.v2(model.x, model.y), step);
    this.cells[y][x] = null;
  }

  setGoalLeft(num) {
    this.goalLeft = num;
  }
  getGoalLeft() {
    return this.goalLeft;
  }

  drawGoalCompleteCoins() {
    if (this.goalCompleteCoins) {
      console.log(`完成目標 獲得${this.goalCompleteCoins}金幣`);
      this.earnCoin(this.goalCompleteCoins);
    }
  }

  calculateCrushEarn(crushQuantity) {
    // 計算消除數量對應的分數，不實際修改分數
    let totalEarn = 0;

    if (crushQuantity >= 21)
      totalEarn += 150;
    else if (crushQuantity >= 18)
      totalEarn += 120;
    else if (crushQuantity >= 15)
      totalEarn += 85;
    else if (crushQuantity >= 12)
      totalEarn += 45;
    else if (crushQuantity >= 9)
      totalEarn += 25;
    else if (crushQuantity >= 6)
      totalEarn += 15;
    else if (crushQuantity >= 3)
      totalEarn += 10;

    return totalEarn;
  }

  earnCoinsByCrush(crushQuantity) {
    // 保留這個方法以兼容其他可能的調用
    let totalEarn = this.calculateCrushEarn(crushQuantity);
    this.earnCoin(totalEarn);
  }

  earnCoinsByStep(totalSteps) {
    let stepBonus = 3 * Math.pow(totalSteps, 2);
    this.earnCoin(stepBonus);
  }

  checkEndGame() {
    if (this.isGameOver) {
      return;
    }

    // 如果分數計算尚未完成，延遲檢查
    if (this.isScoringComplete === false) {
      setTimeout(() => {
        this.checkEndGame();
      }, 100);
      return;
    }

    // 檢查是否達標
    this.checkStageTargetReached();

    // 檢查步數是否用完
    if (this.movesLeft === 0) {
      // 使用階段系統的結束檢查
      const shouldEndGame = this.checkStageEnd();

      if (shouldEndGame) {
        this.endGame();
      }
    }
  }

  endGame() {
    this.isGameOver = true;

    // Bug #6 修復：停止計時器
    if (this.gameController && this.gameController.thinkingTimerScript) {
      this.gameController.thinkingTimerScript.setWorkable(false);
    }

    // Bug #4 修復：分數在 processCrush 中已經立即計算完成
    // 直接上傳分數並顯示排行榜
    this.saveScoreToLeaderboard();
    // saveScoreToLeaderboard 內部會：
    // 1. 上傳分數到伺服器
    // 2. 從伺服器獲取最新排行榜
    // 3. 在 callback 中調用 showLeaderboard(true, true) 顯示排行榜
  }

  isEndGame() { return this.isGameOver; }

  levelComplete() {
    this.isGameOver = true;
  
    console.log(`已通關，剩餘步數(${this.movesLeft})轉成金幣(${this.movesLeft * 15})`);
  
    // 先轉換剩餘步數為金幣
    this.leftMovesToCoins(() => {
      // 在金幣轉換完成後保存分數並顯示排行榜
      this.saveScoreToLeaderboard();
      // Bug #4 修復：移除這裡的 showLeaderboard 調用
      // saveScoreToLeaderboard 內部已經會在 callback 中調用 showLeaderboard(true, true)
    });
  }

  leftMovesToCoins(callback) {
    if (this.movesLeft > 0) {
        this.movesLeft--;
        this.earnCoin(15);
        setTimeout(() => { 
            this.leftMovesToCoins(callback); 
        }, 50);
    } else if (callback) {
        // 所有步數都轉換完成後，執行回調
        callback();
    }
  }

  setCoin(amount) {
    this.coin = Math.max(0, amount); // 避免負數（實際分數）
  }

  getCoin() {
      // 返回顯示分數，用於 UI 顯示
      return this.displayCoin;
  }

  getActualCoin() {
      // 返回實際分數，用於邏輯判斷和上傳伺服器
      return this.coin;
  }

  earnCoin(amount, updateDisplay = true) {
    // 更新實際分數
    this.setCoin(this.coin + amount);

    // 默認也同步更新顯示分數（例如 leftMovesToCoins 時）
    if (updateDisplay) {
      this.displayCoin = Math.max(0, this.displayCoin + amount);
    }
  }

  updateDisplayCoin(amount, delay) {
    // 延遲更新顯示分數
    setTimeout(() => {
      this.displayCoin = Math.max(0, this.displayCoin + amount);
    }, delay);
  }

  // ========== 階段系統方法 ==========

  /**
   * 獲取當前階段配置
   */
  getCurrentStageConfig() {
    return STAGE_CONFIG[this.currentStage];
  }

  /**
   * 獲取當前階段目標分數
   */
  getCurrentStageTargetScore() {
    const config = this.getCurrentStageConfig();
    return config ? config.targetScore : null;
  }

  /**
   * 檢查是否達到當前階段目標
   */
  checkStageTargetReached() {
    const targetScore = this.getCurrentStageTargetScore();

    // 如果沒有目標分數（階段3），直接返回 false
    if (targetScore === null) {
      return false;
    }

    // 如果已經達標過了，不再重複檢查
    if (this.stageReachedTarget) {
      return false;
    }

    // 檢查是否達標
    if (this.coin >= targetScore) {
      this.stageReachedTarget = true;
      console.log(`🎯 階段 ${this.currentStage} 達標！當前分數：${this.coin} / 目標分數：${targetScore}`);
      return true;
    }

    return false;
  }

  /**
   * 進入下一階段
   */
  advanceToNextStage() {
    if (this.currentStage >= 3) {
      console.log("⚠️ 已經是最後階段，無法再進階");
      return false;
    }

    // Bug #3 修復：標記正在階段轉換中
    this.isStageTransitioning = true;

    this.currentStage++;
    this.stageReachedTarget = false;

    const newConfig = this.getCurrentStageConfig();
    this.movesLeft = newConfig.steps; // 重置步數

    console.log(`\n🎉 ========== 進入階段 ${this.currentStage} ==========`);
    console.log(`📊 目標分數：${newConfig.targetScore || '無（最後階段）'}`);
    console.log(`👟 剩餘步數：${this.movesLeft}`);
    console.log(`💰 當前分數：${this.coin}`);
    console.log(`🎲 特殊方塊掉落率：${(newConfig.specialDropRate * 100).toFixed(0)}%`);
    console.log(`==========================================\n`);

    // Bug #5 修復：立即檢查當前分數是否已達新階段目標
    // 如果在前一階段就已經達到新階段的目標，顏色應該立即變黃
    this.checkStageTargetReached();

    // 先確保計時器停止，然後重置數值到 15 秒
    if (this.gameController && this.gameController.thinkingTimerScript) {
      this.gameController.thinkingTimerScript.setWorkable(false); // 先停止
      this.gameController.thinkingTimerScript.resetTimer(); // 重置數值到 15 秒
    }

    // 顯示階段過場 Toast 並暫停遊戲
    this.showStageTransitionToast(this.currentStage, newConfig.targetScore);

    return true;
  }

  /**
   * 顯示階段過場 Toast 並暫停遊戲
   */
  showStageTransitionToast(stage, targetScore) {
    // 暫停遊戲操作
    this.isProcessing = true;

    // 暫停思考計時器
    if (this.gameController && this.gameController.thinkingTimerScript) {
      this.gameController.thinkingTimerScript.setWorkable(false);
    }

    const Toast = require('../Utils/Toast');

    let message = '';
    if (stage === 2) {
      message = `🎉 進入階段 ${stage}！\n目標分數：${targetScore}`;
    } else if (stage === 3) {
      message = `🎉 進入階段 ${stage}！\n最後階段，全力衝刺！`;
    }

    Toast(message, {
      duration: 2,
      gravity: "CENTER",
      bg_color: cc.color(0, 0, 0, 200),
      text_color: cc.color(255, 215, 0) // 金色文字
    });

    // 2秒後恢復遊戲操作和計時器
    setTimeout(() => {
      this.isProcessing = false;
      this.isStageTransitioning = false;  // Bug #3 修復：清除階段轉換標記

      // 恢復思考計時器（false 表示不重置，從 15 秒開始倒數）
      if (this.gameController && this.gameController.thinkingTimerScript) {
        this.gameController.thinkingTimerScript.setWorkable(true, false);
      }

      console.log(`階段 ${stage} 開始，繼續遊戲`);
    }, 2000);
  }

  /**
   * 檢查階段是否結束（步數用完）
   */
  checkStageEnd() {
    if (this.movesLeft > 0) {
      return false;
    }

    console.log(`\n⏱️ ========== 階段 ${this.currentStage} 步數用完 ==========`);

    // 如果已達標且不是最後階段，進入下一階段
    if (this.stageReachedTarget && this.currentStage < 3) {
      console.log(`✅ 分數已達標，準備進入下一階段...`);
      this.advanceToNextStage();
      return false; // 遊戲繼續
    }

    // 未達標或已是最後階段，遊戲結束
    if (!this.stageReachedTarget && this.currentStage < 3) {
      console.log(`❌ 分數未達標！目標：${this.getCurrentStageTargetScore()}，當前：${this.coin}`);
    } else {
      console.log(`🏁 最後階段結束！`);
    }

    console.log(`==========================================\n`);
    return true; // 遊戲結束
  }

  /**
   * 輸出當前階段信息（用於調試）
   */
  logStageInfo() {
    const config = this.getCurrentStageConfig();
    console.log(`\n📋 ========== 當前階段資訊 ==========`);
    console.log(`🎮 階段：${this.currentStage} / 3`);
    console.log(`💰 當前分數：${this.coin}`);
    console.log(`🎯 目標分數：${config.targetScore || '無（最後階段）'}`);
    console.log(`👟 剩餘步數：${this.movesLeft}`);
    console.log(`✅ 是否達標：${this.stageReachedTarget ? '是' : '否'}`);
    console.log(`====================================\n`);
  }

  // return { value: [hints], hint: [crushCells] }
  findAllHints() {
    //console.log(JSON.stringify(this.cells)); // look board in console
    let result = [];
    for (let type = CELL_TYPE.A; type < CELL_TYPE.A + this.cellTypeNum; type++) {
      for (let row = 1; row <= GRID_HEIGHT; row++) {
        for (let col = 1; col <= GRID_WIDTH; col++) {
          let someHints = this.findHintsAtPoint(type, row, col);
          for (const hint of someHints)
            result.push(hint);
        }
      }
    }
    return result;
  }
  findHintsAtPoint(type, row, col) { // for findAllHints()
    let result = [];
    if (this.cells[row][col].type === type)
      return result;

    let upCount = this.countCellsOnDirection(type, row, col, 1, 0);
    let downCount = this.countCellsOnDirection(type, row, col, -1, 0);
    let rightCount = this.countCellsOnDirection(type, row, col, 0, 1);
    let leftCount = this.countCellsOnDirection(type, row, col, 0, -1);

    if (upCount) {
      let crushPositions = this.getHintCrushCells(row, col, -1, downCount, rightCount, leftCount);
      if (crushPositions.length) {
        crushPositions.push([row + 1, col]);
        let swapPositions = [[row, col], [row + 1, col]];
        result.push({crushPositions: crushPositions, swapPositions: swapPositions});
      }
    }
    if (downCount) {
      let crushPositions = this.getHintCrushCells(row, col, upCount, -1, rightCount, leftCount);
      if (crushPositions.length) {
        crushPositions.push([row - 1, col]);
        let swapPositions = [[row, col], [row - 1, col]];
        result.push({crushPositions: crushPositions, swapPositions: swapPositions});
      }
    }
    if (rightCount) {
      let crushPositions = this.getHintCrushCells(row, col, upCount, downCount, -1, leftCount);
      if (crushPositions.length) {
        crushPositions.push([row, col + 1]);
        let swapPositions = [[row, col], [row, col + 1]];
        result.push({crushPositions: crushPositions, swapPositions: swapPositions});
      }
    }
    if (leftCount) {
      let crushPositions = this.getHintCrushCells(row, col, upCount, downCount, rightCount, -1);
      if (crushPositions.length) {
        crushPositions.push([row, col - 1]);
        let swapPositions = [[row, col], [row, col - 1]];
        result.push({crushPositions: crushPositions, swapPositions: swapPositions});
      }
    }

    return result;
  }
  countCellsOnDirection(type, row, col, deltaRow, deltaCol) { // for findHintsAtPoint()
    let result = 0;

    for (let i = 1; this.isPositionValid(row + deltaRow * i, col + deltaCol * i) &&
    this.cells[row + deltaRow * i][col + deltaCol * i].type === type; i++)
      result++;

    return result;
  }
  // If swap up: upcount = -1
  getHintCrushCells(row, col, upCount, downCount, rightCount, leftCount) { // for findHintsAtPoint()
    let result = [];

    if (upCount >= 2) {
      result.push([row + 1, col]);
      result.push([row + 2, col]);
    }
    if (downCount >= 2) {
      result.push([row - 1, col]);
      result.push([row - 2, col]);
    }
    if (rightCount >= 2) {
      result.push([row, col + 1]);
      result.push([row, col + 2]);
    }
    if (leftCount >= 2) {
      result.push([row, col - 1]);
      result.push([row, col - 2]);
    }

    if (upCount === 1 && downCount > 0)
      result.push([row + 1, col]);
    if (downCount === 1 && upCount > 0)
      result.push([row - 1, col]);
    if (rightCount === 1 && leftCount > 0)
      result.push([row, col + 1]);
    if (leftCount === 1 && rightCount > 0)
      result.push([row, col - 1]);

    return result;
  }

  isPositionValid(row, col) {
    return row > 0 && col > 0 && row <= GRID_HEIGHT && col <= GRID_WIDTH;
  }

  saveScoreToLeaderboard() {
    // 從 GlobalData 獲取玩家 ID
    let playerId = GlobalData.getPlayerId();
    
    // 如果沒有玩家 ID，使用訪客 ID
    if (!playerId || playerId.trim() === "") {
        playerId = "Guest_" + Math.floor(Math.random() * 10000);
        // 更新到 GlobalData
        GlobalData.setPlayerId(playerId);
        // 同時保存到 localStorage
        cc.sys.localStorage.setItem('playerId', playerId);
    }
    
    try {
        // 顯示上傳中提示
        Toast("正在上傳成績...", { duration: 2, gravity: "CENTER" });
        
        // 初始化排行榜管理器
        let leaderboardNode = cc.director.getScene().getChildByName('LeaderboardManager');
        let leaderboardManager;
        
        // 檢查場景中是否已有排行榜管理器
        if (!leaderboardNode) {
            leaderboardNode = new cc.Node('LeaderboardManager');
            leaderboardNode.parent = cc.director.getScene();
            leaderboardManager = leaderboardNode.addComponent('LeaderboardManager');
        } else {
            leaderboardManager = leaderboardNode.getComponent('LeaderboardManager');
        }
        
        // 保存實例以便後續使用
        this.leaderboardManager = leaderboardManager;
        
        // 使用實際分數（而非顯示分數）上傳
        let actualScore = this.getActualCoin();

        // 上傳分數到排行榜
        leaderboardManager.addScore(playerId, actualScore, (err) => {
            if (err) {
                console.warn("上傳分數時出錯:", err.message);
                Toast("上傳分數時出現問題，將使用本地排行榜", { duration: 2, gravity: "CENTER" });
            }

            // Bug #4 修復：使用 addScore callback 中已獲取的最新數據
            // addScore 內部已經呼叫 getLeaderboard 更新了 leaderboardData
            // 傳入 skipLoadingToast=true, useCurrentData=true 直接使用該數據
            // 避免 showLeaderboard 重複請求導致獲取舊數據
            leaderboardManager.showLeaderboard(true, true);
        });
    } catch (e) {
        console.error("添加分數到排行榜時出錯:", e);
        console.error(e.stack); // 顯示詳細錯誤堆疊
        
        // 出錯時也嘗試顯示排行榜
        setTimeout(() => {
            this.showLeaderboard();
        }, 500);
    }
  }

  showLeaderboard() {
    // 確保我們有排行榜管理器實例
    if (!this.leaderboardManager) {
        try {
            let leaderboardNode = cc.director.getScene().getChildByName('LeaderboardManager');
            if (leaderboardNode) {
                this.leaderboardManager = leaderboardNode.getComponent('LeaderboardManager');
            } else {
                // 如果找不到，創建一個新的
                leaderboardNode = new cc.Node('LeaderboardManager');
                leaderboardNode.parent = cc.director.getScene();
                this.leaderboardManager = leaderboardNode.addComponent('LeaderboardManager');
            }
        } catch (e) {
            console.error("獲取排行榜管理器失敗:", e);
            Toast("無法顯示排行榜，請重試", { duration: 2, gravity: "CENTER" });
            return;
        }
    }
    
    // 顯示排行榜，這是正常的調用方式
    this.leaderboardManager.showLeaderboard(false); // 傳入 false 表示這是普通的顯示，需要提示
  }

  // 特殊合併獎勵金幣
  earnSpecialComboBonusCoin(amount, comboName) {
    this.earnCoin(amount);
    console.log(`特殊組合[${comboName}]獎勵 ${amount} 金幣！`);
    
    const Toast = require('../Utils/Toast');
    Toast(`${comboName} +${amount} 金幣！`, { 
        duration: 2, 
        gravity: "CENTER",
        bg_color: cc.color(0, 0, 0, 200),
        text_color: cc.color(255, 215, 0) // 金色文字
    });
  }
}