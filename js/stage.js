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
            // 20ステージまで対応
            if (this.stageNumber >= 1 && this.stageNumber <= 20) {
                const methodName = `createStage${this.stageNumber}`;
                if (typeof this[methodName] === 'function') {
                    this[methodName]();
                } else {
                    console.warn(`ステージ ${this.stageNumber} のメソッドが見つかりません。基本ステージを生成します。`);
                    this.createBasicStage(this.stageNumber);
                }
            } else {
                console.warn(`サポートされていないステージ番号: ${this.stageNumber}, ステージ1を使用`);
                this.createStage1();
            }

            console.log(`ステージ ${this.stageNumber} データ読み込み完了`);
            console.log('作成されたオブジェクト数:', {
                platforms: this.platforms.length,
                items: this.items.length,
                obstacles: this.obstacles.length,
                walls: this.walls.length,
                goal: this.goal ? 'あり' : 'なし',
                width: this.width
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
                x: platform.x + platform.width / 2 - 10,
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
     * 基本ステージジェネレーター（ステージが定義されていない場合のフォールバック）
     */
    createBasicStage(stageNumber) {
        // 段階的な難易度設定
        const difficulty = Math.min(5, Math.floor((stageNumber - 1) / 4) + 1); // 1-5の難易度

        // ステージ幅を段階的に拡大
        this.width = 2400 + (difficulty - 1) * 600; // 2400, 3000, 3600, 4200, 4800

        // 難易度に応じたパラメータ
        const platformCount = 8 + difficulty * 2; // 10-18個
        const obstacleCount = 3 + difficulty * 2; // 5-13個
        const wallCount = Math.floor(difficulty * 1.5); // 1-7個
        const itemCount = platformCount + 3; // プラットフォーム数 + α

        // プラットフォーム生成
        this.platforms = [];
        const platformSpacing = this.width / (platformCount + 1);

        for (let i = 0; i < platformCount; i++) {
            const x = platformSpacing * (i + 1) + (Math.random() - 0.5) * 100;
            const y = this.groundLevel - 50 - (difficulty * 30) - Math.random() * 100;
            const width = 80 - difficulty * 8 + Math.random() * 40; // 小さくなる

            this.platforms.push({
                x: Math.max(50, Math.min(this.width - width - 50, x)),
                y: Math.max(150, y),
                width: Math.max(40, width),
                height: 20
            });
        }

        // アイテム生成（プラットフォーム上＋地面）
        this.items = [];
        this.platforms.forEach((platform, i) => {
            this.items.push({
                x: platform.x + platform.width / 2 - 10,
                y: platform.y - 25,
                width: 20,
                height: 20,
                type: ['coin', 'star', 'fruit'][i % 3],
                active: true
            });
        });

        // 地面のアイテムも追加
        for (let i = 0; i < 3; i++) {
            this.items.push({
                x: 200 + i * 300 + Math.random() * 200,
                y: this.groundLevel - 25,
                width: 20,
                height: 20,
                type: 'coin',
                active: true
            });
        }

        // 障害物生成
        this.obstacles = [];
        for (let i = 0; i < obstacleCount; i++) {
            const x = (this.width / obstacleCount) * i + Math.random() * 150;
            this.obstacles.push({
                x: Math.max(50, Math.min(this.width - 80, x)),
                y: this.groundLevel - 30 - Math.random() * 10,
                width: 30 + Math.random() * 20,
                height: 30 + Math.random() * 20,
                type: 'spike'
            });
        }

        // 壁生成
        this.walls = [];
        for (let i = 0; i < wallCount; i++) {
            const x = (this.width / (wallCount + 1)) * (i + 1) + Math.random() * 100;
            this.walls.push({
                x: Math.max(50, Math.min(this.width - 50, x)),
                y: this.groundLevel - 100 - difficulty * 50,
                width: 20,
                height: 100 + difficulty * 50
            });
        }

        // ゴール
        this.goal = {
            x: this.width - 100,
            y: this.groundLevel - 60,
            width: 40,
            height: 60,
            type: 'flag'
        };
    }

    /**
 * ステージ6: 基本応用1 - 高低差のあるプラットフォーム
 */
    createStage6() {
        this.width = 2600;

        // 地面から最大100ピクセル以内の高さに配置（二段ジャンプで到達可能）
        this.platforms = [
            { x: 150, y: this.groundLevel - 60, width: 80, height: 20 },
            { x: 300, y: this.groundLevel - 80, width: 70, height: 20 },
            { x: 500, y: this.groundLevel - 100, width: 60, height: 20 },
            { x: 700, y: this.groundLevel - 90, width: 80, height: 20 },
            { x: 900, y: this.groundLevel - 70, width: 70, height: 20 },
            { x: 1100, y: this.groundLevel - 110, width: 90, height: 20 },
            { x: 1320, y: this.groundLevel - 85, width: 75, height: 20 },
            { x: 1520, y: this.groundLevel - 95, width: 65, height: 20 },
            { x: 1720, y: this.groundLevel - 75, width: 85, height: 20 },
            { x: 1920, y: this.groundLevel - 105, width: 80, height: 20 },
            { x: 2150, y: this.groundLevel - 65, width: 90, height: 20 },
            { x: 2350, y: this.groundLevel - 90, width: 100, height: 20 }
        ];

        this.items = [];
        // プラットフォーム上のアイテム
        this.platforms.forEach((platform, i) => {
            this.items.push({
                x: platform.x + platform.width / 2 - 10,
                y: platform.y - 25,
                width: 20,
                height: 20,
                type: ['coin', 'star', 'fruit'][i % 3],
                active: true
            });
        });

        // 地面のアイテム
        for (let i = 0; i < 6; i++) {
            this.items.push({
                x: 200 + i * 350,
                y: this.groundLevel - 25,
                width: 20,
                height: 20,
                type: 'coin',
                active: true
            });
        }

        this.obstacles = [
            { x: 250, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 450, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 650, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 850, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1050, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1250, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1450, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1650, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1850, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2050, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' }
        ];

        // 飛び越え可能な低い壁（最大60ピクセル）
        this.walls = [
            { x: 400, y: this.groundLevel - 50, width: 20, height: 50 },
            { x: 800, y: this.groundLevel - 60, width: 20, height: 60 },
            { x: 1200, y: this.groundLevel - 55, width: 20, height: 55 },
            { x: 1600, y: this.groundLevel - 50, width: 20, height: 50 },
            { x: 2000, y: this.groundLevel - 60, width: 20, height: 60 }
        ];

        this.goal = { x: 2450, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
 * ステージ7: 基本応用2 - ジャンプ精度テスト
 */
    createStage7() {
        this.width = 2800;

        // 小さなプラットフォームでジャンプ精度を試す（二段ジャンプで到達可能な範囲）
        this.platforms = [
            { x: 150, y: this.groundLevel - 70, width: 50, height: 20 },
            { x: 280, y: this.groundLevel - 90, width: 45, height: 20 },
            { x: 420, y: this.groundLevel - 110, width: 40, height: 20 },
            { x: 540, y: this.groundLevel - 85, width: 50, height: 20 },
            { x: 680, y: this.groundLevel - 115, width: 45, height: 20 },
            { x: 820, y: this.groundLevel - 95, width: 55, height: 20 },
            { x: 960, y: this.groundLevel - 75, width: 50, height: 20 },
            { x: 1100, y: this.groundLevel - 120, width: 45, height: 20 },
            { x: 1240, y: this.groundLevel - 100, width: 55, height: 20 },
            { x: 1390, y: this.groundLevel - 80, width: 50, height: 20 },
            { x: 1530, y: this.groundLevel - 125, width: 45, height: 20 },
            { x: 1680, y: this.groundLevel - 105, width: 60, height: 20 },
            { x: 1830, y: this.groundLevel - 85, width: 55, height: 20 },
            { x: 1980, y: this.groundLevel - 115, width: 50, height: 20 },
            { x: 2130, y: this.groundLevel - 95, width: 65, height: 20 },
            { x: 2300, y: this.groundLevel - 75, width: 70, height: 20 },
            { x: 2480, y: this.groundLevel - 110, width: 80, height: 20 }
        ];

        this.items = [];
        this.platforms.forEach((platform, i) => {
            this.items.push({
                x: platform.x + platform.width / 2 - 10,
                y: platform.y - 25,
                width: 20,
                height: 20,
                type: ['coin', 'star', 'fruit'][i % 3],
                active: true
            });
        });

        this.obstacles = [
            { x: 200, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 350, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 500, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 650, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 800, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 950, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1100, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1250, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1400, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1550, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1700, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1850, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2000, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 2150, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 2300, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        // 低い壁（飛び越え可能）
        this.walls = [
            { x: 320, y: this.groundLevel - 45, width: 20, height: 45 },
            { x: 590, y: this.groundLevel - 50, width: 20, height: 50 },
            { x: 880, y: this.groundLevel - 55, width: 20, height: 55 },
            { x: 1170, y: this.groundLevel - 45, width: 20, height: 45 },
            { x: 1460, y: this.groundLevel - 60, width: 20, height: 60 },
            { x: 1750, y: this.groundLevel - 50, width: 20, height: 50 },
            { x: 2050, y: this.groundLevel - 55, width: 20, height: 55 }
        ];

        this.goal = { x: 2650, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
 * ステージ8: 基本応用3 - 複合パターン
 */
    createStage8() {
        this.width = 3000;

        // 複合的な配置だが到達可能な範囲内
        this.platforms = [
            { x: 120, y: this.groundLevel - 65, width: 60, height: 20 },
            { x: 250, y: this.groundLevel - 85, width: 55, height: 20 },
            { x: 380, y: this.groundLevel - 105, width: 50, height: 20 },
            { x: 520, y: this.groundLevel - 125, width: 60, height: 20 },
            { x: 680, y: this.groundLevel - 95, width: 70, height: 20 },
            { x: 840, y: this.groundLevel - 75, width: 55, height: 20 },
            { x: 1000, y: this.groundLevel - 115, width: 65, height: 20 },
            { x: 1170, y: this.groundLevel - 85, width: 60, height: 20 },
            { x: 1320, y: this.groundLevel - 110, width: 50, height: 20 },
            { x: 1480, y: this.groundLevel - 90, width: 75, height: 20 },
            { x: 1650, y: this.groundLevel - 70, width: 65, height: 20 },
            { x: 1820, y: this.groundLevel - 130, width: 55, height: 20 },
            { x: 1980, y: this.groundLevel - 100, width: 70, height: 20 },
            { x: 2150, y: this.groundLevel - 80, width: 60, height: 20 },
            { x: 2320, y: this.groundLevel - 120, width: 75, height: 20 },
            { x: 2500, y: this.groundLevel - 95, width: 80, height: 20 },
            { x: 2680, y: this.groundLevel - 75, width: 90, height: 20 }
        ];

        this.items = [];
        this.platforms.forEach((platform, i) => {
            this.items.push({
                x: platform.x + platform.width / 2 - 10,
                y: platform.y - 25,
                width: 20,
                height: 20,
                type: ['coin', 'star', 'fruit'][i % 3],
                active: true
            });
        });

        // 地面にも散らばったアイテム
        for (let i = 0; i < 7; i++) {
            this.items.push({
                x: 200 + i * 380,
                y: this.groundLevel - 25,
                width: 20,
                height: 20,
                type: 'coin',
                active: true
            });
        }

        this.obstacles = [
            { x: 180, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 320, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 460, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 620, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 780, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 940, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1100, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1260, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1420, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 1580, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1740, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1900, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2060, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 2220, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 2380, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 2540, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        // 適度な高さの壁（飛び越え可能）
        this.walls = [
            { x: 300, y: this.groundLevel - 65, width: 20, height: 65 },
            { x: 600, y: this.groundLevel - 70, width: 20, height: 70 },
            { x: 920, y: this.groundLevel - 60, width: 20, height: 60 },
            { x: 1240, y: this.groundLevel - 75, width: 20, height: 75 },
            { x: 1560, y: this.groundLevel - 65, width: 20, height: 65 },
            { x: 1880, y: this.groundLevel - 70, width: 20, height: 70 },
            { x: 2200, y: this.groundLevel - 60, width: 20, height: 60 },
            { x: 2520, y: this.groundLevel - 75, width: 20, height: 75 }
        ];

        this.goal = { x: 2850, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ9: 中級チャレンジ1 - 高いプラットフォーム
     */
    createStage9() {
        this.width = 3200;

        // 二段ジャンプが必要だが到達可能（最大130ピクセル）
        this.platforms = [
            { x: 150, y: this.groundLevel - 90, width: 55, height: 20 },
            { x: 300, y: this.groundLevel - 110, width: 50, height: 20 },
            { x: 450, y: this.groundLevel - 130, width: 45, height: 20 },
            { x: 620, y: this.groundLevel - 100, width: 60, height: 20 },
            { x: 790, y: this.groundLevel - 120, width: 50, height: 20 },
            { x: 960, y: this.groundLevel - 85, width: 65, height: 20 },
            { x: 1130, y: this.groundLevel - 115, width: 55, height: 20 },
            { x: 1300, y: this.groundLevel - 95, width: 60, height: 20 },
            { x: 1480, y: this.groundLevel - 125, width: 50, height: 20 },
            { x: 1650, y: this.groundLevel - 105, width: 65, height: 20 },
            { x: 1830, y: this.groundLevel - 90, width: 55, height: 20 },
            { x: 2000, y: this.groundLevel - 130, width: 60, height: 20 },
            { x: 2180, y: this.groundLevel - 110, width: 55, height: 20 },
            { x: 2350, y: this.groundLevel - 80, width: 70, height: 20 },
            { x: 2530, y: this.groundLevel - 120, width: 60, height: 20 },
            { x: 2710, y: this.groundLevel - 100, width: 75, height: 20 },
            { x: 2900, y: this.groundLevel - 85, width: 80, height: 20 }
        ];

        this.items = [];
        this.platforms.forEach((platform, i) => {
            this.items.push({
                x: platform.x + platform.width / 2 - 10,
                y: platform.y - 25,
                width: 20,
                height: 20,
                type: ['coin', 'star', 'fruit'][i % 3],
                active: true
            });
        });

        // チャレンジ用の高いアイテム（二段ジャンプで取得）
        this.items.push({ x: 500, y: this.groundLevel - 170, width: 20, height: 20, type: 'fruit', active: true });
        this.items.push({ x: 1050, y: this.groundLevel - 160, width: 20, height: 20, type: 'star', active: true });
        this.items.push({ x: 1600, y: this.groundLevel - 150, width: 20, height: 20, type: 'fruit', active: true });
        this.items.push({ x: 2200, y: this.groundLevel - 165, width: 20, height: 20, type: 'star', active: true });

        this.obstacles = [
            { x: 160, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 280, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 380, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 500, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 620, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 740, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 850, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 970, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1100, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 1220, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1340, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1460, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1590, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 1720, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1830, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1980, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2100, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 2230, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 2360, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 2500, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2630, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 2780, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' }
        ];

        // 適度な壁（二段ジャンプで越えられる）
        this.walls = [
            { x: 250, y: this.groundLevel - 80, width: 20, height: 80 },
            { x: 520, y: this.groundLevel - 85, width: 20, height: 85 },
            { x: 860, y: this.groundLevel - 75, width: 20, height: 75 },
            { x: 1200, y: this.groundLevel - 90, width: 20, height: 90 },
            { x: 1550, y: this.groundLevel - 80, width: 20, height: 80 },
            { x: 1900, y: this.groundLevel - 85, width: 20, height: 85 },
            { x: 2280, y: this.groundLevel - 75, width: 20, height: 75 },
            { x: 2640, y: this.groundLevel - 90, width: 20, height: 90 }
        ];

        this.goal = { x: 3050, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ10: 中級チャレンジ2 - 長距離ジャンプ
     */
    createStage10() {
        this.width = 3400;

        // 長いギャップがあるプラットフォーム（到達可能な高さ）
        this.platforms = [
            { x: 150, y: this.groundLevel - 70, width: 60, height: 20 },
            { x: 350, y: this.groundLevel - 90, width: 55, height: 20 },
            { x: 580, y: this.groundLevel - 110, width: 70, height: 20 },
            { x: 850, y: this.groundLevel - 130, width: 65, height: 20 },
            { x: 1150, y: this.groundLevel - 85, width: 75, height: 20 },
            { x: 1450, y: this.groundLevel - 115, width: 60, height: 20 },
            { x: 1750, y: this.groundLevel - 95, width: 70, height: 20 },
            { x: 2080, y: this.groundLevel - 125, width: 65, height: 20 },
            { x: 2380, y: this.groundLevel - 105, width: 80, height: 20 },
            { x: 2700, y: this.groundLevel - 75, width: 75, height: 20 },
            { x: 3000, y: this.groundLevel - 100, width: 90, height: 20 }
        ];

        this.items = [];
        this.platforms.forEach((platform, i) => {
            this.items.push({
                x: platform.x + platform.width / 2 - 10,
                y: platform.y - 25,
                width: 20,
                height: 20,
                type: ['coin', 'star', 'fruit'][i % 3],
                active: true
            });
        });

        // チャレンジ用の高い位置のアイテム（二段ジャンプで取得可能）
        this.items.push({ x: 470, y: this.groundLevel - 160, width: 20, height: 20, type: 'fruit', active: true });
        this.items.push({ x: 1000, y: this.groundLevel - 170, width: 20, height: 20, type: 'star', active: true });
        this.items.push({ x: 1600, y: this.groundLevel - 150, width: 20, height: 20, type: 'fruit', active: true });
        this.items.push({ x: 2200, y: this.groundLevel - 165, width: 20, height: 20, type: 'star', active: true });
        this.items.push({ x: 2850, y: this.groundLevel - 155, width: 20, height: 20, type: 'fruit', active: true });

        this.obstacles = [
            { x: 200, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 350, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 600, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 800, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1050, y: this.groundLevel - 50, width: 50, height: 50, type: 'spike' },
            { x: 1250, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1500, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 1700, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1950, y: this.groundLevel - 50, width: 50, height: 50, type: 'spike' },
            { x: 2150, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 2400, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 2650, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 2850, y: this.groundLevel - 50, width: 50, height: 50, type: 'spike' }
        ];

        // 長距離ジャンプ用の壁（越えられる高さ）
        this.walls = [
            { x: 280, y: this.groundLevel - 70, width: 20, height: 70 },
            { x: 700, y: this.groundLevel - 85, width: 20, height: 85 },
            { x: 1050, y: this.groundLevel - 80, width: 20, height: 80 },
            { x: 1350, y: this.groundLevel - 90, width: 20, height: 90 },
            { x: 1650, y: this.groundLevel - 75, width: 20, height: 75 },
            { x: 1980, y: this.groundLevel - 85, width: 20, height: 85 },
            { x: 2300, y: this.groundLevel - 80, width: 20, height: 80 },
            { x: 2600, y: this.groundLevel - 90, width: 20, height: 90 }
        ];

        this.goal = { x: 3250, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ11: 中級チャレンジ3 - 複雑な迷路
     */
    createStage11() {
        this.width = 3600;

        // 計画的に配置された迷路状のプラットフォーム
        this.platforms = [
            // セクション1: 入口エリア
            { x: 120, y: this.groundLevel - 60, width: 60, height: 20 },
            { x: 240, y: this.groundLevel - 90, width: 50, height: 20 },
            { x: 350, y: this.groundLevel - 120, width: 45, height: 20 },

            // セクション2: 上段ルート
            { x: 480, y: this.groundLevel - 110, width: 70, height: 20 },
            { x: 620, y: this.groundLevel - 85, width: 55, height: 20 },
            { x: 740, y: this.groundLevel - 115, width: 50, height: 20 },

            // セクション3: 中段ルート
            { x: 450, y: this.groundLevel - 75, width: 60, height: 20 },
            { x: 580, y: this.groundLevel - 50, width: 45, height: 20 },
            { x: 690, y: this.groundLevel - 80, width: 55, height: 20 },

            // セクション4: 迷路中央部
            { x: 850, y: this.groundLevel - 100, width: 50, height: 20 },
            { x: 970, y: this.groundLevel - 130, width: 45, height: 20 },
            { x: 1080, y: this.groundLevel - 95, width: 65, height: 20 },
            { x: 1200, y: this.groundLevel - 70, width: 50, height: 20 },

            // セクション5: 上下分岐
            { x: 1320, y: this.groundLevel - 120, width: 55, height: 20 },
            { x: 1450, y: this.groundLevel - 85, width: 60, height: 20 },
            { x: 1580, y: this.groundLevel - 110, width: 45, height: 20 },

            // セクション6: 下段ルート
            { x: 1350, y: this.groundLevel - 55, width: 70, height: 20 },
            { x: 1490, y: this.groundLevel - 45, width: 50, height: 20 },
            { x: 1610, y: this.groundLevel - 65, width: 55, height: 20 },

            // セクション7: 終盤エリア
            { x: 1750, y: this.groundLevel - 90, width: 60, height: 20 },
            { x: 1880, y: this.groundLevel - 115, width: 50, height: 20 },
            { x: 2010, y: this.groundLevel - 85, width: 65, height: 20 },
            { x: 2150, y: this.groundLevel - 125, width: 45, height: 20 },

            // セクション8: 最終エリア
            { x: 2280, y: this.groundLevel - 100, width: 70, height: 20 },
            { x: 2420, y: this.groundLevel - 75, width: 55, height: 20 },
            { x: 2550, y: this.groundLevel - 110, width: 60, height: 20 },
            { x: 2690, y: this.groundLevel - 85, width: 50, height: 20 },
            { x: 2820, y: this.groundLevel - 120, width: 65, height: 20 },
            { x: 2960, y: this.groundLevel - 95, width: 70, height: 20 },
            { x: 3100, y: this.groundLevel - 70, width: 75, height: 20 },
            { x: 3250, y: this.groundLevel - 100, width: 80, height: 20 }
        ];

        this.items = [];
        this.platforms.forEach((platform, i) => {
            this.items.push({
                x: platform.x + platform.width / 2 - 10,
                y: platform.y - 25,
                width: 20,
                height: 20,
                type: ['coin', 'star', 'fruit'][i % 3],
                active: true
            });
        });

        // 固定配置の障害物（プラットフォームと重複しない位置）
        this.obstacles = [
            { x: 200, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 400, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 650, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 800, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1030, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 1280, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1550, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1700, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1950, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 2200, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 2380, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 2630, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2780, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 3020, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 3180, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' }
        ];

        // 固定配置の壁（プラットフォームとの重複を避けて配置）
        this.walls = [
            // 迷路の分岐を作る壁
            { x: 410, y: this.groundLevel - 90, width: 20, height: 90 },
            { x: 560, y: this.groundLevel - 60, width: 20, height: 60 },
            { x: 800, y: this.groundLevel - 85, width: 20, height: 85 },
            { x: 940, y: this.groundLevel - 75, width: 20, height: 75 },
            { x: 1160, y: this.groundLevel - 80, width: 20, height: 80 },
            { x: 1280, y: this.groundLevel - 65, width: 20, height: 65 },
            { x: 1540, y: this.groundLevel - 90, width: 20, height: 90 },
            { x: 1680, y: this.groundLevel - 70, width: 20, height: 70 },
            { x: 1820, y: this.groundLevel - 85, width: 20, height: 85 },
            { x: 2100, y: this.groundLevel - 75, width: 20, height: 75 },
            { x: 2240, y: this.groundLevel - 80, width: 20, height: 80 },
            { x: 2480, y: this.groundLevel - 85, width: 20, height: 85 },
            { x: 2620, y: this.groundLevel - 70, width: 20, height: 70 },
            { x: 2760, y: this.groundLevel - 90, width: 20, height: 90 },
            { x: 3040, y: this.groundLevel - 75, width: 20, height: 75 },
            { x: 3180, y: this.groundLevel - 80, width: 20, height: 80 }
        ];

        this.goal = { x: 3450, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ12: 中級チャレンジ4 - エレベーターステージ
     */
    createStage12() {
        this.width = 3800;

        // 階段状のプラットフォーム（到達可能な高さ）
        this.platforms = [
            // 上昇階段
            { x: 120, y: this.groundLevel - 50, width: 60, height: 20 },
            { x: 220, y: this.groundLevel - 70, width: 55, height: 20 },
            { x: 320, y: this.groundLevel - 90, width: 50, height: 20 },
            { x: 420, y: this.groundLevel - 110, width: 60, height: 20 },
            { x: 530, y: this.groundLevel - 130, width: 55, height: 20 },
            { x: 640, y: this.groundLevel - 115, width: 65, height: 20 },
            { x: 760, y: this.groundLevel - 100, width: 50, height: 20 },
            { x: 860, y: this.groundLevel - 85, width: 70, height: 20 },

            // 下降部分
            { x: 980, y: this.groundLevel - 100, width: 55, height: 20 },
            { x: 1080, y: this.groundLevel - 85, width: 60, height: 20 },
            { x: 1180, y: this.groundLevel - 70, width: 45, height: 20 },
            { x: 1280, y: this.groundLevel - 55, width: 65, height: 20 },

            // 再び上昇
            { x: 1420, y: this.groundLevel - 70, width: 55, height: 20 },
            { x: 1520, y: this.groundLevel - 90, width: 60, height: 20 },
            { x: 1620, y: this.groundLevel - 110, width: 50, height: 20 },
            { x: 1720, y: this.groundLevel - 125, width: 65, height: 20 },
            { x: 1830, y: this.groundLevel - 105, width: 55, height: 20 },
            { x: 1930, y: this.groundLevel - 85, width: 70, height: 20 },

            // 下降から最終上昇
            { x: 2070, y: this.groundLevel - 100, width: 55, height: 20 },
            { x: 2170, y: this.groundLevel - 80, width: 60, height: 20 },
            { x: 2280, y: this.groundLevel - 95, width: 50, height: 20 },
            { x: 2380, y: this.groundLevel - 115, width: 65, height: 20 },
            { x: 2490, y: this.groundLevel - 130, width: 55, height: 20 },
            { x: 2600, y: this.groundLevel - 110, width: 70, height: 20 },
            { x: 2720, y: this.groundLevel - 90, width: 60, height: 20 },
            { x: 2830, y: this.groundLevel - 75, width: 75, height: 20 },
            { x: 2950, y: this.groundLevel - 60, width: 65, height: 20 },
            { x: 3070, y: this.groundLevel - 80, width: 80, height: 20 },
            { x: 3200, y: this.groundLevel - 65, width: 90, height: 20 }
        ];

        this.items = [];
        this.platforms.forEach((platform, i) => {
            this.items.push({
                x: platform.x + platform.width / 2 - 10,
                y: platform.y - 25,
                width: 20,
                height: 20,
                type: ['coin', 'star', 'fruit'][i % 3],
                active: true
            });
        });

        // 特別なボーナスアイテム（二段ジャンプで取得可能）
        this.items.push({ x: 570, y: this.groundLevel - 170, width: 20, height: 20, type: 'fruit', active: true });
        this.items.push({ x: 1770, y: this.groundLevel - 165, width: 20, height: 20, type: 'star', active: true });
        this.items.push({ x: 2540, y: this.groundLevel - 175, width: 20, height: 20, type: 'fruit', active: true });
        this.items.push({ x: 3140, y: this.groundLevel - 160, width: 20, height: 20, type: 'star', active: true });

        this.obstacles = [
            { x: 150, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 350, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 550, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 750, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1000, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 1200, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 1400, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1600, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1800, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 2000, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 2200, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 2400, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 2600, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 2850, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 3050, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 3250, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        // エレベーター風の壁（適度な高さ）
        this.walls = [
            { x: 270, y: this.groundLevel - 60, width: 20, height: 60 },
            { x: 470, y: this.groundLevel - 70, width: 20, height: 70 },
            { x: 690, y: this.groundLevel - 80, width: 20, height: 80 },
            { x: 910, y: this.groundLevel - 75, width: 20, height: 75 },
            { x: 1130, y: this.groundLevel - 65, width: 20, height: 65 },
            { x: 1370, y: this.groundLevel - 85, width: 20, height: 85 },
            { x: 1570, y: this.groundLevel - 70, width: 20, height: 70 },
            { x: 1770, y: this.groundLevel - 90, width: 20, height: 90 },
            { x: 2020, y: this.groundLevel - 75, width: 20, height: 75 },
            { x: 2230, y: this.groundLevel - 80, width: 20, height: 80 },
            { x: 2440, y: this.groundLevel - 85, width: 20, height: 85 },
            { x: 2670, y: this.groundLevel - 70, width: 20, height: 70 },
            { x: 2880, y: this.groundLevel - 90, width: 20, height: 90 },
            { x: 3120, y: this.groundLevel - 75, width: 20, height: 75 }
        ];

        this.goal = { x: 3650, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ13-20: 上級～エキスパートレベル
     * 段階的に難易度を上げた厳しいステージ群
     */
    createStage13() {
        this.width = 4000;
        this.createAdvancedStage(13, {
            platformCount: 30,
            platformMinWidth: 35,
            platformMaxWidth: 65,
            obstacleCount: 25,
            wallCount: 15,
            maxHeight: 80,
            gapMultiplier: 1.3
        });
    }

    createStage14() {
        this.width = 4200;
        this.createAdvancedStage(14, {
            platformCount: 32,
            platformMinWidth: 30,
            platformMaxWidth: 60,
            obstacleCount: 28,
            wallCount: 16,
            maxHeight: 90,
            gapMultiplier: 1.4
        });
    }

    createStage15() {
        this.width = 4400;
        this.createAdvancedStage(15, {
            platformCount: 35,
            platformMinWidth: 25,
            platformMaxWidth: 55,
            obstacleCount: 30,
            wallCount: 18,
            maxHeight: 100,
            gapMultiplier: 1.5
        });
    }

    createStage16() {
        this.width = 4600;
        this.createAdvancedStage(16, {
            platformCount: 38,
            platformMinWidth: 25,
            platformMaxWidth: 50,
            obstacleCount: 32,
            wallCount: 20,
            maxHeight: 110,
            gapMultiplier: 1.6
        });
    }

    createStage17() {
        this.width = 4800;
        this.createAdvancedStage(17, {
            platformCount: 40,
            platformMinWidth: 20,
            platformMaxWidth: 45,
            obstacleCount: 35,
            wallCount: 22,
            maxHeight: 120,
            gapMultiplier: 1.7
        });
    }

    createStage18() {
        this.width = 5000;
        this.createAdvancedStage(18, {
            platformCount: 42,
            platformMinWidth: 20,
            platformMaxWidth: 40,
            obstacleCount: 38,
            wallCount: 24,
            maxHeight: 130,
            gapMultiplier: 1.8
        });
    }

    createStage19() {
        this.width = 5200;
        this.createAdvancedStage(19, {
            platformCount: 45,
            platformMinWidth: 15,
            platformMaxWidth: 35,
            obstacleCount: 40,
            wallCount: 26,
            maxHeight: 140,
            gapMultiplier: 1.9
        });
    }

    createStage20() {
        this.width = 5400; // 最も長いステージ
        this.createAdvancedStage(20, {
            platformCount: 50,
            platformMinWidth: 15,
            platformMaxWidth: 30,
            obstacleCount: 45,
            wallCount: 30,
            maxHeight: 150,
            gapMultiplier: 2.0
        });
    }

    /**
     * 上級ステージ生成ヘルパー
     */
    createAdvancedStage(stageNumber, config) {
        const {
            platformCount,
            platformMinWidth,
            platformMaxWidth,
            obstacleCount,
            wallCount,
            maxHeight,
            gapMultiplier
        } = config;

        // より複雑なプラットフォーム配置
        this.platforms = [];
        const baseSpacing = this.width / (platformCount + 1);

        for (let i = 0; i < platformCount; i++) {
            const progress = i / platformCount;
            const x = baseSpacing * (i + 1) + (Math.random() - 0.5) * 150 * gapMultiplier;

            // 波状の高さ変化 + ランダム要素
            const waveHeight = Math.sin(progress * Math.PI * 4) * 120;
            const randomHeight = (Math.random() - 0.5) * maxHeight;
            const y = this.groundLevel - 80 - waveHeight - randomHeight;

            const width = platformMinWidth + Math.random() * (platformMaxWidth - platformMinWidth);

            this.platforms.push({
                x: Math.max(50, Math.min(this.width - width - 50, x)),
                y: Math.max(50, Math.min(this.groundLevel - 50, y)),
                width: width,
                height: 20
            });
        }

        // プラットフォーム上のアイテム
        this.items = [];
        this.platforms.forEach((platform, i) => {
            // 小さいプラットフォームにはアイテムを配置しない場合がある
            if (platform.width >= 30 || Math.random() > 0.3) {
                this.items.push({
                    x: platform.x + platform.width / 2 - 10,
                    y: platform.y - 25,
                    width: 20,
                    height: 20,
                    type: ['coin', 'star', 'fruit'][i % 3],
                    active: true
                });
            }
        });

        // チャレンジ用の空中アイテム
        const bonusItems = Math.floor(stageNumber / 2);
        for (let i = 0; i < bonusItems; i++) {
            this.items.push({
                x: 300 + i * 400 + Math.random() * 200,
                y: 50 + Math.random() * 100,
                width: 20,
                height: 20,
                type: ['fruit', 'star'][i % 2],
                active: true
            });
        }

        // 密集した障害物
        this.obstacles = [];
        for (let i = 0; i < obstacleCount; i++) {
            const x = (this.width / obstacleCount) * i + Math.random() * 120;
            const size = 25 + Math.random() * 25;

            this.obstacles.push({
                x: Math.max(30, Math.min(this.width - size - 30, x)),
                y: this.groundLevel - size,
                width: size,
                height: size,
                type: 'spike'
            });
        }

        // より多くの壁
        this.walls = [];
        for (let i = 0; i < wallCount; i++) {
            const x = (this.width / wallCount) * i + Math.random() * 150;
            const height = 200 + Math.random() * 300;
            const y = this.groundLevel - height;

            this.walls.push({
                x: Math.max(40, Math.min(this.width - 60, x)),
                y: Math.max(50, y),
                width: 20,
                height: height
            });
        }

        // ゴール
        this.goal = {
            x: this.width - 150,
            y: this.groundLevel - 60,
            width: 40,
            height: 60,
            type: 'flag'
        };
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
                    ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'star':
                    ctx.fillStyle = '#FF69B4';
                    this.drawStar(ctx, item.x + item.width / 2, item.y + item.height / 2, item.width / 2);
                    break;
                case 'fruit':
                    ctx.fillStyle = '#FF6347';
                    ctx.beginPath();
                    ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                    // 葉っぱ
                    ctx.fillStyle = '#32CD32';
                    ctx.fillRect(item.x + item.width / 2 - 2, item.y, 4, 6);
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
            ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y); // 上の頂点
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
