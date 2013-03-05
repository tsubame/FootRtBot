/**
 * rtTweetsの処理実行
 *
 *
 */


/**
 * requires.
 *
 */
var async              = require('async')
  , retweet_model      = require('./retweet_model')
  , rt_candidate_model = require('./rt_candidate_model')
  , tw                 = require('./twitter_accessor')
  , CONST              = require('../etc/const')
  , log4js             = require('log4js');

/**
 * exports.
 */
exports.exec = exec;

/**
 * ロガー
 */
var logger;

/**
 * ツイートを取得する配列
 */
var many_rt_tweets    = {};
var recent_retweets   = {};
var recent_candidates = {};
var should_rt_tweets  = {};
var rt_candidates     = {};

/**
 * リツイートする基準のRT数
 */
var retweet_rt_count         = CONST.RETWEET_LEAST_RT;
var cand_rt_count_by_friends = CONST.CAND_LEAST_RT_BY_FRIENDS;
var cand_rt_count_by_others  = CONST.CAND_LEAST_RT_BY_OTHERS;
var pickup_rt_count;


/**
 * 初期化
 *
 */
function init() {
	many_rt_tweets    = {};
	recent_retweets   = {};
	recent_candidates = {};
	should_rt_tweets  = {};
	rt_candidates     = {};

	tw.setGetTlCount(CONST.GET_TL_COUNT);
	tw.setLogConfig(CONST.LOG4JS_CONFIG);

	// ロガーの設定
	try {
		log4js.configure(CONST.LOG4JS_CONFIG);
	} catch (e) {
		console.log(e);
	}
	logger = log4js.getLogger('file');

	calcPickupRtCount();
}

/**
 * 処理実行
 *
 * 本日RTしたツイートとRT候補をメールで送信
 *
 */
function exec() {
	init();

	async.series([
		// RT済みのツイートを取得
		function(callback) {
			getRecentRts(callback);
		},
		// TLから特定のRT数以上のツイートを取得
		function(callback) {
			pickupManyRtTweets(callback);
		},
		// リツイートするツイートを抽出
		function(callback) {
			pickupShouldRtTweets(callback);
		},
		// まとめてリツイート
		function(callback) {
			retweetAtOnce(callback);
		},
		// RT候補をまとめてリツイート
		function(callback) {
			retweetCandidateAtOnce(callback);
		},
		// DBに保存
		function(callback) {
			saveTweets(callback);
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log(should_rt_tweets);
			console.log('finished!');
		}
	});
}

/**
 * 最近のRTとRT候補を取得
 *
 * @var function callback
 */
function getRecentRts(callback) {
	async.series([
	    // RT済みのツイートを取得
		function(cb) {
			retweet_model.getRecentRetweets(100, function(tweets) {
				recent_retweets = tweets;
				cb();
			});
		},
		// RT候補に登録済みのツイートを取得
		function(cb) {
			rt_candidate_model.getRecentCandidates(100, function(tweets) {
				recent_candidates = tweets;
				cb();
			});
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			callback();
		}
	});
}

/**
 * TLから特定のRT数以上のツイートを取得
 *
 * @var function callback
 */
function pickupManyRtTweets(callback) {
	tw.setAccount(CONST.ACCOUNT.WATCH_TL);
	tw.pickupRtFromTl(pickup_rt_count, function(tweets) {
		many_rt_tweets = tweets;
		callback();
	});
}


/**
 * DBに保存
 *
 * @var function callback
 */
function saveTweets(callback) {
	for(var i in should_rt_tweets) {
		retweet_model.saveIfNotExist(should_rt_tweets[i]);
	}
	for(var i in rt_candidates) {
		rt_candidate_model.saveIfNotExist(rt_candidates[i]);
	}
	callback();
}

/**
 * リツイート対象とリツイート候補を振り分ける
 *
 * @var function callback
 */
function pickupShouldRtTweets(callback) {
	var end_count    = 0;
	for (var i = many_rt_tweets.length - 1; 0 <= i; i--) {
		var tweet = many_rt_tweets[i];
		var id = tweet.id;

var divide = 2;
var divide_hour = 1;

	// 1時間前の日付を取得
	var mts = new Date().getTime();
	var hour_ago = new Date().setTime(mts - divide_hour * 3600000);

		if (recent_retweets[id]) {
			console.log('RT済み');
			end_count++;
			continue;
		} else if (recent_candidates[id]) {
			console.log('RT候補に登録済み');
			end_count++;
			continue;
		}

		// フォローしているユーザ
		if (tweet.is_friend_tweet == true) {
			//
			if (retweet_rt_count <= tweet.rt_count) {
				should_rt_tweets[id] = tweet;
			} else if (retweet_rt_count / divide <= tweet.rt_count && hour_ago <= tweet.posted) {
				logger.info('勢いのあるツイートとしてRT');
				logger.info(tweet.posted + ' RT数: ' + tweet.rt_count);
				console.log('勢いのあるツイートとしてRT');

				should_rt_tweets[id] = tweet;
			} else if(cand_rt_count_by_friends <= tweet.rt_count) {
				rt_candidates[id] = tweet;
			}
		// フォローしてないユーザ
		} else {
			if (cand_rt_count_by_others <= tweet.rt_count) {
				rt_candidates[id] = tweet;
			}
		}

		end_count++;
	}

	var intId = setInterval(function() {
		if(end_count == many_rt_tweets.length) {
			clearInterval(intId);
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
	tw.setAccount(CONST.ACCOUNT.TWEET);

	var end_count   = 0;
	var tweet_count = 0;

	for (var id in should_rt_tweets) {
		tweet_count++;
	}

	// ツイートの件数ループ
	for (var id in should_rt_tweets) {
		tw.retweet(should_rt_tweets[id].id, function(tweet) {
			end_count++;
		});
	}

	var intId = setInterval(function() {
		if(end_count == tweet_count) {
			clearInterval(intId);
			callback();
		}

	}, 500);
}

/**
 * リツイート候補をまとめてリツイート
 *
 * @var function callback
 */
function retweetCandidateAtOnce(callback) {
	tw.setAccount(CONST.ACCOUNT.WATCH_TL);

	var end_count   = 0;
	var tweet_count = 0;

	for (var id in rt_candidates) {
		tweet_count++;
	}

	// ツイートの件数ループ
	for (var id in rt_candidates) {
		tw.retweet(rt_candidates[id].id, function(tweet) {
			end_count++;
		});
	}

	var intId = setInterval(function() {
		if(end_count == tweet_count) {
			clearInterval(intId);
			callback();
		}

	}, 500);
}

/**
 * 抽出する最小のRT数を計算
 */
function calcPickupRtCount() {
	// retweet_rt_countが最小の場合
	if (retweet_rt_count <= cand_rt_count_by_friends && retweet_rt_count <= cand_rt_count_by_others) {
		pickup_rt_count = retweet_rt_count;
	// cand_rt_count_by_friendsが最小の場合
	} else if (cand_rt_count_by_friends <= retweet_rt_count && cand_rt_count_by_friends <= cand_rt_count_by_others) {
		pickup_rt_count = cand_rt_count_by_friends;
	// cand_rt_count_by_others
	} else {
		pickup_rt_count = cand_rt_count_by_others;
	}
}

