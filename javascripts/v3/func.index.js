/*jslint browser: true, nomen: true, unparam: true */
/*global $, nn, cms, $page*/

(function ($page) {
    'use strict';

    var $common = cms.common;
    $page.channel9x9 = 0;
    $page.channelYouSync = 0;
    $page.syncingProcessCount = 10;
    $page.channelYouSyncAddUrl = "channel-add.html#ytsync";
    $page.channelEmptyMsg = [{
        'msg_name': '9x9',
        'msg_body': "You don't have any FLIPr programs yet."
    }, {
        'msg_name': 'YoutubeSync',
        'msg_body': "You don't have any YouTube sync programs yet."
    }];

    // YouTube sync syncing processing
    $page.syncingProcess = function () {
        var theSyncs = $("li.inSyncing"),
            syncCount = theSyncs.length,
            thisId = 0,
            temp = [];

        if (syncCount > 0) {
            $page.syncingProcessCount = 0;

            $.each(theSyncs, function (i, chLi) {
                thisId = $(chLi).data('meta');

                nn.api('GET', cms.reapi('/api/channels/{channelId}', {
                    channelId: thisId
                }), null, function (channel) {
                    if ('failed' === channel.autoSync) {
                        $page.failedYoutubeSyncUIDisable(channel.id);
                    } else if (false === channel.readonly) {
                        channel.moreImageUrl_1 = cms.config.CHANNEL_DEFAULT_IMAGE;
                        channel.moreImageUrl_2 = cms.config.CHANNEL_DEFAULT_IMAGE2;
                        channel.moreImageUrl_3 = cms.config.CHANNEL_DEFAULT_IMAGE2;
                        if (channel.imageUrl && '' !== $.trim(channel.imageUrl) && channel.imageUrl !== cms.config.EPISODE_DEFAULT_IMAGE) {
                            channel.moreImageUrl_1 = channel.imageUrl;
                        }
                        if (cms.config.CHANNEL_DEFAULT_IMAGE === channel.moreImageUrl_1) {
                            channel.moreImageUrl_1 = 'images/ch_default.png';
                        }
                        if (channel.moreImageUrl && '' !== $.trim(channel.moreImageUrl)) {
                            temp = channel.moreImageUrl.split('|');
                            if (temp[0] && temp[0] !== cms.config.EPISODE_DEFAULT_IMAGE) {
                                channel.moreImageUrl_2 = temp[0];
                            }
                        }
                        channel.isYoutubeSync = true;

                        $("#program_" + channel.id).replaceWith($('#channel-list-tmpl-item').tmpl(channel, {
                            userId: cms.global.USER_DATA.id
                        }));
                    }
                });
            });
        } else {
            $page.syncingProcessCount += 1;
        }

        if ($page.syncingProcessCount <= 3) {
            setTimeout($page.syncingProcess, 3000);
        } else{
            $page.syncInvaild();
        }
    };

    // YouTube sync failed popup message
    $page.failedYoutubeSyncPopUpMsg = function (inCount) {
        var tmpStr = "";
        if(inCount > 1){
            tmpStr = "You have ? invalid YouTube sync programs.";
        } else {
            tmpStr = "You have ? invalid YouTube sync program.";
        }
        $.unblockUI();
        $('#system-notice .content').text(nn._([cms.global.PAGE_ID, 'overlay', tmpStr], [inCount]));
        $.blockUI({
            message: $('#system-notice')
        });
        setTimeout($.unblockUI, 4000);
    };
    // YouTube sync failed UI disable
    $page.failedYoutubeSyncUIDisable = function (inCh) {
        var thisChLi = $("#program_" + inCh);
        $(thisChLi).removeClass("inSyncing");
        $(thisChLi).addClass("isFailedYoutubeSync");

        $(thisChLi).find(".photo-list div.ch").addClass("hide");
        $(thisChLi).find(".photo-list div.ep img").attr("src", "images/ep_default.png");
        $(thisChLi)
            .find(".photo-list img.watermark")
            .attr("src", "images/icon_warning_lg.png")
            .attr("title", nn._([cms.global.PAGE_ID, 'channel-list', "Invalid original YouTube playlist"]))
            .css("left", "78px").css("top", "32px");

        $(thisChLi).find("a").removeAttr("href");
        $(thisChLi).find("ul li a").addClass("disable");
        $(thisChLi).find("ul li a.del").removeClass("disable");
        if("yes" === cms.global.USER_URL.param('releasethesync')){
            $(thisChLi).find("ul li a.sync").removeClass("disable");
        }
    };


    // YouTube sync sync failed after on load
    $page.syncInvaild = function () {
        var theSyncs = $("li.isFailedYoutubeSync"),
            syncCount = theSyncs.length,
            tmpFaild = $("#channel-list").data("syncfaild");

        if (syncCount > 0 && tmpFaild != syncCount) {
            $("#channel-list").data("syncfaild", syncCount);
            $page.failedYoutubeSyncPopUpMsg(syncCount);
        }
    };

    // YouTube sync sync failed after on load
    $page.syncFailedOnLoad = function () {
        var theSyncs = $("li.isFailedYoutubeSync"),
            syncCount = theSyncs.length,
            thisId = 0,
            temp = [];

        if (syncCount > 0) {
            $.each(theSyncs, function(i, chLi) {
                thisId = $(chLi).data('meta');

                $page.failedYoutubeSyncUIDisable(thisId);
            });

            $page.syncInvaild();
        }
    };

    // YouTube sync syncing UI disable
    $page.syncingUIDisable = function (inCh) {
        var thisChLi = $("#program_" + inCh);

        $(thisChLi).addClass("inSyncing");

        $(thisChLi).find(".photo-list div.ch").addClass("hide");
        $(thisChLi).find(".photo-list div.ep img").attr("src", "images/ep_default.png");
        $(thisChLi).find(".photo-list img.watermark").attr("src", "images/icon_load_l.gif").css("left", "78px").css("top", "32px");

        $(thisChLi).find("a").removeAttr("href");
        $(thisChLi).find("ul li a").addClass("disable");
    };

    // YouTube sync syncing after on load
    $page.syncingOnLoad = function () {
        var theSyncs = $("li.inSyncing"),
            syncCount = theSyncs.length,
            thisId = 0,
            temp = [];

        if (syncCount > 0) {
            $.each(theSyncs, function (i, chLi) {
                thisId = $(chLi).data('meta');

                $page.syncingUIDisable(thisId);

                nn.api('PUT', cms.reapi('/api/channels/{channelId}/youtubeSyncData', {
                    channelId: thisId
                }), null, null);

            });
            setTimeout($page.syncingProcess, 3000);
        }

        $page.syncFailedOnLoad();
    };

    $page.showCreateChannelTutorial = function () {
        $('#lightbox-create-channel').remove();
        $('#lightbox-create-channel-tmpl').tmpl().prependTo('body');
        $('.blockOverlay').height($(window).height() - 45);
        $.blockUI.defaults.overlayCSS.opacity = '0.9';
        $.blockUI({
            message: $('#lightbox-create-channel')
        });
    };

    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {
        nn.log({
            // NOTE: remember to change page-key to match file-name
            subject: 'CMS.PAGE.INITIALIZED: index',
            options: options
        }, 'debug');

        var pageId = cms.global.PAGE_ID;
        if (cms.global.USER_DATA.id) {
            $common.showProcessingOverlay();
            $page.channel9x9 = 0;
            $page.channelYouSync = 0;
            nn.api('GET', cms.reapi('/api/users/{userId}/channels', {
                userId: cms.global.USER_DATA.id
            }), null, function (channels) {
                var cntChannel = channels.length,
                    hasFavoriteChannel = false,
                    items = [],
                    temp = [];
                $('#title-func').html('');
                $('#title-func-tmpl').tmpl(null, {
                    cntChannel: cntChannel
                }).appendTo('#title-func');
                if (cntChannel > 0) {
                    $.each(channels, function (i, channel) {
                        temp = [];
                        channel.moreImageUrl_1 = cms.config.CHANNEL_DEFAULT_IMAGE;
                        channel.moreImageUrl_2 = cms.config.CHANNEL_DEFAULT_IMAGE2;
                        channel.moreImageUrl_3 = cms.config.CHANNEL_DEFAULT_IMAGE2;
                        if (channel.contentType === cms.config.YOUR_FAVORITE) {
                            hasFavoriteChannel = true;
                            channel.moreImageUrl_1 = 'images/favorite_ch.png';
                            if (channel.moreImageUrl && '' !== $.trim(channel.moreImageUrl)) {
                                temp = channel.moreImageUrl.split('|');
                                if (temp[0] && temp[0] !== cms.config.EPISODE_DEFAULT_IMAGE) {
                                    channel.moreImageUrl_2 = temp[0];
                                }
                            }
                            channel.name = cms.global.USER_DATA.name + nn._([pageId, 'channel-list', "'s Favorite"]);
                        } else {
                            if (channel.imageUrl && '' !== $.trim(channel.imageUrl) && channel.imageUrl !== cms.config.EPISODE_DEFAULT_IMAGE) {
                                channel.moreImageUrl_1 = channel.imageUrl;
                            }
                            if (cms.config.CHANNEL_DEFAULT_IMAGE === channel.moreImageUrl_1) {
                                channel.moreImageUrl_1 = 'images/ch_default.png';
                            }
                            if (channel.moreImageUrl && '' !== $.trim(channel.moreImageUrl)) {
                                temp = channel.moreImageUrl.split('|');
                                if (temp[0] && temp[0] !== cms.config.EPISODE_DEFAULT_IMAGE) {
                                    channel.moreImageUrl_2 = temp[0];
                                }
                            }
                        }
                        channel.isYoutubeSync = false;
                        // youtube sync channel check 
                        if (null !== channel.sourceUrl && channel.sourceUrl.length > 10) {
                            $page.channelYouSync += 1;
                            channel.isYoutubeSync = true;
                        } else {
                            $page.channel9x9 += 1;
                        }
                        items.push(channel);
                    });
                    $('#channel-list').html('');
                    $('#channel-list-empty-msg-item').tmpl($page.channelEmptyMsg, null).appendTo('#channel-empty-msg');
                    $('#channel-list-tmpl-item').tmpl(items, {
                        userId: cms.global.USER_DATA.id
                    }).appendTo('#channel-list');
                    // channel list sorting
                    $('#channel-list').sortable({
                        cursor: 'move',
                        revert: true,
                        change: function (event, ui) {
                            $('body').addClass('has-change');
                        }
                    });
                    $('#channel-list').sortable('disable');

                    // if has readonly
                    $page.syncingOnLoad();

                } else {
                    $("p.order").hide();
                    $(".curate").hide();
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
                if (cntChannel <= 0 || (1 === cntChannel && hasFavoriteChannel)) {
                    if (!$.cookie('cms-cct')) {
                        $.cookie('cms-cct', 'seen');
                        $page.showCreateChannelTutorial();
                    }
                }

                $('#content-main-wrap').perfectScrollbar("update");
                $('#overlay-s').fadeOut();
            });
        } else {
            location.href = '../';
        }
    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('index')));