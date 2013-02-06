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
exports.rtTweets = rtTweets;//getTlAndRT;
exports.setRecentRetweets = function(retweets) {
	recent_retweets = retweets;
}

exports.demo = function() {
	rtTweets(function() {
		//console.log(tl_tweets);
		//console.log(rt_success_tweets);
		//console.log(should_rt_tweets);
		console.log(rt_candidates);
		//fo
	});
	/*
	rtTweetsNew(function() {
		console.log(retweets);
		console.log(now_rt_tweets);
	});
	*/
	/*
	getHomeTimeline(function() {
		console.log(tl_tweets);
	})*/
}


// 外に出せる定数

/**
 * 自分のTwitterアカウント
 */
var MY_ACCOUNT = 'foot_rt';

/**
 * TLで取得するツイートの数
 */
var TL_GET_COUNT = 500;

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

var REQUEST_TOKEN_URL   = 'https://api.twitter.com/oauth/request_token';

var ACCESS_TOKEN_URL    = 'https://api.twitter.com/oauth/access_token';

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

/**
 *
 */
var recent_retweets = [];

/**
 * 以下、名前熟考
 */


var retweets  = [];
var not_follow_tweets = [];
//var rt_candidates = [];

//var tl_tweets = [];
var tl_tweets = {};
var rt_candidates = {};
var rt_success_tweets = [];


var now_rt_tweets =[];



var friends_tweets;
var retweeted_by_friends;


var should_rt_tweets = {};

// TLを取得 → tl_tweets

// RTされたツイートなら


/*
tweets = {
		id: ,
		user_id: ,
		user_name: ,
		text: ,
		rt_count: ,
		created: ,
		is_friend_tweet: ,
		should_rt:
	}
*/



function showRtToMe(callback) {
	var url = 'http://api.twitter.com/1/statuses/retweeted_to_me.json?count=50';
var rt_tweets = {};
	accessApi(url, function(data) {
		var tweets = JSON.parse(data);

		for (var i in tweets) {
			var rt_user = null;
			// RTされたツイートか
			if (tweets[i].retweeted_status) {
				var tweet_data = tweets[i].retweeted_status;
				var is_friend_tweet = false;
				rt_user = tweets[i].user.name;
			} else {
				var tweet_data = tweets[i];
				var is_friend_tweet = true;
			}
			var	mts     =  Date.parse(tweet_data.created_at);
			var created = new Date().setTime(mts);
			var id = tweet_data.id_str;

			var tweet = {
				id: 	   tweet_data.id_str,
				user_id:   tweet_data.user.id_str,
				user_name: tweet_data.user.name,
				text:      tweet_data.text,
				created:   created,
				rt_count:  tweet_data.retweet_count,
				is_friend_tweet: is_friend_tweet,
				rt_user: rt_user
			};

if (rt_tweets[id]) {
	console.log('2件以上');
}

rt_tweets[id] = tweet;


			console.log(tweet.id);
		}

		callback();

		console.log(tweets.length + '件のツイートを取得');
	});
}


function rtTweets(callback) {
	async.series([
		function(cb) {
			getTimelineTweets(cb);
		},
		function(cb) {
			//retweetNotRt(cb);
			retweetAtOnce(cb);
	    }
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('success!');

			callback();
			//retweets = [];
			should_rt_tweets = {};
			tl_tweets = {};
			rt_candidates = {};
		}
	});
}

/**
 *
 */
