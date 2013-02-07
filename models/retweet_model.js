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
exports.getRecentRetweets = getRecentRetweets;

/**
 * スキーマ定義
 */

var schema = new mongoose.Schema({
	id:          { type: String, required: true },
	user_id:     { type: String, required: true },
	user_name:   { type: String, required: true },
	user_s_name: { type: String },
	text:        { type: String, required: true },
	rt_count:    { type: Number},
	posted:      { type: Date},
	created:     { type: Date},
	rt_user:     { type: String}
});

/*
var schema = new mongoose.Schema({
	id_str:   { type: String, required: true },
	text:     { type: String, required: true },
	rt_count: { type: Number, required: true },
	posted:   { type: Date, required: true },
	created:  { type: Date, required: true },
	rt_user:  { type: String, required: true },
	user: {
		id_str:  { type: String, required: true },
		name:  { type: String, required: true },
		screen_name:  { type: String, required: false },
		is_friend: { type: Boolean, required: false }
	}
});
*/
// コレクション名、スキーマ
mongoose.model('retweets', schema);
// モデル
var RetweetModel = mongoose.model('retweets');

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
function getRecentRetweets(limit, callback) {

	if (!limit) {
		limit = 100;
	}

	RetweetModel
	.find({})
	.limit(limit)
	.sort('-created')
	.exec(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			callback(result);
		}
	});
}

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
	.sort('-created')
	.exec(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			callback(result);
		}
	});
}