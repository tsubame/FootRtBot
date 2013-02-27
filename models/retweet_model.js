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
exports.saveIfNotExist = saveIfNotExist;
exports.remove = remove;
exports.getTodaysRetweets = getTodaysRetweets;
exports.getRecentRetweets = getRecentRetweets;

// signal 飛んできたら閉じる
process.on('SIGINT', function() {
	try {
		mongoose.disconnect();
	} catch (e) {
		console.log(e);
	}
});


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

// コレクション名、スキーマ
mongoose.model('retweets', schema);
// モデル
var RetweetModel = mongoose.model('retweets');

/**
 * 削除
 */
function remove(tweet) {
	//var model = new RetweetModel();
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
		} else {
			console.log('retweet saved.');
		}
	});
};

/**
 * なければ保存
 *
 * @var obj tweet
 */
function saveIfNotExist(tweet) {
	//var model = new RetweetModel(tweet);
	RetweetModel
	.where('id').equals(tweet.id)
	.find({})
	.exec(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			if (0 == result.length) {
				save(tweet);
			}
		}
	});
};

/**
 * 24時間以内のRTを取得
 *
 */
function getRecentRetweets(limit, callback) {
	var tweets = {};
	if (! limit) {
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
			for (var i = 0; i < result.length; i++) {
				var id = result[i].id;
				tweets[id] = result[i];
			}
			callback(tweets);
		}
	});
}

/**
 * 24時間以内のRTを取得
 *
 */
function getTodaysRetweets(callback) {
	var tweets = {};
	var mts = new Date().getTime();
	var yesterday = new Date().setTime(mts - 86400000);

	RetweetModel
	.find({})
	.where('created').gt(yesterday)
	.sort('-created')
	.exec(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			for (var i = 0; i < result.length; i++) {
				var id = result[i].id;
				tweets[id] = result[i];
			}
			console.log(tweets);
			callback(tweets);
		}
	});
}