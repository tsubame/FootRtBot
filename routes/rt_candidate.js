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
exports.rtAuto = rtAuto;
exports.showCandidates = showCandidates;
exports.deleteCandidate = deleteCandidate;
exports.rtManually = rtManually;

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


// 制限に引っかかるため要ロジック変更 or 廃止

/**
 * アクション
 *
 * RT候補をTL監視アカウントでリツイート
 *
 */
function rtAuto(req, res) {
	var action = require('../models/rt_from_candidates_action');

	action.exec();
	res.send("done.");
}

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
 *
 * RT候補を表示
 */
function showCandidates(req, res){
	rt_candidate_model.getTodaysCandidates(function(candidates) {

		for (var id in candidates) {
			var date = candidates[id].posted;
			var hour = date.getHours();
			var min = date.getMinutes();
			if (min < 10) {
				var minStr = '0' + String(min);
			} else {
				var minStr = String(min);
			}

			var month = date.getMonth() + 1;
			var day = date.getDate();
			var year = date.getFullYear();
			//console.log(hour + ':' + minStr + '　' + year + '年' + month + '月' + day + '日');

			var date_str = hour + ':' + minStr + '　' + year + '年' + month + '月' + day + '日';
			candidates[id].date_str = date_str;
		}

		res.render('rt_candidate', { candidates: candidates });
	});
};
