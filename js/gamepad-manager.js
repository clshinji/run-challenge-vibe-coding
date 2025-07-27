/**
 * ゲームパッド管理クラス
 * ゲームコントローラーの検出、入力処理、設定管理を行う
 */
class GamepadManager {
    constructor() {
        // インスタンス識別用のID生成
        this.instanceId = 'GM_' + Math.random().toString(36).substr(2, 9);
        console.log(`=== GamepadManager初期化開始 [${this.instanceId}] ===`);
        
        // ゲームパッド状態
        this.gamepads = {};
        this.isEnabled = true;
        this.lastButtonStates = {};
        
        // 設定
        this.deadzone = 0.15; // スティック入力のデッドゾーン
        this.buttonMapping = this.getDefaultButtonMapping();
        
        // イベント管理
        this.inputCallbacks = [];
        
        // メニューナビゲーション
        this.isMenuMode = false;
        this.focusedElements = [];
        this.currentFocusIndex = -1;
        
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
                leftStickVertical: { axis: 1 }, // 左スティック縦軸  
                dPadLeft: { button: 14 },
                dPadRight: { button: 15 },
                dPadUp: { button: 12 },
                dPadDown: { button: 13 }
            },
            actions: {
                confirm: { button: 0 }, // Aボタン/×ボタン（決定）
                jump: { button: 0 }, // Aボタン/×ボタン（ゲーム用）
                cancel: { button: 1 }, // Bボタン/○ボタン（キャンセル）
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
        
        if (this.isMenuMode) {
            // メニューモード：ナビゲーション処理
            // console.log(`🎮 [MENU] GamepadManager処理中 [${this.instanceId}] - フォーカス要素数: ${this.focusedElements.length}`);
            this.processMenuNavigation(gamepad, lastState);
        } else {
            // ゲームモード：プレイヤー制御
            this.processMovementInput(gamepad, lastState);
            this.processButtonInput(gamepad, lastState);
        }
        
        // 状態を記録
        this.lastButtonStates[index] = this.getCurrentButtonStates(gamepad);
    }
    
