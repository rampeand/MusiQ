var express = require('express');
var path = require('path');
var app = express();

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Landing page
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Player page  — new canonical route
app.get('/player/:pid', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// Guest queue page
app.get('/queue/:pid', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'queue.html'));
});

// Admin Dashboard
app.get('/admin', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Backward-compat routes (v3)
app.get('/player3/:pid', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

app.get('/search3/:pid', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

// Provide API keys securely
app.get('/api/config', function (req, res) {
  res.json({
    youtubeApiKey: process.env.YOUTUBE_API_KEY || ''
  });
});


if (!module.parent) {
  var server = app.listen(8080, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("MusiQ listening at http://%s:%s", host, port);
  });
}

module.exports = app;