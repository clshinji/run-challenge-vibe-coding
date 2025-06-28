/**
 * UI管理クラス
 */
class UIManager {
    constructor() {
        this.currentScreen = 'titleScreen';
        this.gameData = null;
        this.storage = new GameStorage();
        this.init();
    }

    /**
     * UI初期化
     */
    init() {
        this.gameData = gameStorage.loadGameData();
        this.setupEventListeners();
        this.updateUI();
        this.showScreen('titleScreen');
        
        // 初期化後にプレイヤー名表示を更新
        setTimeout(() => {
            this.updatePlayerNameDisplay();
        }, 100);
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
            if (this.gameData.playerName) {
                this.showScreen('stageSelectScreen');
            } else {
                this.showScreen('nameInputScreen');
            }
        });

        document.getElementById('settingsButton').addEventListener('click', () => {
            this.showScreen('settingsScreen');
        });

        // プレイヤー名編集ボタン
        document.getElementById('editPlayerNameButton').addEventListener('click', () => {
            this.showEditNameScreen();
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
            console.log('つぎのステージへボタンクリック');
            this.handleNextStage();
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
    }

    /**
     * タッチコントロール設定
     */
    setupTouchControls() {
        const touchButtons = {
            leftButton: 'left',
            rightButton: 'right',
            jumpButton: 'jump',
            crouchButton: 'crouch'
        };

        Object.entries(touchButtons).forEach(([buttonId, action]) => {
            const button = document.getElementById(buttonId);
            
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (window.game && window.game.player) {
                    window.game.player.handleInput(action, true);
                }
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (window.game && window.game.player) {
                    window.game.player.handleInput(action, false);
                }
            });

            // マウスイベントも追加（デバッグ用）
            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                if (window.game && window.game.player) {
                    window.game.player.handleInput(action, true);
                }
            });

            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                if (window.game && window.game.player) {
                    window.game.player.handleInput(action, false);
                }
            });
        });
    }

    /**
     * 画面表示
     */
    showScreen(screenId) {
        // 全ての画面を非表示
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // 指定された画面を表示
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;

            // 画面固有の初期化処理
            this.initScreen(screenId);
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
        switch (screenId) {
            case 'nameInputScreen':
                document.getElementById('playerNameInput').focus();
                break;
            case 'stageSelectScreen':
                this.updateStageButtons();
                break;
            case 'settingsScreen':
                this.updateSettingsUI();
                break;
        }
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
            this.gameData.playerName = name;
            gameStorage.savePlayerName(name);
            this.showScreen('stageSelectScreen');
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
        stageButtonsContainer.innerHTML = '';

        for (let i = 1; i <= 5; i++) {
            const button = document.createElement('button');
            button.className = 'stage-button';
            button.textContent = i;

            const isUnlocked = gameStorage.isStageUnlocked(i);
            const isCompleted = gameStorage.isStageCompleted(i);

            if (isUnlocked) {
                if (isCompleted) {
                    button.classList.add('completed');
                    button.innerHTML = `${i}<br>⭐`;
                } else {
                    button.classList.add('unlocked');
                }
                
                button.addEventListener('click', () => {
                    this.startStage(i);
                });
            } else {
                button.classList.add('locked');
                button.innerHTML = `${i}<br>🔒`;
            }

            stageButtonsContainer.appendChild(button);
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
            window.simpleGame.startStage(stageNumber);
            console.log('✅ シンプルゲーム開始処理完了');
            
            // ゲーム開始後にもう一度ライフ表示を確認
            setTimeout(() => {
                if (window.simpleGame && window.simpleGame.gameState) {
                    this.updateLivesDisplay(window.simpleGame.gameState.lives);
                    console.log('❤️ ゲーム開始後ライフ表示確認:', window.simpleGame.gameState.lives);
                }
            }, 200);
            
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
        const currentGame = window.simpleGame || window.game;
        
        if (currentGame && currentGame.currentStage < 5) {
            const nextStage = currentGame.currentStage + 1;
            console.log(`次のステージ処理: ${currentGame.currentStage} → ${nextStage}`);
            
            // 次のステージが解放されているかチェック
            if (gameStorage.isStageUnlocked(nextStage)) {
                console.log(`ステージ${nextStage}開始`);
                this.hideScreen('clearScreen');
                this.startStage(nextStage);
            } else {
                console.log(`ステージ${nextStage}は未解放のため、ステージ選択画面へ`);
                this.showScreen('stageSelectScreen');
                if (currentGame) currentGame.stop();
            }
        } else {
            // 全ステージクリア
            console.log('全ステージクリア！');
            alert('🎉 おめでとう！すべてのステージをクリアしました！');
            this.showScreen('stageSelectScreen');
            if (currentGame) currentGame.stop();
        }
    }

    /**
     * 設定切り替え
     */
    toggleSetting(setting) {
        this.gameData.settings[setting] = !this.gameData.settings[setting];
        gameStorage.saveSettings(this.gameData.settings);
        this.updateSettingsUI();
    }

    /**
     * 設定UI更新
     */
    updateSettingsUI() {
        const musicButton = document.getElementById('musicToggle');
        const soundButton = document.getElementById('soundToggle');

        musicButton.textContent = this.gameData.settings.music ? 'ON' : 'OFF';
        musicButton.className = this.gameData.settings.music ? 'toggle-button' : 'toggle-button off';

        soundButton.textContent = this.gameData.settings.sound ? 'ON' : 'OFF';
        soundButton.className = this.gameData.settings.sound ? 'toggle-button' : 'toggle-button off';
    }

    /**
     * ゲームUI更新
     */
    updateGameUI(gameState) {
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('itemCount').textContent = gameState.itemsCollected;
        document.getElementById('time').textContent = Math.floor(gameState.time);
        this.updateLivesDisplay(gameState.lives);
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
        // 統計情報を表示
        document.getElementById('clearScore').textContent = stats.score;
        document.getElementById('clearTime').textContent = stats.time;
        document.getElementById('clearItems').textContent = stats.itemsCollected;
        
        // 次のステージボタンの表示制御
        const currentGame = window.simpleGame || window.game;
        const nextButton = document.getElementById('nextStageButton');
        
        if (currentGame && currentGame.currentStage < 5) {
            const nextStage = currentGame.currentStage + 1;
            if (gameStorage.isStageUnlocked(nextStage)) {
                nextButton.style.display = 'block';
            } else {
                nextButton.style.display = 'none';
            }
        } else {
            nextButton.style.display = 'none';
        }
        
        this.showScreen('clearScreen');
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
    }

    /**
     * プレイヤー名編集画面を表示
     */
    showEditNameScreen() {
        const currentNameInEdit = document.getElementById('currentNameInEdit');
        const editInput = document.getElementById('editPlayerNameInput');
        
        console.log('プレイヤー名編集画面を表示:', {
            currentPlayerName: this.gameData.playerName,
            hasPlayerName: !!(this.gameData.playerName && this.gameData.playerName.trim() !== '')
        });
        
        // 現在の名前を表示
        if (this.gameData.playerName && this.gameData.playerName.trim() !== '') {
            currentNameInEdit.textContent = this.gameData.playerName;
            editInput.value = this.gameData.playerName;
            console.log('既存の名前を入力フィールドに設定:', this.gameData.playerName);
        } else {
            currentNameInEdit.textContent = 'なまえがないよ';
            editInput.value = '';
            console.log('名前が未設定のため、入力フィールドを空に設定');
        }
        
        this.showScreen('editNameScreen');
        
        // 入力フィールドにフォーカス
        setTimeout(() => {
            editInput.focus();
            editInput.select();
            console.log('入力フィールドにフォーカスを設定');
        }, 100);
    }

    /**
     * プレイヤー名編集処理
     */
    handleEditNameInput() {
        const nameInput = document.getElementById('editPlayerNameInput');
        const name = nameInput.value.trim();
        
        console.log('=== プレイヤー名編集処理開始 ===');
        console.log('入力値:', {
            raw: `"${nameInput.value}"`,
            trimmed: `"${name}"`,
            length: name.length
        });
        
        // バリデーション
        if (name.length === 0) {
            console.log('❌ 空の名前 - エラーメッセージ表示');
            alert('なまえをいれてください');
            nameInput.focus();
            console.log('=== 処理終了（エラー） ===');
            return;
        }
        
        if (name.length > 10) {
            console.log('❌ 名前が長すぎる - エラーメッセージ表示');
            alert('なまえは10もじいないでいれてください');
            nameInput.focus();
            console.log('=== 処理終了（エラー） ===');
            return;
        }
        
        // 正常処理
        console.log('✅ バリデーション通過 - 保存処理開始');
        
        try {
            // 保存
            gameStorage.savePlayerName(name);
            this.gameData = gameStorage.loadGameData();
            console.log('✅ 名前保存完了:', this.gameData.playerName);
            
            // UI更新
            this.updatePlayerNameDisplay();
            console.log('✅ UI更新完了');
            
            // 画面遷移
            nameInput.value = '';
            this.showScreen('titleScreen');
            console.log('✅ 画面遷移完了');
            
            // 成功メッセージ（遅延実行）
            setTimeout(() => {
                console.log('✅ 成功メッセージ表示:', name);
                alert(`なまえを「${name}」にかえました！`);
                console.log('=== 処理完了（成功） ===');
            }, 200);
            
        } catch (error) {
            console.error('❌ 保存処理エラー:', error);
            alert('なまえのほぞんにしっぱいしました');
            console.log('=== 処理終了（保存エラー） ===');
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
