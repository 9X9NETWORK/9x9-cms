<?php
require_once ('libs/simple_html_dom.php');

$inUrl = $_GET["url"];

$retValue = Array();

$parseUrl = parse_url($inUrl);
$_hosts = $parseUrl["host"];
$_path = $parseUrl["path"];

$idList["v_read"] = 0;

if (false !== strpos($_hosts, "vimeo.com")) {

	$idList["t_start"] = microtime(true);

	$html = file_get_html($inUrl);
	$idList["t_getfile"] = microtime(true);

	if($html){
		// 第一次
		// $dataArea = $html->find('#clip', 0);

		// $video_info = $dataArea->find('.js-player', 0);

		// $auther = $dataArea ->find("a[rel=author]", 0);

		// $idList["v_read"] = 1;
		// $idList["v_url"] = $inUrl;
		// $idList["v_uploader_id"] = str_replace("/", "", $auther->getAttribute("href"));
		// $idList["v_uploader"] = $auther->plaintext;
		// $idList["uploaded"] = $video_info->getAttribute('data-timestamp');
		// $idList["v_duration"] = $video_info->getAttribute('data-duration');
		// $idList["v_thumbnail"] = $video_info->getAttribute('data-base') . ".jpg";
		// $idList["v_title"] = $dataArea->find('.js-clip_title', 0)->plaintext;
		// $idList["v_desc"] = $dataArea->find('.js-clip_description p.first', 0)->plaintext;

		// new
		$arrId = explode("vimeo.com/", $inUrl);

		$dataArea = $html->find('#cols', 0);

		$video_info = $dataArea->find('.js-player', 0);

		$auther = $dataArea ->find("a[rel=author]", 0);

		$idList["v_read"] = 1;
		$idList["v_url"] = $inUrl;
		$idList["id"] = $arrId[1];
		$idList["embedUrl"] = $dataArea->find('link[itemprop=embedUrl]', 0)->getAttribute('href');
		$idList["thumbnail"] = $dataArea->find('link[itemprop=thumbnailUrl]', 0)->getAttribute('href');

		$idList["title"] = $dataArea->find('meta[itemprop=name]', 0)->getAttribute('content');
		$idList["description"] = $dataArea->find('meta[itemprop=description]', 0)->getAttribute('content');
		$idList["uploaded"] = $dataArea->find('meta[itemprop=uploadDate]', 0)->getAttribute('content');

		$idList["uploader"] = str_replace("/", "", $auther->getAttribute("href"));
		$idList["uploader_name"] = $auther->plaintext;
		$idList["duration"] = $video_info->getAttribute('data-duration');


		$idList["t_end"] = microtime(true);

		$idList["t_parser"] = $idList["t_end"] - $idList["t_getfile"];

	}
	$idList["t_loading"] = $idList["t_getfile"] - $idList["t_start"];
	$retValue = $idList;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($retValue);


