// ファイル読み込み開始ログ
console.log('=== player.js読み込み開始 ===');

/**
 * プレイヤーキャラクター制御
 */
class Player {
    constructor(x, y) {
        console.log('プレイヤー作成開始:', { x, y });
        
        // 位置
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        
        console.log('プレイヤー位置設定完了:', { x: this.x, y: this.y, startX: this.startX, startY: this.startY });
        
        // サイズ
        this.width = 32;
        this.height = 32;
        
        // 物理（子ども向けに調整）
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 200; // ピクセル/秒
        this.jumpPower = 450; // ジャンプ力を少し強化（子ども向け）
        this.gravity = 1200;
        this.friction = 0.8;
        
        // 状態（初期状態は地面にいる）
        this.isGrounded = true; // 初期状態で地面にいる
        this.isJumping = false;
        this.isCrouching = false;
        this.facingRight = true;
        
        // 無敵状態（既存システムと統合）
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.isInvincible = false; // 外部からアクセス用のエイリアス
        
        // ダメージエフェクト
        this.isDamaged = false;
        this.damageTime = 0;
        this.knockbackVelocityX = 0;
        this.knockbackVelocityY = 0;
        
        // 二段ジャンプ機能
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;
        
        // 入力状態
        this.inputState = {
            left: false,
            right: false,
            jump: false,
            crouch: false
        };
        
        // アニメーション
        this.animationState = 'idle';
        this.animationTime = 0;
        this.frameIndex = 0;
        
        // 無敵時間（ダメージ後）
        this.invulnerable = false;
        this.invulnerableTime = 0;
        
        console.log('プレイヤー作成完了:', { x: this.x, y: this.y, width: this.width, height: this.height });
    }

    /**
     * 入力処理
     */
    handleInput(action, isPressed) {
        this.inputState[action] = isPressed;
        
        // ジャンプは押した瞬間のみ
        if (action === 'jump' && isPressed) {
            this.attemptJump();
        }
    }

    /**
     * ジャンプ試行（一段目・二段目対応）
     */
    attemptJump() {
        // 一段目ジャンプ（地面にいる時）
        if (this.isGrounded && !this.isJumping) {
            this.jump();
            this.canDoubleJump = true; // 二段ジャンプ可能にする
            this.hasDoubleJumped = false;
            console.log('一段ジャンプ');
        }
        // 二段目ジャンプ（空中で、まだ二段ジャンプしていない時）
        else if (this.canDoubleJump && !this.hasDoubleJumped && !this.isGrounded) {
            this.doubleJump();
            console.log('二段ジャンプ');
        }
    }

    /**
     * 一段目ジャンプ
     */
    jump() {
        this.velocityY = -this.jumpPower;
        this.isJumping = true;
        this.isGrounded = false;
        this.animationState = 'jump';
    }

    /**
     * 二段目ジャンプ
     */
    doubleJump() {
        this.velocityY = -this.jumpPower * 0.8; // 二段目は少し弱く
        this.hasDoubleJumped = true;
        this.canDoubleJump = false;
        this.animationState = 'jump';
    }

    /**
     * 更新処理
     */
    update(deltaTime, stage) {
        this.updateInput(deltaTime);
        this.updatePhysics(deltaTime);
        this.updateCollisions(stage);
        this.updateAnimation(deltaTime);
        this.updateInvulnerability(deltaTime);
    }

    /**
     * 入力更新
     */
    updateInput(deltaTime) {
        // ノックバック中は入力を制限（放物線軌道中の制御不能感を演出）
        const isKnockedBack = Math.abs(this.knockbackVelocityX) > 30 || Math.abs(this.knockbackVelocityY) > 30;
        
        if (isKnockedBack) {
            // ノックバック中は通常の移動入力を無視
            return;
        }
        
        // 横移動
        if (this.inputState.left && !this.inputState.right) {
            this.velocityX = -this.speed;
            this.facingRight = false;
            if (this.isGrounded && this.animationState !== 'crouch') {
                this.animationState = 'walk';
            }
        } else if (this.inputState.right && !this.inputState.left) {
            this.velocityX = this.speed;
            this.facingRight = true;
            if (this.isGrounded && this.animationState !== 'crouch') {
                this.animationState = 'walk';
            }
        } else {
            this.velocityX *= this.friction;
            if (this.isGrounded && Math.abs(this.velocityX) < 10) {
                this.velocityX = 0;
                if (this.animationState === 'walk') {
                    this.animationState = 'idle';
                }
            }
        }

        // しゃがみ
        this.isCrouching = this.inputState.crouch;
        if (this.isCrouching && this.isGrounded) {
            this.animationState = 'crouch';
            this.velocityX *= 0.5; // しゃがみ時は移動速度半減
        }
    }

