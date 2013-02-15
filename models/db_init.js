/**
 * dependences.
 */
var mongoose = require('mongoose');

/**
 * DBパラメータをセットして
 * DBに接続
 *
 * @var params DBパラメータ
 */
exports.connect = function(params) {
	db_params = params;
	connect();
}

var db_params = {
		host: '',
		name: ''
}

/**
 * 接続
 */
function connect(){
	try {
		mongoose.connect('mongodb://' + db_params.host + '/' + db_params.name );
	} catch (e) {
		console.log(e);
	}
}