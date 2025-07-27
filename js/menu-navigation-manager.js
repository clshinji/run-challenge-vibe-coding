/**
 * メニューナビゲーション管理クラス
 * ゲームパッドによるメニュー画面の操作を統合管理
 */
class MenuNavigationManager {
    constructor() {
        console.log('=== MenuNavigationManager初期化開始 ===');
        
        // 現在の状態
        this.isEnabled = true;
        this.currentScreen = null;
        this.focusableElements = [];
        this.currentFocusIndex = -1;
        this.gridMode = false; // グリッド形式の画面かどうか
        
        // グリッド設定
        this.gridColumns = 1;
        this.gridRows = 1;
        
        // フォーカス状態管理
        this.focusedElement = null;
        this.focusClassName = 'gamepad-focused';
        this.isInitialFocus = false; // 初期フォーカス中かどうか
        
        // 入力のデバウンス
        this.lastInputTime = 0;
        this.inputDelay = 200; // ミリ秒
        this.lastActivationTime = 0;
        this.activationDelay = 300; // ミリ秒
        
        // 画面別設定
        this.screenConfigs = this.createScreenConfigs();
        
        console.log('✅ MenuNavigationManager初期化完了');
    }
    
    /**
     * 画面別設定を作成
     */
    createScreenConfigs() {
        return {
            titleScreen: {
                selectors: ['.game-button', '#editPlayerNameButton'],
                defaultFocus: '#startButton',
                gridMode: false,
                backAction: null // タイトル画面では戻る操作なし
            },
            stageSelectScreen: {
                selectors: ['.stage-button:not(.locked)', '#stageBackButton'],
                defaultFocus: '.stage-button:not(.locked)',
                gridMode: true,
                gridSelector: '.stage-button:not(.locked)',
                backAction: () => this.triggerBackButton('#stageBackButton')
            },
            settingsScreen: {
                selectors: ['.toggle-button', '.action-button', 'input[type="range"]', '#settingsBackButton'],
                defaultFocus: '#musicToggle',
                gridMode: false,
                backAction: () => this.triggerBackButton('#settingsBackButton')
            },
            playerListScreen: {
                selectors: ['.player-card', '.game-button'],
                defaultFocus: '.player-card.selected',
                gridMode: false,
                backAction: () => this.triggerBackButton('#playerListBackButton')
            },
            nameInputScreen: {
                selectors: ['#playerNameInput', '#nameConfirmButton', '#nameBackButton'],
                defaultFocus: '#playerNameInput',
                gridMode: false,
                backAction: () => this.triggerBackButton('#nameBackButton')
            },
            editNameScreen: {
                selectors: ['#editPlayerNameInput', '.edit-icon-option', '#confirmEditNameButton', '#cancelEditNameButton'],
                defaultFocus: '#editPlayerNameInput',
                gridMode: false,
                backAction: () => this.triggerBackButton('#cancelEditNameButton')
            },
            pauseScreen: {
                selectors: ['.game-button'],
                defaultFocus: '#resumeButton',
                gridMode: false,
                backAction: () => this.triggerBackButton('#resumeButton')
            },
            clearScreen: {
                selectors: ['.game-button'],
                defaultFocus: '#nextStageButton',
                gridMode: false,
                backAction: () => this.triggerBackButton('#clearBackButton')
            },
            gameOverScreen: {
                selectors: ['.game-button'],
                defaultFocus: '#retryButton',
                gridMode: false,
                backAction: () => this.triggerBackButton('#gameOverBackButton')
            },
            statsScreen: {
                selectors: ['.share-button', '.action-button', '#statsBackButton'],
                defaultFocus: '#statsBackButton', // 戻るボタンを最初のフォーカスに変更
                gridMode: false,
                backAction: () => this.triggerBackButton('#statsBackButton')
            }
        };
    }
    
    /**
     * 画面のナビゲーション初期化
     */
    initializeForScreen(screenId) {
        console.log(`🎮 画面ナビゲーション初期化: ${screenId}`);
        
        this.currentScreen = screenId;
        this.clearFocus();
        
        const config = this.screenConfigs[screenId];
        if (!config) {
            console.warn(`⚠️ 画面設定が見つかりません: ${screenId}`);
            return;
        }
        
        // フォーカス可能要素を収集
        this.collectFocusableElements(config);
        
        // グリッドモード設定
        this.setupGridMode(config);
        
        // デフォルトフォーカス設定
        this.setDefaultFocus(config);
        
        console.log(`✅ ナビゲーション初期化完了: ${this.focusableElements.length}個の要素`);
    }
    
