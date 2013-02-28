/**
 *
 *
 */
var async   = require('async')
	, tw    = require('../models/twitter_accessor')
	, CONST = require('../etc/const');

tw.setLogConfig(CONST.LOG4JS_CONFIG);

/**
 * exports.
 */
exports.refollowAuto = refollowAuto;

/**
 * 
 */
var followers = {};

/**
 *
 */
var friends = {};	

/**
 *
 */
var not_follows = [];

/**
 * 取得する件数
 */	
var follower_get_count = 100;
var friend_get_count = 300;

/**
 * フォローしてない人をリフォロー
 *
 */
function refollowAuto(req, res) {
	initArray();
	tw.setAccount(CONST.ACCOUNT.TWEET);
	
	async.series([
  		function(callback) {
  			tw.getMyFollowerIds(follower_get_count, function(results) {
  				followers = results;
  				callback();
  			});
  		},
  		function(callback) {
  			tw.getMyFriendIds(friend_get_count, function(results) {
  				friends = results;
  				callback();	  				
  			});
  		},
  		function(callback) {
  			pickupNotFollows(function() {
	  			callback();
  			});
  		}
  	],
  	function(err, results) {
  		if(err) {
  			throw err;
  		} else {
  			var follow_end_count = 0;
  			for (var i = 0; i < not_follows.length; i++) {
  				tw.follow(not_follows[i], function() {
  					follow_end_count++;
  				});
  			}
  			
  			res.send("done.");
  		}
  	});
}

function initArray() {
	followers = {};
	friends = {};	
	not_follows = [];
}

function pickupNotFollows(callback) {
	// フォロワーの件数ループ
	for (var id in followers) {
		if (! friends[id]) {
			not_follows.push(id);	  
		}
	}
	//console.log(followers);
	//console.log(friends);
	console.log(not_follows.length + '件 未フォロー');
  	callback();
}
