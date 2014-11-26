/*jslint browser: true, nomen: true, unparam: true */
/*global $, nn, cms, FB */

$(function () {
    'use strict';

    // NOTE: remember to change page-key to match file-name
    var $page = cms.channel,
        $common = cms.common;

    // common unblock
    $('body').keyup(function (e) {
        if (27 === e.which) { // Esc
            $.unblockUI();
            if ($(this).hasClass('has-error')) {
                location.replace('index.html');
            }
            return false;
        }
    });

    $(document).on('click', '.imgUploadBtn', function () {
        var btnClick = $(this),
            blockUpload = btnClick.parent(),
            fileUpload = blockUpload.find(".toUploadImage");
        if(!btnClick.hasClass("disabled")){
            fileUpload.click();
        }
    });

    $(document).on('change', '.toUploadImage', function () {
        if(this.files.length >0){
            $page.doImageUpload($(this), this.files[0]);
        }
    });

    $(document).on('click', '.system-confirm-btn', function () {
        var msgOverlay = $('#system-confirm-alert-overlay'),
            btnAct = $(this).data("act");

        if ($(msgOverlay).hasClass("isPaidAgree")) {
            // paid confirm
            $(msgOverlay).removeClass("isPaidAgree");
            if ("yes" === btnAct) {
                $("#settingForm").data("isPaidAgree", "yes");
                $.unblockUI();
                if (cms.global.USER_URL.attr('file') === 'channel-setting.html') {
                    $("#settingForm .btn-save.enable").trigger("click");
                } else {
                    $("#settingForm .btn-create.enable").trigger("click");
                }
            } else if ("no" === btnAct) {
                $.unblockUI();
            }
        }else if($(msgOverlay).hasClass("isStoreSwitch")) {
            // store switch to off
            $(msgOverlay).removeClass("isStoreSwitch");
            if ("yes" === btnAct) {
                $page.storePoolOnOff("off");
                $.unblockUI();
            } else if ("no" === btnAct) {
                $.unblockUI();
            }
        }
    });

    $(document).on('change', '#tmpSocialFeeds', function () {
        var thisObj = $(this),
            opObj = $("#socialFeeds"),
            inURL = $.url(thisObj.val()),
            tmpPath = inURL.attr("path").split("/"),
            fbPage = "";

        if (2 === tmpPath.length) {
            fbPage = tmpPath.pop();
        }

        if ("https://www.facebook.com" === inURL.attr("base") && "" !== fbPage) {
            thisObj.val(inURL.attr("base") + "/" + fbPage);
            opObj.val("facebook " + fbPage + ";");
        } else {
            thisObj.val("");
            opObj.val("");
        }
    });

    $(document).on('click', '#add-store-switch', function () {
        if ($(this).hasClass("switch-on")) {
            var msgOverlay = $('#system-confirm-alert-overlay');
            $(msgOverlay).addClass("isStoreSwitch");
            $(msgOverlay).find('.vMsg').text(nn._([cms.global.PAGE_ID, 'setting-form', 'The subscribers and paid users can‘t watch the program after you change to unpublished. Are you sure to change to unpublish?']));
            $(msgOverlay).find('.scov-yes').text(nn._(['overlay', 'button', 'Yes']));
            $(msgOverlay).find('.scov-no').text(nn._(['overlay', 'button', 'No']));

            $.blockUI({
                message: msgOverlay
            });
        } else {
            $page.storePoolOnOff("on");
        }
        return false;
    });

    $(document).on('click', '#youtube-sync-switch', function () {
        if ($(this).hasClass("switch-on")) {
            $page.youtubeYyncOnOff("off");
        } else {
            var msgOverlay = $('#youtube-sync-alert-overlay');
            $(msgOverlay).find('.vMsg').text(nn._([cms.global.PAGE_ID, 'setting-form', 'This program will automatically synchronize videos from video source at 0 AM, 8 AM, 12 PM, 2 PM, 6 PM and 9 PM every day. Are you sure to auto sync?']));
            $(msgOverlay).find('#yes-sync').text(nn._(['overlay', 'button', 'Yes']));
            $(msgOverlay).find('#no-sync').text(nn._(['overlay', 'button', 'No']));

            $.blockUI({
                message: msgOverlay
            });
            // $page.youtubeYyncOnOff(true);
        }
        return false;
    });

    $(document).on('click', '#yes-sync', function () {
        $page.youtubeYyncOnOff("on");
        $.unblockUI();
        return false;
    });

    $(document).on('change', '#ytUrlLive', function () {
        var thisUrl = $(this).val().trim(),
            ytUrlParse = $common.ytUrlLiveParser(thisUrl),
            ytObj = {},
            strDefErr = nn._([cms.global.PAGE_ID, 'setting-form', 'Invalid URL, please check the URL and try again.']);

        $("#ytSyncMsg").html("");
        $("#ytSyncMsg").addClass("hide");
        $("#ytUrlLive").data("status", "");

        if (1 === ytUrlParse.ytType) {
            $("#intro").val("");
            $("#name").val("");
            ytObj = {
                url: ytUrlParse.ytUrlApi,
                dataType: "json",
                context: self,
                success: function (res) {
                    var ytTitle = "",
                        ytDesc = "",
                        ytImg = "images/ch_default.png",
                        ytImgCount = 0,
                        ytLiveDuration = (res).data.duration,
                        ytLiveStatus = "",
                        ytObjSub = {};

                    if (undefined !== (res).data.status && undefined !== (res).data.status) {
                        ytLiveStatus = (res).data.status.value;
                    }
                    if (0 == ytLiveDuration && "processing" === ytLiveStatus) {
                        // live video
                        if (ytUrlParse.ytType === 1) {
                            ytTitle = (res).data.title;
                            ytDesc = (res).data.description;

                            if (undefined !== (res).data.thumbnail.hqDefault) {
                                ytImg = (res).data.thumbnail.hqDefault;
                            } else {
                                ytImg = (res).data.thumbnail.sqDefault;
                            }
                        } else {
                            ytTitle = (res).feed.title.$t;
                            ytDesc = (res).feed.subtitle.$t;

                            if ((res).feed.media$group.media$thumbnail) {
                                ytImgCount = (res).feed.media$group.media$thumbnail.length;
                            }

                            if (ytImgCount > 1) {
                                ytImg = (res).feed.media$group.media$thumbnail[1].url;
                            } else if (ytImgCount > 0) {
                                ytImg = (res).feed.media$group.media$thumbnail[0].url;
                            }
                        }
                        cms.global.vYoutubeLiveIn.fileUrl = ytUrlParse.ytUrlFormat;
                        cms.global.vYoutubeLiveIn.imageUrl = ytImg;
                        cms.global.vYoutubeLiveIn.name = ytTitle;
                        cms.global.vYoutubeLiveIn.intro = ytDesc;
                        cms.global.vYoutubeLiveIn.uploader = (res).data.uploader;
                        cms.global.vYoutubeLiveIn.uploadDate = (res).data.uploaded;
                        cms.global.vYoutubeLiveIn.ytId = ytUrlParse.ytId;

                        $("#ytUrlLive").val(ytUrlParse.ytUrlFormat);
                        $("#name").val(ytTitle);
                        $("#intro").val(ytDesc);
                        $("#ytUrlLive").data("status", ytLiveStatus);

                        ytObjSub = {
                            url: "https://gdata.youtube.com/feeds/api/users/" + cms.global.vYoutubeLiveIn.uploader + "?v=2&alt=json",
                            dataType: "json",
                            context: self,
                            success: function (res) {
                                var ytTitle = "",
                                    ytDesc = "",
                                    ytImg = "images/ch_default.png",
                                    ytImgCount = 0,
                                    ytObjSub = {};

                                if (undefined !== (res).entry.media$thumbnail.url) {
                                    ytImg = (res).entry.media$thumbnail.url;
                                }

                                if ("images/ch_default.png" !== ytImg) {
                                    $('#imageUrl').val(ytImg);
                    				$("#iupLogo .imgUpShow").css('background-image', "url('"+ ytImg +"')").removeClass("no-image").removeClass("is-loading");
                                }
                            },
                            error: function() {
                                nn.log("err Youtube Live sub call!!");
                            }
                        }
                        $.ajax(ytObjSub);
                    } else {
                        $("#ytSyncMsg").html(strDefErr);
                        $("#ytSyncMsg").removeClass("hide");

                    }

                },
                error: function() {
                    nn.log("err Youtube Live!!");
                }
            }

            $.ajax(ytObj);
        } else if (2 === ytUrlParse.ytType) {
            $("#ytUrlLive").data("status", "processing");
        } else if (3 === ytUrlParse.ytType) {

            $("#intro").val("");
            $("#name").val("");

            nn.api('GET', cms.reapi('/api/ustream'), {
                url: thisUrl
            }, function (ursreamObj) {
                var tmpId = 0;
                if (ursreamObj.length > 0) {
                    tmpId = ursreamObj[0].id;
                    var retiveUrl = "https://api.ustream.tv/channels/" + tmpId + ".json";
                    $.getJSON(retiveUrl, {
                        format: "json"
                    })
                        .done(function (datas) {

                            var ytTitle = "",
                                ytDesc = "",
                                ytImg = "images/ch_default.png";

                            ytTitle = datas.channel.title;
                            ytDesc = datas.channel.description;

                            if (undefined !== datas.channel.owner.picture) {
                                ytImg = datas.channel.owner.picture;
                            }
                            cms.global.vYoutubeLiveIn.fileUrl = datas.channel.stream.hls; // 
                            cms.global.vYoutubeLiveIn.imageUrl = datas.channel.thumbnail.live; // 
                            cms.global.vYoutubeLiveIn.name = ytTitle; //
                            cms.global.vYoutubeLiveIn.intro = ytDesc; // 

                            cms.global.vYoutubeLiveIn.uploader = datas.channel.owner.username; // 
                            cms.global.vYoutubeLiveIn.uploadDate = datas.channel.last_broadcast_at; // 
                            cms.global.vYoutubeLiveIn.ytId = datas.channel.url; //

                            if ("images/ch_default.png" !== ytImg) {
                                $('#imageUrl').val(ytImg);
                    			$("#iupLogo .imgUpShow").css('background-image', "url('"+ ytImg +"')").removeClass("no-image").removeClass("is-loading");
                            }
                            $("#ytUrlLive").val(ytUrlParse.ytUrlFormat);
                            $("#name").val(ytTitle);
                            $("#intro").val(ytDesc);
                            $("#ytUrlLive").data("status", "processing");

                        })
                        .fail(function() {
                            $("#ytSyncMsg").html(strDefErr);
                            $("#ytSyncMsg").removeClass("hide");
                        });
                } else {
                    $("#ytSyncMsg").html(strDefErr);
                    $("#ytSyncMsg").removeClass("hide");
                }
            });
        } else if (4 === ytUrlParse.ytType) {
            // http://api.new.livestream.com/accounts/5057055/events/3448924
            // [{id: {accounts: 5057055, events:3448924}}]

            // http://api.new.livestream.com/accounts/5057055/events/3394212/videos/63036075
            // [{id: {accounts: 1714160, events:1614682, videos:63036075}}]

            // http://new.livestream.com/accounts/5057055/events/3448924

            $("#intro").val("");
            $("#name").val("");

            nn.api('GET', 'apis/livestream.php', {
                url: thisUrl
            }, function (ursreamObj) {
                var opObj = {},
                    retiveUrl = "";

                if (ursreamObj.length > 0) {
                    opObj = ursreamObj[0];
                    $("#ytUrlLive").val(opObj.url);
                    $("#name").val(opObj.caption);

                    if ("" !== opObj.thumbnail_url) {
                        $('#imageUrl').val(opObj.thumbnail_url);
                    	$("#iupLogo .imgUpShow").css('background-image', "url('"+ opObj.thumbnail_url +"')").removeClass("no-image").removeClass("is-loading");
                    }

                    cms.global.vYoutubeLiveIn.fileUrl = opObj.url;
                    cms.global.vYoutubeLiveIn.imageUrl = opObj.thumbnail_url;
                    cms.global.vYoutubeLiveIn.name = opObj.caption;
                    cms.global.vYoutubeLiveIn.intro = $("#intro").val();

                    cms.global.vYoutubeLiveIn.uploader = opObj.short_name;
                    cms.global.vYoutubeLiveIn.uploadDate = opObj.created_at;
                    cms.global.vYoutubeLiveIn.ytId = "";

                    $("#ytUrlLive").data("status", "processing");

                } else {
                    $("#ytSyncMsg").html(strDefErr);
                    $("#ytSyncMsg").removeClass("hide");
                }
            });
        } else {
            $("#ytSyncMsg").html(strDefErr);
            $("#ytSyncMsg").removeClass("hide");
        }
        // console.log( "this is a cou****" + $(this).val() );
    });



    $(document).on('change', '#ytUrl', function () {
        var thisUrl = $(this).val().trim(),
            ytUrlParse = $common.ytUrlParser(thisUrl),
            ytObj = {},
            thisUrlInfo = $.url(thisUrl),
            thisHost = thisUrlInfo.attr("host"),
            pgType = "youtube";
        // console.log( "this is a cou****" + $(this).data("ctype") );
        $("#ytSyncMsg").html("");
        $("#ytSyncMsg").addClass("hide");
        $("#intro").val("");
        $("#name").val("");

        if("vimeo.com" === thisHost){
            ytUrlParse = $common.vimeoUrlParser(thisUrl);
            pgType = "vimeo";
        }

        if (ytUrlParse.ytType > 0) {
            ytObj = {
                url: ytUrlParse.ytUrlApi,
                dataType: "json",
                context: self,
                success: function(res) {
                    var ytTitle = "",
                        ytDesc = "",
                        ytImg = "images/ch_default.png",
                        ytImgCount = 0;

                    if("vimeo" === pgType){
                        if (ytUrlParse.ytType === 1) {
                            ytTitle = res.display_name;
                            ytDesc = res.bio;

                            if(undefined !== res.portrait_huge && res.portrait_huge !== ""){
                                ytImg = res.portrait_huge;
                            }else if(undefined !== res.portrait_large && res.portrait_large !== ""){
                                ytImg = res.portrait_large;
                            }else if(undefined !== res.portrait_medium && res.portrait_medium !== ""){
                                ytImg = res.portrait_medium;
                            }else if(undefined !== res.portrait_small && res.portrait_small !== ""){
                                ytImg = res.portrait_small;
                            }
                           
                        } else {
                            ytTitle = res.name;
                            ytDesc = res.description;

                            if (res.logo !== "") {
                                ytImg = res.logo;
                            }
                        }

                    }else{
                        if (ytUrlParse.ytType === 1) {
                            ytTitle = (res).entry.title.$t;
                            ytDesc = (res).entry.summary.$t;

                            if(undefined !== (res).entry.media$thumbnail.url){
                                ytImg = (res).entry.media$thumbnail.url;
                            }
                        } else {
                            ytTitle = (res).feed.title.$t;
                            ytDesc = (res).feed.subtitle.$t;

                            if ((res).feed.media$group.media$thumbnail) {
                                ytImgCount = (res).feed.media$group.media$thumbnail.length;
                            }

                            if (ytImgCount > 1) {
                                ytImg = (res).feed.media$group.media$thumbnail[1].url;
                            }else if(ytImgCount > 0){
                                ytImg = (res).feed.media$group.media$thumbnail[0].url;
                            }
                        }
                    }

                    $("#ytUrl").val(ytUrlParse.ytUrlFormat);
                    $("#name").val(ytTitle);
                    $("#intro").val(ytDesc);
                    if("images/ch_default.png" !== ytImg){
                        $('#imageUrl').val(ytImg);
                    	$("#iupLogo .imgUpShow").css('background-image', "url('"+ ytImg +"')").removeClass("no-image").removeClass("is-loading");
                    }

                },
                error: function() {
                    nn.log("我錯了!!");
                }
            }

            $.ajax(ytObj);
        } else {
            $("#ytSyncMsg").html(nn._([cms.global.PAGE_ID, 'setting-form', 'Invalid URL, please check the URL and try again.']));
            $("#ytSyncMsg").removeClass("hide");
        }
        // console.log( "this is a cou****" + $(this).val() );
    });

    $(document).on('click', '.unblock, .btn-close, .btn-no', function () {
        $.unblockUI();
        return false;
    });

    $('#system-error .btn-ok, #system-error .btn-close').click(function () {
        $.unblockUI();
        if ($('body').hasClass('has-error')) {
            location.replace('index.html');
        }
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
    $('#content-main').on('change', '#settingForm', function () {
        $('body').addClass('has-change');
    });
    $(document).on('click', '#header #logo, #header a, #studio-nav a, #content-nav a, #footer a', function (e) {
        if (document.settingForm) {
            var fm = document.settingForm;
            if (fm.imageUrl && fm.imageUrlOld && fm.imageUrl.value !== fm.imageUrlOld.value) {
                $('body').addClass('has-change');
            }
        }
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
    $('#content-main').on('click', '#settingForm .btn-cancel.enable', function () {
        if (document.settingForm) {
            var fm = document.settingForm;
            if (fm.imageUrl && fm.imageUrlOld && fm.imageUrl.value !== fm.imageUrlOld.value) {
                $('body').addClass('has-change');
            }
        }
        if ($('body').hasClass('has-change')) {
            $('body').data('leaveUrl', 'index.html');
            $common.showUnsaveOverlay();
        } else {
            location.href = 'index.html';
        }
        return false;
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

    // channel form selector
    $('#content-main').on('click', '#settingForm .enable .select-btn, #settingForm .enable .select-txt', function (event) {
        $common.hideFbPageList();
        $('.form-btn .notice').addClass('hide');
        $('.select-list').hide();
        $(this).parent('li').siblings().children('.on').removeClass('on');
        $(this).parent().children('.select-btn').toggleClass('on');
        if ($(this).parent().children('.select-btn').hasClass('on')) {
            $(this).parent().children('.select-list').slideDown();
        } else {
            $(this).parent().children('.select-list').hide();
        }
        event.stopPropagation();
        return false;
    });
    $('#content-main').on('click', '#settingForm .select .select-list li', function () {
        $('body').addClass('has-change');
        var selectOption = $(this).text(),
            metadata = $(this).data('meta'),
            srcname = '',
            sphere = '',
            rowNum = 0,
            modCatLen = 0,
            i = 0,
            actObjId = $(this).parent().attr('id');
            
        // sharing url
        if ($(this).hasClass('surl-li')) {
            $('#surl-ul .surl-li').removeClass('on');
            $(this).addClass('on');
        }

        switch (actObjId) {
            case "sphere-select-list":
                // region (sphere) relate to category
                srcname = $(this).parent().parent().children('.select-txt').children().text();
                if (srcname !== selectOption) {
                    $('.category').removeClass('enable').addClass('disable');
                    $('#categoryId').val(0);
                    $('#browse-category').html('');
                    sphere = metadata;
                    if ('other' === sphere) {
                        sphere = 'en';
                    }
                    nn.api('GET', cms.reapi('/api/categories'), {
                        lang: sphere
                    }, function(categories) {
                        $('#browse-category').data('realCateCnt', categories.length);
                        $.each(categories, function(i, list) {
                            cms.config.CATEGORY_MAP[list.id] = list.name;
                        });
                        rowNum = ($(window).width() > 1356) ? 4 : 3;
                        modCatLen = categories.length % rowNum;
                        if (modCatLen > 0) {
                            modCatLen = rowNum - modCatLen;
                            for (i = 0; i < modCatLen; i += 1) {
                                categories.push({
                                    id: 0,
                                    name: ''
                                });
                            }
                        }
                        $('#category-list-tmpl-item').tmpl(categories, {
                            dataArrayIndex: function(item) {
                                return $.inArray(item, categories);
                            }
                        }).appendTo('#browse-category');
                        $('#browse-category li[data-meta=0]').addClass('none');
                        $page.scrollToBottom();
                        $('.category').removeClass('disable').addClass('enable');
                        $('#categoryId-select-txt').text(nn._([cms.global.PAGE_ID, 'setting-form', 'Select a category']));
                    });
                }
                break;

            case "browse-category":
                // category relate to tags
                nn.api('GET', cms.reapi('/api/tags'), {
                    categoryId: metadata,
                    lang: $('#sphere').val()
                }, function(tags) {
                    $('#tag-list').html('');
                    if (tags && tags.length > 0) {
                        $('.tag-list').removeClass('hide');
                        var currentTags = $('#tag').val();
                        currentTags = currentTags.split(',');
                        if (!currentTags) {
                            currentTags = [];
                        }
                        $('#tag-list-tmpl-item').tmpl({
                            tags: tags
                        }).appendTo('#tag-list');
                        if (currentTags.length > 0) {
                            $('#tag-list li span a').each(function() {
                                if (-1 !== $.inArray($(this).text(), currentTags)) {
                                    $(this).parent().parent().addClass('on');
                                }
                            });
                        }
                    } else {
                        $('.tag-list').addClass('hide');
                    }

                    $page.scrollToBottom();
                });
                break;

            case "paid-select-list":
                if (metadata) {
                    $("#paidBlock").removeClass("hide");
                    $("#isPublic").val(false);
                } else {
                    $("#paidBlock").addClass("hide");
                    $("#isPublic").val(true);
                }
                break;

        }

        $(this).parent().parent().children('.select-meta').val(metadata);
        $(this).parent().parent().children('.select-btn').removeClass('on');
        $(this).parent().parent().children('.select-txt').children().text(selectOption);
        $(this).parent().hide();
        return false;
    });

    // channel form tag
    $('#content-main').on('click', '#tag-list li span a', function () {
        $('body').addClass('has-change');
        var temp = [],
            currentTags = $('#tag').val(),
            clickedTag = $.trim($(this).text());
        currentTags = currentTags.split(',');
        if (!currentTags) {
            currentTags = [];
        }
        if (-1 === $.inArray(clickedTag, currentTags)) {
            $(this).parent().parent().addClass('on');
            currentTags.push(clickedTag);
        } else {
            $(this).parent().parent().removeClass('on');
            $.each(currentTags, function (i, n) {
                if (n !== clickedTag) {
                    temp.push(n);
                }
            });
            currentTags = temp;
        }
        temp = [];
        $.each(currentTags, function (i, n) {
            if (n !== '') {
                temp.push(n);
            }
        });
        $('#tag').val(temp.join(','));
        return false;
    });

    // channel form facebook auto share (callback of checkCriticalPerm)
    function handleAutoSharePerm(hasCriticalPerm, authResponse) {
        if (hasCriticalPerm && authResponse && authResponse.userID && authResponse.accessToken) {
            $.unblockUI();
            $common.showProcessingOverlay();
            var parameter = {
                userId: authResponse.userID,
                accessToken: authResponse.accessToken
            };
            nn.api('POST', cms.reapi('/api/users/{userId}/sns_auth/facebook', {
                userId: cms.global.USER_DATA.id
            }), parameter, function (result) {
                if ('OK' === result) {
                    nn.api('GET', cms.reapi('/api/users/{userId}/sns_auth/facebook', {
                        userId: cms.global.USER_DATA.id
                    }), null, function (facebook) {
                        $('#overlay-s').fadeOut('slow', function () {
                            // sync cms settings
                            cms.global.FB_RESTART_CONNECT = false;
                            $('#studio-nav .reconnect-notice').addClass('hide');
                            cms.global.FB_PAGES_MAP = $common.buildFacebookPagesMap(facebook);
                            cms.global.USER_SNS_AUTH = facebook;
                            // sync channel setting
                            if ($('#settingForm').length > 0) {
                                var isAutoCheckedTimeline = true;
                                $page.renderAutoShareUI(facebook, isAutoCheckedTimeline);
                                setTimeout(function () {
                                    $page.scrollToBottom();
                                }, 1000);
                            }
                        });
                    });
                }
            });
        } else {
            // connected but has not critical permission!!
            $.blockUI({
                message: $('#fb-connect-failed2')
            });
        }
    }
    $('#content-main').on('click', '.connect-switch .switch-off, .reconnected .btn-reconnected', function () {
        // connect facebook
        FB.login(function (response) {
            if (response.authResponse) {
                // connected but not sure have critical permission
                $page.checkCriticalPerm(response.authResponse, handleAutoSharePerm);
            } else {
                // cancel login nothing happens (maybe unknown or not_authorized)
                nn.log(response, 'debug');
                $.blockUI({
                    message: $('#fb-connect-failed2')
                });
            }
        }, {
            scope: cms.config.FB_REQ_PERMS.join(',')
        });

        return false;
    });
    // facebook page main checkbox
    $('#content-main').on('click', '.connected input[name=fbPage]', function () {
        if ($(this).prop('checked')) {
            $('.page-list').removeClass('disable').addClass('enable');
        } else {
            $('#fb-page-list').slideUp();
            $('#page-selected').text(nn._([cms.global.PAGE_ID, 'setting-form', 'Select facebook pages']));
            $('#fb-page-list li').removeClass('checked');
            $('.page-list').addClass('disable').removeClass('enable on');
            $('#pageId').val('');
        }
    });
    // facebook page dropdown multi checkbox ui
    $('#content-main').on('click', '.connected .share-item .page-list.enable .page-list-middle a.select-page', function () {

        var fbPageListHeight = $('#fb-page-list').height();

        $('.form-btn .notice').addClass('hide');
        $('.dropdown').hide();
        $('.dropdown').parents('li').removeClass('on').children('.on').removeClass('on');
        $('.select-list').hide();
        $('.select-list').parents().removeClass('on').children('.on').removeClass('on');

        $(this).next('ul').slideToggle({
            complete: function() {

                if ($('.connected .share-item .page-list').hasClass('on')) {
                    $page.scrollToBottom();
                } else {
                    $('#content-main-wrap').scrollTop( $('#content-main-wrap').scrollTop()-fbPageListHeight );
                }
                $('#content-main-wrap').perfectScrollbar('update');
            }
        });

        $(this).parents('.page-list').toggleClass('on');

        return false;
    });
    // facebook page select preview
    $('#content-main').on('click', '.connected #fb-page-list li a', function () {
        $('body').addClass('has-change');
        var temp = [],
            currentPages = [],
            defaultText = nn._([cms.global.PAGE_ID, 'setting-form', 'Select facebook pages']);
        $(this).parent().toggleClass('checked');
        $('#fb-page-list li.checked').each(function (i) {
            temp.push($.trim($(this).children('a').text()));
            currentPages.push($.trim($(this).children('a').data('id')));
        });
        if (0 === temp.length) {
            $('#page-selected').text(defaultText);
        } else {
            $('#page-selected').text(temp.join(', '));
        }
        $('#pageId').val(currentPages.join(','));
        return false;
    });

    // channel form button
    $('#content-main').on('click', '#settingForm .btn-save.enable', function () {
        // update mode
        if ($page.chkData(document.settingForm) && cms.global.USER_DATA.id && $(this).hasClass('enable') && cms.global.USER_URL.param('id') > 0) {
            $common.showSavingOverlay();
            nn.on(400, function (jqXHR, textStatus) {
                $('#overlay-s').fadeOut(0, function () {
                    nn.log(textStatus + ': ' + jqXHR.responseText, 'error');
                });
            });

            $("#intro").val($("#intro").val().replace(/\n/g, '{BR}'));
            var qrystring = $('#settingForm').serialize(),
                parameter = $.url('http://fake.url.dev.teltel.com/?' + qrystring).param();
            $("#intro").val($("#intro").val().replace(/\{BR\}/g, '\n'));

            // sharing url
            nn.api('GET', cms.reapi('/api/channels/{channelId}/autosharing/brand', {
                channelId: cms.global.USER_URL.param('id')
            }), null, function (cBrand) {
                var surlText = $('#surl-text').text();
                if (cBrand.brand !== surlText && '' !== surlText) {
                    nn.api('PUT', cms.reapi('/api/channels/{channelId}/autosharing/brand', {
                        channelId: cms.global.USER_URL.param('id')
                    }), {
                        brand: surlText
                    });
                }
            });

            nn.api('PUT', cms.reapi('/api/channels/{channelId}', {
                channelId: cms.global.USER_URL.param('id')
            }), parameter, function (channel) {
                var isPaidSend = $page.isPaidSend(),
                infoPaid = $page.getPaidInfo();
                if(isPaidSend && infoPaid.isVailed){
                    // send 
                    nn.api('POST', cms.reapi('/api/billing/channels/{channelId}/iap_info', {
                        channelId: channel.id
                    }), infoPaid, function(iapInfo) {
                        nn.api('POST', cms.reapi('/api/billing/channels/{channelId}/iap_items', {
                            channelId: channel.id
                        }), {
                            msoId: cms.global.USER_DATA.msoId
                        }, function(iapItem) {
                            $('#overlay-s').fadeOut(1000, function() {
                                $('body').removeClass('has-change');
                                $page.paidChannelInit();
                            });
                        });
                    });
                }else if (true === cms.global.vIsYoutubeLive) {
                    if ("processing" === $("#ytUrlLive").data("status")){
                        nn.api('GET', cms.reapi('/api/channels/{channelId}/episodes', {
                            channelId: channel.id
                        }), null, function(episodes) {
                            var cntEpisode = episodes.length;
                            if (cntEpisode > 0) {
                                nn.api('DELETE', cms.reapi('/api/episodes/{episodeId}', {
                                    episodeId: episodes[0].id
                                }), null, function(programs) {
                                    $page.ytLiveCreate(channel.id);
                                });
                            } else {
                                $page.ytLiveCreate(channel.id);
                            }
                            $('body').removeClass('has-change');
                        });
                    } else {
                        $page.saveAfter();
                    }
                }else if ($('.connect-switch.hide').length > 0 && $('.reconnected.hide').length > 0) {
                    var userIds = [],
                        accessTokens = [];
                    if ($('#fbPage').is(':checked') && '' !== $.trim($('#pageId').val())) {
                        userIds = $.trim($('#pageId').val()).split(',');
                        $.each(userIds, function (i, userId) {
                            accessTokens.push(cms.global.FB_PAGES_MAP[userId]);
                        });
                    }
                    if ($('#fbTimeline').is(':checked')) {
                        userIds.push(cms.global.USER_SNS_AUTH.userId);
                        accessTokens.push(cms.global.USER_SNS_AUTH.accessToken);
                    }
                    nn.api('DELETE', cms.reapi('/api/channels/{channelId}/autosharing/facebook', {
                        channelId: channel.id
                    }), null, function () {
                        if (userIds.length > 0) {
                            parameter = {
                                userId: userIds.join(','),
                                accessToken: accessTokens.join(',')
                            };
                            nn.api('POST', cms.reapi('/api/channels/{channelId}/autosharing/facebook', {
                                channelId: channel.id
                            }), parameter, function () {
                                $('#overlay-s').fadeOut(1000, function () {
                                    $('body').removeClass('has-change');
                                    $('#imageUrlOld').val(channel.imageUrl);
                                });
                            });
                        } else {
                            $('#overlay-s').fadeOut(1000, function () {
                                $('body').removeClass('has-change');
                                $('#imageUrlOld').val(channel.imageUrl);
                            });
                        }
                    });
                } else {
                    $('#overlay-s').fadeOut(1000, function () {
                        $('body').removeClass('has-change');
                        $('#imageUrlOld').val(channel.imageUrl);
                    });
                }
            });
        }
        return false;
    });


    $('#ytsync-prompt').on('click', '.btn-leave, .btn-close', function () {
        $.unblockUI();
        location.href = 'index.html';
    });

    $('#content-main').on('click', '#settingForm .btn-create.enable', function () {
        // program add
        function channelAdd() {
            var deferred = $.Deferred();
            nn.api('POST', cms.reapi('/api/users/{userId}/channels', {
                userId: cms.global.USER_DATA.id
            }), parameter, function (channel) {
                deferred.resolve(channel);
            });

            return deferred.promise();
        }

        // IAP add
        function procIAP(channel) {
            var deferred = $.Deferred(),
                isPaidSend = $page.isPaidSend(),
                infoPaid = $page.getPaidInfo();
            if (isPaidSend && infoPaid.isVailed) {
                nn.api('POST', cms.reapi('/api/billing/channels/{channelId}/iap_info', {
                    channelId: channel.id
                }), infoPaid, function (iapInfo) {
                    nn.api('POST', cms.reapi('/api/billing/channels/{channelId}/iap_items', {
                        channelId: channel.id
                    }), {
                        msoId: cms.global.USER_DATA.msoId
                    }, function (iapItem) {
                        if (cms.global.USER_URL.attr('file') === 'channel-setting.html') {
                            $page.paidChannelInit();
                        }
                        deferred.resolve(channel);
                    });
                });
            } else {
                deferred.resolve(channel);
            }

            return deferred.promise();
        }

        // auto share
        function doAutoShare(channel) {
            var deferred = $.Deferred();
            if ($('.connect-switch.hide').length > 0 && $('.reconnected.hide').length > 0) {
                var userIds = [],
                    accessTokens = [];
                if ($('#fbPage').is(':checked') && '' !== $.trim($('#pageId').val())) {
                    userIds = $.trim($('#pageId').val()).split(',');
                    $.each(userIds, function(i, userId) {
                        accessTokens.push(cms.global.FB_PAGES_MAP[userId]);
                    });
                }
                if ($('#fbTimeline').is(':checked')) {
                    userIds.push(cms.global.USER_SNS_AUTH.userId);
                    accessTokens.push(cms.global.USER_SNS_AUTH.accessToken);
                }
                nn.api('DELETE', cms.reapi('/api/channels/{channelId}/autosharing/facebook', {
                    channelId: channel.id
                }), null, function () {
                    if (userIds.length > 0) {
                        parameter = {
                            userId: userIds.join(','),
                            accessToken: accessTokens.join(',')
                        };
                        nn.api('POST', cms.reapi('/api/channels/{channelId}/autosharing/facebook', {
                            channelId: channel.id
                        }), parameter, function () {
                            deferred.resolve(channel);
                        });
                    } else {
                        deferred.resolve(channel);
                    }
                });
            } else {
                deferred.resolve(channel);
            }

            return deferred.promise();
        }

        // Sync Program
        function procSyncProgram(channel) {
            var deferred = $.Deferred();
            if (channel.id > 0 && cms.global.vIsYoutubeSync === true) {
                nn.api('PUT', cms.reapi('/api/channels/{channelId}/youtubeSyncData', {
                    channelId: channel.id
                }), null, function (msg) {
                    deferred.resolve(channel);
                });
            } else {
                deferred.resolve(channel);
            }

            return deferred.promise();
        }

        // Live program
        function procLiveProgram(channel) {
            var deferred = $.Deferred();
            if (true === cms.global.vIsYoutubeLive) {
                // live program
                $page.ytLiveCreate(channel.id);
                deferred.resolve(channel);
            } else {
                deferred.resolve(channel);
            }

            return deferred.promise();
        }

        function procInsertEnd(channel) {
            var deferred = $.Deferred();
            $('#overlay-s').fadeOut(1000, function() {
                $('body').removeClass('has-change');
                $('#imageUrlOld').val(channel.imageUrl);
                $page.saveAfter();
                deferred.resolve();
            });
            return deferred.promise();
        }

        function procInsertStart() {
            var deferred = $.Deferred();
            $common.showProcessingOverlay();
            deferred.resolve();
            return deferred.promise();
        }


        // insert mode
        if ($page.chkData(document.settingForm) && cms.global.USER_DATA.id && $(this).hasClass('enable')) {
            $common.showSavingOverlay();
            nn.on(400, function (jqXHR, textStatus) {
                $('#overlay-s').fadeOut(0, function () {
                    nn.log(textStatus + ': ' + jqXHR.responseText, 'error');
                });
            });
            // note: channel-add.html hard code hidden field isPublic=true
            var qrystring = $('#settingForm').serialize(),
                parameter = $.url('http://fake.url.dev.teltel.com/?' + qrystring).param();

            if (cms.global.vIsYoutubeSync === true) {
                qrystring = $('#settingForm').serialize();
                parameter = $.url('http://fake.url.dev.teltel.com/?' + qrystring).param();
            }

            procInsertStart()
                .then(channelAdd)
                .then(procIAP)
                .then(doAutoShare)
                .then(procSyncProgram)
                .then(procLiveProgram)
                .then(procInsertEnd);
        }

        return false;
    });
    $('#content-main').on('click', '.fminput', function () {
        $('.form-btn .notice').addClass('hide');
    });

    // NOTE: Keep Window Resize Event at the bottom of this file
    $(window).resize(function () {
        $('#content-main-wrap').perfectScrollbar('update');

        $page.handleButtonPosition();

        // Handle category list items layout.
        var categoryList = $('#browse-category');
        var items = categoryList.find('li');
        var i;
        if ($(window).width()>=1237) {
            if (items.length % 4 !== 0) {
                for (i=items.length%4; i<4; i++) {
                    categoryList.append(document.createElement('li'));
                }
            }
        } else {
            if (items.length % 3 !== 0) {
                for (i=items.length%3; i<3; i++) {
                    categoryList.append(document.createElement('li'));
                }
            }
        }
    });
});