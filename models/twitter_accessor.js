//=================================================================
//
// TwitterAPIを利用するためのモジュール
//
//
//
//=================================================================

/**
 * Module dependencies.
 */
var OAuth = require('oauth').OAuth
  , async = require('async')
  , http  = require('http')
  , log4js = require('log4js');
  
  


/**
 * exports.
 */
exports.setAccount = setAccount;

exports.retweet = retweet;

exports.getMyTimeLine = getMyTimeLine;

exports.pickupRtFromTl = pickupRtFromTl;

exports.getFollowerIds = getFollowerIds;

exports.getMyFollowerIds = getMyFollowerIds;

exports.getFriendIds = getFriendIds;

exports.getMyFriendIds = getMyFriendIds;

exports.getRtUserIds = getRtUserIds;

exports.follow = follow;

exports.demo = function() {

};

/**
 * ログファイルのパス
 */
var error_log_file_path = 'logging.log';

/**
 * ロガーの設定
 */
try {
	log4js.configure({ appenders: [{
		'type': 'file',
		'filename': error_log_file_path
		}]});
} catch (e) {
	console.log(e);
}

var logger = log4js.getLogger('file');

/**
 * ロガーの設定
 */
exports.setLogConfig = function(log_config) {
	log4js.configure(log_config);
	logger = log4js.getLogger('file');
};

/**
 * リクエストトークンURL
 */
var REQUEST_TOKEN_URL   = 'https://api.twitter.com/oauth/request_token';

/**
 * アクセストークンURL
 */
var ACCESS_TOKEN_URL    = 'https://api.twitter.com/oauth/access_token';

/**
 * TLから取得するツイートの数
 */
var get_tl_count = 500;

exports.setGetTlCount = function(count) {
	get_tl_count = count;
}

/**
 * TLから一度に取得するツイートの数
 */
var get_tl_count_once = 200;

exports.setGetTlCountOnce = function(count) {
	get_tl_count_once = count;
}

/**
 * OAuth認証コールバックURL
 */
var oauth_callback_url = 'http://127.0.0.1:3000/';

exports.setOAuthCallBackUrl = function(url) {
	oauth_callback_url = url;
}

/**
 * OAuthオブジェクト
 *
 * @var Object
 */
var oauth;

/**
 * Twitterアカウント
 */
var account = {
	screen_name: '',
	consumer_key: '',
	consumer_secret: '',
	access_token: '',
	access_token_secret: ''
};

/**
 * アカウントをセット
 */
function setAccount(_account) {
	account = _account;

	oauth = new OAuth(
	  REQUEST_TOKEN_URL,
	  ACCESS_TOKEN_URL,
	  account.consumer_key,
	  account.consumer_secret,
	  '1.0',
	  oauth_callback_url,
	  'HMAC-SHA1'
	);
}

/**
 * TwitterAPIにGETでアクセス
 *
 * 事前にsetAccountでアカウントを設定しておく必要あり
 *
 * @var String   url
 * @var function callback(data)
 */
function accessApiWithGet(url, callback) {
	oauth.getProtectedResource(
		url,
		'GET',
		account.access_token,
		account.access_token_secret,
		function(err, data_string, response) {
			var data = {};
			try {
				data = JSON.parse(data_string);
				if(err) {
					logger.error(url);
					logger.error(data.errors);
				}
			} catch(e) {
				logger.error(e);
				data.errors = e;
			}

			callback(data);
		}
	);
}

/**
 * TwitterAPIにPOSTでアクセス
 *
 * 事前にsetAccountでアカウントを設定しておく必要あり
 *
 * @var String   url
 * @var function callback(data)
 */
function accessApiWithPost(url, data, callback) {
	oauth.post(
		url,
		account.access_token,
		account.access_token_secret,
		data,
		function(err, data_string, response) {
			var data = {};
			try {
				data = JSON.parse(data_string);
				if(err){
					logger.error(url);
					logger.error(data.errors);
				}
			} catch(e) {
				logger.error(e);
				data.errors = e;
			}
		
			callback(data);
		}
	);
}

/**
 * 特定のユーザの最近のツイートを200件取得
 *
 * 連想配列tweetsに取得する
 * 添字はツイートID
 *
 * @var String screen_name
 * @var function callback(tweets)
 */
