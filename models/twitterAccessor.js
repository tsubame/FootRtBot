/**
 * Module dependencies.
 */
var OAuth = require('oauth').OAuth;
var async = require('async');
var http  = require('http');

/**
 * exports.
 */
exports.getFollowCandidate = getFollowCandidate; //showFollowCandidate;
exports.follow   = follow;
exports.demo     = function() {
	getMyFollowsByIds(function() {
		//console.log(my_follows);
	});
}
exports.rtTweets = getTlAndRT;


// 不要？
exports.auth = auth;
exports.authCallBack = authCallBack;
//exports.rtTweets = rtTweets;



// 外に出せる定数

/**
 * 自分のTwitterアカウント
 */
var MY_ACCOUNT = 'foot_rt';

/**
 * TLで取得するツイートの数
 */
var TL_GET_COUNT = 200;

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

// 以下3行、不要？
/**
 * リクエストトークンのURL
 */
var REQUEST_TOKEN_URL = 'https://api.twitter.com/oauth/request_token';

/**
 * アクセストークンのURL
 */
var ACCESS_TOKEN_URL  = 'https://api.twitter.com/oauth/access_token';

/**
 * OAUTHのコールバックで呼ばれるURL
 */
var OAUTH_CALLBACK_URL = 'http://127.0.0.1:3000/tweet/authCallBack';



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
 * TwitterAPIにアクセス GET
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
				console.log(err);
				return;
			}

			callback(data);
		}
	);
}

/**
 * フォローする候補を取得
 *
 * @var function callback
 */
