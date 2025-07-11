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
        this.platformObstacles = []; // 足場上の障害物（Phase 2の新機能）
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
     * ステージ2: 初級レベル - 基本プラットフォーム
     */
    createStage2() {
        // 初級: 1段ジャンプ圏内（最大80px）、大きな足場（100px以上）
        this.platforms = [
            { x: 200, y: this.groundLevel - 50, width: 110, height: 20 },
            { x: 400, y: this.groundLevel - 60, width: 105, height: 20 },
            { x: 600, y: this.groundLevel - 40, width: 115, height: 20 },
            { x: 850, y: this.groundLevel - 70, width: 120, height: 20 },
            { x: 1100, y: this.groundLevel - 55, width: 110, height: 20 },
            { x: 1350, y: this.groundLevel - 65, width: 115, height: 20 },
            { x: 1600, y: this.groundLevel - 45, width: 125, height: 20 },
            { x: 1850, y: this.groundLevel - 75, width: 120, height: 20 }
        ];

        // アイテム（足場の上に配置）
        this.items = [
            { x: 250, y: this.groundLevel - 75, width: 20, height: 20, type: 'coin', active: true },
            { x: 450, y: this.groundLevel - 85, width: 20, height: 20, type: 'star', active: true },
            { x: 650, y: this.groundLevel - 65, width: 20, height: 20, type: 'coin', active: true },
            { x: 900, y: this.groundLevel - 95, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1150, y: this.groundLevel - 80, width: 20, height: 20, type: 'star', active: true },
            { x: 1400, y: this.groundLevel - 90, width: 20, height: 20, type: 'coin', active: true },
            { x: 1650, y: this.groundLevel - 70, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1900, y: this.groundLevel - 100, width: 20, height: 20, type: 'star', active: true },
            // 地面のアイテム
            { x: 300, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 1000, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true }
        ];

        // 障害物：初級レベルなので最小限（1個のみ）
        this.obstacles = [
            { x: 750, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        // 壁：初級レベルなので削除
        this.walls = [];

        this.goal = { x: 2200, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ3: 初級レベル - ジャンプ練習
     */
    createStage3() {
        // 初級: 1段ジャンプ圏内（最大80px）、大きな足場（100px以上）
        this.platforms = [
            { x: 150, y: this.groundLevel - 50, width: 105, height: 20 },
            { x: 320, y: this.groundLevel - 70, width: 110, height: 20 },
            { x: 500, y: this.groundLevel - 40, width: 115, height: 20 },
            { x: 700, y: this.groundLevel - 80, width: 120, height: 20 },
            { x: 900, y: this.groundLevel - 60, width: 110, height: 20 },
            { x: 1100, y: this.groundLevel - 45, width: 115, height: 20 },
            { x: 1300, y: this.groundLevel - 75, width: 120, height: 20 },
            { x: 1500, y: this.groundLevel - 55, width: 110, height: 20 },
            { x: 1700, y: this.groundLevel - 65, width: 115, height: 20 },
            { x: 1900, y: this.groundLevel - 50, width: 125, height: 20 }
        ];

        this.items = [
            { x: 200, y: this.groundLevel - 75, width: 20, height: 20, type: 'coin', active: true },
            { x: 370, y: this.groundLevel - 95, width: 20, height: 20, type: 'star', active: true },
            { x: 550, y: this.groundLevel - 65, width: 20, height: 20, type: 'coin', active: true },
            { x: 750, y: this.groundLevel - 105, width: 20, height: 20, type: 'fruit', active: true },
            { x: 950, y: this.groundLevel - 85, width: 20, height: 20, type: 'star', active: true },
            { x: 1150, y: this.groundLevel - 70, width: 20, height: 20, type: 'coin', active: true },
            { x: 1350, y: this.groundLevel - 100, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1550, y: this.groundLevel - 80, width: 20, height: 20, type: 'star', active: true },
            { x: 1750, y: this.groundLevel - 90, width: 20, height: 20, type: 'coin', active: true },
            { x: 1950, y: this.groundLevel - 75, width: 20, height: 20, type: 'fruit', active: true },
            // 地面のアイテム
            { x: 400, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 1000, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true }
        ];

        // 障害物：初級レベルなので最小限（2個）
        this.obstacles = [
            { x: 600, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1400, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        this.goal = { x: 2200, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ4: 初級レベル - 複雑な構造
     */
    createStage4() {
        // 初級: 1段ジャンプ圏内（最大80px）、大きな足場（100px以上）
        this.platforms = [
            { x: 100, y: this.groundLevel - 50, width: 105, height: 20 },
            { x: 280, y: this.groundLevel - 70, width: 110, height: 20 },
            { x: 460, y: this.groundLevel - 40, width: 115, height: 20 },
            { x: 650, y: this.groundLevel - 80, width: 120, height: 20 },
            { x: 850, y: this.groundLevel - 60, width: 110, height: 20 },
            { x: 1050, y: this.groundLevel - 45, width: 115, height: 20 },
            { x: 1250, y: this.groundLevel - 75, width: 120, height: 20 },
            { x: 1450, y: this.groundLevel - 55, width: 110, height: 20 },
            { x: 1650, y: this.groundLevel - 65, width: 115, height: 20 },
            { x: 1850, y: this.groundLevel - 50, width: 125, height: 20 },
            { x: 2050, y: this.groundLevel - 70, width: 120, height: 20 }
        ];

        this.items = [
            { x: 150, y: this.groundLevel - 75, width: 20, height: 20, type: 'coin', active: true },
            { x: 330, y: this.groundLevel - 95, width: 20, height: 20, type: 'star', active: true },
            { x: 510, y: this.groundLevel - 65, width: 20, height: 20, type: 'coin', active: true },
            { x: 700, y: this.groundLevel - 105, width: 20, height: 20, type: 'fruit', active: true },
            { x: 900, y: this.groundLevel - 85, width: 20, height: 20, type: 'star', active: true },
            { x: 1100, y: this.groundLevel - 70, width: 20, height: 20, type: 'coin', active: true },
            { x: 1300, y: this.groundLevel - 100, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1500, y: this.groundLevel - 80, width: 20, height: 20, type: 'star', active: true },
            { x: 1700, y: this.groundLevel - 90, width: 20, height: 20, type: 'coin', active: true },
            { x: 1900, y: this.groundLevel - 75, width: 20, height: 20, type: 'fruit', active: true },
            { x: 2100, y: this.groundLevel - 95, width: 20, height: 20, type: 'star', active: true },
            // 地面のアイテム
            { x: 380, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 750, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 1150, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true }
        ];

        // 障害物：初級レベルなので最小限（2個）
        this.obstacles = [
            { x: 600, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1400, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        // 壁：初級レベルなので削除
        this.walls = [];

        this.goal = { x: 2200, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
    }

    /**
     * ステージ5: 中級レベル - 複雑な構造
     */
    createStage5() {
        // 中級: 1段ジャンプ圏内（最大80px）、標準の足場（60-100px）
        this.platforms = [
            { x: 150, y: this.groundLevel - 50, width: 80, height: 20 },
            { x: 320, y: this.groundLevel - 70, width: 85, height: 20 },
            { x: 500, y: this.groundLevel - 40, width: 90, height: 20 },
            { x: 700, y: this.groundLevel - 80, width: 95, height: 20 },
            { x: 900, y: this.groundLevel - 60, width: 80, height: 20 },
            { x: 1100, y: this.groundLevel - 45, width: 85, height: 20 },
            { x: 1300, y: this.groundLevel - 75, width: 90, height: 20 },
            { x: 1500, y: this.groundLevel - 55, width: 95, height: 20 },
            { x: 1700, y: this.groundLevel - 65, width: 80, height: 20 },
            { x: 1900, y: this.groundLevel - 50, width: 85, height: 20 },
            { x: 2100, y: this.groundLevel - 70, width: 90, height: 20 }
        ];

        // アイテム（足場の上に配置）
        this.items = [
            { x: 190, y: this.groundLevel - 75, width: 20, height: 20, type: 'coin', active: true },
            { x: 360, y: this.groundLevel - 95, width: 20, height: 20, type: 'star', active: true },
            { x: 540, y: this.groundLevel - 65, width: 20, height: 20, type: 'coin', active: true },
            { x: 740, y: this.groundLevel - 105, width: 20, height: 20, type: 'fruit', active: true },
            { x: 940, y: this.groundLevel - 85, width: 20, height: 20, type: 'star', active: true },
            { x: 1140, y: this.groundLevel - 70, width: 20, height: 20, type: 'coin', active: true },
            { x: 1340, y: this.groundLevel - 100, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1540, y: this.groundLevel - 80, width: 20, height: 20, type: 'star', active: true },
            { x: 1740, y: this.groundLevel - 90, width: 20, height: 20, type: 'coin', active: true },
            { x: 1940, y: this.groundLevel - 75, width: 20, height: 20, type: 'fruit', active: true },
            { x: 2140, y: this.groundLevel - 95, width: 20, height: 20, type: 'star', active: true },
            // 地面のアイテム
            { x: 250, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 600, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 1000, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 1400, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 1800, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true }
        ];

        // 障害物：中級レベルなので適度（4個）
        this.obstacles = [
            { x: 400, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 800, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1200, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1600, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' }
        ];

        // 壁：中級レベルなので最小限
        this.walls = [
            { x: 650, y: this.groundLevel - 120, width: 20, height: 120 },
            { x: 1450, y: this.groundLevel - 100, width: 20, height: 100 }
        ];

        this.goal = { x: 2300, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };
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
 * ステージ6: 中級レベル - 高低差のあるプラットフォーム
 */
    createStage6() {
        this.width = 2600;

        // 中級: 1段ジャンプ圏内（最大80px）、標準の足場（60-100px）
        this.platforms = [
            { x: 150, y: this.groundLevel - 60, width: 80, height: 20 },
            { x: 300, y: this.groundLevel - 80, width: 70, height: 20 },
            { x: 500, y: this.groundLevel - 50, width: 75, height: 20 },
            { x: 700, y: this.groundLevel - 70, width: 80, height: 20 },
            { x: 900, y: this.groundLevel - 40, width: 85, height: 20 },
            { x: 1100, y: this.groundLevel - 60, width: 90, height: 20 },
            { x: 1320, y: this.groundLevel - 80, width: 75, height: 20 },
            { x: 1520, y: this.groundLevel - 45, width: 65, height: 20 },
            { x: 1720, y: this.groundLevel - 75, width: 85, height: 20 },
            { x: 1920, y: this.groundLevel - 55, width: 80, height: 20 },
            { x: 2150, y: this.groundLevel - 65, width: 90, height: 20 },
            { x: 2350, y: this.groundLevel - 50, width: 100, height: 20 }
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

        // 固定された足場配置（二段ジャンプ練習用）
        this.platforms = [
            // 序盤エリア - 基本的な足場
            { x: 120, y: this.groundLevel - 70, width: 60, height: 20 },
            { x: 280, y: this.groundLevel - 100, width: 55, height: 20 },
            { x: 450, y: this.groundLevel - 80, width: 65, height: 20 },
            { x: 620, y: this.groundLevel - 120, width: 50, height: 20 },

            // 中盤エリア - 高い足場で二段ジャンプ必須
            { x: 850, y: this.groundLevel - 90, width: 60, height: 20 },
            { x: 1020, y: this.groundLevel - 130, width: 55, height: 20 },
            { x: 1200, y: this.groundLevel - 110, width: 65, height: 20 },
            { x: 1400, y: this.groundLevel - 140, width: 50, height: 20 },

            // ジャンプチャレンジエリア
            { x: 1650, y: this.groundLevel - 95, width: 60, height: 20 },
            { x: 1850, y: this.groundLevel - 125, width: 55, height: 20 },
            { x: 2080, y: this.groundLevel - 105, width: 65, height: 20 },
            { x: 2300, y: this.groundLevel - 135, width: 50, height: 20 },

            // 終盤エリア - 複雑な配置
            { x: 2550, y: this.groundLevel - 85, width: 60, height: 20 },
            { x: 2750, y: this.groundLevel - 115, width: 55, height: 20 },
            { x: 2950, y: this.groundLevel - 95, width: 65, height: 20 },
            { x: 3150, y: this.groundLevel - 125, width: 50, height: 20 },
            { x: 3350, y: this.groundLevel - 105, width: 60, height: 20 },
            { x: 3550, y: this.groundLevel - 90, width: 55, height: 20 }
        ];

        // 固定されたアイテム配置
        this.items = [
            // 足場上のアイテム
            { x: 150, y: this.groundLevel - 95, width: 20, height: 20, type: 'coin', active: true },
            { x: 300, y: this.groundLevel - 125, width: 20, height: 20, type: 'star', active: true },
            { x: 480, y: this.groundLevel - 105, width: 20, height: 20, type: 'coin', active: true },
            { x: 640, y: this.groundLevel - 145, width: 20, height: 20, type: 'fruit', active: true },
            { x: 880, y: this.groundLevel - 115, width: 20, height: 20, type: 'star', active: true },
            { x: 1040, y: this.groundLevel - 155, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1230, y: this.groundLevel - 135, width: 20, height: 20, type: 'coin', active: true },
            { x: 1420, y: this.groundLevel - 165, width: 20, height: 20, type: 'star', active: true },
            { x: 1680, y: this.groundLevel - 120, width: 20, height: 20, type: 'fruit', active: true },
            { x: 1870, y: this.groundLevel - 150, width: 20, height: 20, type: 'coin', active: true },
            { x: 2110, y: this.groundLevel - 130, width: 20, height: 20, type: 'star', active: true },
            { x: 2320, y: this.groundLevel - 160, width: 20, height: 20, type: 'fruit', active: true },
            { x: 2580, y: this.groundLevel - 110, width: 20, height: 20, type: 'coin', active: true },
            { x: 2770, y: this.groundLevel - 140, width: 20, height: 20, type: 'star', active: true },
            { x: 2980, y: this.groundLevel - 120, width: 20, height: 20, type: 'fruit', active: true },
            { x: 3170, y: this.groundLevel - 150, width: 20, height: 20, type: 'coin', active: true },
            { x: 3370, y: this.groundLevel - 130, width: 20, height: 20, type: 'star', active: true },
            { x: 3570, y: this.groundLevel - 115, width: 20, height: 20, type: 'fruit', active: true },

            // 地面のアイテム
            { x: 200, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 500, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 800, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 1100, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 1500, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 1900, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 2200, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 2600, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 3000, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true },
            { x: 3400, y: this.groundLevel - 25, width: 20, height: 20, type: 'coin', active: true }
        ];

        // 固定された障害物配置
        this.obstacles = [
            { x: 350, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 750, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 1150, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 1550, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 1950, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' },
            { x: 2350, y: this.groundLevel - 40, width: 40, height: 40, type: 'spike' },
            { x: 2750, y: this.groundLevel - 30, width: 30, height: 30, type: 'spike' },
            { x: 3150, y: this.groundLevel - 45, width: 45, height: 45, type: 'spike' },
            { x: 3550, y: this.groundLevel - 35, width: 35, height: 35, type: 'spike' }
        ];

        // 固定された足場上の障害物
        this.platformObstacles = [
            { x: 300, y: this.groundLevel - 125, width: 20, height: 20, type: 'spike' },
            { x: 1040, y: this.groundLevel - 155, width: 20, height: 20, type: 'spike' },
            { x: 1420, y: this.groundLevel - 165, width: 20, height: 20, type: 'spike' },
            { x: 2110, y: this.groundLevel - 130, width: 20, height: 20, type: 'spike' },
            { x: 2780, y: this.groundLevel - 140, width: 20, height: 20, type: 'spike' },
            { x: 3380, y: this.groundLevel - 130, width: 20, height: 20, type: 'spike' }
        ];

        // 固定された壁配置（二段ジャンプで越えられる高さ）
        this.walls = [
            { x: 400, y: this.groundLevel - 95, width: 20, height: 95 },
            { x: 700, y: this.groundLevel - 110, width: 20, height: 110 },
            { x: 1000, y: this.groundLevel - 105, width: 20, height: 105 },
            { x: 1300, y: this.groundLevel - 120, width: 20, height: 120 },
            { x: 1700, y: this.groundLevel - 100, width: 20, height: 100 },
            { x: 2000, y: this.groundLevel - 115, width: 20, height: 115 },
            { x: 2400, y: this.groundLevel - 110, width: 20, height: 110 },
            { x: 2700, y: this.groundLevel - 125, width: 20, height: 125 },
            { x: 3000, y: this.groundLevel - 105, width: 20, height: 105 },
            { x: 3300, y: this.groundLevel - 120, width: 20, height: 120 }
        ];

        // ゴール
        this.goal = { x: 3800, y: this.groundLevel - 60, width: 40, height: 60, type: 'flag' };

        console.log('🎮 ステージ13: 固定レイアウト生成完了 - 2024版');
        console.log('🎮 ステージ13詳細:', {
            platforms: this.platforms.length,
            items: this.items.length,
            obstacles: this.obstacles.length,
            platformObstacles: this.platformObstacles.length,
            walls: this.walls.length,
            firstPlatform: this.platforms[0],
            lastPlatform: this.platforms[this.platforms.length - 1]
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
            gapMultiplier: 1.4,
            wallMinHeight: 95,
            wallMaxHeight: 135
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
            gapMultiplier: 1.5,
            wallMinHeight: 100,
            wallMaxHeight: 140
        });
    }

    createStage16() {
        this.width = 4600;
        this.createAdvancedStage(16, {
            platformCount: 38,
            platformMinWidth: 20,
            platformMaxWidth: 50,
            obstacleCount: 33,
            wallCount: 20,
            maxHeight: 120,
            gapMultiplier: 1.6,
            wallMinHeight: 105,
            wallMaxHeight: 145
        });
    }

    createStage17() {
        this.width = 4800;
        this.createAdvancedStage(17, {
            platformCount: 40,
            platformMinWidth: 18,
            platformMaxWidth: 45,
            obstacleCount: 35,
            wallCount: 22,
            maxHeight: 130,
            gapMultiplier: 1.7,
            wallMinHeight: 110,
            wallMaxHeight: 150
        });
    }

    createStage18() {
        this.width = 5000;
        this.createAdvancedStage(18, {
            platformCount: 42,
            platformMinWidth: 15,
            platformMaxWidth: 40,
            obstacleCount: 38,
            wallCount: 24,
            maxHeight: 140,
            gapMultiplier: 1.8,
            wallMinHeight: 115,
            wallMaxHeight: 155
        });
    }

    createStage19() {
        this.width = 5200;
        this.createAdvancedStage(19, {
            platformCount: 45,
            platformMinWidth: 12,
            platformMaxWidth: 35,
            obstacleCount: 40,
            wallCount: 26,
            maxHeight: 150,
            gapMultiplier: 1.9,
            wallMinHeight: 120,
            wallMaxHeight: 160
        });
    }

    createStage20() {
        this.width = 5400; // 最も長いステージ
        this.createAdvancedStage(20, {
            platformCount: 50,
            platformMinWidth: 10,
            platformMaxWidth: 30,
            obstacleCount: 45,
            wallCount: 30,
            maxHeight: 160,
            gapMultiplier: 2.0,
            wallMinHeight: 125,
            wallMaxHeight: 165
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
            gapMultiplier,
            wallMinHeight = 90,  // デフォルト値を設定
            wallMaxHeight = 130  // デフォルト値を設定
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

        // 足場上の障害物（ステージ13以降の新機能）
        this.platformObstacles = [];
        if (stageNumber >= 13) {
            const platformObstacleCount = Math.floor(platformCount * 0.3); // プラットフォームの30%に障害物配置

            // ランダムに選択されたプラットフォームに障害物を配置
            const selectedPlatforms = this.platforms
                .filter(platform => platform.width >= 40) // 十分な幅があるプラットフォームのみ
                .sort(() => Math.random() - 0.5) // ランダムソート
                .slice(0, platformObstacleCount); // 必要な数だけ選択

            selectedPlatforms.forEach(platform => {
                // プラットフォームの端から少し内側に配置
                const obstacleX = platform.x + 15 + Math.random() * (platform.width - 30);
                const obstacleY = platform.y - 25; // プラットフォームの上に配置

                this.platformObstacles.push({
                    x: obstacleX,
                    y: obstacleY,
                    width: 20,
                    height: 20,
                    type: 'spike',
                    platformIndex: this.platforms.indexOf(platform) // デバッグ用
                });
            });

            console.log(`ステージ${stageNumber}: 足場上の障害物を${this.platformObstacles.length}個配置しました`);
        }

        // 二段ジャンプで越えられる適切な高さの壁
        this.walls = [];
        for (let i = 0; i < wallCount; i++) {
            const x = (this.width / wallCount) * i + Math.random() * 150;
            const height = wallMinHeight + Math.random() * (wallMaxHeight - wallMinHeight);
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
            x: this.width - 100,
            y: this.groundLevel - 60,
            width: 40,
            height: 60,
            type: 'flag'
        };

        console.log(`ステージ${stageNumber}生成完了:`, {
            platforms: this.platforms.length,
            obstacles: this.obstacles.length,
            platformObstacles: this.platformObstacles.length,
            walls: this.walls.length,
            wallHeightRange: `${wallMinHeight}-${wallMaxHeight}px`,
            maxPlayerReach: '約138px（二段ジャンプ）'
        });
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

        // 空の背景（上部）- ステージに応じた色彩変化
        const skyColors = this.getSkyColors();
        const skyGradient = ctx.createLinearGradient(0, drawStartY, 0, this.groundLevel);
        skyGradient.addColorStop(0, skyColors.top);
        skyGradient.addColorStop(0.5, skyColors.middle);
        skyGradient.addColorStop(1, skyColors.bottom);

        ctx.fillStyle = skyGradient;
        ctx.fillRect(drawStartX, drawStartY, drawEndX - drawStartX, this.groundLevel - drawStartY);

        // 地面の背景（下部）
        const groundGradient = ctx.createLinearGradient(0, this.groundLevel, 0, drawEndY);
        groundGradient.addColorStop(0, '#228B22');  // 緑
        groundGradient.addColorStop(1, '#006400');  // 濃い緑

        ctx.fillStyle = groundGradient;
        ctx.fillRect(drawStartX, this.groundLevel, drawEndX - drawStartX, drawEndY - this.groundLevel);

        // 雲の描画（カメラ位置を考慮）
        for (let i = 0; i < 15; i++) {
            const x = (i * 300) % (this.width + 600) - 300; // 範囲を拡張
            const y = 50 + (i % 3) * 30;

            // カメラ範囲内の雲のみ描画
            if (x > drawStartX - 100 && x < drawEndX + 100) {
                this.drawFluffyCloud(ctx, x, y, i);
            }
        }

        // 遠景の山々を描画
        this.drawMountains(ctx, drawStartX, drawEndX, this.groundLevel);
    }

    /**
     * ふわふわ雲描画
     */
    drawFluffyCloud(ctx, x, y, index) {
        ctx.save();

        // 雲の種類による大きさと透明度の変化
        const cloudScale = 0.8 + (index % 3) * 0.2;
        const cloudOpacity = 0.7 + (index % 4) * 0.1;

        // 雲の色とシャドウ
        ctx.globalAlpha = cloudOpacity;

        // 雲の影
        ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
        this.drawCloudShape(ctx, x + 3, y + 3, cloudScale);

        // 雲本体
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.drawCloudShape(ctx, x, y, cloudScale);

        // 雲のハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        this.drawCloudShape(ctx, x - 2, y - 2, cloudScale * 0.7);

        ctx.restore();
    }

    /**
     * 雲の形状描画
     */
    drawCloudShape(ctx, x, y, scale) {
        ctx.beginPath();
        // より多くの円で自然な雲の形を作る
        ctx.arc(x, y, 15 * scale, 0, Math.PI * 2);
        ctx.arc(x + 20 * scale, y, 25 * scale, 0, Math.PI * 2);
        ctx.arc(x + 45 * scale, y, 18 * scale, 0, Math.PI * 2);
        ctx.arc(x + 60 * scale, y - 5 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.arc(x + 25 * scale, y - 8 * scale, 15 * scale, 0, Math.PI * 2);
        ctx.arc(x + 10 * scale, y - 12 * scale, 12 * scale, 0, Math.PI * 2);
        ctx.arc(x + 40 * scale, y - 15 * scale, 10 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 山々の描画
     */
    drawMountains(ctx, drawStartX, drawEndX, groundLevel) {
        const mountainColors = [
            'rgba(139, 69, 19, 0.3)',   // 茶色（一番遠い）
            'rgba(34, 139, 34, 0.4)',   // 緑（中間）
            'rgba(107, 142, 35, 0.5)'   // オリーブ（一番近い）
        ];

        // 3層の山を描画
        for (let layer = 0; layer < 3; layer++) {
            ctx.fillStyle = mountainColors[layer];
            ctx.beginPath();

            const mountainHeight = 80 + layer * 20;
            const peakCount = 5 + layer;
            const peakWidth = (drawEndX - drawStartX) / peakCount;

            // 山の基準線から開始
            const baseY = groundLevel - mountainHeight;
            ctx.moveTo(drawStartX, baseY);

            // 山のピークを描画
            for (let i = 0; i <= peakCount; i++) {
                const peakX = drawStartX + i * peakWidth;
                const peakY = baseY - Math.sin(i * 0.8 + layer) * 40 - 20;

                if (i === 0) {
                    ctx.lineTo(peakX, peakY);
                } else {
                    // 滑らかな曲線でピークを結ぶ
                    const prevPeakX = drawStartX + (i - 1) * peakWidth;
                    const midX = prevPeakX + peakWidth / 2;
                    const midY = (baseY + peakY) / 2;
                    ctx.quadraticCurveTo(midX, midY, peakX, peakY);
                }
            }

            // 山の基準線で閉じる
            ctx.lineTo(drawEndX, baseY);
            ctx.lineTo(drawEndX, groundLevel);
            ctx.lineTo(drawStartX, groundLevel);
            ctx.closePath();
            ctx.fill();
        }
    }

    /**
     * プラットフォーム描画（木製風）
     */
    renderPlatforms(ctx) {
        this.platforms.forEach(platform => {
            this.drawWoodenPlatform(ctx, platform);
        });
    }

    /**
     * 壁描画（石ブロック風）
     */
    renderWalls(ctx) {
        this.walls.forEach(wall => {
            this.drawStoneBrick(ctx, wall);
        });
    }

    /**
     * アイテム描画（改良版）
     */
    renderItems(ctx) {
        const currentTime = performance.now();

        this.items.forEach(item => {
            if (!item.active) return;

            // アイテムの浮遊アニメーション
            const floatOffset = Math.sin(currentTime * 0.003 + item.x * 0.01) * 3;
            const centerX = item.x + item.width / 2;
            const centerY = item.y + item.height / 2 + floatOffset;

            switch (item.type) {
                case 'coin':
                    this.drawMagicalCoin(ctx, centerX, centerY, item.width / 2, currentTime);
                    break;
                case 'star':
                    this.drawMagicalStar(ctx, centerX, centerY, item.width / 2, currentTime);
                    break;
                case 'fruit':
                    this.drawMagicalFruit(ctx, centerX, centerY, item.width / 2, currentTime);
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
        // 地面の障害物を描画
        this.obstacles.forEach(obstacle => {
            this.drawSpikeObstacle(ctx, obstacle, '#2C2C2C', '#000000'); // 濃い灰色ベース、黒いトゲ
        });

        // 足場上の障害物を描画（Phase 2の新機能）
        if (this.platformObstacles && this.platformObstacles.length > 0) {
            this.platformObstacles.forEach(obstacle => {
                this.drawSpikeObstacle(ctx, obstacle, '#404040', '#1C1C1C'); // 少し明るい灰色ベース、濃い灰色のトゲ
            });
        }
    }

    /**
     * ウニのようなトゲトゲ障害物を描画
     */
    drawSpikeObstacle(ctx, obstacle, bodyColor, spikeColor) {
        const centerX = obstacle.x + obstacle.width / 2;
        const centerY = obstacle.y + obstacle.height / 2;
        const radius = Math.min(obstacle.width, obstacle.height) / 3; // ベースの円のサイズ
        const spikeLength = radius * 1.8; // トゲの長さ（少し長めに）
        const spikeCount = 12; // トゲの数

        // 影は省略（ウニ自体の立体感で十分な視覚効果を持つため）

        // トゲを三角形で描画（ベースより先に描画して重なりを自然に）
        ctx.fillStyle = spikeColor;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;

        for (let i = 0; i < spikeCount; i++) {
            const angle = (i / spikeCount) * Math.PI * 2;
            const spikeBaseX = centerX + Math.cos(angle) * radius;
            const spikeBaseY = centerY + Math.sin(angle) * radius;
            const spikeTipX = centerX + Math.cos(angle) * (radius + spikeLength);
            const spikeTipY = centerY + Math.sin(angle) * (radius + spikeLength);

            // トゲの幅を変化させて自然な見た目に
            const spikeWidth = 6 + Math.sin(i * 0.5) * 2; // 4-8pxの範囲で変化

            // トゲの左右の基点を計算（三角形の底辺）
            const perpAngle = angle + Math.PI / 2;
            const leftBaseX = spikeBaseX + Math.cos(perpAngle) * spikeWidth / 2;
            const leftBaseY = spikeBaseY + Math.sin(perpAngle) * spikeWidth / 2;
            const rightBaseX = spikeBaseX - Math.cos(perpAngle) * spikeWidth / 2;
            const rightBaseY = spikeBaseY - Math.sin(perpAngle) * spikeWidth / 2;

            // 鋭利な三角形のトゲを描画
            ctx.beginPath();
            ctx.moveTo(leftBaseX, leftBaseY);   // 左の基点
            ctx.lineTo(spikeTipX, spikeTipY);   // 先端
            ctx.lineTo(rightBaseX, rightBaseY); // 右の基点
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // トゲの先端にハイライト（より鋭利に見せる）
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(spikeTipX, spikeTipY, 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = spikeColor; // 色をリセット
        }

        // ベースの円を描画（トゲの上に重ねる）
        ctx.fillStyle = bodyColor;
        ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;

                ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

        // 中心部の濃い部分（立体感を演出）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // ハイライト（左上に白い小さな円）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * ゴール描画（改良版）
     */
    renderGoal(ctx) {
        if (!this.goal) return;

        const currentTime = performance.now();
        this.drawMagicalGoal(ctx, this.goal, currentTime);
    }

    /**
     * 地面描画（改良版）
     */
    renderGround(ctx) {
        // 地面の基本色（グラデーション）
        const groundGradient = ctx.createLinearGradient(0, this.groundLevel, 0, this.height);
        groundGradient.addColorStop(0, '#228B22');  // 上部：明るい緑
        groundGradient.addColorStop(0.3, '#1E7B1E'); // 中間：やや暗い緑
        groundGradient.addColorStop(1, '#196619');   // 下部：暗い緑

        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, this.groundLevel, this.width, this.height - this.groundLevel);

        // 土の層（地面の一番上）
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, this.groundLevel, this.width, 5);

        // 草のテクスチャ（改良版）
        this.drawGrassTexture(ctx);

        // 小さな花や装飾
        this.drawGroundDecorations(ctx);
    }

    /**
     * 草テクスチャの描画（背景と統一された描画範囲）
     */
    drawGrassTexture(ctx) {
        // 背景描画と同じ範囲計算を使用
        const canvas = ctx.canvas;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // カメラ位置を考慮した描画範囲を計算
        const game = window.simpleGame || window.game;
        const cameraX = game ? game.camera.x : 0;
        const cameraY = game ? game.camera.y : 0;

        // 描画範囲を拡張（カメラ移動を考慮） - 背景と同じ計算
        const drawStartX = cameraX - 100;
        const drawEndX = cameraX + canvasWidth + 100;

        // 全体の草パターンを描画（固定シードベース）
        for (let x = 0; x < this.width; x += 12) {
            // カメラ範囲内の草のみ描画（効率化）
            if (x >= drawStartX && x <= drawEndX) {
                // 固定シードで一貫した草を生成
                const seed = Math.floor(x / 12);
                const grassX = x + this.getFixedRandom(seed * 1.1) * 8;
                const grassHeight = 6 + this.getFixedRandom(seed * 1.2) * 10;
                const grassType = Math.floor(this.getFixedRandom(seed * 1.3) * 3);
                const grassBend = this.getFixedRandom(seed * 1.4) * 0.6 - 0.3; // -0.3 to 0.3

                // 草の色を決定
                let grassColor;
                switch (grassType) {
                    case 0:
                        grassColor = '#32CD32'; // 通常の草
                        break;
                    case 1:
                        grassColor = '#228B22'; // 少し暗い草
                        break;
                    case 2:
                        grassColor = '#7CFC00'; // 明るい草
                        break;
                }

                this.drawStaticGrassBlade(ctx, grassX, this.groundLevel, grassHeight, grassColor, grassBend);
            }
        }
    }

    /**
     * 静的な草の描画（動かない）
     */
    drawStaticGrassBlade(ctx, x, y, height, color, bend) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        // 固定された曲がり具合
        const bendX = bend * height * 0.3;
        const bendY = height * 0.8;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + bendX, y - bendY, x + bendX * 1.2, y - height);
        ctx.stroke();

        // 草の先端をより明るく
        ctx.strokeStyle = this.lightenColor(color, 0.3);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + bendX * 1.2, y - height);
        ctx.lineTo(x + bendX * 1.2 + 1, y - height + 1.5);
        ctx.stroke();
    }

    /**
 * 地面の装飾（花など）- 背景と統一された描画範囲
 */
    drawGroundDecorations(ctx) {
        // 背景描画と同じ範囲計算を使用
        const canvas = ctx.canvas;
        const canvasWidth = canvas.width;

        // カメラ位置を考慮した描画範囲を計算
        const game = window.simpleGame || window.game;
        const cameraX = game ? game.camera.x : 0;

        // 描画範囲を拡張（カメラ移動を考慮） - 背景と同じ計算
        const drawStartX = cameraX - 100;
        const drawEndX = cameraX + canvasWidth + 100;

        // 小さな花を散らす（固定位置）
        for (let x = 0; x < this.width; x += 80) {
            // カメラ範囲内の花のみ描画（効率化）
            if (x >= drawStartX && x <= drawEndX) {
                const seed = Math.floor(x / 80);
                const flowerX = x + this.getFixedRandom(seed * 2.1) * 60;
                const flowerY = this.groundLevel - 2 - this.getFixedRandom(seed * 2.2) * 4;

                if (this.getFixedRandom(seed * 2.3) < 0.6) { // 60%の確率で花を描画
                    const flowerColor = this.getFlowerColor(seed);
                    this.drawStaticFlower(ctx, flowerX, flowerY, flowerColor);
                }
            }
        }

        // 時々キノコも描画（固定位置）
        for (let x = 0; x < this.width; x += 200) {
            // カメラ範囲内のキノコのみ描画（効率化）
            if (x >= drawStartX && x <= drawEndX) {
                const seed = Math.floor(x / 200);
                const mushroomX = x + this.getFixedRandom(seed * 3.1) * 150;
                const mushroomY = this.groundLevel - 8;

                if (this.getFixedRandom(seed * 3.2) < 0.25) { // 25%の確率でキノコを描画
                    this.drawStaticMushroom(ctx, mushroomX, mushroomY, seed);
                }
            }
        }
    }

    /**
     * 花の色を取得（固定）
     */
    getFlowerColor(seed) {
        const flowerColors = ['#FF69B4', '#FFB6C1', '#FFA07A', '#FF6347', '#FFFF00', '#DDA0DD', '#98FB98'];
        const colorIndex = Math.floor(this.getFixedRandom(seed * 4.1) * flowerColors.length);
        return flowerColors[colorIndex];
    }

    /**
     * 静的な花の描画
     */
    drawStaticFlower(ctx, x, y, color) {
        // 花の中心
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 花びら
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const petalX = x + Math.cos(angle) * 2.5;
            const petalY = y + Math.sin(angle) * 2.5;
            ctx.beginPath();
            ctx.arc(petalX, petalY, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 花びらのハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const petalX = x + Math.cos(angle) * 2.5;
            const petalY = y + Math.sin(angle) * 2.5;
            ctx.beginPath();
            ctx.arc(petalX - 0.3, petalY - 0.3, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * 静的なキノコの描画
     */
    drawStaticMushroom(ctx, x, y, seed) {
        // キノコの種類を決定
        const mushroomType = Math.floor(this.getFixedRandom(seed * 5.1) * 3);

        let stemColor, capColor, spotColor;
        switch (mushroomType) {
            case 0:
                stemColor = '#F5F5DC'; // ベージュ
                capColor = '#FF6B6B';  // 赤
                spotColor = '#FFF';    // 白
                break;
            case 1:
                stemColor = '#DEB887'; // バーリーウッド
                capColor = '#8B4513';  // 茶色
                spotColor = '#CD853F'; // ペルー
                break;
            case 2:
                stemColor = '#F0E68C'; // カーキ
                capColor = '#9370DB';  // 紫
                spotColor = '#FFB6C1'; // ライトピンク
                break;
        }

        // キノコの軸
        ctx.fillStyle = stemColor;
        ctx.fillRect(x - 1.5, y, 3, 7);

        // 軸のハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(x - 1.5, y, 1, 7);

        // キノコの傘
        ctx.fillStyle = capColor;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI);
        ctx.fill();

        // 傘の縁のグラデーション
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI);
        ctx.stroke();

        // 傘の斑点（固定位置）
        ctx.fillStyle = spotColor;
        const spotPositions = [
            { dx: -1.5, dy: -1.5 },
            { dx: 1, dy: -2 },
            { dx: 0, dy: -0.5 },
            { dx: -2.5, dy: -0.5 },
            { dx: 2.5, dy: -1 }
        ];

        spotPositions.forEach((spot, index) => {
            if (this.getFixedRandom(seed * 5.2 + index) < 0.8) { // 80%の確率で斑点を描画
                ctx.beginPath();
                ctx.arc(x + spot.dx, y + spot.dy, 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    /**
     * 色を明るくする
     */
    lightenColor(color, factor) {
        const colorMap = {
            '#32CD32': '#7CFC00',
            '#228B22': '#32CD32',
            '#7CFC00': '#ADFF2F'
        };
        return colorMap[color] || color;
    }

    /**
     * 木製プラットフォームの描画
     */
    drawWoodenPlatform(ctx, platform) {
        ctx.save();

        // 木の基本色
        const woodColor = '#8B4513';
        const lightWoodColor = '#A0522D';
        const darkWoodColor = '#654321';

        // プラットフォームの背景
        ctx.fillStyle = woodColor;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // 木の板の線を描画
        const plankWidth = 40;
        for (let x = platform.x; x < platform.x + platform.width; x += plankWidth) {
            const currentPlankWidth = Math.min(plankWidth, platform.x + platform.width - x);

            // 板の境界線
            ctx.strokeStyle = darkWoodColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, platform.y);
            ctx.lineTo(x, platform.y + platform.height);
            ctx.stroke();

            // 木目の模様
            ctx.strokeStyle = 'rgba(101, 67, 33, 0.3)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                const woodGrainY = platform.y + (platform.height / 4) * (i + 1);
                ctx.beginPath();
                ctx.moveTo(x + 2, woodGrainY);
                ctx.lineTo(x + currentPlankWidth - 2, woodGrainY);
                ctx.stroke();
            }
        }

        // 上面のハイライト
        ctx.fillStyle = lightWoodColor;
        ctx.fillRect(platform.x, platform.y, platform.width, 4);

        // 下面の影
        ctx.fillStyle = darkWoodColor;
        ctx.fillRect(platform.x, platform.y + platform.height - 2, platform.width, 2);

        // 金属の留め具（両端）
        ctx.fillStyle = '#696969';
        ctx.fillRect(platform.x + 5, platform.y + 2, 3, platform.height - 4);
        ctx.fillRect(platform.x + platform.width - 8, platform.y + 2, 3, platform.height - 4);

        // 留め具のハイライト
        ctx.fillStyle = '#A9A9A9';
        ctx.fillRect(platform.x + 5, platform.y + 2, 1, platform.height - 4);
        ctx.fillRect(platform.x + platform.width - 8, platform.y + 2, 1, platform.height - 4);

        ctx.restore();
    }

    /**
     * 石ブロック風の壁の描画
     */
    drawStoneBrick(ctx, wall) {
        ctx.save();

        // 石の基本色
        const stoneColor = '#696969';
        const lightStoneColor = '#A9A9A9';
        const darkStoneColor = '#2F2F2F';

        // 壁の背景
        ctx.fillStyle = stoneColor;
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

        // 石ブロックのパターン
        const blockHeight = 20;
        const blockWidth = 30;

        for (let y = wall.y; y < wall.y + wall.height; y += blockHeight) {
            for (let x = wall.x; x < wall.x + wall.width; x += blockWidth) {
                const currentBlockWidth = Math.min(blockWidth, wall.x + wall.width - x);
                const currentBlockHeight = Math.min(blockHeight, wall.y + wall.height - y);

                // 石ブロックの境界線
                ctx.strokeStyle = darkStoneColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, currentBlockWidth, currentBlockHeight);

                // 石の質感（小さな点々）
                ctx.fillStyle = 'rgba(169, 169, 169, 0.5)';
                for (let i = 0; i < 3; i++) {
                    const dotX = x + Math.random() * currentBlockWidth;
                    const dotY = y + Math.random() * currentBlockHeight;
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                // ブロックのハイライト（上と左）
                ctx.strokeStyle = lightStoneColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + currentBlockWidth, y);
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + currentBlockHeight);
                ctx.stroke();

                // ブロックの影（下と右）
                ctx.strokeStyle = darkStoneColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y + currentBlockHeight);
                ctx.lineTo(x + currentBlockWidth, y + currentBlockHeight);
                ctx.moveTo(x + currentBlockWidth, y);
                ctx.lineTo(x + currentBlockWidth, y + currentBlockHeight);
                ctx.stroke();
            }
        }

        // 全体の影（右側）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(wall.x + wall.width, wall.y + 2, 3, wall.height);

        ctx.restore();
    }

    /**
     * 魔法のコインを描画
     */
    drawMagicalCoin(ctx, x, y, radius, currentTime) {
        ctx.save();

        // キラキラエフェクト
        this.drawSparkles(ctx, x, y, radius * 2, currentTime);

        // コインの影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
        ctx.fill();

        // コイン本体（グラデーション）
        const coinGradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, radius);
        coinGradient.addColorStop(0, '#FFFF00');
        coinGradient.addColorStop(0.7, '#FFD700');
        coinGradient.addColorStop(1, '#B8860B');

        ctx.fillStyle = coinGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // コインの縁
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.stroke();

        // コインの模様（$マーク）
        ctx.fillStyle = '#B8860B';
        ctx.font = `${radius}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', x, y);

        // ハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 魔法の星を描画
     */
    drawMagicalStar(ctx, x, y, radius, currentTime) {
        ctx.save();

        // 星の回転
        const rotation = currentTime * 0.002;
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // キラキラエフェクト
        this.drawSparkles(ctx, 0, 0, radius * 2, currentTime);

        // 星の影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.drawStarShape(ctx, 2, 2, radius);

        // 星のグラデーション
        const starGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
        starGradient.addColorStop(0, '#FFB6C1');
        starGradient.addColorStop(0.5, '#FF69B4');
        starGradient.addColorStop(1, '#C71585');

        ctx.fillStyle = starGradient;
        this.drawStarShape(ctx, 0, 0, radius);

        // 星の輪郭
        ctx.strokeStyle = '#C71585';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 星の中心のキラキラ
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 魔法のフルーツを描画
     */
    drawMagicalFruit(ctx, x, y, radius, currentTime) {
        ctx.save();

        // キラキラエフェクト
        this.drawSparkles(ctx, x, y, radius * 2, currentTime);

        // フルーツの影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2);
        ctx.fill();

        // フルーツ本体（グラデーション）
        const fruitGradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, radius);
        fruitGradient.addColorStop(0, '#FF7F50');
        fruitGradient.addColorStop(0.7, '#FF6347');
        fruitGradient.addColorStop(1, '#DC143C');

        ctx.fillStyle = fruitGradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // フルーツの輪郭
        ctx.strokeStyle = '#DC143C';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 葉っぱ（3D効果）
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.ellipse(x, y - radius - 2, 4, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 葉っぱの影
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(x + 1, y - radius - 1, 3, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // ハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 星の形状を描画
     */
    drawStarShape(ctx, x, y, radius) {
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
     * キラキラエフェクトを描画
     */
    drawSparkles(ctx, x, y, range, currentTime) {
        ctx.save();

        for (let i = 0; i < 5; i++) {
            const sparkleTime = currentTime * 0.01 + i * 0.5;
            const sparkleX = x + Math.cos(sparkleTime) * range;
            const sparkleY = y + Math.sin(sparkleTime * 0.7) * range;
            const sparkleSize = 2 + Math.sin(sparkleTime * 2) * 1;
            const sparkleAlpha = 0.3 + Math.sin(sparkleTime * 3) * 0.3;

            ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * 魔法のゴールを描画
     */
    drawMagicalGoal(ctx, goal, currentTime) {
        ctx.save();

        // 虹色のオーラエフェクト
        this.drawRainbowAura(ctx, goal.x + goal.width / 2, goal.y + goal.height / 2, 50, currentTime);

        // 旗竿（3D効果）
        const poleGradient = ctx.createLinearGradient(goal.x, 0, goal.x + 5, 0);
        poleGradient.addColorStop(0, '#A0522D');
        poleGradient.addColorStop(0.5, '#8B4513');
        poleGradient.addColorStop(1, '#654321');

        ctx.fillStyle = poleGradient;
        ctx.fillRect(goal.x, goal.y, 5, goal.height);

        // 旗の波打ち効果
        const waveOffset = Math.sin(currentTime * 0.005) * 5;

        // 旗の影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(goal.x + 5 + 2, goal.y + 2);
        ctx.lineTo(goal.x + 35 + waveOffset + 2, goal.y + 2);
        ctx.lineTo(goal.x + 30 + waveOffset + 2, goal.y + 10 + 2);
        ctx.lineTo(goal.x + 35 + waveOffset + 2, goal.y + 20 + 2);
        ctx.lineTo(goal.x + 5 + 2, goal.y + 20 + 2);
        ctx.closePath();
        ctx.fill();

        // 旗本体（グラデーション）
        const flagGradient = ctx.createLinearGradient(goal.x + 5, goal.y, goal.x + 35, goal.y);
        flagGradient.addColorStop(0, '#FF69B4');
        flagGradient.addColorStop(0.5, '#FF1493');
        flagGradient.addColorStop(1, '#DC143C');

        ctx.fillStyle = flagGradient;
        ctx.beginPath();
        ctx.moveTo(goal.x + 5, goal.y);
        ctx.lineTo(goal.x + 35 + waveOffset, goal.y);
        ctx.lineTo(goal.x + 30 + waveOffset, goal.y + 10);
        ctx.lineTo(goal.x + 35 + waveOffset, goal.y + 20);
        ctx.lineTo(goal.x + 5, goal.y + 20);
        ctx.closePath();
        ctx.fill();

        // 旗の星マーク
        ctx.fillStyle = '#FFD700';
        this.drawStarShape(ctx, goal.x + 20, goal.y + 10, 6);

        // 旗の縁取り
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        ctx.stroke();

        // キラキラエフェクト
        this.drawSparkles(ctx, goal.x + goal.width / 2, goal.y + goal.height / 2, 30, currentTime);

        ctx.restore();
    }

    /**
     * 虹色のオーラエフェクトを描画
     */
    drawRainbowAura(ctx, x, y, radius, currentTime) {
        ctx.save();

        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

        for (let i = 0; i < colors.length; i++) {
            const currentRadius = radius - i * 3;
            const alpha = 0.1 + Math.sin(currentTime * 0.01 + i * 0.5) * 0.05;

            ctx.fillStyle = colors[i] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * ステージに応じた空の色を取得
     */
    getSkyColors() {
        const stageGroup = Math.floor((this.stageNumber - 1) / 4); // 4ステージごとに色を変える

        const skyThemes = [
            // ステージ1-4: 明るい昼間
            {
                top: '#87CEEB',    // 薄い空色
                middle: '#98E4FF', // 少し濃い空色
                bottom: '#B0E0E6'  // パウダーブルー
            },
            // ステージ5-8: 夕方
            {
                top: '#FFB347',    // 薄いオレンジ
                middle: '#FF7F50', // コーラル
                bottom: '#FF6B6B'  // 薄い赤
            },
            // ステージ9-12: 夜明け
            {
                top: '#DDA0DD',    // プラム
                middle: '#DA70D6', // オーキッド
                bottom: '#FF69B4'  // ホットピンク
            },
            // ステージ13-16: 深い夜
            {
                top: '#191970',    // ミッドナイトブルー
                middle: '#483D8B', // ダークスレートブルー
                bottom: '#6A5ACD'  // スレートブルー
            },
            // ステージ17-20: 魔法の空
            {
                top: '#9400D3',    // バイオレット
                middle: '#8A2BE2', // ブルーバイオレット
                bottom: '#9370DB'  // ミディアムパープル
            }
        ];

        const themeIndex = Math.min(stageGroup, skyThemes.length - 1);
        return skyThemes[themeIndex];
    }

    /**
     * 固定ランダム値生成（シードベース、常に同じ値を返す）
     */
    getFixedRandom(seed) {
        // 簡単なシード値ベースの疑似乱数生成
        const x = Math.sin(seed * 12.9898) * 43758.5453;
        return x - Math.floor(x);
    }

    /**
     * 最適化されたランダム値生成（パフォーマンス向上）
     */
    getOptimizedRandom(seed) {
        // 簡単なシード値ベースの疑似乱数生成
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    /**
     * 描画の最適化チェック
     */
    isInViewport(x, y, width, height) {
        const game = window.simpleGame || window.game;
        const cameraX = game ? game.camera.x : 0;
        const cameraY = game ? game.camera.y : 0;
        const viewportWidth = 800; // 想定する画面幅
        const viewportHeight = 600; // 想定する画面高さ

        return x < cameraX + viewportWidth + 100 &&
            x + width > cameraX - 100 &&
            y < cameraY + viewportHeight + 100 &&
            y + height > cameraY - 100;
    }
}

// Stageクラスをグローバルスコープに明示的に登録
window.Stage = Stage;

// ファイル読み込み確認
console.log('stage.js読み込み完了 - Stageクラス定義済み:', typeof Stage, typeof window.Stage);