function getUserTimeline(screen_name, callback) {
	var tweets = {};
	var url = 'https://api.twitter.com/1.1/statuses/user_timeline.json?count=200&screen_name=' + screen_name;
	//accessApiWithGet(url, function(json_string) {
	accessApiWithGet(url, function(json_datas) {
		//var json_datas = JSON.parse(json_string);
		// ツイートの件数ループ
		for (var i in json_datas) {
			// RTされたツイートならretweeted_statusを取り出す
			if (json_datas[i].retweeted_status) {
				var tweet_data = json_datas[i].retweeted_status;
			} else {
				var tweet_data = json_datas[i];
			}

			var id = tweet_data.id_str;

			var tweet = {
				id: 	   tweet_data.id_str,
				user_id:   tweet_data.user.id_str,
				user_name: tweet_data.user.name,
				text:      tweet_data.text,
				rt_count:  tweet_data.retweet_count,
				posted:    tweet_data.created_at
			};
			tweets[id] = tweet;
		}

		callback(tweets);
	});
}

/**
 * 自分の最近のツイートを200件取得
 *
 * 連想配列tweetsに取得する
 * 添字はツイートID
 *
 * @var function callback(tweets)
 */
function getMyTimeLine(callback) {
	getUserTimeline(account.screen_name, callback);
}

// 1と1.1どっちが良い？

/**
 * TLから一定数以上のRTのツイートを取り出す
 *
 * @var Number   pickup_rt_count このRT数以上のツイートを取得
 * @var Number   get_tl_count    TLから取得するツイートの数
 * @var function callback(rt_tweets)
 * @see models.retweets
 */
function pickupRtFromTl(pickup_rt_count, callback) {
	var req_end_count = 0;
	var req_count = Math.ceil(get_tl_count / get_tl_count_once);
	var retweets = [];

	// 複数回リクエスト
	for (var n = 1; n <= req_count; n++) {
		var url = 'https://api.twitter.com/1.1/statuses/home_timeline.json?count=' + get_tl_count_once + '&page=' + n;
		
		accessApiWithGet(url, function(json_datas) {
			if(! json_datas.errors){
				for (var i in json_datas) {
					tweetJsonToObject(json_datas[i], function(tweet) {
						if (pickup_rt_count <= tweet.rt_count) {
							retweets.push(tweet);
						}
					});
				}
			}
			
			req_end_count ++;
		});
	}

	var intId = setInterval(function() {
		if(req_end_count == req_count) {
			clearInterval(intId);
			callback(retweets);
		}
	}, 500);
}

/**
 * ツイートのJSONデータをオブジェクトに変換
 *
 * 				tweet = {
 *						id: 	     ツイートID
 *						user_id:     ユーザID
 *						user_name:   ユーザ名
 *						user_s_name: ユーザ名（@～ の後）
 *						text:        テキスト
 *						rt_count:    RT数
 *						posted:      投稿日時
 *						created:     現在日時
 *						is_friend_tweet: フォローしているユーザのツイートか
 *						rt_user:     RTしたユーザの名前
 *						is_deleted:  削除する際に使用
 *					}
 */
function tweetJsonToObject(json_data, callback) {
	// RTされたツイートならretweeted_statusを取り出す
	if (json_data.retweeted_status) {
		var tweet_data      = json_data.retweeted_status;
		var is_friend_tweet = false;
		var rt_user         = json_data.user.name;
	} else {
		var tweet_data      = json_data;
		var is_friend_tweet = true;
		var rt_user         = null;
	}
	// 日付の設定
	var	posted_mts = Date.parse(tweet_data.created_at);
	var posted = new Date();
	posted.setTime(posted_mts);

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

	callback(tweet);
}

/**
 * ツイートをリツイートする
 * ツイートIDで指定
 *
 * @var obj tweet_id
 * @var function callback(tweet)
 */
function retweet(tweet_id, callback) {
	var url = 'https://api.twitter.com/1.1/statuses/retweet/' + tweet_id + '.json';

	accessApiWithPost(url, {}, function(data) {
		if(data.errors){
			callback();
		} else {
			console.log('RT成功：' + tweet_id);
			//logger.info('RT成功：' + tweet_id);
			tweetJsonToObject(data, function(tweet) {
				console.log(tweet);
				callback(tweet);
			});
		}
	});
}

/**
 * 特定のユーザのフォロワーのIDを取得
 * 
 * @var String screen_name ユーザ名（@の後の文字列）
 * @var Number count 件数
 * @var function callback(friends)
 */
