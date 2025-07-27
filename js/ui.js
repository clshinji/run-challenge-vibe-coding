/**
 * UI管理クラス
 */
class UIManager {
    constructor() {
        this.currentScreen = 'titleScreen';
        this.previousScreen = null; // 前の画面を記録
        this.gameData = null;
        this.storage = new GameStorage();
        this.clearedStageNumber = null; // クリアしたステージ番号を追跡
        
        // 共有機能の処理中フラグ
        this.isDownloading = false;
        this.isSharing = false;
        this.sharePreviewInitialized = false;
        
        // ゲームパッド関連
        this.menuGamepadManager = null;
        this.gamepadUpdateId = null;
        
        this.init();
    }

    /**
     * UI初期化
     */
    init() {
        // 最後にプレイしたプレイヤーを復元
        const lastPlayer = gameStorage.getLastPlayer();
        if (lastPlayer) {
            gameStorage.setCurrentPlayer(lastPlayer);
            console.log('最後のプレイヤーを復元:', lastPlayer);
        }

        // 現在のプレイヤーが存在することを確認
        this.ensureCurrentPlayerExists();

        this.gameData = gameStorage.loadGameData();
        this.setupEventListeners();
        this.setupDebugFeatures();
        this.updateUI();
        this.showScreen('titleScreen');

        // 初期化後にプレイヤー名表示を更新
        setTimeout(() => {
            this.updatePlayerNameDisplay();
        }, 100);
        
        // ゲームパッド初期化（遅延実行で安全に）
        setTimeout(() => {
            this.initializeMenuGamepad();
        }, 200);
    }

    /**
     * メニュー用ゲームパッド初期化
     */
    initializeMenuGamepad() {
        try {
            if (typeof GamepadManager !== 'undefined') {
                this.menuGamepadManager = new GamepadManager();
                this.menuGamepadManager.managerType = 'UIManager_Menu';
                console.log(`✅ UIManager: メニュー用GamepadManager初期化完了 [${this.menuGamepadManager.instanceId}]`);
                
                // メニューモードを有効にして更新ループ開始（ゲーム画面以外の場合のみ）
                if (this.currentScreen !== 'gameScreen') {
                    this.menuGamepadManager.setMenuMode(true);
                }
                this.startMenuGamepadLoop();
            } else {
                console.warn('⚠️ GamepadManagerが利用できません');
            }
        } catch (error) {
            console.error('❌ ゲームパッド初期化エラー:', error);
        }
    }

    /**
     * メニューゲームパッド更新ループ開始
     */
    startMenuGamepadLoop() {
        if (!this.menuGamepadManager) return;
        
        const updateLoop = () => {
            // ゲーム画面以外 かつ メニューモード有効時のみ更新
            if (this.currentScreen !== 'gameScreen' && 
                this.menuGamepadManager && 
                this.menuGamepadManager.isMenuMode) {
                try {
                    this.menuGamepadManager.update();
                } catch (error) {
                    console.error('🎮 メニューゲームパッド更新エラー:', error);
                }
            }
            
            this.gamepadUpdateId = requestAnimationFrame(updateLoop);
        };
        
        this.gamepadUpdateId = requestAnimationFrame(updateLoop);
        console.log('🎮 メニューゲームパッド更新ループ開始');
    }

    /**
     * メニューゲームパッド更新ループ停止
     */
    stopMenuGamepadLoop() {
        if (this.gamepadUpdateId) {
            cancelAnimationFrame(this.gamepadUpdateId);
            this.gamepadUpdateId = null;
            console.log('🎮 メニューゲームパッド更新ループ停止');
        }
    }

    /**
     * メニューゲームパッドナビゲーション再初期化
     */
    refreshMenuGamepadNavigation() {
        if (!this.menuGamepadManager) return;
        
        if (this.currentScreen === 'gameScreen') {
            // ゲーム画面：メニューモードを完全に無効化し、更新も停止
            this.menuGamepadManager.setMenuMode(false);
            this.menuGamepadManager.clearAllFocus();
            this.stopMenuGamepadLoop();
            console.log('🎮 UIManager: ゲーム画面でメニューモード無効化・更新停止');
        } else if (this.menuGamepadManager.isMenuMode) {
            // その他画面：100ms後に再初期化（DOM更新待ち）
            setTimeout(() => {
                this.menuGamepadManager.initializeFocusableElements();
            }, 100);
        } else {
            // メニューモードが無効の場合は有効化し、更新ループ再開
            if (!this.gamepadUpdateId) {
                this.startMenuGamepadLoop();
            }
            this.menuGamepadManager.setMenuMode(true);
            setTimeout(() => {
                this.menuGamepadManager.initializeFocusableElements();
            }, 100);
        }
    }

    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        // 既存のイベントリスナーをクリア（重複防止）
        const confirmEditButton = document.getElementById('confirmEditNameButton');
        const cancelEditButton = document.getElementById('cancelEditNameButton');
        const editNameInput = document.getElementById('editPlayerNameInput');

        // 既存のイベントリスナーを削除
        if (confirmEditButton) {
            confirmEditButton.replaceWith(confirmEditButton.cloneNode(true));
        }
        if (cancelEditButton) {
            cancelEditButton.replaceWith(cancelEditButton.cloneNode(true));
        }
        if (editNameInput) {
            editNameInput.replaceWith(editNameInput.cloneNode(true));
        }

        // タイトル画面
        document.getElementById('startButton').addEventListener('click', () => {
            // 現在のプレイヤーが存在することを確認
            this.ensureCurrentPlayerExists();

            // 更新されたゲームデータを再取得
            this.gameData = gameStorage.loadGameData();

            // プレイヤーが設定されているかチェック
            if (this.gameData.playerName && this.gameData.playerName.trim() !== '') {
                this.showScreen('stageSelectScreen');
            } else {
                // プレイヤーが設定されていない場合は名前入力画面へ
                this.showScreen('nameInputScreen');
            }
        });

        document.getElementById('playerListButton').addEventListener('click', () => {
            this.showPlayerListScreen();
        });

        document.getElementById('settingsButton').addEventListener('click', () => {
            this.showScreen('settingsScreen');
        });

        // デバッグ情報設定切り替え
        document.getElementById('debugInfoToggle').addEventListener('click', () => {
            this.toggleSetting('debugInfo');
        });

        // 統計ボタン
        document.getElementById('statsButton').addEventListener('click', () => {
            // タイトル画面から統計画面に遷移する場合は前の画面をリセット
            this.previousScreen = null;
            this.showStatsScreen();
        });

        // プレイヤー名編集ボタン
        document.getElementById('editPlayerNameButton').addEventListener('click', () => {
            this.showEditNameScreen();
        });

        // プレイヤー一覧画面

        document.getElementById('addNewPlayerButton').addEventListener('click', () => {
            this.showScreen('nameInputScreen');
        });

        document.getElementById('playWithPlayerButton').addEventListener('click', () => {
            console.log('このプレイヤーであそぶボタンが押されました');
            
            // 現在選択されているプレイヤーを確認
            const currentPlayer = this.gameData.playerName;
            if (!currentPlayer || currentPlayer === '未設定') {
                alert('プレイヤーを選択してください');
                return;
            }
            
            console.log('選択されたプレイヤー:', currentPlayer);
            
            // ステージ選択画面に遷移
            this.showScreen('stageSelectScreen');
        });

        document.getElementById('playerListBackButton').addEventListener('click', () => {
            console.log('プレイヤー一覧画面から戻る処理開始');

            // タイトル画面に戻る前に、プレイヤー情報を更新
            this.gameData = gameStorage.loadGameData();
            console.log('プレイヤー情報更新完了:', this.gameData.playerName);

            this.showScreen('titleScreen');
        });

        // アイコン選択画面
        document.getElementById('iconSelectBackButton').addEventListener('click', () => {
            this.showPlayerListScreen();
        });

        // 名前入力画面
        document.getElementById('nameConfirmButton').addEventListener('click', () => {
            this.handleNameInput();
        });

        document.getElementById('nameBackButton').addEventListener('click', () => {
            this.showScreen('titleScreen');
        });

