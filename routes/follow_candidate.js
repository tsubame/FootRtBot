/**
 *
 *
 */
var async = require('async');
var CONST = require('../etc/const');
var tw = require('../models/twitter_accessor');
var candidate_model = require('../models/follow_candidate');

/**
 * フォロー候補を更新
 *
 */
exports.update = function(req, res) {
	console.log("update.");
	/*
	tw.getFollowCandidate(function(users){
		console.log("update finished.");

		candidate_model.remove();

		for(var i in users) {
			var user = users[i];

			candidate_model.save(user);
		}
	});
	*/





	res.send("done.");
}

/**
 *
 */
exports.show = function(req, res) {
	// DBから検索
	candidate_model.findByFollowedCount(150, function(users){
		res.render('follow_candidate', { users: users });
	});
}

/**
 *
 */
exports.follow = function(req, res) {

	//console.log(req.params.screen_name);
	tw.follow(req.params.screen_name);
	res.send("done.");

}



var my_friends = {};

/**
 * フォローする候補を取得
 *
 * @var function callback
 */
function getFollowCandidate(callback) {

	async.series([
		function(cb) {
			tw.getMyFriendIds(function(friends) {
				my_friends = friends;
			});
		},
		function(cb) {
			getFriendsOfMyFriends(cb);
	    }
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('success!');
			//callback(follow_candidates);
		}
	});
}

/**
 * 自分がフォローしているユーザのフォローを取得
 * follow_candidatesに取得する
 *
 * @var function callback
 */
function getFriendsOfMyFriends(callback) {
	var end_count = 0;

	// 自分がフォローしている件数ループ
	for(var id_str in my_friends) {
		tw.getFriendIds(id_str, function(users) {
			for (var i in users) {
				var user =  users[i];
				var key = user.id;

				if (my_friends[key]) {
					console.log('　フォロー済み：' + user.name);
					continue;
				}
/*
				if (follow_candidates[key]) {
					follow_candidates[key].followed_count ++;
				} else {
					follow_candidates[key] = user;
				}
*/
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
