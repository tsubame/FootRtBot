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
exports.getRecents = getRecents;
exports.removeById = removeById;
exports.getTodaysCandidates = getTodaysCandidates;

/**
 * スキーマ定義
 */
/*
var schema = new mongoose.Schema({
	id:        { type: String, required: true },
	user_id:   { type: Number, required: true },
	user_name: { type: String, required: true },
	text:      { type: String, required: true },
	rt_count:  { type: Number},
	rt_user:   { type: String, required: false },
	posted:    { type: Date},
	created:   { type: Date}
});
*/

// id → id_str にする場合は 下の関数のidも変更すべき

var schema = new mongoose.Schema({
	id:          { type: String, required: true },
	user_id:     { type: String, required: true },
	user_name:   { type: String, required: true },
	user_s_name: { type: String },
	text:        { type: String, required: true },
	rt_count:    { type: Number},
	posted:      { type: Date, required: true},
	created:     { type: Date, required: true},
	rt_user:     { type: String}
});
/*
var schema = new mongoose.Schema({
	id_str:   { type: String, required: true },
	text:     { type: String, required: true },
	rt_count: { type: Number, required: true },
	posted:   { type: Date, required: true },
	created:  { type: Date, required: true },
	rt_user:  { type: String, required: false },
	user: {
		id_str:  { type: String, required: true },
		name:  { type: String, required: true },
		screen_name:  { type: String, required: false }//,
		//is_friend: { type: Boolean, required: false }
	}
});
*/

// コレクション名、スキーマ
mongoose.model('rt_candidate', schema);
// モデル
var RtCandidateModel = mongoose.model('rt_candidate');

/**
 * 削除
 */
function remove(tweet) {
	var model = new RtCandidateModel();

	try {
		RtCandidateModel.remove(tweet, function(err, result) {
			if (err) {
				console.log(err);
			}
		});
	} catch(e) {
		console.log(e);
	}
}

/**
 * 削除
 */
function removeById(tweet_id) {
	var tweet = null;
	var model = new RtCandidateModel(tweet);

	RtCandidateModel
	.where('id').equals(tweet_id)
	.find({})
	.exec(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			if (0 < result.length) {
				tweet = result[0];

				try {
					RtCandidateModel.remove(tweet, function(err, result) {
						if (err) {
							console.log(err);
						}
					});
				} catch(e) {
					console.log(e);
				}
			}
		}
	});
}

function selectByTweetId(tweet_id, callback) {
	var tweet = null;
	var model = new RtCandidateModel(tweet);

	RtCandidateModel
	.where('id').equals(tweet_id)
	.find({})
	.exec(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			if (0 < result.length) {
				tweet = result[0];

				callback(tweet);
			}
		}
	});
}

// 保存時の日付も列として設定すべき

/**
 * DBに保存
 *
 * @var obj tweet
 * @example
 */
function save(tweet) {
	var model = new RtCandidateModel(tweet);

	model.save(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			console.log('rt candidate saved.');
		}
	});
};

function saveIfNotExist(tweet) {
	var model = new RtCandidateModel(tweet);

	RtCandidateModel
	.where('id').equals(tweet.id)
	.find({})
	.exec(function(err, result) {
		if (err) {
			console.log(err);
		} else {
			if (0 == result.length) {
				save(tweet);
			}
			//console.log(result);
		}
	});
};


/**
 * 最近100件のツイートを取得
 *
 * @var function callback
 */
function getRecents(limit, callback) {

	if (!limit) {
		limit = 100;
	}

	//console.log(new Date());

	RtCandidateModel
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
 * 24時間以内のRT候補を取得
 *
 */
function getTodaysCandidates(callback) {
	//console.log(new Date());
	var mts = new Date().getTime();
	var ts = mts / 1000;
	var yesterdayTs = ts - 86400;

	var yesterday = new Date().setTime(mts - 86400000);

	RtCandidateModel
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