/**
 * ゲームデータ保存・読み込み管理
 */

// プレイヤーアイコン選択肢
const PLAYER_ICONS = [
    { id: 'cat', name: '🐱 ねこ', emoji: '🐱' },
    { id: 'dog', name: '🐶 いぬ', emoji: '🐶' },
    { id: 'rabbit', name: '🐰 うさぎ', emoji: '🐰' },
    { id: 'bear', name: '🐻 くま', emoji: '🐻' },
    { id: 'fox', name: '🦊 きつね', emoji: '🦊' },
    { id: 'pig', name: '🐷 ぶた', emoji: '🐷' },
    { id: 'panda', name: '🐼 ぱんだ', emoji: '🐼' },
    { id: 'koala', name: '🐨 こあら', emoji: '🐨' }
];

class GameStorage {
    constructor() {
        this.storageKey = 'kidsAdventureGame';
        this.currentPlayer = null;
        this.defaultData = {
            playerName: '',
            playerIcon: 'cat', // デフォルトアイコン
            settings: {
                music: true,
                sound: true,
                debugInfo: false // デバッグ情報はデフォルトでオフ
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
        if (savedData.playerIcon) merged.playerIcon = savedData.playerIcon;
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
        const validPlayerNames = [];

        for (const [playerName, data] of Object.entries(allData)) {
            if (this.isValidPlayerData(playerName, data)) {
                validPlayerNames.push(playerName);
            }
        }

        return validPlayerNames;
    }

    /**
     * 全プレイヤーの統計情報を取得（一覧表示用）
     */
    getAllPlayersWithStats() {
        const allData = this.loadAllPlayersData();
        const playersWithStats = [];

        for (const [playerName, data] of Object.entries(allData)) {
            // 有効なプレイヤーデータかチェック
            if (!this.isValidPlayerData(playerName, data)) {
                console.warn('無効なプレイヤーデータをスキップ:', playerName);
                continue;
            }

            const playerData = this.mergeWithDefault(data);

            // 総合統計を計算
            const totalScore = playerData.totalStats.totalScore || 0;
            const totalPlayTime = playerData.totalStats.totalPlayTime || 0;
            const completedStagesCount = playerData.progress.completedStages.length;
            const maxStageCleared = completedStagesCount > 0 ?
                Math.max(...playerData.progress.completedStages) : 0;

            playersWithStats.push({
                name: playerName,
                icon: playerData.playerIcon || 'cat',
                totalScore: totalScore,
                completedStagesCount: completedStagesCount,
                maxStageCleared: maxStageCleared,
                totalPlayTime: totalPlayTime,
                totalItemsCollected: playerData.totalStats.totalItemsCollected || 0
            });
        }

        // あいうえお順でソート
        return this.sortPlayersByName(playersWithStats);
    }

    /**
     * 有効なプレイヤーデータかチェック
     */
    isValidPlayerData(playerName, data) {
        // プレイヤー名が無効な場合
        if (!playerName || typeof playerName !== 'string') {
            return false;
        }

        // システム予約語を除外
        const systemKeys = ['playerName', 'progress', 'settings', 'totalStats', 'stages', 'data', 'game'];
        if (systemKeys.includes(playerName)) {
            return false;
        }

        // データが空またはnull
        if (!data || typeof data !== 'object') {
            return false;
        }

        // 必要なプロパティが存在しない場合は自動補完を試みる
        // プレイヤー名が文字列で、データがオブジェクトなら有効とみなす
        return true;
    }

    /**
     * 無効なプレイヤーデータをクリーンアップ
     */
    cleanupInvalidPlayerData() {
        const allData = this.loadAllPlayersData();
        const cleanedData = {};
        let hasChanges = false;

        for (const [playerName, data] of Object.entries(allData)) {
            if (this.isValidPlayerData(playerName, data)) {
                cleanedData[playerName] = data;
            } else {
                console.log('無効なプレイヤーデータを削除:', playerName);
                hasChanges = true;
            }
        }

        if (hasChanges) {
            console.log('プレイヤーデータをクリーンアップしました');
            this.saveAllPlayersData(cleanedData);
            return true;
        }

        return false;
    }

    /**
     * プレイヤー一覧をあいうえお順でソート
     */
    sortPlayersByName(players) {
        return players.sort((a, b) => {
            return a.name.localeCompare(b.name, 'ja', {
                sensitivity: 'base',
                numeric: true
            });
        });
    }

    /**
     * プレイヤーアイコンを更新
     */
    updatePlayerIcon(playerName, iconId) {
        // アイコンIDが有効かチェック
        const validIcon = PLAYER_ICONS.find(icon => icon.id === iconId);
        if (!validIcon) {
            console.error('無効なアイコンID:', iconId);
            return false;
        }

        const allData = this.loadAllPlayersData();
        if (!allData[playerName]) {
            console.error('プレイヤーが見つかりません:', playerName);
            return false;
        }

        allData[playerName].playerIcon = iconId;
        const success = this.saveAllPlayersData(allData);

        if (success) {
            console.log(`プレイヤー "${playerName}" のアイコンを "${iconId}" に更新しました`);
        }

        return success;
    }

    /**
     * プレイヤーのアイコンを取得
     */
    getPlayerIcon(playerName) {
        const allData = this.loadAllPlayersData();
        if (allData[playerName]) {
            return allData[playerName].playerIcon || 'cat';
        }
        return 'cat'; // デフォルト
    }

    /**
     * 利用可能なアイコン一覧を取得
     */
    getAvailableIcons() {
        return [...PLAYER_ICONS]; // コピーを返す
    }

    /**
     * アイコン情報をIDで取得
     */
    getIconById(iconId) {
        return PLAYER_ICONS.find(icon => icon.id === iconId) || PLAYER_ICONS[0];
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

// グローバルアクセス用の定数
window.PLAYER_ICONS = PLAYER_ICONS;
