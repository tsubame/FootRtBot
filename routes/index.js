
/*
 * GET home page.
 */
var models = require('../models');

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};

exports.demo = function(req, res) {
	console.log("demo");
	//models.demo();
}
