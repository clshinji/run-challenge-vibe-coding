#!/bin/bash

# システムパッケージの更新
sudo apt-get update

# Gitのデフォルトブランチ設定
git config --global init.defaultBranch main

# 必要なツールのインストール
sudo apt-get install -y curl unzip

# Amazon Q Developer CLI のダウンロードとインストール
curl --proto '=https' --tlsv1.2 -sSf "https://desktop-release.q.us-east-1.amazonaws.com/latest/q-aarch64-linux.zip" -o q.zip
unzip q.zip
bash q/install.sh
rm -rf q.zip q

# Gemini CLIのインストール
npm install -g @google/gemini-cli
