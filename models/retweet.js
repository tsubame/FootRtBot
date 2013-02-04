/**
 * tweetsコレクションのモデル
 *
 */


/**
 * dependences.
 */
var mongoose = require('mongoose');

/**
 * exports.
 */
exports.save   = save;
exports.remove = remove;
exports.getTodaysRetweets = getTodaysRetweets;


/**
 * スキーマ定義
 */
var schema = new mongoose.Schema({
	id:        { type: Number, required: true },
	user_id:   { type: Number, required: true },
	user_name: { type: String, required: true },
	text:      { type: String, required: true },
	rt_count:  { type: Number},
	created:   { type: Date}
});

// コレクション名、スキーマ
mongoose.model('retweet', schema);
// モデル
var RetweetModel = mongoose.model('retweet');

/**
 * 削除
 */
function remove(tweet) {
	var model = new RetweetModel();

	try {
		RetweetModel.remove(candidate, function(err, result) {
			if (err) {
				console.log(err);
			}
		});
	} catch(e) {
		console.log(e);
	}
}

/**
 * DBに保存
 *
 * @var obj tweet
 * @example
 */
function save(tweet) {
	var model = new RetweetModel(tweet);

	model.save(function(err, result) {
		if (err) {
			console.log(err);
		}
	});
};

/**
 * 24時間以内のRTを取得
 *
 */
function getTodaysRetweets(callback) {

	console.log(new Date());

	var mts = new Date().getTime();
	var ts = mts / 1000;
	var yesterdayTs = ts - 86400;

	var yesterday = new Date().setTime(mts - 86400000);

	RetweetModel
	.find({})
	.where('created').gt(yesterday)
	.exec(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			callback(result);
		}
	});
}