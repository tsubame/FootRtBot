/**
 * http://kuroneko.info:3000/ 用のJavascriptファイル
 * jQueryを使用
 *
 */

/*==========================================================
  変数の設定 切り替え可能な項目
===========================================================*/




//===========================================================
//jqueryイベント処理 ページ読み込み後
//===========================================================

/**
 * jQuery readyイベント
 */
$(function() {

	var site_id = null;

	info('test.');

	/**
	 * サイト更新用のダイアログを開く
	 */
	/*
	$(".editFormOpenButton").click(function() {
		// サイトIDを収得
		siteId = $(this).attr("name");
		// ダイアログオープン
		$("#siteEditDialog"+siteId).show();
	});


	$(".closeButton").click(function() {
		// ダイアログクローズ
		$(".dialog").hide();
	});
*/



	/*
	 * サイト編集画面
	 * カテゴリ変更ボタンを押した時
	 *
	$("input.changeCatButton").click(function() {
		// サイトIDを収得
		var id   = $(this).attr("name");
		// カテゴリメニューのIDを取得
		var category_id  =$("tr#tr" + id + " select.categoryId").get(0).selectedIndex + 1;

		var data = {
				"id": id,
				"category_id": category_id
			};

		// POSTでデータ送信
		$.post("update", data);
	});

	/**
	 * 未登録サイト一覧画面
	 * サイト登録ボタンを押した時
	 *
	 *
	$("input.registerButton").click(function() {
		// サイトIDを収得
		var siteId = $(this).attr("name");
		// フォームのデータを受け取る
		var category_id  =$("tr#tr" + siteId + " select.categoryId").get(0).selectedIndex + 1;

		var data = {
				"id": siteId,
				"is_registered": true,
				"category_id": category_id
			};

		// POSTでデータ送信
		$.post("edit", data);
		// 行を削除
		$("tr#tr" + siteId).hide();
	});


	 * サイト編集画面
	 * サイト更新ボタンを押した時
	 *
	$("input.editButton").click(function() {
		// フォームのデータを受け取る
		var id   = siteId;
		var name = $("tr#tr" + siteId + " input.name").val();
		var url  = $("tr#tr" + siteId + " input.url").val();
		var feed_url  =$("tr#tr" + siteId + " input.feedUrl").val();
		var category_id  =$("tr#tr" + siteId + " select.categoryIdDialog").get(0).selectedIndex + 1;

		var data = {
				"id": id,
				"name": name,
				"feed_url": feed_url,
				"url": url,
				"category_id": category_id
			};

		// POSTでデータ送信
		$.post("update", data);
	});

	/**
	 * リツイートボタンを押した時
	 */
	$("input.retweetCandidateButton").click(function() {
		// サイトIDを収得
		site_id = $(this).attr("name");

		var data = {
				"id": site_id
			};

		//jQuery("tr#tr" + siteId).hide();
		$("div#candidate_" + site_id).hide();
		var url = './rt_manually/' + site_id;
		// POSTでデータ送信
		$.get(url);
	});

	/**
	 * 削除ボタンを押した時
	 */
	$("input.deleteCandidateButton").click(function() {
		// サイトIDを収得
		site_id = $(this).attr("name");

		var data = {
				"id": site_id
			};

		//jQuery("tr#tr" + siteId).hide();
		$("div#candidate_" + site_id).hide();
		var url = './delete/' + site_id;
		// POSTでデータ送信
		$.get(url);
	});

});



/**
 * デバッグ用 firebugにメッセージを出力
 *
 * @param String msg 出力メッセージ
 */
function info(msg) {
	// ブラウザがmozilla系でなければ終了
	if ( !$.browser.mozilla ) {
		return;
	}

	console.info(msg);
}
