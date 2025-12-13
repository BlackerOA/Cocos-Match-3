/**
 * 全局音頻管理器 - 單例模式
 * 支援多個場景獨立的音樂控制
 */

const GlobalAudioManager = {
  _audioSources: {},        // 存儲不同場景的音頻ID和狀態 { sceneName: { audioId, isMuted, clip } }
  _currentScene: null,      // 當前場景名稱
  _isInitialized: false,    // 是否已初始化

  /**
   * 初始化音頻管理器
   */
  init() {
    if (this._isInitialized) return;

    // 使用 sessionStorage 來記住當前遊戲會話的狀態
    // 這樣刷新後會重置，但在同一個會話中會保持
    this._audioSources = {};

    this._isInitialized = true;
    console.log('GlobalAudioManager initialized');
  },

  /**
   * 播放背景音樂
   * @param {string} sceneName - 場景名稱 (例如: "Login", "Game")
   * @param {cc.AudioClip} clip - 音頻資源
   * @param {boolean} loop - 是否循環播放
   * @param {number} volume - 音量 (0-1)
   */
  playBGM(sceneName, clip, loop = true, volume = 1) {
    if (!clip || !sceneName) {
      console.warn('GlobalAudioManager: No audio clip or scene name provided');
      return;
    }

    this.init();

    // 停止其他場景的音樂
    for (let scene in this._audioSources) {
      if (scene !== sceneName && this._audioSources[scene].audioId !== null) {
        cc.audioEngine.stop(this._audioSources[scene].audioId);
        console.log(`GlobalAudioManager: Stopped ${scene} BGM`);
      }
    }

    // 設置當前場景
    this._currentScene = sceneName;

    // 如果這個場景還沒有音頻狀態，初始化為未靜音
    if (!this._audioSources[sceneName]) {
      this._audioSources[sceneName] = {
        audioId: null,
        isMuted: false,  // 預設為未靜音
        clip: null
      };
    }

    const sceneAudio = this._audioSources[sceneName];

    // 如果正在播放同一個音樂
    if (sceneAudio.clip === clip && sceneAudio.audioId !== null) {
      const state = cc.audioEngine.getState(sceneAudio.audioId);
      if (state !== cc.audioEngine.AudioState.ERROR) {
        // 音頻還在運行，根據這個場景的靜音狀態決定是否恢復播放
        if (!sceneAudio.isMuted) {
          cc.audioEngine.resume(sceneAudio.audioId);
        }
        console.log(`GlobalAudioManager: ${sceneName} - Same clip already playing, audioId:`, sceneAudio.audioId);
        return;
      }
    }

    // 停止這個場景之前的音樂
    if (sceneAudio.audioId !== null) {
      cc.audioEngine.stop(sceneAudio.audioId);
    }

    // 播放新音樂
    sceneAudio.clip = clip;
    sceneAudio.audioId = cc.audioEngine.play(clip, loop, volume);

    // 如果這個場景是靜音狀態，立即暫停音樂
    if (sceneAudio.isMuted) {
      cc.audioEngine.pause(sceneAudio.audioId);
    }

    console.log(`GlobalAudioManager: ${sceneName} - Playing BGM, audioId:`, sceneAudio.audioId, 'muted:', sceneAudio.isMuted);
  },

  /**
   * 停止指定場景的背景音樂
   * @param {string} sceneName - 場景名稱
   */
  stopBGM(sceneName) {
    if (!sceneName) {
      sceneName = this._currentScene;
    }

    if (this._audioSources[sceneName] && this._audioSources[sceneName].audioId !== null) {
      cc.audioEngine.stop(this._audioSources[sceneName].audioId);
      this._audioSources[sceneName].audioId = null;
      this._audioSources[sceneName].clip = null;
    }
  },

  /**
   * 切換指定場景的靜音狀態
   * @param {string} sceneName - 場景名稱
   * @returns {boolean} 新的靜音狀態
   */
  toggleMute(sceneName) {
    this.init();

    if (!sceneName) {
      sceneName = this._currentScene;
    }

    if (!this._audioSources[sceneName]) {
      this._audioSources[sceneName] = {
        audioId: null,
        isMuted: false,
        clip: null
      };
    }

    const sceneAudio = this._audioSources[sceneName];
    sceneAudio.isMuted = !sceneAudio.isMuted;

    // 應用到當前音樂
    if (sceneAudio.audioId !== null) {
      if (sceneAudio.isMuted) {
        cc.audioEngine.pause(sceneAudio.audioId);
      } else {
        cc.audioEngine.resume(sceneAudio.audioId);
      }
    }

    console.log(`GlobalAudioManager: ${sceneName} - Toggled mute to`, sceneAudio.isMuted);
    return sceneAudio.isMuted;
  },

  /**
   * 獲取指定場景的靜音狀態
   * @param {string} sceneName - 場景名稱
   * @returns {boolean} 是否靜音
   */
  isMuted(sceneName) {
    this.init();

    if (!sceneName) {
      sceneName = this._currentScene;
    }

    if (!this._audioSources[sceneName]) {
      return false;  // 預設為未靜音
    }

    return this._audioSources[sceneName].isMuted;
  },

  /**
   * 設置指定場景的靜音狀態
   * @param {string} sceneName - 場景名稱
   * @param {boolean} muted - 是否靜音
   */
  setMuted(sceneName, muted) {
    this.init();

    if (!this._audioSources[sceneName]) {
      this._audioSources[sceneName] = {
        audioId: null,
        isMuted: muted,
        clip: null
      };
      return;
    }

    const sceneAudio = this._audioSources[sceneName];
    if (sceneAudio.isMuted === muted) return;

    sceneAudio.isMuted = muted;

    if (sceneAudio.audioId !== null) {
      if (sceneAudio.isMuted) {
        cc.audioEngine.pause(sceneAudio.audioId);
      } else {
        cc.audioEngine.resume(sceneAudio.audioId);
      }
    }
  },

  /**
   * 暫停指定場景的背景音樂
   * @param {string} sceneName - 場景名稱
   */
  pauseBGM(sceneName) {
    if (!sceneName) {
      sceneName = this._currentScene;
    }

    if (this._audioSources[sceneName] && this._audioSources[sceneName].audioId !== null) {
      cc.audioEngine.pause(this._audioSources[sceneName].audioId);
    }
  },

  /**
   * 恢復指定場景的背景音樂
   * @param {string} sceneName - 場景名稱
   */
  resumeBGM(sceneName) {
    if (!sceneName) {
      sceneName = this._currentScene;
    }

    if (this._audioSources[sceneName] &&
        this._audioSources[sceneName].audioId !== null &&
        !this._audioSources[sceneName].isMuted) {
      cc.audioEngine.resume(this._audioSources[sceneName].audioId);
    }
  },

  /**
   * 獲取當前場景名稱
   * @returns {string|null}
   */
  getCurrentScene() {
    return this._currentScene;
  }
};

// 導出單例
module.exports = GlobalAudioManager;
