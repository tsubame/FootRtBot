/**
 * requires.
 *
 */
var models = require('../models');
var nodemailer = require("nodemailer");
var async = require('async');
//var rt_cand_model = require('../models/rt_candidate_model');
var rt_candidate_model = require('../models/rt_candidate_model');

var twAccessor = require('../models/twitterAccessor');


/**
 * exports.
 */
exports.showRecents = showRecents;


/**
 * アクション
 */
function showRecents(req, res){
	var recent_candidates = [];
	async.series([
		function(callback) {
			rt_candidate_model.getRecents(100, function(results) {
				recent_candidates = results;
				callback();
			});
		}
	],
	function(err, results) {
		if(err) {
			throw err;
		} else {
			console.log(recent_candidates);

			res.render('index', { title: 'Express' });
		}
	});
};