    /**
     * 物理更新
     */
    updatePhysics(deltaTime) {
        // ダメージエフェクトの更新
        if (this.isDamaged) {
            this.damageTime += deltaTime;
            
            // ダメージエフェクトの持続時間（1秒）
            if (this.damageTime > 1.0) {
                this.isDamaged = false;
                this.knockbackVelocityX = 0;
                this.knockbackVelocityY = 0;
            }
        }
        
        // ノックバック処理（初期速度として設定）
        if (this.knockbackVelocityX !== 0 || this.knockbackVelocityY !== 0) {
            // ノックバック速度を現在の速度に設定
            this.velocityX = this.knockbackVelocityX;
            this.velocityY = this.knockbackVelocityY;
            
            // ノックバック速度を減衰（物理的な空気抵抗のように）
            this.knockbackVelocityX *= 0.92; // X方向の減衰
            this.knockbackVelocityY *= 0.88; // Y方向の減衰（重力と組み合わせるため少し強め）
            
            // 十分小さくなったらリセット
            if (Math.abs(this.knockbackVelocityX) < 15) {
                this.knockbackVelocityX = 0;
            }
            if (Math.abs(this.knockbackVelocityY) < 15) {
                this.knockbackVelocityY = 0;
            }
        }
        
        // 重力適用（ノックバック中も常に適用）
        if (!this.isGrounded) {
            this.velocityY += this.gravity * deltaTime;
        }

        // 最大落下速度制限
        this.velocityY = Math.min(this.velocityY, 600);

        // 位置更新
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;
        
        // デバッグ用ログ（最初の数フレームのみ）
        if (this.animationTime < 1) {
            console.log('プレイヤー物理更新:', {
                position: { x: this.x, y: this.y },
                velocity: { x: this.velocityX, y: this.velocityY },
                isGrounded: this.isGrounded,
                isDamaged: this.isDamaged,
                knockback: { x: this.knockbackVelocityX, y: this.knockbackVelocityY }
            });
        }
    }

    /**
     * 衝突判定更新
     */
    updateCollisions(stage) {
        if (!stage) return;

        // まず空中状態に設定（各判定で適切に更新される）
        this.isGrounded = false;

        // プラットフォームとの衝突判定（上からのみ着地可能）
        this.checkPlatformCollision(stage);
        
        // 壁との衝突判定（完全な物理オブジェクト）
        if (!this.isGrounded) {
            this.checkWallCollision(stage);
        }
        
        // プラットフォームや壁に着地していない場合のみ地面判定
        if (!this.isGrounded) {
            this.checkGroundCollision(stage);
        }
        
        // ステージ境界の処理
        this.checkStageBoundary(stage);
    }

    /**
     * 地面衝突判定
     */
    /**
     * 地面衝突判定
     */
    checkGroundCollision(stage) {
        const wasGrounded = this.isGrounded;
        
        // 簡易的な地面判定（ステージの底面）
        const groundY = stage.groundLevel || (stage.height - 50);
        
        console.log('🌍 地面衝突判定:', {
            playerBottom: this.y + this.height,
            groundY: groundY,
            willHitGround: this.y + this.height >= groundY
        });
        
        // プレイヤーの足元が地面に接触または地面より下にある場合
        if (this.y + this.height >= groundY) {
            console.log('🌍 地面着地!');
            
            // 地面の上に正確に配置
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.isGrounded = true;
            this.isJumping = false;
            
            // 二段ジャンプ状態をリセット
            this.canDoubleJump = false;
            this.hasDoubleJumped = false;
            
            // ノックバック中の着地処理（放物線軌道の終了）
            if (this.knockbackVelocityY !== 0) {
                // Y方向のノックバック速度をリセット（着地したため）
                this.knockbackVelocityY = 0;
                console.log('地面着地: Y方向速度リセット');
            }
            
            // 着地時のアニメーション変更
            if (!wasGrounded && this.animationState === 'jump') {
                this.animationState = 'idle';
            }
        }
        // else文を削除（isGroundedはupdateCollisionsで初期化済み）
    }