function getTimelineTweets(callback) {
	var req_end_count = 0;
	var req_count = Math.ceil(TL_GET_COUNT / TL_GET_COUNT_ONCE);

	// 複数回リクエスト
	for (var n = 1; n <= req_count; n++) {
		//var url = 'https://api.twitter.com/1/statuses/home_timeline.json?count=' + TL_GET_COUNT_ONCE + '&page=' + n;
		var url = 'https://api.twitter.com/1.1/statuses/home_timeline.json?count=' + TL_GET_COUNT_ONCE + '&page=' + n;

		accessApi(url, function(data) {
			var tweets = JSON.parse(data);

			for (var i in tweets) {
				var rt_user = null;
				// RTされたツイートか
				if (tweets[i].retweeted_status) {
					var tweet_data = tweets[i].retweeted_status;
					var is_friend_tweet = false;
					rt_user = tweets[i].user.name;
				} else {
					var tweet_data = tweets[i];
					var is_friend_tweet = true;
				}
//console.log(tweets[i].user.name);
				var	mts     =  Date.parse(tweet_data.created_at);
				var created = new Date().setTime(mts);
				var id = tweet_data.id_str;

				var tweet = {
					id: 	   tweet_data.id_str,
					user_id:   tweet_data.user.id_str,
					user_name: tweet_data.user.name,
					text:      tweet_data.text,
					created:   created,
					rt_count:  tweet_data.retweet_count,
					is_friend_tweet: is_friend_tweet,
					rt_user: rt_user
				};

				tl_tweets[id] = tweet;

				// 100RT以上のツイートか？
				if (100 <= tweet.rt_count) {
					// フレンドのツイートか？
					if (tweet.is_friend_tweet == true) {
						should_rt_tweets[id] = tweet;
					} else {
						rt_candidates[id] = tweet;
						//console.log('フォローしてないユーザのツイート');
						//console.log(tweet);
					}

					console.log(tweet);
				}
			}

			req_end_count ++;
		});
	}

	var intId = setInterval(function() {
		if(req_end_count == req_count) {
			//console.log('finished.');
			//console.log(should_rt_tweets);
			clearInterval(intId);
			callback();
		}
	}, 500);
}

/**
 * リツイート対象をまとめてリツイート
 *
 *
 */
function retweetAtOnce(callback) {
	var end_count   = 0;
	var tweet_count = 0;
/*
	for(var i = 0; i < should_rt_tweets.length; i++) {
		tweet_count++;
	}
*/
	for (var id in should_rt_tweets) {
		tweet_count++;
	}

	// ツイートの件数ループ
	for (var id in should_rt_tweets) {
		retweet(should_rt_tweets[id], function() {
			end_count++;
		});
	}
/*
	for(var j = 0; j < retweets.length; j++) {
		retweet(retweets[j], function() {
			end_count++;
		});
	}
*/
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






// RT候補をDBに保存

function rtTweetsNew(callback) {
	async.series([
		function(cb) {
			// フォローしてるユーザのID一覧を取得
			getMyFollows(cb);
		},
		function(cb) {
			// TLを取得
			getHomeTimeline(cb);
		},
		function(cb) {
			// RT対象のツイートを取得
			pickupRtTweets(cb);
	    },
		function(cb) {
			//
			pickupRtFromNotFollows(cb);
	    },
		function(cb) {
			// まとめてRT
			retweetNotRt(cb);
	    }
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('success!');

			callback(retweets);
		}
	});
}




/**
 * タイムラインを取得
 *
 * @var function callback
 */
