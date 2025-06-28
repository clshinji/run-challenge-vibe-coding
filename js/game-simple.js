/**
 * シンプルなゲームエンジン（一時停止・再開機能なし）
 */
class SimpleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.isInitialized = false; // 初期化完了フラグを追加
        this.currentStage = 1;
        this.gameLoopId = null;
        
        // ゲーム状態
        this.gameState = {
            score: 0,
            itemsCollected: 0,
            time: 0,
            lives: 3
        };
        
        // 処理状態フラグ
        this.isCompleting = false;
        
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
        
        // ゴールアニメーション
        this.goalAnimation = null;
        
        this.init();
    }

    /**
     * ゲーム初期化
     */
    init() {
        this.setupCanvas();
        this.setupInputHandlers();
        
        // ゴールアニメーション初期化
        this.goalAnimation = new GoalAnimation(this.canvas, this.ctx);
        
        console.log('シンプルゲームエンジン初期化完了');
    }

    /**
     * Canvas設定
     */
    setupCanvas() {
        this.resizeCanvas();
        this.resizeHandler = () => this.resizeCanvas();
        window.addEventListener('resize', this.resizeHandler);
        this.ctx.imageSmoothingEnabled = false;
    }

    /**
     * Canvas サイズ調整
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        
        const targetRatio = 2; // 横:縦 = 2:1
        const containerWidth = Math.min(containerRect.width - 40, 1000);
        const containerHeight = window.innerHeight - 160;
        
        let width, height;
        
        // コンテナの縦横比に基づいて最適なサイズを計算
        if (containerWidth / containerHeight > targetRatio) {
            // 高さ基準でサイズを決定
            height = Math.min(containerHeight, 500);
            width = height * targetRatio;
        } else {
            // 幅基準でサイズを決定
            width = Math.min(containerWidth, 1000);
            height = width / targetRatio;
        }
        
        // 最小サイズの保証
        width = Math.max(width, 400);
        height = Math.max(height, 200);
        
        // 最大サイズの制限
        width = Math.min(width, 1000);
        height = Math.min(height, 500);
        
        // キャンバスの実際のサイズ設定
        this.canvas.width = width;
        this.canvas.height = height;
        
        // CSS表示サイズも同じに設定（縦横比維持）
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        console.log(`キャンバスサイズ調整: ${width}x${height} (比率: ${(width/height).toFixed(2)})`);
    }

    /**
     * 入力ハンドラー設定
     */
    setupInputHandlers() {
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

        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
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
            this.isCompleting = false; // クリア処理フラグをリセット
            this.gameState = {
                score: 0,
                itemsCollected: 0,
                time: 0,
                lives: 3
            };

            // ステージ作成
            console.log('ステージ作成中...');
            
            // Stageクラスを取得（直接参照またはwindow経由）
            const StageClass = typeof Stage !== 'undefined' ? Stage : window.Stage;
            if (!StageClass) {
                throw new Error('Stageクラスが定義されていません。stage.jsが正しく読み込まれているか確認してください。');
            }
            this.stage = new StageClass(stageNumber);
            console.log('ステージ作成完了');
            
            // プレイヤー作成（地面の上に正しく配置）
            console.log('=== プレイヤー作成処理開始 ===');
            
            // Playerクラスの存在確認（詳細）
            console.log('Playerクラス確認:', {
                'typeof Player': typeof Player,
                'typeof window.Player': typeof window?.Player,
                'Player in window': 'Player' in window,
                'window hasOwnProperty Player': window.hasOwnProperty('Player')
            });
            
            // Playerクラスを取得（直接参照またはwindow経由）
            const PlayerClass = typeof Player !== 'undefined' ? Player : window.Player;
            console.log('取得したPlayerClass:', typeof PlayerClass);
            
            if (!PlayerClass) {
                console.error('❌ Playerクラスが見つかりません');
                console.error('利用可能なグローバル変数:', Object.keys(window).filter(key => key.includes('Player') || key.includes('player')));
                throw new Error('必要なクラスが定義されていません: Player');
            }
            
            console.log('✅ Playerクラス取得成功');
            
            const playerStartX = 100;
            const playerStartY = this.stage.groundLevel - 32; // プレイヤーの高さ分を引いて地面の上に配置
            
            console.log('プレイヤー作成パラメータ:', { x: playerStartX, y: playerStartY });
            this.player = new PlayerClass(playerStartX, playerStartY);
            console.log('✅ プレイヤー作成完了:', { 
                x: playerStartX, 
                y: playerStartY, 
                groundLevel: this.stage.groundLevel 
            });
            
            // カメラ初期化
            this.camera = { x: 0, y: 0 };
            if (this.player) {
                this.updateCamera();
            }
            
            // 初期化完了フラグ
            this.isInitialized = true;
            
            // ゲーム開始
            this.gameStartTime = performance.now();
            this.lastTime = this.gameStartTime;
            this.isRunning = true;
            
            console.log('ゲーム初期化完了:', {
                playerPos: { x: this.player.x, y: this.player.y },
                groundLevel: this.stage.groundLevel,
                isGrounded: this.player.isGrounded
            });
            
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
        if (!this.isRunning) {
            console.log('ゲームループ停止');
            this.gameLoopId = null;
            return;
        }

        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        this.deltaTime = Math.min(this.deltaTime, 1/30);

        try {
            this.update();
            this.render();
        } catch (error) {
            console.error('ゲームループエラー:', error);
        }

        this.gameLoopId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * ゲーム更新
     */
    update() {
        this.gameState.time = (performance.now() - this.gameStartTime) / 1000;

        // ゴールアニメーション中は更新を停止
        if (this.goalAnimation && this.goalAnimation.isAnimating()) {
            this.goalAnimation.update(performance.now());
            return;
        }

        if (this.player) {
            this.player.update(this.deltaTime, this.stage);
        }

        if (this.stage) {
            this.stage.update(this.deltaTime);
        }

        this.updateCamera();
        this.checkCollisions();
        this.checkGameState();

        if (window.uiManager) {
            window.uiManager.updateGameUI(this.gameState);
        }
    }

    /**
     * カメラ更新
     */
    updateCamera() {
        if (!this.player || !this.canvas) return;

        const targetX = this.player.x - this.canvas.width / 2;
        const targetY = this.player.y - this.canvas.height * 0.7;

        if (this.gameState.time < 0.1) {
            this.camera.x = targetX;
            this.camera.y = targetY;
        } else {
            this.camera.x += (targetX - this.camera.x) * 0.1;
            this.camera.y += (targetY - this.camera.y) * 0.1;
        }

        if (this.stage) {
            // 横方向の制限
            this.camera.x = Math.max(0, Math.min(this.camera.x, this.stage.width - this.canvas.width));
            
            // 縦方向の制限を緩和（背景が描画されるように）
            const minY = -200; // 上方向により多く移動可能
            const maxY = 200;  // 下方向により多く移動可能
            this.camera.y = Math.max(minY, Math.min(this.camera.y, maxY));
        }
    }

    /**
     * 衝突判定
     */
    checkCollisions() {
        if (!this.player || !this.stage || !this.isInitialized) return;
        
        // ゲーム開始直後は衝突判定をスキップ（初期化完了まで待機）
        if (this.gameState.time < 1.0) {
            return;
        }

        // プレイヤーが地面にいない場合の落下判定のみ先に実行
        if (!this.player.isGrounded && this.player.y > this.stage.groundLevel + 300) {
            console.log('プレイヤーが画面外に落下しました:', { 
                playerY: this.player.y, 
                groundLevel: this.stage.groundLevel,
                threshold: this.stage.groundLevel + 300 
            });
            this.playerDied();
            return;
        }

        // アイテムとの衝突
        this.stage.items.forEach((item, index) => {
            if (item.active && this.checkCollision(this.player, item)) {
                item.active = false;
                this.collectItem(item);
                this.stage.items.splice(index, 1);
            }
        });

        // 障害物との衝突（三角形の当たり判定）
        this.stage.obstacles.forEach(obstacle => {
            if (this.checkTriangleCollision(this.player, obstacle)) {
                console.log('🔥 三角形障害物との衝突を検出:', obstacle.type);
                console.log('プレイヤー無敵状態:', this.player.invulnerable);
                this.handleObstacleCollision(obstacle);
            }
        });

        // ゴールとの衝突（クリア処理中は判定しない）
        if (!this.isCompleting && this.stage.goal && this.checkCollision(this.player, this.stage.goal)) {
            console.log('ゴールとの衝突を検出');
            this.completeStage();
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
     * 三角形（スパイク）との衝突判定
     */
    checkTriangleCollision(player, triangle) {
        // 三角形の頂点座標
        const trianglePoints = [
            { x: triangle.x, y: triangle.y + triangle.height }, // 左下
            { x: triangle.x + triangle.width/2, y: triangle.y }, // 上の頂点
            { x: triangle.x + triangle.width, y: triangle.y + triangle.height } // 右下
        ];

        // プレイヤーの矩形の4つの角
        const playerPoints = [
            { x: player.x, y: player.y }, // 左上
            { x: player.x + player.width, y: player.y }, // 右上
            { x: player.x, y: player.y + player.height }, // 左下
            { x: player.x + player.width, y: player.y + player.height } // 右下
        ];

        // プレイヤーの角が三角形内にあるかチェック
        for (let point of playerPoints) {
            if (this.isPointInTriangle(point, trianglePoints)) {
                return true;
            }
        }

        // 三角形の頂点がプレイヤーの矩形内にあるかチェック
        for (let point of trianglePoints) {
            if (point.x >= player.x && point.x <= player.x + player.width &&
                point.y >= player.y && point.y <= player.y + player.height) {
                return true;
            }
        }

        return false;
    }

    /**
     * 点が三角形内にあるかチェック（重心座標系を使用）
     */
    isPointInTriangle(point, triangle) {
        const [p1, p2, p3] = triangle;
        
        // 三角形の面積を計算
        const area = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p3.x - p1.x) * (p2.y - p1.y)) / 2;
        
        // 点と各辺で作る三角形の面積を計算
        const area1 = Math.abs((p1.x - point.x) * (p2.y - point.y) - (p2.x - point.x) * (p1.y - point.y)) / 2;
        const area2 = Math.abs((p2.x - point.x) * (p3.y - point.y) - (p3.x - point.x) * (p2.y - point.y)) / 2;
        const area3 = Math.abs((p3.x - point.x) * (p1.y - point.y) - (p1.x - point.x) * (p3.y - point.y)) / 2;
        
        // 面積の合計が元の三角形の面積と等しければ、点は三角形内にある
        return Math.abs(area - (area1 + area2 + area3)) < 0.01;
    }

    /**
     * 障害物衝突処理
     */
    handleObstacleCollision(obstacle) {
        // 無敵時間中はダメージを受けない
        if (this.player.invulnerable) {
            console.log('⚡ 無敵時間中のため、ダメージを無視');
            return;
        }

        console.log('💥 スパイクに触れました！');
        
        // まずライフを減らす
        const beforeLives = this.gameState.lives;
        this.gameState.lives--;
        console.log(`❤️ ライフ減少: ${beforeLives} → ${this.gameState.lives}`);

        // ダメージアニメーション付きでライフ表示を更新
        if (window.uiManager) {
            window.uiManager.updateLivesWithDamage(this.gameState.lives);
            console.log('🎨 UI更新完了');
        } else {
            console.log('⚠️ uiManagerが見つかりません');
        }
        
        // プレイヤーにダメージエフェクト付きでダメージを与える
        this.player.takeDamage(obstacle.x, obstacle.y);
        console.log('🎯 プレイヤーダメージエフェクト適用');

        // ライフが0になったらゲームオーバー
        if (this.gameState.lives <= 0) {
            console.log('💀 ライフが0になりました - ゲームオーバー準備');
            // 少し遅れてゲームオーバー（アニメーションを見せるため）
            setTimeout(() => {
                this.gameOver();
            }, 800);
        }
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
    }

    /**
     * プレイヤー死亡処理（落下時専用）
     */
    playerDied() {
        console.log('プレイヤーが落下死しました');
        this.gameState.lives--;
        
        // ダメージアニメーション付きでライフ表示を更新
        if (window.uiManager) {
            window.uiManager.updateLivesWithDamage(this.gameState.lives);
        }
        
        if (this.gameState.lives <= 0) {
            this.gameOver();
        } else {
            // 落下死の場合のみリスポーン
            this.player.respawn();
        }
    }

    /**
     * ステージクリア
     */
    completeStage() {
        console.log('ステージクリア処理開始');
        
        // 重複実行を防ぐ
        if (this.isCompleting) {
            return;
        }
        
        this.isCompleting = true;
        this.isRunning = false;
        
        // ゴールアニメーション開始
        if (this.goalAnimation && this.player) {
            const screenX = this.player.x - this.camera.x;
            const screenY = this.player.y - this.camera.y;
            this.goalAnimation.start(screenX, screenY);
        }
        
        const stats = {
            score: this.gameState.score,
            time: Math.floor(this.gameState.time),
            itemsCollected: this.gameState.itemsCollected
        };

        gameStorage.saveStageCompletion(this.currentStage, stats);

        // アニメーション終了後にクリア画面を表示
        setTimeout(() => {
            const ui = window.uiManager;
            if (ui && typeof ui.showGameClear === 'function') {
                ui.showGameClear(stats);
            } else {
                // 代替手段：直接画面表示
                try {
                    document.getElementById('clearScore').textContent = stats.score;
                    document.getElementById('clearTime').textContent = stats.time;
                    document.getElementById('clearItems').textContent = stats.itemsCollected;
                    
                    document.querySelectorAll('.screen').forEach(screen => {
                        screen.classList.remove('active');
                    });
                    
                    const clearScreen = document.getElementById('clearScreen');
                    if (clearScreen) {
                        clearScreen.classList.add('active');
                    }
                } catch (error) {
                    console.error('クリア画面表示エラー:', error);
                }
            }
        }, 3200);
    }

    /**
     * ゲームオーバー
     */
    gameOver() {
        this.isRunning = false;
        
        if (window.uiManager) {
            window.uiManager.showGameOver();
        }
    }

    /**
     * ゲーム状態チェック
     */
    checkGameState() {
        // 特別な条件チェック
    }

    /**
     * 描画処理
     */
    render() {
        try {
            // 画面全体をクリア（確実に背景色で塗りつぶし）
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            if (!this.stage || !this.player) {
                this.ctx.fillStyle = 'red';
                this.ctx.font = '20px Arial';
                this.ctx.fillText('オブジェクトが存在しません', 50, 50);
                return;
            }

            this.ctx.save();
            
            const cameraX = isFinite(this.camera.x) ? this.camera.x : 0;
            const cameraY = isFinite(this.camera.y) ? this.camera.y : 0;
            
            this.ctx.translate(-cameraX, -cameraY);

            // ステージ描画（背景含む）
            this.stage.render(this.ctx);
            
            // プレイヤー描画
            this.player.render(this.ctx);

            this.ctx.restore();
            
            // ゴールアニメーション描画
            if (this.goalAnimation) {
                this.goalAnimation.render();
            }
            
            // UI描画（カメラ影響なし）
            this.renderUI();
        } catch (error) {
            console.error('描画エラー:', error);
            // エラー時も背景を確実に描画
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'red';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('描画エラーが発生しました', 50, 50);
        }
    }

    /**
     * UI描画
     */
    renderUI() {
        // デバッグ情報（簡素化）
        if (this.player) {
            this.ctx.fillStyle = 'white';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`Running: ${this.isRunning}`, 10, 30);
        }
    }

    /**
     * ゲーム停止
     */
    stop() {
        console.log('ゲーム停止');
        this.isRunning = false;
        
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
    }
}

// SimpleGameクラスをグローバルスコープに明示的に登録
window.SimpleGame = SimpleGame;

// グローバル変数
let simpleGame = null;

// ファイル読み込み確認
console.log('game-simple.js読み込み完了 - SimpleGameクラス定義済み:', typeof SimpleGame, typeof window.SimpleGame);
