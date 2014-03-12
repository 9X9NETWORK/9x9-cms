/*global cms */
/*global $, nn, cms */
(function ($geturl) {
    'use strict';

    $geturl.shareUrlBaseParser = function (inUrl, inMsoName) {
        var inURL = $.url(inUrl),
            arrHost = inURL.attr("host").split('.'),
            tmpPreFix = "",
            retValue = "http://",
            is9x9Url = false,
            isProduction = false,
            isTypeA = true; // typeA [dev6.flipr.tv] :: else [cts.dev6.flipr.tv]


        if ("dev6" === arrHost[0] || "beagle" === arrHost[0]) {
            isProduction = false;
        } else if ("dev6" === arrHost[1] || "beagle" === arrHost[1]) {
            isProduction = false;
            isTypeA = false;
        } else {
            isProduction = true;
        }
        tmpPreFix = inMsoName;

        if ("9x9" === inMsoName || "flipr" === inMsoName) {
            tmpPreFix = "www";
            is9x9Url = true;
        }

        if (isProduction) {
            arrHost.splice(0, 1, tmpPreFix); // 置換
        } else {
            if (!isTypeA && is9x9Url) {
                // remvoe first name ex: cts.dev6.flipr.tv remvoe cts 
                arrHost.shift();
            } else if (!isTypeA && !is9x9Url) {
                arrHost.splice(0, 1, tmpPreFix); // 置換
            } else if (isTypeA && !is9x9Url) {
                arrHost.splice(0, 0, tmpPreFix); // 插入
            }
        }

        retValue += arrHost.join('.');

        return retValue;
    };

    $geturl.iniSharingList = function (inObj) {
        var strCid = '',
            strEid = '',
            strBrand = '',
            strBaseURL = cms.global.SHARE_URL_BASE,
            strSurl = '',
            userUrlFile = cms.global.USER_URL.attr('file'),
            inURL = $.url(cms.global.SHARE_URL_BASE),
            arrHost = inURL.attr("host").split('.');

        if ('' === userUrlFile) {
            userUrlFile = 'index.html';
        }
        strBrand = inObj.find('.select-txt-gray').text();

        strBaseURL = $geturl.shareUrlBaseParser(cms.global.SHARE_URL_BASE, strBrand) + "/view";

        strCid = inObj.data('metach');
        strEid = inObj.data('metaep');
        if (userUrlFile === 'index.html') {
            // play to program level 
            strSurl = [strBaseURL, 'p' + strCid].join('/');
        } else {
            // play to episode level
            strSurl = [strBaseURL, 'p' + strCid, 'e' + strEid].join('/');
        }
        if (cms.global.IS_REMARK) {
            $(".tip-bottom").css("right", 42);
        }
        return strSurl;
    };

    // NOTE: remember to change page-key to match func-name
}(cms.namespace('get-url')));