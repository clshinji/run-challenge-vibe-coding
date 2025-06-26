/**
 * メインゲームエンジン
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.currentStage = 1;
        this.gameLoopId = null;
        
        // ゲーム状態
        this.gameState = {
            score: 0,
            itemsCollected: 0,
            time: 0,
            lives: 3
        };
        
        // ゲームオブジェクト
        this.player = null;
        this.stage = null;
        this.camera = { x: 0, y: 0 };
        
        // タイミング制御
        this.lastTime = 0;
        this.deltaTime = 0;
        this.gameStartTime = 0;
        
        // キー入力状態
        this.keys = {};
        
        this.init();
    }

    /**
     * ゲーム初期化
     */
    init() {
        this.setupCanvas();
        this.setupInputHandlers();
        console.log('ゲームエンジン初期化完了');
    }

    /**
     * Canvas設定
     */
    setupCanvas() {
        // Canvas サイズ調整
        this.resizeCanvas();
        
        // リサイズハンドラーの参照を保存
        this.resizeHandler = () => this.resizeCanvas();
        window.addEventListener('resize', this.resizeHandler);
        
        // Canvas スタイル設定
        this.ctx.imageSmoothingEnabled = false; // ピクセルアート用
    }

    /**
     * Canvas サイズ調整
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerRect = container.getBoundingClientRect();
        
        console.log('Canvas リサイズ開始:', {
            container: { width: containerRect.width, height: containerRect.height },
            currentCanvas: { width: this.canvas.width, height: this.canvas.height },
            windowSize: { width: window.innerWidth, height: window.innerHeight }
        });
        
        // アスペクト比を維持しながらサイズ調整
        const targetRatio = 2; // 横:縦 = 2:1
        let width = Math.max(containerRect.width - 40, 600); // 最小幅を600pxに設定
        let height = width / targetRatio;
        
        // 高さが画面に収まらない場合は高さ基準で調整
        const maxHeight = Math.max(window.innerHeight - 200, 300); // 最小高さを300pxに設定
        if (height > maxHeight) {
            height = maxHeight;
            width = height * targetRatio;
        }
        
        // 最小サイズを保証
        width = Math.max(width, 600);
        height = Math.max(height, 300);
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        console.log('Canvas リサイズ完了:', {
            newSize: { width: this.canvas.width, height: this.canvas.height },
            style: { width: this.canvas.style.width, height: this.canvas.style.height }
        });
    }

    /**
     * 入力ハンドラー設定
     */
    setupInputHandlers() {
        // イベントハンドラーの参照を保存
        this.keyDownHandler = (e) => {
            this.keys[e.code] = true;
            this.handleKeyInput(e.code, true);
            e.preventDefault();
        };

        this.keyUpHandler = (e) => {
            this.keys[e.code] = false;
            this.handleKeyInput(e.code, false);
            e.preventDefault();
        };

        this.visibilityChangeHandler = () => {
            if (document.hidden && this.isRunning) {
                this.pause();
            }
        };

        // キーボード入力
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);

        // フォーカス管理
        document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }

    /**
     * キー入力処理
     */
    handleKeyInput(keyCode, isPressed) {
        if (!this.player) return;

        const keyMap = {
            'ArrowLeft': 'left',
            'KeyA': 'left',
            'ArrowRight': 'right',
            'KeyD': 'right',
            'ArrowUp': 'jump',
            'Space': 'jump',
            'ArrowDown': 'crouch',
            'KeyS': 'crouch'
        };

        const action = keyMap[keyCode];
        if (action) {
            this.player.handleInput(action, isPressed);
        }
    }

    /**
     * ステージ開始
     */
    startStage(stageNumber) {
        console.log(`ステージ ${stageNumber} 開始処理開始`);
        
        try {
            this.currentStage = stageNumber;
            this.gameState = {
                score: 0,
                itemsCollected: 0,
                time: 0,
                lives: 3
            };

            // ステージ作成（プレイヤーより先に作成）
            console.log('ステージ作成中...');
            this.stage = new Stage(stageNumber);
            console.log('ステージ作成完了:', this.stage);
            console.log('ステージ地面レベル:', this.stage.groundLevel);
            
            // プレイヤー作成
            console.log('プレイヤー作成中...');
            
            // Canvas高さに応じて安全な初期位置を計算
            const safePlayerY = Math.min(this.stage.groundLevel - 100, this.canvas.height - 100);
            this.player = new Player(100, safePlayerY);
            
            console.log('プレイヤー作成完了:', this.player);
            console.log('プレイヤー初期位置:', { x: this.player.x, y: this.player.y });
            console.log('ステージ地面レベル:', this.stage.groundLevel);
            console.log('Canvas高さ:', this.canvas.height);
            console.log('計算された安全位置:', safePlayerY);
            
            // カメラ初期化（シンプルで安全な方法）
            this.camera = { x: 0, y: 0 }; // まず安全な初期値に設定
            
            // プレイヤーが作成された後にカメラを調整
            if (this.player) {
                this.updateCamera(); // 初回のカメラ更新
            }
            
            console.log('カメラ初期化完了:', {
                camera: this.camera,
                player: { x: this.player.x, y: this.player.y }
            });
            
            // ゲーム開始
            this.gameStartTime = performance.now();
            this.lastTime = this.gameStartTime;
            this.isRunning = true;
            
            console.log('ゲームループ開始');
            this.gameLoop();
            
            console.log(`ステージ ${stageNumber} 開始完了`);
        } catch (error) {
            console.error('ステージ開始エラー:', error);
            throw error;
        }
    }

    /**
     * メインゲームループ
     */
    gameLoop(currentTime = 0) {
        // ゲームが停止している場合は終了
        if (!this.isRunning) {
            console.log('ゲームループ停止');
            this.gameLoopId = null;
            return;
        }

        // デルタタイム計算
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 最大デルタタイム制限（ラグ対策）
        this.deltaTime = Math.min(this.deltaTime, 1/30);

        // 更新・描画
        try {
            this.update();
            this.render();
        } catch (error) {
            console.error('ゲームループエラー:', error);
        }

        // 次のフレームをスケジュール
        this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * ゲーム更新
     */
    update() {
        // 時間更新
        this.gameState.time = (performance.now() - this.gameStartTime) / 1000;

        // プレイヤー更新
        if (this.player) {
            this.player.update(this.deltaTime, this.stage);
        }

        // ステージ更新
        if (this.stage) {
            this.stage.update(this.deltaTime);
        }

        // カメラ更新
        this.updateCamera();

        // 衝突判定
        this.checkCollisions();

        // ゲーム状態チェック
        this.checkGameState();

        // UI更新
        if (window.uiManager) {
            window.uiManager.updateGameUI(this.gameState);
        }
    }

    /**
     * カメラ更新
     */
    updateCamera() {
        if (!this.player || !this.canvas) return;

        // プレイヤーを画面中央やや下に保つ
        const targetX = this.player.x - this.canvas.width / 2;
        const targetY = this.player.y - this.canvas.height * 0.7; // 画面の70%の位置

        // 初回は直接設定、以降はスムーズ移動
        if (this.gameState.time < 0.1) {
            this.camera.x = targetX;
            this.camera.y = targetY;
        } else {
            // スムーズなカメラ移動
            this.camera.x += (targetX - this.camera.x) * 0.1;
            this.camera.y += (targetY - this.camera.y) * 0.1;
        }

        // カメラ範囲制限
        if (this.stage) {
            this.camera.x = Math.max(0, Math.min(this.camera.x, this.stage.width - this.canvas.width));
            this.camera.y = Math.max(-100, Math.min(this.camera.y, 100)); // 上下の移動範囲を制限
        }
        
        // デバッグ用ログ（最初の数フレームのみ）
        if (this.gameState.time < 1) {
            console.log('カメラ更新:', { 
                player: { x: this.player.x, y: this.player.y },
                camera: { x: this.camera.x, y: this.camera.y },
                target: { x: targetX, y: targetY },
                gameTime: this.gameState.time
            });
        }
    }

    /**
     * 衝突判定
     */
    checkCollisions() {
        if (!this.player || !this.stage) return;

        // アイテムとの衝突
        this.stage.items.forEach((item, index) => {
            if (item.active && this.checkCollision(this.player, item)) {
                item.active = false;
                this.collectItem(item);
                this.stage.items.splice(index, 1);
            }
        });

        // ゴールとの衝突
        if (this.stage.goal && this.checkCollision(this.player, this.stage.goal)) {
            this.completeStage();
        }

        // 障害物との衝突
        this.stage.obstacles.forEach(obstacle => {
            if (this.checkCollision(this.player, obstacle)) {
                this.handleObstacleCollision(obstacle);
            }
        });

        // 落下判定（ステージの地面レベルより下に落ちた場合）
        if (this.stage && this.player.y > this.stage.groundLevel + 100) {
            console.log('プレイヤー落下判定:', { 
                playerY: this.player.y, 
                groundLevel: this.stage.groundLevel,
                threshold: this.stage.groundLevel + 100
            });
            this.playerDied();
        }
    }

    /**
     * 矩形衝突判定
     */
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    /**
     * アイテム収集
     */
    collectItem(item) {
        this.gameState.itemsCollected++;
        
        switch (item.type) {
            case 'star':
                this.gameState.score += 100;
                break;
            case 'coin':
                this.gameState.score += 50;
                break;
            case 'fruit':
                this.gameState.score += 200;
                break;
        }

        // 効果音再生（実装予定）
        console.log(`アイテム収集: ${item.type}`);
    }

    /**
     * 障害物衝突処理
     */
    handleObstacleCollision(obstacle) {
        if (obstacle.type === 'deadly') {
            this.playerDied();
        }
    }

    /**
     * プレイヤー死亡処理
     */
    playerDied() {
        console.log('プレイヤー死亡処理開始');
        this.gameState.lives--;
        
        if (this.gameState.lives <= 0) {
            this.gameOver();
        } else {
            // リスポーン
            console.log('プレイヤーリスポーン実行');
            this.player.respawn();
        }
    }

    /**
     * ステージクリア
     */
    completeStage() {
        this.isRunning = false;
        
        const stats = {
            score: this.gameState.score,
            time: Math.floor(this.gameState.time),
            itemsCollected: this.gameState.itemsCollected
        };

        // データ保存
        gameStorage.saveStageCompletion(this.currentStage, stats);

        // UI表示
        if (window.uiManager) {
            window.uiManager.showGameClear(stats);
        }

        console.log('ステージクリア！', stats);
    }

    /**
     * ゲームオーバー
     */
    gameOver() {
        console.log('ゲームオーバー処理開始');
        this.isRunning = false;
        
        if (window.uiManager) {
            window.uiManager.showGameOver();
        }

        console.log('ゲームオーバー処理完了');
    }

    /**
     * ゲーム状態チェック
     */
    checkGameState() {
        // 特別な条件チェック（実装予定）
    }

    /**
     * 描画処理
     */
    render() {
        try {
            // 画面クリア
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // オブジェクトの存在確認
            if (!this.stage || !this.player) {
                console.warn('描画対象オブジェクトが存在しません', { stage: !!this.stage, player: !!this.player });
                
                // 最低限の描画（テスト用）
                this.ctx.fillStyle = 'red';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('オブジェクトが存在しません', 50, 50);
                this.ctx.fillText(`Stage: ${!!this.stage}, Player: ${!!this.player}`, 50, 80);
                return;
            }

            // デバッグ用ログ（最初の数フレームのみ）
            if (this.gameState.time < 1) {
                console.log('描画開始:', {
                    camera: this.camera,
                    player: { x: this.player.x, y: this.player.y },
                    canvasSize: { width: this.canvas.width, height: this.canvas.height }
                });
            }

            // 座標系変換（カメラ）- 安全な値でのみ実行
            this.ctx.save();
            
            const cameraX = isFinite(this.camera.x) ? this.camera.x : 0;
            const cameraY = isFinite(this.camera.y) ? this.camera.y : 0;
            
            this.ctx.translate(-cameraX, -cameraY);

            // ステージ描画
            this.stage.render(this.ctx);

            // プレイヤー描画
            this.player.render(this.ctx);

            // 座標系復元
            this.ctx.restore();

            // UI描画（カメラ影響なし）
            this.renderUI();
        } catch (error) {
            console.error('描画エラー:', error);
            // エラーが発生しても描画を続行
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // エラーメッセージを表示
            this.ctx.fillStyle = 'red';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('描画エラーが発生しました', 50, 50);
            this.ctx.fillText(error.message, 50, 80);
        }
    }

    /**
     * UI描画
     */
    renderUI() {
        // デバッグ情報
        if (this.player) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Player: (${Math.floor(this.player.x)}, ${Math.floor(this.player.y)})`, 10, 30);
            this.ctx.fillText(`Camera: (${Math.floor(this.camera.x)}, ${Math.floor(this.camera.y)})`, 10, 50);
            this.ctx.fillText(`Running: ${this.isRunning}, Paused: ${this.isPaused}`, 10, 70);
        }
        
        // 画面中央に十字線を描画（デバッグ用）
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 10, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width / 2 + 10, this.canvas.height / 2);
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.stroke();
    }

    /**
     * ゲーム一時停止
     */
    pause() {
        console.log('ゲーム一時停止処理開始');
        console.log('一時停止前状態:', {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            gameLoopId: this.gameLoopId
        });
        
        this.isPaused = true;
        
        console.log('ゲーム一時停止処理完了');
        console.log('一時停止後状態:', {
            isRunning: this.isRunning,
            isPaused: this.isPaused
        });
    }

    /**
     * ゲーム再開
     */
    resume() {
        console.log('ゲーム再開処理開始');
        console.log('再開前状態:', {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            gameLoopId: this.gameLoopId,
            player: !!this.player,
            stage: !!this.stage
        });
        
        this.isPaused = false;
        this.lastTime = performance.now();
        
        // ゲームループが停止している場合は再開
        if (!this.isRunning) {
            console.log('ゲームループが停止していたため再開');
            this.isRunning = true;
            this.gameLoop();
        }
        
        console.log('ゲーム再開処理完了');
        console.log('再開後状態:', {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            gameLoopId: this.gameLoopId
        });
    }

    /**
     * ゲーム再スタート
     */
    restart() {
        console.log('ゲーム再スタート開始');
        
        // 現在のステージ番号を保存
        const currentStageNumber = this.currentStage;
        
        // 完全にゲームを停止
        this.stop();
        
        // 新しいゲームインスタンスとして再開始
        console.log('新しいゲーム開始');
        this.startStage(currentStageNumber);
        
        console.log('ゲーム再スタート完了');
    }

    /**
     * ゲーム完全破棄
     */
    destroy() {
        console.log('ゲーム破棄開始');
        
        // ゲームループを停止
        this.isRunning = false;
        this.isPaused = false;
        
        // アニメーションフレームをキャンセル
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // イベントリスナーを削除
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
        }
        if (this.keyUpHandler) {
            document.removeEventListener('keyup', this.keyUpHandler);
        }
        if (this.visibilityChangeHandler) {
            document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
        
        // オブジェクトを完全にクリア
        this.player = null;
        this.stage = null;
        this.camera = null;
        
        // Canvas参照はクリアしない（再利用のため）
        // this.ctx = null;
        // this.canvas = null;
        
        // ゲーム状態をクリア
        this.gameState = null;
        this.keys = null;
        
        console.log('ゲーム破棄完了');
    }

    /**
     * ゲーム停止
     */
    stop() {
        console.log('ゲーム停止開始');
        
        // ゲームループを停止
        this.isRunning = false;
        this.isPaused = false;
        
        // アニメーションフレームをキャンセル
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        // オブジェクトをクリア
        this.player = null;
        this.stage = null;
        this.camera = { x: 0, y: 0 };
        
        // ゲーム状態をリセット
        this.gameState = {
            score: 0,
            itemsCollected: 0,
            time: 0,
            lives: 3
        };
        
        console.log('ゲーム停止完了');
    }
}

// グローバル変数
let game = null;
