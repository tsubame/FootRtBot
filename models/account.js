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
exports.save = save;
exports.remove = remove;
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
mongoose.model('account', schema);
// モデル
var AccountModel = mongoose.model('account');

/**
 * 削除
 */
function remove(account) {
	var account_model = new AccountModel();

	/*
	account_model.remove(account, function(err) {
		  // ...
	});
	*/
	try {
		AccountModel.remove(account, function(err, result) {
			console.log(result);
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
 * @var obj account
 * {
 *		id: { type: Number, required: true },
 *		name: { type: String, required: true },
 *		screen_name: { type: String, required: true },
 *		followed_count: { type: Number}
 *	}
 *
 * @example
 *
 * var account = {
 * 		id: 1,
 * 		name: '田中',
 * 		screen_name: 'tanaka_k',
 * 		followed_count: 20
 * }
 */
function save(account) {
	var account_model = new AccountModel(account);

	account_model.save(function(err, result) {
		//console.log(result);
		if (err) {
			console.log(err);
		}
	});
};
