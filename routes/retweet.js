/**
 * requires.
 *
 */
var retweet_model      = require('../models/retweet_model')
  , rt_candidate_model = require('../models/rt_candidate_model')
  , tw                 = require('../models/twitter_accessor')
  , CONST              = require('../etc/const');


/**
 * exports.
 */
exports.rtTweets = rtTweets;
exports.sendRtMail = sendRtMail;
exports.showRecentRetweets = showRecentRetweets;
exports.demo = demo;

var log4js = require('log4js');
// これをメソッドで外から設定
log4js.configure(CONST.LOG4JS_CONFIG);
var logger = log4js.getLogger('file');

/**
 * アクション
 *
 * TLを取得して100RT以上のものをリツイート
 */
function rtTweets(req, res){
	var action = require('../models/rt_tweets_action');
	action.exec();

	res.send('done.');
};

/**
 * アクション
 *
 * 最近のRTを表示
 */
function showRecentRetweets(req, res){
	retweet_model.getRecentRetweets(100, function(recent_retweets) {
		res.render('show_recent_rts', { retweets: recent_retweets });
	});
};

/**
 * アクション
 * 最近のRTとRT候補をメールで送信
 */
function sendRtMail(req, res) {
	var action = require('../models/send_rt_mail_action');
	action.exec();

	res.send('done.');
}


/**
 * デモコード
 */
function demo(req, res) {
	tw.setAccount(CONST.ACCOUNT.TWEET);
	//tw.setAccount(CONST.ACCOUNT.WATCH_TL);
	//tw.demo();

	var functions = [
	             function(cb) {
	            	 console.log('((ﾉ)・ω・(ヾ)ﾑﾆﾑﾆ');
	            	 cb();
	             },
	             function(cb) {
	             	console.log('(o´・ω・｀)σ)Д｀)ﾌﾟﾆｮﾌﾟﾆｮ');
	             	cb();
	             }

	             ];
	var cb = function() {};
	functions[1](cb);

	var async = require('async');
	async.series(functions);

	res.send('done.');
}
