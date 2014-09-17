/*jslint browser: true, nomen: true, unparam: true */
/*global $, nn, cms */

$(function () {
    'use strict';

    // NOTE: remember to change page-key to match file-name
    var $page = cms.index,
        $common = cms.common;

    $('#content-main-wrap').perfectScrollbar({marginTop: 10, marginBottom: 60});


    $(document).on('click', '.ov-cancel', function () {
        $.unblockUI();
    });

    $(document).on('click', '.btn-create', function () {
        var thisOption = $(this).attr("id"),
            objId = $(this).data("meta"),
            nextUrl = "index.html";

        switch (thisOption) {
            case "func-upvideo":
                nextUrl = "video-upload.html?cid=" + objId;
                break;

            case "func-episode":
                nextUrl = "epcurate-curation.html?cid=" + objId;
                break;
        }
        location.href = nextUrl;
    });

    $(document).on('click', '.btnNewEpisode', function () {
        var isVideoAuth = cms.global.USER_PRIV.isVideoAuth,
            objId = $(this).data("meta");

        if (isVideoAuth) {
            // flipr program && with isVideoAuth , can choose add yt episode or upload video
            $('#new-Episode-Option').empty();
            $('#new-Episode-Option-tmpl').tmpl({
                oid: objId
            }).appendTo('#new-Episode-Option');
            $.blockUI({
                message: $('#new-Episode-Option')
            });
            return false;
        } else {
            // flipr program && without isVideoAuth , only add yt episode
            $(this).attr("href", "epcurate-curation.html?cid=" + objId);
        }
    });


    // common unblock
    $('body').keyup(function (e) {
        if (27 === e.which) { // Esc
            $.unblockUI();
            $('#channel-list li').removeClass('deleting').removeData('deleteId');
            return false;
        }
        if (e.shiftKey && 191 === e.which) { // ? question mark
            $page.showCreateChannelTutorial();
        }
    });

    $(document).on('click', '.fucnYtSync', function () {
        var nowStatus = $(this).data("meta"),
            newStatus = "",
            actProgram = 0;

        if ("on" === nowStatus) {
            newStatus = "off";
            actProgram = $(this).data("program");
        } else if ("off" === nowStatus) {
            newStatus = "on";
            actProgram = $(this).data("program");
        }
        if (actProgram > 0) {
            nn.api('PUT', cms.reapi('/api/channels/{channelId}', {
                channelId: actProgram
            }), {
                autoSync: newStatus
            }, function (channel) {
                var actProgramId = "#ytSync_" + channel.id,
                    strIconUrl = "images/icon_youtube_sm_" + channel.autoSync + ".png";

                if (channel.id > 0) {
                    $(actProgramId).attr("src", strIconUrl);
                }
            });
        }
    });

    $(document).on('click', '.unblock, .btn-close, .btn-no, .btn-ok', function () {
        $.unblockUI();
        $('#channel-list li').removeClass('deleting').removeData('deleteId');
        return false;
    });

    $(document).on('click', '#create-live-program', function () {
        var chYoutubeLiveCount = $("#channel-list .ctypeYoutubeLive").length,
            cookieTerms = $.cookie('cms-ytubelive-term') || "no",
            strTermsFile = "lang/"+cms.global.USER_DATA.lang +'_YoutubeSyncTerms.html';

        if ((undefined === cookieTerms || "agree" != cookieTerms) && chYoutubeLiveCount < 1) {
            $('#terms-overlay').data("ctype", "live");
            $('#terms-overlay').empty();
            $('#terms-overlay-tmpl').tmpl().appendTo('#terms-overlay');
            $('#terms-overlay .terms-container').load(strTermsFile, function() {
                $('#terms-overlay .terms-container').perfectScrollbar();
                $.blockUI({
                    message: $('#terms-overlay')
                });
            });
        } else {
            $.cookie('cms-ytubelive-term', "agree");
            location.href = $page.channelYouLiveAddUrl;
        }
        return false;
    });

    $(document).on('click', '#create-youtube-program', function () {
        var chYoutubeSyncCoutn = $("#channel-list .ctypeYoutubeSync").length,
            cookieTerms = $.cookie('cms-ytubesync-term') || "no",
            strTermsFile = "lang/"+cms.global.USER_DATA.lang +'_YoutubeSyncTerms.html';

        if ((undefined === cookieTerms || "agree" != cookieTerms) && chYoutubeSyncCoutn < 1) {
            $('#terms-overlay').data("ctype", "sync");
            $('#terms-overlay').empty();
            $('#terms-overlay-tmpl').tmpl().appendTo('#terms-overlay');
            $('#terms-overlay .terms-container').load(strTermsFile, function() {
                $('#terms-overlay .terms-container').perfectScrollbar();
                $.blockUI({
                    message: $('#terms-overlay')
                });
            });
        } else {
            $.cookie('cms-ytubesync-term', "agree");
            location.href = $page.channelYouSyncAddUrl;
        }
        return false;
    });

    $(document).on('click', '#agree-terms', function () {
        var ctype = $('#terms-overlay').data("ctype") || "sync";
        if("live" === ctype){
            // youtube live add channel
            $.cookie('cms-ytubelive-term', "agree");
            location.href = $page.channelYouLiveAddUrl;
        }else{
            // youtube sync add channel
            $.cookie('cms-ytubesync-term', "agree");
            location.href = $page.channelYouSyncAddUrl;
        }
    });

    // program type filter
    $(document).on('click', '.lbTypeItem', function () {
        var thisObj = this,
            selectType = $(thisObj).val(),
            selectTypeTxt = ".ctype" + $(thisObj).val();

        $(".lbTypeLists").removeClass("checked");
        $(thisObj).parent().addClass("checked");
        $("#title-func .order").removeClass("disable");
        $(".group-tmpty-msg").addClass("hide");

        $(".chLi").addClass("hide").fadeOut(500);
        if ("all" !== selectType) {
            $(selectTypeTxt).removeClass("hide");
            $("#channel-counter").text($(selectTypeTxt).length);
            $("#title-func .order").addClass("disable");
            if ($(selectTypeTxt).length < 1) {
                $(".msg-" + selectType).removeClass("hide");
            }
        } else {
            $(".chLi").removeClass("hide");
            $("#channel-counter").text($(".chLi").length);
        }
        $("#content-main-wrap").scrollTop(0);
        $("#content-main-wrap").perfectScrollbar('update');
    });

    // you tube sync , sync direct
    $(document).on('click', '.sync', function () {
        // youtube sync add channel
        var thisLi = this,
            thisUl = $(thisLi).parent().parent(), 
            thisCh = $(this).data("meta"),
            thisChLi = $("#program_"+thisCh),
            thisChId = $(this).data("meta");

        // nn.log($(thisUl).find("li a").length);
        if (false === $(thisLi).hasClass("disable") && thisChId > 0) {
            nn.log("we going process sync...." + thisChId + "**" + $(thisChLi).attr("id"));

            $page.syncingUIDisable(thisChId);

            // $(thisUl).parent().parent().addClass("disable");

            // $(thisChLi).addClass("inSyncing");
                        
            // // set function butoon disable
            // $(thisUl).find("li a").addClass("disable");
            // // set th image to sync icon
            // $(thisChLi).find("a").removeAttr("href");
            // $(thisChLi).find(".photo-list div.ch").addClass("hide");
            // $(thisChLi).find(".photo-list div.ep img").attr("src", "images/ep_default.png");
            // $(thisChLi).find(".photo-list img.watermark").attr("src", "images/icon_load_l.gif");

            //  do sync command
            nn.api('PUT', cms.reapi('/api/channels/{channelId}/youtubeSyncData', {
                channelId: thisChId
            }), null, null);
            if ($page.syncingProcessCount > 3) {
                setTimeout($page.syncingProcess, 3000);
            }
        } else {
            // nn.log("sync....don't push again you already click it ~");
            return false;
        }
    });

    $(document).on('click', '#create-9x9-program', function () {
        location.href = "channel-add.html";
    });

    // overlay close button
    $(document).on('click', '.overlay-button-close, #cancel-create-program, #disagree-terms', function () {
        $.unblockUI();
    });    

    $(document).on('click', '.btn_create_new', function () {
        $('#create-program-overlay').empty();
        $('#create-program-overlay-tmpl').tmpl().appendTo('#create-program-overlay');
        $.blockUI({
            message: $('#create-program-overlay')
        });
        return false;
    });

    // leave and unsave
    function confirmExit() {
        if ($('body').hasClass('has-change')) {
            // Unsaved changes will be lost, are you sure you want to leave?
            return $('#unsave-prompt p.content').text();
        }
    }
    window.onbeforeunload = confirmExit;
    $('body').removeClass('has-change');
    $(document).on('click', '#header #logo, #header a, #studio-nav a, #content-nav a, #footer a, #channel-list a', function (e) {
        if ($('body').hasClass('has-change')) {
            if (e && $(e.currentTarget).attr('href')) {
                $('body').data('leaveUrl', $(e.currentTarget).attr('href'));
            }
            if (e && $(e.currentTarget).attr('id')) {
                $('body').data('leaveId', $(e.currentTarget).attr('id'));
            }
            $common.showUnsaveOverlay();
            return false;
        }
    });
    $('#unsave-prompt .btn-leave').click(function () {
        $('body').removeClass('has-change');
        $.unblockUI();
        if ($('body').data('leaveId') && -1 !== $.inArray($('body').data('leaveId'), ['logo', 'profile-logout', 'language-en', 'language-zh'])) {
            $('#' + $('body').data('leaveId')).trigger('click');
        } else if ($('body').data('leaveUrl')) {
            location.href = $('body').data('leaveUrl');
        } else {
            location.href = 'index.html';
        }
        return false;
    });

    // channel list sorting
    $('#title-func').on('click', 'p.order a.reorder', function () {
        if (!$("#title-func .order").hasClass("disable")) {
            $(this).text(nn._([cms.global.PAGE_ID, 'title-func', 'Save order'])).removeClass('reorder').addClass('save');
            $('#channel-list').sortable('enable');
            $('body').removeClass('has-change');
        }
        return false;
    });
    $('#title-func').on('click', 'p.order a.save', function () {
        var parameter = null,
            channels = [],
            $this = $(this);
        $('#channel-list > li').each(function () {
            if ($(this).data('meta') > 0) {
                channels.push($(this).data('meta'));
            }
        });
        if (channels.length > 0) {
            parameter = {
                channels: channels.join(',')
            };
        }
        if ($('body').hasClass('has-change') && null !== parameter) {
            $common.showSavingOverlay();
            nn.api('PUT', cms.reapi('/api/users/{userId}/channels/sorting', {
                userId: cms.global.USER_DATA.id
            }), parameter, function (data) {
                $('#overlay-s').fadeOut(1000, function () {
                    $this.text(nn._([cms.global.PAGE_ID, 'title-func', 'Reorder programs'])).removeClass('save').addClass('reorder');
                    $('#channel-list').sortable('disable');
                    $('body').removeClass('has-change');
                });
            });
        } else {
            $this.text(nn._([cms.global.PAGE_ID, 'title-func', 'Reorder programs'])).removeClass('save').addClass('reorder');
            $('#channel-list').sortable('disable');
            $('body').removeClass('has-change');
        }
        return false;
    });

    // channel list delete
    $('#channel-list').on('click', '.enable a.del', function () {
        nn.log("in program deleteinting........");
        if (false === $(this).hasClass("disable")) {
            $(this).parents('li').addClass('deleting').data('deleteId', $(this).attr('rel'));
            $common.showDeletePromptOverlay('Are you sure you want to delete this program? All data will be removed permanently.');
        }
        return false;
    });

    $('#channel-list').on('click', '#empty-item', function () {
        location.href = "channel-add.html";
        return false;
    });

    $('#delete-prompt .btn-del').click(function () {
        $.unblockUI();
        if ($('#channel-list li.deleting').length > 0 && $('#channel-list li.deleting').data('deleteId')) {
            $common.showSavingOverlay();
            nn.api('DELETE', cms.reapi('/api/users/{userId}/channels/{channelId}', {
                userId: cms.global.USER_DATA.id,
                channelId: $('#channel-list li.deleting').data('deleteId')
            }), null, function (data) {
                if ('OK' === data) {
                    $('#overlay-s').fadeOut(1000, function () {
                        var cntChannel = $('#channel-counter').text();
                        if (cntChannel > 0) {
                            $('#channel-counter').text(cntChannel - 1);
                        }
                        $('#channel-list li.deleting').remove();
                        $('#content-main-wrap').perfectScrollbar("update");
                        if (0 === $("#channel-list li.clearfix").length) {
                            $('#content-main-wrap .constrain').empty();
                            $('#channel-list-empty-tmpl').tmpl({
                                id: cms.global.USER_DATA.id
                            }).appendTo('#content-main-wrap .constrain');
                            $('#com-9x9-cycle p.cycle-pager').html('');
                            $('#com-9x9-cycle .wrapper ul.content').cycle({
                                pager: '.cycle-pager',
                                activePagerClass: 'active',
                                updateActivePagerLink: null,
                                fx: 'scrollHorz',
                                speed: 1000,
                                timeout: 6000,
                                pagerEvent: 'mouseover',
                                pause: 1,
                                cleartypeNoBg: true
                            });
                            $('#func-nav ul li.btns').addClass("hide");
                            $(".radio-list").addClass("hide");
                        }

                    });
                } else {
                    $('#overlay-s').fadeOut(0, function () {
                        nn.log('Delete error', 'error');
                    });
                }
            });
        } else {
            nn.log('Nothing to delete', 'error');
        }
        return false;
    });

    // NOTE: Keep Window Resize Event at the bottom of this file
    $(window).resize(function () {
        $('#content-main-wrap').perfectScrollbar("update");
    });
});