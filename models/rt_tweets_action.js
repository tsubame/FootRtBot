/**
 * rt_tweetsアクション
 *
 * RT数が多いツイートをリツイートする
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
 * 最近RTしたツイート 連想配列 添字はツイートID 以下4つも同様
 */
var recent_retweets = {};

/**
 * 最近RT候補に入れたツイート 連想配列
 */
var recent_candidates = {};

/**
 * RT数の多いツイート 連想配列
 */
var many_rt_tweets = {};

/**
 * RT対象 連想配列
 */
var should_rt_tweets = {};

/**
 * RT候補 連想配列
 */
var rt_candidates = {};

/**
 * RT数の規定値 この数以上ならリツイートする
 */
var retweet_minimal_rt = CONST.RETWEET_LEAST_RT;

/**
 * リツイート候補に入れるRT数（フォローしているユーザのツイート）
 */
var cand_min_rt_by_friends = CONST.CAND_LEAST_RT_BY_FRIENDS;

/**
 * リツイート候補に入れるRT数（フォローしていないユーザのツイート）
 */
var cand_min_rt_by_others  = CONST.CAND_LEAST_RT_BY_OTHERS;

/**
 * 上記3つの最小の数
 */
var pickup_rt_count;

/**
 * 直近のツイートとしてみなす分数
 * （30 → 30分以内）
 */
var recent_tweet_minutes = 30;

/**
 * 上の時間内のツイートは規定のRT数のこの倍でリツイートする
 * （0.5 → 0.5倍でリツイート）
 */
var recent_rt_coef = 0.5;

/**
 * 直近のツイートとしてみなす日付
 */
var recent_tweet_date;

/**
 * この日付より前ならスキップ
 */
var skip_consider_date;

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

	// RT数、スキップ対象の日付を算出
	calcPickupRtCount();
	calcSkipAndRecentDate();

	// ロガーの設定
	try {
		log4js.configure(CONST.LOG4JS_CONFIG);
	} catch (e) {
		console.log(e);
	}
	logger = log4js.getLogger('file');
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
		// TLから一定のRT数以上のツイートを取得
		function(callback) {
			pickupManyRtTweets(callback);
		},
		// RT対象とRT候補を振り分ける
		function(callback) {
			pickupShouldRtTweets(callback);
		},
		// RT対象をリツイート
		function(callback) {
			retweetAtOnceAsync(callback);
		},
		// RT候補をリツイート
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
			logger.error(err);
		} else {
			console.log('finished!');
		}
	});
}

/**
 * 最近RTしたツイートとRT候補を取得
 *
 * DBとTwitterから取得する
 * どちらかに登録されているツイートはスキップ
 *
 * @var function callback
 */
function getRecentRts(callback) {
	async.series([
	    // RT済みのツイートをDBから取得
		function(cb) {
			retweet_model.getRecentRetweets(100, function(tweets) {
				recent_retweets = tweets;
				cb();
			});
		},
		// RT済みのツイートをTwitterから取得
		function(cb) {
			tw.setAccount(CONST.ACCOUNT.TWEET);
			tw.getMyTimeLine(function(tweets) {
				for (var id in tweets) {
					recent_retweets[id] = tweets[id];
				}
				cb();
			});
		},
		// RT候補に登録済みのツイートをDBから取得
		function(cb) {
			rt_candidate_model.getRecentCandidates(100, function(tweets) {
				recent_candidates = tweets;
				cb();
			});
		}
	],
	function(err, results) {
		callback();
	});
}

/**
 * TLから規定のRT数以上のツイートを取得
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
 * リツイート対象とリツイート候補を振り分ける
 *
 * 日付が古すぎるツイートはスキップ
 * 有名人のツイートはリツイートするRT数の下限を別に設ける
 * 直近のツイートはRT数が多少少なめでもリツイート
 *
 * @var function callback
 */
function pickupShouldRtTweets(callback) {
	for (var i = many_rt_tweets.length - 1; 0 <= i; i--) {
		var tweet = many_rt_tweets[i];

		// 昔すぎるツイートは無視
		if (tweet.posted <= skip_consider_date) {
			continue;
		}

		// RT対象か判定
		isShouldRtTweet(tweet);
		// RT候補か判定
		isRtCandidate(tweet);
	}

	callback();
}

/**
 * RT対象かどうかを判定
 *
 * 条件
 * ・フォローしているユーザのツイート
 * ・RT数が規定値以上
 * ・直近のツイートでRT数の規定値に係数(recent_rt_coef)をかけた数
 * ・有名人のツイートはRT数の既定値は定数から取得
 *
 * @var Obj tweet
 */
