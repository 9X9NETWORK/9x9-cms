<?php

    $host = $_SERVER['HTTP_HOST'];
    list($msoName, $remain) = explode('.', $host, 2);
    $input = isset($_GET['input']) ? $_GET['input'] : 'index.html';

    $content = file_get_contents(__DIR__ . '/' . $input);

    $mso = json_decode(file_get_contents("http://localhost:8080/api/mso/$msoName"), true);
    if ($mso != null) {

        if ($mso['jingleUrl']) {

            $content = str_replace('href="favicon_flipr_pg.ico"',
                                   'href="' . htmlspecialchars($mso['jingleUrl']) . '"', $content);
        }

        if ($mso['cmsLogo']) {

            $content = str_replace('src="images/logo_flipr_pg.png"',
                                   'src="' . htmlspecialchars($mso['cmsLogo']) . '"', $content);
            $content = str_replace('data-mso="flipr"',
                                   'data-mso="' . htmlspecialchars($msoName) . '"', $content);
        }
    }

    header('Content-Type: text/html');
    header('Content-Length: ' . strlen($content));

    echo $content;

