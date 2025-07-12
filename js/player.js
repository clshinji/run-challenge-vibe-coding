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

        // 二段ジャンプ機能（シンプル化）
        this.jumpCount = 0; // 現在のジャンプ回数
        this.maxJumps = 2;  // 最大ジャンプ回数（一段 + 二段）

        // ジャンプボタンの前フレーム状態（連続押下防止用）
        this.previousJumpState = false;

        // レベルアップシステム
        this.playerLevel = 1; // プレイヤーレベル（1: ダブルジャンプ, 2: トリプルジャンプ）
        this.totalItemsCollected = 0; // 総アイテム収集数
        this.itemsInCurrentLevel = 0; // 現在レベルでのアイテム収集数
        this.itemsRequiredForLevelUp = 10; // レベルアップに必要なアイテム数

        // データを読み込み
        this.loadLevelData();

        // レベルアップエフェクト
        this.isLevelingUp = false;
        this.levelUpTime = 0;
        this.levelUpDuration = 2000; // 2秒間のレベルアップエフェクト
        this.showLevelUpMessage = false;

        // 入力状態
        this.inputState = {
            left: false,
            right: false,
            jump: false
        };

        // アニメーション
        this.animationState = 'idle';
        this.animationTime = 0;
        this.frameIndex = 0;

        // 二段ジャンプエフェクト
        this.isSpinning = false;
        this.spinStartTime = 0;
        this.spinDuration = 300;

        // トリプルジャンプエフェクト
        this.isTripleJumping = false;
        this.tripleJumpStartTime = 0;
        this.tripleJumpDuration = 500;

        // デバッグ表示設定
        this.showDebugInfo = false; // デフォルトでオフ（将来的に設定画面で切り替え可能）

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

        // ジャンプ入力の詳細ログ
        if (action === 'jump') {
            console.log('[JUMP_DEBUG] 🎮 ジャンプ入力受信:', {
                action: action,
                isPressed: isPressed,
                previousJumpState: this.previousJumpState,
                shouldJump: isPressed && !this.previousJumpState,
                currentJumpCount: this.jumpCount,
                timestamp: Date.now()
            });
        }

        // ジャンプは押した瞬間のみ（連続押下防止）
        if (action === 'jump' && isPressed && !this.previousJumpState) {
            console.log('[JUMP_DEBUG] ✅ ジャンプ入力受付 - attemptJump呼び出し');
            this.attemptJump();
        } else if (action === 'jump' && isPressed) {
            console.log('[JUMP_DEBUG] ❌ ジャンプ入力拒否 - 連続押下防止:', {
                isPressed: isPressed,
                previousJumpState: this.previousJumpState
            });
        }

        // ジャンプボタンの状態を記録
        if (action === 'jump') {
            console.log('[JUMP_DEBUG] 🔄 ジャンプ状態更新:', {
                before: this.previousJumpState,
                after: isPressed
            });
            this.previousJumpState = isPressed;
        }
    }

    /**
 * ジャンプ試行（トリプルジャンプ対応）
 */
    attemptJump() {
        console.log('[JUMP_DEBUG] 🚀 ジャンプ試行:', {
            jumpCount: this.jumpCount,
            maxJumps: this.maxJumps,
            playerLevel: this.playerLevel,
            isGrounded: this.isGrounded,
            velocityY: this.velocityY,
            canJump: this.jumpCount < this.maxJumps
        });

        // ジャンプ回数チェック
        if (this.jumpCount < this.maxJumps) {
            this.jumpCount++;

            if (this.jumpCount === 1) {
                // 一段ジャンプ
                console.log('[JUMP_DEBUG] ✅ 一段ジャンプ実行');
                this.jump();
            } else if (this.jumpCount === 2) {
                // 二段ジャンプ
                console.log('[JUMP_DEBUG] ✅ 二段ジャンプ実行');
                this.doubleJump();
            } else if (this.jumpCount === 3) {
                // 三段ジャンプ（レベル2でのみ可能）
                console.log('[JUMP_DEBUG] ✅ トリプルジャンプ実行');
                this.tripleJump();
            }

            const jumpType = this.jumpCount === 1 ? '一段' :
                this.jumpCount === 2 ? '二段' : 'トリプル';

            console.log('[JUMP_DEBUG] ✅ ジャンプ実行完了:', {
                jumpCount: this.jumpCount,
                jumpType: jumpType,
                playerLevel: this.playerLevel
            });
        }
        else {
            console.log('[JUMP_DEBUG] ❌ ジャンプ回数上限:', {
                jumpCount: this.jumpCount,
                maxJumps: this.maxJumps,
                playerLevel: this.playerLevel
            });

            // デバッグ用アラート（失敗時）
            if (window.location.search.includes('debug')) {
                alert(`ジャンプ回数上限: ${this.jumpCount}/${this.maxJumps}`);
            }
        }
    }

    /**
     * 一段目ジャンプ
     */
    jump() {
        console.log('[JUMP_DEBUG] 🚀 一段ジャンプ実行前の状態:', {
            velocityY: this.velocityY,
            isJumping: this.isJumping,
            isGrounded: this.isGrounded,
            jumpCount: this.jumpCount
        });

        this.velocityY = -this.jumpPower;
        this.isJumping = true;
        this.isGrounded = false;
        this.animationState = 'jump';

        console.log('[JUMP_DEBUG] 🚀 一段ジャンプ実行後の状態:', {
            velocityY: this.velocityY,
            isJumping: this.isJumping,
            isGrounded: this.isGrounded,
            jumpPower: this.jumpPower
        });
    }

    /**
     * 二段目ジャンプ
     */
    doubleJump() {
        this.velocityY = -this.jumpPower * 0.8; // 二段目は少し弱く
        this.isJumping = true;
        this.isGrounded = false;
        this.animationState = 'jump';

        // 二段ジャンプの視覚エフェクトを発動
        this.applyDoubleJumpSpin();

        console.log('[JUMP_DEBUG] ✨ 二段ジャンプ実行完了:', {
            spinning: this.isSpinning,
            velocityY: this.velocityY
        });
    }

    /**
     * 三段目ジャンプ（レベル2でアンロック）
     */
    tripleJump() {
        this.velocityY = -this.jumpPower * 0.7; // 三段目は少し弱く
        this.isJumping = true;
        this.isGrounded = false;
        this.animationState = 'jump';

        // トリプルジャンプの特別なエフェクト
        this.applyTripleJumpEffect();

        console.log('[JUMP_DEBUG] ✨✨✨ トリプルジャンプ実行完了!', {
            playerLevel: this.playerLevel,
            velocityY: this.velocityY
        });
    }

    /**
     * トリプルジャンプエフェクト
     */
    applyTripleJumpEffect() {
        this.isTripleJumping = true;
        this.tripleJumpStartTime = Date.now();
        this.tripleJumpDuration = 500; // 0.5秒間の特別エフェクト
    }

    /**
     * アイテム収集処理
     */
    collectItem() {
        this.totalItemsCollected++;
        this.itemsInCurrentLevel++;

        console.log('🎁 アイテム収集!', {
            totalItems: this.totalItemsCollected,
            itemsInLevel: this.itemsInCurrentLevel,
            requiredForLevelUp: this.itemsRequiredForLevelUp
        });

        // データを保存
        this.saveLevelData();

        // レベルアップチェック
        this.checkLevelUp();
    }

    /**
     * レベルアップチェック
     */
    checkLevelUp() {
        if (this.playerLevel === 1 && this.itemsInCurrentLevel >= this.itemsRequiredForLevelUp) {
            this.levelUp();
        }
    }

    /**
     * レベルアップ実行
     */
    levelUp() {
        this.playerLevel = 2;
        this.itemsInCurrentLevel = 0; // リセット
        this.maxJumps = 3; // トリプルジャンプアンロック

        // レベルアップエフェクト開始
        this.isLevelingUp = true;
        this.levelUpTime = 0;
        this.showLevelUpMessage = true;

        console.log('🌟🌟🌟 レベルアップ! トリプルジャンプがアンロックされました!', {
            playerLevel: this.playerLevel,
            maxJumps: this.maxJumps
        });

        // データを保存
        this.saveLevelData();

        // UI にレベルアップを通知
        if (window.uiManager && window.uiManager.showLevelUpNotification) {
            window.uiManager.showLevelUpNotification();
        }
    }

    /**
     * レベルアップエフェクト更新
     */
    updateLevelUpEffect(deltaTime) {
        if (this.isLevelingUp) {
            this.levelUpTime += deltaTime;

            if (this.levelUpTime >= this.levelUpDuration) {
                this.isLevelingUp = false;
                this.showLevelUpMessage = false;
            }
        }
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
        this.updateLevelUpEffect(deltaTime);
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

            // ジャンプ回数をリセット（新方式）
            console.log('[JUMP_DEBUG] 🌍 地面着地 - ジャンプ回数リセット前:', {
                jumpCount: this.jumpCount,
                wasGrounded: wasGrounded,
                playerBottom: this.y + this.height,
                groundY: groundY
            });

            this.jumpCount = 0; // ジャンプ回数をリセット

            console.log('[JUMP_DEBUG] 🌍 地面着地 - ジャンプ回数リセット後:', {
                jumpCount: this.jumpCount
            });

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

                // ジャンプ回数をリセット（新方式）
                console.log('[JUMP_DEBUG] 🟫 プラットフォーム着地 - ジャンプ回数リセット前:', {
                    jumpCount: this.jumpCount,
                    platform: platform
                });

                this.jumpCount = 0; // ジャンプ回数をリセット

                console.log('[JUMP_DEBUG] 🟫 プラットフォーム着地 - ジャンプ回数リセット後:', {
                    jumpCount: this.jumpCount
                });

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
                this.jumpCount = 0; // ジャンプ回数をリセット
                console.log('[JUMP_DEBUG] 🧱 壁着地 - ジャンプ回数リセット:', {
                    jumpCount: this.jumpCount
                });
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
        console.log('プレイヤーがウニからダメージエフェクトを受けました');

        // ダメージ状態を設定
        this.isDamaged = true;
        this.damageTime = 0;

        // ウニ障害物の位置に基づいてノックバック方向を計算（放物線軌道用に調整）
        const knockbackForce = 400; // 水平方向の力
        const knockbackUpForce = 350; // 上方向の力（重力と組み合わせて自然な弧を描く）

        // プレイヤーとウニの中心位置関係からノックバック方向を決定
        const playerCenterX = this.x + this.width / 2;
        const obstacleCenterX = obstacleX + 15; // ウニの中心（推定値）

        if (playerCenterX < obstacleCenterX) {
            // プレイヤーがウニの左側にいる場合、左に弾く
            this.knockbackVelocityX = -knockbackForce;
        } else {
            // プレイヤーがウニの右側にいる場合、右に弾く
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

        console.log('ウニからの放物線軌道ノックバック設定:', {
            knockbackX: this.knockbackVelocityX,
            knockbackY: this.knockbackVelocityY,
            initialVelocityX: this.velocityX,
            initialVelocityY: this.velocityY,
            playerX: playerCenterX,
            urchinX: obstacleCenterX,
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

            // スピン効果の適用
            const spinRotation = this.getSpinRotation();

            // 向きに応じて反転とスピン
            ctx.translate(drawX + this.width / 2 + shakeX, drawY + this.height / 2 + shakeY);

            if (spinRotation !== 0) {
                ctx.rotate(spinRotation);
            }

            if (!this.facingRight) {
                ctx.scale(-1, 1);
            }

            // キャラクター描画（中心を原点として描画）
            this.renderCharacter(ctx, -this.width / 2, -this.height / 2);

            ctx.restore();

            // デバッグ情報（設定で切り替え可能）
            if (this.showDebugInfo) {
                this.renderDebugInfo(ctx, drawX, drawY);
            }
        } catch (error) {
            console.error('プレイヤー描画エラー:', error);
            // 簡易描画でフォールバック
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    /**
 * キャラクター描画（可愛い丸みを帯びたキャラクター）
     */
    renderCharacter(ctx, x, y) {
        // 無敵状態の場合は点滅効果
        if (this.invulnerable) {
            const blinkRate = 0.1; // 点滅の速度
            const alpha = Math.sin(Date.now() * blinkRate) > 0 ? 0.3 : 1.0;
            ctx.globalAlpha = alpha;
        }

        // 歩行アニメーションの上下動
        const walkBounce = this.animationState === 'walk' ?
            Math.abs(Math.sin(this.animationTime * 10)) * 2 : 0;

        // 現在の高さ
        const currentHeight = this.height;
        const bodyY = y - walkBounce; // 歩行時の上下動

        // 影を描画
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + this.width / 2, y + currentHeight + 2, this.width / 2 - 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 体（丸みを帯びた楕円）
        const bodyColor = this.getCharacterColor();

        // 歩行時の体の傾き
        const bodyTilt = this.animationState === 'walk' ?
            Math.sin(this.animationTime * 10) * 0.1 : 0;

        ctx.save();
        ctx.translate(x + this.width / 2, bodyY + currentHeight / 2 + 6);
        ctx.rotate(bodyTilt);

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2 - 2, currentHeight / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // 体の輪郭線
        ctx.strokeStyle = this.getDarkerColor(bodyColor);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        // 頭（円形）
        const headRadius = 12;
        const headY = bodyY + headRadius + 2;

        // 歩行時の頭の軽い揺れ
        const headBob = this.animationState === 'walk' ?
            Math.sin(this.animationTime * 10) * 1 : 0;

        // 頭の影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 + 1 + headBob, headY + 1, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // 頭
        ctx.fillStyle = '#FFE4E1'; // 肌色（薄いピンク）
        ctx.beginPath();
        ctx.arc(x + this.width / 2 + headBob, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();

        // 頭の輪郭線
        ctx.strokeStyle = '#FFB6C1';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 髪の毛
        ctx.fillStyle = '#8B4513'; // 茶色
        ctx.beginPath();
        ctx.arc(x + this.width / 2 + headBob, headY - 2, headRadius - 1, Math.PI, Math.PI * 2);
        ctx.fill();

        // 髪の毛のハイライト
        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.arc(x + this.width / 2 - 3 + headBob, headY - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // 表情を描画
        this.drawFacialExpression(ctx, x + this.width / 2 + headBob, headY);

        // 手足を描画
        this.drawLimbs(ctx, x, bodyY, currentHeight);

        // 二段ジャンプ可能時のエフェクト
        this.drawDoubleJumpEffect(ctx, x + this.width / 2, bodyY + currentHeight / 2);

        // トリプルジャンプエフェクト描画
        this.drawTripleJumpEffect(ctx, x + this.width / 2, bodyY + currentHeight / 2);

        // 無敵状態の場合はアルファ値をリセット
        if (this.invulnerable) {
            ctx.globalAlpha = 1.0;
        }
    }

    /**
     * キャラクター色取得（統一されたパステルカラー）
     */
    getCharacterColor() {
        // 統一されたキャラクター色（明るい青系）
        return '#87CEEB'; // 薄い青（スカイブルー）
    }

    /**
     * 暗い色を生成
     */
    getDarkerColor(color) {
        const colorMap = {
            '#FFB6C1': '#FF69B4',
            '#FFC0CB': '#FF1493',
            '#FFE4B5': '#FFB347',
            '#DDA0DD': '#9370DB',
            '#87CEEB': '#4682B4'
        };
        return colorMap[color] || '#696969';
    }

    /**
     * 表情描画
     */
    drawFacialExpression(ctx, centerX, centerY) {
        // 状態に応じた表情
        const expression = this.getFacialExpression();

        // 目
        ctx.fillStyle = '#000';

        if (expression.eyeType === 'normal') {
            // 通常の目
            ctx.beginPath();
            ctx.arc(centerX - 4, centerY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 4, centerY - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (expression.eyeType === 'surprised') {
            // 驚いた目
            ctx.beginPath();
            ctx.arc(centerX - 4, centerY - 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 4, centerY - 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (expression.eyeType === 'focused') {
            // 集中した目
            ctx.fillRect(centerX - 6, centerY - 3, 4, 2);
            ctx.fillRect(centerX + 2, centerY - 3, 4, 2);
        }

        // 目のハイライト
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(centerX - 4.5, centerY - 2.5, 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 3.5, centerY - 2.5, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // 鼻（小さな点）
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 1, 0, Math.PI * 2);
        ctx.fill();

        // 口
        ctx.strokeStyle = '#FF69B4';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        if (expression.mouthType === 'smile') {
            // 笑顔
            ctx.beginPath();
            ctx.arc(centerX, centerY + 1, 3, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else if (expression.mouthType === 'open') {
            // 開いた口
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.arc(centerX, centerY + 3, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (expression.mouthType === 'determined') {
            // 決意の口
            ctx.beginPath();
            ctx.moveTo(centerX - 2, centerY + 3);
            ctx.lineTo(centerX + 2, centerY + 3);
            ctx.stroke();
        }

        // 頬の赤み（動いている時）
        if (this.animationState === 'walk' || this.animationState === 'jump') {
            ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
            ctx.beginPath();
            ctx.arc(centerX - 8, centerY + 2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 8, centerY + 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * 状態に応じた表情を取得
     */
    getFacialExpression() {
        if (this.animationState === 'jump') {
            return {
                eyeType: 'surprised',
                mouthType: 'open'
            };
        } else if (this.animationState === 'walk') {
            return {
                eyeType: 'normal',
                mouthType: 'smile'
            };

        } else {
            return {
                eyeType: 'normal',
                mouthType: 'smile'
            };
        }
    }

    /**
 * 手足描画（改良版歩行アニメーション）
 */
    drawLimbs(ctx, x, y, currentHeight) {
        const bodyColor = this.getCharacterColor();
        const limbColor = this.getDarkerColor(bodyColor);

        // 歩行アニメーションの計算
        const walkCycle = this.animationState === 'walk' ? this.animationTime * 10 : 0;
        const armSwing = this.animationState === 'walk' ? Math.sin(walkCycle) * 0.4 : 0;
        const legSwing = this.animationState === 'walk' ? Math.sin(walkCycle) * 0.3 : 0;

        // 腕の描画
        ctx.fillStyle = '#FFE4E1'; // 肌色
        ctx.strokeStyle = limbColor;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // 左腕（右足と連動）
        const leftArmAngle = armSwing;
        const leftArmX = x + 6 + Math.sin(leftArmAngle) * 4;
        const leftArmY = y + 16 + Math.cos(leftArmAngle) * 2;

        ctx.beginPath();
        ctx.moveTo(x + 6, y + 16);
        ctx.lineTo(leftArmX, leftArmY + 8);
        ctx.stroke();

        // 右腕（左足と連動）
        const rightArmAngle = -armSwing;
        const rightArmX = x + this.width - 6 + Math.sin(rightArmAngle) * 4;
        const rightArmY = y + 16 + Math.cos(rightArmAngle) * 2;

        ctx.beginPath();
        ctx.moveTo(x + this.width - 6, y + 16);
        ctx.lineTo(rightArmX, rightArmY + 8);
        ctx.stroke();

        // 手
        ctx.fillStyle = '#FFE4E1';
        ctx.beginPath();
        ctx.arc(leftArmX, leftArmY + 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rightArmX, rightArmY + 8, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 足の描画
        ctx.strokeStyle = limbColor;
        ctx.lineWidth = 3;

        // 左足（腕と逆位相）- 当たり判定内に収める
        const leftLegAngle = -legSwing;
        const leftLegX = x + 8 + Math.sin(leftLegAngle) * 4; // 横の動きを縮小
        const leftLegY = y + currentHeight - 2 + Math.abs(Math.cos(leftLegAngle)) * 2; // 下に出ないよう調整

        ctx.beginPath();
        ctx.moveTo(x + 8, y + currentHeight - 6);
        ctx.lineTo(leftLegX, leftLegY);
        ctx.stroke();

        // 右足（腕と逆位相）- 当たり判定内に収める
        const rightLegAngle = legSwing;
        const rightLegX = x + this.width - 8 + Math.sin(rightLegAngle) * 4; // 横の動きを縮小
        const rightLegY = y + currentHeight - 2 + Math.abs(Math.cos(rightLegAngle)) * 2; // 下に出ないよう調整

        ctx.beginPath();
        ctx.moveTo(x + this.width - 8, y + currentHeight - 6);
        ctx.lineTo(rightLegX, rightLegY);
        ctx.stroke();

        // 足先（靴）- 当たり判定内に収める
        ctx.fillStyle = '#8B4513'; // 茶色の靴

        // 左足の靴
        const leftShoeSize = this.animationState === 'walk' && Math.cos(leftLegAngle) > 0 ? 3.5 : 2.5;
        ctx.beginPath();
        ctx.ellipse(leftLegX, leftLegY, leftShoeSize, 1.5, leftLegAngle * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 右足の靴
        const rightShoeSize = this.animationState === 'walk' && Math.cos(rightLegAngle) > 0 ? 3.5 : 2.5;
        ctx.beginPath();
        ctx.ellipse(rightLegX, rightLegY, rightShoeSize, 1.5, rightLegAngle * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 靴のハイライト
        ctx.fillStyle = '#A0522D';
        ctx.beginPath();
        ctx.ellipse(leftLegX - 0.5, leftLegY - 0.5, 1.2, 0.8, leftLegAngle * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(rightLegX - 0.5, rightLegY - 0.5, 1.2, 0.8, rightLegAngle * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 二段ジャンプエフェクト描画
     */
    drawDoubleJumpEffect(ctx, centerX, centerY) {
        // 二段ジャンプ可能でない場合は描画しない
        if (this.jumpCount === 0 || this.jumpCount >= this.maxJumps) {
            return;
        }

        const currentTime = performance.now();

        // 二段ジャンプ可能時のオーラエフェクト
        if (!this.isGrounded && this.jumpCount === 1) {
            // キラキラオーラ
            ctx.save();

            const auraRadius = 25;
            const sparkleCount = 8;

            for (let i = 0; i < sparkleCount; i++) {
                const angle = (i / sparkleCount) * Math.PI * 2 + currentTime * 0.005;
                const sparkleX = centerX + Math.cos(angle) * auraRadius;
                const sparkleY = centerY + Math.sin(angle) * (auraRadius * 0.6);
                const sparkleSize = 2 + Math.sin(currentTime * 0.01 + i) * 1;
                const alpha = 0.5 + Math.sin(currentTime * 0.008 + i * 0.5) * 0.3;

                // 小さな光る粒子
                ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
                ctx.fill();

                // より小さなハイライト
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, sparkleSize * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // 中央のオーラ
            const auraAlpha = 0.1 + Math.sin(currentTime * 0.01) * 0.05;
            const auraGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 20);
            auraGradient.addColorStop(0, `rgba(173, 216, 230, ${auraAlpha})`);
            auraGradient.addColorStop(1, 'rgba(173, 216, 230, 0)');

            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * トリプルジャンプエフェクト描画
     */
    drawTripleJumpEffect(ctx, centerX, centerY) {
        const currentTime = performance.now();

        // トリプルジャンプ実行中のエフェクト
        if (this.isTripleJumping) {
            const elapsed = currentTime - this.tripleJumpStartTime;
            if (elapsed < this.tripleJumpDuration) {
                ctx.save();

                // レインボーオーラ
                const auraRadius = 35;
                const sparkleCount = 12;

                for (let i = 0; i < sparkleCount; i++) {
                    const angle = (i / sparkleCount) * Math.PI * 2 + currentTime * 0.01;
                    const sparkleX = centerX + Math.cos(angle) * auraRadius;
                    const sparkleY = centerY + Math.sin(angle) * (auraRadius * 0.7);
                    const sparkleSize = 3 + Math.sin(currentTime * 0.02 + i) * 1.5;
                    const alpha = 0.7 + Math.sin(currentTime * 0.015 + i * 0.5) * 0.3;

                    // レインボー色
                    const hue = (i * 30 + currentTime * 0.1) % 360;
                    ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
                    ctx.fill();

                    // ハイライト
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(sparkleX, sparkleY, sparkleSize * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }

                // 中央のレインボーオーラ
                const auraAlpha = 0.2 + Math.sin(currentTime * 0.02) * 0.1;
                const auraGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 30);
                auraGradient.addColorStop(0, `hsla(${(currentTime * 0.1) % 360}, 100%, 70%, ${auraAlpha})`);
                auraGradient.addColorStop(0.5, `hsla(${(currentTime * 0.1 + 180) % 360}, 100%, 70%, ${auraAlpha * 0.5})`);
                auraGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                ctx.fillStyle = auraGradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            } else {
                this.isTripleJumping = false;
            }
        }

        // トリプルジャンプ可能時のエフェクト（レベル2以上）
        if (!this.isGrounded && this.jumpCount === 2 && this.playerLevel >= 2) {
            ctx.save();

            const auraRadius = 30;
            const sparkleCount = 10;

            for (let i = 0; i < sparkleCount; i++) {
                const angle = (i / sparkleCount) * Math.PI * 2 + currentTime * 0.008;
                const sparkleX = centerX + Math.cos(angle) * auraRadius;
                const sparkleY = centerY + Math.sin(angle) * (auraRadius * 0.6);
                const sparkleSize = 2.5 + Math.sin(currentTime * 0.012 + i) * 1;
                const alpha = 0.6 + Math.sin(currentTime * 0.01 + i * 0.4) * 0.3;

                // レインボー色
                const hue = (i * 36 + currentTime * 0.08) % 360;
                ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${alpha})`;
                ctx.beginPath();
                ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // 中央のオーラ
            const auraAlpha = 0.15 + Math.sin(currentTime * 0.012) * 0.05;
            const auraGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 25);
            auraGradient.addColorStop(0, `hsla(${(currentTime * 0.08) % 360}, 80%, 75%, ${auraAlpha})`);
            auraGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * 二段ジャンプ実行時のスピンエフェクト
     */
    applyDoubleJumpSpin() {
        // 二段ジャンプ実行時のスピン情報を記録
        this.isSpinning = true;
        this.spinStartTime = performance.now();
        this.spinDuration = 300; // 300ms
    }

    /**
     * スピンアニメーションの描画
     */
    getSpinRotation() {
        if (!this.isSpinning) return 0;

        const currentTime = performance.now();
        const elapsed = currentTime - this.spinStartTime;

        if (elapsed >= this.spinDuration) {
            this.isSpinning = false;
            return 0;
        }

        // スピンの進行度（0-1）
        const progress = elapsed / this.spinDuration;

        // イージングアウト効果でスピンを減速
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        // 1回転（2π）
        return easedProgress * Math.PI * 2;
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
            ctx.arc(x + this.width / 2, y - 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 速度ベクトル
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + this.width / 2, y + this.height / 2);
        ctx.lineTo(x + this.width / 2 + this.velocityX / 10, y + this.height / 2 + this.velocityY / 10);
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
            height: this.height
        };
    }

    /**
     * レベルデータを読み込み
     */
    loadLevelData() {
        if (typeof window !== 'undefined' && window.gameStorage) {
            const gameData = window.gameStorage.loadGameData();
            if (gameData && gameData.levelSystem) {
                this.playerLevel = gameData.levelSystem.playerLevel || 1;
                this.totalItemsCollected = gameData.levelSystem.totalItemsCollected || 0;
                this.itemsInCurrentLevel = gameData.levelSystem.itemsInCurrentLevel || 0;

                // レベルに応じてmaxJumpsを設定
                this.maxJumps = this.playerLevel >= 2 ? 3 : 2;

                console.log('レベルデータ読み込み完了:', {
                    playerLevel: this.playerLevel,
                    totalItemsCollected: this.totalItemsCollected,
                    itemsInCurrentLevel: this.itemsInCurrentLevel,
                    maxJumps: this.maxJumps
                });
            }
        }
    }

    /**
     * レベルデータを保存
     */
    saveLevelData() {
        if (typeof window !== 'undefined' && window.gameStorage) {
            const gameData = window.gameStorage.loadGameData();

            if (!gameData.levelSystem) {
                gameData.levelSystem = {};
            }

            gameData.levelSystem.playerLevel = this.playerLevel;
            gameData.levelSystem.totalItemsCollected = this.totalItemsCollected;
            gameData.levelSystem.itemsInCurrentLevel = this.itemsInCurrentLevel;

            window.gameStorage.saveGameData(gameData);

            console.log('レベルデータ保存完了:', {
                playerLevel: this.playerLevel,
                totalItemsCollected: this.totalItemsCollected,
                itemsInCurrentLevel: this.itemsInCurrentLevel
            });
        }
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
    let testPlayer = new Player(0, 0);
    console.log('✅ Playerインスタンス作成テスト成功');
    testPlayer = null; // メモリ解放
} catch (error) {
    console.error('❌ Playerインスタンス作成テスト失敗:', error);
}