function isShouldRtTweet(tweet) {
	var id = tweet.id;

	// 有名人のツイート
	if (CONST.PARTICULAR_RT_LIST[tweet.user_s_name]) {
		retweet_minimal_rt = CONST.PARTICULAR_RT_LIST[tweet.user_s_name];
	} else {
		retweet_minimal_rt = CONST.RETWEET_LEAST_RT;
	}

	var recent_minimal_rt = retweet_minimal_rt * recent_rt_coef;

	if (tweet.is_friend_tweet == true) {
		if (retweet_minimal_rt <= tweet.rt_count) {
			should_rt_tweets[id] = tweet;
		// 直近のツイート
		} else if (recent_tweet_date <= tweet.posted && recent_minimal_rt <= tweet.rt_count) {
			logger.info('直近のツイート RT数: ' + tweet.rt_count + ' ' + tweet.posted);

			should_rt_tweets[id] = tweet;
		}
	}
}

/**
 * RT候補かどうかを判定
 *
 * 条件
 *
 * ・フォローしているユーザのツイートの場合
 *   ・RT数がRT候補の規定値（cand_min_rt_by_friends）以上
 *
 * ・フォローしていないユーザのツイートの場合
 *   ・RT数がRT候補の規定値（cand_min_rt_by_others）以上
 *
 * ・RT対象に入っている場合は含まない
 *
 * @var Obj tweet
 */
function isRtCandidate(tweet) {
	var id = tweet.id;

	// RT対象なら終了
	if (should_rt_tweets[id]) {
		return;
	}

	if (tweet.is_friend_tweet == true) {
		if (cand_min_rt_by_friends <= tweet.rt_count) {
			rt_candidates[id] = tweet;
		}
	} else {
		if (cand_min_rt_by_others <= tweet.rt_count) {
			rt_candidates[id] = tweet;
		}
	}
}

/**
 * リツイート対象をまとめてリツイート
 *
 * @var function callback
 */
function retweetAtOnceAsync(callback) {
	tw.setAccount(CONST.ACCOUNT.TWEET);

	var functions = [];
	var tweet_ids = [];

	for (var id in should_rt_tweets) {
		tweet_ids.push(id);

		functions.push(function(cb) {
			var tweet_id = tweet_ids.shift();
			if (recent_retweets[tweet_id]) {
				console.log('RT済み');
				cb();
			} else {
				tw.retweet(should_rt_tweets[tweet_id].id, function(tweet) {
					cb();
				});
			}
		});
	}

	async.series(functions,
		function(err, results) {
			callback();
		}
	);
}

/**
 * リツイート候補をまとめてリツイート
 *
 * @var function callback
 */
function retweetCandidateParallel(callback) {
	tw.setAccount(CONST.ACCOUNT.WATCH_TL);

	var functions  = [];
	var candidates = [];

	for (var id in rt_candidates) {
		candidates.push(rt_candidates[id]);

		functions.push(function(cb) {
			var tweet = candidates.shift();
			if (recent_candidates[tweet.id]) {
				console.log('RT候補に登録済み');
				cb();
			} else {
				tw.retweet(tweet.id, function(tweet) {
					cb();
				});
			}
		});
	}

	async.parallel(functions,
		function(err, results) {
			callback();
		}
	);
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
		if (recent_candidates[id]) {
			console.log('RT候補に登録済み');
			end_count++;
			continue;
		}

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
 * 抽出する最小のRT数を計算
 */
function calcPickupRtCount() {

	// retweet_minimal_rtが最小の場合
	if (retweet_minimal_rt <= cand_min_rt_by_friends && retweet_minimal_rt <= cand_min_rt_by_others) {
		pickup_rt_count = retweet_minimal_rt;
	// cand_min_rt_by_friendsが最小の場合
	} else if (cand_min_rt_by_friends <= retweet_minimal_rt && cand_min_rt_by_friends <= cand_min_rt_by_others) {
		pickup_rt_count = cand_min_rt_by_friends;
	// cand_min_rt_by_others
	} else {
		pickup_rt_count = cand_min_rt_by_others;
	}
}

/**
 * スキップ対象、直近のツイートとみなす時間を算出
 */
function calcSkipAndRecentDate() {
	// 1時間前の日付を取得
	var mts = new Date().getTime();
	recent_tweet_date = new Date().setTime(mts - recent_tweet_minutes * 60000);
	skip_consider_date = new Date().setTime(mts - CONST.SKIP_PAST_DAY * 86400000);
}
