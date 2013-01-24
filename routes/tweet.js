/**
 *
 *
 */
var twAccessor = require('../models/twitterAccessor');
var models = require('../models');
//var AccountModel = models.AccountModel;

var account_model = require('../models/account');

/**
 * exports.
 */
exports.auth =  function(req, res){
	twAccessor.auth(req, res);

}

exports.authCallBack = function(req, res){
	twAccessor.authCallBack(req, res);

	console.log("got token.");
}

exports.rtTweets = function(req, res){
	twAccessor.rtTweets(function() {
		console.log('finished.');
	});

	res.render('index', { title: 'Express' });
};

exports.demo = function(req, res) {
	twAccessor.demo();
	res.send("done.");
}

exports.dbdemo = function(req, res) {
	dbdemo();
	res.send("done.");
}

function dbdemo() {
	account = {
		id: 1,
		name: "demo",
		screen_name: "デモ",
		followed_count: 1
	}

	account_model.remove();

	account_model.save(account);



	/*
	var user = new models.User ({
		name: "demo",
		point: 200
	});

	models.save(user);

	var user = new models.SuperUser ({
		name: "demo",
		point: 200
	});

	models.save(user);
	*/
	/*

	user.save(function(err, result) {
		console.log(result);
	});*/
}