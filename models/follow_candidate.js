/**
 * accountsコレクションのモデル
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
exports.findByFollowedCount = findByFollowedCount;


/**
 * スキーマ定義
 */
var schema = new mongoose.Schema({
	id: { type: Number, required: true },
	name: { type: String, required: true },
	screen_name: { type: String, required: true },
	followed_count: { type: Number}
});

// コレクション名、スキーマ
mongoose.model('follow_candidate', schema);
// モデル
var CandidateModel = mongoose.model('follow_candidate');

/**
 * 削除
 */
function remove(candidate) {
	var candidate_model = new CandidateModel();

	try {
		CandidateModel.remove(candidate, function(err, result) {
			//console.log(result);
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
 * @var obj user
 * {
 *		id: { type: Number, required: true },
 *		name: { type: String, required: true },
 *		screen_name: { type: String, required: true },
 *		followed_count: { type: Number}
 *	}
 *
 * @example
 *
 * var user = {
 * 		id: 1,
 * 		name: '田中',
 * 		screen_name: 'tanaka_k',
 * 		followed_count: 20
 * }
 */
function save(user) {
	var candidate_model = new CandidateModel(user);

	candidate_model.save(function(err, result) {
		//console.log(result);
		if (err) {
			console.log(err);
		}
	});
};

/**
 * フォロー件数の多い順に取得
 *
 */
function findByFollowedCount(limit, callback) {
	var DEFAULT_LIMIT_COUNT = 150;

	if (! limit) {
		limit = DEFAULT_LIMIT_COUNT;
	}

	CandidateModel.find({},
		null,
		{
			sort: {followed_count: -1},
			limit: limit
		},
		function(err, result) {
			//console.log(result);
			if (err) {
				console.log(err);
			} else {
				callback(result);
			}
		}
	);
}