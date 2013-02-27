/**
 * sendRtMailActionの処理実行
 *
 *
 */


/**
 * requires.
 *
 */
var nodemailer = require("nodemailer");
var async = require('async');
var retweet_model = require('./retweet_model');
var rt_candidate_model = require('./rt_candidate_model');
var CONST = require('../etc/const');

/**
 * exports.
 */
exports.exec = exec;

/**
 * SmtpTransportオブジェクト
 *
 * @var object
 */
var smtpTransport;

/**
 * メールオプション
 *
 * @var object
 */
var mailOptions = {
    from: CONST.MAIL.FROM,
    to: CONST.MAIL.TO,
    subject: '',
    text: ''
};

/**
 * 処理実行
 *
 * 本日RTしたツイートとRT候補をメールで送信
 *
 */
function exec() {
	init();

	async.series([
		/*
		function(callback) {
			//sendTodaysRt(callback);
			callback();
		},*/
		function(callback) {
			sendTodaysCandidates(callback);
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log('mail send finished!');
			close();
		}
	});
}

/**
 * 初期化
 */
function init() {
	smtpTransport = nodemailer.createTransport('SMTP',{
	    service: CONST.MAIL.SERVICE,
	    auth: {
	        user: CONST.MAIL.USER_NAME,
	        pass: CONST.MAIL.PASSWORD
	    }
	});
}

/**
 * サーバから切断
 */
function close() {
	smtpTransport.close();
}

/**
 * 本日のRTをメール送信
 */
function sendTodaysRt(callback) {
	// 本日のRTを取得
	retweet_model.getTodaysRetweets(function(results) {
		var full_text = '';
		// 本文作成
		for (var id in results) {
			var tweet = results[id];
			var text = tweet.user_name + '\n' +
			'RT: ' + tweet.rt_count + '\n' + tweet.text + '\n\n\n';
			full_text += text;
		}
		/*
		for(var i = 0; i < results.length; i++) {
			var tweet = results[i];
			var text = tweet.user_name + '\n' +
				'RT: ' + tweet.rt_count + '\n' + tweet.text + '\n\n\n';
			full_text += text;
		}*/

		mailOptions.subject = "本日のRT";
		mailOptions.text = full_text;

		smtpTransport.sendMail(mailOptions, function(error, response){
			if(error){
				console.log(error);
			} else {
		        console.log("Message sent: " + response.message);
		    }

		    callback();
		});
	});
}

/**
 * 本日のRT候補をメール送信
 */
function sendTodaysCandidates(callback) {
	// 本日のRT候補を取得
	rt_candidate_model.getTodaysCandidates(function(results) {
		var full_text = '';

		full_text += CONST.APP_URL + 'rt_candidate/show　\n\n';
		// 本文作成
		for (var id in results) {
			var tweet = results[id];
			var text = tweet.user_name + '\n' +
			'RT: ' + tweet.rt_count + '\n' + tweet.text + '\n\n\n';
			full_text += text;
		}

		mailOptions.subject = "本日のRT候補";
		mailOptions.text = full_text;

		smtpTransport.sendMail(mailOptions, function(error, response){
			if(error){
				console.log(error);
			} else {
		        console.log("Message sent: " + response.message);
		    }

		    callback();
		});
	});
}