function getHomeTimeline(callback) {
	var req_end_count = 0;
	var req_count = Math.ceil(TL_GET_COUNT / TL_GET_COUNT_ONCE);

	// 複数回リクエスト
	for (var n = 1; n <= req_count; n++) {
		var url = 'https://api.twitter.com/1/statuses/home_timeline.json?count=' + TL_GET_COUNT_ONCE + '&page=' + n;
		//var url = 'https://api.twitter.com/1.1/statuses/home_timeline.json?count=' + TL_GET_COUNT_ONCE + '&page=' + n;
		accessApi(url, function(data) {
			var tweets = JSON.parse(data);

			for (var i in tweets) {
				var mts     =  Date.parse(tweets[i].created_at);
				var created = new Date().setTime(mts);
				//var tweet = {};

				var tweet_data = tweets[i];

				var is_others_tweet = false;
				if (tweets[i].retweeted_status) {
					//console.log(tweets[i]);
					tweet_data = tweets[i].retweeted_status;

					mts     =  Date.parse(tweets[i].retweeted_status.created_at);
					created = new Date().setTime(mts);
					is_others_tweet = true;
					/*
// RT先を取得する必要あり
					tweet = {
						id: tweets[i].retweeted_status.id_str,
						user_id:   tweets[i].retweeted_status.user.id_str,
						user_name: tweets[i].retweeted_status.user.name,
						text:      tweets[i].retweeted_status.text,
						rt_count:  tweets[i].retweeted_status.retweet_count,
						is_others_tweet: true,
						created:   created
					};
				} else {

					var tweet = {
						id: tweets[i].id_str,
						user_id:   tweets[i].user.id_str,
						user_name: tweets[i].user.name,
						text:      tweets[i].text,
						rt_count:  tweets[i].retweet_count,
						is_others_tweet: false,
						created:   created
					};*/
				}

				var tweet = {
						id: tweets[i].id_str,
						user_id:   tweet_data.user.id_str,
						user_name: tweet_data.user.name,
						text:      tweet_data.text,
						rt_count:  tweet_data.retweet_count,
						is_others_tweet: is_others_tweet,
						created:   created
					};


				tl_tweets.push(tweet);
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
 * RTすべきツイートを抽出
 *
 * @var function callback
 */
function pickupRtTweets(callback) {
	// TLのツイートの件数ループ
	for (var i = 0; i < tl_tweets.length; i++) {
		var tweet = tl_tweets[i];

		// RT数が少なければスキップ
		if (tweet.rt_count < BASE_RT_COUNT) {
			continue;
		// RT済みならスキップ
		} else if (recent_retweets[tweet.id]) {
			continue;
		}

		// フォローしてるユーザのツイートならRT用の配列に
		if (! tweet.is_others_tweet) {
			retweets.push(tweet);

			//console.log('フォローしているユーザのツイート');
			//console.log(tweet);
		} else {
			console.log('フォローしてないユーザのツイート');
			console.log(tweet);

			not_follow_tweets.push(tweet);
		}
	}

	callback();
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
 * リツイート対象をまとめてリツイート
 *
 *
 */
function retweetNotRt(callback) {
	var end_count  = 0;
	var tweet_count = 0;

	for(var i = 0; i < retweets.length; i++) {
		tweet_count++;
	}

	// ツイートの件数ループ
	for(var j = 0; j < retweets.length; j++) {
		retweet(retweets[j], function() {
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
/*
function retweetNotRt(callback) {
	var end_count  = 0;
	var tweet_count = 0;

	for(var i = 0; i < retweets.length; i++) {
		tweet_count++;
	}

	// ツイートの件数ループ
	for(var j = 0; j < retweets.length; j++) {
		retweet(retweets[j], function() {
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
*/
/**
 * リツイート対象をまとめてリツイート
 *
 *
 */
/*
function retweetNotRtNew(callback) {
	var end_count  = 0;
	var cand_count = 0;

	for(var i = 0; i < rt_candidates.length; i++) {
		cand_count++;
	}

	// リツイート候補の件数ループ
	for(var j = 0; j < rt_candidates.length; j++) {
		retweet(rt_candidates[j], function() {
			end_count++;
		});
	}

	var intId = setInterval(function() {
		if(end_count == cand_count) {
			clearInterval(intId);
			callback();
		}

	}, 500);
}
*/




/**
 * リツイート候補の中からリツイート
 *
 *
 */
/*
function retweetNotRt(callback) {
	var end_count  = 0;
	var cand_count = 0;

	for(var i = 0; i < rt_candidates.length; i++) {
		cand_count++;
	}

	// リツイート候補の件数ループ
	for(var j = 0; j < rt_candidates.length; j++) {
		retweet(rt_candidates[j], function() {
			end_count++;
		});
	}

	var intId = setInterval(function() {
		if(end_count == cand_count) {
			clearInterval(intId);
			callback();
		}

	}, 500);
}
*/

// 要改良　引数をIDだけに　リツイート内容も表示へ
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
				now_rt_tweets.push(tweet);//<Number
				rt_success_tweets.push(tweet);
			}

			callback();
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
 *
 */
/*
function rtTweets(callback) {
	async.series([
		function(cb) {
			getTlAndRT(cb);
		},
		function(cb) {
			retweetNotRt(cb);
	    }
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('success!');

			callback(retweets);
			retweets = [];
		}
	});
}
*/
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

			var mts =  Date.parse(tweets[i].created_at);
			var created = new Date().setTime(mts);

			var tweet = {
				id: tweets[i].id_str,
				user_id: tweets[i].user.id_str,
				user_name: tweets[i].user.name,
				text: tweets[i].text,
				rt_count: tweets[i].retweet_count,
				created: created // ts
			};

			var id = tweets[i].id_str;

			if (BASE_RT_COUNT < tweet.rt_count) {
				if (tweets[i].retweeted_status) {
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

				} else {
					retweets.push(tweet);
					console.log(tweet);
				}
			}
		}

		callback();
	});
}
//var retweets = [];




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



