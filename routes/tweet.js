/**
 *
 *
 */
//var twAccessor = require('../models/twitterAccessor');
var models = require('../models');
//var AccountModel = models.AccountModel;
var retweet_model = require('../models/retweet');
var nodemailer = require("nodemailer");

/**
 * exports.
 */
exports.rtTweets = function(req, res){
	var twAccessor = require('../models/twitterAccessor');

	twAccessor.rtTweets(function(retweets) {
		console.log('finished.');
		console.log(retweets);

		var saveTweets = retweets;

		for(var i in saveTweets) {
			var retweet = saveTweets[i];

			retweet_model.save(retweet);
			console.log('saved.');
		}
	});

	res.render('index', { title: 'Express' });
};

exports.demo = function(req, res) {
	var twAccessor = require('../models/twitterAccessor');
	twAccessor.demo();

	res.send("done.");
}

exports.dbdemo = function(req, res) {
	res.send("done.");
}

function logic() {
	var todaysTweets = [];
	// 最近RTしたツイートを取得 とりあえず100件？
	retweet_model.getTodaysRetweets(function(retweets) {
		todaysTweets = retweets;
	});
	twAccessor.setRecentRetweets(todaysTweets);

	// TLを取得
	twAccessor.rtTweets(function(retweets) {
		var saveTweets = retweets;

		for(var i in saveTweets) {
			var retweet = saveTweets[i];

			retweet_model.save(retweet);
			console.log('saved.');
		}
	});
}


var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "apricot34",
        pass: "sheisagirl"
    }
});

exports.sendmail = function(req, res) {
	sendMail();
	res.send("done.");
}

function sendMail() {
	retweet_model.getTodaysRetweets(function(results) {
		//console.log(results);

		var full_text = '';

		for(var i = 0; i < results.length; i++) {
			var tweet = results[i];

			var text = 'user_name: ' + tweet.user_name + '\n' +
					'text: ' + tweet.text + '\n' +
					'RT: ' + tweet.rt_count + '\n\n'

			full_text += text;

		}
		//var text = result;
		console.log(full_text);

		var mailOptions = {
		    from: "test <apricot34@gmail.com>",
		    to: "dortmund23andcska18@gmail.com",
		    subject: "テスト2",
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
	//var text = '(。・ω・)ノ゛ コンチャ♪ ';
}
