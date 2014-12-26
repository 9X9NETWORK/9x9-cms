/*jslint browser: true, nomen: true, unparam: true */
/*global $, nn, cms, $page*/

(function ($page) {
    'use strict';

    var $common = cms.common;
    $page.actEpisode = 0;
    $page.channel9x9 = 0;
    $page.channelYouSync = 0;
    $page.syncingProcessCount = 10;
    $page.paging = {
        cntItems: 0,
        pageLimit: 20,
        cntPages: 0,
        currentPage: 0
    };
    $page.channelYouSyncAddUrl = "channel-add.html#ytsync";
    $page.channelYouLiveAddUrl = "channel-add.html#ytlive";
    $page.channelEmptyMsg = [{
        'msg_name': '9x9',
        'msg_body': "You don't have any Curated programs yet."
    }, {
        'msg_name': 'YoutubeSync',
        'msg_body': "You don't have any Sync programs yet."
    }, {
        'msg_name': 'YoutubeLive',
        'msg_body': "You don't have any live programs yet."
    }];

    $page.edFilter = function (inSH) {
        // inSH {true:enalbe, false:disabled}
        if (inSH) {
            $("#filterProgram .enable").removeClass("disabled");
        } else {
            $("#filterProgram .enable").addClass("disabled");
        }
    };

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
                        channel.isYoutubeLive = false;

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
            tmpStr = "You have ? invalid Sync programs.";
        } else {
            tmpStr = "You have ? invalid Sync program.";
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
            .attr("title", nn._([cms.global.PAGE_ID, 'channel-list', "Invalid auto-sync, please sync again and reset in settings."]))
            .css("left", "78px").css("top", "32px");

        $(thisChLi).find("a").removeAttr("href");
        $(thisChLi).find("ul li a").addClass("disable");
        $(thisChLi).find("ul li a.del").removeClass("disable");
        $(thisChLi).find("ul li a.sync").removeClass("disable");
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

    // get programs by part
    $page.getPrograms = function () {
        $page.paging.currentPage ++;
        nn.api('GET', cms.reapi('/api/users/{userId}/channels', {
            userId: cms.global.USER_DATA.id
        }), {
            page: $page.paging.currentPage
        }, function (channels) {
            var cntChannel = channels.length,
                hasFavoriteChannel = false,
                items = [],
                temp = [];

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
                    channel.isYoutubeLive = false;
                    if (13 == channel.contentType) {
                        // check if live program
                        channel.isYoutubeLive = true;
                    } else if (null !== channel.sourceUrl && channel.sourceUrl.length > 10) {
                        // youtube sync channel check 
                        $page.channelYouSync += 1;
                        channel.isYoutubeSync = true;
                    } else {
                        $page.channel9x9 += 1;
                    }
                    items.push(channel);
                });

                $('#channel-list-empty-msg-item').tmpl($page.channelEmptyMsg, null).appendTo('#channel-empty-msg');
                $('#channel-list-tmpl-item').tmpl(items, {
                    userId: cms.global.USER_DATA.id
                }).appendTo('#channel-list');

            }

            $('#content-main-wrap').perfectScrollbar("update");
            if ($page.paging.currentPage === 1) {
                $("#title-func .order").addClass("disable");
                $('#overlay-s').fadeOut();
            }

            if(1 === $page.paging.currentPage && cntChannel !== $page.paging.cntItems && cntChannel !== $page.paging.pageLimit){
                $page.paging.pageLimit = cntChannel;
                $page.paging.cntPages = Math.ceil($page.paging.cntItems / $page.paging.pageLimit);
            }

            if ($page.paging.cntPages === $page.paging.currentPage) {
                // last page
                // channel list sorting
                $('#channel-list').sortable({
                    cursor: 'move',
                    revert: true,
                    change: function(event, ui) {
                        $('body').addClass('has-change');
                    }
                });
                $('#channel-list').sortable('disable');

                $("#title-func .order").removeClass("disable");

                // if has readonly
                $page.syncingOnLoad();
                $page.edFilter(true);

            }else{
                $page.getPrograms();
                $page.edFilter(false);
            }
        });
    };

    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {
        nn.log({
            // NOTE: remember to change page-key to match file-name
            subject: 'CMS.PAGE.INITIALIZED: index',
            options: options
        }, 'debug');

        $common.setupUserCampaignId();
        var pageId = cms.global.PAGE_ID;
        $page.paging.cntItems = cms.global.USER_DATA.cntChannel;
        $page.paging.cntPages = Math.ceil($page.paging.cntItems / $page.paging.pageLimit);
        $page.paging.currentPage = 0;

        if (cms.global.USER_DATA.id) {
            $common.showProcessingOverlay();
            $page.channel9x9 = 0;
            $page.channelYouSync = 0;

            $('#title-func').html('');
            $('#title-func-tmpl').tmpl(null, {
                cntChannel: $page.paging.cntItems
            }).appendTo('#title-func');
            if ($page.paging.cntItems > 0) {
                // list protgrams
                $('#channel-list').html('');
                $page.getPrograms();
            } else {
                // empty program
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

                if (!$.cookie('cms-cct')) {
                    $.cookie('cms-cct', 'seen');
                	$('#overlay-s').fadeOut();
                    $page.showCreateChannelTutorial();
                }else{
                	$('#overlay-s').fadeOut();
                }

            }
        } else {
            location.href = '../';
        }
    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('index')));