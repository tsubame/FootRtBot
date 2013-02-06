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

/**
 * スキーマ定義
 */
var schema = new mongoose.Schema({
	id:        { type: String, required: true },
	user_id:   { type: Number, required: true },
	user_name: { type: String, required: true },
	text:      { type: String, required: true },
	rt_count:  { type: Number},
	rt_user:   { type: String, required: false },
	created:   { type: Date}
});

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