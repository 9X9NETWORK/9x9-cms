/*jslint browser: true, nomen: true, unparam: true */
/*global $, nn, cms, SWFUpload */

(function ($page) {
    'use strict';

    var $common = cms.common;

    
    cms.global.vIsYoutubeSync = false;
    cms.global.vIsYoutubeLive = false;
    cms.global.vYoutubeLiveIn = {};

    $page.fetchLiveUrl = function(channelId) {
        nn.api('GET', cms.reapi('/api/channels/{channelId}/episodes', {
            channelId: channelId
        }), null, function(episodes) {
            nn.api('GET', cms.reapi('/api/episodes/{episodeId}/programs', {
                    episodeId: episodes[0].id
                }), null, function (programs) {
                    $("#ytUrlLive").val(programs[0].fileUrl);
                });
        });
    }

    $page.storePoolOnOff = function (isOn) {
        var thisObj = $("#add-store-switch"),
            strMsg = "No",
            strSwitch = "switch-off",
            strValue = "3";

        thisObj.removeClass("switch-off").removeClass("switch-on");

        switch (isOn) {
            case "init":
                if (0 === parseInt($("#StorePool").val(), 10)) {
                    strMsg = "Yes";
                    strSwitch = "switch-on";
                    strValue = "0";
                }
                break;

            case "on":
                strMsg = "Yes";
                strSwitch = "switch-on";
                strValue = "0";
                break;

            case "off":
                strMsg = "No";
                strSwitch = "switch-off";
                strValue = "3";
                break;
        }

        thisObj.addClass(strSwitch);
        thisObj.text(nn._(["overlay", 'button', strMsg]));
        $("#StorePool").val(strValue);
    };

    $page.liveType2Prepare = function(ytUrlParse) {
        // ytLive 上網至 m3u8，但有些資料本來就沒有或不足
        cms.global.vYoutubeLiveIn.fileUrl = ytUrlParse.ytUrlFormat;
        cms.global.vYoutubeLiveIn.imageUrl = $("#thumbnail-imageUrl").attr("src");
        cms.global.vYoutubeLiveIn.name = $("#name").val();
        cms.global.vYoutubeLiveIn.intro = $("#intro").val();
        cms.global.vYoutubeLiveIn.uploader = "";
        cms.global.vYoutubeLiveIn.uploadDate = "";
        cms.global.vYoutubeLiveIn.ytId = "";
    }

    $page.ytLiveCreate = function(channelId) {
        var epName = "Live auto Episode",
        inObj = cms.global.vYoutubeLiveIn,
        ytUrlParse = $common.ytUrlLiveParser($("#ytUrlLive").val());

        if (2 === ytUrlParse.ytType) {
            $page.liveType2Prepare(ytUrlParse);
        }
        nn.api('POST', cms.reapi('/api/channels/{channelId}/episodes', {
            channelId: channelId
        }), {
            duration: 0,
            isPublic: true,
            name: epName,
            publishDate: "NOW",
            imageUrl: inObj.imageUrl
        }, function (epObj) {
            nn.api('POST', cms.reapi('/api/episodes/{episodeId}/programs', {
                episodeId: epObj.id
            }), {
                duration: 0,
                channelId: channelId,
                contentType: 1,
                startTime: 0,
                subSeq: 1,
                fileUrl: inObj.fileUrl,
                imageUrl: inObj.imageUrl,
                name: inObj.name,
                intro: inObj.intro,
                uploader: inObj.uploader,
                uploadDate: inObj.uploadDate,
                ytId: inObj.ytId
            }, function (pObj) {
                // nn.log("YouTube Live created!!");
                $('body').removeClass('has-change');
                $page.saveAfter();
            });
        });
    };

    $page.youtubeYyncOnOff = function (isOn) {
        var thisObj = $("#youtube-sync-switch");
        if ("on" === isOn) {
            thisObj.removeClass("switch-off");
            thisObj.addClass("switch-on");
            thisObj.text(nn._(["overlay", 'button', 'ON']));
            $("#autoSync").val("on");
        } else {
            thisObj.removeClass("switch-on");
            thisObj.addClass("switch-off");
            thisObj.text(nn._(["overlay", 'button', 'OFF']));
            $("#autoSync").val("off");
        }
    };

    $page.saveAfter = function () {
        if (cms.global.vIsYoutubeSync === true) {
            $('#ytsync-prompt .content').text(nn._(['overlay', 'prompt', "Synchronizing. This may take a few minutes."]));
            $('#ytsync-prompt .btn-leave').text(nn._(['overlay', 'button', "Ok"]));
            $.blockUI({
                message: $('#ytsync-prompt')
            });
        } else if ("channel-setting.html" === cms.global.USER_URL.attr('file')) {
            $('#overlay-s').fadeOut(1000, function () {
                $('body').removeClass('has-change');
            });
        } else {
            location.href = 'index.html';
        }
    };

    $page.chkData = function (fm) {
        fm.name.value = $.trim(fm.name.value);
        fm.imageUrl.value = $.trim(fm.imageUrl.value);
        fm.intro.value = $.trim(fm.intro.value);
        fm.lang.value = $.trim(fm.lang.value);
        fm.sphere.value = $.trim(fm.sphere.value);
        fm.categoryId.value = $.trim(fm.categoryId.value);

        if(true === cms.global.vIsYoutubeLive && "processing" !== $("#ytUrlLive").data("status") && "editing" !== $("#ytUrlLive").data("status")){
            $('.form-btn .notice').removeClass('hide');
            return false;
        }
        if (!fm.categoryId.value) {
            fm.categoryId.value = '';
        }
        fm.tag.value = $.trim(fm.tag.value);
        if ($('#fbPage').is(':checked') && '' === $.trim($('#pageId').val())) {
            $('#fbPage').prop('checked', false);
            $('#fbPage-label').removeClass('checked');
            $.uniform.update('#fbPage');
        }
        if ('' === fm.name.value || '' === fm.lang.value || '' === fm.sphere.value || '' === fm.categoryId.value) {
            $('.form-btn .notice').removeClass('hide');
            return false;
        }
        if ('' !== fm.lang.value && !cms.config.LANG_MAP[fm.lang.value]) {
            $('.form-btn .notice').removeClass('hide');
            return false;
        }
        if ('' !== fm.sphere.value && !cms.config.SPHERE_MAP[fm.sphere.value]) {
            $('.form-btn .notice').removeClass('hide');
            return false;
        }
        if ('' !== fm.categoryId.value && !cms.config.CATEGORY_MAP[fm.categoryId.value]) {
            $('.form-btn .notice').removeClass('hide');
            return false;
        }
        if ('' === fm.imageUrl.value) {
            $('.form-btn .notice').removeClass('hide');
            return false;
        }
        return true;
    };

    $page.truncateFormTitle = function () {
        var crumbWidth = $('#title-func .title-crumb').width();
        if ($('#channel-name').data('width') + crumbWidth > $('input.text').width() + 140) {
            $('#title-func h2').width($('input.text').width() + 140 - crumbWidth);
            $('#title-func h2').css('padding-right', parseInt(crumbWidth + 5, 10) + 'px');
        } else {
            $('#title-func h2').width('auto');
            $('#title-func h2').css('padding-right', parseInt(crumbWidth + 5, 10) + 'px');
        }
    };

    $page.scrollToBottom = function () {
        var objDiv = document.getElementById("content-main-wrap");
        objDiv.scrollTop = objDiv.scrollHeight;
    };

    $page.uploadImage = function () {
        var parameter = {
            'prefix': 'cms',
            'type':   'image',
            'size':   20485760,
            'acl':    'public-read'
        };
        nn.api('GET', cms.reapi('/api/s3/attributes'), parameter, function (s3attr) {
            var timestamp = (new Date()).getTime(),
                handlerFileDialogStart = function () {
                    $('.upload-img .upload-notice').addClass('hide');
                },
                handlerUploadProgress = function (file, completed, total) {
                    $('.upload-img .loading').show();
                    this.setButtonText('<span class="uploadstyle">' + nn._(['upload', 'Uploading...']) + '</span>');
                },
                handlerUploadSuccess = function (file, serverData, recievedResponse) {
                    $('.upload-img .loading').hide();
                    this.setButtonText('<span class="uploadstyle">' + nn._(['upload', 'Upload']) + '</span>');
                    if (!file.type) {
                        file.type = nn.getFileTypeByName(file.name);
                    }
                    this.setButtonDisabled(false); // enable upload button again
                    var url = 'http://' + s3attr.bucket + '.s3.amazonaws.com/' + parameter.prefix + '-thumbnail-' + timestamp + '-' + file.size + file.type.toLowerCase();
                    $('#thumbnail-imageUrl').attr('src', url + '?n=' + Math.random());
                    $('#imageUrl').val(url);
                },
                handlerUploadError = function (file, code, message) {
                    $('.upload-img .loading').hide();
                    this.setButtonText('<span class="uploadstyle">' + nn._(['upload', 'Upload']) + '</span>');
                    this.setButtonDisabled(false);
                    if (code === -280) { // user cancel upload
                        nn.log(message, 'error'); // show some error prompt
                    } else {
                        nn.log(message, 'error'); // show some error prompt
                    }
                },
                handlerFileQueue = function (file) {
                    if (!file.type) {
                        file.type = nn.getFileTypeByName(file.name); // Mac Chrome compatible
                    }
                    var postParams = {
                        "AWSAccessKeyId": s3attr.id,
                        "key":            parameter.prefix + '-thumbnail-' + timestamp + '-' + file.size + file.type.toLowerCase(),
                        "acl":            parameter.acl,
                        "policy":         s3attr.policy,
                        "signature":      s3attr.signature,
                        "content-type":   parameter.type,
                        "success_action_status": "201"
                    };
                    this.setPostParams(postParams);
                    this.startUpload(file.id);
                    this.setButtonDisabled(true);
                },
                handlerFileQueueError = function (file, code, message) {
                    if (code === -130) { // error file type
                        $('.upload-img .upload-notice').removeClass('hide');
                    }
                },
                settings = {
                    flash_url:                  'javascripts/libs/swfupload/swfupload.swf',
                    upload_url:                 'http://' + s3attr.bucket + '.s3.amazonaws.com/', // http://9x9tmp-ds.s3.amazonaws.com/
                    file_size_limit:            parameter.size,
                    file_types:                 '*.jpg; *.png; *.gif',
                    file_types_description:     'Thumbnail',
                    file_post_name:             'file',
                    button_placeholder:         $('#uploadThumbnail').get(0),
                    button_image_url:           'images/btn-load.png',
                    button_width:               '129',
                    button_height:              '29',
                    button_text:                '<span class="uploadstyle">' + nn._(['upload', 'Upload']) + '</span>',
                    button_text_style:          '.uploadstyle { color: #555555; font-family: Arial, Helvetica; font-size: 15px; text-align: center; } .uploadstyle:hover { color: #999999; }',
                    button_text_top_padding:    1,
                    button_action:              SWFUpload.BUTTON_ACTION.SELECT_FILE,
                    button_cursor:              SWFUpload.CURSOR.HAND,
                    button_window_mode:         SWFUpload.WINDOW_MODE.TRANSPARENT,
                    http_success:               [ 201 ],
                    file_dialog_start_handler:  handlerFileDialogStart,
                    upload_progress_handler:    handlerUploadProgress,
                    upload_success_handler:     handlerUploadSuccess,
                    upload_error_handler:       handlerUploadError,
                    file_queued_handler:        handlerFileQueue,
                    file_queue_error_handler:   handlerFileQueueError,
                    debug:                      false
                },
                swfu = new SWFUpload(settings);
            swfu.debug = cms.config.IS_DEBUG;
        });
    };

    $page.checkCriticalPerm = function (authResponse, callback) {
        if (authResponse && authResponse.accessToken) {
            var parameter = {
                access_token: authResponse.accessToken
            };
            // ON PURPOSE to wait facebook sync
            setTimeout(function () {
                // FB.api('/me/permissions', { anticache: (new Date()).getTime() }, function (response) {
                nn.api('GET', 'https://graph.facebook.com/me/permissions', parameter, function (response) {
                    var permList = null,
                        hasCriticalPerm = false;
                    if (response.data && response.data[0]) {
                        permList = response.data[0];
                        if (permList.manage_pages && permList.publish_stream) {
                            hasCriticalPerm = true;
                        }
                    }
                    // callback is handleRevokedPerm or handleAutoSharePerm
                    if ('function' === typeof callback) {
                        callback(hasCriticalPerm, authResponse);
                    }
                }, 'jsonp');
            }, 1000);
        }
    };

    $page.renderConnectFacebookUI = function () {
        $('#settingForm .connect-switch').removeClass('hide');
        $('#settingForm .connected').addClass('hide');
        $('#settingForm .reconnected').addClass('hide');
        $('#fbTimeline').prop('checked', false);
        $('#fbTimeline-label').removeClass('checked');
        $.uniform.update('#fbTimeline');
        $('#fbPage').prop('disabled', false);
        $('#fbPage').prop('checked', false);
        $('#fbPage-label').removeClass('checked');
        $.uniform.update('#fbPage');
        $('#fb-page-list').remove();
        $('#page-selected').text(nn._(['channel', 'setting-form', 'Select facebook pages']));
        $('.page-list').addClass('disable').removeClass('enable on');
        $('#pageId').val('');
        // if youtube sync show the button
        if(cms.global.vIsYoutubeSync){
            $(".connected.youtube-sync").removeClass("hide");
        }
        if(true === cms.global.USER_PRIV.isAutoOn){
        	$(".connected.add-store").removeClass("hide");
        }

    };

    $page.renderAutoShareUI = function (facebook, isAutoCheckedTimeline) {
        $('#settingForm .connect-switch').addClass('hide');
        if (true === cms.global.FB_RESTART_CONNECT) {
            $('#settingForm .connected').addClass('hide');
            $('#settingForm .reconnected').removeClass('hide');
        } else {
            $('#settingForm .connected').removeClass('hide');
            $('#settingForm .reconnected').addClass('hide');
        }
        // if youtube sync show the button
        if(cms.global.vIsYoutubeSync){
            $(".connected.youtube-sync").removeClass("hide");
        }
        if(true === cms.global.USER_PRIV.isAutoOn){
        	$(".connected.add-store").removeClass("hide");
        }
        if (true === isAutoCheckedTimeline) {
            $('#fbTimeline').prop('checked', true);
            $('#fbTimeline-label').addClass('checked');
            $.uniform.update('#fbTimeline');
        }
        // disable facebook page or rebuild fb-page-list
        if (!facebook.pages || 'string' === typeof facebook.pages || 0 === facebook.pages.length) {
            $('#fbPage').prop('disabled', true);
            $.uniform.update('#fbPage');
        } else {
            $('#fbPage').prop('disabled', false);
            $.uniform.update('#fbPage');
            var pages = facebook.pages,
                rowNum = 2,
                modPageLen = pages.length % rowNum,
                i = 0;
            if (modPageLen > 0) {
                modPageLen = rowNum - modPageLen;
                for (i = 0; i < modPageLen; i += 1) {
                    pages.push({
                        id: 0,
                        name: ''
                    });
                }
            }
            $('#fb-page-list').remove();
            $('#fb-page-list-tmpl').tmpl({
                cntPage: pages.length
            }).appendTo('div.page-list-middle');
            $('#fb-page-list-tmpl-item').tmpl(pages).appendTo('#fb-page-list');
        }
        // checked default fadebook page
        if ('channel-setting.html' === cms.global.USER_URL.attr('file') && cms.global.USER_URL.param('id') > 0) {
            nn.api('GET', cms.reapi('/api/channels/{channelId}/autosharing/facebook', {
                channelId: cms.global.USER_URL.param('id')
            }), null, function (autoshares) {
                if (autoshares && autoshares.length > 0) {
                    var isCheckedTimeline = false,
                        tempIds = [],
                        pageIds = [],
                        pageNames = [],
                        pageItem = null;
                    $.each(autoshares, function (i, autoshare) {
                        if (autoshare.userId === facebook.userId) {
                            isCheckedTimeline = true;
                        } else {
                            tempIds.push($.trim(autoshare.userId));
                        }
                    });
                    if (true === isCheckedTimeline) {
                        $('#fbTimeline').prop('checked', true);
                        $('#fbTimeline-label').addClass('checked');
                        $.uniform.update('#fbTimeline');
                    } else {
                        $('#fbTimeline').prop('checked', false);
                        $('#fbTimeline-label').removeClass('checked');
                        $.uniform.update('#fbTimeline');
                    }
                    if (tempIds.length > 0 && $('#fb-page-list li:has(a)').length > 0) {
                        $('#fb-page-list li:has(a)').each(function (i) {
                            pageItem = $(this).children('a');
                            if (-1 !== $.inArray($.trim(pageItem.data('id')), tempIds)) {
                                pageIds.push(pageItem.data('id'));
                                pageNames.push(pageItem.text());
                                $(this).addClass('checked');
                            }
                        });
                        if (pageNames.length > 0) {
                            $('#fbPage').prop('checked', true);
                            $('#fbPage-label').addClass('checked');
                            $.uniform.update('#fbPage');
                            $('.page-list').removeClass('disable').addClass('enable');
                            $('#pageId').val(pageIds.join(','));
                            $('#page-selected').text(pageNames.join(', '));
                        }
                    }
                    
                    $('#content-main-wrap').perfectScrollbar({marginBottom:63});
                    $common.hideFbPageList();
                }
            });
        } else {
            $('#content-main-wrap').perfectScrollbar({marginBottom:63});
            $common.hideFbPageList();
        }
    };

    $page.handleButtonPosition = function() {
        // Handle cancel/create buttons position according to scollbar displayed or not.
        if ($('#content-main-wrap').height()>=$('div.constrain').outerHeight()) {
            $('#content-main-wrap').addClass('fixed');
        } else {
            $('#content-main-wrap').removeClass('fixed');
        }
    };

    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {
        if (cms.global.USER_URL.attr('file') === 'channel-setting.html') {
            // update mode
            nn.log({
                // NOTE: remember to change page-key to match file-name
                subject: 'CMS.PAGE.INITIALIZED: channel-setting',
                options: options
            }, 'debug');

            var id = cms.global.USER_URL.param('id');
            cms.global.vIsYoutubeSync = false;
            cms.global.vIsYoutubeLive = false;
            if (id > 0 && !isNaN(id) && cms.global.USER_DATA.id) {
                nn.api('GET', cms.reapi('/api/channels/{channelId}', {
                    channelId: id
                }), null, function (channel) {
                    if (channel.userIdStr !== cms.global.USER_DATA.idStr) {
                        $common.showSystemErrorOverlayAndHookError('You are not authorized to edit this program.');
                        return;
                    }
                    if (channel.contentType === cms.config.YOUR_FAVORITE) {
                        $common.showSystemErrorOverlayAndHookError('The favorites program can not be edited.');
                        return;
                    }
                    // youtube live channel check
                    if (13 == channel.contentType) {
                        cms.global.vIsYoutubeLive = true;
                    } else if (null != channel.sourceUrl && channel.sourceUrl.length > 10) {
                        // youtube sync channel check
                        cms.global.vIsYoutubeSync = true;
                    }

                    $common.showProcessingOverlay();
                    $('#func-nav ul').html('');
                    $('#func-nav-tmpl').tmpl(channel).appendTo('#func-nav ul');
                    $('#content-main').html('');
                    $('#content-main-tmpl').tmpl(channel).appendTo('#content-main');

                    $page.youtubeYyncOnOff(channel.autoSync);
                    $page.storePoolOnOff("init");

                    if (cms.global.vIsYoutubeLive) {
                        var tmpSourceUrl = $common.ytUrlLiveParser(channel.sourceUrl);
                        if (3 === tmpSourceUrl.ytType) {
                            $("#ytUrlLive").val(channel.sourceUrl);
                            $("#ytUrlLive").trigger("change");
                        } else {
                            $page.fetchLiveUrl(channel.id);
                        }
                    }

                    if (cms.global.vIsYoutubeSync === true) {
                        var ytUrlParse = $common.ytUrlParser(channel.sourceUrl),
                            ytObj = {};
                        if (ytUrlParse.ytType > 0) {
                            ytObj = {
                                url: ytUrlParse.ytUrlApi,
                                dataType: "json",
                                context: self,
                                success: function(res) {
                                    if (ytUrlParse.ytType === 1) {
                                        $("#ytUrl").val((res).entry.link[0].href);
                                    }
                                }
                            }
                            $.ajax(ytObj);
                        }
                    }

                    // sharing url
                    nn.api('GET', cms.reapi('/api/channels/{channelId}/autosharing/brand', {
                        channelId: id
                    }), null, function (cBrand) {
                        $("#surl-text").text(cBrand.brand);
                    }).then(function (ccBrand) {
                        nn.api('GET', cms.reapi('/api/channels/{channelId}/autosharing/validBrands', {
                            channelId: id
                        }), null, function (cBrands) {
                            $('#surl-ul').html('');
                            $('#surl-tmpl-item').tmpl(cBrands, {
                                selBrand: ccBrand.brand
                            }).appendTo('#surl-ul');
                        });
                    });

                    $('#name').charCounter(20, {
                        container: '#name-charcounter',
                        format: '%1',
                        delay: 0,
                        clear: false,
                        countDown: false
                    });
                    $('#intro').charCounter(1000, {
                        container: '#intro-charcounter',
                        format: '%1',
                        delay: 0,
                        clear: true,
                        countDown: false
                    });
                    if ($('#uploadThumbnail').length > 0) {
                        $page.uploadImage();
                    }
                    if ($('.connected input').length > 0) {
                        $('.connected input').uniform();
                    }
                    $common.initFacebookJavaScriptSdk();
                    $('#channel-name').data('width', $('#channel-name').width());
                    // setup channel data
                    if ('' !== $.trim(channel.imageUrl)) {
                        $('#thumbnail-imageUrl').attr('src', channel.imageUrl + '?n=' + Math.random());
                    }
                    if ('' !== channel.lang && cms.config.LANG_MAP[channel.lang]) {
                        $('#lang-select-txt').text(cms.config.LANG_MAP[channel.lang]);
                    }
                    if ('' !== channel.sphere && cms.config.SPHERE_MAP[channel.sphere]) {
                        $('#sphere-select-txt').text(cms.config.SPHERE_MAP[channel.sphere]);
                        $('.category').removeClass('disable').addClass('enable');
                        var sphere = channel.sphere;
                        if ('other' === sphere) {
                            sphere = 'en';
                        }
                        nn.api('GET', cms.reapi('/api/categories'), {
                            lang: sphere
                        }, function (categories) {
                            $('#browse-category').data('realCateCnt', categories.length);
                            $.each(categories, function (i, list) {
                                cms.config.CATEGORY_MAP[list.id] = list.name;
                            });
                            var rowNum = ($(window).width() > 1356) ? 4 : 3,
                                modCatLen = categories.length % rowNum,
                                i = 0;
                            if (modCatLen > 0) {
                                modCatLen = rowNum - modCatLen;
                                for (i = 0; i < modCatLen; i += 1) {
                                    categories.push({
                                        id: 0,
                                        name: ''
                                    });
                                }
                            }
                            $('#browse-category').html('');
                            $('#category-list-tmpl-item').tmpl(categories, {
                                dataArrayIndex: function (item) {
                                    return $.inArray(item, categories);
                                }
                            }).appendTo('#browse-category');
                            $('#browse-category li[data-meta=0]').addClass('none');
                            if ('' !== channel.categoryId && cms.config.CATEGORY_MAP[channel.categoryId]) {
                                $('.tag-list').removeClass('hide');
                                $('#categoryId-select-txt').text(cms.config.CATEGORY_MAP[channel.categoryId]);
                                nn.api('GET', cms.reapi('/api/tags'), {
                                    categoryId: channel.categoryId,
                                    lang: sphere
                                }, function (tags) {
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
                                            $('#tag-list li span a').each(function () {
                                                if (-1 !== $.inArray($(this).text(), currentTags)) {
                                                    $(this).parent().parent().addClass('on');
                                                }
                                            });
                                        }
                                    } else {
                                        $('.tag-list').addClass('hide');
                                    }
                                });
                            }
                        });
                    }
                    $page.truncateFormTitle();
                    // ON PURPOSE to wait api (async)
                    $('#overlay-s').fadeOut(5000, function () {
                        $('#content-main-wrap').perfectScrollbar({marginBottom:63});
                        $common.hideFbPageList();
                        $('#settingForm .btn-save').removeClass('disable').addClass('enable');
                        $page.handleButtonPosition();
                    });
                });
            } else {
                $common.showSystemErrorOverlayAndHookError('Invalid program ID, please try again.');
                return;
            }
        } else {
            // insert mode
            nn.log({
                // NOTE: remember to change page-key to match file-name
                subject: 'CMS.PAGE.INITIALIZED: channel-add',
                options: options
            }, 'debug');

            if(location.hash === "#ytsync"){
                cms.global.vIsYoutubeSync = true;
            }else if(location.hash === "#ytlive"){
                cms.global.vIsYoutubeLive = true;
            }


            $common.showProcessingOverlay();
            $('#content-main').html('');
            $('#content-main-tmpl').tmpl().appendTo('#content-main');
            $('#name').charCounter(20, {
                container: '#name-charcounter',
                format: '%1',
                delay: 0,
                clear: false,
                countDown: false
            });
            $('#intro').charCounter(1000, {
                container: '#intro-charcounter',
                format: '%1',
                delay: 0,
                clear: true,
                countDown: false
            });
            if ($('#uploadThumbnail').length > 0) {
                $page.uploadImage();
            }
            if ($('.connected input').length > 0) {
                $('.connected input').uniform();
            }
            $common.initFacebookJavaScriptSdk();
            // ON PURPOSE to wait api (async)
            $('#overlay-s').fadeOut(3000, function () {
                $('#content-main-wrap').perfectScrollbar({marginBottom:63});
                $common.hideFbPageList();
                $('#settingForm .btn-cancel, #settingForm .btn-create').removeClass('disable').addClass('enable');
            });

            $page.handleButtonPosition();
        }

    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('channel')));