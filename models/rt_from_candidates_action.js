/**
 * rtFromCandidatesActionの処理内容
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

var my_friends = {};
var rt_success_tweets = [];
var skip_rt_count = 300;
var candidates = [];
var rt_user_count = 2;

/**
 * 処理実行
 *
 *
 */
function exec() {
	tw.setAccount(CONST.ACCOUNT.WATCH_TL);

	async.series([
	    function(cb) {
	    	// 最近のRT候補を取得
	    	rt_candidate_model.getTodaysCandidates(function(results) {
	    		candidates = results;
	    		cb();
	    	});
		},
	    function(cb) {
	    	for (var i = 0; i < candidates.length; i++) {
	    		var tweet = candidates[i];

	    		// RT
				tw.retweet(tweet.id, function(retweet) {
					if (retweet) {
						console.log(retweet);
						//retweet_model.save(retweet);
						//rt_candidate_model.setDeleted(retweet.id);
					}
					//end_count ++;
				});
			}
		},
		function(cb) {
			//
	    	//tw.setAccount(CONST.ACCOUNT.TWEET);
			pickupRtTweets(cb);
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('finished!');
		}
	});
}





function execOrg() {
	tw.setAccount(CONST.ACCOUNT.WATCH_TL);

	async.series([
	    function(cb) {
	    	// 最近のRT候補を取得
	    	rt_candidate_model.getTodaysCandidates(function(results) {
	    		candidates = results;
	    		cb();
	    	});
		},
	    function(cb) {
	    	// 自分のフォローを取得
	    	tw.getMyFriendIds(function (friends) {
	    		my_friends = friends;
	    		cb();
	    	});
		},
		function(cb) {
			//
	    	tw.setAccount(CONST.ACCOUNT.TWEET);
			pickupRtTweets(cb);
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('finished!');
		}
	});
}

/**
 *
 */
function pickupRtTweets(callback) {
	var end_count = 0;

	for (var i = 0; i < candidates.length; i++) {
		var tweet = candidates[i];
		var candidate = candidates[i];

		if (skip_rt_count < tweet.rt_count) {
			end_count ++;
			console.log('スキップしました RT:' + tweet.rt_count);
			continue;
		}

		tw.getRtUserIds(tweet, function(rt_user_ids, _tweet) {
			var match_user_count = 0;
			// フレンドの件数ループ
			for (var friend_id in my_friends) {
				if (rt_user_ids[friend_id]) {
					console.log(friend_id + 'がRTしています。');
					match_user_count ++;
				}
			}

			console.log(match_user_count + '人マッチ \n' + _tweet.text);

			if (rt_user_count <= match_user_count) {
				// リツイート
				tw.retweet(_tweet.id, function(retweet) {
					if (retweet) {
						console.log(retweet);
						retweet_model.save(retweet);
						rt_candidate_model.setDeleted(retweet.id);
					}
					end_count ++;
				});
			} else {
				end_count ++;
			}
		});
	}

	var intId = setInterval(function() {
		if(end_count == candidates.length) {
			clearInterval(intId);
			callback();
		}
	}, 500);
}