    /**
     * フォーカス可能要素を収集
     */
    collectFocusableElements(config) {
        this.focusableElements = [];
        
        config.selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // 表示されていて、無効化されていない要素のみ
                if (this.isElementFocusable(element)) {
                    this.focusableElements.push(element);
                }
            });
        });
        
        console.log(`フォーカス可能要素収集: ${this.focusableElements.length}個`, 
                   this.focusableElements.map(el => el.id || el.className));
    }
    
    /**
     * 要素がフォーカス可能かチェック
     */
    isElementFocusable(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               !element.disabled &&
               element.offsetParent !== null;
    }
    
    /**
     * グリッドモード設定
     */
    setupGridMode(config) {
        this.gridMode = config.gridMode;
        
        if (this.gridMode && config.gridSelector) {
            const gridElements = document.querySelectorAll(config.gridSelector);
            
            // グリッドのサイズを自動検出
            if (gridElements.length > 0) {
                const firstElement = gridElements[0];
                const parent = firstElement.parentElement;
                const parentRect = parent.getBoundingClientRect();
                const elementRect = firstElement.getBoundingClientRect();
                
                // 横並びの要素数を計算
                this.gridColumns = Math.floor(parentRect.width / elementRect.width);
                this.gridRows = Math.ceil(gridElements.length / this.gridColumns);
                
                console.log(`グリッドモード設定: ${this.gridColumns}列 × ${this.gridRows}行`);
            }
        }
    }
    
    /**
     * デフォルトフォーカス設定
     */
    setDefaultFocus(config) {
        if (this.focusableElements.length === 0) return;
        
        let defaultElement = null;
        
        // デフォルトフォーカス要素を検索
        if (config.defaultFocus) {
            defaultElement = document.querySelector(config.defaultFocus);
            if (defaultElement && this.focusableElements.includes(defaultElement)) {
                this.currentFocusIndex = this.focusableElements.indexOf(defaultElement);
            }
        }
        
        // デフォルト要素が見つからない場合は最初の要素
        if (this.currentFocusIndex === -1 && this.focusableElements.length > 0) {
            this.currentFocusIndex = 0;
        }
        
        // 初期フォーカスフラグを設定してスクロールを制御
        this.isInitialFocus = true;
        this.applyFocus();
        this.isInitialFocus = false;
    }
    
    /**
     * 入力処理（GamepadManagerから呼び出される）
     */
    handleInput(direction, isPressed) {
        if (!this.isEnabled || !isPressed || this.focusableElements.length === 0) {
            return;
        }
        
        // デバウンス処理
        const now = Date.now();
        if (now - this.lastInputTime < this.inputDelay) {
            return;
        }
        this.lastInputTime = now;
        
        console.log(`🎮 メニュー入力: ${direction}`);
        
        switch (direction) {
            case 'up':
                this.moveFocus(-1, 0);
                break;
            case 'down':
                this.moveFocus(1, 0);
                break;
            case 'left':
                this.moveFocus(0, -1);
                break;
            case 'right':
                this.moveFocus(0, 1);
                break;
            case 'confirm': // Aボタン
                this.activateCurrentElement();
                break;
            case 'back': // Bボタン
                this.handleBackAction();
                break;
        }
    }
    
    /**
     * フォーカス移動
     */
    moveFocus(verticalDelta, horizontalDelta) {
        if (this.focusableElements.length === 0) return;
        
        const oldIndex = this.currentFocusIndex;
        
        if (this.gridMode) {
            this.moveGridFocus(verticalDelta, horizontalDelta);
        } else {
            this.moveLinearFocus(verticalDelta + horizontalDelta);
        }
        
        if (oldIndex !== this.currentFocusIndex) {
            this.applyFocus();
            console.log(`フォーカス移動: ${oldIndex} → ${this.currentFocusIndex}`);
        }
    }
    
    /**
     * グリッド形式でのフォーカス移動
     */
    moveGridFocus(verticalDelta, horizontalDelta) {
        const currentRow = Math.floor(this.currentFocusIndex / this.gridColumns);
        const currentCol = this.currentFocusIndex % this.gridColumns;
        
        let newRow = currentRow + verticalDelta;
        let newCol = currentCol + horizontalDelta;
        
        // 範囲内に制限
        newRow = Math.max(0, Math.min(this.gridRows - 1, newRow));
        newCol = Math.max(0, Math.min(this.gridColumns - 1, newCol));
        
        const newIndex = newRow * this.gridColumns + newCol;
        
        // 有効なインデックスかチェック
        if (newIndex >= 0 && newIndex < this.focusableElements.length) {
            this.currentFocusIndex = newIndex;
        }
    }
    
    /**
     * 線形でのフォーカス移動
     */
    moveLinearFocus(delta) {
        this.currentFocusIndex += delta;
        
        // 循環移動
        if (this.currentFocusIndex >= this.focusableElements.length) {
            this.currentFocusIndex = 0;
        } else if (this.currentFocusIndex < 0) {
            this.currentFocusIndex = this.focusableElements.length - 1;
        }
    }
    
    /**
     * フォーカス適用
     */
    applyFocus() {
        // 既存のフォーカスをクリア
        this.clearFocus();
        
        if (this.currentFocusIndex >= 0 && this.currentFocusIndex < this.focusableElements.length) {
            this.focusedElement = this.focusableElements[this.currentFocusIndex];
            this.focusedElement.classList.add(this.focusClassName);
            
            // スクロール位置調整（初期フォーカス時は除く）
            if (!this.isInitialFocus) {
                this.scrollToElement(this.focusedElement);
            }
            
            console.log(`フォーカス適用:`, this.focusedElement.id || this.focusedElement.className);
        }
    }
    
    /**
     * フォーカスクリア
     */
    clearFocus() {
        if (this.focusedElement) {
            this.focusedElement.classList.remove(this.focusClassName);
            this.focusedElement = null;
        }
        
        // 全ての要素からフォーカスクラスを削除（安全性のため）
        document.querySelectorAll(`.${this.focusClassName}`).forEach(element => {
            element.classList.remove(this.focusClassName);
        });
    }
    
    /**
     * 要素までスクロール
     */
    scrollToElement(element) {
        // 要素が画面に表示されているかチェック
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        if (rect.top < 0 || rect.bottom > windowHeight) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    }
    
    /**
     * 現在の要素をアクティベート
     */
    activateCurrentElement() {
        if (!this.focusedElement) return;
        
        // アクティベーションのデバウンス処理
        const now = Date.now();
        if (now - this.lastActivationTime < this.activationDelay) {
            console.log(`🎮 アクティベーション制限中 (${this.activationDelay}ms)`);
            return;
        }
        this.lastActivationTime = now;
        
        console.log(`🎮 要素アクティベート:`, this.focusedElement.id || this.focusedElement.className);
        
        // 要素の種類に応じて適切なアクションを実行
        if (this.focusedElement.tagName === 'BUTTON') {
            this.focusedElement.click();
        } else if (this.focusedElement.tagName === 'INPUT') {
            this.focusedElement.focus();
        } else if (this.focusedElement.classList.contains('player-card')) {
            this.focusedElement.click();
        } else {
            // デフォルトはクリックイベント
            this.focusedElement.click();
        }
    }
    
    /**
     * 戻るアクション処理
     */
    handleBackAction() {
        const config = this.screenConfigs[this.currentScreen];
        
        if (config && config.backAction) {
            console.log(`🎮 戻るアクション実行: ${this.currentScreen}`);
            config.backAction();
        } else {
            console.log(`🎮 戻るアクションなし: ${this.currentScreen}`);
        }
    }
    
    /**
     * 戻るボタンをトリガー
     */
    triggerBackButton(buttonSelector) {
        const button = document.querySelector(buttonSelector);
        if (button && button.offsetParent !== null) {
            button.click();
        }
    }
    
    /**
     * ナビゲーション有効/無効切り替え
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (!enabled) {
            this.clearFocus();
        }
        
        console.log(`🎮 メニューナビゲーション: ${enabled ? '有効' : '無効'}`);
    }
    
    /**
     * 現在のフォーカス情報を取得
     */
    getCurrentFocus() {
        return {
            screen: this.currentScreen,
            elementIndex: this.currentFocusIndex,
            element: this.focusedElement,
            totalElements: this.focusableElements.length
        };
    }
    
    /**
     * フォーカス可能要素を手動で追加
     */
    addFocusableElement(element) {
        if (this.isElementFocusable(element) && !this.focusableElements.includes(element)) {
            this.focusableElements.push(element);
            console.log(`フォーカス要素追加:`, element.id || element.className);
        }
    }
    
    /**
     * フォーカス可能要素を手動で削除
     */
    removeFocusableElement(element) {
        const index = this.focusableElements.indexOf(element);
        if (index !== -1) {
            this.focusableElements.splice(index, 1);
            
            // 現在のフォーカスインデックスを調整
            if (this.currentFocusIndex >= index) {
                this.currentFocusIndex = Math.max(0, this.currentFocusIndex - 1);
            }
            
            console.log(`フォーカス要素削除:`, element.id || element.className);
        }
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            isEnabled: this.isEnabled,
            currentScreen: this.currentScreen,
            focusableElementsCount: this.focusableElements.length,
            currentFocusIndex: this.currentFocusIndex,
            gridMode: this.gridMode,
            gridDimensions: { columns: this.gridColumns, rows: this.gridRows },
            focusedElement: this.focusedElement ? {
                id: this.focusedElement.id,
                className: this.focusedElement.className,
                tagName: this.focusedElement.tagName
            } : null
        };
    }
    
    /**
     * 破棄処理
     */
    destroy() {
        console.log('MenuNavigationManager破棄開始');
        
        this.clearFocus();
        this.focusableElements = [];
        this.currentScreen = null;
        this.focusedElement = null;
        
        console.log('MenuNavigationManager破棄完了');
    }
}

// グローバルスコープに登録
if (typeof window !== 'undefined') {
    window.MenuNavigationManager = MenuNavigationManager;
    console.log('✅ MenuNavigationManagerクラスをwindowに登録完了');
} else {
    console.error('❌ windowオブジェクトが利用できません');
}

console.log('=== menu-navigation-manager.js読み込み完了 ===');