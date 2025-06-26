/**
 * ステージ管理システム
 */
class Stage {
    constructor(stageNumber) {
        console.log(`ステージ ${stageNumber} 作成開始`);
        
        this.stageNumber = stageNumber;
        this.width = 2400; // ステージ幅
        this.height = 600; // ステージ高さ
        
        // Canvas高さを取得して適切な地面レベルを設定
        const canvas = document.getElementById('gameCanvas');
        const canvasHeight = canvas ? canvas.height : 400;
        this.groundLevel = Math.max(canvasHeight * 0.8, 250); // Canvas高さの80%または最低250px
        
        console.log('ステージ基本設定完了:', { 
            stageNumber: this.stageNumber, 
            width: this.width, 
            height: this.height, 
            groundLevel: this.groundLevel,
            canvasHeight: canvasHeight
        });
        
        // ゲームオブジェクト初期化
        this.platforms = [];
        this.walls = [];
        this.items = [];
        this.obstacles = [];
        this.goal = null;
        
        // 背景
        this.backgroundLayers = [];
        
        console.log('ゲームオブジェクト配列初期化完了');
        
        // ステージデータ読み込み
        try {
            this.loadStageData();
            console.log(`ステージ ${stageNumber} 作成完了`);
        } catch (error) {
            console.error('ステージデータ読み込みエラー:', error);
            throw error;
        }
    }

    /**
     * ステージデータ読み込み
     */
    loadStageData() {
        console.log(`ステージ ${this.stageNumber} のデータ読み込み開始`);
        
        try {
            switch (this.stageNumber) {
                case 1:
                    this.createStage1();
                    break;
                case 2:
                    this.createStage2();
                    break;
                case 3:
                    this.createStage3();
                    break;
                case 4:
                    this.createStage4();
                    break;
                case 5:
                    this.createStage5();
                    break;
                default:
                    console.warn(`未知のステージ番号: ${this.stageNumber}, ステージ1を使用`);
                    this.createStage1();
            }
            
            console.log(`ステージ ${this.stageNumber} データ読み込み完了`);
            console.log('作成されたオブジェクト数:', {
                platforms: this.platforms.length,
                items: this.items.length,
                obstacles: this.obstacles.length,
                walls: this.walls.length,
                goal: this.goal ? 'あり' : 'なし'
            });
        } catch (error) {
            console.error('ステージデータ作成エラー:', error);
            throw error;
        }
    }

