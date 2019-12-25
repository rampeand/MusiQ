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

app.get('/test/:pid',(req, res) => {
  console.log(req.params.pid);
  res.render('test.pug',{
    playerid: req.params.pid
  });
});

app.get('/player2/:pid',(req, res) => {
  console.log(req.params.pid);
  res.render('player2.pug',{
    playerid: req.params.pid
  });
});

app.get('/player3/:pid',(req, res) => {
  //console.log(req.params.pid);
  res.render('player3.pug',{
    playerid: req.params.pid
  });
});

app.get('/search2/:pid',(req, res) => {
  console.log(req.params.pid);
  res.render('search2.pug',{
    playerid: req.params.pid
  });
});

var server = app.listen(8080, function () {
   var host = server.address().address
   var port = server.address().port
   
   console.log("Example app listening at http://%s:%s", host, port)
})