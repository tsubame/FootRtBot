/**
 *
 * TwitterAPIを利用するためのソース
 *
 *
 *
 */

/**
 * Module dependencies.
 */
var OAuth = require('oauth').OAuth
  , async = require('async')
  , http  = require('http');

/**
 * exports.
 */
exports.rtTweets = rtTweets;

exports.getFollowCandidate = getFollowCandidate;

exports.retweetById = retweetById;

exports.showRtUserIds = getRtUserIds;

exports.demo = function() {
	getMyFollowsByIds(function() {
		console.log(my_follow_count + '件');
	});
}

	// 削除可
	exports.setRecentRetweets = function(retweets) {
		recent_retweets = {};

		for (var i = 0; i < retweets.length; i++) {
			var id = String(retweets[i].id);
			recent_retweets[id] = retweets[i];
		}
	}



// 外に出せる定数

/**
 * 自分のTwitterアカウント
 */

	// 以下2つ、要名前熟考
	var MY_ACCOUNT = 'foot_rt';

	var MY_TRUE_ACCOUNT = 'foot_rt2';

/**
 * TLで取得するツイートの合計数
 */
var TL_GET_COUNT = 500;

/**
 * TLから1度に取得するツイートの数
 */
var TL_GET_COUNT_ONCE = 200;

/**
 * この数以上のRT数でリツイート
 */
var BASE_RT_COUNT = 100;

// ここまで


//
	/**
	 * Twitter APIのConsumerKey
	 */
	var COUSUMER_KEY    = 'W3EFf1ufSQPKhJvzglSlg';

	/**
	 * Twitter APIのConsumerSecret
	 */
	var CONSUMER_SECRET = 'B3JAd5KKtA3OZht7sBU10h0VYrk1S2uwOCI2PF00g4';

	/**
	 * アクセストークン
	 */
	var ACCESS_TOKEN = '1095087402-ucXlGjN7jCmsaSwLQtr9tfUrnKzHy7uA3jdfCc8';

	/**
	 * アクセストークンシークレット
	 */
	var ACCESS_TOKEN_SECRET = 'rEI5xfh9WXnHT3w705L5r60abReVEiA2gCSjZqUxI';

/**
 * リクエストトークンURL
 */
var REQUEST_TOKEN_URL   = 'https://api.twitter.com/oauth/request_token';

/**
 * アクセストークンURL
 */
var ACCESS_TOKEN_URL    = 'https://api.twitter.com/oauth/access_token';

/**
 * OAUTHのコールバックで呼ばれるURL
 */
var OAUTH_CALLBACK_URL  = 'http://127.0.0.1:3000/auth/tweet/callback';

/**
 * 自分がフォローしているユーザ 連想配列 キーはTwitterのユーザID
 *
 * @var Object
 */
var my_follows = {};

/**
 * 自分がフォローしているユーザの数
 */
var my_follow_count = 0;

/**
 * フォローする候補のユーザ 連想配列 キーはTwitterのユーザID
 *
 * @var Object
 */
var follow_candidates = {};

	// 不要？
	/**
	 * TLから取得したツイートの連想配列
	 * プロパティ名: ツイートidの文字列
	 *
	 * @var obj
	 */
	//var tl_tweets = {};


/**
 * 最近RTしたツイートの連想配列
 * プロパティ名: ツイートidの文字列
 *
 * @var obj
 */
var recent_retweets = {};

/**
 * RT対象ツイートの連想配列
 * プロパティ名: ツイートidの文字列
 *
 * @var obj
 */
var should_rt_tweets = {};

/**
 * RT候補ツイートの連想配列
 * プロパティ名: ツイートidの文字列
 *
 * @var obj
 */
var rt_candidates = {};

/**
 * RTに成功したツイートの配列
 *
 * @var Array
 */
var rt_success_tweets = [];

/**
 * OAuthオブジェクト
 *
 * @var Object
 */
var oa = new OAuth(
	  REQUEST_TOKEN_URL,
	  ACCESS_TOKEN_URL,
	  COUSUMER_KEY,
	  CONSUMER_SECRET,
	  '1.0',
	  OAUTH_CALLBACK_URL,// コールバックのアドレス
	  'HMAC-SHA1'
	);

