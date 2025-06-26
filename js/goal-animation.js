/**
 * ゴールアニメーションシステム
 */
class GoalAnimation {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isPlaying = false;
        this.startTime = 0;
        this.duration = 3000; // 3秒間
        
        // アニメーション要素
        this.particles = [];
        this.rings = [];
        this.stars = [];
        this.textElements = [];
        
        // 中心位置（プレイヤー位置）
        this.centerX = 0;
        this.centerY = 0;
    }

    /**
     * アニメーション開始
     */
    start(playerX, playerY) {
        console.log('ゴールアニメーション開始');
        this.isPlaying = true;
        this.startTime = performance.now();
        this.centerX = playerX;
        this.centerY = playerY;
        
        // 効果音再生（将来実装）
        this.playGoalSound();
        
        // 各エフェクトを初期化
        this.initParticles();
        this.initRings();
        this.initStars();
        this.initTextElements();
    }

    /**
     * 効果音再生（プレースホルダー）
     */
    playGoalSound() {
        // 将来的にWeb Audio APIで効果音を再生
        console.log('🎵 ステージクリア効果音再生');
    }

    /**
     * パーティクル初期化
     */
    initParticles() {
        this.particles = [];
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        
        // 50個のパーティクルを生成
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: this.centerX,
                y: this.centerY,
                vx: (Math.random() - 0.5) * 400, // 速度
                vy: (Math.random() - 0.5) * 400,
                size: Math.random() * 8 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1.0,
                decay: Math.random() * 0.02 + 0.01,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }

    /**
     * リング波動初期化
     */
    initRings() {
        this.rings = [];
        
        // 3つのリングを時間差で生成
        for (let i = 0; i < 3; i++) {
            this.rings.push({
                x: this.centerX,
                y: this.centerY,
                radius: 0,
                maxRadius: 200 + i * 50,
                speed: 300 + i * 50,
                opacity: 1.0,
                delay: i * 200, // 時間差
                color: `hsl(${60 + i * 120}, 70%, 60%)`
            });
        }
    }

    /**
     * スター爆発初期化
     */
    initStars() {
        this.stars = [];
        
        // 8方向にスターを配置
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.stars.push({
                x: this.centerX,
                y: this.centerY,
                targetX: this.centerX + Math.cos(angle) * 150,
                targetY: this.centerY + Math.sin(angle) * 150,
                size: 0,
                maxSize: 20,
                rotation: 0,
                opacity: 1.0,
                delay: i * 50
            });
        }
    }

    /**
     * テキスト要素初期化
     */
    initTextElements() {
        this.textElements = [
            {
                text: 'ステージ',
                x: this.canvas.width / 2,
                y: this.canvas.height / 2 - 40,
                targetY: this.canvas.height / 2 - 40,
                currentY: this.canvas.height / 2 + 100,
                size: 44,
                color: '#FFD700',
                delay: 500,
                bounce: 0
            },
            {
                text: 'クリア！',
                x: this.canvas.width / 2,
                y: this.canvas.height / 2 + 20,
                targetY: this.canvas.height / 2 + 20,
                currentY: this.canvas.height / 2 + 150,
                size: 44,
                color: '#FF6B6B',
                delay: 700,
                bounce: 0
            }
        ];
    }

    /**
     * アニメーション更新
     */
    update(currentTime) {
        if (!this.isPlaying) return;

        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        // 各エフェクトを更新
        this.updateParticles(elapsed);
        this.updateRings(elapsed);
        this.updateStars(elapsed);
        this.updateTextElements(elapsed);

        // アニメーション終了判定
        if (progress >= 1) {
            this.isPlaying = false;
            console.log('ゴールアニメーション終了');
            
            // 終了コールバックがあれば実行
            if (this.onComplete) {
                this.onComplete();
            }
        }
    }

    /**
     * パーティクル更新
     */
    updateParticles(elapsed) {
        this.particles.forEach(particle => {
            // 位置更新
            particle.x += particle.vx * 0.016;
            particle.y += particle.vy * 0.016;
            
            // 重力効果
            particle.vy += 200 * 0.016;
            
            // 回転
            particle.rotation += particle.rotationSpeed;
            
            // 寿命減少
            particle.life -= particle.decay;
            particle.life = Math.max(0, particle.life);
        });

        // 寿命が尽きたパーティクルを削除
        this.particles = this.particles.filter(p => p.life > 0);
    }

    /**
     * リング更新
     */
    updateRings(elapsed) {
        this.rings.forEach(ring => {
            if (elapsed > ring.delay) {
                const ringElapsed = elapsed - ring.delay;
                ring.radius = Math.min(ring.radius + ring.speed * 0.016, ring.maxRadius);
                ring.opacity = Math.max(0, 1 - (ring.radius / ring.maxRadius));
            }
        });
    }

    /**
     * スター更新
     */
    updateStars(elapsed) {
        this.stars.forEach(star => {
            if (elapsed > star.delay) {
                const starElapsed = elapsed - star.delay;
                const progress = Math.min(starElapsed / 1000, 1);
                
                // イージング関数（バウンス効果）
                const easeProgress = this.easeOutBounce(progress);
                
                star.x = this.centerX + (star.targetX - this.centerX) * easeProgress;
                star.y = this.centerY + (star.targetY - this.centerY) * easeProgress;
                star.size = star.maxSize * easeProgress;
                star.rotation += 0.1;
                star.opacity = Math.max(0, 1 - progress);
            }
        });
    }

    /**
     * テキスト更新
     */
    updateTextElements(elapsed) {
        this.textElements.forEach(element => {
            if (elapsed > element.delay) {
                const textElapsed = elapsed - element.delay;
                const progress = Math.min(textElapsed / 800, 1);
                
                // バウンスアニメーション
                const easeProgress = this.easeOutBounce(progress);
                element.currentY = element.y + (element.targetY - element.y) * easeProgress;
                
                // 追加のバウンス効果
                element.bounce = Math.sin(textElapsed * 0.01) * 5 * (1 - progress);
            }
        });
    }

    /**
     * バウンスイージング関数
     */
    easeOutBounce(t) {
        if (t < 1 / 2.75) {
            return 7.5625 * t * t;
        } else if (t < 2 / 2.75) {
            return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
        } else if (t < 2.5 / 2.75) {
            return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
        } else {
            return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
        }
    }

    /**
     * アニメーション描画
     */
    render() {
        if (!this.isPlaying) return;

        this.ctx.save();

        // 背景フラッシュ効果
        this.renderBackgroundFlash();
        
        // リング描画
        this.renderRings();
        
        // パーティクル描画
        this.renderParticles();
        
        // スター描画
        this.renderStars();
        
        // テキスト描画
        this.renderText();

        this.ctx.restore();
    }

    /**
     * 背景フラッシュ描画
     */
    renderBackgroundFlash() {
        const elapsed = performance.now() - this.startTime;
        if (elapsed < 200) {
            const opacity = Math.max(0, 0.3 - (elapsed / 200) * 0.3);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * リング描画
     */
    renderRings() {
        this.rings.forEach(ring => {
            if (ring.radius > 0) {
                this.ctx.strokeStyle = ring.color;
                this.ctx.globalAlpha = ring.opacity;
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                this.ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
        this.ctx.globalAlpha = 1;
    }

    /**
     * パーティクル描画
     */
    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.rotate(particle.rotation);
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            
            // 星形パーティクル
            this.drawStar(0, 0, particle.size);
            
            this.ctx.restore();
        });
    }

    /**
     * スター描画
     */
    renderStars() {
        this.stars.forEach(star => {
            if (star.size > 0) {
                this.ctx.save();
                this.ctx.translate(star.x, star.y);
                this.ctx.rotate(star.rotation);
                this.ctx.globalAlpha = star.opacity;
                this.ctx.fillStyle = '#FFD700';
                this.ctx.strokeStyle = '#FFA500';
                this.ctx.lineWidth = 2;
                
                this.drawStar(0, 0, star.size);
                this.ctx.fill();
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        });
    }

    /**
     * テキスト描画
     */
    renderText() {
        this.textElements.forEach(element => {
            this.ctx.save();
            // 日本語対応フォント
            this.ctx.font = `bold ${element.size}px 'Hiragino Sans', 'Meiryo', sans-serif`;
            this.ctx.fillStyle = element.color;
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.textAlign = 'center';
            
            const y = element.currentY + element.bounce;
            
            // 影効果
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillText(element.text, element.x + 3, y + 3);
            
            // メインテキスト
            this.ctx.strokeText(element.text, element.x, y);
            this.ctx.fillStyle = element.color;
            this.ctx.fillText(element.text, element.x, y);
            
            this.ctx.restore();
        });
    }

    /**
     * 星形描画
     */
    drawStar(x, y, size) {
        const spikes = 5;
        const outerRadius = size;
        const innerRadius = size * 0.4;
        
        this.ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i / (spikes * 2)) * Math.PI * 2;
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
    }

    /**
     * アニメーション停止
     */
    stop() {
        this.isPlaying = false;
    }

    /**
     * アニメーション中かどうか
     */
    isAnimating() {
        return this.isPlaying;
    }
}
// ファイル読み込み確認
console.log('goal-animation.js読み込み完了 - GoalAnimationクラス定義済み');