function getFollowCandidate(callback) {

	async.series([
		function(cb) {
			//getMyFollows(cb);
			getMyFollowsByIds(cb);
		},
		function(cb) {
			//getFriendsOfMyFriends(cb);
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


//var url = 'https://api.twitter.com/1.1/friends/ids.json?screen_name=' + MY_ACCOUNT;

// 100件以上取れない
	accessApi(url, function(data) {
		var results = JSON.parse(data);
console.log(results);
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

		//console.log(my_follow_count);
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

		//getFollows(my_follows[k].id, function(users) {
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
			//console.log(follow_candidates);
			clearInterval(intId);
			callback();
		}

		//console.log('waiting...' + end_count);
	}, 500);
}

/**
 * タイムラインを取得して
 * 人気のツイートをRT
 *
 * @var function callback
 */
function getTlAndRT(callback) {
	var url = 'http://api.twitter.com/1/statuses/home_timeline.json?count=' + TL_GET_COUNT;
	accessApi(url, function(data) {
		var tweets = JSON.parse(data);
		for (var i in tweets) {
			var tweet = {
				id: tweets[i].id_str,
				text: tweets[i].text,
				user_name: tweets[i].user.name,
				rt_count: tweets[i].retweet_count
			};

			if (BASE_RT_COUNT < tweet.rt_count) {
				//retweetById(tweet.id);
				retweet(tweet);
				//console.dir(tweet);
			}
		}

		callback();
	});
}


// 要改良　引数をIDだけに　リツイート内容も表示へ
/**
 * ツイートをリツイートする
 *
 * @var obj tweet {id, user_name, text, rt_count}
 */

function retweet(tweet) {
	var url = 'https://api.twitter.com/1/statuses/retweet/' + tweet.id + '.json';

	oa.getProtectedResource (
		url,
		'POST',
		ACCESS_TOKEN,
		ACCESS_TOKEN_SECRET,
		function(err, data, response) {
			if(err){
				//console.log(err);
				//console.log(url);
				return;
			}
			//console.log(response);
			console.log(tweet);
		}
	)
}





function retweetById(id) {
	var url = 'https://api.twitter.com/1/statuses/retweet/' + id + '.json';

	oa.getProtectedResource (
		url,
		'POST',
		ACCESS_TOKEN,
		ACCESS_TOKEN_SECRET,
		function(err, data, response) {
			if(err){
				//console.log(err);
				//console.log(url);
				return;
			}
			//console.log(response);
			//console.log(data)
		}
	)
}




















//
// 以下、削除予定
//

/**
 * 人気のツイートをリツイート
 *
 * @var req
 * @var res
 * @return bool
 */
function rtTweets(req, res) {
	console.log(tokens);

// コールバックで認証後に実行するように
	// アクセストークンがなければ取得
	if (! isAuthorized()) {
		auth(req, res);

		return false;
	} else {
		getTimeLineAndRT();

		return true;
	}
}

/**
 * フォロー
 *
 */
function follow(screen_name) {
	var url = 'http://api.twitter.com/1/friendships/create.json?screen_name=' + screen_name;

	oa.getProtectedResource(
		url,
		'POST',
		ACCESS_TOKEN,
		ACCESS_TOKEN_SECRET,
		function(err, data, response) {
			if(err){
				console.log(err);
				return;
			}

			console.log(data);
		}
	);
}

var myFriends = {};
var accounts = {};

/**
 * 自分のフォローしているユーザを取得
 *
 * @var function callback
 */
function getMyFriends(callback) {
	var options = {
		host: 'api.twitter.com',
		path: '/1/statuses/friends.json?screen_name=' + 'foot_rt'
	};

	var req = http.get(options, function(res){
	    var data = ''
	    res.setEncoding('utf-8');
	    res.on('data', function(chunk) {
	        data += chunk;
	    });

	    res.on('end', function() {
			var results = JSON.parse(data);

	        for (var i in results) {
	        	/*
	        	myFriends[i] = {
					id: results[i].id_str,
					screenName: results[i].screen_name
				};
				*/
	        	var id = results[i].id_str;

				myFriends[id] = {
					id: results[i].id,
					id_str: results[i].id_str,
					name: results[i].name,
					screen_name: results[i].screen_name
				}
			}

			//console.log('end.');
	        //console.log(myFriends);
			callback();
	    });
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
}

/**
 * 自分がフォローしているユーザのフォローを表示
 *
 */
function getFriendsOfMyFriends(callback) {

	var endCount = 0;
	// マイフレンドの件数ループ
	for(var i in myFriends) {
		var options = {
			host: 'api.twitter.com',
			path: '/1/statuses/friends.json?screen_name=' + myFriends[i].screen_name
		};

		var req = http.get(options, function(res){
		    var data = ''
		    res.setEncoding('utf-8');
		    res.on('data', function(chunk) {
		        data += chunk;
		    });

		    res.on('end', function() {
				var results = JSON.parse(data);
				console.log(results.length + '件のアカウントを取得')

		        for (var j in results) {
					var id = results[j].id_str;

					if (myFriends[id]) {
						console.log('フォロー済み：' + myFriends[id].name);
						continue;
					}

					if (accounts[id]) {
						accounts[id].followed_count ++;
					} else {
						accounts[id] = {
								id: results[j].id,
								id_str: results[j].id_str,
								name: results[j].name,
								screen_name: results[j].screen_name,
								followed_count: 1
						}
					}
				}

				//console.log(users);
				endCount++;
		    });
		});

		req.on('error', function(e) {
			console.log('problem with request: ' + e.message);
		});
	}

	var intId = setInterval(function() {
		if(endCount == myFriends.length) {
			callback();

			clearInterval(intId);
		}
	}, 100);
}


/**
 * 特定のユーザがフォローしている人を表示
 *
 * @var screenName Twitterのアカウント @abcなどの@以降
 */
function getFriends(screenName, callback) {
	var users = [];

	var options = {
		host: 'api.twitter.com',
		path: '/1/statuses/friends.json?screen_name=' + screenName
	};

	var req = http.get(options, function(res){
	    var data = ''
	    res.setEncoding('utf-8');
	    res.on('data', function(chunk) {
	        data += chunk;
	    });

	    res.on('end', function() {
			var results = JSON.parse(data);

	        for (var i in results) {
	        	users[i] = {
					id: results[i].id_str,
					screenName: results[i].screen_name
				};

				var id = results[i].id_str;

				if (accounts[id]) {
					accounts[id].count ++;
				} else {
					accounts[id] = {
						id: results[i].id_str,
						screenName: results[i].screen_name,
						count: 1
					}
				}
			}
			//console.log(users);
			console.log(accounts);
	    });
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
}







// 以下、削除可能




/**
 * トークン保持用オブジェクト
 *
 * プロパティ：
 * 	requestToken
 *	requestTokenSecret
 *	accessToken
 *	accessTokenSecret
 */
var tokens = {};

/**
 * OAuthで認証済みか
 *
 * return bool
 */
function isAuthorized() {
	if (tokens.requestToken) {
		return true;
	} else {
		return false;
	}
}


/**
 * 認証処理
 * OAuth リクエストトークンを取得
 *
 * @var req
 * @var res
 */
function auth(req, res) {
	if (isAuthorized()) {
		console.log('OAuth認証済み');
		return;
	}

	oa.getOAuthRequestToken(
		function(error, oauth_token, oauth_token_secret, results){
			if (error) {
				console.log(error);
				return;
			} else {
				// リクエストトークンをプロパティに保持
				tokens.requestToken = oauth_token;
				tokens.requestTokenSecret = oauth_token_secret;
				// twitterの認証ページヘリダイレクト
				res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
			}
		}
	);
}

/**
 * OAuth認証のコールバックで呼ばれる関数
 * アクセストークンを取得
 *
 */
function authCallBack(req, res) {
	// エラー
	if (! req.query.oauth_token) {
		res.send('something invalid.');

		return;
	}
	var verifier = req.query.oauth_verifier;

	// アクセストークンを取得
	oa.getOAuthAccessToken(tokens.requestToken, tokens.requestTokenSecret, verifier,
		function(error, oauth_access_token, oauth_access_token_secret, results) {
			if (error){
				console.log(error);

				return;
			}
			tokens.accessToken = oauth_access_token;
			tokens.accessTokenSecret = oauth_access_token_secret;

			console.log(tokens);
		}
	);
}