// 要名前変更

	var oa_2 = new OAuth(
	  REQUEST_TOKEN_URL,
	  ACCESS_TOKEN_URL,
	  'xeGIQrFfbEtYq6JxBxF6g',
	  'sh5zxBMGDWtOB5t1P2O3oDMhnHJgQuArDmqnxApSUg',
	  '1.0',
	  OAUTH_CALLBACK_URL,// コールバックのアドレス
	  'HMAC-SHA1'
	);

/**
 *
 */
var account_for_watch_tl = {
	screen_name: '',
	consumer_key: '',
	consumer_secret: '',
	access_token: '',
	access_token_secret: ''
};

/**
 *
 */
var account_for_tweet = {
	screen_name: '',
	consumer_key: '',
	consumer_secret: '',
	access_token: '',
	access_token_secret: ''
};

/**
 * アカウントをセット
 */
function setAccount() {

}

/**
 * 配列の初期化
 *
 */
function initArray() {
	//tl_tweets         = {};
	should_rt_tweets  = {};
	rt_candidates     = {};
	rt_success_tweets = [];
};


// アクションに移動すべき？
/**
 * TLを取得して100RT以上のツイートをRT
 *
 * @var function callback
 */
function rtTweets(callback) {
	initArray();

	async.series([
	    function(cb) {
	    	getMyRetweets(cb);
		},
		function(cb) {
			getTimelineTweets(cb);
		},
		function(cb) {
			retweetAtOnce(cb);
	    }
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('success!');

			callback(rt_success_tweets, rt_candidates);
		}
	});
}



/**
 * 必要な関数
 *
 *
 * ・特定のユーザの最近のツイートを取得
 * ・TLから特定のRT数以上のものを取り出す
 * ・リツイート
 *
 */






/**
 * 自分が最近リツイートしたものを取得
 *
 * @var function callback
 */
function getMyRetweets(callback) {
	var url = 'https://api.twitter.com/1.1/statuses/user_timeline.json?count=200&screen_name=' + MY_ACCOUNT;
	accessApi(url, function(data) {
		var tweets = JSON.parse(data);
		// ツイートの件数ループ
		for (var i in tweets) {
			// RTされたツイートならretweeted_statusを取り出す
			if (tweets[i].retweeted_status) {
				var tweet_data = tweets[i].retweeted_status;

				var id = tweet_data.id_str;

				var tweet = {
					id: 	   tweet_data.id_str,
					user_id:   tweet_data.user.id_str,
					user_name: tweet_data.user.name,
					text:      tweet_data.text,
					rt_count:  tweet_data.retweet_count,
					posted:    tweet_data.created_at
				};
				recent_retweets[id] = tweet;
			}
		}

		callback();
	});
}

/**
 * TLを取得してRT対象とRT候補を抽出
 *
 * @var function callback
 */
