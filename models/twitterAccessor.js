/**
 * Module dependencies.
 */
var OAuth = require('oauth').OAuth;
var async = require('async');
var http  = require('http');

/**
 * exports.
 */
exports.getFollowCandidate = getFollowCandidate;

exports.rtTweets = rtTweets;

exports.setRecentRetweets = function(retweets) {
	recent_retweets = {};

	for (var i = 0; i < retweets.length; i++) {
		var id = String(retweets[i].id);
		recent_retweets[id] = retweets[i];
	}
}

exports.retweetById = retweetById;

exports.demo = function() {
	console.log(recent_retweets);

	getTimelineTweets(function() {
		//console.log(should_rt_tweets);
		console.log(rt_candidates);
	});
}


// 外に出せる定数

/**
 * 自分のTwitterアカウント
 */
var MY_ACCOUNT = 'foot_rt';

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
var tl_tweets = {};

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
 * 配列の初期化
 *
 */
function initArray() {
	tl_tweets         = {};
	should_rt_tweets  = {};
	rt_candidates     = {};
	rt_success_tweets = [];
};




/**
 * TLを取得して100RT以上のツイートをRT
 *
 * @var function callback
 */
function rtTweets(callback) {
	initArray();

// まず自分のRTしたTLを取得した方がいい？


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

		accessApi(url, function(data) {
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
					rt_user:     rt_user
				};

/*
				var tweet = {
					id_str:   tweet_data.id_str,
					user: {
						id_str:  tweet_data.user.id_str,
						name:  tweet_data.user.name,
						screen_name:  tweet_data.user.screen_name,
						is_friend: is_friend_tweet
						},
					text:     tweet_data.text,
					rt_count: tweet_data.retweet_count,
					posted:   posted,
					created:  new Date(),
					rt_user:  rt_user
				};
*/
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
 * フォローしてない人のツイートから
 * リツイートすべきものを抽出
 *
 * @var function callback
 */
function pickupRtFromNotFollows(callback) {
	var end_count = 0;

	// ツイートの件数ループ
	for (var i = 0; i < not_follow_tweets.length; i++) {
		var tweet = not_follow_tweets[i];

		// RTしたユーザのIDを取得
		getRtUserIds(tweet.id, tweet.rt_count, function(user_ids) {
			var user_count = 0;

			for (var j = 0; j < user_ids.length; j++) {
				if (my_follows[user_ids[j]]) {
					user_count ++;
				}
			}
			// フォローしたユーザが2件以上RTしていたら
			if (2 <= user_count) {
				retweets.push(tweet);
			// RT候補に入れる
			} else {
				rt_candidates.push(tweet);
			}

			end_count ++;
		});
	}

	var intId = setInterval(function() {
		if(end_count == not_follow_tweets.length) {
			clearInterval(intId);
			callback();
		}
	}, 500);
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
				//console.log(err);
			} else {
				console.log('RT成功：');
				console.log(tweet);
				//retweets.push(tweet);//<Number
				//rt_success_tweets.push(tweet);//<Number
				rt_success_tweets.push(tweet);
			}

			callback();
		}
	)
}

/**
 * ツイートをリツイートする
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
				//console.log(data);
				//rt_success_tweets.push(tweet);
/*
				var tweet = {
					id: 	   data.id_str,
					user_id:   data.user.id_str,
					user_name: data.user.name,
					text:      data.text,
					rt_count:  data.retweet_count
					//created:   created,
					//is_friend_tweet: is_friend_tweet,
					//rt_user: rt_user
				};

								console.log(tweet);*/
			}

			callback();
		}
	)
}

/**
 * ツイートをRTしたユーザのIDを収得
 *
 * @var String id
 */
function getRtUserIds(id, rt_count, callback) {

	var end_count = 0;
	var get_count_once = 100;
	var req_count;

	var user_ids = [];

	if (rt_count) {
		req_count = Math.ceil(rt_count / get_count_once);
	} else {
		req_count = 1;
	}

	for (var i = 1; i <= req_count; i++) {
		var url = 'https://api.twitter.com/1.1/statuses/retweets/' + id
				+ '.json?count=' + get_count_once + '&page=' + i;

		accessApi(url, function(data) {
			var rts = JSON.parse(data);
			//console.log(String(rts.length) + '件のユーザを取得');

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
			callback(user_ids);
		}

	}, 500);
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

		callback();
	});
}

function getMyFollowsByIds(callback) {
	var url = 'https://api.twitter.com/1.1/friends/ids.json?screen_name=' + MY_ACCOUNT;

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

		console.log(my_follow_count);
		callback();
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



