
var mongoose = require('mongoose');

var DB_HOST = '127.0.0.1';
var DB_NAME = 'foot_rt';


exports.init = function(){
	try {
		mongoose.connect('mongodb://' + DB_HOST + '/' + DB_NAME);
	} catch (e) {
		console.log(e);
	}
}

/**
 * スキーマの定義
 */
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	name:  String,
	point: Number
});

mongoose.model('User', UserSchema);

// コレクション名, スキーマ
mongoose.model('super_user_mania', UserSchema);

var SuperUser = mongoose.model('super_user_mania');

var User = mongoose.model('User');

exports.User = User;

exports.SuperUser = SuperUser;

exports.save = function(user) {
	user.save(function(err, result) {
		console.log(result);
	});
}

/*
exports.demo = function() {
	var user = new User();
	user.name  = 'KrdLab';
	user.point = 777;
	user.save(function(err) {
	  if (err) { console.log(err); }
	});

	// ※注意：イベント駆動

	User.find({}, function(err, docs) {
	  for (var i=0, size=docs.length; i<size; ++i) {
	    console.log(docs[i].doc.name);
	  }
	});
}*/