        document.getElementById('playerNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleNameInput();
            }
        });

        // プレイヤー名編集画面（新しい要素を取得）
        document.getElementById('confirmEditNameButton').addEventListener('click', () => {
            console.log('編集確定ボタンがクリックされました');
            this.handleEditNameInput();
        });

        document.getElementById('cancelEditNameButton').addEventListener('click', () => {
            console.log('編集キャンセルボタンがクリックされました');
            this.showScreen('titleScreen');
        });

        document.getElementById('editPlayerNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('編集入力フィールドでEnterキーが押されました');
                this.handleEditNameInput();
            }
        });

        // 統計画面
        document.getElementById('statsBackButton').addEventListener('click', () => {
            this.handleStatsBack();
        });

        // デバッグ機能: テストデータ生成トグル
        document.getElementById('testDataToggle').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // ボタンを一時的に無効化
            const button = e.target;
            if (button.disabled) return;
            
            button.disabled = true;
            
            try {
                this.toggleTestData();
            } finally {
                // 処理完了後にボタンを再有効化
                setTimeout(() => {
                    button.disabled = false;
                }, 500);
            }
        });

        // 成績共有機能（DOM準備完了後に初期化）
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.setupShareFeatures(), 100);
            });
        } else {
            setTimeout(() => this.setupShareFeatures(), 100);
        }

        // ステージ選択画面
        document.getElementById('stageBackButton').addEventListener('click', () => {
            this.showScreen('titleScreen');
        });

        // ゲーム画面
        const backButton = document.getElementById('backToStageButton');
        if (backButton) {
            console.log('もどるボタンが見つかりました');
            backButton.addEventListener('click', () => {
                console.log('ステージ選択に戻るボタンクリック');
                this.showScreen('stageSelectScreen');
                if (window.simpleGame) {
                    window.simpleGame.stop();
                }
            });
        } else {
            console.error('もどるボタンが見つかりません');
        }

        // ゲームクリア画面
        document.getElementById('nextStageButton').addEventListener('click', () => {
            console.log('🔘 つぎのステージへボタンクリック');
            console.log('⏰ クリック時刻:', new Date().toLocaleTimeString());

            // ダブルクリック防止：ボタンを一時的に無効化
            const button = document.getElementById('nextStageButton');
            if (button.disabled) {
                console.log('⚠️ ボタンが無効化されているため処理をスキップ');
                return;
            }

            button.disabled = true;
            button.style.opacity = '0.5';

            this.handleNextStage();

            // 3秒後にボタンを再有効化（通常は画面が切り替わるので実際には無効化されたまま）
            setTimeout(() => {
                button.disabled = false;
                button.style.opacity = '1';
            }, 3000);
        });

        document.getElementById('clearBackButton').addEventListener('click', () => {
            console.log('もどるボタンクリック（クリア画面）');
            this.showScreen('stageSelectScreen');
            if (window.simpleGame) window.simpleGame.stop();
        });

        // ゲームオーバー画面
        document.getElementById('retryButton').addEventListener('click', () => {
            console.log('もういちどボタンクリック');
            this.hideScreen('gameOverScreen');
            // 同じステージを再開始
            if (window.simpleGame) {
                const currentStage = window.simpleGame.currentStage;
                this.startStage(currentStage);
            }
        });

        document.getElementById('gameOverBackButton').addEventListener('click', () => {
            this.showScreen('stageSelectScreen');
            if (window.simpleGame) window.simpleGame.stop();
        });

        // 設定画面
        document.getElementById('musicToggle').addEventListener('click', () => {
            this.toggleSetting('music');
        });

        document.getElementById('soundToggle').addEventListener('click', () => {
            this.toggleSetting('sound');
        });

        // ゲームパッド設定
        document.getElementById('gamepadToggle').addEventListener('click', () => {
            this.toggleGamepadSetting();
        });

        document.getElementById('gamepadDeadzone').addEventListener('input', (e) => {
            this.updateGamepadDeadzone(parseFloat(e.target.value));
        });

        document.getElementById('gamepadTestButton').addEventListener('click', () => {
            this.startGamepadTest();
        });

        document.getElementById('settingsBackButton').addEventListener('click', () => {
            this.showScreen('titleScreen');
        });

        // デバッグ用: クリア画面テスト（開発時のみ）
        // 現在は非表示
        /*
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('デバッグモード: クリア画面テスト機能を追加');
            const debugButton = document.createElement('button');
            debugButton.textContent = 'クリア画面テスト';
            debugButton.style.position = 'fixed';
            debugButton.style.top = '10px';
            debugButton.style.right = '10px';
            debugButton.style.zIndex = '9999';
            debugButton.style.background = 'red';
            debugButton.style.color = 'white';
            debugButton.addEventListener('click', () => {
                console.log('デバッグ: クリア画面テスト実行');
                this.showGameClear({
                    score: 1500,
                    time: 120,
                    itemsCollected: 5
                });
            });
            document.body.appendChild(debugButton);
        }
        */
        this.setupTouchControls();
        this.setupCanvasTouch();
    }

    /**
     * デバッグ機能の設定
     */
    setupDebugFeatures() {
        // ウィンドウリサイズ時のデバッグ情報更新
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.updateGridDebugInfo();
            }, 100);
        });

        // グローバルデバッグ機能
        window.toggleStageGridDebug = () => {
            window.stageGridDebug = !window.stageGridDebug;
            const stageGrid = document.getElementById('stageButtons');

            if (window.stageGridDebug) {
                stageGrid?.classList.add('debug');
                console.log('🔧 ステージグリッドデバッグモード: 有効');
                console.log('📱 使用方法:');
                console.log('  - ブラウザ幅を変更してレスポンシブ動作を確認');
                console.log('  - toggleStageGridDebug() で無効化');
                this.updateGridDebugInfo();
            } else {
                stageGrid?.classList.remove('debug');
                console.log('🔧 ステージグリッドデバッグモード: 無効');
            }

            return window.stageGridDebug;
        };

        // 初期化時に使用方法を表示
        console.log('🎮 UIManager初期化完了');
        console.log('🔧 デバッグ機能: toggleStageGridDebug() でグリッドデバッグモードを切り替え');
    }

    /**
     * タッチコントロール設定（バーチャルパッド + ジャンプボタン）
     */
    setupTouchControls() {
        console.log('🎮 バーチャルパッド + ジャンプボタン設定開始...');

        // バーチャルパッド設定
        this.setupVirtualPad();

        // ジャンプボタンのみ設定
        this.setupJumpButton();

        console.log('✅ タッチコントロール設定完了');
    }

    /**
     * バーチャルパッド設定
     */
    setupVirtualPad() {
        const virtualPad = document.getElementById('virtualPad');
        const padStick = virtualPad.querySelector('.pad-stick');

        if (!virtualPad || !padStick) {
            console.error('❌ バーチャルパッドの要素が見つかりません');
            return;
        }

        // バーチャルパッド状態管理
        this.padState = {
            isActive: false,
            startPos: { x: 0, y: 0 },
            currentPos: { x: 0, y: 0 },
            centerPos: { x: 0, y: 0 },
            maxDistance: 35, // スティックの最大移動距離
            deadZone: 8,     // デッドゾーン（反応しない範囲）
            currentDirection: null,
            currentVerticalDirection: null // UFOモード用の縦方向状態
        };

        console.log('🕹️ バーチャルパッド要素確認:', { virtualPad, padStick });

        // バーチャルパッドの中心位置を計算
        this.updatePadCenterPosition = () => {
            const rect = virtualPad.getBoundingClientRect();
            this.padState.centerPos = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        };

        // 初期化時に中心位置を計算
        this.updatePadCenterPosition();

        // リサイズ時に中心位置を再計算
        window.addEventListener('resize', this.updatePadCenterPosition);

        // タッチイベント
        virtualPad.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePadTouchStart(e);
        });

        virtualPad.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handlePadTouchMove(e);
        });

        virtualPad.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePadTouchEnd(e);
        });

        // マウスイベント（PC用）
        virtualPad.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handlePadMouseStart(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.padState.isActive) {
                e.preventDefault();
                this.handlePadMouseMove(e);
            }
        });

        document.addEventListener('mouseup', (e) => {
            if (this.padState.isActive) {
                e.preventDefault();
                this.handlePadMouseEnd(e);
            }
        });

        console.log('✅ バーチャルパッド設定完了');
    }

    /**
     * ジャンプボタン設定
     */
    setupJumpButton() {
        const jumpButton = document.getElementById('jumpButton');

        if (!jumpButton) {
            console.error('❌ ジャンプボタンが見つかりません');
            return;
        }

        console.log('🦘 ジャンプボタン設定中...');

        // タッチイベント
        jumpButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🦘 ジャンプタッチ開始');
            this.handleButtonInput('jump', true);
            jumpButton.classList.add('pressed');
        });

        jumpButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🦘 ジャンプタッチ終了');
            this.handleButtonInput('jump', false);
            jumpButton.classList.remove('pressed');
        });

        // クリックイベント（マウス用）
        jumpButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🦘 ジャンプクリック');
            this.handleButtonInput('jump', true);
            jumpButton.classList.add('pressed');
            setTimeout(() => {
                this.handleButtonInput('jump', false);
                jumpButton.classList.remove('pressed');
            }, 100);
        });

        console.log('✅ ジャンプボタン設定完了');
    }

    /**
     * バーチャルパッド - タッチ開始処理
     */
    handlePadTouchStart(e) {
        const touch = e.touches[0];
        this.updatePadCenterPosition();

        this.padState.isActive = true;
        this.padState.startPos = {
            x: touch.clientX,
            y: touch.clientY
        };
        this.padState.currentPos = { ...this.padState.startPos };

        const padStick = document.querySelector('.pad-stick');
        padStick.classList.add('active');

        console.log('🕹️ バーチャルパッド タッチ開始:', this.padState.startPos);
    }

    /**
     * バーチャルパッド - タッチ移動処理
     */
    handlePadTouchMove(e) {
        if (!this.padState.isActive) return;

        const touch = e.touches[0];
        this.padState.currentPos = {
            x: touch.clientX,
            y: touch.clientY
        };

        this.updatePadStick();
        this.calculateDirection();
    }

    /**
     * バーチャルパッド - タッチ終了処理
     */
    handlePadTouchEnd(e) {
        console.log('🕹️ バーチャルパッド タッチ終了');
        this.resetPadPosition();
    }

    /**
     * バーチャルパッド - マウス開始処理
     */
    handlePadMouseStart(e) {
        this.updatePadCenterPosition();

        this.padState.isActive = true;
        this.padState.startPos = {
            x: e.clientX,
            y: e.clientY
        };
        this.padState.currentPos = { ...this.padState.startPos };

        const padStick = document.querySelector('.pad-stick');
        padStick.classList.add('active');

        console.log('🕹️ バーチャルパッド マウス開始:', this.padState.startPos);
    }

    /**
     * バーチャルパッド - マウス移動処理
     */
    handlePadMouseMove(e) {
        if (!this.padState.isActive) return;

        this.padState.currentPos = {
            x: e.clientX,
            y: e.clientY
        };

        this.updatePadStick();
        this.calculateDirection();
    }

    /**
     * バーチャルパッド - マウス終了処理
     */
    handlePadMouseEnd(e) {
        console.log('🕹️ バーチャルパッド マウス終了');
        this.resetPadPosition();
    }

    /**
     * スティック位置の更新
     */
    updatePadStick() {
        const deltaX = this.padState.currentPos.x - this.padState.centerPos.x;
        const deltaY = this.padState.currentPos.y - this.padState.centerPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // 最大距離を制限
        const clampedDistance = Math.min(distance, this.padState.maxDistance);
        const angle = Math.atan2(deltaY, deltaX);

        const stickX = Math.cos(angle) * clampedDistance;
        const stickY = Math.sin(angle) * clampedDistance;

        const padStick = document.querySelector('.pad-stick');
        padStick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;

        console.log('🕹️ スティック位置更新:', {
            deltaX: deltaX.toFixed(1),
            deltaY: deltaY.toFixed(1),
            distance: distance.toFixed(1),
            clampedDistance: clampedDistance.toFixed(1),
            stickX: stickX.toFixed(1),
            stickY: stickY.toFixed(1)
        });
    }

    /**
     * 移動方向の計算と入力送信
     */
    calculateDirection() {
        const deltaX = this.padState.currentPos.x - this.padState.centerPos.x;
        const deltaY = this.padState.currentPos.y - this.padState.centerPos.y;
        const distanceX = Math.abs(deltaX);
        const distanceY = Math.abs(deltaY);

        // UFOモードかどうかを確認
        const isUFOMode = window.game?.player?.isUFOMode || false;

        // デッドゾーン内なら何もしない
        if (distanceX < this.padState.deadZone && distanceY < this.padState.deadZone) {
            if (this.padState.currentDirection) {
                console.log('🕹️ デッドゾーン - 移動停止');
                this.handleButtonInput(this.padState.currentDirection, false);
                this.padState.currentDirection = null;
            }
            if (this.padState.currentVerticalDirection) {
                console.log('🕹️ デッドゾーン - 縦移動停止');
                this.handleButtonInput(this.padState.currentVerticalDirection, false);
                this.padState.currentVerticalDirection = null;
            }
            return;
        }

        // 横方向の移動判定
        let newDirection = null;
        if (distanceX >= this.padState.deadZone) {
            if (deltaX < -this.padState.deadZone) {
                newDirection = 'left';
            } else if (deltaX > this.padState.deadZone) {
                newDirection = 'right';
            }
        }

        // 縦方向の移動判定（UFOモードのみ）
        let newVerticalDirection = null;
        if (isUFOMode && distanceY >= this.padState.deadZone) {
            if (deltaY < -this.padState.deadZone) {
                newVerticalDirection = 'up';
            } else if (deltaY > this.padState.deadZone) {
                newVerticalDirection = 'down';
            }
        }

        // 横方向が変わった場合の処理
        if (newDirection !== this.padState.currentDirection) {
            // 前の方向を停止
            if (this.padState.currentDirection) {
                console.log(`🕹️ 移動停止: ${this.padState.currentDirection}`);
                this.handleButtonInput(this.padState.currentDirection, false);
            }

            // 新しい方向を開始
            if (newDirection) {
                console.log(`🕹️ 移動開始: ${newDirection}`);
                this.handleButtonInput(newDirection, true);
            }

            this.padState.currentDirection = newDirection;
        }

        // 縦方向が変わった場合の処理（UFOモードのみ）
        if (isUFOMode && newVerticalDirection !== this.padState.currentVerticalDirection) {
            // 前の縦方向を停止
            if (this.padState.currentVerticalDirection) {
                console.log(`🕹️ 縦移動停止: ${this.padState.currentVerticalDirection}`);
                this.handleButtonInput(this.padState.currentVerticalDirection, false);
            }

            // 新しい縦方向を開始
            if (newVerticalDirection) {
                console.log(`🕹️ 縦移動開始: ${newVerticalDirection}`);
                this.handleButtonInput(newVerticalDirection, true);
            }

            this.padState.currentVerticalDirection = newVerticalDirection;
        }
    }

    /**
     * スティック位置のリセット
     */
    resetPadPosition() {
        this.padState.isActive = false;

        // 現在の移動を停止
        if (this.padState.currentDirection) {
            console.log(`🕹️ リセット時移動停止: ${this.padState.currentDirection}`);
            this.handleButtonInput(this.padState.currentDirection, false);
            this.padState.currentDirection = null;
        }

        // 縦方向の移動も停止
        if (this.padState.currentVerticalDirection) {
            console.log(`🕹️ リセット時縦移動停止: ${this.padState.currentVerticalDirection}`);
            this.handleButtonInput(this.padState.currentVerticalDirection, false);
            this.padState.currentVerticalDirection = null;
        }

        // スティックを中心に戻す
        const padStick = document.querySelector('.pad-stick');
        padStick.style.transform = 'translate(-50%, -50%)';
        padStick.classList.remove('active');

        console.log('🕹️ バーチャルパッド リセット完了');
    }

    /**
     * ボタン入力処理
     */
    handleButtonInput(action, isPressed) {
        console.log(`🎮 ボタン入力処理: ${action}, 押下状態: ${isPressed}`);
        console.log('🎮 ゲーム状態:', {
            'window.game': !!window.game,
            'window.game.player': !!(window.game && window.game.player),
            'ゲーム実行中': window.game ? window.game.isRunning : false,
            'currentScreen': this.currentScreen
        });

        if (window.game && window.game.player) {
            try {
                window.game.player.handleInput(action, isPressed);
                console.log(`✅ プレイヤーに入力送信: ${action}`);
            } catch (error) {
                console.error('❌ プレイヤー入力エラー:', error);
            }
        } else {
            console.warn('⚠️ ゲームまたはプレイヤーが利用できません');
            console.log('利用可能なオブジェクト:', {
                'window': typeof window,
                'window.game': typeof window.game,
                'window.game?.player': typeof window.game?.player
            });
        }
    }

    /**
     * 画面表示
     */
    showScreen(screenId) {
        console.log(`showScreen: ${screenId} 表示開始`);

        // 全ての画面を非表示
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 指定された画面を表示
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;

            console.log(`showScreen: ${screenId} 表示完了、初期化開始`);

            // 画面固有の初期化処理
            this.initScreen(screenId);
            
            // ゲームパッドメニューナビゲーション再初期化
            this.refreshMenuGamepadNavigation();

            console.log(`showScreen: ${screenId} 初期化完了`);
        } else {
            console.error(`画面要素が見つかりません: ${screenId}`);
        }
    }

    /**
     * 画面非表示
     */
    hideScreen(screenId) {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('active');
        }
    }

    /**
     * 画面固有の初期化
     */
    initScreen(screenId) {
        console.log(`initScreen: ${screenId} 初期化開始`);

        switch (screenId) {
            case 'titleScreen':
                console.log('タイトル画面の初期化処理実行');
                // プレイヤー情報の表示を更新
                this.updatePlayerNameDisplay();
                break;
            case 'nameInputScreen':
                document.getElementById('playerNameInput').focus();
                break;
            case 'stageSelectScreen':
                this.updateStageButtons();
                this.updatePlayerNameDisplay();
                break;
            case 'settingsScreen':
                this.updateSettingsUI();
                break;
            case 'playerListScreen':
                console.log('プレイヤー一覧画面の初期化処理実行');
                // 現在のプレイヤー表示を確実に更新
                this.updateCurrentPlayerDisplay();

                // DOM描画後の遅延更新（タイミング問題の解決）
                setTimeout(() => {
                    console.log('遅延更新: 現在のプレイヤー表示を再更新');
                    this.updateCurrentPlayerDisplay();
                }, 100);
                break;
        }

        console.log(`initScreen: ${screenId} 初期化完了`);
    }

    /**
     * 名前入力処理
     */
    handleNameInput() {
        const nameInput = document.getElementById('playerNameInput');
        const name = nameInput.value.trim();

        console.log('名前入力処理開始:', {
            rawValue: nameInput.value,
            trimmedValue: name,
            length: name.length
        });

        if (name.length > 0) {
            console.log('有効な名前が入力されました:', name);

            // 既存のプレイヤー名リストを取得
            const existingPlayers = gameStorage.getAllPlayerNames();
            const isExistingPlayer = existingPlayers.includes(name);

            // プレイヤーを設定
            gameStorage.setCurrentPlayer(name);

            // プレイヤー名を保存
            const success = gameStorage.savePlayerName(name);

            if (success) {
                // 最新データを読み込み
                this.gameData = gameStorage.loadGameData();

                // UI更新
                this.updatePlayerNameDisplay();
                this.updateUI();

                console.log('名前保存成功:', name);

                if (isExistingPlayer) {
                    alert(`プレイヤー "${name}" に切り替えました`);
                } else {
                    alert(`新しいプレイヤー "${name}" を作成しました\nゼロからスタートです！`);
                }

                this.showScreen('stageSelectScreen');
            } else {
                console.error('名前保存失敗');
                alert('なまえのほぞんにしっぱいしました');
            }
        } else {
            console.log('空の名前が入力されました');
            alert('なまえをいれてください');
            nameInput.focus();
        }
    }

    /**
     * ステージボタン更新
     */
    updateStageButtons() {
        const stageButtonsContainer = document.getElementById('stageButtons');
        const stageStats = this.gameData.progress.stageStats || {};
        stageButtonsContainer.innerHTML = '';

        // デバッグ機能: 現在の列数を表示
        this.updateGridDebugInfo();

        for (let i = 1; i <= 20; i++) {
            const button = document.createElement('button');
            button.className = 'stage-button';

            const isUnlocked = gameStorage.isStageUnlocked(i);
            const isCompleted = gameStorage.isStageCompleted(i);
            const stats = stageStats[i] || {};

            if (isUnlocked) {
                if (isCompleted) {
                    // 星評価計算
                    const stars = this.calculateStageStars(stats, isCompleted);
                    const starsDisplay = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

                    button.classList.add('completed');
                    button.innerHTML = `
                        <div class="stage-number">${i}</div>
                        <div class="stage-stars">${starsDisplay}</div>
                        <div class="stage-info">
                            <div class="stage-score">${(stats.bestScore || 0).toLocaleString()}</div>
                            <div class="stage-time">${this.formatTime((stats.bestTime || 0) * 1000)}</div>
                        </div>
                    `;
                } else {
                    button.classList.add('unlocked');
                    button.innerHTML = `<div class="stage-number">${i}</div>`;
                }

                button.addEventListener('click', () => {
                    this.startStage(i);
                });
            } else {
                button.classList.add('locked');
                button.innerHTML = `<div class="stage-number">${i}</div><div class="lock-icon">🔒</div>`;
            }

            stageButtonsContainer.appendChild(button);
        }
    }

    /**
     * グリッドデバッグ情報更新
     */
    updateGridDebugInfo() {
        const stageGrid = document.getElementById('stageButtons');
        if (!stageGrid) return;

        // 現在の画面幅に基づく列数を計算
        const width = window.innerWidth;
        let columns = 5; // デフォルト

        if (width >= 1024) {
            columns = 5;
        } else if (width >= 768) {
            columns = 4;
        } else if (width >= 480) {
            columns = 3;
        } else {
            columns = 2;
        }

        // デバッグ情報を設定
        stageGrid.setAttribute('data-columns', columns);

        // デバッグモードが有効な場合、コンソールに情報を出力
        if (window.stageGridDebug) {
            console.log(`🔧 Grid Debug: 画面幅=${width}px, 列数=${columns}`);
        }
    }

    /**
     * ステージ開始
     */
    startStage(stageNumber) {
        this.showScreen('gameScreen');

        // 既存のゲームを停止
        if (window.simpleGame) {
            window.simpleGame.stop();
            window.simpleGame = null;
        }

        // ライフ表示を確実に初期化（最大ライフで開始）
        this.updateLivesDisplay(3);
        console.log('ライフ表示を3個で初期化しました');

        // クラス定義を待機してからゲーム開始
        this.waitForClassesAndStartGame(stageNumber);
    }

    /**
     * クラス定義を待機してゲーム開始
     */
    waitForClassesAndStartGame(stageNumber, retryCount = 0) {
        const maxRetries = 20; // 試行回数を増加
        const retryDelay = 200; // 待機時間を延長

        console.log(`=== クラス定義確認 (試行 ${retryCount + 1}/${maxRetries}) ===`);
        console.log('直接参照:', {
            SimpleGame: typeof SimpleGame,
            Player: typeof Player,
            Stage: typeof Stage
        });
        console.log('window経由:', {
            SimpleGame: typeof window.SimpleGame,
            Player: typeof window.Player,
            Stage: typeof window.Stage
        });

        // 必要なクラスが全て定義されているかチェック（両方の方法で確認）
        const directCheck = typeof SimpleGame !== 'undefined' &&
            typeof Player !== 'undefined' &&
            typeof Stage !== 'undefined';

        const windowCheck = typeof window.SimpleGame !== 'undefined' &&
            typeof window.Player !== 'undefined' &&
            typeof window.Stage !== 'undefined';

        if (directCheck || windowCheck) {
            console.log('✅ 全てのクラスが定義されました');
            // 全てのクラスが定義されている場合、ゲーム開始
            this.startGameWithClasses(stageNumber);
            return;
        }

        // まだクラスが定義されていない場合
        if (retryCount < maxRetries) {
            console.log(`⏳ クラス定義待機中... ${retryDelay}ms後に再試行`);
            setTimeout(() => {
                this.waitForClassesAndStartGame(stageNumber, retryCount + 1);
            }, retryDelay);
        } else {
            // 最大試行回数に達した場合
            const missingClasses = [];
            if (typeof window.SimpleGame === 'undefined' && typeof SimpleGame === 'undefined') missingClasses.push('SimpleGame');
            if (typeof window.Player === 'undefined' && typeof Player === 'undefined') missingClasses.push('Player');
            if (typeof window.Stage === 'undefined' && typeof Stage === 'undefined') missingClasses.push('Stage');

            const errorMessage = `必要なクラスが定義されていません: ${missingClasses.join(', ')}`;
            console.error('❌', errorMessage);
            alert('ゲームの開始に失敗しました: ' + errorMessage);
        }
    }

    /**
     * クラス定義完了後のゲーム開始処理
     */
    startGameWithClasses(stageNumber) {
        try {
            console.log('🎮 全クラス定義確認完了 - ゲーム開始:', stageNumber);

            // SimpleGameクラスを取得（直接参照またはwindow経由）
            const SimpleGameClass = typeof SimpleGame !== 'undefined' ? SimpleGame : window.SimpleGame;

            if (!SimpleGameClass) {
                throw new Error('SimpleGameクラスが見つかりません');
            }

            window.simpleGame = new SimpleGameClass();
            // タッチコントロール用に window.game も設定
            window.game = window.simpleGame;

            window.simpleGame.startStage(stageNumber);
            console.log('✅ シンプルゲーム開始処理完了');
            console.log('🔗 window.game と window.simpleGame を連携:', {
                'window.game': !!window.game,
                'window.simpleGame': !!window.simpleGame,
                'window.game.player': !!(window.game && window.game.player),
                '同一インスタンス': window.game === window.simpleGame
            });

            // ゲーム開始後にもう一度ライフ表示を確認
            setTimeout(() => {
                if (window.simpleGame && window.simpleGame.gameState) {
                    this.updateLivesDisplay(window.simpleGame.gameState.lives);
                    console.log('❤️ ゲーム開始後ライフ表示確認:', window.simpleGame.gameState.lives);
                }
            }, 200);

            // デバッグ情報設定をゲームインスタンスとプレイヤーに反映
            setTimeout(() => {
                if (window.simpleGame) {
                    // ゲームインスタンスに反映
                    window.simpleGame.showDebugInfo = this.gameData.settings.debugInfo;

                    // プレイヤーにも反映
                    if (window.simpleGame.player) {
                        window.simpleGame.player.showDebugInfo = this.gameData.settings.debugInfo;
                    }

                    console.log('🐛 デバッグ情報設定をゲームに反映:', this.gameData.settings.debugInfo);
                }
            }, 300);

        } catch (error) {
            console.error('❌ ゲーム開始エラー:', error);
            console.error('エラースタック:', error.stack);
            alert('ゲームの開始に失敗しました: ' + error.message);
        }
    }

    /**
 * 次のステージへ
 */
    handleNextStage() {
        console.log('=== handleNextStage() 開始 ===');

        const currentGame = window.simpleGame || window.game;

        if (!currentGame) {
            console.error('❌ ゲームインスタンスが見つかりません');
            this.showScreen('stageSelectScreen');
            return;
        }

        // **修正**：実際にクリアしたステージ番号を使用（プロパティとDOM属性の両方をチェック）
        let clearedStage = this.clearedStageNumber;

        // プロパティがnullの場合はDOM属性からバックアップを取得
        const nextButton = document.getElementById('nextStageButton');
        if (!clearedStage && nextButton) {
            const domClearedStage = nextButton.getAttribute('data-cleared-stage');
            if (domClearedStage) {
                clearedStage = parseInt(domClearedStage, 10);
                console.log('🔄 DOM属性からクリアステージ番号を復元:', clearedStage);
            }
        }

        console.log('🔍 詳細デバッグ情報:', {
            clearedStage: clearedStage,
            propertyValue: this.clearedStageNumber,
            domAttribute: nextButton ? nextButton.getAttribute('data-cleared-stage') : 'なし',
            currentStage: currentGame.currentStage,
            gameInstance: currentGame.constructor.name,
            isCompleting: currentGame.isCompleting || 'undefined'
        });

        if (!clearedStage) {
            console.error('❌ クリアしたステージ番号が見つかりません（プロパティとDOM属性の両方でnull）');
            this.showScreen('stageSelectScreen');
            return;
        }

        // ステージ20をクリアした場合、全ステージクリアメッセージを表示
        if (clearedStage === 20) {
            console.log('🎉 ステージ20クリア検出！全ステージクリアメッセージ表示');
            alert('🎉 おめでとう！すべてのステージをクリアしました！');
            this.showScreen('stageSelectScreen');
            currentGame.stop();
            // クリアしたステージ番号とDOM属性をリセット
            this.clearedStageNumber = null;
            if (nextButton) {
                nextButton.removeAttribute('data-cleared-stage');
            }
            return;
        }

        // ステージ1-19の場合、次のステージに進む処理
        if (clearedStage < 20) {
            const nextStage = clearedStage + 1;
            console.log(`次のステージ処理: ${clearedStage} → ${nextStage}`);

            // 次のステージが解放されているかチェック
            if (gameStorage.isStageUnlocked(nextStage)) {
                console.log(`ステージ${nextStage}開始`);
                this.hideScreen('clearScreen');
                // クリアしたステージ番号とDOM属性をリセット
                this.clearedStageNumber = null;
                if (nextButton) {
                    nextButton.removeAttribute('data-cleared-stage');
                }
                this.startStage(nextStage);
            } else {
                console.log(`ステージ${nextStage}は未解放のため、ステージ選択画面へ`);
                this.showScreen('stageSelectScreen');
                currentGame.stop();
                // クリアしたステージ番号とDOM属性をリセット
                this.clearedStageNumber = null;
                if (nextButton) {
                    nextButton.removeAttribute('data-cleared-stage');
                }
            }
        } else {
            // ステージ20より大きい場合（通常はありえない）
            console.log('無効なステージ番号、ステージ選択画面に戻る');
            this.showScreen('stageSelectScreen');
            currentGame.stop();
            // クリアしたステージ番号とDOM属性をリセット
            this.clearedStageNumber = null;
            if (nextButton) {
                nextButton.removeAttribute('data-cleared-stage');
            }
        }
    }

    /**
 * 全ステージクリア済みかチェック
 */
    checkAllStagesCompleted() {
        const totalStages = 20;
        let completedCount = 0;
        const completedStages = [];
        const uncompletedStages = [];

        for (let i = 1; i <= totalStages; i++) {
            if (gameStorage.isStageCompleted(i)) {
                completedCount++;
                completedStages.push(i);
            } else {
                uncompletedStages.push(i);
            }
        }

        console.log(`ステージクリア状況詳細:`, {
            completedCount: `${completedCount}/${totalStages}`,
            completedStages: completedStages,
            uncompletedStages: uncompletedStages,
            isAllCompleted: completedCount === totalStages
        });

        return completedCount === totalStages;
    }

    /**
     * 設定切り替え
     */
    toggleSetting(setting) {
        this.gameData.settings[setting] = !this.gameData.settings[setting];
        gameStorage.saveSettings(this.gameData.settings);
        this.updateSettingsUI();

        // デバッグ情報設定の場合、プレイヤーとゲームインスタンスにも反映
        if (setting === 'debugInfo') {
            const currentGame = window.simpleGame || window.game;
            if (currentGame) {
                // ゲームインスタンスに反映
                currentGame.showDebugInfo = this.gameData.settings.debugInfo;

                // プレイヤーにも反映
                if (currentGame.player) {
                    currentGame.player.showDebugInfo = this.gameData.settings.debugInfo;
                }

                console.log(`デバッグ情報表示: ${this.gameData.settings.debugInfo ? 'ON' : 'OFF'}`);
            }
        }
    }

    /**
     * 設定UI更新
     */
    updateSettingsUI() {
        const musicButton = document.getElementById('musicToggle');
        const soundButton = document.getElementById('soundToggle');
        const debugInfoButton = document.getElementById('debugInfoToggle');
        const testDataButton = document.getElementById('testDataToggle');

        musicButton.textContent = this.gameData.settings.music ? 'ON' : 'OFF';
        musicButton.className = this.gameData.settings.music ? 'toggle-button' : 'toggle-button off';

        soundButton.textContent = this.gameData.settings.sound ? 'ON' : 'OFF';
        soundButton.className = this.gameData.settings.sound ? 'toggle-button' : 'toggle-button off';

        debugInfoButton.textContent = this.gameData.settings.debugInfo ? 'ON' : 'OFF';
        debugInfoButton.className = this.gameData.settings.debugInfo ? 'toggle-button' : 'toggle-button off';

        testDataButton.textContent = this.gameData.settings.testDataMode ? 'ON' : 'OFF';
        testDataButton.className = this.gameData.settings.testDataMode ? 'toggle-button' : 'toggle-button off';

        // ゲームパッド設定更新
        this.updateGamepadSettingsUI();
    }

    /**
     * ゲームパッド設定UI更新
     */
    updateGamepadSettingsUI() {
        const gamepadToggle = document.getElementById('gamepadToggle');
        const gamepadDeadzone = document.getElementById('gamepadDeadzone');
        const deadzoneValue = document.getElementById('deadzoneValue');
        const connectionStatus = document.getElementById('gamepadConnectionStatus');

        // UIManagerのメニューGamepadManagerまたはゲーム内GamepadManagerを優先的に取得
        const gamepadManager = this.menuGamepadManager || window.game?.gamepadManager;

        if (gamepadToggle) {
            const isEnabled = gamepadManager ? gamepadManager.isEnabled : true;
            
            gamepadToggle.textContent = isEnabled ? 'ON' : 'OFF';
            gamepadToggle.className = isEnabled ? 'toggle-button' : 'toggle-button off';
        }

        if (gamepadDeadzone && deadzoneValue) {
            const deadzone = gamepadManager ? gamepadManager.deadzone : 0.15;
            
            gamepadDeadzone.value = deadzone;
            deadzoneValue.textContent = deadzone.toFixed(2);
        }

        if (connectionStatus) {
            this.updateGamepadConnectionStatus();
        }
    }

    /**
     * ゲームパッド設定切り替え
     */
    toggleGamepadSetting() {
        // UIManagerのメニューGamepadManagerまたはゲーム内GamepadManagerを優先的に取得
        const gamepadManager = this.menuGamepadManager || window.game?.gamepadManager;
        if (!gamepadManager) {
            console.warn('⚠️ ゲームパッドマネージャーが見つかりません');
            return;
        }

        gamepadManager.setEnabled(!gamepadManager.isEnabled);
        this.updateGamepadSettingsUI();
        
        console.log('🎮 ゲームパッド設定変更:', gamepadManager.isEnabled ? '有効' : '無効');
    }

    /**
     * ゲームパッドデッドゾーン更新
     */
    updateGamepadDeadzone(value) {
        // UIManagerのメニューGamepadManagerまたはゲーム内GamepadManagerを優先的に取得
        const gamepadManager = this.menuGamepadManager || window.game?.gamepadManager;
        if (!gamepadManager) return;

        gamepadManager.setDeadzone(value);
        document.getElementById('deadzoneValue').textContent = value.toFixed(2);
        
        console.log('🎮 デッドゾーン更新:', value);
    }

    /**
     * ゲームパッド接続状態更新
     */
    updateGamepadConnectionStatus() {
        const connectionStatus = document.getElementById('gamepadConnectionStatus');
        if (!connectionStatus) return;

        // UIManagerのメニューGamepadManagerまたはゲーム内GamepadManagerを優先的に取得
        const gamepadManager = this.menuGamepadManager || window.game?.gamepadManager;
        if (!gamepadManager) {
            connectionStatus.textContent = '未対応';
            connectionStatus.className = 'status-indicator disconnected';
            return;
        }

        const status = gamepadManager.getConnectionStatus();
        
        if (status.isConnected) {
            connectionStatus.textContent = `接続中 (${status.connectedControllers}台)`;
            connectionStatus.className = 'status-indicator connected';
        } else {
            connectionStatus.textContent = '未接続';
            connectionStatus.className = 'status-indicator disconnected';
        }
    }

    /**
     * ゲームパッドテスト開始
     */
    startGamepadTest() {
        const testButton = document.getElementById('gamepadTestButton');
        // UIManagerのメニューGamepadManagerまたはゲーム内GamepadManagerを優先的に取得
        const gamepadManager = this.menuGamepadManager || window.game?.gamepadManager;
        
        if (!gamepadManager) {
            console.warn('⚠️ ゲームパッドマネージャーが見つかりません');
            console.warn('デバッグ情報:', {
                menuGamepadManager: !!this.menuGamepadManager,
                gameGamepadManager: !!window.game?.gamepadManager,
                windowGame: !!window.game
            });
            return;
        }

        if (testButton.classList.contains('testing')) {
            // テスト終了
            this.stopGamepadTest();
            return;
        }

        // テスト開始 - データ収集初期化
        this.gamepadTestData = {
            startTime: Date.now(),
            leftStick: { detected: false, movements: 0 },
            rightStick: { detected: false, movements: 0 },
            buttons: new Set(),
            dPad: { up: false, down: false, left: false, right: false },
            totalInputs: 0
        };
        
        testButton.textContent = 'テストちゅう...';
        testButton.classList.add('testing');
        
        // テスト開始通知を表示
        this.showGamepadTestStartNotification();
        
        console.log('🎮 ゲームパッドテスト開始');
        
        // 10秒後に自動終了
        this.gamepadTestTimer = setTimeout(() => {
            this.stopGamepadTest();
        }, 10000);
        
        // リアルタイム表示開始
        this.gamepadTestInterval = setInterval(() => {
            this.updateGamepadTestDisplay();
        }, 100);
    }

    /**
     * ゲームパッドテスト終了
     */
    stopGamepadTest() {
        const testButton = document.getElementById('gamepadTestButton');
        
        testButton.textContent = 'テストかいし';
        testButton.classList.remove('testing');
        
        if (this.gamepadTestTimer) {
            clearTimeout(this.gamepadTestTimer);
            this.gamepadTestTimer = null;
        }
        
        if (this.gamepadTestInterval) {
            clearInterval(this.gamepadTestInterval);
            this.gamepadTestInterval = null;
        }
        
        // テスト結果を表示
        if (this.gamepadTestData) {
            this.showGamepadTestResult();
        }
        
        console.log('🎮 ゲームパッドテスト終了');
    }

    /**
     * ゲームパッドテスト表示更新
     */
    updateGamepadTestDisplay() {
        const gamepadManager = this.menuGamepadManager || window.game?.gamepadManager;
        if (!gamepadManager || !this.gamepadTestData) return;

        const inputState = gamepadManager.getLiveInputState();
        if (!inputState) return;
        
        // スティック入力の検出（閾値0.3以上で反応とみなす）
        const leftStickMagnitude = Math.sqrt(
            Math.pow(parseFloat(inputState.leftStick.x), 2) + 
            Math.pow(parseFloat(inputState.leftStick.y), 2)
        );
        const rightStickMagnitude = Math.sqrt(
            Math.pow(parseFloat(inputState.rightStick.x), 2) + 
            Math.pow(parseFloat(inputState.rightStick.y), 2)
        );
        
        if (leftStickMagnitude > 0.3) {
            this.gamepadTestData.leftStick.detected = true;
            this.gamepadTestData.leftStick.movements++;
        }
        
        if (rightStickMagnitude > 0.3) {
            this.gamepadTestData.rightStick.detected = true;
            this.gamepadTestData.rightStick.movements++;
        }
        
        // ボタン入力の検出
        inputState.buttons.forEach(button => {
            if (button.pressed) {
                this.gamepadTestData.buttons.add(button.index);
                this.gamepadTestData.totalInputs++;
            }
        });
        
        // 十字キーの検出
        if (inputState.dPad.up) this.gamepadTestData.dPad.up = true;
        if (inputState.dPad.down) this.gamepadTestData.dPad.down = true;
        if (inputState.dPad.left) this.gamepadTestData.dPad.left = true;
        if (inputState.dPad.right) this.gamepadTestData.dPad.right = true;
        
        // デバッグログ（縮小版）
        if (this.gamepadTestData.totalInputs % 10 === 0 && this.gamepadTestData.totalInputs > 0) {
            console.log('🎮 テスト進行:', {
                leftStick: leftStickMagnitude > 0.3,
                rightStick: rightStickMagnitude > 0.3,
                buttonsPressed: inputState.buttons.filter(b => b.pressed).length,
                totalDetected: this.gamepadTestData.buttons.size
            });
        }
        
        this.updateGamepadConnectionStatus();
    }

    /**
     * ゲームパッドテスト開始通知表示
     */
    showGamepadTestStartNotification() {
        const connectionStatus = this.menuGamepadManager?.getConnectionStatus() || { isConnected: false, connectedControllers: 0 };
        
        const startHTML = `
            <div class="test-start-header">
                <span class="test-start-icon">🎮</span>
                <span class="test-start-title">テスト開始</span>
            </div>
            <div class="test-start-content">
                <div class="test-start-item">
                    <span class="start-icon">⏱️</span>
                    <span class="start-text">テスト時間: 10秒間</span>
                </div>
                <div class="test-start-item">
                    <span class="start-icon">🎯</span>
                    <span class="start-text">テスト内容:</span>
                </div>
                <div class="test-instruction">
                    <div>• スティックを動かしてください</div>
                    <div>• ボタンを押してください</div>
                    <div>• 十字キーを押してください</div>
                </div>
                ${connectionStatus.isConnected ? 
                    '<div class="test-start-ready">✅ コントローラー接続済み</div>' : 
                    '<div class="test-start-warning">⚠️ コントローラーが未接続です</div>'
                }
            </div>
        `;
        
        // DOM更新
        document.getElementById('testResultContent').innerHTML = startHTML;
        document.getElementById('testResultSummary').innerHTML = '';
        
        // 開始通知表示（テスト結果表示まで継続）
        const resultElement = document.getElementById('gamepadTestResult');
        resultElement.classList.remove('hidden');
        resultElement.classList.add('show', 'test-starting');
        
        console.log('🎮 テスト開始通知表示');
    }

    /**
     * ゲームパッドテスト結果表示
     */
    showGamepadTestResult() {
        if (!this.gamepadTestData) return;
        
        const data = this.gamepadTestData;
        const testDuration = (Date.now() - data.startTime) / 1000;
        
        // 結果データの生成
        const connectionStatus = this.menuGamepadManager?.getConnectionStatus() || { isConnected: false, connectedControllers: 0 };
        const dPadDirections = Object.values(data.dPad).filter(v => v).length;
        
        // 総合評価の判定
        let overallRating = '';
        let ratingClass = '';
        
        if (connectionStatus.isConnected && data.buttons.size >= 3 && 
            (data.leftStick.detected || data.rightStick.detected) && dPadDirections >= 2) {
            overallRating = '良好';
            ratingClass = 'excellent';
        } else if (connectionStatus.isConnected && (data.buttons.size >= 1 || data.leftStick.detected || data.rightStick.detected)) {
            overallRating = '一部反応';
            ratingClass = 'partial';
        } else {
            overallRating = '問題あり';
            ratingClass = 'poor';
        }
        
        // 結果HTMLの生成
        const contentHTML = `
            <div class="test-result-item">
                <span class="result-icon">${connectionStatus.isConnected ? '✅' : '❌'}</span>
                <span class="result-label">接続:</span>
                <span class="result-value">${connectionStatus.isConnected ? `正常 (${connectionStatus.connectedControllers}台)` : '未接続'}</span>
            </div>
            <div class="test-result-item">
                <span class="result-icon">${data.leftStick.detected || data.rightStick.detected ? '✅' : '⚠️'}</span>
                <span class="result-label">スティック:</span>
                <span class="result-value">${this.getStickStatusText(data)}</span>
            </div>
            <div class="test-result-item">
                <span class="result-icon">${data.buttons.size > 0 ? '✅' : '⚠️'}</span>
                <span class="result-label">ボタン:</span>
                <span class="result-value">${data.buttons.size}個反応</span>
            </div>
            <div class="test-result-item">
                <span class="result-icon">${dPadDirections > 0 ? '✅' : '⚠️'}</span>
                <span class="result-label">方向キー:</span>
                <span class="result-value">${this.getDPadStatusText(data.dPad)}</span>
            </div>
        `;
        
        const summaryHTML = `
            <div class="test-result-separator"></div>
            <div class="test-result-overall ${ratingClass}">
                <span class="overall-label">総合:</span>
                <span class="overall-value">${overallRating}</span>
            </div>
        `;
        
        // DOM更新
        document.getElementById('testResultContent').innerHTML = contentHTML;
        document.getElementById('testResultSummary').innerHTML = summaryHTML;
        
        // 開始通知を終了して結果表示に切り替え
        const resultElement = document.getElementById('gamepadTestResult');
        resultElement.classList.remove('hidden', 'test-starting');
        resultElement.classList.add('show');
        
        // 5秒後に自動非表示
        setTimeout(() => {
            resultElement.classList.remove('show');
            setTimeout(() => {
                resultElement.classList.add('hidden');
            }, 300); // フェードアウト時間
        }, 5000);
        
        console.log('🎮 テスト結果表示:', { overallRating, testDuration: testDuration.toFixed(1) + 's' });
    }
    
    /**
     * スティック状態テキスト生成
     */
    getStickStatusText(data) {
        const left = data.leftStick.detected;
        const right = data.rightStick.detected;
        
        if (left && right) return '左右とも反応';
        if (left) return '左のみ反応';
        if (right) return '右のみ反応';
        return '反応なし';
    }
    
    /**
     * 十字キー状態テキスト生成
     */
    getDPadStatusText(dPad) {
        const directions = [];
        if (dPad.up) directions.push('上');
        if (dPad.down) directions.push('下');
        if (dPad.left) directions.push('左');
        if (dPad.right) directions.push('右');
        
        if (directions.length === 0) return '反応なし';
        if (directions.length >= 3) return `${directions.length}方向反応`;
        return `${directions.join('・')}反応`;
    }

    /**
     * ゲームパッド接続変化時のコールバック
     */
    onGamepadConnectionChange(type, gamepad) {
        console.log(`🎮 ゲームパッド${type}:`, gamepad.id);
        
        // 接続状態表示を更新
        this.updateGamepadConnectionStatus();
        
        // 通知メッセージ表示（実装可能であれば）
        const message = type === 'connected' 
            ? `ゲームパッド接続: ${gamepad.id}` 
            : `ゲームパッド切断: ${gamepad.id}`;
        
        // 簡易通知（コンソールログ）
        console.log(`📢 ${message}`);
    }

    /**
     * ゲームUI更新
     */
    updateGameUI(gameState) {
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('time').textContent = Math.floor(gameState.time);
        this.updateLivesDisplay(gameState.lives);
    }

    /**
     * プログレスバー付きゲームUI更新
     */
    updateGameUIWithProgress(gameState, player) {
        // 基本的なUI更新
        this.updateGameUI(gameState);

        // プレイヤー情報が存在する場合のみプログレス更新
        if (player) {
            this.updateProgressBar(player);
            this.updateLevelInfo(player);
        }
    }

    /**
 * プログレスバー更新
 */
    updateProgressBar(player) {
        const progressFill = document.getElementById('progressFill');
        const progressCount = document.getElementById('progressCount');

        if (progressFill && progressCount) {
            const playerLevel = player.playerLevel || 1;
            const collected = player.itemsInCurrentLevel || 0;
            let required = player.itemsRequiredForLevelUp || 10;
            
            // レベルに応じて必要アイテム数を設定
            if (playerLevel === 1) {
                required = 10; // レベル1→2: 10個
            } else if (playerLevel === 2) {
                required = 15; // レベル2→3: 15個
            } else {
                // レベル3（最大レベル）に達している場合は満タン表示
                progressFill.style.width = '100%';
                progressCount.textContent = `MAX`;
                
                console.log('プログレスバー更新（最大レベル）:', {
                    playerLevel: playerLevel,
                    status: 'MAX_LEVEL'
                });
                return;
            }

            // 通常の進捗表示
            const percentage = Math.min((collected / required) * 100, 100);
            progressFill.style.width = `${percentage}%`;
            progressCount.textContent = `${collected}/${required}`;

            console.log('プログレスバー更新:', {
                playerLevel: playerLevel,
                collected: collected,
                required: required,
                percentage: percentage
            });
        }
    }

    /**
     * レベル情報更新
     */
    updateLevelInfo(player) {
        const levelLabel = document.getElementById('levelLabel');
        const levelAbility = document.getElementById('levelAbility');

        if (levelLabel && levelAbility) {
            const level = player.playerLevel || 1;
            levelLabel.textContent = `レベル ${level}`;

            // レベルに応じた能力表示
            if (level >= 3) {
                levelAbility.textContent = 'UFO機能';
            } else if (level >= 2) {
                levelAbility.textContent = 'トリプルジャンプ';
            } else {
                levelAbility.textContent = 'ダブルジャンプ';
            }

            console.log('レベル情報更新:', {
                level: level,
                ability: levelAbility.textContent
            });
        }
    }

    /**
     * レベルアップ通知表示
     */
    showLevelUpNotification(message = null) {
        // 既存の通知がある場合は削除
        const existingNotification = document.querySelector('.level-up-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // メッセージを設定
        let subtitle = 'トリプルジャンプがアンロックされました!';
        let icon = '🌟';
        
        if (message) {
            if (message.includes('UFO') || message.includes('レベル3')) {
                subtitle = 'UFO機能がアンロックされました!';
                icon = '🛸';
            } else if (message.includes('三段ジャンプ') || message.includes('レベル2')) {
                subtitle = 'トリプルジャンプがアンロックされました!';
                icon = '🌟';
            }
        }

        // レベルアップ通知要素を作成
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">${icon}</div>
                <div class="level-up-text">レベルアップ!</div>
                <div class="level-up-subtitle">${subtitle}</div>
            </div>
        `;

        // ゲーム画面に追加
        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) {
            gameScreen.appendChild(notification);

            // アニメーション付きで表示
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);

            // 3秒後に自動削除
            setTimeout(() => {
                notification.classList.add('hide');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 500);
            }, 3000);
        }

        console.log('🌟 レベルアップ通知表示:', { message, subtitle, icon });
    }

    /**
     * ライフ表示更新
     */
    updateLivesDisplay(currentLives, showDamageEffect = false) {
        const heartsContainer = document.getElementById('hearts');
        const maxLives = 3; // 最大ライフ数

        // ハートを全てクリア
        heartsContainer.innerHTML = '';

        // ハートを生成
        for (let i = 0; i < maxLives; i++) {
            const heart = document.createElement('span');
            heart.className = 'heart';
            heart.textContent = '❤️';

            // 失ったライフは灰色に
            if (i >= currentLives) {
                heart.classList.add('lost');
                heart.textContent = '🤍'; // 白いハート

                // 最後に失ったハートにダメージエフェクト
                if (showDamageEffect && i === currentLives) {
                    setTimeout(() => {
                        heart.classList.add('damage');
                    }, 100);
                }
            }

            heartsContainer.appendChild(heart);
        }
    }

    /**
     * ダメージ時のライフ表示更新（アニメーション付き）
     */
    updateLivesWithDamage(currentLives) {
        // 全てのハートにダメージアニメーションを適用
        const hearts = document.querySelectorAll('.heart:not(.lost)');
        hearts.forEach(heart => {
            heart.classList.add('damage');
        });

        // 少し遅れてライフ表示を更新
        setTimeout(() => {
            this.updateLivesDisplay(currentLives, true);
        }, 300);
    }

    /**
     * ゲームクリア表示
     */
    showGameClear(stats) {
        console.log('ゲームクリア画面表示:', stats);

        // 統計情報を表示
        document.getElementById('clearScore').textContent = stats.score.toLocaleString();
        document.getElementById('clearTime').textContent = this.formatTime(stats.time * 1000); // 秒をミリ秒に変換
        document.getElementById('clearItems').textContent = stats.itemsCollected;

        // 次のステージボタンの表示制御
        const currentGame = window.simpleGame || window.game;
        const nextButton = document.getElementById('nextStageButton');

        // **重要**：実際にクリアしたステージ番号を保存（より安全な方法を使用）
        const clearedStage = currentGame ? currentGame.currentStage : null;
        this.clearedStageNumber = clearedStage;

        // DOMエレメントにも保存（バックアップ）
        if (nextButton && clearedStage) {
            nextButton.setAttribute('data-cleared-stage', clearedStage.toString());
        }

        console.log('🎯 クリアしたステージ番号を保存:', {
            property: this.clearedStageNumber,
            domAttribute: nextButton ? nextButton.getAttribute('data-cleared-stage') : 'なし',
            currentStage: currentGame.currentStage
        });

        // デバッグ用：5秒後にも確認
        setTimeout(() => {
            console.log('🔍 5秒後のクリアステージ番号:', {
                property: this.clearedStageNumber,
                domAttribute: nextButton ? nextButton.getAttribute('data-cleared-stage') : 'なし'
            });
        }, 5000);

        console.log('次のステージボタン表示判定:', {
            currentGame: !!currentGame,
            clearedStageNumber: this.clearedStageNumber,
            maxStage: 20
        });

        if (currentGame && this.clearedStageNumber >= 1 && this.clearedStageNumber <= 20) {
            // ステージ1-20すべてで「つぎのステージへ」ボタンを表示
            nextButton.style.display = 'block';
            console.log('✅ 次のステージボタンを表示');
        } else {
            nextButton.style.display = 'none';
            console.log('❌ ゲームインスタンスが見つからないか無効なステージのためボタンを非表示');
        }

        this.showScreen('clearScreen');

        // 統計データを更新（クリア後に最新データを反映）
        setTimeout(() => {
            if (this.gameData) {
                this.gameData = gameStorage.loadGameData();
            }
        }, 100);
    }

    /**
     * ゲームオーバー表示
     */
    showGameOver() {
        this.showScreen('gameOverScreen');
    }

    /**
     * UI全体更新
     */
    updateUI() {
        this.gameData = gameStorage.loadGameData();

        // プレイヤー名表示更新
        this.updatePlayerNameDisplay();
    }

    /**
 * プレイヤー名表示を更新
 */
    updatePlayerNameDisplay() {
        const currentPlayerNameElement = document.getElementById('currentPlayerName');
        const editButton = document.getElementById('editPlayerNameButton');

        if (this.gameData.playerName && this.gameData.playerName.trim() !== '') {
            currentPlayerNameElement.textContent = this.gameData.playerName;
            editButton.style.display = 'inline-block';
        } else {
            currentPlayerNameElement.textContent = 'なまえがないよ';
            editButton.style.display = 'inline-block';
        }

        // キャラクタープレビューアイコンも更新
        this.updateCharacterPreview();
    }

    /**
 * キャラクタープレビューアイコンを更新
 */
    updateCharacterPreview() {
        const characterPreview = document.querySelector('.character-preview');
        if (!characterPreview) return;

        if (this.gameData.playerName && this.gameData.playerName.trim() !== '') {
            // プレイヤーのアイコンを表示
            const playerIcon = this.gameData?.playerIcon || 'cat';
            const iconInfo = gameStorage.getIconById(playerIcon);
            characterPreview.textContent = iconInfo.emoji;
        } else {
            // デフォルトアイコンを表示
            const defaultIconInfo = gameStorage.getIconById('cat');
            characterPreview.textContent = defaultIconInfo.emoji;
        }
    }

    /**
     * プレイヤー名編集画面を表示
     */
    showEditNameScreen() {
        const currentNameInEdit = document.getElementById('currentNameInEdit');
        const currentIconInEdit = document.getElementById('currentIconInEdit');
        const editInput = document.getElementById('editPlayerNameInput');



        // 現在の名前を表示
        if (this.gameData.playerName && this.gameData.playerName.trim() !== '') {
            currentNameInEdit.textContent = this.gameData.playerName;
            editInput.value = this.gameData.playerName;
        } else {
            currentNameInEdit.textContent = 'なまえがないよ';
            editInput.value = '';
        }

        // 現在のアイコンを表示
        const currentIcon = this.gameData?.playerIcon || 'cat';
        const currentIconInfo = gameStorage.getIconById(currentIcon);
        currentIconInEdit.textContent = currentIconInfo.emoji;

        // アイコングリッドを設定
        this.selectedEditIcon = currentIcon; // 編集中の選択アイコンを記録
        this.updateEditIconGrid();

        this.showScreen('editNameScreen');

        // 入力フィールドにフォーカス
        setTimeout(() => {
            editInput.focus();
            editInput.select();
        }, 100);
    }

    /**
     * 編集画面のアイコングリッドを更新
     */
    updateEditIconGrid() {
        const editIconGrid = document.getElementById('editIconGrid');
        if (!editIconGrid) return;

        // 既存のアイコンをクリア
        editIconGrid.innerHTML = '';

        // 利用可能なアイコンを表示
        const availableIcons = gameStorage.getAvailableIcons();
        availableIcons.forEach(iconInfo => {
            const iconOption = this.createEditIconOption(iconInfo);
            editIconGrid.appendChild(iconOption);
        });
    }

    /**
     * 編集画面用のアイコンオプションを作成
     */
    createEditIconOption(iconInfo) {
        const option = document.createElement('div');
        option.className = 'edit-icon-option';

        if (iconInfo.id === this.selectedEditIcon) {
            option.classList.add('selected');
        }

        option.innerHTML = `
            <div class="edit-icon-option-emoji">${iconInfo.emoji}</div>
            <div class="edit-icon-option-name">${iconInfo.name}</div>
        `;

        // クリックイベントを追加
        option.addEventListener('click', () => {
            this.handleEditIconSelection(iconInfo.id);
        });

        return option;
    }

    /**
     * 編集画面でのアイコン選択処理
     */
    handleEditIconSelection(iconId) {
        // 選択状態を更新
        this.selectedEditIcon = iconId;

        // アイコングリッドの表示を更新
        this.updateEditIconGrid();

        // 現在のアイコン表示を更新
        const currentIconInEdit = document.getElementById('currentIconInEdit');
        if (currentIconInEdit) {
            const iconInfo = gameStorage.getIconById(iconId);
            currentIconInEdit.textContent = iconInfo.emoji;
        }
    }

    /**
     * プレイヤー名編集処理
     */
    handleEditNameInput() {
        const nameInput = document.getElementById('editPlayerNameInput');
        const name = nameInput.value.trim();



        // バリデーション
        if (name.length === 0) {
            alert('なまえをいれてください');
            nameInput.focus();
            return;
        }

        // 既存のプレイヤー名リストを取得
        const existingPlayers = gameStorage.getAllPlayerNames();
        const isExistingPlayer = existingPlayers.includes(name);

        try {
            // プレイヤーを切り替え
            gameStorage.setCurrentPlayer(name);

            // プレイヤー名を保存（新規プレイヤーの場合は新しいデータが作成される）
            const nameSuccess = gameStorage.savePlayerName(name);

            if (nameSuccess) {
                // アイコンも更新（編集画面で選択されたアイコン）
                const selectedIcon = this.selectedEditIcon || 'cat';
                const iconSuccess = gameStorage.updatePlayerIcon(name, selectedIcon);

                if (!iconSuccess) {
                    console.warn('アイコン保存失敗（名前は保存済み）');
                }

                // 最新データを読み込み
                this.gameData = gameStorage.loadGameData();

                // UI更新
                this.updatePlayerNameDisplay();
                this.updateUI();

                if (isExistingPlayer) {
                    alert(`プレイヤー "${name}" に切り替えました`);
                } else {
                    alert(`新しいプレイヤー "${name}" を作成しました\nゼロからスタートです！`);
                }

                // タイトル画面に戻る
                this.showScreen('titleScreen');
            } else {
                throw new Error('保存に失敗しました');
            }

        } catch (error) {
            console.error('保存処理エラー:', error);
            alert('なまえのほぞんにしっぱいしました');
        }
    }

    /**
     * 統計画面を表示
     */
    showStatsScreen() {
        // テストデータ生成は無効化（新規プレイヤーはゼロから開始）
        // this.ensureTestData();
        this.updateStatsDisplay();
        this.showScreen('statsScreen');
        
        // 共有機能の初期プレビューを表示（強制実行）
        setTimeout(() => {
            this.ensureSharePreview();
        }, 300);
    }

    /**
     * 共有プレビューの確実な表示
     */
    ensureSharePreview() {
        console.log('🔄 共有プレビュー確認開始');
        
        const canvas = document.getElementById('sharePreviewCanvas');
        if (!canvas) {
            console.error('❌ プレビューキャンバスが見つかりません');
            return;
        }

        // キャンバスが空の場合のみ初期プレビューを表示
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const isEmpty = imageData.data.every(pixel => pixel === 0);

        if (isEmpty || !this.sharePreviewInitialized) {
            console.log('🎨 初期プレビューを強制表示');
            if (this.shareGenerator) {
                this.showInitialPreview();
                this.sharePreviewInitialized = true;
            } else {
                console.log('⚠️ ShareGeneratorが未初期化、再初期化を試行');
                this.setupShareFeatures();
            }
        } else {
            console.log('✅ プレビューは既に表示済み');
        }
    }

    /**
     * テストデータモードのトグル
     */
    toggleTestData() {
        console.log('🔧 toggleTestData() 開始');
        
        const currentPlayer = gameStorage.getCurrentPlayer();
        if (!currentPlayer) {
            alert('プレイヤーが設定されていません');
            return;
        }

        // 最新データを取得
        console.log('📋 データ再読み込み前の状態:', this.gameData.settings.testDataMode);
        this.gameData = gameStorage.loadGameData();
        console.log('📋 データ再読み込み後の状態:', this.gameData.settings.testDataMode);

        // 現在の状態を取得
        const currentMode = this.gameData.settings.testDataMode || false;
        const newMode = !currentMode;

        console.log(`🔧 テストデータモード切り替え: ${currentMode} → ${newMode}`);

        if (newMode) {
            // テストデータモードON: 全ステージを開放
            this.enableTestDataMode();
        } else {
            // テストデータモードOFF: 元の状態に戻す
            this.disableTestDataMode();
        }

        // 設定を保存
        console.log('💾 設定保存前:', { testDataMode: newMode });
        this.gameData.settings.testDataMode = newMode;
        gameStorage.saveSettings({ testDataMode: newMode });
        console.log('💾 設定保存後');

        // データを再読み込み
        console.log('📋 最終データ再読み込み前');
        this.gameData = gameStorage.loadGameData();
        console.log('📋 最終データ再読み込み後:', this.gameData.settings.testDataMode);

        // UI更新
        this.updateSettingsUI();
        this.updateStageButtons();

        console.log(`✅ テストデータモード: ${newMode ? 'ON' : 'OFF'}`);
        console.log('🔧 toggleTestData() 終了');
    }

    /**
     * テストデータモードを有効化（全ステージ開放）
     */
    enableTestDataMode() {
        console.log('🔧 テストデータモード有効化: 全ステージを開放');
        console.log('📋 有効化前の開放ステージ:', this.gameData.progress.unlockedStages);

        // 元の開放状態をバックアップ
        this.gameData.settings.originalUnlockedStages = [...this.gameData.progress.unlockedStages];
        console.log('💾 バックアップ保存:', this.gameData.settings.originalUnlockedStages);

        // 全ステージ（1-20）を開放
        this.gameData.progress.unlockedStages = [];
        for (let i = 1; i <= 20; i++) {
            this.gameData.progress.unlockedStages.push(i);
        }

        // データを保存
        const saveResult = gameStorage.saveGameData(this.gameData);
        console.log('💾 データ保存結果:', saveResult);

        console.log('✅ 全ステージ開放完了:', this.gameData.progress.unlockedStages);
    }

    /**
     * テストデータモードを無効化（元の状態に戻す）
     */
    disableTestDataMode() {
        console.log('🔧 テストデータモード無効化: 元の状態に戻す');
        console.log('📋 無効化前の開放ステージ:', this.gameData.progress.unlockedStages);
        console.log('📋 バックアップデータ:', this.gameData.settings.originalUnlockedStages);

        // バックアップされた開放状態を復元
        if (this.gameData.settings.originalUnlockedStages) {
            this.gameData.progress.unlockedStages = [...this.gameData.settings.originalUnlockedStages];
            console.log('✅ 元の開放状態を復元:', this.gameData.progress.unlockedStages);
        } else {
            // バックアップがない場合は、クリア済みステージに基づいて復元
            const completedStages = this.gameData.progress.completedStages || [];
            this.gameData.progress.unlockedStages = [1]; // 最初はステージ1のみ

            // クリア済みステージの次のステージまで開放
            completedStages.forEach(stage => {
                const nextStage = stage + 1;
                if (nextStage <= 20 && !this.gameData.progress.unlockedStages.includes(nextStage)) {
                    this.gameData.progress.unlockedStages.push(nextStage);
                }
            });

            console.log('✅ クリア実績に基づいて復元:', this.gameData.progress.unlockedStages);
        }

        // バックアップデータを削除
        delete this.gameData.settings.originalUnlockedStages;
        console.log('🗑️ バックアップデータ削除');

        // データを保存
        const saveResult = gameStorage.saveGameData(this.gameData);
        console.log('💾 データ保存結果:', saveResult);
    }

    /**
     * 成績共有機能のセットアップ
     */
    setupShareFeatures() {
        console.log('📸 成績共有機能セットアップ開始');

        try {
            // ShareGeneratorインスタンス作成
            if (!this.shareGenerator) {
                this.shareGenerator = new ShareGenerator();
                console.log('✅ ShareGeneratorインスタンス作成完了');
            }

            // ボタン要素の存在確認（リトライ機能付き）
            const certificateBtn = document.getElementById('shareAsCertificate');
            const dashboardBtn = document.getElementById('shareAsDashboard');
            const downloadBtn = document.getElementById('downloadImage');
            const shareBtn = document.getElementById('shareToSocial');

            if (!certificateBtn || !dashboardBtn || !downloadBtn || !shareBtn) {
                console.error('❌ 共有ボタンが見つかりません');
                console.log('🔍 ボタン存在確認:', {
                    certificate: !!certificateBtn,
                    dashboard: !!dashboardBtn,
                    download: !!downloadBtn,
                    share: !!shareBtn
                });
                
                // 1秒後にリトライ
                setTimeout(() => {
                    console.log('🔄 共有機能セットアップをリトライ');
                    this.setupShareFeatures();
                }, 1000);
                return;
            }

            // イベントリスナーの重複登録を防ぐ
            if (!certificateBtn.hasAttribute('data-share-listener')) {
                certificateBtn.addEventListener('click', (e) => {
                    console.log('🎯 表彰状ボタンクリック');
                    e.preventDefault();
                    e.stopPropagation();
                    this.generateShareImage('certificate');
                });
                certificateBtn.setAttribute('data-share-listener', 'true');
            }

            if (!dashboardBtn.hasAttribute('data-share-listener')) {
                dashboardBtn.addEventListener('click', (e) => {
                    console.log('🎯 成績表ボタンクリック');
                    e.preventDefault();
                    e.stopPropagation();
                    this.generateShareImage('dashboard');
                });
                dashboardBtn.setAttribute('data-share-listener', 'true');
            }

            if (!downloadBtn.hasAttribute('data-share-listener')) {
                downloadBtn.addEventListener('click', (e) => {
                    console.log('🎯 ダウンロードボタンクリック');
                    e.preventDefault();
                    e.stopPropagation();
                    this.downloadShareImage();
                });
                downloadBtn.setAttribute('data-share-listener', 'true');
            }

            if (!shareBtn.hasAttribute('data-share-listener')) {
                shareBtn.addEventListener('click', (e) => {
                    console.log('🎯 共有ボタンクリック');
                    e.preventDefault();
                    e.stopPropagation();
                    this.shareToSocial();
                });
                shareBtn.setAttribute('data-share-listener', 'true');
            }

            // 初期プレビューを表示
            setTimeout(() => {
                this.showInitialPreview();
            }, 100);

            console.log('✅ 成績共有機能セットアップ完了');
        } catch (error) {
            console.error('❌ 成績共有機能セットアップエラー:', error);
            
            // エラー時のリトライ
            setTimeout(() => {
                console.log('🔄 エラー後の共有機能セットアップをリトライ');
                this.setupShareFeatures();
            }, 2000);
        }
    }

    /**
     * 初期プレビュー表示
     */
    showInitialPreview() {
        try {
            console.log('🎨 初期プレビュー表示開始');
            
            const canvas = document.getElementById('sharePreviewCanvas');
            if (!canvas) {
                console.error('❌ プレビューキャンバスが見つかりません');
                return;
            }

            console.log('🔍 キャンバス状態確認:', {
                canvas: !!canvas,
                width: canvas.width,
                height: canvas.height,
                styleWidth: canvas.style.width,
                styleHeight: canvas.style.height,
                offsetWidth: canvas.offsetWidth,
                offsetHeight: canvas.offsetHeight
            });

            const success = this.shareGenerator.initCanvas('sharePreviewCanvas', 400, 300);
            if (!success) {
                console.error('❌ キャンバス初期化失敗');
                return;
            }

            const ctx = this.shareGenerator.ctx;
            if (!ctx) {
                console.error('❌ コンテキストが取得できません');
                return;
            }
            
            // 背景
            const gradient = ctx.createLinearGradient(0, 0, 400, 300);
            gradient.addColorStop(0, '#f8f9fa');
            gradient.addColorStop(1, '#e9ecef');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 400, 300);

            // 枠線
            ctx.strokeStyle = '#dee2e6';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(20, 20, 360, 260);
            ctx.setLineDash([]);

            // メッセージ
            this.shareGenerator.drawText('ボタンをおしてがぞうをさくせい', 200, 120, {
                fontSize: 16,
                color: '#6c757d'
            });

            this.shareGenerator.drawText('📜 ひょうしょうじょう または 📊 せいせきひょう', 200, 150, {
                fontSize: 12,
                color: '#868e96'
            });

            // アイコン
            this.shareGenerator.drawText('🎨', 200, 180, {
                fontSize: 30
            });

            console.log('✅ 初期プレビュー表示完了');
            
            // 描画結果を確認
            setTimeout(() => {
                const imageData = ctx.getImageData(0, 0, 400, 300);
                const hasContent = !imageData.data.every(pixel => pixel === 0);
                console.log('🔍 描画結果確認:', { hasContent });
            }, 100);
            
        } catch (error) {
            console.error('❌ 初期プレビュー表示エラー:', error);
        }
    }

    /**
     * 共有画像生成
     */
    async generateShareImage(template) {
        console.log('🎨 共有画像生成開始:', template);

        try {
            // 最新のゲームデータを取得
            this.gameData = gameStorage.loadGameData();
            console.log('📊 ゲームデータ取得:', {
                playerName: this.gameData.playerName,
                totalScore: this.gameData.totalStats.totalScore,
                completedStages: this.gameData.progress.completedStages.length
            });

            // ボタンの状態更新
            this.updateShareButtons(template);

            // キャンバス初期化
            const success = this.shareGenerator.initCanvas('sharePreviewCanvas', 400, 300);
            if (!success) {
                throw new Error('キャンバス初期化失敗');
            }

            // プレイヤーデータ設定
            this.shareGenerator.setPlayerData(this.gameData);

            // テンプレートに応じて画像生成
            if (template === 'certificate') {
                console.log('📜 表彰状生成開始');
                await this.generateCertificate();
            } else if (template === 'dashboard') {
                console.log('📊 ダッシュボード生成開始');
                await this.generateDashboard();
            }

            // アクションボタンを表示
            const actionsDiv = document.querySelector('.share-actions');
            if (actionsDiv) {
                actionsDiv.style.display = 'flex';
            }

            console.log('✅ 共有画像生成完了');
        } catch (error) {
            console.error('❌ 共有画像生成エラー:', error);
            alert('がぞうのさくせいにしっぱいしました');
        }
    }

    /**
     * 共有ボタンの状態更新
     */
    updateShareButtons(activeTemplate) {
        const buttons = document.querySelectorAll('.share-button');
        buttons.forEach(button => {
            button.classList.remove('active');
        });

        if (activeTemplate === 'certificate') {
            document.getElementById('shareAsCertificate').classList.add('active');
        } else if (activeTemplate === 'dashboard') {
            document.getElementById('shareAsDashboard').classList.add('active');
        }
    }

    /**
     * 表彰状生成
     */
    async generateCertificate() {
        const generator = this.shareGenerator;
        const data = generator.playerData;

        // 背景
        generator.ctx.fillStyle = '#f8f5e4';
        generator.ctx.fillRect(0, 0, 400, 300);

        // 枠線
        generator.drawRoundRect(10, 10, 380, 280, 15, null, '#d4af37', 4);
        generator.drawRoundRect(20, 20, 360, 260, 10, null, '#b8860b', 2);

        // タイトル
        generator.drawText('ぼうけんたっせいしょう', 200, 50, {
            fontSize: 18,
            color: '#8b4513',
            fontFamily: 'serif'
        });

        // プレイヤー名
        generator.drawText(`${data.name} さん`, 200, 90, {
            fontSize: 16,
            color: '#2c3e50',
            fontFamily: 'serif'
        });

        // 成績情報
        const achievements = [
            `クリアしたステージ: ${data.completedStages}こ`,
            `そうごうスコア: ${generator.formatScore(data.totalScore)}`,
            `ぼうけんレベル: ${data.playerLevel}`
        ];

        achievements.forEach((text, index) => {
            generator.drawText(text, 200, 130 + (index * 25), {
                fontSize: 12,
                color: '#34495e'
            });
        });

        // 星の装飾
        generator.drawStar(50, 80, 15);
        generator.drawStar(350, 80, 15);
        generator.drawStar(50, 220, 12);
        generator.drawStar(350, 220, 12);

        // 日付
        generator.drawText(`たっせいび: ${data.achievementDate}`, 200, 250, {
            fontSize: 11,
            color: '#5d4037',
            fontFamily: 'serif'
        });
    }

    /**
     * ダッシュボード生成
     */
    async generateDashboard() {
        const generator = this.shareGenerator;
        const data = generator.playerData;

        // 背景グラデーション
        const gradient = generator.ctx.createLinearGradient(0, 0, 400, 300);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        generator.ctx.fillStyle = gradient;
        generator.ctx.fillRect(0, 0, 400, 300);

        // ヘッダー
        generator.drawRoundRect(20, 20, 360, 50, 10, 'rgba(255,255,255,0.9)');
        generator.drawText(`${data.name}のせいせき`, 200, 35, {
            fontSize: 14,
            color: '#2c3e50'
        });
        generator.drawText(`レベル ${data.playerLevel}`, 200, 55, {
            fontSize: 12,
            color: '#7f8c8d'
        });

        // 統計カード
        const stats = [
            { label: 'スコア', value: generator.formatScore(data.totalScore), x: 70, y: 120 },
            { label: 'ステージ', value: `${data.completedStages}こ`, x: 200, y: 120 },
            { label: 'アイテム', value: `${data.totalItems}こ`, x: 330, y: 120 }
        ];

        stats.forEach(stat => {
            // カード背景
            generator.drawRoundRect(stat.x - 40, stat.y - 30, 80, 60, 8, 'rgba(255,255,255,0.9)');
            
            // 値
            generator.drawText(stat.value, stat.x, stat.y - 10, {
                fontSize: 12,
                color: '#2c3e50'
            });
            
            // ラベル
            generator.drawText(stat.label, stat.x, stat.y + 10, {
                fontSize: 10,
                color: '#7f8c8d'
            });
        });

        // プレイ時間
        generator.drawRoundRect(50, 200, 300, 40, 8, 'rgba(255,255,255,0.9)');
        generator.drawText(`そうプレイじかん: ${generator.formatTime(data.totalPlayTime)}`, 200, 220, {
            fontSize: 12,
            color: '#2c3e50'
        });

        // 日付（背景付き）
        generator.drawRoundRect(150, 255, 100, 25, 12, 'rgba(255,255,255,0.9)');
        generator.drawText(data.achievementDate, 200, 267, {
            fontSize: 11,
            color: '#2c3e50',
            fontFamily: 'Arial, sans-serif'
        });
    }

    /**
     * 画像ダウンロード
     */
    async downloadShareImage() {
        if (!this.shareGenerator || !this.shareGenerator.canvas) {
            alert('さきにがぞうをさくせいしてください');
            return;
        }

        const downloadButton = document.getElementById('downloadImage');
        
        // 既に処理中の場合は無視
        if (downloadButton.disabled || this.isDownloading) {
            console.log('⚠️ ダウンロード処理中のため無視');
            return;
        }

        // ダウンロード中フラグを設定
        this.isDownloading = true;
        
        // ボタンを無効化
        downloadButton.disabled = true;
        const originalText = downloadButton.textContent;
        downloadButton.textContent = '💾 ダウンロードちゅう...';

        try {
            const playerName = this.gameData.playerName || 'ぼうけんしゃ';
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
            const filename = `${playerName}のせいせき_${timestamp}.png`;
            
            console.log('🎯 ダウンロード実行開始:', filename);
            await this.shareGenerator.downloadImage(filename);
            
            console.log('✅ ダウンロード完了');
        } catch (error) {
            console.error('❌ ダウンロードエラー:', error);
            alert('ダウンロードにしっぱいしました');
        } finally {
            // フラグとボタンを復元
            setTimeout(() => {
                this.isDownloading = false;
                downloadButton.disabled = false;
                downloadButton.textContent = originalText;
                console.log('🔄 ダウンロードボタン復元完了');
            }, 1500);
        }
    }

    /**
     * SNS共有
     */
    async shareToSocial() {
        if (!this.shareGenerator || !this.shareGenerator.canvas) {
            alert('さきにがぞうをさくせいしてください');
            return;
        }

        const shareButton = document.getElementById('shareToSocial');
        
        // 既に処理中の場合は無視
        if (shareButton.disabled || this.isSharing) {
            console.log('⚠️ 共有処理中のため無視');
            return;
        }

        // 共有中フラグを設定
        this.isSharing = true;
        
        // ボタンを無効化
        shareButton.disabled = true;
        const originalText = shareButton.textContent;
        shareButton.textContent = '📱 きょうゆうちゅう...';

        try {
            const blob = await this.shareGenerator.getImageBlob();
            const file = new File([blob], 'せいせき.png', { type: 'image/png' });

            console.log('🔍 共有機能チェック開始');

            // Web Share API対応チェック
            if (navigator.share) {
                console.log('✅ Web Share API対応');
                
                try {
                    // ファイル共有対応チェック
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        console.log('✅ ファイル共有対応');
                        await navigator.share({
                            title: 'キッズアドベンチャー - せいせき',
                            text: 'ぼくの・わたしのぼうけんのせいせきだよ！',
                            files: [file]
                        });
                        console.log('📱 ファイル共有完了');
                        // 成功時は何もメッセージを表示しない
                        return;
                    } else {
                        console.log('⚠️ ファイル共有非対応、テキスト共有を試行');
                        // ファイル共有非対応の場合、テキストのみ共有
                        await navigator.share({
                            title: 'キッズアドベンチャー - せいせき',
                            text: 'ぼくの・わたしのぼうけんのせいせきだよ！\nキッズアドベンチャーでぼうけんしています！'
                        });
                        console.log('📱 テキスト共有完了');
                        alert('きょうゆうしました！\nがぞうは「がぞうをほぞん」ボタンでほぞんできます。');
                        return;
                    }
                } catch (shareError) {
                    console.log('📱 共有エラー詳細:', shareError.name, shareError.message);
                    
                    if (shareError.name === 'AbortError') {
                        // ユーザーがキャンセルした場合
                        console.log('📱 ユーザーが共有をキャンセル');
                        return;
                    }
                    
                    if (shareError.name === 'NotAllowedError') {
                        console.log('📱 共有権限なし');
                        alert('きょうゆうのきょかがひつようです。\nブラウザのせっていをかくにんしてください。');
                        return;
                    }
                    
                    // その他のエラーはフォールバックに進む
                    console.log('📱 Web Share API失敗、フォールバックに進む');
                }
            } else {
                console.log('⚠️ Web Share API非対応');
            }

            // フォールバック: クリップボードにコピー
            console.log('📋 クリップボードコピーを試行');
            if (navigator.clipboard && navigator.clipboard.write) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    alert('がぞうをクリップボードにコピーしました！\nSNSにはりつけてください。');
                    console.log('📋 クリップボードコピー完了');
                    return;
                } catch (clipboardError) {
                    console.log('📋 クリップボードコピー失敗:', clipboardError);
                }
            }

            // 最終フォールバック
            console.log('⚠️ 全ての共有方法が失敗');
            alert('このブラウザではきょうゆうきのうがつかえません。\n「がぞうをほぞん」ボタンでほぞんしてください。');

        } catch (error) {
            console.error('❌ 共有処理で予期しないエラー:', error);
            alert('きょうゆうにしっぱいしました。\n「がぞうをほぞん」ボタンをつかってください。');
        } finally {
            // フラグとボタンを復元
            setTimeout(() => {
                this.isSharing = false;
                shareButton.disabled = false;
                shareButton.textContent = originalText;
                console.log('🔄 共有ボタン復元完了');
            }, 1000);
        }
    }

    /**
     * 統計表示を更新
     */
    updateStatsDisplay() {
        console.log('統計表示を更新中...');

        // 最新データを取得
        this.gameData = gameStorage.loadGameData();

        // デバッグ用：現在のデータ状況をログ出力
        console.log('現在のゲームデータ:', {
            totalStats: this.gameData.totalStats,
            stageStats: this.gameData.progress.stageStats,
            completedStages: this.gameData.progress.completedStages
        });

        // 総合スコア表示
        this.updateTotalScoreDisplay();

        // ステージ別成績表示
        this.updateStageStatsDisplay();

        // 最近の成績グラフ表示
        this.updateRecentStatsChart();
    }

    /**
     * 総合スコア表示を更新
     */
    updateTotalScoreDisplay() {
        const totalScore = this.gameData.totalStats.totalScore || 0;
        const totalScoreElement = document.getElementById('totalScoreValue');
        const progressFill = document.querySelector('#totalScoreBar .progress-fill');
        const playerLevelElement = document.getElementById('playerLevel');
        const currentLevelTextElement = document.getElementById('currentLevelText');
        const nextLevelPointsElement = document.getElementById('nextLevelPoints');

        // スコア表示
        totalScoreElement.textContent = totalScore.toLocaleString();

        // レベル計算（1000点で1レベル）
        const level = Math.floor(totalScore / 1000) + 1;
        const nextLevelScore = level * 1000;
        const currentLevelProgress = ((totalScore % 1000) / 1000) * 100;
        const pointsToNextLevel = nextLevelScore - totalScore;

        // レベル情報更新
        playerLevelElement.textContent = level;
        currentLevelTextElement.textContent = level;
        nextLevelPointsElement.textContent = pointsToNextLevel.toLocaleString();

        // プログレスバーアニメーション
        setTimeout(() => {
            progressFill.style.width = `${currentLevelProgress}%`;
        }, 200);

        console.log('総合スコア更新:', {
            totalScore,
            level,
            progress: currentLevelProgress,
            pointsToNext: pointsToNextLevel
        });
    }

    /**
     * ステージ別成績表示を更新
     */
    updateStageStatsDisplay() {
        const container = document.getElementById('stageStatsContainer');
        container.innerHTML = '';

        const stageStats = this.gameData.progress.stageStats || {};
        const completedStages = this.gameData.progress.completedStages || [];

        // 20つのステージを表示
        for (let stage = 1; stage <= 20; stage++) {
            const stats = stageStats[stage] || {};
            const isCompleted = completedStages.includes(stage);

            const card = this.createStageStatCard(stage, stats, isCompleted);
            container.appendChild(card);
        }

        console.log('ステージ別成績更新完了');
    }

    /**
     * ステージ統計カードを作成
     */
    createStageStatCard(stageNumber, stats, isCompleted) {
        const card = document.createElement('div');
        card.className = 'stage-stat-card';

        // 星評価計算
        const stars = this.calculateStageStars(stats, isCompleted);
        const starsDisplay = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

        card.innerHTML = `
            <div class="stage-stat-header">
                <div class="stage-name">ステージ ${stageNumber}</div>
                <div class="stage-stars">${starsDisplay}</div>
            </div>
            <div class="stage-details">
                <div>
                    <span class="label">スコア:</span>
                    <span class="value">${(stats.bestScore || 0).toLocaleString()}</span>
                </div>
                <div>
                    <span class="label">タイム:</span>
                    <span class="value">${this.formatTime((stats.bestTime || 0) * 1000)}</span>
                </div>
                <div>
                    <span class="label">アイテム:</span>
                    <span class="value">${stats.maxItemsCollected || 0}個</span>
                </div>
                <div>
                    <span class="label">プレイ:</span>
                    <span class="value">${stats.playCount || 0}回</span>
                </div>
                <div>
                    <span class="label">状態:</span>
                    <span class="value ${isCompleted ? 'completed' : 'incomplete'}">${isCompleted ? 'クリア' : '未クリア'}</span>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * ステージの星評価を計算
     */
    calculateStageStars(stats, isCompleted) {
        if (!isCompleted) return 0;

        const score = stats.bestScore || 0;
        const time = stats.bestTime || Infinity;
        const items = stats.maxItemsCollected || 0;

        let stars = 1; // クリアで1つ星

        // スコアベースで星追加
        if (score >= 1500) stars++;
        if (score >= 2000) stars++;

        // タイムベースで星追加（60秒以内で追加星）
        if (time <= 60000) stars = Math.max(stars, 2);
        if (time <= 30000) stars = 3;

        // アイテム収集で星追加
        if (items >= 8) stars = Math.max(stars, 2);
        if (items >= 10) stars = 3;

        return Math.min(stars, 3);
    }

    /**
     * 最近の成績グラフを更新
     */
    updateRecentStatsChart() {
        const chartContainer = document.getElementById('recentStatsChart');
        const stageStats = this.gameData.progress.stageStats || {};

        // データがない場合
        if (Object.keys(stageStats).length === 0) {
            chartContainer.innerHTML = '<div class="no-data-message">まだデータがありません<br>ゲームをプレイしてみましょう！</div>';
            return;
        }

        // チャートHTML作成
        const chartHTML = `
            <div class="chart-container">
                <div class="chart-bars" id="chartBars">
                    ${this.createChartBars(stageStats)}
                </div>
            </div>
        `;

        chartContainer.innerHTML = chartHTML;

        // アニメーション開始
        setTimeout(() => {
            this.animateChartBars();
        }, 100);

        console.log('成績グラフ更新完了');
    }

    /**
     * チャートバーのHTMLを作成
     */
    createChartBars(stageStats) {
        let barsHTML = '';
        const maxScore = Math.max(...Object.values(stageStats).map(s => s.bestScore || 0), 1);

        for (let stage = 1; stage <= 20; stage++) {
            const stats = stageStats[stage] || {};
            const score = stats.bestScore || 0;
            const height = Math.max((score / maxScore) * 100, 5); // 最小5%

            barsHTML += `
                <div class="chart-bar" data-height="${height}">
                    <div class="chart-bar-value">${score}</div>
                    <div class="chart-bar-label">S${stage}</div>
                </div>
            `;
        }

        return barsHTML;
    }

    /**
     * チャートバーのアニメーション
     */
    animateChartBars() {
        const bars = document.querySelectorAll('.chart-bar');
        bars.forEach((bar, index) => {
            const height = bar.dataset.height;
            setTimeout(() => {
                bar.style.height = `${height}%`;
            }, index * 200);
        });
    }

    /**
     * 時間をフォーマット
     */
    formatTime(milliseconds) {
        if (milliseconds === 0 || milliseconds === Infinity || !milliseconds) {
            return '--:--';
        }

        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * キャンバスタッチ操作設定
     */
    setupCanvasTouch() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.warn('ゲームキャンバスが見つかりません');
            return;
        }

        // タッチ状態管理（画面分割方式）
        this.touchState = {
            activeTouches: new Map(), // タッチID -> タッチ情報
            currentMoveActions: new Set(), // 現在実行中の移動アクション
        };

        console.log('🎮 キャンバスタッチ設定開始（画面分割方式）');

        // タッチ開始
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();

            Array.from(e.changedTouches).forEach(touch => {
                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const canvasWidth = rect.width;
                const canvasHeight = rect.height;

                // 画面を上下に分割：上半分=ジャンプ、下半分=移動
                const isUpperHalf = y < canvasHeight / 2;
                const isLeftSide = x < canvasWidth / 2;

                console.log('[CANVAS_TOUCH] タッチ開始:', {
                    id: touch.identifier,
                    x: x,
                    y: y,
                    canvasWidth: canvasWidth,
                    canvasHeight: canvasHeight,
                    isUpperHalf: isUpperHalf,
                    isLeftSide: isLeftSide
                });

                this.touchState.activeTouches.set(touch.identifier, {
                    x: x,
                    y: y,
                    isUpperHalf: isUpperHalf,
                    isLeftSide: isLeftSide,
                    startTime: Date.now()
                });

                this.handleAreaTouch(touch.identifier, true);
            });
        });

        // タッチ移動
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();

            Array.from(e.changedTouches).forEach(touch => {
                if (this.touchState.activeTouches.has(touch.identifier)) {
                    const rect = canvas.getBoundingClientRect();
                    const x = touch.clientX - rect.left;
                    const y = touch.clientY - rect.top;
                    const canvasWidth = rect.width;
                    const canvasHeight = rect.height;

                    const isUpperHalf = y < canvasHeight / 2;
                    const isLeftSide = x < canvasWidth / 2;

                    const touchInfo = this.touchState.activeTouches.get(touch.identifier);

                    // エリアが変わった場合は操作を更新
                    if (touchInfo.isUpperHalf !== isUpperHalf || touchInfo.isLeftSide !== isLeftSide) {
                        // 古い操作を停止
                        this.handleAreaTouch(touch.identifier, false);

                        // 新しい操作を開始
                        touchInfo.isUpperHalf = isUpperHalf;
                        touchInfo.isLeftSide = isLeftSide;
                        this.handleAreaTouch(touch.identifier, true);
                    }
                }
            });
        });

        // タッチ終了
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();

            Array.from(e.changedTouches).forEach(touch => {
                if (this.touchState.activeTouches.has(touch.identifier)) {
                    const touchInfo = this.touchState.activeTouches.get(touch.identifier);
                    const duration = Date.now() - touchInfo.startTime;

                    console.log('[CANVAS_TOUCH] タッチ終了:', {
                        id: touch.identifier,
                        duration: duration,
                        isUpperHalf: touchInfo.isUpperHalf,
                        isLeftSide: touchInfo.isLeftSide
                    });

                    // 上半分の短いタップ = ジャンプ
                    if (touchInfo.isUpperHalf && duration < 300) {
                        console.log('[CANVAS_TOUCH] ✅ 上エリアタップでジャンプ');
                        this.handleCanvasJump();
                    }

                    this.handleAreaTouch(touch.identifier, false);
                    this.touchState.activeTouches.delete(touch.identifier);
                }
            });
        });

        // タッチキャンセル
        canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();

            Array.from(e.changedTouches).forEach(touch => {
                if (this.touchState.activeTouches.has(touch.identifier)) {
                    console.log('[CANVAS_TOUCH] タッチキャンセル:', { id: touch.identifier });
                    this.handleAreaTouch(touch.identifier, false);
                    this.touchState.activeTouches.delete(touch.identifier);
                }
            });
        });

        // マウス操作も追加（PC用）
        this.setupCanvasMouse(canvas);

        console.log('✅ キャンバスタッチ設定完了（画面分割方式）');
    }

    /**
     * キャンバスマウス操作設定（PC用・画面分割方式）
     */
    setupCanvasMouse(canvas) {
        // マウス状態管理
        this.mouseState = {
            isPressed: false,
            currentArea: null, // 現在押下されているエリア
            currentMoveActions: new Set(),
        };

        console.log('🖱️ キャンバスマウス設定開始（画面分割方式）');

        // マウス押下
        canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const canvasWidth = rect.width;
            const canvasHeight = rect.height;

            // 画面を上下に分割：上半分=ジャンプ、下半分=移動
            const isUpperHalf = y < canvasHeight / 2;
            const isLeftSide = x < canvasWidth / 2;

            console.log('[CANVAS_MOUSE] マウス押下:', {
                x: x,
                y: y,
                canvasWidth: canvasWidth,
                canvasHeight: canvasHeight,
                isUpperHalf: isUpperHalf,
                isLeftSide: isLeftSide,
                button: e.button
            });

            this.mouseState.isPressed = true;
            this.mouseState.currentArea = { isUpperHalf, isLeftSide };
            this.handleMouseArea(true);
        });

        // マウス移動
        canvas.addEventListener('mousemove', (e) => {
            if (!this.mouseState.isPressed) return;

            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const canvasWidth = rect.width;
            const canvasHeight = rect.height;

            const isUpperHalf = y < canvasHeight / 2;
            const isLeftSide = x < canvasWidth / 2;

            // エリアが変わった場合は操作を更新
            if (this.mouseState.currentArea &&
                (this.mouseState.currentArea.isUpperHalf !== isUpperHalf ||
                    this.mouseState.currentArea.isLeftSide !== isLeftSide)) {

                // 古い操作を停止
                this.handleMouseArea(false);

                // 新しい操作を開始
                this.mouseState.currentArea = { isUpperHalf, isLeftSide };
                this.handleMouseArea(true);
            }
        });

        // マウス離上
        canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();

            if (this.mouseState.isPressed && this.mouseState.currentArea) {
                console.log('[CANVAS_MOUSE] マウス離上:', {
                    area: this.mouseState.currentArea
                });

                // 上半分のクリック = ジャンプ
                if (this.mouseState.currentArea.isUpperHalf) {
                    console.log('[CANVAS_MOUSE] ✅ 上エリアクリックでジャンプ');
                    this.handleCanvasJump();
                }

                this.handleMouseArea(false);
            }

            this.mouseState.isPressed = false;
            this.mouseState.currentArea = null;
        });

        // マウスがキャンバスから離れた場合
        canvas.addEventListener('mouseleave', (e) => {
            if (this.mouseState.isPressed) {
                console.log('[CANVAS_MOUSE] マウス離脱');
                this.handleMouseArea(false);
                this.mouseState.isPressed = false;
                this.mouseState.currentArea = null;
            }
        });

        console.log('✅ キャンバスマウス設定完了（画面分割方式）');
    }

    /**
     * マウスドラッグ処理 - 廃止（画面分割方式で不要）
     */
    handleMouseDrag(deltaX, deltaY) {
        console.log('[CANVAS_MOUSE] ⚠️ 廃止されたドラッグ処理が呼ばれました');
    }

    /**
     * マウスエリア処理（画面分割方式）
     */
    handleMouseArea(isPressed) {
        if (!this.mouseState.currentArea) return;

        if (this.mouseState.currentArea.isUpperHalf) {
            // 上半分: ジャンプエリア（リリース時にジャンプ処理は mouseup で行う）
            console.log(`[CANVAS_MOUSE] 上エリア ${isPressed ? '押下' : 'リリース'}`);
        } else {
            // 下半分: 移動エリア
            let action = null;
            if (this.mouseState.currentArea.isLeftSide) {
                action = 'left';
                console.log(`[CANVAS_MOUSE] 下左エリア ${isPressed ? '押下' : 'リリース'}: 左移動`);
            } else {
                action = 'right';
                console.log(`[CANVAS_MOUSE] 下右エリア ${isPressed ? '押下' : 'リリース'}: 右移動`);
            }

            if (action && window.game && window.game.player) {
                if (isPressed) {
                    // 相反する移動を停止してから新しい移動を開始
                    this.stopConflictingMouseMoveActions(action);
                    this.mouseState.currentMoveActions.add(action);
                    window.game.player.handleInput(action, true);
                } else {
                    // 移動を停止
                    if (this.mouseState.currentMoveActions.has(action)) {
                        this.mouseState.currentMoveActions.delete(action);
                        window.game.player.handleInput(action, false);
                    }
                }
            }
        }
    }

    /**
     * マウスクリック処理（ジャンプ） - 廃止予定
     */
    handleMouseClick() {
        console.log('[CANVAS_MOUSE] ✅ クリック検出 - ジャンプ（移動継続）');
        this.handleCanvasJump();
    }

    /**
     * マウス移動アクション開始
     */
    startMouseMoveAction(action) {
        // 相反する移動アクションのみ停止（左右の移動、立ち/しゃがみ）
        this.stopConflictingMouseMoveActions(action);

        // 新しい移動アクションを開始（重複チェック）
        if (!this.mouseState.currentMoveActions.has(action)) {
            this.mouseState.currentMoveActions.add(action);

            if (window.game && window.game.player) {
                console.log(`[CANVAS_MOUSE] 🖱️ 移動開始: ${action}`);
                window.game.player.handleInput(action, true);
            }
        }
    }

    /**
     * 相反するマウス移動アクションを停止
     */
    stopConflictingMouseMoveActions(newAction) {
        const conflictMap = {
            'left': ['right'],     // 左移動は右移動と相反
            'right': ['left']      // 右移動は左移動と相反
        };

        const conflicting = conflictMap[newAction] || [];

        if (window.game && window.game.player) {
            conflicting.forEach(action => {
                if (this.mouseState.currentMoveActions.has(action)) {
                    console.log(`[CANVAS_MOUSE] 🔄 相反アクション停止: ${action} (新規: ${newAction})`);
                    window.game.player.handleInput(action, false);
                    this.mouseState.currentMoveActions.delete(action);
                }
            });
        }
    }

    /**
     * マウス移動アクションを停止
     */
    stopMouseMoveActions() {
        if (this.mouseState.currentMoveActions.size > 0) {
            console.log('[CANVAS_MOUSE] 🛑 移動アクション停止:', Array.from(this.mouseState.currentMoveActions));

            if (window.game && window.game.player) {
                this.mouseState.currentMoveActions.forEach(action => {
                    window.game.player.handleInput(action, false);
                });
            }

            this.mouseState.currentMoveActions.clear();
        }
    }

    /**
     * スワイプ処理 - 廃止（画面分割方式で不要）
     */
    handleSwipe(deltaX, deltaY) {
        console.log('[CANVAS_TOUCH] ⚠️ 廃止されたスワイプ処理が呼ばれました');
    }

    /**
     * エリアタッチ処理（画面分割方式）
     */
    handleAreaTouch(touchId, isPressed) {
        const touchInfo = this.touchState.activeTouches.get(touchId);
        if (!touchInfo) return;

        if (touchInfo.isUpperHalf) {
            // 上半分: ジャンプエリア（タッチ中は何もしない、リリース時にジャンプ）
            console.log(`[CANVAS_TOUCH] 上エリア ${isPressed ? '押下' : 'リリース'}:`, { touchId });
        } else {
            // 下半分: 移動エリア
            let action = null;
            if (touchInfo.isLeftSide) {
                action = 'left';
                console.log(`[CANVAS_TOUCH] 下左エリア ${isPressed ? '押下' : 'リリース'}: 左移動`, { touchId });
            } else {
                action = 'right';
                console.log(`[CANVAS_TOUCH] 下右エリア ${isPressed ? '押下' : 'リリース'}: 右移動`, { touchId });
            }

            if (action && window.game && window.game.player) {
                if (isPressed) {
                    // 相反する移動を停止してから新しい移動を開始
                    this.stopConflictingMoveActions(action);
                    this.touchState.currentMoveActions.add(action);
                    window.game.player.handleInput(action, true);
                } else {
                    // この特定のタッチによる移動を停止
                    if (this.touchState.currentMoveActions.has(action)) {
                        this.touchState.currentMoveActions.delete(action);
                        // 他のタッチで同じ方向に移動していないかチェック
                        let hasOtherTouch = false;
                        for (let [otherId, otherInfo] of this.touchState.activeTouches) {
                            if (otherId !== touchId && !otherInfo.isUpperHalf) {
                                if ((action === 'left' && otherInfo.isLeftSide) ||
                                    (action === 'right' && !otherInfo.isLeftSide)) {
                                    hasOtherTouch = true;
                                    break;
                                }
                            }
                        }

                        if (!hasOtherTouch) {
                            window.game.player.handleInput(action, false);
                        }
                    }
                }
            }
        }
    }

    /**
     * タップ処理（ジャンプ） - 廃止予定
     */
    handleTap() {
        console.log('[CANVAS_TOUCH] ✅ タップ検出 - ジャンプ（移動継続）');
        this.handleCanvasJump();
    }

    /**
     * キャンバスからのジャンプ処理
     */
    handleCanvasJump() {
        if (window.game && window.game.player) {
            console.log('[CANVAS_TOUCH] 🚀 キャンバスジャンプ実行');
            window.game.player.attemptJump();
        } else {
            console.warn('[CANVAS_TOUCH] ⚠️ ゲームまたはプレイヤーが利用できません');
        }
    }

    /**
     * 移動アクション開始
     */
    startMoveAction(action) {
        // 相反する移動アクションのみ停止（左右の移動、立ち/しゃがみ）
        this.stopConflictingMoveActions(action);

        // 新しい移動アクションを開始（重複チェック）
        if (!this.touchState.currentMoveActions.has(action)) {
            this.touchState.currentMoveActions.add(action);

            if (window.game && window.game.player) {
                console.log(`[CANVAS_TOUCH] 📱 移動開始: ${action}`);
                window.game.player.handleInput(action, true);
            }
        }
    }

    /**
     * 相反する移動アクションを停止
     */
    stopConflictingMoveActions(newAction) {
        const conflictMap = {
            'left': ['right'],     // 左移動は右移動と相反
            'right': ['left']      // 右移動は左移動と相反
        };

        const conflicting = conflictMap[newAction] || [];

        if (window.game && window.game.player) {
            conflicting.forEach(action => {
                if (this.touchState.currentMoveActions.has(action)) {
                    console.log(`[CANVAS_TOUCH] 🔄 相反アクション停止: ${action} (新規: ${newAction})`);
                    window.game.player.handleInput(action, false);
                    this.touchState.currentMoveActions.delete(action);
                }
            });
        }
    }

    /**
     * 全ての移動アクションを停止
     */
    stopMoveActions() {
        if (this.touchState.currentMoveActions.size > 0) {
            console.log('[CANVAS_TOUCH] 🛑 移動アクション停止:', Array.from(this.touchState.currentMoveActions));

            if (window.game && window.game.player) {
                this.touchState.currentMoveActions.forEach(action => {
                    window.game.player.handleInput(action, false);
                });
            }

            this.touchState.currentMoveActions.clear();
        }
    }

    /**
     * プレイヤー一覧画面を表示
     */
    showPlayerListScreen() {
        console.log('=== プレイヤー一覧画面を表示開始 ===');

        // 無効なプレイヤーデータをクリーンアップ
        gameStorage.cleanupInvalidPlayerData();

        // 現在のプレイヤーが設定されていない、または存在しない場合は最初のプレイヤーを設定
        this.ensureCurrentPlayerExists();

        // プレイヤー一覧を更新
        console.log('プレイヤー一覧を更新中...');
        this.updatePlayerListDisplay();

        // 現在のプレイヤー表示を更新
        console.log('現在のプレイヤー表示を更新中...');
        this.updateCurrentPlayerDisplay();

        // 画面を表示
        console.log('画面を表示中...');
        this.showScreen('playerListScreen');
        
        // プレイヤー一覧画面専用のゲームパッド初期化
        setTimeout(() => {
            if (this.menuGamepadManager) {
                console.log('🎮 プレイヤー一覧画面のゲームパッド専用初期化開始');
                this.menuGamepadManager.initializeFocusableElements();
                
                // 最初のプレイヤーカードに自動フォーカス
                if (this.menuGamepadManager.focusedElements.length > 0) {
                    const firstPlayerCard = this.menuGamepadManager.focusedElements.find(el => 
                        el.classList.contains('player-card')
                    );
                    if (firstPlayerCard) {
                        const cardIndex = this.menuGamepadManager.focusedElements.indexOf(firstPlayerCard);
                        this.menuGamepadManager.currentFocusIndex = cardIndex;
                        this.menuGamepadManager.updateFocus();
                        console.log(`🎮 初期プレイヤーカードフォーカス設定: インデックス ${cardIndex}`);
                    }
                }
            }
        }, 150); // DOM表示完了を確実に待つ

        console.log('=== プレイヤー一覧画面を表示完了 ===');
    }

    /**
     * プレイヤー一覧表示を更新
     */
    updatePlayerListDisplay() {
        const playerList = document.getElementById('playerList');
        if (!playerList) {
            console.error('プレイヤー一覧要素が見つかりません');
            return;
        }

        // 全プレイヤーの統計情報を取得
        const playersWithStats = gameStorage.getAllPlayersWithStats();
        console.log('プレイヤー一覧データ:', playersWithStats);
        console.log('有効なプレイヤー数:', playersWithStats.length);

        // 既存のプレイヤーカードをクリア
        playerList.innerHTML = '';

        if (playersWithStats.length === 0) {
            // プレイヤーがいない場合
            const noPlayersMessage = document.createElement('div');
            noPlayersMessage.className = 'no-players-message';
            noPlayersMessage.innerHTML = `
                <div style="
                    text-align: center; 
                    color: #7F8C8D; 
                    font-size: 1.2rem; 
                    margin: 50px 0;
                ">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🎮</div>
                    <div>まだプレイヤーがいません</div>
                    <div style="font-size: 0.9rem; margin-top: 10px;">「あたらしいプレイヤー」でプレイヤーを作成してください</div>
                </div>
            `;
            playerList.appendChild(noPlayersMessage);
            return;
        }

        // プレイヤーカードを作成
        playersWithStats.forEach(player => {
            const playerCard = this.createPlayerCard(player);
            if (playerCard) {
                playerList.appendChild(playerCard);
            }
        });
    }

    /**
     * 現在のプレイヤーが存在することを確認し、存在しない場合は適切なプレイヤーを設定
     */
    ensureCurrentPlayerExists() {
        const currentPlayer = gameStorage.getCurrentPlayer();
        const allPlayers = gameStorage.getAllPlayerNames();

        console.log('現在のプレイヤー確認:', {
            currentPlayer: currentPlayer,
            allPlayers: allPlayers,
            playersCount: allPlayers.length
        });

        // プレイヤーが存在しない場合は何もしない
        if (allPlayers.length === 0) {
            console.log('プレイヤーが存在しません');
            return;
        }

        // 現在のプレイヤーが設定されていない、または存在しない場合
        if (!currentPlayer || !allPlayers.includes(currentPlayer)) {
            console.log('現在のプレイヤーが無効です。最初のプレイヤーを設定します:', allPlayers[0]);

            // 最初のプレイヤーを現在のプレイヤーに設定
            gameStorage.setCurrentPlayer(allPlayers[0]);

            // ゲームデータを更新
            this.gameData = gameStorage.loadGameData();

            // 注意: updatePlayerNameDisplay() はタイトル画面専用のため、ここでは呼び出さない
            console.log('プレイヤー設定完了:', allPlayers[0]);
        }
    }

    /**
 * 現在のプレイヤー表示を更新
 */
    updateCurrentPlayerDisplay() {
        const currentPlayerIcon = document.getElementById('playerListCurrentPlayerIcon');
        const currentPlayerName = document.getElementById('playerListCurrentPlayerName');

        console.log('DOM要素の確認:', {
            currentPlayerIcon: currentPlayerIcon,
            currentPlayerName: currentPlayerName,
            iconExists: !!currentPlayerIcon,
            nameExists: !!currentPlayerName,
            iconElement: currentPlayerIcon ? currentPlayerIcon.tagName : 'なし',
            nameElement: currentPlayerName ? currentPlayerName.tagName : 'なし'
        });

        if (!currentPlayerIcon || !currentPlayerName) {
            console.error('現在のプレイヤー表示要素が見つかりません');
            return;
        }

        const currentPlayer = gameStorage.getCurrentPlayer();

        console.log('現在のプレイヤー表示更新:', {
            currentPlayer: currentPlayer,
            isEmpty: !currentPlayer,
            isTrimEmpty: currentPlayer && currentPlayer.trim() === ''
        });

        if (currentPlayer && currentPlayer.trim() !== '') {
            // アイコンを取得
            const playerIcon = gameStorage.getPlayerIcon(currentPlayer);
            const iconInfo = gameStorage.getIconById(playerIcon);

            // 設定前の値を記録
            const oldIconText = currentPlayerIcon.textContent;
            const oldNameText = currentPlayerName.textContent;

            currentPlayerIcon.textContent = iconInfo.emoji;
            currentPlayerName.textContent = currentPlayer;

            // 設定後の値を確認
            console.log('DOM要素への設定結果:', {
                player: currentPlayer,
                playerIcon: playerIcon,
                iconInfo: iconInfo,
                emoji: iconInfo.emoji,
                設定前: {
                    icon: oldIconText,
                    name: oldNameText
                },
                設定後: {
                    icon: currentPlayerIcon.textContent,
                    name: currentPlayerName.textContent
                },
                DOM要素確認: {
                    iconElement: currentPlayerIcon.outerHTML,
                    nameElement: currentPlayerName.outerHTML
                }
            });
        } else {
            // プレイヤーが設定されていない場合
            currentPlayerIcon.textContent = '❓';
            currentPlayerName.textContent = '未設定';
            console.log('現在のプレイヤーが未設定または空です');
        }
    }

    /**
     * プレイヤーカードを作成
     */
    createPlayerCard(playerData) {
        // プレイヤーデータの妥当性チェック
        if (!playerData || !playerData.name || typeof playerData.name !== 'string') {
            console.error('無効なプレイヤーデータ:', playerData);
            return null;
        }

        const card = document.createElement('div');
        card.className = 'player-card';

        // 現在のプレイヤーの場合は選択状態にする
        const currentPlayer = gameStorage.getCurrentPlayer();
        if (playerData.name === currentPlayer) {
            card.classList.add('selected');
        }

        // アイコン情報を取得
        const iconInfo = gameStorage.getIconById(playerData.icon);

        // 時間をフォーマット
        const playTimeMinutes = Math.floor(playerData.totalPlayTime / 60);
        const playTimeDisplay = playTimeMinutes > 0 ? `${playTimeMinutes}分` : '0分';

        card.innerHTML = `
            <div class="player-icon">${iconInfo.emoji}</div>
            <div class="player-name">${playerData.name}</div>
            <div class="player-stats">
                <div class="player-stat-item">
                    <span class="player-stat-label">スコア:</span>
                    <span class="player-stat-value">${playerData.totalScore.toLocaleString()}</span>
                </div>
                <div class="player-stat-item">
                    <span class="player-stat-label">クリア:</span>
                    <span class="player-stat-value">${playerData.completedStagesCount}/20</span>
                </div>
                <div class="player-stat-item">
                    <span class="player-stat-label">最新:</span>
                    <span class="player-stat-value">ステージ${playerData.maxStageCleared || 0}</span>
                </div>
                <div class="player-stat-item">
                    <span class="player-stat-label">プレイ時間:</span>
                    <span class="player-stat-value">${playTimeDisplay}</span>
                </div>
            </div>
        `;

        // クリックイベントを追加
        card.addEventListener('click', () => {
            this.handlePlayerSelection(playerData.name);
        });

        // アイコン変更ボタンを追加
        const iconChangeButton = document.createElement('button');
        iconChangeButton.className = 'icon-change-button';
        iconChangeButton.innerHTML = '🎨';
        iconChangeButton.title = 'アイコンを変更';
        iconChangeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 50px;
            background: rgba(255, 255, 255, 0.8);
            border: 2px solid #E3E3E3;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        iconChangeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // カード選択イベントを防ぐ
            this.showIconSelectScreen(playerData.name);
        });

        card.appendChild(iconChangeButton);

        // プレイヤー削除ボタンを追加
        const deleteButton = document.createElement('button');
        deleteButton.className = 'player-delete-button';
        deleteButton.innerHTML = '🗑️';
        deleteButton.title = 'プレイヤーを削除';
        deleteButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(255, 100, 100, 0.8);
            border: 2px solid #FF6B6B;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation(); // カード選択イベントを防ぐ
            this.handlePlayerDelete(playerData.name);
        });

        card.appendChild(deleteButton);

        // せいせきボタンを追加
        const statsButton = document.createElement('button');
        statsButton.className = 'player-stats-button';
        statsButton.innerHTML = 'せいせき';
        statsButton.title = 'せいせきを見る';
        statsButton.style.cssText = `
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(100, 200, 255, 0.8);
            border: 2px solid #4A90E2;
            border-radius: 8px;
            padding: 4px 8px;
            font-size: 0.7rem;
            color: #2C3E50;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        statsButton.addEventListener('click', (e) => {
            e.stopPropagation(); // カード選択イベントを防ぐ
            this.handlePlayerStats(playerData.name);
        });

        card.appendChild(statsButton);

        return card;
    }

    /**
     * プレイヤー選択処理
     */
    handlePlayerSelection(playerName) {
        console.log('プレイヤー選択:', playerName);

        // 現在のプレイヤーを設定
        gameStorage.setCurrentPlayer(playerName);

        // 最後にプレイしたプレイヤーとして保存
        gameStorage.saveLastPlayer(playerName);

        // UIを更新
        this.gameData = gameStorage.loadGameData();

        // 現在の画面に応じて適切なメソッドを呼び出す
        if (this.currentScreen === 'playerListScreen') {
            // プレイヤー一覧画面では専用のメソッドを使用
            this.updateCurrentPlayerDisplay();
        } else {
            // その他の画面ではタイトル画面用のメソッドを使用
            this.updatePlayerNameDisplay();
        }

        // プレイヤー一覧を更新（選択状態の変更を反映）
        this.updatePlayerListDisplay();

        // DOM更新後、ゲームパッドナビゲーションをリフレッシュ
        // プレイヤー選択によってDOM要素が再生成されるため、フォーカス要素を再初期化
        setTimeout(() => {
            if (this.menuGamepadManager && this.currentScreen === 'playerListScreen') {
                console.log('🎮 プレイヤー選択後のゲームパッドナビゲーション再初期化');
                console.log('🎮 DOM更新前のフォーカス要素数:', this.menuGamepadManager.focusedElements.length);
                this.menuGamepadManager.initializeFocusableElements();
                console.log('🎮 DOM更新後のフォーカス要素数:', this.menuGamepadManager.focusedElements.length);
                
                // プレイヤーカードに自動フォーカス（最初のプレイヤーカード）
                if (this.menuGamepadManager.focusedElements.length > 0) {
                    const firstPlayerCard = this.menuGamepadManager.focusedElements.find(el => 
                        el.classList.contains('player-card')
                    );
                    if (firstPlayerCard) {
                        const cardIndex = this.menuGamepadManager.focusedElements.indexOf(firstPlayerCard);
                        this.menuGamepadManager.currentFocusIndex = cardIndex;
                        this.menuGamepadManager.updateFocus();
                        console.log(`🎮 プレイヤーカードにフォーカス設定: インデックス ${cardIndex}`);
                    }
                }
            }
        }, 100); // DOM更新完了を確実に待つ遅延

        console.log('プレイヤー選択完了:', playerName);
    }

    /**
     * プレイヤー統計画面表示処理
     */
    handlePlayerStats(playerName) {
        console.log('プレイヤー統計表示:', playerName);

        // 前の画面を記録（プレイヤー一覧画面から来た場合）
        this.previousScreen = 'playerListScreen';

        // 指定されたプレイヤーを現在のプレイヤーに設定
        gameStorage.setCurrentPlayer(playerName);

        // UIを更新
        this.gameData = gameStorage.loadGameData();

        // 現在の画面に応じて適切なメソッドを呼び出す
        if (this.currentScreen === 'playerListScreen') {
            // プレイヤー一覧画面では専用のメソッドを使用
            this.updateCurrentPlayerDisplay();
        } else {
            // その他の画面ではタイトル画面用のメソッドを使用
            this.updatePlayerNameDisplay();
        }

        // 統計画面に遷移
        this.showStatsScreen();
    }

    /**
     * 統計画面の戻る処理
     */
    handleStatsBack() {
        console.log('統計画面の戻る処理:', {
            previousScreen: this.previousScreen,
            currentScreen: this.currentScreen
        });

        // 前の画面が記録されていればそこに戻る
        if (this.previousScreen) {
            this.showScreen(this.previousScreen);
            this.previousScreen = null; // リセット
        } else {
            // 前の画面が記録されていなければタイトル画面に戻る
            this.showScreen('titleScreen');
        }
    }

    /**
     * プレイヤー削除処理
     */
    handlePlayerDelete(playerName) {
        console.log('プレイヤー削除要求:', playerName);

        // 削除確認ダイアログ
        if (!confirm(`プレイヤー「${playerName}」を削除しますか？\n\n⚠️ この操作は取り消せません。\n・ゲームの進捗データ\n・スコア記録\n・すべての設定\nが完全に削除されます。`)) {
            console.log('プレイヤー削除がキャンセルされました');
            return;
        }

        const currentPlayer = gameStorage.getCurrentPlayer();
        const isCurrentPlayer = (playerName === currentPlayer);

        try {
            // プレイヤーデータを削除
            console.log('プレイヤーデータ削除実行:', playerName);
            const deleteSuccess = gameStorage.deletePlayerData(playerName);

            if (!deleteSuccess) {
                alert('削除に失敗しました。もう一度お試しください。');
                return;
            }

            // 削除されたプレイヤーが現在のプレイヤーだった場合
            if (isCurrentPlayer) {
                console.log('現在のプレイヤーが削除されました。別のプレイヤーを設定します。');

                // 他のプレイヤーがいるか確認
                const allPlayers = gameStorage.getAllPlayerNames();
                if (allPlayers.length > 0) {
                    // 最初のプレイヤーを現在のプレイヤーに設定
                    const newCurrentPlayer = allPlayers[0];
                    gameStorage.setCurrentPlayer(newCurrentPlayer);
                    console.log('新しい現在のプレイヤー:', newCurrentPlayer);
                } else {
                    // プレイヤーが一人もいない場合
                    gameStorage.setCurrentPlayer(null);
                    console.log('すべてのプレイヤーが削除されました');
                }

                // UIを更新
                this.gameData = gameStorage.loadGameData();

                // 現在の画面に応じて適切なメソッドを呼び出す
                if (this.currentScreen === 'playerListScreen') {
                    // プレイヤー一覧画面では専用のメソッドを使用
                    this.updateCurrentPlayerDisplay();
                } else {
                    // その他の画面ではタイトル画面用のメソッドを使用
                    this.updatePlayerNameDisplay();
                }
            }

            // プレイヤー一覧を更新
            this.updatePlayerListDisplay();
            this.updateCurrentPlayerDisplay();

            // 削除完了メッセージ
            alert(`プレイヤー「${playerName}」を削除しました。`);

        } catch (error) {
            console.error('プレイヤー削除エラー:', error);
            alert('削除中にエラーが発生しました。もう一度お試しください。');
        }
    }

    /**
     * アイコン選択画面を表示
     */
    showIconSelectScreen(playerName = null) {
        this.selectedPlayerForIcon = playerName || gameStorage.getCurrentPlayer();
        this.updateIconGridDisplay();
        this.showScreen('iconSelectScreen');
    }

    /**
     * アイコングリッド表示を更新
     */
    updateIconGridDisplay() {
        const iconGrid = document.getElementById('iconGrid');
        const currentIconDisplay = document.getElementById('currentIconDisplay');

        if (!iconGrid || !currentIconDisplay) {
            console.error('アイコン選択要素が見つかりません');
            return;
        }

        // 現在のアイコンを表示
        const currentIcon = gameStorage.getPlayerIcon(this.selectedPlayerForIcon);
        const currentIconInfo = gameStorage.getIconById(currentIcon);
        currentIconDisplay.textContent = currentIconInfo.emoji;

        // アイコングリッドをクリア
        iconGrid.innerHTML = '';

        // 利用可能なアイコンを表示
        const availableIcons = gameStorage.getAvailableIcons();
        availableIcons.forEach(iconInfo => {
            const iconOption = this.createIconOption(iconInfo, currentIcon);
            iconGrid.appendChild(iconOption);
        });
    }

    /**
     * アイコンオプションを作成
     */
    createIconOption(iconInfo, currentIcon) {
        const option = document.createElement('div');
        option.className = 'icon-option';

        if (iconInfo.id === currentIcon) {
            option.classList.add('selected');
        }

        option.innerHTML = `
            <div class="icon-option-emoji">${iconInfo.emoji}</div>
            <div class="icon-option-name">${iconInfo.name}</div>
        `;

        // クリックイベントを追加
        option.addEventListener('click', () => {
            this.handleIconSelection(iconInfo.id);
        });

        return option;
    }

    /**
     * アイコン選択処理
     */
    handleIconSelection(iconId) {
        console.log('アイコン選択:', iconId, 'プレイヤー:', this.selectedPlayerForIcon);

        // アイコンを更新
        const success = gameStorage.updatePlayerIcon(this.selectedPlayerForIcon, iconId);

        if (success) {
            // アイコングリッドの表示を更新
            this.updateIconGridDisplay();

            // プレイヤーがゲーム中のプレイヤーの場合、UIを更新
            if (this.selectedPlayerForIcon === gameStorage.getCurrentPlayer()) {
                // 現在の画面に応じて適切なメソッドを呼び出す
                if (this.currentScreen === 'playerListScreen') {
                    // プレイヤー一覧画面では専用のメソッドを使用
                    this.updateCurrentPlayerDisplay();
                } else {
                    // その他の画面ではタイトル画面用のメソッドを使用
                    this.updatePlayerNameDisplay();
                }
            }

            // 少し遅れてプレイヤー一覧に戻る
            setTimeout(() => {
                this.showPlayerListScreen();
            }, 1000);
        } else {
            console.error('アイコン更新に失敗しました');
        }
    }
}

// UIManagerクラスをグローバルスコープに明示的に登録
window.UIManager = UIManager;

// UI管理インスタンス
let uiManager;

// DOM読み込み完了後に初期化
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DOM読み込み完了 ===');

    // 即座にクラス定義状況を確認
    console.log('即座のクラス確認:', {
        Player: typeof Player,
        Stage: typeof Stage,
        SimpleGame: typeof SimpleGame,
        UIManager: typeof UIManager
    });

    console.log('windowオブジェクトのクラス:', {
        Player: typeof window.Player,
        Stage: typeof window.Stage,
        SimpleGame: typeof window.SimpleGame,
        UIManager: typeof window.UIManager
    });

    // 少し待ってから再確認
    setTimeout(() => {
        console.log('=== 100ms後のクラス確認 ===');
        console.log('遅延後のクラス確認:', {
            Player: typeof Player,
            Stage: typeof Stage,
            SimpleGame: typeof SimpleGame,
            UIManager: typeof UIManager
        });

        console.log('遅延後のwindowオブジェクトのクラス:', {
            Player: typeof window.Player,
            Stage: typeof window.Stage,
            SimpleGame: typeof window.SimpleGame,
            UIManager: typeof window.UIManager
        });

        try {
            uiManager = new UIManager();
            window.uiManager = uiManager; // グローバルアクセス用
            console.log('UIManager初期化完了');
        } catch (error) {
            console.error('UIManager初期化エラー:', error);
        }
    }, 100);
});

// UIManager初期化確認
console.log('ui.js読み込み完了');

/**
 * タッチコントロール修正完了 - 2024年12月27日
 * - window.game設定追加
 * - 堅牢なタッチイベント処理
 * - 詳細なログ出力
 * - ビジュアルフィードバック改善
 */
