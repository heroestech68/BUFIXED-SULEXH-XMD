// Simple health check - does not run the bot
const http = require('http');
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type','application/json');
  res.end(JSON.stringify({ok:true, time:new Date().toISOString()}));
});
if (require.main === module) {
  server.listen(port, ()=> console.log('Health server on', port));
}
module.exports = server;
