/**
 * ゲームデータ保存・読み込み管理
 */
class GameStorage {
    constructor() {
        this.storageKey = 'kidsAdventureGame';
        this.defaultData = {
            playerName: '',
            settings: {
                music: true,
                sound: true
            },
            progress: {
                unlockedStages: [1], // 最初はステージ1のみ解放
                completedStages: [],
                stageStats: {} // ステージごとの統計
            },
            totalStats: {
                totalPlayTime: 0,
                totalScore: 0,
                totalItemsCollected: 0
            }
        };
    }

    /**
     * ゲームデータを読み込み
     */
    loadGameData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                // デフォルトデータとマージして不足項目を補完
                return this.mergeWithDefault(data);
            }
        } catch (error) {
            console.warn('セーブデータの読み込みに失敗しました:', error);
        }
        return { ...this.defaultData };
    }

    /**
     * ゲームデータを保存
     */
    saveGameData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('セーブデータの保存に失敗しました:', error);
            return false;
        }
    }

    /**
     * デフォルトデータと保存データをマージ
     */
    mergeWithDefault(savedData) {
        const merged = { ...this.defaultData };
        
        if (savedData.playerName) merged.playerName = savedData.playerName;
        if (savedData.settings) merged.settings = { ...merged.settings, ...savedData.settings };
        if (savedData.progress) merged.progress = { ...merged.progress, ...savedData.progress };
        if (savedData.totalStats) merged.totalStats = { ...merged.totalStats, ...savedData.totalStats };
        
        return merged;
    }

    /**
     * プレイヤー名を保存
     */
    savePlayerName(name) {
        const data = this.loadGameData();
        data.playerName = name;
        return this.saveGameData(data);
    }

    /**
     * 設定を保存
     */
    saveSettings(settings) {
        const data = this.loadGameData();
        data.settings = { ...data.settings, ...settings };
        return this.saveGameData(data);
    }

    /**
     * ステージクリア情報を保存
     */
    saveStageCompletion(stageNumber, stats) {
        console.log(`ステージ${stageNumber}クリア情報保存開始:`, stats);
        const data = this.loadGameData();
        
        // ステージクリア記録
        if (!data.progress.completedStages.includes(stageNumber)) {
            data.progress.completedStages.push(stageNumber);
            console.log(`ステージ${stageNumber}をクリア済みに追加`);
        }
        
        // 次のステージを解放
        const nextStage = stageNumber + 1;
        if (nextStage <= 5 && !data.progress.unlockedStages.includes(nextStage)) {
            data.progress.unlockedStages.push(nextStage);
            console.log(`ステージ${nextStage}を解放`);
        }
        
        // ステージ統計を更新
        const currentStats = data.progress.stageStats[stageNumber] || {
            bestTime: Infinity,
            bestScore: 0,
            maxItemsCollected: 0,
            playCount: 0
        };
        
        currentStats.playCount++;
        if (stats.time < currentStats.bestTime) currentStats.bestTime = stats.time;
        if (stats.score > currentStats.bestScore) currentStats.bestScore = stats.score;
        if (stats.itemsCollected > currentStats.maxItemsCollected) {
            currentStats.maxItemsCollected = stats.itemsCollected;
        }
        
        data.progress.stageStats[stageNumber] = currentStats;
        
        // 総合統計を更新
        data.totalStats.totalPlayTime += stats.time;
        data.totalStats.totalScore += stats.score;
        data.totalStats.totalItemsCollected += stats.itemsCollected;
        
        return this.saveGameData(data);
    }

    /**
     * ステージが解放されているかチェック
     */
    isStageUnlocked(stageNumber) {
        const data = this.loadGameData();
        return data.progress.unlockedStages.includes(stageNumber);
    }

    /**
     * ステージがクリア済みかチェック
     */
    isStageCompleted(stageNumber) {
        const data = this.loadGameData();
        return data.progress.completedStages.includes(stageNumber);
    }

    /**
     * ステージの統計情報を取得
     */
    getStageStats(stageNumber) {
        const data = this.loadGameData();
        return data.progress.stageStats[stageNumber] || {
            bestTime: null,
            bestScore: 0,
            maxItemsCollected: 0,
            playCount: 0
        };
    }

    /**
     * 全データをリセット
     */
    resetAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('データリセットに失敗しました:', error);
            return false;
        }
    }

    /**
     * データのエクスポート（デバッグ用）
     */
    exportData() {
        return this.loadGameData();
    }

    /**
     * データのインポート（デバッグ用）
     */
    importData(data) {
        return this.saveGameData(data);
    }
}

// グローバルインスタンス
const gameStorage = new GameStorage();
