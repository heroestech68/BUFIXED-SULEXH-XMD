Deployment quick commands

Heroku:
  heroku create my-bot-app
  git push heroku main
  heroku ps:scale worker=1

Render:
  Create a new service -> connect repo -> set start command: npm start

Railway:
  Import project and set start command: node fredi/index.js

Docker (example):
  docker build -t bufixed-bot .
  docker run -d --name bufixed -e PORT=3000 bufixed-bot

Termux:
  npm install
  cp .env.example .env
  node fredi/index.js
