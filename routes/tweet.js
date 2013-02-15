/**
 * requires.
 *
 */
var retweet_model      = require('../models/retweet_model')
  , rt_candidate_model = require('../models/rt_candidate_model')
  , tw                 = require('../models/twitter_accessor')
  , CONST              = require('../etc/const');


/**
 * exports.
 */
exports.rtTweets = rtTweets;
exports.rtFromCandidates = rtFromCandidates;
exports.rtManually = rtManually;

exports.sendRtMail = sendRtMail;
exports.showCandidates = showCandidates;
exports.showRecentRetweets = showRecentRetweets;
exports.deleteCandidate = deleteCandidate;

exports.demo = demo;


/**
 * アクション
 *
 * TLを取得して100RT以上のものをリツイート
 */
function rtTweets(req, res){
	var action = require('../models/rt_tweets_action');
	action.exec();

	res.send("done.");
};

/**
 * アクション
 *
 * RT候補のツイートに削除マークを付ける
 */
function deleteCandidate(req, res) {
	var tweet_id = String(req.params.tweet_id);
	rt_candidate_model.setDeleted(tweet_id);

	res.send("done.");
}


/**
 * アクション
 *
 * RT候補のうちフォローしたユーザが2人以上RTしているものをリツイート
 *
 */
function rtFromCandidates(req, res) {
	var action = require('../models/rt_from_candidates_action');

	action.exec();
	res.send("done.");
}


/**
 * アクション
 *
 * 最近のRTを表示
 */
function showRecentRetweets(req, res){
	retweet_model.getRecentRetweets(100, function(recent_retweets) {
		res.render('show_recent_rts', { retweets: recent_retweets });
	});
};


/**
 * アクション
 *
 * RT候補を表示
 */
function showCandidates(req, res){
	rt_candidate_model.getRecents(100, function(recent_candidates) {
		res.render('rt_candidate', { candidates: recent_candidates });
	});
};


/**
 * アクション
 *
 * RT候補から手動でリツイート
 *   http:// ~ /tweet/rtFromCandidatesById/○○ ←URLのここにツイートIDが入る
 */
function rtManually(req, res) {
	var tweet_id = String(req.params.tweet_id);

	tw.setAccount(CONST.ACCOUNT.TWEET);
	tw.retweet(tweet_id, function(tweet){
		if (tweet) {
			retweet_model.save(tweet);
			rt_candidate_model.setDeleted(tweet_id);
		}

		res.send("done.");
	});
}

/**
 * アクション
 * 最近のRTとRT候補をメールで送信
 */
function sendRtMail(req, res) {
	var action = require('../models/send_rt_mail_action');
	action.exec();

	res.send("done.");
}

/**
 * デモコード
 */
function demo(req, res) {
	tw.setAccount(CONST.ACCOUNT.TWEET);
	tw.demo();

	res.send("done.");
}
