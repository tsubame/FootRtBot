/**
 * requires.
 *
 */
var models = require('../models');
var nodemailer = require("nodemailer");
var async = require('async');
var retweet_model = require('../models/retweet_model');
var rt_candidate_model = require('../models/rt_candidate_model');

var twAccessor = require('../models/twitterAccessor');


/**
 * exports.
 */
exports.rtTweets = rtTweets;

exports.sendmail = function(req, res) {
	sendMail();
	res.send("done.");
}

exports.setDeleted = function(req, res) {
	var tweet_id = String(req.params.tweet_id);
	rt_candidate_model.setDeleted(tweet_id);
	res.send("delete done.");
}

exports.demo = function(req, res) {
	twAccessor.demo();

	res.send("done.");
}

exports.dbdemo = function(req, res) {
	res.send("done.");
}

exports.rtFromCandidates = function(req, res) {
	rt_candidate_model.getTodaysCandidates(function(results) {
		var candidates = results;

		twAccessor.pickupRtFromNotFollows(candidates, function(rt_success_tweets) {
			console.log(rt_success_tweets);
			for(var i in rt_success_tweets) {
				retweet_model.save(rt_success_tweets[i]);
				rt_candidate_model.setDeleted(rt_success_tweets[i].id);
			}
		});
	});

	res.send("done.");
}

exports.rtFromCandidatesById = rtFromCandidatesById;

/**
 * アクション
 */
function rtTweets(req, res){
	var recent_retweets = [];
	async.series([
		/*function(callback) {
			// 最近RTしたツイートを取得
			retweet_model.getRecentRetweets(100, function(results) {
				recent_retweets = results;
				twAccessor.setRecentRetweets(recent_retweets);
				callback();
			});
		},*/
		function(callback) {
			twAccessor.rtTweets(function(rt_success_tweets, rt_candidates) {
				for(var i in rt_success_tweets) {
					retweet_model.save(rt_success_tweets[i]);
					//console.log('retweet saved.');
				}

				for(var i in rt_candidates) {
					rt_candidate_model.saveIfNotExist(rt_candidates[i]);
				}
			});
			callback();
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('finished!');

			res.send("done.");
		}
	});
};

/**
 * exports.
 */
exports.showCandidates = showCandidates;


/**
 * アクション
 */
function showCandidates(req, res){
	var recent_candidates = [];
	async.series([
		function(callback) {
			rt_candidate_model.getRecents(100, function(results) {
				recent_candidates = results;
				callback();
			});
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log(recent_candidates);

			res.render('rt_candidate', { candidates: recent_candidates });
		}
	});
};

exports.showRecentRetweets = showRecentRetweets;


/**
 * アクション
 */
function showRecentRetweets(req, res){
	var recent_retweets = [];
	async.series([
		function(callback) {
			// 最近RTしたツイートを取得
			retweet_model.getRecentRetweets(100, function(results) {
				recent_retweets = results;
				callback();
			});
		},
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			res.render('show_recent_rts', { retweets: recent_retweets });
		}
	});
};




/**
 * アクション
 */
function rtFromCandidatesById(req, res) {
	var tweet_id = String(req.params.tweet_id);

	twAccessor.retweetById(tweet_id, function(){

		var tweet = {
			id: tweet_id,
			user_id:   '　',
			user_name: '　',
			text:      '　',
			rt_count:  null
		}

		retweet_model.save(tweet);
		rt_candidate_model.setDeleted(tweet_id);
		res.send("done.");
	});
}

/**
 * アクション
 * メール送信
 *
 */
function sendMail() {


	retweet_model.getTodaysRetweets(function(results) {
		var smtpTransport = nodemailer.createTransport("SMTP",{
		    service: "Gmail",
		    auth: {
		        user: "apricot34",
		        pass: "sheisagirl"
		    }
		});

		var full_text = '';

		for(var i = 0; i < results.length; i++) {
			var tweet = results[i];
			var text = tweet.user_name + '\n' +
					'RT: ' + tweet.rt_count + '\n' + tweet.text + '\n' +
					 '\n\n';

			full_text += text;

		}
		console.log(full_text);

		var mailOptions = {
		    from: "100RTbot <apricot34@gmail.com>",
		    to: "dortmund23andcska18@gmail.com",
		    subject: "本日のRT",
		    text: full_text
		}

		smtpTransport.sendMail(mailOptions, function(error, response){
			if(error){
				console.log(error);
			} else {
		        console.log("Message sent: " + response.message);
		    }

		    smtpTransport.close();
		});
	});

	rt_candidate_model.getTodaysCandidates(function(results) {
		var smtpTransport = nodemailer.createTransport("SMTP",{
		    service: "Gmail",
		    auth: {
		        user: "apricot34",
		        pass: "sheisagirl"
		    }
		});

		var full_text = '';

		for(var i = 0; i < results.length; i++) {
			var tweet = results[i];

			var text = tweet.user_name + '\n' +
					'RT: ' + tweet.rt_count + '\n' + tweet.text + '\n' +
					 '\n\n';

			full_text += text;

		}
		console.log(full_text);

		var mailOptions = {
		    from: "100RTbot <apricot34@gmail.com>",
		    to: "dortmund23andcska18@gmail.com",
		    subject: "本日のRT候補",
		    text: full_text
		}

		smtpTransport.sendMail(mailOptions, function(error, response){
			if(error){
				console.log(error);
			} else {
		        console.log("Message sent: " + response.message);
		    }

		    smtpTransport.close();
		});
	});
}
