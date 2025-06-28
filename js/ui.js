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
        // 最後にプレイしたプレイヤーを復元
        const lastPlayer = gameStorage.getLastPlayer();
        if (lastPlayer) {
            gameStorage.setCurrentPlayer(lastPlayer);
            console.log('最後のプレイヤーを復元:', lastPlayer);
        }
        
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

        // 統計ボタン
        document.getElementById('statsButton').addEventListener('click', () => {
            this.showStatsScreen();
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

        // 統計画面
        document.getElementById('statsBackButton').addEventListener('click', () => {
            this.showScreen('titleScreen');
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

        for (let i = 1; i <= 5; i++) {
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
            return;
        }
        
        // 既存のプレイヤー名リストを取得
        const existingPlayers = gameStorage.getAllPlayerNames();
        const isExistingPlayer = existingPlayers.includes(name);
        
        try {
            // プレイヤーを切り替え
            gameStorage.setCurrentPlayer(name);
            
            // プレイヤー名を保存（新規プレイヤーの場合は新しいデータが作成される）
            const success = gameStorage.savePlayerName(name);
            
            if (success) {
                // 最新データを読み込み
                this.gameData = gameStorage.loadGameData();
                
                // UI更新
                this.updatePlayerNameDisplay();
                this.updateUI();
                
                console.log('✅ プレイヤー名変更成功:', name);
                
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
            
            console.log('=== 処理完了 ===');
        } catch (error) {
            console.error('❌ 保存処理エラー:', error);
            alert('なまえのほぞんにしっぱいしました');
            console.log('=== 処理終了（保存エラー） ===');
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
        const randomStage = Math.floor(Math.random() * 5) + 1;
        
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
        
        // 5つのステージを表示
        for (let stage = 1; stage <= 5; stage++) {
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
        
        for (let stage = 1; stage <= 5; stage++) {
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
