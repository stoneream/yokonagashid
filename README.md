# yokonagashid

## これは何

Discordのメッセージを指定したWebhookに転送するボット  

## 背景

当然だけど（？）n8nには、Discordのメッセージ受信をトリガーとする機能はない。  
ので、n8nのWebhookトリガーにDiscordのメッセージを流し込むためのボットが欲しかった。

## 設定

`.envrc.example` を参照。

## Docker

### イメージのビルド

```bash
docker build -t yokonagashid:latest .
```

## features

- Dependabotによる依存関係の自動更新
- GitHub ActionsによるCI/CD
- Dockerイメージの公開
