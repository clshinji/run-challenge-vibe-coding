/**
 * ゲームパッド管理クラス
 * ゲームコントローラーの検出、入力処理、設定管理を行う
 */
class GamepadManager {
    constructor() {
        console.log('=== GamepadManager初期化開始 ===');
        
        // ゲームパッド状態
        this.gamepads = {};
        this.isEnabled = true;
        this.lastButtonStates = {};
        
        // 設定
        this.deadzone = 0.15; // スティック入力のデッドゾーン
        this.buttonMapping = this.getDefaultButtonMapping();
        
        // イベント管理
        this.inputCallbacks = [];
        
        // 接続状態
        this.connectionStatus = {
            isConnected: false,
            connectedControllers: 0,
            lastController: null
        };
        
        this.init();
        console.log('✅ GamepadManager初期化完了');
    }
    
    /**
     * 初期化
     */
    init() {
        this.setupGamepadEvents();
        this.loadSettings();
        
        // 初期状態でゲームパッドをスキャン
        this.scanGamepads();
        
        console.log('GamepadManager設定完了:', {
            enabled: this.isEnabled,
            deadzone: this.deadzone,
            buttonMapping: this.buttonMapping
        });
    }
    
    /**
     * デフォルトボタンマッピング
     */
    getDefaultButtonMapping() {
        return {
            // 標準ゲームパッド (Xbox/PlayStation style)
            movement: {
                leftStick: { axis: 0 }, // 左スティック横軸
                dPadLeft: { button: 14 },
                dPadRight: { button: 15 }
            },
            actions: {
                jump: { button: 0 }, // Aボタン/×ボタン
                pause: { button: 9 }, // Startボタン
                back: { button: 8 }   // Selectボタン
            }
        };
    }
    
