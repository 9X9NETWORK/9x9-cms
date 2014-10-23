<?php
require_once ('libs/simple_html_dom.php');

// header("Content-Type:text/html; charset=utf-8");

$inUrl = $_GET["url"];

$retValue = Array();

$parseUrl = parse_url($inUrl);
$_hosts = $parseUrl["host"];
$_path = $parseUrl["path"];

$idList["url"] = "";
$idList["apiUrl"] = "";
$idList["accounts"] = "";
$idList["events"] = "";
$idList["videos"] = "";
$idList["caption"] = "";
$idList["thumbnail_url"] = "";

if (false !== strpos($_hosts, "livestream.com")) {

	if (false !== strpos($_path, "videos/")) {

		$tmpPath = explode("/", $_path);

		foreach ($tmpPath as $eKey => $eValue) {

			if ("videos" == $eValue) {
				$idList["videos"] = $tmpPath[$eKey + 1];
			}
		}

	}

	$html = file_get_html($inUrl);

	if ($html) {

		@$htmlSelect = $html->find('meta[content^=app-id]');

		if ("" != $htmlSelect[0]->content) {
			$arrTmp = explode(",", $htmlSelect[0]->content);
			foreach ($arrTmp as $eKey => $eValue) {
				if (false !== strpos($eValue, "app-argument")) {
					// $idList["url"] = explode("=", $eValue)[1];
					$tmpArr = explode("=", $eValue);
					$idList["url"] = $tmpArr[1];

					$tmpPath = explode("/", $idList["url"]);

					foreach ($tmpPath as $eKey => $eValue) {

						if ("accounts" == $eValue) {
							$idList["accounts"] = $tmpPath[$eKey + 1];
						} else if ("events" == $eValue) {
							$idList["events"] = $tmpPath[$eKey + 1];
						}
					}

				}
			}

			if ("" != $idList["accounts"] && "" != $idList["events"]) {
				$idList["apiUrl"] = sprintf("http://api.new.livestream.com/accounts/%s/events/%s", $idList["accounts"], $idList["events"]);
			}

			if ("" != $idList["videos"]) {
				$idList["url"] .= "/videos/" . $idList["videos"];
				$idList["apiUrl"] .= "/videos/" . $idList["videos"];
			}

			$apiContent = json_decode(file_get_contents($idList["apiUrl"]), true);

			if ("" != $idList["videos"]) {
				$idList["caption"] = $apiContent["caption"];
				$idList["thumbnail_url"] = $apiContent["thumbnail_url"];
			} else {
				$idList["caption"] = $apiContent["full_name"];
				$idList["thumbnail_url"] = $apiContent["logo"]["thumb_url"];
			}

			if ("" != $idList["url"] && "" != $idList["caption"]) {
				$retValue = array($idList);
			}
		}
	}

}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($retValue);