    /**
     * メニューナビゲーション処理
     */
    processMenuNavigation(gamepad, lastState) {
        // メニューモードが無効の場合は処理しない
        if (!this.isMenuMode) {
            return;
        }
        
        // ゲーム画面でのフェイルセーフチェック
        const currentScreen = document.querySelector('.screen.active');
        if (currentScreen && currentScreen.id === 'gameScreen') {
            console.log(`🎮 [FAILSAFE] ゲーム画面でメニューナビゲーション阻止 [${this.instanceId}]`);
            this.setMenuMode(false);  // 強制無効化
            return;
        }
        // 方向入力処理
        const leftStickX = gamepad.axes[this.buttonMapping.movement.leftStick.axis] || 0;
        const leftStickY = gamepad.axes[this.buttonMapping.movement.leftStickVertical.axis] || 0;
        
        const dPadUp = gamepad.buttons[this.buttonMapping.movement.dPadUp.button]?.pressed || false;
        const dPadDown = gamepad.buttons[this.buttonMapping.movement.dPadDown.button]?.pressed || false;
        const dPadLeft = gamepad.buttons[this.buttonMapping.movement.dPadLeft.button]?.pressed || false;
        const dPadRight = gamepad.buttons[this.buttonMapping.movement.dPadRight.button]?.pressed || false;
        
        // 入力統合
        const upPressed = (leftStickY < -this.deadzone) || dPadUp;
        const downPressed = (leftStickY > this.deadzone) || dPadDown;
        const leftPressed = (leftStickX < -this.deadzone) || dPadLeft;
        const rightPressed = (leftStickX > this.deadzone) || dPadRight;
        
        // 前フレームとの比較
        const wasUpPressed = lastState.menuUpPressed || false;
        const wasDownPressed = lastState.menuDownPressed || false;
        const wasLeftPressed = lastState.menuLeftPressed || false;
        const wasRightPressed = lastState.menuRightPressed || false;
        
        // 方向入力変化を検出
        if (upPressed && !wasUpPressed) {
            this.navigateMenu('up');
        }
        if (downPressed && !wasDownPressed) {
            this.navigateMenu('down');
        }
        if (leftPressed && !wasLeftPressed) {
            this.navigateMenu('left');
        }
        if (rightPressed && !wasRightPressed) {
            this.navigateMenu('right');
        }
        
        // アクションボタン処理
        const confirmPressed = gamepad.buttons[this.buttonMapping.actions.confirm.button]?.pressed || false;
        const cancelPressed = gamepad.buttons[this.buttonMapping.actions.cancel.button]?.pressed || false;
        
        const wasConfirmPressed = lastState.menuConfirmPressed || false;
        const wasCancelPressed = lastState.menuCancelPressed || false;
        
        if (confirmPressed && !wasConfirmPressed) {
            console.log(`🎮 [MENU] 決定ボタン押下検出 [${this.instanceId}] - アクティベート実行`);
            console.log(`🎮 [DEBUG] フォーカス要素一覧:`, this.focusedElements.map(el => el.id || el.className || el.tagName));
            console.log(`🎮 [DEBUG] 現在のフォーカスインデックス: ${this.currentFocusIndex}`);
            this.activateCurrentElement();
        }
        if (cancelPressed && !wasCancelPressed) {
            console.log(`🎮 [MENU] キャンセルボタン押下検出 [${this.instanceId}] - 戻る実行`);
            this.handleMenuBack();
        }
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
        const leftStickX = gamepad.axes[this.buttonMapping.movement.leftStick.axis] || 0;
        const leftStickY = gamepad.axes[this.buttonMapping.movement.leftStickVertical.axis] || 0;
        const dPadLeft = gamepad.buttons[this.buttonMapping.movement.dPadLeft.button]?.pressed || false;
        const dPadRight = gamepad.buttons[this.buttonMapping.movement.dPadRight.button]?.pressed || false;
        const dPadUp = gamepad.buttons[this.buttonMapping.movement.dPadUp.button]?.pressed || false;
        const dPadDown = gamepad.buttons[this.buttonMapping.movement.dPadDown.button]?.pressed || false;
        
        return {
            // ゲーム用
            leftPressed: (leftStickX < -this.deadzone) || dPadLeft,
            rightPressed: (leftStickX > this.deadzone) || dPadRight,
            jumpPressed: gamepad.buttons[this.buttonMapping.actions.jump.button]?.pressed || false,
            pausePressed: gamepad.buttons[this.buttonMapping.actions.pause.button]?.pressed || false,
            backPressed: gamepad.buttons[this.buttonMapping.actions.back.button]?.pressed || false,
            
            // メニューナビゲーション用
            menuUpPressed: (leftStickY < -this.deadzone) || dPadUp,
            menuDownPressed: (leftStickY > this.deadzone) || dPadDown,
            menuLeftPressed: (leftStickX < -this.deadzone) || dPadLeft,
            menuRightPressed: (leftStickX > this.deadzone) || dPadRight,
            menuConfirmPressed: gamepad.buttons[this.buttonMapping.actions.confirm.button]?.pressed || false,
            menuCancelPressed: gamepad.buttons[this.buttonMapping.actions.cancel.button]?.pressed || false
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
     * メニューモード設定
     */
    setMenuMode(enabled) {
        console.log(`🎮 [DEBUG] setMenuMode呼び出し [${this.instanceId}]: ${this.isMenuMode} → ${enabled}`);
        this.isMenuMode = enabled;
        if (enabled) {
            console.log(`🎮 [DEBUG] メニューモード有効化 - フォーカス要素初期化開始 [${this.instanceId}]`);
            this.initializeFocusableElements();
        } else {
            // メニューモード無効化時はフォーカスをクリア
            console.log(`🎮 [DEBUG] メニューモード無効化 - フォーカスクリア実行 [${this.instanceId}]`);
            console.log(`🎮 [DEBUG] クリア前フォーカス要素数: ${this.focusedElements.length}`);
            this.clearAllFocus();
            this.focusedElements = [];
            this.currentFocusIndex = -1;
            console.log(`🎮 [DEBUG] クリア後フォーカス要素数: ${this.focusedElements.length}`);
        }
        console.log(`🎮 GamepadManager [${this.instanceId}]: メニューモード ${enabled ? '有効' : '無効'}`);
    }
    
    /**
     * フォーカス可能要素を初期化
     */
    initializeFocusableElements() {
        console.log(`🎮 [DEBUG] initializeFocusableElements開始 [${this.instanceId}]`);
        
        // 基本的なフォーカス可能要素を検索
        const selectors = [
            '.game-button:not([disabled])',
            '.stage-button:not(.locked)',
            '.toggle-button:not([disabled])',
            '.player-card',
            'input:not([disabled])',
            '.share-button:not([disabled])'
        ];
        
        this.focusedElements = [];
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            console.log(`🎮 [DEBUG] セレクター "${selector}": ${elements.length}個の要素`);
            elements.forEach(element => {
                if (this.isElementVisible(element)) {
                    // ゲーム画面の要素かチェック
                    const isGameScreenElement = element.closest('#gameScreen') !== null;
                    const isBackButton = element.id === 'backToStageButton' || element.classList.contains('back-button');
                    const isGameUIElement = element.closest('#gameUI') !== null;
                    
                    const elementInfo = {
                        id: element.id,
                        className: element.className,
                        tagName: element.tagName,
                        inGameScreen: isGameScreenElement,
                        isBackButton: isBackButton,
                        isGameUIElement: isGameUIElement,
                        textContent: element.textContent?.substring(0, 30)
                    };
                    
                    // ゲーム画面関連要素は除外
                    if (isGameScreenElement || isBackButton || isGameUIElement) {
                        console.log(`🎮 [DEBUG] 要素除外 (ゲーム画面関連):`, elementInfo);
                    } else {
                        console.log(`🎮 [DEBUG] 要素追加:`, elementInfo);
                        this.focusedElements.push(element);
                    }
                }
            });
        });
        
        // 最初の要素にフォーカスを設定
        if (this.focusedElements.length > 0) {
            this.currentFocusIndex = 0;
            this.updateFocus();
        }
        
        console.log(`🎮 [DEBUG] フォーカス可能要素: ${this.focusedElements.length}個 [${this.instanceId}]`);
        console.log(`🎮 [DEBUG] 要素ID一覧:`, this.focusedElements.map(el => el.id || el.className || el.tagName));
    }
    