    /**
     * ゲームパッドイベント設定
     */
    setupGamepadEvents() {
        // ゲームパッド接続
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 ゲームパッド接続:', e.gamepad.id);
            this.onGamepadConnected(e.gamepad);
        });
        
        // ゲームパッド切断
        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('🎮 ゲームパッド切断:', e.gamepad.id);
            this.onGamepadDisconnected(e.gamepad);
        });
    }
    
    /**
     * ゲームパッド接続処理
     */
    onGamepadConnected(gamepad) {
        this.gamepads[gamepad.index] = gamepad;
        this.lastButtonStates[gamepad.index] = {};
        
        this.updateConnectionStatus();
        
        // UIに通知
        this.notifyConnectionChange('connected', gamepad);
        
        console.log('ゲームパッド登録完了:', {
            index: gamepad.index,
            id: gamepad.id,
            buttons: gamepad.buttons.length,
            axes: gamepad.axes.length
        });
    }
    
    /**
     * ゲームパッド切断処理
     */
    onGamepadDisconnected(gamepad) {
        delete this.gamepads[gamepad.index];
        delete this.lastButtonStates[gamepad.index];
        
        this.updateConnectionStatus();
        
        // UIに通知
        this.notifyConnectionChange('disconnected', gamepad);
        
        console.log('ゲームパッド登録解除:', gamepad.index);
    }
    
    /**
     * 接続状態更新
     */
    updateConnectionStatus() {
        const connectedCount = Object.keys(this.gamepads).length;
        this.connectionStatus = {
            isConnected: connectedCount > 0,
            connectedControllers: connectedCount,
            lastController: connectedCount > 0 ? Object.values(this.gamepads)[0] : null
        };
        
        console.log('接続状態更新:', this.connectionStatus);
    }
    
    /**
     * ゲームパッドスキャン（ブラウザによっては手動スキャンが必要）
     */
    scanGamepads() {
        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            if (gamepad && !this.gamepads[gamepad.index]) {
                this.onGamepadConnected(gamepad);
            }
        }
    }
    
    /**
     * メインの入力更新処理（ゲームループから呼び出される）
     */
    update() {
        if (!this.isEnabled || !this.connectionStatus.isConnected) {
            return;
        }
        
        // 最新のゲームパッド状態を取得
        const gamepads = navigator.getGamepads();
        
        Object.keys(this.gamepads).forEach(index => {
            const gamepad = gamepads[index];
            if (gamepad) {
                this.processGamepadInput(gamepad);
            }
        });
    }
    
    /**
     * ゲームパッド入力処理
     */
    processGamepadInput(gamepad) {
        const index = gamepad.index;
        const lastState = this.lastButtonStates[index] || {};
        
        // 移動処理（アナログスティック + 十字キー）
        this.processMovementInput(gamepad, lastState);
        
        // ボタン処理
        this.processButtonInput(gamepad, lastState);
        
        // 状態を記録
        this.lastButtonStates[index] = this.getCurrentButtonStates(gamepad);
    }
    
    /**
     * 移動入力処理
     */
    processMovementInput(gamepad, lastState) {
        // 左スティック横軸
        const leftStickX = gamepad.axes[this.buttonMapping.movement.leftStick.axis];
        const horizontalInput = Math.abs(leftStickX) > this.deadzone ? leftStickX : 0;
        
        // 十字キー
        const dPadLeft = gamepad.buttons[this.buttonMapping.movement.dPadLeft.button]?.pressed || false;
        const dPadRight = gamepad.buttons[this.buttonMapping.movement.dPadRight.button]?.pressed || false;
        
        // 入力の統合
        let leftPressed = horizontalInput < -this.deadzone || dPadLeft;
        let rightPressed = horizontalInput > this.deadzone || dPadRight;
        
        // 前フレームとの比較
        const wasLeftPressed = lastState.leftPressed || false;
        const wasRightPressed = lastState.rightPressed || false;
        
        // 入力変化を検出してアクションを送信
        if (leftPressed !== wasLeftPressed) {
            this.sendInputAction('left', leftPressed);
        }
        
        if (rightPressed !== wasRightPressed) {
            this.sendInputAction('right', rightPressed);
        }
        
        // デバッグログ（移動時のみ）
        if (leftPressed || rightPressed) {
            console.log('[GAMEPAD] 移動入力:', {
                leftStickX: leftStickX.toFixed(3),
                dPadLeft, dPadRight,
                leftPressed, rightPressed
            });
        }
    }
    
    /**
     * ボタン入力処理
     */
    processButtonInput(gamepad, lastState) {
        // ジャンプボタン
        const jumpPressed = gamepad.buttons[this.buttonMapping.actions.jump.button]?.pressed || false;
        const wasJumpPressed = lastState.jumpPressed || false;
        
        if (jumpPressed !== wasJumpPressed) {
            console.log('[GAMEPAD] ジャンプボタン:', jumpPressed ? '押下' : '離上');
            this.sendInputAction('jump', jumpPressed);
        }
        
        // ポーズボタン
        const pausePressed = gamepad.buttons[this.buttonMapping.actions.pause.button]?.pressed || false;
        const wasPausePressed = lastState.pausePressed || false;
        
        if (pausePressed && !wasPausePressed) {
            console.log('[GAMEPAD] ポーズボタン押下');
            this.sendPauseAction();
        }
        
        // 戻るボタン
        const backPressed = gamepad.buttons[this.buttonMapping.actions.back.button]?.pressed || false;
        const wasBackPressed = lastState.backPressed || false;
        
        if (backPressed && !wasBackPressed) {
            console.log('[GAMEPAD] 戻るボタン押下');
            this.sendBackAction();
        }
    }
    
    /**
     * 現在のボタン状態を取得
     */
    getCurrentButtonStates(gamepad) {
        const leftStickX = gamepad.axes[this.buttonMapping.movement.leftStick.axis];
        const dPadLeft = gamepad.buttons[this.buttonMapping.movement.dPadLeft.button]?.pressed || false;
        const dPadRight = gamepad.buttons[this.buttonMapping.movement.dPadRight.button]?.pressed || false;
        
        return {
            leftPressed: (leftStickX < -this.deadzone) || dPadLeft,
            rightPressed: (leftStickX > this.deadzone) || dPadRight,
            jumpPressed: gamepad.buttons[this.buttonMapping.actions.jump.button]?.pressed || false,
            pausePressed: gamepad.buttons[this.buttonMapping.actions.pause.button]?.pressed || false,
            backPressed: gamepad.buttons[this.buttonMapping.actions.back.button]?.pressed || false
        };
    }
    
    /**
     * 入力アクションを送信（プレイヤーへ）
     */
    sendInputAction(action, isPressed) {
        if (window.game && window.game.player && window.game.player.handleInput) {
            try {
                window.game.player.handleInput(action, isPressed);
                console.log(`[GAMEPAD] ✅ プレイヤー入力送信: ${action} = ${isPressed}`);
            } catch (error) {
                console.error('[GAMEPAD] ❌ プレイヤー入力エラー:', error);
            }
        }
        
        // UIマネージャーにも通知
        if (window.uiManager && window.uiManager.sendInputToPlayer) {
            window.uiManager.sendInputToPlayer(action, isPressed);
        }
    }
    
    /**
     * ポーズアクション送信
     */
    sendPauseAction() {
        // ゲーム中の場合はポーズ
        if (window.game && window.game.isRunning && !window.game.isPaused) {
            console.log('[GAMEPAD] ゲーム一時停止');
            if (window.uiManager) {
                window.uiManager.pauseGame();
            }
        }
        // ポーズ中の場合は再開
        else if (window.game && window.game.isPaused) {
            console.log('[GAMEPAD] ゲーム再開');
            if (window.uiManager) {
                window.uiManager.resumeGame();
            }
        }
    }
    
    /**
     * 戻るアクション送信
     */
    sendBackAction() {
        // 現在の画面に応じて適切な戻る処理
        if (window.uiManager && window.uiManager.handleBackButton) {
            console.log('[GAMEPAD] 戻る処理実行');
            window.uiManager.handleBackButton();
        }
    }
    
    /**
     * 接続変化通知
     */
    notifyConnectionChange(type, gamepad) {
        if (window.uiManager && window.uiManager.onGamepadConnectionChange) {
            window.uiManager.onGamepadConnectionChange(type, gamepad);
        }
        
        // コンソールに通知表示
        const message = type === 'connected' 
            ? `🎮 コントローラー接続: ${gamepad.id}` 
            : `🎮 コントローラー切断: ${gamepad.id}`;
        console.log(message);
    }
    
    /**
     * 設定の読み込み
     */
    loadSettings() {
        if (typeof window !== 'undefined' && window.gameStorage) {
            const gameData = window.gameStorage.loadGameData();
            if (gameData && gameData.gamepadSettings) {
                const settings = gameData.gamepadSettings;
                
                this.isEnabled = settings.enabled !== false; // デフォルトtrue
                this.deadzone = settings.deadzone || 0.15;
                
                if (settings.buttonMapping) {
                    this.buttonMapping = { ...this.buttonMapping, ...settings.buttonMapping };
                }
                
                console.log('ゲームパッド設定読み込み完了:', settings);
            }
        }
    }
    
    /**
     * 設定の保存
     */
    saveSettings() {
        if (typeof window !== 'undefined' && window.gameStorage) {
            const gameData = window.gameStorage.loadGameData();
            
            if (!gameData.gamepadSettings) {
                gameData.gamepadSettings = {};
            }
            
            gameData.gamepadSettings = {
                enabled: this.isEnabled,
                deadzone: this.deadzone,
                buttonMapping: this.buttonMapping
            };
            
            window.gameStorage.saveGameData(gameData);
            console.log('ゲームパッド設定保存完了');
        }
    }
    
    /**
     * 有効/無効切り替え
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        this.saveSettings();
        console.log('ゲームパッド:', enabled ? '有効' : '無効');
    }
    
    /**
     * デッドゾーン設定
     */
    setDeadzone(deadzone) {
        this.deadzone = Math.max(0, Math.min(1, deadzone));
        this.saveSettings();
        console.log('デッドゾーン設定:', this.deadzone);
    }
    
    /**
     * 接続状態取得
     */
    getConnectionStatus() {
        return { ...this.connectionStatus };
    }
    
    /**
     * 接続中のゲームパッド一覧取得
     */
    getConnectedGamepads() {
        return Object.values(this.gamepads);
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        const gamepads = Object.values(this.gamepads);
        
        return {
            enabled: this.isEnabled,
            connectionStatus: this.connectionStatus,
            deadzone: this.deadzone,
            gamepads: gamepads.map(gamepad => ({
                index: gamepad.index,
                id: gamepad.id,
                buttonsCount: gamepad.buttons.length,
                axesCount: gamepad.axes.length,
                connected: gamepad.connected
            }))
        };
    }
    
    /**
     * リアルタイム入力状態取得（設定画面用）
     */
    getLiveInputState() {
        if (!this.connectionStatus.isConnected) {
            return null;
        }
        
        const gamepad = this.connectionStatus.lastController;
        if (!gamepad) return null;
        
        const currentGamepad = navigator.getGamepads()[gamepad.index];
        if (!currentGamepad) return null;
        
        return {
            leftStick: {
                x: currentGamepad.axes[0]?.toFixed(3) || 0,
                y: currentGamepad.axes[1]?.toFixed(3) || 0
            },
            rightStick: {
                x: currentGamepad.axes[2]?.toFixed(3) || 0,
                y: currentGamepad.axes[3]?.toFixed(3) || 0
            },
            buttons: currentGamepad.buttons.map((button, index) => ({
                index,
                pressed: button.pressed,
                value: button.value?.toFixed(3) || 0
            })),
            dPad: {
                up: currentGamepad.buttons[12]?.pressed || false,
                down: currentGamepad.buttons[13]?.pressed || false,
                left: currentGamepad.buttons[14]?.pressed || false,
                right: currentGamepad.buttons[15]?.pressed || false
            }
        };
    }
    
    /**
     * 破棄処理
     */
    destroy() {
        console.log('GamepadManager破棄開始');
        
        // イベントリスナー削除は自動（WindowオブジェクトのGamepadイベント）
        
        // 状態クリア
        this.gamepads = {};
        this.lastButtonStates = {};
        this.inputCallbacks = [];
        
        console.log('GamepadManager破棄完了');
    }
}

// グローバルスコープに登録
if (typeof window !== 'undefined') {
    window.GamepadManager = GamepadManager;
    console.log('✅ GamepadManagerクラスをwindowに登録完了');
} else {
    console.error('❌ windowオブジェクトが利用できません');
}

console.log('=== gamepad-manager.js読み込み完了 ===');