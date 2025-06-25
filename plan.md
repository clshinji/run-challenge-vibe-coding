# Amazon Q Developer CLI でゲームを作ってみる

## 何を作るか
* 子どもがタブレットで遊べる Web ベースのアプリ
* 対象年齢は3歳〜8歳くらい
* **横スクロールアクションゲーム**

## ゲーム詳細設計

### ゲームコンセプト
* 可愛いキャラクターが横スクロールステージを進むアクションゲーム
* 敵を倒すのではなく、アイテム収集と障害物回避がメイン
* ステージクリア型で達成感を味わえる構成

### 基本操作
* **移動**: 左右矢印キー または A/Dキー （タブレット: 左右タップ）
* **ジャンプ**: スペースキー または 上矢印キー （タブレット: 上タップ）
* **しゃがみ**: 下矢印キー または Sキー （タブレット: 下タップ）

### ゲーム要素
* **プレイヤーキャラ**: 動物系の可愛いキャラクター（猫、うさぎなど）
* **収集アイテム**: 星、コイン、フルーツなど
* **障害物**: 穴、低い壁（しゃがんで通過）、高い壁（ジャンプで回避）
* **ゴール**: 各ステージの最後にある旗やドア

### ステージ構成
* **ステージ1**: チュートリアル兼簡単なステージ
* **ステージ2-5**: 段階的に難易度上昇
* **各ステージ**: 2-3分でクリア可能な長さ

### プレイヤー管理機能
* **ユーザー名登録**: ゲーム開始時に名前入力
* **進捗保存**: ステージクリア状況、収集アイテム数
* **スコア管理**: 各ステージのベストタイム、収集率
* **データ保存**: localStorage使用（シンプルなJSON形式）

## 要件
### 操作性・UI/UX
* タップやドラッグなど直感的で簡単な操作のみ
* 大きなボタンとアイコンで誤操作を防ぐ
* 色彩豊かで視覚的に分かりやすいデザイン
* テキストは最小限に抑え、絵や音でガイド

### ゲーム性
* 1回のプレイ時間は3〜10分程度
* 段階的に難易度が上がる仕組み
* 成功時の達成感を与える演出（音・アニメーション）
* 失敗してもネガティブにならない設計

### 学習要素
* 数字、色、形、パターン認識などの知育要素
* 記憶力や集中力を鍛える要素
* 手と目の協調性を育む操作

### 技術要件
* レスポンシブデザイン（タブレット・スマホ対応）
* オフラインでも動作可能
* ロード時間を最小限に
* 広告や課金要素なし（安全性重視）

### コンテンツ・演出
* 楽しい効果音とBGM
* カラフルで親しみやすいキャラクター
* スムーズなアニメーション
* 保護者も一緒に楽しめる要素

## 技術仕様

### 使用技術
* **フロントエンド**: HTML5, CSS3, JavaScript (ES6+)
* **ゲームエンジン**: HTML5 Canvas + JavaScript（軽量化重視）
* **音声**: Web Audio API
* **データ保存**: localStorage + AWS DynamoDB（オプション）
* **UI フレームワーク**: Vanilla JS（シンプルさ重視）
* **デプロイ**: AWS S3 + CloudFront + Route53
* **IaC (Infrastructure as Code)**: AWS CDK (TypeScript)

### AWS インフラ構成
* **S3 Bucket**: 静的ウェブサイトホスティング
* **CloudFront**: CDN配信（高速化・キャッシュ）
* **Route53**: カスタムドメイン設定（オプション）
* **DynamoDB**: プレイヤーデータ永続化（オプション）
* **API Gateway + Lambda**: プレイヤーデータAPI（オプション）

### デプロイメント戦略
#### 基本版（静的サイトのみ）
```
Internet → CloudFront → S3 Bucket
```
- プレイヤーデータ: localStorage のみ
- 完全にサーバーレス、コスト最小

#### 拡張版（クラウドデータ保存）
```
Internet → CloudFront → S3 Bucket
             ↓
        API Gateway → Lambda → DynamoDB
```
- プレイヤーデータ: localStorage + DynamoDB
- 複数デバイス間でのデータ同期可能