    /**
     * 要素が表示されているかチェック
     */
    isElementVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               element.offsetParent !== null;
    }
    
    /**
     * メニューナビゲーション
     */
    navigateMenu(direction) {
        if (this.focusedElements.length === 0) return;
        
        const oldIndex = this.currentFocusIndex;
        
        switch (direction) {
            case 'up':
            case 'left':
                this.currentFocusIndex--;
                if (this.currentFocusIndex < 0) {
                    this.currentFocusIndex = this.focusedElements.length - 1;
                }
                break;
            case 'down':
            case 'right':
                this.currentFocusIndex++;
                if (this.currentFocusIndex >= this.focusedElements.length) {
                    this.currentFocusIndex = 0;
                }
                break;
        }
        
        if (oldIndex !== this.currentFocusIndex) {
            this.updateFocus();
            console.log(`🎮 フォーカス移動: ${direction} (${oldIndex} → ${this.currentFocusIndex})`);
        }
    }
    
    /**
     * フォーカス表示更新
     */
    updateFocus() {
        // 既存のフォーカスをクリア
        this.clearAllFocus();
        
        // 新しいフォーカスを設定
        if (this.currentFocusIndex >= 0 && this.currentFocusIndex < this.focusedElements.length) {
            const focusedElement = this.focusedElements[this.currentFocusIndex];
            focusedElement.classList.add('gamepad-focused');
        }
    }
    
    /**
     * 全てのフォーカスをクリア
     */
    clearAllFocus() {
        document.querySelectorAll('.gamepad-focused').forEach(element => {
            element.classList.remove('gamepad-focused');
        });
    }
    
    /**
     * 現在の要素をアクティベート
     */
    activateCurrentElement() {
        console.log(`🎮 [DEBUG] activateCurrentElement呼び出し [${this.instanceId}] [${this.managerType}]`);
        console.log(`🎮 [DEBUG] currentFocusIndex: ${this.currentFocusIndex}, focusedElements.length: ${this.focusedElements.length}`);
        console.log(`🎮 [DEBUG] isMenuMode: ${this.isMenuMode}`);
        
        // ゲーム画面でのフェイルセーフチェック
        const currentScreen = document.querySelector('.screen.active');
        if (currentScreen && currentScreen.id === 'gameScreen') {
            console.log(`🎮 [FAILSAFE] ゲーム画面でのアクティベート阻止 [${this.instanceId}]`);
            this.setMenuMode(false);  // 強制無効化
            return;
        }
        
        if (this.currentFocusIndex >= 0 && this.currentFocusIndex < this.focusedElements.length) {
            const element = this.focusedElements[this.currentFocusIndex];
            console.log(`🎮 [CRITICAL] 要素アクティベート実行 [${this.instanceId}]:`, {
                id: element.id,
                className: element.className,
                tagName: element.tagName,
                textContent: element.textContent?.substring(0, 50),
                offsetParent: element.offsetParent !== null,
                style_display: window.getComputedStyle(element).display,
                style_visibility: window.getComputedStyle(element).visibility
            });
            
            if (element.tagName === 'BUTTON') {
                console.log(`🎮 [CRITICAL] ボタンクリック実行: ${element.id || element.className}`);
                element.click();
            } else if (element.tagName === 'INPUT') {
                console.log(`🎮 [CRITICAL] 入力フィールドフォーカス実行: ${element.id || element.className}`);
                element.focus();
            } else {
                console.log(`🎮 [CRITICAL] その他要素クリック実行: ${element.id || element.className}`);
                element.click();
            }
        } else {
            console.log(`🎮 [DEBUG] アクティベート対象なし - インデックス範囲外`);
        }
    }
    
    /**
     * メニュー戻る処理
     */
    handleMenuBack() {
        console.log('🎮 メニュー戻る操作');
        // 戻るボタンを探してクリック
        const backButtons = [
            '#settingsBackButton',
            '#stageBackButton', 
            '#statsBackButton',
            '#playerListBackButton',
            '#nameBackButton',
            '#cancelEditNameButton'
        ];
        
        for (const selector of backButtons) {
            const button = document.querySelector(selector);
            if (button && this.isElementVisible(button)) {
                button.click();
                break;
            }
        }
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