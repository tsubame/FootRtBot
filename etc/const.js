/**
 * app_configから定数を取得して設定
 */
var app_config = require('./app_config');


/**
 * 開発中は1
 * リリース時は0
 */
var DEV_LEVEL = app_config.dev_level;

/**
 * ログファイルのパス
 */
var LOG_FILE_PATH = './logs/error.log';

/**
 * log4jsのオプション
 */
exports.LOG4JS_CONFIG = {
		appenders: [{
		'type': 'file',
		'filename': LOG_FILE_PATH
		}]
	};

/**
 * この日数より前のツイートは無視
 *
 */
exports.SKIP_PAST_DAY = 2;

/**
 * TLから1度に取得するツイートの数
 */
exports.TL_GET_COUNT_ONCE = 200;

/**
 * TLから取得するツイートの件数
 */
exports.GET_TL_COUNT = app_config.get_tl_count;

// 削除予定
/**
 * この数以上のRT数でリツイート
 */
//exports.BASE_RT_COUNT = app_config.base_rt_count; //70;

/**
 * この数以上のRT数でリツイート
 */
exports.RETWEET_LEAST_RT = app_config.retweet_least_rt;

/**
 * この数以上でリツイート候補を取得（フォローしているユーザのツイート）
 */
exports.CAND_LEAST_RT_BY_FRIENDS = app_config.cand_least_rt_by_friends;

/**
 * この数以上でリツイート候補を取得（フォローしていないユーザのツイート）
 */
exports.CAND_LEAST_RT_BY_OTHERS = app_config.cand_least_rt_by_others;









/**
 * トップページのアドレス
 */
exports.APP_URL = app_config.app_url;

/**
 * OAuthコールバックのURL
 */
exports.OAUTH_CALLBACK_URL = app_config.app_url + 'auth/tweet/callback';


/**
 * log4j
 * ログファイル名
 *
 */
exports.LOG = {
		DIR: './logs/',
		INFO_FILE: 'info.log',
		ERROR_FILE: 'error.log'
}

/**
 * メールアカウント
 */
exports.MAIL = app_config.mail;

/**
 * 待受ポート番号
 */
exports.PORT = app_config.port;

/**
 * DBパラメータ
 */
exports.DB_PARAMS = app_config.db_params;

/**
 * アカウント
 *
 * WATCH_TL: TL監視用に使用
 * TWEET: つぶやき用に使用
 */
var ACCOUNT = {
	WATCH_TL: {
		screen_name:         '',
		consumer_key:        '',
		consumer_secret:     '',
		access_token:        '',
		access_token_secret: ''
	},
	TWEET: {
		screen_name:         '',
		consumer_key:        '',
		consumer_secret:     '',
		access_token:        '',
		access_token_secret: ''
	},
	DEV: {
		screen_name:         '',
		consumer_key:        '',
		consumer_secret:     '',
		access_token:        '',
		access_token_secret: ''
	}
}


/**
 * 開発時と稼動時でアカウント切り替え
 *
 */
if (DEV_LEVEL == 1) {
	ACCOUNT.WATCH_TL = app_config.twitter.WATCH_TL;
	ACCOUNT.TWEET    = app_config.twitter.DEV;

} else {
	ACCOUNT.WATCH_TL = app_config.twitter.WATCH_TL;
	ACCOUNT.TWEET    = app_config.twitter.TWEET;
}

//console.log(ACCOUNT);

exports.ACCOUNT = ACCOUNT;