function getTimelineTweets(callback) {
	var req_end_count = 0;
	var req_count = Math.ceil(TL_GET_COUNT / TL_GET_COUNT_ONCE);

	// 複数回リクエスト
	for (var n = 1; n <= req_count; n++) {
		var url = 'https://api.twitter.com/1/statuses/home_timeline.json?count=' + TL_GET_COUNT_ONCE + '&page=' + n;
		//var url = 'https://api.twitter.com/1.1/statuses/home_timeline.json?count=' + TL_GET_COUNT_ONCE + '&page=' + n;

		accessApi2(url, function(data) {
			var tweets = JSON.parse(data);
			// ツイートの件数ループ
			for (var i in tweets) {
				var rt_user = null;
				// RTされたツイートならretweeted_statusを取り出す
				if (tweets[i].retweeted_status) {
					var tweet_data = tweets[i].retweeted_status;
					var is_friend_tweet = false;
					rt_user = tweets[i].user.name;
				} else {
					var tweet_data = tweets[i];
					var is_friend_tweet = true;
				}

				var id = tweet_data.id_str;

				// 100RT以下ならスキップ
				if (tweet_data.retweet_count < 100) {
					continue;
				// すでにRTしていればスキップ
				} else if (recent_retweets[id]) {
					console.log('RT済み');
					continue;
				}
				// 日付の設定
				var	mts    = Date.parse(tweet_data.created_at);
				var posted = new Date();
				posted.setTime(mts);

				var tweet = {
					id: 	     tweet_data.id_str,
					user_id:     tweet_data.user.id_str,
					user_name:   tweet_data.user.name,
					user_s_name: tweet_data.user.screen_name,
					text:        tweet_data.text,
					rt_count:    tweet_data.retweet_count,
					posted:      posted,
					created:     new Date(),
					is_friend_tweet: is_friend_tweet,
					rt_user:     rt_user,
					is_deleted:  false
				};

				// フレンドのツイートならRT対象に加える
				if (is_friend_tweet == true) {
					should_rt_tweets[id] = tweet;
				} else {
					rt_candidates[id] = tweet;
				}
			}

			req_end_count ++;
		});
	}

	var intId = setInterval(function() {
		if(req_end_count == req_count) {
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
	var end_count   = 0;
	var tweet_count = 0;

	for (var id in should_rt_tweets) {
		tweet_count++;
	}

	// ツイートの件数ループ
	for (var id in should_rt_tweets) {
		retweet(should_rt_tweets[id], function() {
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
 * TwitterAPIにGETでアクセス
 *
 * @var String   url
 * @var function callback(data)
 */
function accessApi(url, callback) {
	oa.getProtectedResource(
		url,
		'GET',
		ACCESS_TOKEN,
		ACCESS_TOKEN_SECRET,
		function(err, data, response) {
			if(err){
				console.log(url);
				console.log(err);
				return;
			}

			callback(data);
		}
	);
}

/**
 * TwitterAPIにGETでアクセス アカウント2つ目
 * foot_rt2の方
 *
 * @var String   url
 * @var function callback(data)
 */
function accessApi2(url, callback) {
	oa_2.getProtectedResource(
		url,
		'GET',
		'1156953000-0GjxaYlc3aXWoNUvRMKkQ72eD5rTWcSXhkc1DEI',
		'JlrR8zB7zCadUoLJwbRZ8VphBWP4kE0C0WfFTSNNA',
		function(err, data, response) {
			if(err){
				console.log(url);
				console.log(err);
				return;
			}

			callback(data);
		}
	);
}

/**
 * RT候補から
 * リツイートすべきものを抽出してRT
 *
 * @var function callback
 */
function pickupRtFromNotFollows(recent_candidates, callback) {
	initArray();

	var skip_rt_count = 1000;
	var end_count = 0;

	async.series([
	    function(cb) {
	    	// 自分のフォローを取得
	    	getMyFollowsByIds(cb);
		},
		function(cb) {
			//console.log(recent_candidates);
			for (var i = 0; i < recent_candidates.length; i++) {
				var tweet = recent_candidates[i];
				if (skip_rt_count < tweet.rt_count) {
					end_count ++;
					console.log('スキップしました RT:' + tweet.rt_count);
					continue;
				}
				rtFromCandidate(tweet, function() {
					end_count ++;
				});
			}

			var intId = setInterval(function() {
				//console.log(end_count);
				if(end_count == recent_candidates.length) {
					clearInterval(intId);
					cb();
				}
			}, 500);
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('finished!');

			callback(rt_success_tweets);
		}
	});
}

/**
 * 自分がフォローしているユーザのIDを取得
 * 100件以上取得できる
 *
 * @var function callback
 */
function getMyFollowsByIds(callback) {
	var url = 'https://api.twitter.com/1.1/friends/ids.json?screen_name=' + MY_TRUE_ACCOUNT;

	accessApi(url, function(data) {
		var results = JSON.parse(data);
		var ids = results.ids;

        for (var i in ids) {
        	var id = String(ids[i]);
			my_follows[id] = {
				id: id
			}

			my_follow_count ++;
		}

		callback();
	});
}

/**
 *
 */
function rtFromCandidate(tweet, callback) {
	getRtUserIds(tweet.id, function(rt_user_ids) {
		var match_user_count = 0;

		var rt_user_count = 0;
		for (var i in rt_user_ids) {
			rt_user_count++;
		}
		console.log(rt_user_count + '人がRT');

		// フレンドの件数ループ
		for (var friend_id in my_follows) {
			if (rt_user_ids[friend_id]) {
				console.log(friend_id + 'がRTしています。');
				match_user_count ++;
			}
		}

		if (2 <= match_user_count) {
			// リツイート
			retweet(tweet, function() {
				callback();
			});
		} else {
			callback();
		}
	});
}

/**
 * RTした人のIDを取得
 *
 * API 1
 */
function getRtUserIds(tweet_id, callback) {

	var rt_count;
	var user_ids = {};

	async.series([
	    function(cb) {
			var url = 'https://api.twitter.com/1/statuses/retweets/' + tweet_id + '.json?count=100';
			console.log(tweet_id + 'のRTユーザを取得中...');
			accessApi(url, function(data) {
				var rts = JSON.parse(data);
				rt_count = rts[0].retweeted_status.retweet_count;
				console.log('RT:' + rt_count);
				for (var i in rts) {
					var id = rts[i].user.id_str;
					user_ids[id] = id;
				}
				cb();
			});
	    },
	    function(cb) {
	    	var end_count = 1;
			var req_count = Math.ceil(rt_count / 100);
			for (var i = 2; i <= req_count; i++) {
				var url = 'https://api.twitter.com/1/statuses/' + tweet_id + '/retweeted_by/ids.json?count=100&page=' + i;
				console.log(tweet_id + 'のRTユーザを取得中... リクエスト回数：' + i);
				accessApi(url, function(data) {

					var rts = JSON.parse(data);

					for (var j in rts) {
						var id = String(rts[j]);
						user_ids[id] = id;
					}
					end_count ++;
				});
			}

			var intId = setInterval(function() {
				if(end_count == req_count) {
					clearInterval(intId);
					cb();
				}

			}, 500);
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			//console.log();

			callback(user_ids);
		}
	});
}









/**
 * ツイートをリツイートする
 *
 * @var obj tweet {id, user_name, text, rt_count}
 */

function retweet(tweet, callback) {
	var url = 'https://api.twitter.com/1/statuses/retweet/' + tweet.id + '.json';

	oa.getProtectedResource (
		url,
		'POST',
		ACCESS_TOKEN,
		ACCESS_TOKEN_SECRET,
		function(err, data, response) {
			if(err){
				// リツイート済みのものはエラーになる
				//console.log(err);
			} else {
				console.log('RT成功：');
				console.log(tweet);

				rt_success_tweets.push(tweet);
			}

			callback();
		}
	)
}

/**
 * ツイートをリツイートする
 * ツイートIDで指定
 *
 * @var obj tweet_id
 */

function retweetById(tweet_id, callback) {
	var url = 'https://api.twitter.com/1/statuses/retweet/' + tweet_id + '.json';

	oa.getProtectedResource (
		url,
		'POST',
		ACCESS_TOKEN,
		ACCESS_TOKEN_SECRET,
		function(err, data, response) {
			if(err){
			} else {
				console.log('RT成功：' + tweet_id);
				//rt_success_tweets.push(tweet);
			}

			callback();
		}
	)
}


function getRetweetUserIds1_1(id, callback) {

	var end_count = 0;
	var get_count_once = 100;
	var user_ids = [];
	var rt_count = 0;

	async.series([
	    function(cb) {
	    	var url = 'https://api.twitter.com/1.1/statuses/retweets/' + id
			+ '.json?count=' + get_count_once + '&page=1';

			accessApi(url, function(data) {
				var rts = JSON.parse(data);
				rt_count = rts[0].retweeted_status.retweet_count;
				for (var i in rts) {
					user_ids.push(rts[i].user.id_str);//<Number
				}
console.log(rt_count + '件のRT');
				end_count++;
				cb();
			});
		},
		function(cb) {
			var req_count = Math.ceil(rt_count / get_count_once);

			for (var i = 2; i <= req_count; i++) {
				var url = 'https://api.twitter.com/1.1/statuses/retweets/' + id
						+ '.json?count=' + get_count_once + '&page=' + i;

				accessApi(url, function(data) {
					var rts = JSON.parse(data);
					console.log(String(rts.length) + '件のユーザを取得');

					for (var i in rts) {
						//console.log(rts[i].user.name);
						user_ids.push(rts[i].user.id_str);//<Number
					}

					end_count++;
				});
			}

		var intId = setInterval(function() {
			if(end_count == req_count) {
				clearInterval(intId);
				cb();
			}

		}, 500);
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('success!');
			callback(user_ids);
		}
	});

}



/**
 * フォローする候補を取得
 *
 * @var function callback
 */
function getFollowCandidate(callback) {

	async.series([
		function(cb) {
			getMyFollowsByIds(cb);
		},
		function(cb) {
	    	getFollowsOfMyFollows(cb);
	    }
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('success!');
			callback(follow_candidates);
		}
	});
}

/**
 * 特定のユーザがフォローしている人を取得
 *
 * @var screen_name Twitterのアカウント @abcなどの@以降
 * @var function callback
 */
function getFollows(id_str, callback) {
	var users = [];

	//var url = 'http://api.twitter.com/1/statuses/friends.json?screen_name=' + screen_name;
	var url = 'http://api.twitter.com/1/statuses/friends.json?id=' + id_str;

	accessApi(url, function(data) {
		var results = JSON.parse(data);
		console.log(results.length + '件のアカウントを取得')

        for (var i in results) {
        	var id = results[i].id_str;

			users[id] = {
				id: results[i].id,
				id_str: results[i].id_str,
				name: results[i].name,
				screen_name: results[i].screen_name,
				followed_count: 1
			}
		}

		callback(users);
	});
}

/**
 * 特定のユーザがフォローしている人を取得
 *
 * @var String id_str Twitterのアカウント @abcなどの@以降
 * @var function callback
 */
function getFollowsById(id_str, callback) {
	var users = [];

	var url = 'http://api.twitter.com/1/statuses/friends.json?id=' + id_str;

	accessApi(url, function(data) {
		var results = JSON.parse(data);
		console.log(results.length + '件のアカウントを取得')

        for (var i in results) {
        	var id = results[i].id_str;

			users[id] = {
				id: results[i].id,
				id_str: results[i].id_str,
				name: results[i].name,
				screen_name: results[i].screen_name,
				followed_count: 1
			}
		}

		callback(users);
	});
}

/**
 * 自分がフォローしているユーザを取得
 * my_followsに取得する
 *
 * @var function callback
 */
function getMyFollows(callback) {
	var url = 'http://api.twitter.com/1/statuses/friends.json?screen_name=' + MY_ACCOUNT;

	// 100件以上取れない
	accessApi(url, function(data) {
		var results = JSON.parse(data);
		//console.log(results);
        for (var i in results) {
        	var id = results[i].id_str;

			my_follows[id] = {
				id: results[i].id,
				id_str: results[i].id_str,
				name: results[i].name,
				screen_name: results[i].screen_name
			}

			my_follow_count ++;
		}

		callback(my_follows);
	});
}


/**
 * 自分がフォローしているユーザのフォローを取得
 * follow_candidatesに取得する
 *
 * @var function callback
 */
function getFollowsOfMyFollows(callback) {
	var end_count = 0;

	// 自分がフォローしている件数ループ
	for(var id_str in my_follows) {
		getFollows(id_str, function(users) {
			for (var i in users) {
				var user =  users[i];
				var key = user.id_str;

				if (my_follows[key]) {
					console.log('　フォロー済み：' + user.name);
					continue;
				}

				if (follow_candidates[key]) {
					follow_candidates[key].followed_count ++;
				} else {
					follow_candidates[key] = user;
				}
			}

			end_count++;
		});
	}

	var intId = setInterval(function() {
		if(end_count == my_follow_count) {
			clearInterval(intId);
			callback();
		}

	}, 500);
}



