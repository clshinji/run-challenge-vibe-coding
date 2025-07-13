/**
 * 成績共有用画像生成クラス
 */
class ShareGenerator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentTemplate = 'certificate';
        this.playerData = null;
        
        console.log('📸 ShareGenerator初期化完了');
    }

    /**
     * キャンバス初期化
     */
    initCanvas(canvasId, width = 800, height = 600) {
        try {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) {
                console.error('❌ キャンバスが見つかりません:', canvasId);
                return false;
            }

            // キャンバスのサイズ設定
            this.canvas.width = width;
            this.canvas.height = height;
            
            // コンテキスト取得
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                console.error('❌ 2Dコンテキストの取得に失敗');
                return false;
            }
            
            // 高解像度対応
            const dpr = window.devicePixelRatio || 1;
            this.canvas.style.width = width + 'px';
            this.canvas.style.height = height + 'px';
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            this.ctx.scale(dpr, dpr);

            // キャンバスをクリア
            this.ctx.clearRect(0, 0, width, height);

            console.log('🎨 キャンバス初期化完了:', { 
                canvasId, 
                width, 
                height, 
                dpr,
                canvasElement: !!this.canvas,
                context: !!this.ctx
            });
            return true;
        } catch (error) {
            console.error('❌ キャンバス初期化エラー:', error);
            return false;
        }
    }

    /**
     * プレイヤーデータ設定
     */
    setPlayerData(gameData) {
        this.playerData = {
            name: gameData.playerName || 'ぼうけんしゃ',
            totalScore: gameData.totalStats.totalScore || 0,
            completedStages: gameData.progress.completedStages.length || 0,
            maxStage: Math.max(...gameData.progress.completedStages, 0),
            totalPlayTime: gameData.totalStats.totalPlayTime || 0,
            totalItems: gameData.totalStats.totalItemsCollected || 0,
            playerLevel: this.calculatePlayerLevel(gameData.totalStats.totalScore),
            achievementDate: new Date().toLocaleDateString('ja-JP')
        };

        console.log('👤 プレイヤーデータ設定完了:', this.playerData);
    }

    /**
     * プレイヤーレベル計算
     */
    calculatePlayerLevel(totalScore) {
        if (totalScore >= 2500) return 3;
        if (totalScore >= 1000) return 2;
        return 1;
    }

    /**
     * 時間フォーマット（秒を分:秒に変換）
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}ふん${remainingSeconds}びょう`;
    }

    /**
     * スコアフォーマット（3桁区切り）
     */
    formatScore(score) {
        return score.toLocaleString() + 'てん';
    }

    /**
     * 背景をクリア
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * テキスト描画（アウトライン付き）
     */
    drawText(text, x, y, options = {}) {
        const {
            fontSize = 20,
            fontFamily = 'Arial, sans-serif',
            color = '#333',
            strokeColor = '#fff',
            strokeWidth = 2,
            align = 'center',
            baseline = 'middle'
        } = options;

        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;

        // アウトライン
        if (strokeWidth > 0) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.strokeText(text, x, y);
        }

        // テキスト本体
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
    }

    /**
     * 矩形描画（角丸対応）
     */
    drawRoundRect(x, y, width, height, radius = 0, fillColor = null, strokeColor = null, strokeWidth = 1) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();

        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }

        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.lineWidth = strokeWidth;
            this.ctx.stroke();
        }
    }

    /**
     * 星の描画
     */
    drawStar(x, y, size, color = '#FFD700') {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.4;

        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.beginPath();

        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#FFA500';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
    }

    /**
     * 画像をBlobとして取得
     */
    async getImageBlob(type = 'image/png', quality = 0.9) {
        return new Promise((resolve) => {
            this.canvas.toBlob(resolve, type, quality);
        });
    }

    /**
     * 画像をダウンロード
     */
    async downloadImage(filename = 'せいせき.png') {
        try {
            console.log('💾 ダウンロード開始:', filename);
            
            const blob = await this.getImageBlob();
            if (!blob) {
                throw new Error('画像データの取得に失敗しました');
            }
            
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none'; // リンクを非表示にする
            
            // DOMに追加してクリック、その後すぐに削除
            document.body.appendChild(link);
            link.click();
            
            // 少し待ってからクリーンアップ
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('💾 ダウンロード完了とクリーンアップ:', filename);
            }, 100);
            
        } catch (error) {
            console.error('❌ 画像ダウンロードエラー:', error);
            throw error;
        }
    }
}

// グローバルに公開
window.ShareGenerator = ShareGenerator;