    /**
     * プラットフォーム衝突判定
     */
    checkPlatformCollision(stage) {
        if (!stage.platforms || stage.platforms.length === 0) {
            console.log('⚠️ プラットフォームが存在しません');
            return;
        }
        
        console.log('🔍 プラットフォーム衝突判定開始:', {
            platformCount: stage.platforms.length,
            playerPos: { x: this.x, y: this.y },
            playerSize: { width: this.width, height: this.height },
            playerBottom: this.y + this.height,
            velocityY: this.velocityY,
            isGrounded: this.isGrounded
        });
        
        // プラットフォームとの衝突判定
        stage.platforms.forEach((platform, index) => {
            const playerBottom = this.y + this.height;
            const playerLeft = this.x;
            const playerRight = this.x + this.width;
            const platformTop = platform.y;
            const platformLeft = platform.x;
            const platformRight = platform.x + platform.width;
            
            // 各条件を個別にチェック（条件を緩和）
            const condition1 = this.velocityY >= 0; // 下向き移動
            const condition2 = playerBottom <= platformTop + 25; // 判定範囲を拡大
            const condition3 = playerBottom >= platformTop - 15; // 判定範囲を拡大
            const condition4 = playerRight > platformLeft + 5; // 少し余裕を持たせる
            const condition5 = playerLeft < platformRight - 5; // 少し余裕を持たせる
            
            console.log(`プラットフォーム${index}判定:`, {
                platform: platform,
                conditions: {
                    '下向き移動': condition1,
                    '上端付近': condition2,
                    '判定範囲内': condition3,
                    '水平重複左': condition4,
                    '水平重複右': condition5
                },
                values: {
                    velocityY: this.velocityY,
                    playerBottom: playerBottom,
                    platformTop: platformTop,
                    playerLeft: playerLeft,
                    playerRight: playerRight,
                    platformLeft: platformLeft,
                    platformRight: platformRight
                }
            });
            
            // 上から落下してプラットフォームに着地する判定
            if (condition1 && condition2 && condition3 && condition4 && condition5) {
                console.log(`🟫 プラットフォーム${index}着地成功!`, platform);
                
                // プラットフォームの上に正確に配置
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isGrounded = true;
                this.isJumping = false;
                
                // 二段ジャンプ状態をリセット
                this.canDoubleJump = false;
                this.hasDoubleJumped = false;
                
                // ノックバック中の着地処理
                if (this.knockbackVelocityY !== 0) {
                    this.knockbackVelocityY = 0;
                    console.log('プラットフォーム着地: ノックバックY方向リセット');
                }
                
                return; // 着地したら他のプラットフォームはチェックしない
            }
        });
    }

    /**
     * 壁の衝突判定（完全な物理オブジェクト）
     */
    checkWallCollision(stage) {
        if (!stage.walls || stage.walls.length === 0) {
            return;
        }
        
        console.log('🧱 壁衝突判定開始');
        
        stage.walls.forEach((wall, index) => {
            // 衝突判定
            const horizontalOverlap = this.x + this.width > wall.x && this.x < wall.x + wall.width;
            const verticalOverlap = this.y + this.height > wall.y && this.y < wall.y + wall.height;
            
            if (horizontalOverlap && verticalOverlap) {
                console.log(`🧱 壁${index}との衝突を検出:`, {
                    wall: wall,
                    playerPos: { x: this.x, y: this.y },
                    playerVelocity: { x: this.velocityX, y: this.velocityY }
                });
                
                // 衝突の方向を判定して適切に押し戻す
                this.resolveWallCollision(wall, index);
            }
        });
    }
    
