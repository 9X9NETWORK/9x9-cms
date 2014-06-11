/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, sub: true, vars: true */
/*global $, nn, cms */

$(function () {
    'use strict';

    // NOTE: remember to change page-key to match file-name
    var $page = cms['app-notification'],
        $common = cms.common;

    $(document).on('click', '.notifyEdit', function (e) {

        var editId = $(this).attr("id").split("_")[1];

        if ($(this).hasClass("disable")) {
            // only delete
            nn.log("..notifyEdit Disable");
        } else {
            // do edit process
            if (editId > 0) {
                location.replace("app-notification.html#edit");
                $common.showProcessingOverlay();
                $page.editNotify(editId);
            } else {
                location.href = "app-notification.html";
            }
        }

        return false;
    });

    $(document).on('click', '.notifyDel', function (e) {
        var showMsg = "Are you sure you want to delete this notification? All data will be removed permanently.",
            nid = $(this).data('nid');

        $('#confirm-prompt-basic').data("actli", nid);

        $('#confirm-prompt-basic .content').text(nn._([cms.global.PAGE_ID, 'notification', showMsg]));
        $.blockUI({
            message: $('#confirm-prompt-basic')
        });
        return false;
    });
    // sure to delete
    $(document).on('click', '#confirm-prompt-basic .btn-leave', function (e) {
        var nid = $("#confirm-prompt-basic").data('actli');
        // 待微調
        if (nid > 0) {
            nn.api('DELETE', cms.reapi('/api/push_notifications/{push_notificationId}', {
                push_notificationId: nid
            }), null, function (ret) {
                $('#confirm-prompt-basic').data("actli", "");
                $('#notify_' + nid).remove();
                $page.chkNewStatus();
                $.unblockUI();
                return false;
            });
        }
        return false;
    });

    $(document).on('click', '#notifySchedule', function (e) {
        if(!$(this).parent().hasClass('on')){
            $(".nav-tabs .tab-item").removeClass('on');
            $(this).parent().hasClass('on')
            $common.showProcessingOverlay();
            $page.getNotifySchedule();
        }

    });

    $(document).on('click', '#notifyHistory', function (e) {
        if(!$(this).parent().hasClass('on')){
            $(".nav-tabs .tab-item").removeClass('on');
            $(this).parent().hasClass('on')
            $common.showProcessingOverlay();
            $page.getNotifyHistory();
        }

    });

    $(document).on('click', '.f-schedule-type', function (e) {
        $page.scheduleChange();
    });

    $(document).on('click', '#run-app1, #run-app2', function (e) {

        var rValue = $(this).attr("id");

        if ("run-app1" === rValue) {
            $("#NotifyContent").val("");
            $("#NotifyContent").hide();
        } else {
            $("#NotifyContent").show();
        }

    });

    $(document).on('click', '.notify-form .vCancel', function (e) {
        if ($('body').hasClass('has-change')) {
            $common.showUnsaveOverlay();
        }else{
            location.replace("app-notification.html#OK");
            $page.initNotify();
        }
        return false;
    });

    $(document).on('click', '.notify-form .vSend', function (e) {

        $page.NotifySave();
        return false;
    });


    $(document).on('click', '#newNotify', function (e) {
        if (!$(this).hasClass("disable")) {
            location.replace("app-notification.html#add");
            $common.showProcessingOverlay();
            $page.newNotify();
        }
        return false;
    });


    $('.unblock, .btn-close, .btn-no, .setup-notice .btn-ok').click(function () {
        $.unblockUI();
        $('body').data('leaveUrl', "");
        $("#unsave-prompt .btn-leave").removeClass("switch-on-off");
        return false;
    });


    $(document).on('change', '#NotifyMessage, #run-app1, #run-app2', function (e) {
        $('body').addClass('has-change');

    });

    $(document).on('click', '#content-nav a, .select-list li a, .studio-nav-wrap a, #profile-dropdown a', function (e) {
        if ($('body').hasClass('has-change')) {
            if (e && $(e.currentTarget).attr('href')) {
                $('body').data('leaveUrl', $(e.currentTarget).attr('href'));
            }
            $common.showUnsaveOverlay();
            return false;
        }
    });



    $('#system-error .btn-ok, #system-error .btn-close').click(function () {
        $.unblockUI();
        if ($('body').hasClass('has-error')) {
            location.replace('index.html');
        }
        return false;
    });

    // leave and unsave
    $(document).on('click', '#unsave-prompt .btn-leave', function() {
        $('body').removeClass('has-change');

        if ($('body').data('leaveUrl')) {
            location.href = $('body').data('leaveUrl');
        } else {
            location.href = 'app-notification.html';
        }
        $.unblockUI();
        return false;
    });

    function confirmExit() {
        if ($('body').hasClass('has-change')) {
            // Unsaved changes will be lost, are you sure you want to leave?
            return $('#unsave-prompt p.content').text();
        }
    }
    window.onbeforeunload = confirmExit;
    // NOTE: Keep Window Resize Event at the bottom of this file
    $(window).resize(function () {
        var $storeList = $('#store-list');

        // Scroll to the exact bottom of the new window size.
        if ($storeList.scrollTop() + $storeList.height() > $storeList.find('.channel-list').height()) {
            $storeList.scrollTop($storeList.find('.channel-list').height() - $storeList.height());
        }

        $('#content-main-wrap').perfectScrollbar('update');

    });
});