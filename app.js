/**
 * Module dependencies.
 */
var express = require('express')
	, http	   = require('http')
	, path	   = require('path')
	, retweet  = require('./routes/retweet')
	, follower = require('./routes/follower')
	, rt_candidate = require('./routes/rt_candidate')
	, db_init = require('./models/db_init')
	, CONST	  = require('./etc/const');

var app = express();

/**
 * 設定
 */
app.configure(function(){
	//app.set('port', process.env.PORT || 3000);
	app.set('port', process.env.PORT || CONST.PORT);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.set('view options', { layout: true });
	//app.set('layout', );
	//app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('secret cokkie'));
	app.use(express.session());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));

	db_init.connect(CONST.DB_PARAMS);
});

app.configure('development', function(){
	//models.init('localhost', 'foot_rt');
	app.use(express.errorHandler());
});

/**
 * ルーティング
 *
 */

app.get('/', function(req, res){
		res.render('index', { title: '' });
});

app.get('/rt_candidate/show',                  rt_candidate.showCandidates);
app.get('/rt_candidate/rt_auto',               rt_candidate.rtAuto);
app.get('/rt_candidate/rt_manually/:tweet_id', rt_candidate.rtManually);
app.get('/rt_candidate/delete/:tweet_id',      rt_candidate.deleteCandidate);

app.get('/retweet/show',	   retweet.showRecentRetweets);
app.get('/retweet/rt_from_tl', retweet.rtTweets);
app.get('/retweet/sendmail',   retweet.sendRtMail);
app.get('/retweet/demo',	   retweet.demo);

app.get('/follower/refollow_auto', follower.refollowAuto);

/*
app.get('/follow_candidate/update', follow_candidate.update);
app.get('/follow_candidate/show', follow_candidate.show);
*/

http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});