    /**
     * 壁衝突の解決（地面と同じ扱い）
     */
    resolveWallCollision(wall, index) {
        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;
        const wallCenterX = wall.x + wall.width / 2;
        const wallCenterY = wall.y + wall.height / 2;
        
        // プレイヤーと壁の中心間の距離
        const deltaX = playerCenterX - wallCenterX;
        const deltaY = playerCenterY - wallCenterY;
        
        // 重複している距離を計算
        const overlapX = (this.width + wall.width) / 2 - Math.abs(deltaX);
        const overlapY = (this.height + wall.height) / 2 - Math.abs(deltaY);
        
        console.log(`壁${index}衝突解決:`, {
            deltaX: deltaX,
            deltaY: deltaY,
            overlapX: overlapX,
            overlapY: overlapY
        });
        
        // より小さい重複の方向に押し戻す
        if (overlapX < overlapY) {
            // 水平方向の押し戻し
            if (deltaX > 0) {
                // プレイヤーが壁の右側 → 右に押し戻す
                this.x = wall.x + wall.width;
                console.log(`壁${index}: 右側に押し戻し`);
            } else {
                // プレイヤーが壁の左側 → 左に押し戻す
                this.x = wall.x - this.width;
                console.log(`壁${index}: 左側に押し戻し`);
            }
            this.velocityX = 0;
        } else {
            // 垂直方向の押し戻し
            if (deltaY > 0) {
                // プレイヤーが壁の下側 → 下に押し戻す（頭上衝突）
                this.y = wall.y + wall.height;
                this.velocityY = 0;
                console.log(`壁${index}: 下側に押し戻し（頭上衝突）`);
            } else {
                // プレイヤーが壁の上側 → 上に押し戻す（着地）
                this.y = wall.y - this.height;
                this.velocityY = 0;
                this.isGrounded = true;
                this.isJumping = false;
                this.canDoubleJump = false;
                this.hasDoubleJumped = false;
                console.log(`壁${index}: 上側に押し戻し（着地）`);
                
                // ノックバック中の着地処理
                if (this.knockbackVelocityY !== 0) {
                    this.knockbackVelocityY = 0;
                }
            }
        }
    }

    /**
     * ステージ境界の処理
     */
    checkStageBoundary(stage) {
        // ステージ境界
        if (this.x < 0) {
            this.x = 0;
            this.velocityX = 0;
        }
        
        if (this.x + this.width > stage.width) {
            this.x = stage.width - this.width;
            this.velocityX = 0;
        }
    }

    /**
     * アニメーション更新
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // アニメーションフレーム更新
        const frameRate = 8; // FPS
        if (this.animationTime >= 1 / frameRate) {
            this.frameIndex++;
            this.animationTime = 0;
            
            // フレーム数制限
            const maxFrames = this.getMaxFrames(this.animationState);
            if (this.frameIndex >= maxFrames) {
                this.frameIndex = 0;
            }
        }
    }

    /**
     * アニメーションフレーム数取得
     */
    getMaxFrames(state) {
        switch (state) {
            case 'idle': return 4;
            case 'walk': return 6;
            case 'jump': return 1;
            case 'crouch': return 1;
            default: return 1;
        }
    }

