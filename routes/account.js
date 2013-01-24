/**
 *
 *
 */
var twAccessor = require('../models/twitterAccessor');
var account_model = require('../models/account');
var models = require('../models');

exports.update = function(req, res) {
	console.log("update.");
	twAccessor.getFollowCandidate(function(accounts){
		console.log("update finished.");

		account_model.remove();

		for(var i in accounts) {
			//console.log(accounts[i]);

			/*
			var account = {
				id: accounts[i].id,
				name: accounts[i].name,
				screen_name: accounts[i].screen_name,
				followed_count: accounts[i].followed_count
			};
			*/
			var account = accounts[i];

			account_model.save(account);
		}
	});

	res.send("done.");
}

exports.show = function(req, res) {

	// DBから検索
}