### ファイル構成
```
/
├── frontend/              # フロントエンド（ゲーム本体）
│   ├── index.html         # メインHTML
│   ├── css/
│   │   ├── style.css      # 基本スタイル
│   │   └── game.css       # ゲーム画面スタイル
│   ├── js/
│   │   ├── main.js        # メイン処理
│   │   ├── game.js        # ゲームロジック
│   │   ├── player.js      # プレイヤー管理
│   │   ├── character.js   # キャラクター制御
│   │   ├── stage.js       # ステージ管理
│   │   └── aws-api.js     # AWS API通信（拡張版）
│   ├── assets/
│   │   ├── images/        # 画像ファイル
│   │   └── sounds/        # 音声ファイル
│   └── data/
│       └── stages.json    # ステージデータ
├── infrastructure/        # AWS CDK インフラ定義
│   ├── package.json       # CDK依存関係
│   ├── tsconfig.json      # TypeScript設定
│   ├── cdk.json           # CDK設定
│   ├── bin/
│   │   └── app.ts         # CDKアプリエントリーポイント
│   ├── lib/
│   │   ├── game-stack.ts  # メインスタック
│   │   ├── frontend-stack.ts  # フロントエンド（S3+CloudFront）
│   │   └── backend-stack.ts   # バックエンド（API+DynamoDB）【拡張版】
│   └── lambda/            # Lambda関数（拡張版）
│       └── player-api/
│           ├── index.ts
│           └── package.json
├── scripts/
│   ├── deploy.sh          # デプロイスクリプト
│   └── build.sh           # ビルドスクリプト
└── README.md
```

### AWS CDK 設定例
#### メインスタック (infrastructure/lib/game-stack.ts)
```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FrontendStack } from './frontend-stack';
import { BackendStack } from './backend-stack';

export class GameStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // フロントエンドスタック（S3 + CloudFront）
    const frontend = new FrontendStack(this, 'Frontend', {
      bucketName: `q-game-${this.account}-${this.region}`,
    });

    // バックエンドスタック（DynamoDB + API Gateway + Lambda）【拡張版】
    const backend = new BackendStack(this, 'Backend', {
      corsOrigin: frontend.distribution.distributionDomainName,
    });

    // 出力
    new cdk.CfnOutput(this, 'GameUrl', {
      value: `https://${frontend.distribution.distributionDomainName}`,
      description: 'Game URL',
    });
  }
}
```

#### フロントエンドスタック (infrastructure/lib/frontend-stack.ts)
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export interface FrontendStackProps {
  bucketName: string;
}

export class FrontendStack extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FrontendStackProps) {
    super(scope, id);

    // S3バケット作成
    this.bucket = new s3.Bucket(this, 'GameBucket', {
      bucketName: props.bucketName,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'GameDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
    });

    // デプロイメント
    new s3deploy.BucketDeployment(this, 'GameDeployment', {
      sources: [s3deploy.Source.asset('../frontend')],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
    });
  }
}
```

#### CDK設定 (infrastructure/cdk.json)
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true
  }
}
```

### プレイヤーデータ構造
#### localStorage版
```javascript
{
  "playerName": "たろう",
  "createdAt": "2024-01-01T12:00:00Z",
  "lastPlayedAt": "2024-01-01T12:30:00Z",
  "stages": {
    "1": { "cleared": true, "bestTime": 45, "items": 10 },
    "2": { "cleared": false, "bestTime": null, "items": 7 }
  },
  "totalScore": 1500,
  "totalPlayTime": 1800
}
```

#### DynamoDB版（拡張）
```javascript
// Primary Key: playerName
{
  "playerName": "たろう",
  "playerData": {
    "createdAt": "2024-01-01T12:00:00Z",
    "lastPlayedAt": "2024-01-01T12:30:00Z",
    "stages": { /* 同上 */ },
    "totalScore": 1500,
    "totalPlayTime": 1800
  },
  "ttl": 1735689600  // 1年後の自動削除
}
```

## 開発フェーズ
1. **Phase 1**: 基本的なプレイヤー移動とジャンプ
2. **Phase 2**: ステージ1の作成（シンプルな障害物）
3. **Phase 3**: アイテム収集システム
4. **Phase 4**: プレイヤー管理機能（localStorage版）
5. **Phase 5**: 追加ステージとUI改善
6. **Phase 6**: 音響効果と最終調整
7. **Phase 7**: AWS CDK セットアップとデプロイ
8. **Phase 8**: クラウドデータ保存（DynamoDB + API Gateway + Lambda）【拡張版】

## CDK デプロイコマンド
```bash
# CDKプロジェクト初期化
cd infrastructure
npm install
npm run build

# 初回デプロイ（AWSアカウントのブートストラップ）
cdk bootstrap

# デプロイ
cdk deploy

# 差分確認
cdk diff

# リソース削除
cdk destroy
```