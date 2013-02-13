/**
 * Module dependencies.
 */

var express = require('express')
  , routes  = require('./routes')
  , tweet   = require('./routes/tweet')
  , follow_candidate = require('./routes/follow_candidate')
  , models = require('./models')
  , http   = require('http')
  , path   = require('path')
  , OAuth  = require('oauth').OAuth;

var app = express();

/**
 * 設定
 */
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.set('view options', { layout: true });
  //app.set('layout', );
  //app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));

  models.init();
});

app.configure('development', function(){
	//models.init('localhost', 'foot_rt');
	app.use(express.errorHandler());
});





/**
 * ルーティング
 *
 */
app.get('/', routes.index);

app.get('/tweet/rtTweets', tweet.rtTweets);
app.get('/tweet/showCandidates', tweet.showCandidates);
app.get('/tweet/showRecentRetweets', tweet.showRecentRetweets);
app.get('/tweet/rtFromCandidates', tweet.rtFromCandidates);
app.get('/tweet/rtManually/:tweet_id', tweet.rtManually);
app.get('/tweet/deleteCandidate/:tweet_id', tweet.deleteCandidate);
app.get('/tweet/sendRtMail', tweet.sendRtMail);
app.get('/tweet/demo', tweet.demo);

// 削除
//app.get('/tweet/sendmail', tweet.sendmail);

app.get('/follow_candidate/update', follow_candidate.update);
app.get('/follow_candidate/show', follow_candidate.show);
app.get('/follow_candidate/follow/:screen_name', function(req, res) {
	follow_candidate.follow(req, res);
});

app.get('/demo', function(req, res) {
	res.render('demo', {title: 'layout'});
});


http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});








