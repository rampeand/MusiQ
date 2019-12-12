var express = require('express');
var app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
   res.render('index.pug');
 });

 app.get('/player', (req, res) => {
   res.render('player.pug');
 });

 app.get('/search', (req, res) => {
   res.render('search.pug');
 });

 app.get('/beta', (req, res) => {
  res.render('beta.pug');
});

var server = app.listen(8080, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})