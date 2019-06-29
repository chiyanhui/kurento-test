const path = require('path');
const fs = require('fs');
const Koa = require('koa');
const staticServe = require('koa-static');
const pem = require('https-pem')

const app = new Koa();
app.use(staticServe(path.join(__dirname, '/public')));

const httpServer = require('http').createServer(app.callback()).listen(3001);
const httpsServer = require('https').createServer(pem, app.callback()).listen(3000);