function getFollowerIds(screen_name, count, callback) {
	var followers = {};
	var url = 'https://api.twitter.com/1.1/followers/ids.json?cursor=-1&stringify_ids=true&screen_name=' + screen_name + '&count=100';
	accessApiWithGet(url, function(json_data) {
		var ids = json_data.ids;
	    for (var i in ids) {
	    	var id = String(ids[i]);
	    	followers[id] = {
				id: id
			};
		}
		
		callback(followers);
	});
}

/**
 * 自分のフォロワーのIDを取得
 * 
 * @var Number count
 * @var function callback(friends)
 */
function getMyFollowerIds(count, callback) {
	getFollowerIds(account.screen_name, count, callback);
}

/**
 * 特定のユーザがフォローしているユーザのIDを取得
 * 100件以上取得できる
 * IDをキーにした連想配列で取得
 *
 * @var String screen_name
 * @var Number count
 * @var function callback(friends)
 */
function getFriendIds(screen_name, count, callback) {
	var friends = {};
	var url = 'https://api.twitter.com/1.1/friends/ids.json?cursor=-1&stringify_ids=true&screen_name=' + screen_name + '&count=' + count;
	accessApiWithGet(url, function(json_data) {
		var ids = json_data.ids;

	    for (var i in ids) {
	    	var id = String(ids[i]);
	    	friends[id] = {
				id: id
			};
		}
		callback(friends);
	});
}

/**
 * 自分がフォローしているユーザのIDを取得
 * 100件以上取得できる
 *
 * @var Number count
 * @var function callback
 */
function getMyFriendIds(count, callback) {
	var screen_name = account.screen_name;

	getFriendIds(screen_name, count, callback);
}

/**
 * ユーザをフォロー
 * 
 * @var String user_id_str
 * @var function callback
 */
function follow(user_id_str, callback) {
	var url = 'https://api.twitter.com/1.1/friendships/create.json';
	var data = {	
	    	user_id: user_id_str,
	    	follow: true
	    };
	accessApiWithPost(url, data, function() {
		callback();
	});
}










// 以下、削除予定

/**
 * ツイートをRTした人のIDを取得
 *
 * API 1を使用
 */
function getRtUserIds(tweet, callback) {

	var rt_count;
	var user_ids = {};
	var tweet_id = tweet.id;

	async.series([
	    function(cb) {
			//var url = 'https://api.twitter.com/1/statuses/retweets/' + tweet_id + '.json?count=100';
			var url = 'https://api.twitter.com/1.1/statuses/retweets/' + tweet_id + '.json?count=100';
			console.log(tweet_id + 'のRTユーザを取得中...');
			accessApiWithGet(url, function(data) {
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
// 1.1でのAPIがないため改修する必要あり
	    function(cb) {
	    	var end_count = 1;
			var req_count = Math.ceil(rt_count / 100);
			for (var i = 2; i <= req_count; i++) {
				var url = 'https://api.twitter.com/1/statuses/' + tweet_id + '/retweeted_by/ids.json?count=100&page=' + i;
				//var url = 'https://api.twitter.com/1.1/statuses/' + tweet_id + '/retweeted_by/ids.json?count=100&page=' + i;

				console.log(tweet_id + 'のRTユーザを取得中... リクエスト回数：' + i);
				accessApiWithGet(url, function(data) {

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
			var rt_count = 0;
			for (var i in user_ids) {
				rt_count++;
			}
			console.log(rt_count + '人がRT');

			callback(user_ids, tweet);
		}
	});
}



function accessApiWithGetO(url, callback) {
	oauth.getProtectedResource(
		url,
		'GET',
		account.access_token,
		account.access_token_secret,
		function(err, data, response) {
			if(err){
				logger.error(url);
				logger.error(err);
				return;
			}

			callback(data);
		}
	);
}


function accessApiWithPostOrg(url, callback) {
	oauth.getProtectedResource(
		url,
		'POST',
		account.access_token,
		account.access_token_secret,
		function(err, data_string, response) {
			var data = {};
			try {
				data = JSON.parse(data_string);
				if(err){
					logger.error(url);
					logger.error(data.errors);
				}

			} catch(e) {
				logger.error(e);
				data.errors = e;
			}

			callback(data);
		}
	);
}






