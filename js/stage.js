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
     * ステージ1: チュートリアル（3歳〜8歳向けに調整）
     */
    createStage1() {
        // チュートリアル用の低い足場（this.groundLevel - 値で地面からの高さを指定）
        // ジャンプ力450、最高到達点約84ピクセルを考慮して、50ピクセル以下に設定
        this.platforms = [
            { x: 300, y: this.groundLevel - 50, width: 120, height: 20 },  // 地面から50ピクセル上
            { x: 500, y: this.groundLevel - 40, width: 120, height: 20 },  // 地面から40ピクセル上
            { x: 750, y: this.groundLevel - 60, width: 120, height: 20 },  // 地面から60ピクセル上
            { x: 1000, y: this.groundLevel - 45, width: 150, height: 20 }, // 地面から45ピクセル上（幅広で安全）
            { x: 1300, y: this.groundLevel - 55, width: 120, height: 20 }  // 地面から55ピクセル上
        ];

        // アイテムを地面の上と足場の上に正確に配置
        this.items = [
            // 地面の上のアイテム（地面から20ピクセル上）
            { x: 150, y: this.groundLevel - 20, width: 20, height: 20, type: 'coin', active: true },
            { x: 250, y: this.groundLevel - 20, width: 20, height: 20, type: 'coin', active: true },
            { x: 450, y: this.groundLevel - 20, width: 20, height: 20, type: 'coin', active: true },
            { x: 650, y: this.groundLevel - 20, width: 20, height: 20, type: 'coin', active: true },
            { x: 850, y: this.groundLevel - 20, width: 20, height: 20, type: 'coin', active: true },
            { x: 1150, y: this.groundLevel - 20, width: 20, height: 20, type: 'coin', active: true },
            
            // 足場の上のアイテム（足場から20ピクセル上）
            { x: 350, y: this.groundLevel - 70, width: 20, height: 20, type: 'star', active: true },   // 50+20=70
            { x: 550, y: this.groundLevel - 60, width: 20, height: 20, type: 'star', active: true },   // 40+20=60
            { x: 800, y: this.groundLevel - 80, width: 20, height: 20, type: 'fruit', active: true },  // 60+20=80
            { x: 1050, y: this.groundLevel - 65, width: 20, height: 20, type: 'star', active: true },  // 45+20=65
            { x: 1350, y: this.groundLevel - 75, width: 20, height: 20, type: 'fruit', active: true } // 55+20=75
        ];

        // 障害物は最小限（地面から30ピクセル上）
        this.obstacles = [
            { x: 700, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        // 壁は無し（ステージ1はシンプルに）
        this.walls = [];

        // ゴール（地面から60ピクセル上）
        this.goal = { x: 1450, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
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
        
        // 足場と壁の重なりを完全に回避して配置
        this.platforms = [
            { x: 80, y: 500, width: 60, height: 20 },    // 範囲: x: 80-140
            { x: 200, y: 450, width: 50, height: 20 },   // 範囲: x: 200-250
            { x: 320, y: 400, width: 60, height: 20 },   // 範囲: x: 320-380
            { x: 450, y: 350, width: 70, height: 20 },   // 範囲: x: 450-520 (幅を80→70に縮小)
            { x: 600, y: 300, width: 70, height: 20 },   // 範囲: x: 600-670
            { x: 750, y: 250, width: 80, height: 20 },   // 範囲: x: 750-830 (幅を90→80に縮小)
            { x: 900, y: 200, width: 80, height: 20 },   // 範囲: x: 900-980
            { x: 1050, y: 280, width: 60, height: 20 },  // 範囲: x: 1050-1110
            { x: 1200, y: 240, width: 80, height: 20 },  // 範囲: x: 1200-1280
            { x: 1320, y: 180, width: 90, height: 20 },  // 範囲: x: 1320-1410 (x: 1350→1320に移動)
            { x: 1500, y: 260, width: 70, height: 20 },  // 範囲: x: 1500-1570
            { x: 1620, y: 200, width: 80, height: 20 },  // 範囲: x: 1620-1700 (x: 1650→1620に移動)
            { x: 1800, y: 340, width: 90, height: 20 },  // 範囲: x: 1800-1890
            { x: 1970, y: 280, width: 80, height: 20 },  // 範囲: x: 1970-2050
            { x: 2120, y: 220, width: 100, height: 20 }, // 範囲: x: 2120-2220
            { x: 2300, y: 300, width: 80, height: 20 },  // 範囲: x: 2300-2380
            { x: 2420, y: 240, width: 80, height: 20 },  // 範囲: x: 2420-2500 (x: 2450→2420, 幅90→80)
            { x: 2650, y: 380, width: 100, height: 20 }  // 範囲: x: 2650-2750 (x: 2620→2650に移動)
        ];

        // 多数のアイテム（足場の上に配置）
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

        // 多数の障害物（全て三角形のスパイクに統一、壁との重なりを回避）
        this.obstacles = [
            { x: 150, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 300, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }, // x: 280→300に移動
            { x: 400, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 580, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }, // x: 550→580に移動
            { x: 700, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 800, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' }, // x: 880→800に移動
            { x: 1000, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1150, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1300, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1480, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }, // x: 1450→1480に移動
            { x: 1600, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1800, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' }, // x: 1750→1800に移動
            { x: 1920, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2100, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }, // x: 2070→2100に移動
            { x: 2250, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 2430, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }, // x: 2400→2430に移動
            { x: 2570, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        // 壁の配置（足場との重なりを完全に回避）
        this.walls = [
            { x: 270, y: 450, width: 20, height: 100 },  // 範囲: x: 270-290
            { x: 540, y: 350, width: 20, height: 200 },  // 範囲: x: 540-560
            { x: 850, y: 250, width: 20, height: 300 },  // 範囲: x: 850-870
            { x: 1120, y: 220, width: 20, height: 330 }, // 範囲: x: 1120-1140
            { x: 1450, y: 160, width: 20, height: 390 }, // 範囲: x: 1450-1470
            { x: 1750, y: 180, width: 20, height: 370 }, // 範囲: x: 1750-1770
            { x: 2070, y: 200, width: 20, height: 350 }, // 範囲: x: 2070-2090 (x: 2020→2070に移動)
            { x: 2400, y: 220, width: 20, height: 330 }, // 範囲: x: 2400-2420 (x: 2370→2400に移動)
            { x: 2520, y: 360, width: 20, height: 190 }  // 範囲: x: 2520-2540
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
