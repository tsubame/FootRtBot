/**
 *
 *
 */
var twAccessor = require('../models/twitterAccessor');
var candidate_model = require('../models/follow_candidate');
var models = require('../models');

/**
 * フォロー候補を更新
 *
 */
exports.update = function(req, res) {
	console.log("update.");
	twAccessor.getFollowCandidate(function(users){
		console.log("update finished.");

		candidate_model.remove();

		for(var i in users) {
			var user = users[i];

			candidate_model.save(user);
		}
	});

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
	twAccessor.follow(req.params.screen_name);
	res.send("done.");

}