    /**
     * 無敵時間更新
     */
    updateInvulnerability(deltaTime) {
        if (this.invulnerable) {
            this.invulnerableTime -= deltaTime;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
                this.isInvincible = false;
            }
        }
    }

    /**
     * 無敵状態にする
     */
    makeInvincible(duration = 2000) {
        this.invulnerable = true;
        this.isInvincible = true;
        this.invulnerableTime = duration / 1000; // ミリ秒を秒に変換
        console.log(`プレイヤーが${duration}ms間無敵状態になりました`);
    }

    /**
     * ダメージ処理
     */
    takeDamage() {
        if (this.invulnerable) return false;
        
        this.invulnerable = true;
        this.invulnerableTime = 2.0; // 2秒間無敵
        
        // ノックバック
        this.velocityY = -200;
        this.velocityX = this.facingRight ? -100 : 100;
        
        console.log('プレイヤーダメージ');
        return true;
    }

    /**
     * リスポーン
     */
    respawn() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.isJumping = false;
        this.isCrouching = false;
        this.animationState = 'idle';
        this.invulnerable = true;
        this.invulnerableTime = 1.0;
        
        // ダメージエフェクトをリセット
        this.isDamaged = false;
        this.damageTime = 0;
        this.knockbackVelocityX = 0;
        this.knockbackVelocityY = 0;
        
        console.log('プレイヤーリスポーン:', { x: this.x, y: this.y });
    }

    /**
     * ダメージを受ける（ノックバック付き）
     */
    takeDamage(obstacleX, obstacleY) {
        console.log('プレイヤーがダメージエフェクトを受けました');
        
        // ダメージ状態を設定
        this.isDamaged = true;
        this.damageTime = 0;
        
        // 障害物の位置に基づいてノックバック方向を計算（放物線軌道用に調整）
        const knockbackForce = 400; // 水平方向の力
        const knockbackUpForce = 350; // 上方向の力（重力と組み合わせて自然な弧を描く）
        
        // プレイヤーと障害物の位置関係からノックバック方向を決定
        const playerCenterX = this.x + this.width / 2;
        const obstacleCenterX = obstacleX + 15; // 障害物の中心（仮定）
        
        if (playerCenterX < obstacleCenterX) {
            // プレイヤーが障害物の左側にいる場合、左に弾く
            this.knockbackVelocityX = -knockbackForce;
        } else {
            // プレイヤーが障害物の右側にいる場合、右に弾く
            this.knockbackVelocityX = knockbackForce;
        }
        
        // 上方向に弾く（重力と組み合わせて放物線軌道を作る）
        this.knockbackVelocityY = -knockbackUpForce;
        
        // 現在の速度をリセットしてノックバック速度を初期値として設定
        this.velocityX = this.knockbackVelocityX;
        this.velocityY = this.knockbackVelocityY;
        
        // 空中状態にして重力を適用
        this.isGrounded = false;
        
        // 無敵状態にする
        this.makeInvincible(2000);
        
        console.log('放物線軌道ノックバック設定:', {
            knockbackX: this.knockbackVelocityX,
            knockbackY: this.knockbackVelocityY,
            initialVelocityX: this.velocityX,
            initialVelocityY: this.velocityY,
            playerX: playerCenterX,
            obstacleX: obstacleCenterX,
            isGrounded: this.isGrounded
        });
    }

    /**
     * 描画処理
     */
    render(ctx) {
        try {
            ctx.save();
            
            // ダメージエフェクト（赤い点滅）
            if (this.isDamaged) {
                const flashIntensity = Math.sin(this.damageTime * 20) * 0.5 + 0.5; // 0-1の範囲で点滅
                ctx.globalAlpha = 0.7 + flashIntensity * 0.3;
                
                // 赤いオーバーレイ
                ctx.globalCompositeOperation = 'multiply';
                ctx.fillStyle = `rgba(255, 100, 100, ${flashIntensity * 0.5})`;
            }
            
            // 無敵時間中は点滅（ダメージエフェクトと重複しないように調整）
            if (this.invulnerable && !this.isDamaged && Math.floor(this.invulnerableTime * 10) % 2 === 0) {
                ctx.globalAlpha = 0.5;
            }
            
            // キャラクター描画位置
            const drawX = Math.floor(this.x);
            const drawY = Math.floor(this.y);
            
            // ダメージ時の振動エフェクト（強化）
            let shakeX = 0, shakeY = 0;
            if (this.isDamaged && this.damageTime < 0.5) { // 振動時間を延長
                const shakeIntensity = (0.5 - this.damageTime) * 15; // 振動強度を増加
                shakeX = (Math.random() - 0.5) * shakeIntensity;
                shakeY = (Math.random() - 0.5) * shakeIntensity;
            }
            
            // 向きに応じて反転
            if (!this.facingRight) {
                ctx.scale(-1, 1);
                ctx.translate(-(drawX + this.width + shakeX), shakeY);
            } else {
                ctx.translate(drawX + shakeX, shakeY);
            }
            
            // キャラクター描画（現在は矩形、後で画像に置き換え）
            this.renderCharacter(ctx, 0, drawY);
            
            ctx.restore();
            
            // デバッグ情報
            this.renderDebugInfo(ctx, drawX, drawY);
        } catch (error) {
            console.error('プレイヤー描画エラー:', error);
            // 簡易描画でフォールバック
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    /**
     * キャラクター描画
     */
    renderCharacter(ctx, x, y) {
        // 無敵状態の場合は点滅効果
        if (this.invulnerable) {
            const blinkRate = 0.1; // 点滅の速度
            const alpha = Math.sin(Date.now() * blinkRate) > 0 ? 0.3 : 1.0;
            ctx.globalAlpha = alpha;
        }
        
        // 現在は簡単な矩形で描画
        // 後でスプライト画像に置き換え予定
        
        // 体
        ctx.fillStyle = this.getCharacterColor();
        ctx.fillRect(x, y, this.width, this.height);
        
        // 顔
        ctx.fillStyle = '#FFB6C1';
        ctx.fillRect(x + 4, y + 4, this.width - 8, 12);
        
        // 目
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 8, y + 7, 3, 3);
        ctx.fillRect(x + this.width - 11, y + 7, 3, 3);
        
        // 鼻
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(x + this.width/2 - 1, y + 10, 2, 2);
        
        // しゃがみ時は高さを調整
        if (this.isCrouching) {
            ctx.fillStyle = this.getCharacterColor();
            ctx.fillRect(x, y + this.height/2, this.width, this.height/2);
        }
        
        // 無敵状態の場合はアルファ値をリセット
        if (this.invulnerable) {
            ctx.globalAlpha = 1.0;
        }
    }

    /**
     * キャラクター色取得
     */
    getCharacterColor() {
        switch (this.animationState) {
            case 'walk':
                return this.frameIndex % 2 === 0 ? '#FF6B6B' : '#FF8E8E';
            case 'jump':
                return '#FFB347';
            case 'crouch':
                return '#DDA0DD';
            default:
                return '#FF6B6B';
        }
    }

    /**
     * デバッグ情報描画
     */
    renderDebugInfo(ctx, x, y) {
        // 当たり判定枠
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, this.width, this.height);
        
        // 状態表示
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`State: ${this.animationState}`, x, y - 35);
        ctx.fillText(`Ground: ${this.isGrounded}`, x, y - 20);
        ctx.fillText(`DoubleJump: ${this.canDoubleJump ? 'OK' : 'NO'}`, x, y - 5);
        
        // 二段ジャンプ可能時のインジケーター
        if (this.canDoubleJump && !this.hasDoubleJumped) {
            ctx.fillStyle = 'cyan';
            ctx.beginPath();
            ctx.arc(x + this.width/2, y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 速度ベクトル
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + this.width/2, y + this.height/2);
        ctx.lineTo(x + this.width/2 + this.velocityX/10, y + this.height/2 + this.velocityY/10);
        ctx.stroke();
    }

    /**
     * 当たり判定取得
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.isCrouching ? this.height/2 : this.height
        };
    }
}

// Playerクラスをグローバルスコープに明示的に登録
console.log('=== Playerクラス登録処理開始 ===');
console.log('Player定義状況:', typeof Player);

if (typeof window !== 'undefined') {
    window.Player = Player;
    console.log('✅ Playerクラスをwindowに登録完了');
    console.log('window.Player:', typeof window.Player);
} else {
    console.error('❌ windowオブジェクトが利用できません');
}

// ファイル読み込み確認
console.log('=== player.js読み込み完了 ===');
console.log('最終確認:', {
    'typeof Player': typeof Player,
    'typeof window.Player': typeof window?.Player,
    'Player === window.Player': Player === window?.Player,
    'Player.prototype': !!Player.prototype,
    'Player.constructor': !!Player.constructor
});

// テスト用のインスタンス作成確認
try {
    const testPlayer = new Player(0, 0);
    console.log('✅ Playerインスタンス作成テスト成功');
    testPlayer = null; // メモリ解放
} catch (error) {
    console.error('❌ Playerインスタンス作成テスト失敗:', error);
}
