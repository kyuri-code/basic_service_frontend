# React ToDoアプリケーション

このアプリケーションは、Reactで構築されたシンプルなToDoアプリです。ユーザーはタスクの作成、更新、削除、管理を行うことができ、各タスクに関連するコメントを追加することもできます。また、タスクの完了状況を追跡することができます。

## 目次

- [制約](#制約)
- [機能](#機能)
- [インストール](#インストール)
- [APIエンドポイント](#apiエンドポイント)
- [使用技術](#使用技術)

## 制約
Windowsで実施する場合は、WSL2のセットアップを完了するようにしてください。
プロジェクト用の端末を使用している場合は、使用しないようにしてください。
WSL2のセットアップはOS自体の設定を変更してしまうので、推奨しないです。
下記リンクが参考になると思います。Windows11ですが、10でも参考になるかと思います。
[参考](https://note.com/hiro20180901/n/nc798a07485e2)


## 機能

- **タスクの作成**: ユーザーはタイトルと説明を入力して新しいタスクを作成できます。
- **タスクの更新**: 既存のタスクの詳細を更新できます。
- **タスクの削除**: タスクを削除できます。削除されたタスクはデータベースから削除されます。
- **タスクの完了**: タスクを完了としてマークし、視覚的に完了状態を表示します。
- **コメントの追加**: ユーザーはタスクにコメントを追加でき、各コメントにはタイムスタンプが含まれます。
- **エラーハンドリング**: 操作が失敗した場合、エラーメッセージが表示されます。
- **レスポンシブデザイン**: UIは、さまざまなデバイスで見やすく、ユーザーフレンドリーに設計されています。

## インストール

このアプリケーションをローカル環境で実行するには、以下の手順に従ってください。

1. **nodejsとnpmのインストール**
```bash
    # nodejsのインストール
    sudo apt-get update
    sudo apt-get isntall nodejs npm

    # インストールされたか確認
    node -v
    npm -v
```

2. **リポジトリのクローン**
```bash
    git clone https://github.com/kyuri-code/basic_service_frontend.git
    cd basic_service_frontend
```

3. **依存関係のインストール**: Node.jsがインストールされていることを確認してください。その後、以下のコマンドを実行します。
```bash
    # アプリで使用しているライブラリをインストールするコマンド
    npm install
```

4. **Webサーバの起動**
- WebアプリのBuild
```bash
    # reactのアプリをbuildする
    # buildすることによって、カレントディレクトリに/buildディレクトリが作成される
    # buildディレクトリ配下にコンパイルされたフロントエンドのコードが作成されている
    npm run build
```

- WebServerのソフトのインストール
Ngxinをインストールする
```bash
    # nginxのインストール
    # installしたタイミングでnginxのWebServerは起動することになる
    apt-get update
    apt-get install nginx

    # nginxの起動確認
    # 「running」が確認できればNginxは起動している
    sudo systemctl status nginx.service
    Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
        Active: active (running) since Tue 2024-08-27 15:40:56 JST; 50s ago
```

- 作成したアプリをNginxにのっける
```bash
    # reactで作成したアプリをnginxに配備
    # Frontendのアプリのルートディレクトリに移動
    # "npm run build"で生成したbuildファイルをnginxの管理ディレクトリにコピーする
    sudo cp -r ./build/* /var/www/html
```

- リバースプロキシの設定
このままではまだ、APIサーバに対してアクセスすることができないず、タスクの登録ができない。
Nginxの設定で適切なリバースプロキシの設定を行う。
```bash
    # /etc/nginx/nginx.confのhttp内に下記を追加
    # ファイル全体の記載に若干の差異があるかもしれなが、serverセクション下にlocation /api/を追加するだけで問題ない。

    # nginx.confに対して編集を行う
    sudo vim /etc/nginx/nginx.conf
    # ----vimの編集画面 ここから----
    http {
    ...中略

        # 以下の設定を追加 ここから
        server {
            listen 80;
            listen [::]:80;

            root /var/www/html;  # Reactアプリケーションが配置されているディレクトリ

            index index.html index.htm;

            server_name _;

            # http://localhost/でリクエストが飛んできたときは、index.htmlを返却するようにする
            location / {
                try_files $uri $uri/ /index.html;  # SPAのため、直接のURIが存在しない場合でもindex.htmlを返す
            }

            # http://localhost/api/以下にリクエストが飛んできたときはhttp://localhost:8080に対してリクエストを送るようになる
            # 例えばhttp://localhost/api/tasks/createというリクエストが飛んだ場合は、
            # http://localhost:8080/api/tasks/createにリクエストが飛ぶ
            # つまり、APIサーバに対してリクエストを飛ばすようになる。
            location /api/ {
                proxy_pass http://localhost:8080;  # リクエストをバックエンドのSpring Bootにプロキシ
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }		
        }
        # 以下の設定を追加 ここまで
    
    ...中略
    # ----vimの編集画面 ここまで----
```

## APIエンドポイント
このアプリケーションは、以下のAPIエンドポイントと連携しています。

GET /api/tasks: すべてのタスクを取得します。
POST /api/tasks/create: 新しいタスクを作成します。
POST /api/tasks/update/{id}: 指定したIDのタスクを更新します。※現状はWebアプリに当機能は実装していない。
POST /api/tasks/delete/{id}: 指定したIDのタスクを削除します。
GET /api/tasks/{id}/comments: 指定したタスクのコメントを取得します。
POST /api/tasks/{id}/comments/add: タスクに新しいコメントを追加します。

## 使用技術
フロントエンド:

React: ユーザーインターフェースを構築するためのJavaScriptライブラリ。
Axios: APIリクエストを行うためのPromiseベースのHTTPクライアント。
CSS: アプリケーションのスタイリングに使用。

Spring Boot: RESTful APIを構築するためのバックエンドフレームワーク。
MyBatis: データベースアクセスを管理するための永続化フレームワーク。
PostgreSQL: タスクやコメントを保存するためのデータベース。