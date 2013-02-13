exports.test = {
	/**
	 * TLで取得するツイートの合計数
	 */
	TL_GET_COUNT: 500
}

exports.demo = function () {
	console.log('demo.');
}

/**
 * TLから1度に取得するツイートの数
 */
var TL_GET_COUNT_ONCE = 200;

exports.TL_GET_COUNT_ONCE = TL_GET_COUNT_ONCE;

/**
 * この数以上のRT数でリツイート
 */
var BASE_RT_COUNT = 100;

/**
 * OAuthコールバックのURL
 */
var OAUTH_CALLBACK_URL  = 'http://127.0.0.1:3000/auth/tweet/callback';



/**
 *
 */
var ACCOUNT = {

	WATCH_TL: {
		screen_name: 'foot_rt2',
		consumer_key: 'xeGIQrFfbEtYq6JxBxF6g',
		consumer_secret: 'sh5zxBMGDWtOB5t1P2O3oDMhnHJgQuArDmqnxApSUg',
		access_token: '1156953000-0GjxaYlc3aXWoNUvRMKkQ72eD5rTWcSXhkc1DEI',
		access_token_secret: 'JlrR8zB7zCadUoLJwbRZ8VphBWP4kE0C0WfFTSNNA'
	},
	TWEET: {
		screen_name: 'foot_rt',
		consumer_key: 'W3EFf1ufSQPKhJvzglSlg',
		consumer_secret: 'B3JAd5KKtA3OZht7sBU10h0VYrk1S2uwOCI2PF00g4',
		access_token: '1095087402-ucXlGjN7jCmsaSwLQtr9tfUrnKzHy7uA3jdfCc8',
		access_token_secret: 'rEI5xfh9WXnHT3w705L5r60abReVEiA2gCSjZqUxI'
	}
}

exports.ACCOUNT = ACCOUNT;


