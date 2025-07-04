/**
 * UI管理クラス
 */
class UIManager {
    constructor() {
        this.currentScreen = 'titleScreen';
        this.previousScreen = null; // 前の画面を記録
        this.gameData = null;
        this.storage = new GameStorage();
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

        document.getElementById('playerListBackButton').addEventListener('click', () => {
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

        // デバッグボタン
        document.getElementById('addTestDataButton').addEventListener('click', () => {
            this.generateTestData();
        });

        document.getElementById('addTestScoreButton').addEventListener('click', () => {
            this.addTestScore();
        });

        document.getElementById('resetScoreButton').addEventListener('click', () => {
            this.resetScoreData();
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
        this.setupCanvasTouch();
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

        console.log('タッチコントロール設定開始...');

        // デバッグ: ボタンの存在確認
        console.log('ボタンの存在確認:');
        Object.keys(touchButtons).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            console.log(`${buttonId}: ${button ? '見つかった' : '見つからない'}`, button);
        });

        Object.entries(touchButtons).forEach(([buttonId, action]) => {
            const button = document.getElementById(buttonId);

            if (!button) {
                console.error(`タッチボタンが見つかりません: ${buttonId}`);
                return;
            }

            console.log(`${buttonId} ボタンにイベントリスナーを追加`);

            // タッチイベント（モバイル用）
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`タッチ開始: ${action}`);
                this.handleButtonInput(action, true);
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`タッチ終了: ${action}`);
                this.handleButtonInput(action, false);
            });

            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`タッチキャンセル: ${action}`);
                this.handleButtonInput(action, false);
            });

            // クリックイベント（マウス用 - シンプルで確実）
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`[BUTTON_DEBUG] クリック: ${action}`);

                // すべての動作を handleButtonInput 経由で処理（連続押下防止統一）
                console.log(`[BUTTON_DEBUG] handleButtonInput経由でジャンプ実行: ${action}`);
                this.handleButtonInput(action, true);
                setTimeout(() => {
                    this.handleButtonInput(action, false);
                }, 100);
            });

            // マウスイベント（長押し対応用 - ジャンプ以外）
            if (action !== 'jump') {
                button.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`[BUTTON_DEBUG] マウス押下: ${action}`);
                    this.handleButtonInput(action, true);
                });

                button.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`[BUTTON_DEBUG] マウス離上: ${action}`);
                    this.handleButtonInput(action, false);
                });

                button.addEventListener('mouseleave', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`[BUTTON_DEBUG] マウス離脱: ${action}`);
                    this.handleButtonInput(action, false);
                });
            }

            // ビジュアルフィードバック - タッチ
            button.addEventListener('touchstart', () => {
                button.classList.add('pressed');
            });

            button.addEventListener('touchend', () => {
                button.classList.remove('pressed');
            });

            button.addEventListener('touchcancel', () => {
                button.classList.remove('pressed');
            });

            // ビジュアルフィードバック - クリック（全ボタン共通）
            button.addEventListener('click', () => {
                button.classList.add('pressed');
                setTimeout(() => {
                    button.classList.remove('pressed');
                }, 150);
            });

            // ビジュアルフィードバック - マウス（ジャンプ以外の長押し対応）
            if (action !== 'jump') {
                button.addEventListener('mousedown', () => {
                    button.classList.add('pressed');
                });

                button.addEventListener('mouseup', () => {
                    button.classList.remove('pressed');
                });

                button.addEventListener('mouseleave', () => {
                    button.classList.remove('pressed');
                });
            }
        });

        console.log('タッチコントロール設定完了');
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
                            <div class="stage-time">${this.formatTime(stats.bestTime || 0)}</div>
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

        if (currentGame && currentGame.currentStage < 20) {
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
        console.log('ゲームクリア画面表示:', stats);

        // 統計情報を表示
        document.getElementById('clearScore').textContent = stats.score.toLocaleString();
        document.getElementById('clearTime').textContent = this.formatTime(stats.time * 1000); // 秒をミリ秒に変換
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
    }

    /**
     * デバッグ用：テストデータを生成
     */
    generateTestData() {
        const currentPlayer = gameStorage.getCurrentPlayer();
        if (!currentPlayer) {
            alert('プレイヤーが設定されていません');
            return;
        }

        const currentData = gameStorage.loadGameData();

        if (currentData.totalStats.totalScore > 0 ||
            Object.keys(currentData.progress.stageStats).length > 0) {
            if (!confirm(`プレイヤー "${currentPlayer}" には既にデータがあります。\nテストデータを追加しますか？`)) {
                return;
            }
        }

        console.log(`プレイヤー "${currentPlayer}" のテスト用データを生成中...`);

        // テスト用のステージクリアデータを生成
        const testStages = [
            { stage: 1, score: 1500, time: 45000, items: 8 },
            { stage: 2, score: 1200, time: 52000, items: 6 },
            { stage: 3, score: 800, time: 68000, items: 4 }
        ];

        testStages.forEach(stageData => {
            gameStorage.saveStageCompletion(stageData.stage, {
                score: stageData.score,
                time: stageData.time,
                itemsCollected: stageData.items
            });
        });

        console.log('テスト用データ生成完了');
        alert(`プレイヤー "${currentPlayer}" にテストデータを生成しました！\n総合スコア: 3,500点`);
    }

    /**
     * テスト用データを確保（実際のゲームデータがない場合）
     * ※現在は使用していない（新規プレイヤーはゼロから開始）
     */
    ensureTestData() {
        // この機能は無効化されています
        // 新規プレイヤーは完全にゼロから開始します
        // テストデータが必要な場合は設定画面の「テストデータ生成」ボタンを使用してください
        return;
    }

    /**
     * デバッグ用：スコアデータをリセット
     */
    resetScoreData() {
        const currentPlayer = gameStorage.getCurrentPlayer();
        if (!currentPlayer) {
            alert('プレイヤーが設定されていません');
            return;
        }

        if (confirm(`プレイヤー "${currentPlayer}" のスコアデータをリセットしますか？`)) {
            gameStorage.deletePlayerData(currentPlayer);

            // 新しいデータを作成
            gameStorage.setCurrentPlayer(currentPlayer);
            this.gameData = gameStorage.loadGameData();

            console.log(`プレイヤー "${currentPlayer}" のスコアデータをリセットしました`);
            alert(`プレイヤー "${currentPlayer}" のスコアデータをリセットしました`);
        }
    }

    /**
     * デバッグ用：テストスコアを追加
     */
    addTestScore() {
        const currentPlayer = gameStorage.getCurrentPlayer();
        if (!currentPlayer) {
            alert('プレイヤーが設定されていません');
            return;
        }

        const randomScore = Math.floor(Math.random() * 2000) + 500;
        const randomTime = Math.floor(Math.random() * 60000) + 30000;
        const randomItems = Math.floor(Math.random() * 10) + 1;
        const randomStage = Math.floor(Math.random() * 20) + 1;

        gameStorage.saveStageCompletion(randomStage, {
            score: randomScore,
            time: randomTime,
            itemsCollected: randomItems
        });

        console.log(`プレイヤー "${currentPlayer}" にテストスコア追加: ステージ${randomStage}, スコア${randomScore}, 時間${randomTime}ms, アイテム${randomItems}個`);
        alert(`テストスコア追加完了！\nプレイヤー: ${currentPlayer}\nステージ${randomStage}: ${randomScore}点`);
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
                    <span class="value">${this.formatTime(stats.bestTime || 0)}</span>
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
        if (milliseconds === 0) return '--:--';

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
            'right': ['left'],     // 右移動は左移動と相反
            'crouch': []           // しゃがみは他と相反しない（移動しながらしゃがめる）
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
            'right': ['left'],     // 右移動は左移動と相反
            'crouch': []           // しゃがみは他と相反しない（移動しながらしゃがめる）
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