    /**
     * ステージ1: チュートリアル
     */
    createStage1() {
        // 簡単なプラットフォーム（Canvas高さ400に合わせて調整）
        this.platforms = [
            { x: 300, y: 280, width: 100, height: 20 },
            { x: 500, y: 230, width: 100, height: 20 },
            { x: 700, y: 180, width: 100, height: 20 },
            { x: 1000, y: 280, width: 150, height: 20 },
            { x: 1300, y: 230, width: 100, height: 20 }
        ];

        // アイテム配置
        this.items = [
            { x: 200, y: 320, width: 20, height: 20, type: 'coin', active: true },
            { x: 350, y: 240, width: 20, height: 20, type: 'star', active: true },
            { x: 550, y: 190, width: 20, height: 20, type: 'coin', active: true },
            { x: 750, y: 140, width: 20, height: 20, type: 'star', active: true },
            { x: 1050, y: 240, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1350, y: 190, width: 20, height: 20, type: 'star', active: true }
        ];

        // 簡単な障害物（全て三角形のスパイクに統一）
        this.obstacles = [
            { x: 600, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 900, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' }
        ];

        // 壁（乗れる壁を追加）
        this.walls = [
            { x: 450, y: 300, width: 20, height: 150 }, // 最初の壁
            { x: 850, y: 250, width: 20, height: 200 }, // 2番目の壁
            { x: 1500, y: 280, width: 20, height: 170 } // 3番目の壁
        ];

        // ゴール
        this.goal = { x: 2200, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ2: 基本アクション
     */
    createStage2() {
        // より複雑なプラットフォーム
        this.platforms = [
            { x: 200, y: 450, width: 80, height: 20 },
            { x: 350, y: 400, width: 60, height: 20 },
            { x: 480, y: 350, width: 80, height: 20 },
            { x: 650, y: 300, width: 100, height: 20 },
            { x: 850, y: 380, width: 80, height: 20 },
            { x: 1000, y: 320, width: 120, height: 20 },
            { x: 1200, y: 400, width: 80, height: 20 },
            { x: 1400, y: 350, width: 100, height: 20 },
            { x: 1650, y: 300, width: 80, height: 20 },
            { x: 1850, y: 380, width: 100, height: 20 }
        ];

        // アイテム
        this.items = [
            { x: 230, y: 410, width: 20, height: 20, type: 'coin', active: true },
            { x: 380, y: 360, width: 20, height: 20, type: 'star', active: true },
            { x: 510, y: 310, width: 20, height: 20, type: 'coin', active: true },
            { x: 680, y: 260, width: 20, height: 20, type: 'fruit', active: true },
            { x: 880, y: 340, width: 20, height: 20, type: 'star', active: true },
            { x: 1030, y: 280, width: 20, height: 20, type: 'coin', active: true },
            { x: 1230, y: 360, width: 20, height: 20, type: 'star', active: true },
            { x: 1430, y: 310, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1680, y: 260, width: 20, height: 20, type: 'coin', active: true },
            { x: 1880, y: 340, width: 20, height: 20, type: 'star', active: true }
        ];

        // 障害物（全て三角形のスパイクに統一）
        this.obstacles = [
            { x: 300, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 600, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 800, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1150, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1550, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' }
        ];

        // 壁
        this.walls = [
            { x: 750, y: 400, width: 20, height: 150 },
            { x: 1300, y: 450, width: 20, height: 100 }
        ];

        this.goal = { x: 2200, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ3: ジャンプチャレンジ
     */
    createStage3() {
        // 高いプラットフォーム
        this.platforms = [
            { x: 150, y: 500, width: 60, height: 20 },
            { x: 280, y: 420, width: 60, height: 20 },
            { x: 410, y: 340, width: 60, height: 20 },
            { x: 540, y: 260, width: 80, height: 20 },
            { x: 700, y: 200, width: 100, height: 20 },
            { x: 900, y: 280, width: 80, height: 20 },
            { x: 1050, y: 360, width: 60, height: 20 },
            { x: 1200, y: 280, width: 80, height: 20 },
            { x: 1350, y: 200, width: 100, height: 20 },
            { x: 1550, y: 320, width: 80, height: 20 },
            { x: 1700, y: 240, width: 80, height: 20 },
            { x: 1900, y: 380, width: 100, height: 20 }
        ];

        this.items = [
            { x: 180, y: 460, width: 20, height: 20, type: 'coin', active: true },
            { x: 310, y: 380, width: 20, height: 20, type: 'star', active: true },
            { x: 440, y: 300, width: 20, height: 20, type: 'coin', active: true },
            { x: 570, y: 220, width: 20, height: 20, type: 'fruit', active: true },
            { x: 730, y: 160, width: 20, height: 20, type: 'star', active: true },
            { x: 930, y: 240, width: 20, height: 20, type: 'coin', active: true },
            { x: 1080, y: 320, width: 20, height: 20, type: 'star', active: true },
            { x: 1230, y: 240, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1380, y: 160, width: 20, height: 20, type: 'star', active: true },
            { x: 1580, y: 280, width: 20, height: 20, type: 'coin', active: true },
            { x: 1730, y: 200, width: 20, height: 20, type: 'star', active: true },
            { x: 1930, y: 340, width: 20, height: 20, type: 'fruit', active: true }
        ];

        this.obstacles = [
            { x: 250, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 380, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 650, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 850, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1100, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1450, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1800, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        this.goal = { x: 2200, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ4: 複雑な構造
     */
    createStage4() {
        // 複雑なレイアウト
        this.platforms = [
            { x: 100, y: 480, width: 80, height: 20 },
            { x: 250, y: 420, width: 60, height: 20 },
            { x: 380, y: 360, width: 80, height: 20 },
            { x: 530, y: 300, width: 100, height: 20 },
            { x: 700, y: 240, width: 80, height: 20 },
            { x: 850, y: 320, width: 60, height: 20 },
            { x: 980, y: 260, width: 80, height: 20 },
            { x: 1130, y: 200, width: 100, height: 20 },
            { x: 1300, y: 280, width: 80, height: 20 },
            { x: 1450, y: 220, width: 60, height: 20 },
            { x: 1580, y: 360, width: 100, height: 20 },
            { x: 1750, y: 300, width: 80, height: 20 },
            { x: 1900, y: 240, width: 80, height: 20 },
            { x: 2050, y: 380, width: 100, height: 20 }
        ];

        this.items = [
            { x: 130, y: 440, width: 20, height: 20, type: 'coin', active: true },
            { x: 280, y: 380, width: 20, height: 20, type: 'star', active: true },
            { x: 410, y: 320, width: 20, height: 20, type: 'coin', active: true },
            { x: 560, y: 260, width: 20, height: 20, type: 'fruit', active: true },
            { x: 730, y: 200, width: 20, height: 20, type: 'star', active: true },
            { x: 880, y: 280, width: 20, height: 20, type: 'coin', active: true },
            { x: 1010, y: 220, width: 20, height: 20, type: 'star', active: true },
            { x: 1160, y: 160, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1330, y: 240, width: 20, height: 20, type: 'coin', active: true },
            { x: 1480, y: 180, width: 20, height: 20, type: 'star', active: true },
            { x: 1610, y: 320, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1780, y: 260, width: 20, height: 20, type: 'coin', active: true },
            { x: 1930, y: 200, width: 20, height: 20, type: 'star', active: true },
            { x: 2080, y: 340, width: 20, height: 20, type: 'fruit', active: true }
        ];

        this.obstacles = [
            { x: 200, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 350, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 500, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 650, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 800, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 950, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1100, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1250, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1400, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1650, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1850, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        this.walls = [
            { x: 320, y: 360, width: 20, height: 190 },
            { x: 640, y: 240, width: 20, height: 310 },
            { x: 920, y: 260, width: 20, height: 290 },
            { x: 1270, y: 280, width: 20, height: 270 },
            { x: 1520, y: 220, width: 20, height: 330 },
            { x: 1820, y: 300, width: 20, height: 250 }
        ];

        this.goal = { x: 2200, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ5: 最終ステージ
     */
    createStage5() {
        // 最も複雑で長いステージ
        this.width = 3000; // より長いステージ
        
        this.platforms = [
            { x: 80, y: 500, width: 60, height: 20 },
            { x: 200, y: 450, width: 50, height: 20 },
            { x: 320, y: 400, width: 60, height: 20 },
            { x: 450, y: 350, width: 80, height: 20 },
            { x: 600, y: 300, width: 70, height: 20 },
            { x: 750, y: 250, width: 90, height: 20 },
            { x: 900, y: 200, width: 80, height: 20 },
            { x: 1050, y: 280, width: 60, height: 20 },
            { x: 1180, y: 220, width: 80, height: 20 },
            { x: 1330, y: 160, width: 100, height: 20 },
            { x: 1500, y: 240, width: 70, height: 20 },
            { x: 1650, y: 180, width: 80, height: 20 },
            { x: 1800, y: 320, width: 90, height: 20 },
            { x: 1970, y: 260, width: 80, height: 20 },
            { x: 2120, y: 200, width: 100, height: 20 },
            { x: 2300, y: 280, width: 80, height: 20 },
            { x: 2450, y: 220, width: 90, height: 20 },
            { x: 2620, y: 360, width: 100, height: 20 }
        ];

        // 多数のアイテム
        this.items = [];
        for (let i = 0; i < this.platforms.length; i++) {
            const platform = this.platforms[i];
            this.items.push({
                x: platform.x + platform.width/2 - 10,
                y: platform.y - 30,
                width: 20,
                height: 20,
                type: i % 3 === 0 ? 'fruit' : (i % 2 === 0 ? 'star' : 'coin'),
                active: true
            });
        }

        // 多数の障害物（全て三角形のスパイクに統一）
        this.obstacles = [
            { x: 150, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 280, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 400, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 550, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 700, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 850, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1000, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1150, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1300, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1450, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1600, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1750, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1920, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2070, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2250, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 2400, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2570, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        this.walls = [
            { x: 250, y: 450, width: 20, height: 100 },
            { x: 520, y: 350, width: 20, height: 200 },
            { x: 820, y: 250, width: 20, height: 300 },
            { x: 1120, y: 220, width: 20, height: 330 },
            { x: 1400, y: 160, width: 20, height: 390 },
            { x: 1720, y: 180, width: 20, height: 370 },
            { x: 2020, y: 200, width: 20, height: 350 },
            { x: 2370, y: 220, width: 20, height: 330 },
            { x: 2540, y: 360, width: 20, height: 190 }
        ];

        this.goal = { x: 2800, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * 更新処理
     */
    update(deltaTime) {
        // アニメーション更新（実装予定）
        // 動く障害物の更新（実装予定）
    }

    /**
     * 描画処理
     */
    render(ctx) {
        try {
            // 背景描画
            this.renderBackground(ctx);
            
            // プラットフォーム描画
            this.renderPlatforms(ctx);
            
            // 壁描画
            this.renderWalls(ctx);
            
            // アイテム描画
            this.renderItems(ctx);
            
            // 障害物描画
            this.renderObstacles(ctx);
            
            // ゴール描画
            this.renderGoal(ctx);
            
            // 地面描画
            this.renderGround(ctx);
            
        } catch (error) {
            console.error('ステージ描画エラー:', error);
            // 最低限の背景だけ描画
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    /**
     * 背景描画
     */
    renderBackground(ctx) {
        // Canvas情報を取得
        const canvas = ctx.canvas;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // カメラ位置を考慮した描画範囲を計算
        const game = window.simpleGame || window.game;
        const cameraX = game ? game.camera.x : 0;
        const cameraY = game ? game.camera.y : 0;
        
        // 描画範囲を拡張（カメラ移動を考慮）
        const drawStartX = cameraX - 100;
        const drawEndX = cameraX + canvasWidth + 100;
        const drawStartY = cameraY - 100;
        const drawEndY = cameraY + canvasHeight + 100;
        
        // 空の背景（上部）
        const skyGradient = ctx.createLinearGradient(0, drawStartY, 0, this.groundLevel);
        skyGradient.addColorStop(0, '#87CEEB');  // 薄い空色
        skyGradient.addColorStop(1, '#98E4FF');  // 少し濃い空色
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(drawStartX, drawStartY, drawEndX - drawStartX, this.groundLevel - drawStartY);
        
        // 地面の背景（下部）
        const groundGradient = ctx.createLinearGradient(0, this.groundLevel, 0, drawEndY);
        groundGradient.addColorStop(0, '#228B22');  // 緑
        groundGradient.addColorStop(1, '#006400');  // 濃い緑
        
        ctx.fillStyle = groundGradient;
        ctx.fillRect(drawStartX, this.groundLevel, drawEndX - drawStartX, drawEndY - this.groundLevel);
        
        // 雲の描画（カメラ位置を考慮）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 15; i++) {
            const x = (i * 300) % (this.width + 600) - 300; // 範囲を拡張
            const y = 50 + (i % 3) * 30;
            
            // カメラ範囲内の雲のみ描画
            if (x > drawStartX - 100 && x < drawEndX + 100) {
                this.drawCloud(ctx, x, y);
            }
        }
    }

    /**
     * 雲描画
     */
    drawCloud(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
        ctx.arc(x + 25, y - 15, 15, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * プラットフォーム描画
     */
    renderPlatforms(ctx) {
        ctx.fillStyle = '#8B4513';
        this.platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // 上面のハイライト
            ctx.fillStyle = '#A0522D';
            ctx.fillRect(platform.x, platform.y, platform.width, 5);
            ctx.fillStyle = '#8B4513';
        });
    }

    /**
     * 壁描画
     */
    renderWalls(ctx) {
        ctx.fillStyle = '#696969';
        this.walls.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        });
    }

    /**
     * アイテム描画
     */
    renderItems(ctx) {
        this.items.forEach(item => {
            if (!item.active) return;
            
            switch (item.type) {
                case 'coin':
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(item.x + item.width/2, item.y + item.height/2, item.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'star':
                    ctx.fillStyle = '#FF69B4';
                    this.drawStar(ctx, item.x + item.width/2, item.y + item.height/2, item.width/2);
                    break;
                case 'fruit':
                    ctx.fillStyle = '#FF6347';
                    ctx.beginPath();
                    ctx.arc(item.x + item.width/2, item.y + item.height/2, item.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    // 葉っぱ
                    ctx.fillStyle = '#32CD32';
                    ctx.fillRect(item.x + item.width/2 - 2, item.y, 4, 6);
                    break;
            }
        });
    }

    /**
     * 星描画
     */
    drawStar(ctx, x, y, radius) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const x1 = x + Math.cos(angle) * radius;
            const y1 = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x1, y1);
            } else {
                ctx.lineTo(x1, y1);
            }
            
            const angle2 = ((i + 0.5) * 4 * Math.PI) / 5 - Math.PI / 2;
            const x2 = x + Math.cos(angle2) * (radius * 0.5);
            const y2 = y + Math.sin(angle2) * (radius * 0.5);
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();
    }

    /**
     * 障害物描画
     */
    renderObstacles(ctx) {
        this.obstacles.forEach(obstacle => {
            // 全て三角形のスパイクとして描画
            ctx.fillStyle = '#DC143C'; // 赤色
            ctx.strokeStyle = '#8B0000'; // 濃い赤色の縁取り
            ctx.lineWidth = 2;
            
            // 三角形のスパイク
            ctx.beginPath();
            ctx.moveTo(obstacle.x, obstacle.y + obstacle.height); // 左下
            ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y); // 上の頂点
            ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height); // 右下
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
    }

    /**
     * ゴール描画
     */
    renderGoal(ctx) {
        if (!this.goal) return;
        
        // 旗竿
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.goal.x, this.goal.y, 5, this.goal.height);
        
        // 旗
        ctx.fillStyle = '#FF1493';
        ctx.fillRect(this.goal.x + 5, this.goal.y, 30, 20);
        
        // 旗の模様
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.goal.x + 10, this.goal.y + 5, 20, 10);
    }

    /**
     * 地面描画
     */
    renderGround(ctx) {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(0, this.groundLevel, this.width, this.height - this.groundLevel);
        
        // 草のテクスチャ（簡易）
        ctx.fillStyle = '#32CD32';
        for (let x = 0; x < this.width; x += 20) {
            ctx.fillRect(x, this.groundLevel, 2, 10);
            ctx.fillRect(x + 5, this.groundLevel, 2, 8);
            ctx.fillRect(x + 10, this.groundLevel, 2, 12);
            ctx.fillRect(x + 15, this.groundLevel, 2, 9);
        }
    }
}

// Stageクラスをグローバルスコープに明示的に登録
window.Stage = Stage;

// ファイル読み込み確認
console.log('stage.js読み込み完了 - Stageクラス定義済み:', typeof Stage, typeof window.Stage);
