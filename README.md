# yokonagashid

## これは何

Discordのメッセージを指定したWebhookに転送するボット  

## 背景

当然だけど（？）n8nには、Discordのメッセージ受信をトリガーとする機能はない。  
ので、n8nのWebhookトリガーにDiscordのメッセージを流し込むためのボットが欲しかった。

## 設定

`.envrc.example` を参照

## Docker

### イメージのビルド

```bash
docker build -t yokonagashid:latest .
```

### Docker Compose 運用例

`docker compose` を使う場合は `.env.example` を `.env` にコピーして値を設定。

```yml
services:
  yokonagashid:
    image: ghcr.io/stoneream/yokonagashid:latest
    pull_policy: always
    restart: unless-stopped
    init: true
    env_file:
      - .env
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

## features

- Dependabotによる依存関係の自動更新
- GitHub ActionsによるCI/CD
- Dockerイメージの公開
