/**
 * sendRtMailActionの処理実行
 *
 *
 */


/**
 * requires.
 *
 */
var async = require('async');
var retweet_model = require('./retweet_model');
var rt_candidate_model = require('./rt_candidate_model');
var tw =  require('./twitter_accessor');
var CONST = require('../etc/const');

/**
 * exports.
 */
exports.exec = exec;

var many_rt_tweets = {};
var recent_retweets = {};
var should_rt_tweets = {};
var rt_success_tweets = [];
var rt_candidates = {};

var rt_base_count = 30;

/**
 * 処理実行
 *
 * 本日RTしたツイートとRT候補をメールで送信
 *
 */
function exec() {
	async.series([
		function(callback) {
			// 自分の最近のRTを取得
			tw.setAccount(CONST.ACCOUNT.TWEET);
			tw.getMyTimeLine(function(tweets) {
				recent_retweets = tweets;
				callback();
			});
		},
		function(callback) {
			// アカウントをセット
			tw.setAccount(CONST.ACCOUNT.WATCH_TL);
			// TLから100RT以上のツイートを取得
			tw.pickupRtFromTl(rt_base_count, function(tweets) {
				many_rt_tweets = tweets;
				callback();
			});
		},
		function(callback) {
			pickupShouldRtTweets(callback);
		},
		function(callback) {
			//tw.setAccount(CONST.ACCOUNT.TWEET);
			retweetAtOnce(callback);
		},
		function(callback) {
			// 保存
			for(var i in rt_success_tweets) {
				retweet_model.save(rt_success_tweets[i]);
			}

			for(var i in rt_candidates) {
				rt_candidate_model.saveIfNotExist(rt_candidates[i]);
			}

			callback();
		},
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('finished!');
			//close();
			console.log('RT候補');
			console.log(rt_candidates);
		}
	});
}


function pickupShouldRtTweets(callback) {

	var end_count    = 0;
	var tweets_count = 0;

	for (var id in many_rt_tweets) {
		tweets_count ++;
	}

	for (var id in many_rt_tweets) {
		var tweet = many_rt_tweets[id];

		if (recent_retweets[id]) {
			end_count++;
			continue;
		}

		if (tweet.is_friend_tweet == false) {
			rt_candidates[id] = tweet;
			//console.log(tweet);
		} else {
			should_rt_tweets[id] = tweet;
		}

		end_count++;
		//console.log(end_count);
	}

	var intId = setInterval(function() {
		//console.log(end_count);
		console.log(tweets_count);
		if(end_count == tweets_count) {
			clearInterval(intId);
			//console.log('pickup finished!');


			callback();
		}
	}, 500);
}


/**
 * リツイート対象をまとめてリツイート
 *
 * @var function callback
 */

function retweetAtOnce(callback) {
	var end_count   = 0;
	var tweet_count = 0;

	for (var id in should_rt_tweets) {
		tweet_count++;
	}

	// ツイートの件数ループ
	for (var id in should_rt_tweets) {
		tw.retweet(should_rt_tweets[id].id, function(tweet) {
			end_count++;
			if (tweet) {
				rt_success_tweets.push(tweet);
			}
		});
	}

	var intId = setInterval(function() {
		if(end_count == tweet_count) {
			clearInterval(intId);
			//console.log('retweets end.');
			callback();
		}

	}, 500);
}

