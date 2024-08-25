(function() {
	'use strict';

	var INTERVAL_MSEC = 1000;

	// Checks whether the URL is correct. And then, gets the character ID from it.
	var matches = window.location.href.match(/^https?:\/\/hiroba\.dqx\.jp\/sc\/diary\/([0-9]+)/);
	if (!matches) {
		alert('「冒険日誌」に移動してから、再度本ブックマークを実行してください。');
		return;
	}
	var baseUrl = matches[0] + '/mode/0/page/';
	var charId = matches[1];

	var dt_ymd = [];
	var dt_cont = [];

	// Creates and displays own content box.
	$('#myBox').remove();
	$('#contentArea').prepend('<div id="myBox" class="cttBox" style="margin-bottom: 20px; padding: 28px 32px 20px 20px;"></div>');

	// Creates function calls.
	var callbacks = [];
	var pageNum = 1 + parseInt($('a.pagerBottom').attr('href').replace(/^.*\/(\d+)\/*$/, '$1'), 10);
	for (var i = 0; i < pageNum; i++) {
		/* jshint loopfunc: true */
		callbacks.push((function(index) {
			return function() {
				var d = $.Deferred();
				setTimeout(function() {
					$.get(baseUrl + index, function(data) {
						$.each($(data).find('div.bdBox1 div.article'), function() {
							// Picks a date string up.
							var ymd = $(this).find('p.txt_logDate').text();

							// Remove taking a picture info.
							var str = $(this).find('p.log_title').text();
							var m = str.match(/撮影場所/);
							if (m) {
								return true;
							}

							// Stores the value of date and contents at this moment.
							dt_ymd.push(ymd);
							dt_cont.push(str.trim());
						});

					}).done(function() {
						$('#myBox').text('Now loading...: ' + (index + 1) + ' / ' + pageNum);
						d.resolve();

					}).fail(function() {
						$('#myBox').text('Error');
						d.reject();
					});
				}, INTERVAL_MSEC);
				return d.promise();
			};
		})(i));
	}

	// Registers function calls and invokes them.
	var dfd = $.Deferred();
	dfd.resolve();
	for (var i = 0; i < callbacks.length; i++) {
		dfd = dfd.pipe(callbacks[i]);
	}
	dfd.done(function() {

		// Makes the CSV data.
		var csv = '\uFEFF';	// BOM for Microsoft Excel

		for (var i = 0; i < dt_ymd.length; i++) {
			csv += dt_ymd[i];
			csv += ',' + dt_cont[i];
			csv += '\n';
		}

		// Makes the base of the filename.
		var d = new Date();
		var fileName = 'diary_' + charId + '_' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);

		// Makes the content.
		$('#myBox').empty()
			.append('<h2 style="clear: both;">冒険日誌CSVデータ</h2>' +
				'<textarea id="myCsv" readonly="readonly" style="width: 100%; height: 30em;">' + csv + '</textarea>' +
				'<div id="myDownloadLink"></div>');

		// download link
		if ($.browser.msie) {
			$('#myDownloadLink').append('<iframe id="myDummy" style="visibility: hidden; width: 0; height: 0;"></iframe>')
				.append('<p>ファイルダウンロードリンク: <a href="#" onclick="var d = self.myDummy.document; d.open(); d.write(self.myCsv.value); d.close(); d.execCommand(&quot;SaveAs&quot;, true, &quot;' + fileName + '.csv&quot;); return false;">' + fileName + '.csv</a></p>');
		} else {
			$('#myDownloadLink').append('<p>ファイルダウンロードリンク: <a download = "' + fileName + '.csv" href="data:application/octet-stream,' + encodeURIComponent(csv) + '">' + fileName + '.csv</a></p>');

		}
	});
})();

