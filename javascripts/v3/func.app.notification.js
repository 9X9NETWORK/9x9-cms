/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, sub: true, vars: true */
/*global $, nn, cms */

(function ($page) {
    'use strict';

    var $common = cms.common;
// /api/mso/{msoId}/push_notifications

    $page.NotifySave = function () {
        var isNotifyiOS = cms.global.MSOINFO.apnsEnabled || false,
            isNotifyAndroid = cms.global.MSOINFO.gcmEnabled || false,
            isNotifyAvailable = false;

        var inMessage = $("#NotifyMessage").val().trim(),
            tmpContent = $common.playerUrlParser($("#NotifyContent").val().trim()),
            inContent = "",
            inDate = "NOW";

        if (true === tmpContent.isAllow && undefined !== tmpContent.chId) {
            inContent = cms.global.MSOINFO.name + ":" + tmpContent.chId;
            if (undefined !== tmpContent.epId) {
                inContent += ":" + tmpContent.epId;
            }
        }

        if ("" !== inMessage) {
            nn.api('POST', cms.reapi('/api/mso/{msoId}/push_notifications', {
                msoId: cms.global.MSO
            }), {
                msoId: cms.global.MSO,
                message: inMessage,
                content: inContent,
                scheduleDate: inDate
            }, function(ret) {
                $page.initNotify();
            });
        }else{
            // 輸入錯誤
            $common.showSystemErrorOverlay(nn._([cms.global.PAGE_ID, 'notification', 'Please fill in all required fields.']));
        }

    };

    $page.newNotify = function () {
        var isNotifyiOS = cms.global.MSOINFO.isNotifyiOS || false,
            isNotifyAndroid = cms.global.MSOINFO.isNotifyAndroid || false,
            isNotifyAvailable = false;

        $("#channel-sub-name").text(" > " + nn._([cms.global.PAGE_ID, 'title-func', 'Create a app notification']));

        $('#content-main-wrap .constrain').html('');
        // $('#notify-comm-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
        $('#notify-form-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
$('#overlay-s').fadeOut("slow");
        // nn.log(cms.global.MSOINFO.name);
    };

    $page.getNotifyAvailable = function () {
        var isNotifyiOS = cms.global.MSOINFO.isNotifyiOS || false,
            isNotifyAndroid = cms.global.MSOINFO.isNotifyAndroid || false,
            isNotifyAvailable = false,
            retVal = "You don't have been authorized to send notifications to the iOS app Android app users.";

        if (isNotifyiOS === true && isNotifyAndroid === true) {
            retVal = "You have been authorized to send notifications to the iOS app and Android app users.";
        } else if (isNotifyiOS === true) {
            retVal = "You have been authorized to send notifications to the iOS app users.";

        } else if (isNotifyAndroid === true) {
            retVal = "You have been authorized to send notifications to the Android app users.";

        }
        return nn._([cms.global.PAGE_ID, 'notification', retVal]);

    }

    $page.getNotifyHistory = function () {
        var isNotifyiOS = cms.global.MSOINFO.apnsEnabled || false,
            isNotifyAndroid = cms.global.MSOINFO.gcmEnabled || false,
            isNotifyAvailable = false;

        $('#content-main-wrap .constrain').html('');
        $('#notify-comm-tmpl').tmpl([{extMsg: $page.getNotifyAvailable()}]).appendTo('#content-main-wrap .constrain');


        nn.api('GET', cms.reapi('/api/mso/{msoId}/push_notifications', {
            msoId: cms.global.MSO
        }), null, function(HistoryLists) {
            var cntList = HistoryLists.length;

            if (cntList < 1) {
                $page.getEmptyUI(true);
            } else {
                $("#channel-sub-name").text(" > "+nn._([cms.global.PAGE_ID, 'title-func', 'History']));
                $('#notify-list-wrap-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
                $('#notify-list-item-tmpl').tmpl(HistoryLists).appendTo('#list-history');
            }
            $('#overlay-s').fadeOut("slow");

        });


    };


    $page.getEmptyUI = function (newEnable) {
        $('#content-main-wrap .constrain').html('');
        $('#notify-comm-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
        $('#notify-intro-image-tmpl').tmpl().appendTo('#content-main-wrap .constrain');

        if (true === newEnable) {
            $("#newNotify").removeClass("disable");
        }
    };

    $page.initNotify = function () {
        var isNotifyiOS = cms.global.MSOINFO.isNotifyiOS || false,
            isNotifyAndroid = cms.global.MSOINFO.isNotifyAndroid || false,
            isNotifyAvailable = false;

        isNotifyiOS = true;

        // cms.global.Notify.isNotifyiOS = isNotifyiOS;
        // cms.global.Notify.isNotifyAndroid = isNotifyAndroid;

        $common.showProcessingOverlay();
        if (isNotifyiOS === true || isNotifyAndroid === true) {
            isNotifyAvailable = true;
        }

        if (isNotifyAvailable === true) {
            $page.getNotifyHistory();
        } else {
            $page.getEmptyUI(isNotifyAvailable);
            $('#overlay-s').fadeOut("slow");
        }
    };

    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {

        $common.showProcessingOverlay();

        nn.log({
            // NOTE: remember to change page-key to match file-name
            subject: 'CMS.PAGE.INITIALIZED: app-notification',
            options: options
        }, 'debug');

        var msoId = cms.global.MSO;
        $page.testMsg= "oh a oh a";
        if (msoId < 1) {
            location.href = "./";
        } else {
            $page.initNotify();

            $('#func-nav .langkey').each(function () {
                $(this).text(nn._([cms.global.PAGE_ID, 'func-nav', $(this).data('langkey')]));
            });
            $('#title-func .langkey').each(function () {
                $(this).text(nn._([cms.global.PAGE_ID, 'title-func', $(this).data('langkey')]));
            });
            $('.intro .langkey').each(function () {
                $(this).text(nn._([cms.global.PAGE_ID, 'title-func', $(this).data('langkey')]));
            });

            $('#content-main-wrap').perfectScrollbar({ marginTop: 25, marginBottom: 63 });

            
        }

    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('app-notification')));