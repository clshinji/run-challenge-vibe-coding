/**
 * ゲームデータ保存・読み込み管理
 */
class GameStorage {
    constructor() {
        this.storageKey = 'kidsAdventureGame';
        this.currentPlayer = null;
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
     * 現在のプレイヤー名を設定
     */
    setCurrentPlayer(playerName) {
        this.currentPlayer = playerName;
        console.log('現在のプレイヤーを設定:', playerName);
    }

    /**
     * 現在のプレイヤー名を取得
     */
    getCurrentPlayer() {
        return this.currentPlayer;
    }

    /**
     * 全プレイヤーのデータを取得
     */
    loadAllPlayersData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('全プレイヤーデータ読み込みエラー:', error);
            return {};
        }
    }

    /**
     * 全プレイヤーのデータを保存
     */
    saveAllPlayersData(allData) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
            return true;
        } catch (error) {
            console.error('全プレイヤーデータ保存エラー:', error);
            return false;
        }
    }

    /**
     * ゲームデータを読み込み（現在のプレイヤー用）
     */
    loadGameData() {
        if (!this.currentPlayer) {
            console.warn('プレイヤー名が設定されていません');
            return { ...this.defaultData };
        }

        const allData = this.loadAllPlayersData();

        if (!allData[this.currentPlayer]) {
            console.log(`新しいプレイヤー "${this.currentPlayer}" のデータを作成`);
            const newData = { ...this.defaultData };
            newData.playerName = this.currentPlayer;
            allData[this.currentPlayer] = newData;
            this.saveAllPlayersData(allData);
            return newData;
        }

        // デフォルトデータとマージして不足項目を補完
        return this.mergeWithDefault(allData[this.currentPlayer]);
    }

    /**
     * ゲームデータを保存（現在のプレイヤー用）
     */
    saveGameData(data) {
        if (!this.currentPlayer) {
            console.error('プレイヤー名が設定されていません');
            return false;
        }

        const allData = this.loadAllPlayersData();
        allData[this.currentPlayer] = data;

        return this.saveAllPlayersData(allData);
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
        this.setCurrentPlayer(name);
        const data = this.loadGameData();
        data.playerName = name;

        // 最後にプレイしたプレイヤーとして記録
        this.saveLastPlayer(name);

        return this.saveGameData(data);
    }

    /**
     * 最後にプレイしたプレイヤー名を保存/取得
     */
    saveLastPlayer(playerName) {
        try {
            localStorage.setItem('kidsAdventureLastPlayer', playerName);
        } catch (error) {
            console.error('最後のプレイヤー保存エラー:', error);
        }
    }

    getLastPlayer() {
        try {
            return localStorage.getItem('kidsAdventureLastPlayer') || '';
        } catch (error) {
            console.error('最後のプレイヤー取得エラー:', error);
            return '';
        }
    }

    /**
     * 全プレイヤー名のリストを取得
     */
    getAllPlayerNames() {
        const allData = this.loadAllPlayersData();
        return Object.keys(allData);
    }

    /**
     * プレイヤーデータを削除
     */
    deletePlayerData(playerName) {
        const allData = this.loadAllPlayersData();
        if (allData[playerName]) {
            delete allData[playerName];
            this.saveAllPlayersData(allData);
            console.log(`プレイヤー "${playerName}" のデータを削除しました`);
            return true;
        }
        return false;
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
        if (nextStage <= 20 && !data.progress.unlockedStages.includes(nextStage)) {
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
