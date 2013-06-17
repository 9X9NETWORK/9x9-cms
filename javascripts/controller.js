/*jslint browser: true, nomen: true, regexp: true, unparam: true, sloppy: true */
/*global $, nn, CMS_CONF, FB, scrollbar, autoHeight, showSystemErrorOverlayAndHookError, showProcessingOverlay, formatTimestamp, truncateFormTitle, setFormHeight, setTaglistWidth, ellipsisPage, uploadImage, setEpisodeWidth, preloadChannelVideo, setVideoMeasure, setSpace, sumStoryboardInfo, rebuildVideoNumber, setFormWidth, switchPublishStatus, switchRerunCheckbox, brandSeting, storeManage, portalManage, portalSet, resetPassCheck */

function renderConnectFacebookUI() {
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
}   // end of renderConnectFacebookUI()

function renderAutoShareUI(facebook, isAutoCheckedTimeline) {
    $('#settingForm .connect-switch').addClass('hide');
    if (true === CMS_CONF.FB_RESTART_CONNECT) {
        $('#settingForm .connected').addClass('hide');
        $('#settingForm .reconnected').removeClass('hide');
    } else {
        $('#settingForm .connected').removeClass('hide');
        $('#settingForm .reconnected').addClass('hide');
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
        ellipsisPage();
    }
    // checked default fadebook page
    if ('channel-setting.html' === CMS_CONF.USER_URL.attr('file') && CMS_CONF.USER_URL.param('id') > 0) {
        nn.api('GET', CMS_CONF.API('/api/channels/{channelId}/autosharing/facebook', {
            channelId: CMS_CONF.USER_URL.param('id')
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
                autoHeight();
                setFormHeight();
                setTaglistWidth();
                scrollbar('#content-main', '#content-main-wrap', '#main-wrap-slider');
            }
        });
    } else {
        autoHeight();
        setFormHeight();
        setTaglistWidth();
        scrollbar('#content-main', '#content-main-wrap', '#main-wrap-slider');
    }
}   // end of renderAutoShareUI()

function buildFacebookPagesMap(facebook) {
    var fb_pages_map = {};
    if (facebook && facebook.userId) {
        fb_pages_map[facebook.userId] = facebook.accessToken;
        if (facebook.pages && 'string' !== typeof facebook.pages && facebook.pages.length > 0) {
            $.each(facebook.pages, function (i, page) {
                fb_pages_map[page.id] = page.access_token;
            });
        }
    }
    return fb_pages_map;
}   // end of buildFacebookPagesMap()

function checkRestartConnect(facebook, callback) {
    var isRestartConnect = false,
        parameter = null;
    if (facebook && facebook.userId && facebook.accessToken) {
        if (facebook.pages && 'string' === typeof facebook.pages) {
            // ON PURPOSE to keep deep nesting if/else level because async facebook API call
            // lose manage_pages permission or
            // user change facebook password or
            // facebook has changed the session for security reasons
            // to show restart connect UI
            isRestartConnect = true;
            if ('function' === typeof callback) {
                callback(facebook, isRestartConnect);
            }
        } else {
            parameter = {
                access_token: facebook.accessToken
            };
            // FB.api('/{facebook.userId}/permissions', { anticache: (new Date()).getTime() }, function (response) {
            // ON PURPOSE to pass {facebook.userId} to compose request uri (but not hard code "me"), because not sure user had login facebook
            nn.api('GET', 'https://graph.facebook.com/' + facebook.userId + '/permissions', parameter, function (response) {
                var permList = null,
                    hasCriticalPerm = false;
                if (response.data && response.data[0]) {
                    permList = response.data[0];
                    if (permList.manage_pages && permList.publish_stream) {
                        hasCriticalPerm = true;
                    }
                }
                // if false === hasCriticalPerm lose critical permissions (manage_pages & publish_stream) to show restart connect UI
                isRestartConnect = (true === hasCriticalPerm) ? false : true;
                if ('function' === typeof callback) {
                    callback(facebook, isRestartConnect);
                }
            }, 'jsonp');
        }
    } else {
        // ON PURPOSE to keep deep nesting if/else level because async facebook API call
        // not yet connect facebook
        isRestartConnect = false;
        if ('function' === typeof callback) {
            callback(facebook, isRestartConnect);
        }
    }
}   // end of checkRestartConnect()

function addFbAsyncInitEvent(func) {
    var oldFbAsyncInit = window.fbAsyncInit;
    window.fbAsyncInit = function () {
        if ('function' === typeof oldFbAsyncInit) {
            oldFbAsyncInit();
        }
        func();
    };
}   // end of addFbAsyncInitEvent()

function initFacebookJavaScriptSdk() {
    if (null !== CMS_CONF.USER_URL && null !== CMS_CONF.USER_DATA) {
        var lang = CMS_CONF.USER_DATA.lang;
        (function (d, debug) {
            var js,
                id = 'facebook-jssdk',
                ref = d.getElementsByTagName('script')[0];
            if (d.getElementById(id)) {
                return;
            }
            js = d.createElement('script');
            js.id = id;
            js.async = true;
            js.src = '//connect.facebook.net/' + CMS_CONF.LC_MAP[lang] + '/all' + (debug ? '/debug' : '') + '.js';
            ref.parentNode.insertBefore(js, ref);
        }(document, /*debug*/ false));

        addFbAsyncInitEvent(function () {
            var url = CMS_CONF.USER_URL.attr('source');
            url = url.substr(0, url.lastIndexOf('/'));
            // init the FB JS SDK
            FB.init({
                appId: CMS_CONF.FB_APP_ID,                                                                  // App ID from the App Dashboard
                channelUrl: url + '/lang/fb/' + lang + '/channel.html',                                     // Channel File for x-domain communication
                status: true,                                                                               // check the login status upon init?
                cookie: true,                                                                               // set sessions cookies to allow your server to access the session?
                xfbml: true                                                                                 // parse XFBML tags on this page?
            });
        });

        nn.api('GET', CMS_CONF.API('/api/users/{userId}/sns_auth/facebook', {
            userId: CMS_CONF.USER_DATA.id
        }), null, function (facebook) {
            if (!facebook || !facebook.userId) {
                // ready for connect facebook
                // sync cms settings
                CMS_CONF.FB_RESTART_CONNECT = false;
                $('#studio-nav .reconnect-notice').addClass('hide');
                CMS_CONF.FB_PAGES_MAP = null;
                CMS_CONF.USER_SNS_AUTH = null;
                // sync connect switch
                $('.setup-notice p.fb-connect a.switch-on').addClass('hide');
                $('.setup-notice p.fb-connect a.switch-off').removeClass('hide');
                // sync channel setting
                if ($('#settingForm').length > 0) {
                    renderConnectFacebookUI();
                }
            } else {
                // ready for disconnect facebook
                // ON PURPOSE to use callback design pattern to maintain async order issue (make sure have critical permissions)
                checkRestartConnect(facebook, function (facebook, isRestartConnect) {
                    // sync cms settings
                    CMS_CONF.FB_RESTART_CONNECT = isRestartConnect;
                    if (true === isRestartConnect) {
                        $('#studio-nav .reconnect-notice').removeClass('hide');
                        $('#studio-nav .reconnect-notice .notice-left').stop(true).delay(2000).slideDown(100).delay(10000).fadeOut(1500);
                        $('#cms-setting .connect .notice, #cms-setting .connect .notify').removeClass('hide');
                    }
                    CMS_CONF.FB_PAGES_MAP = buildFacebookPagesMap(facebook);
                    CMS_CONF.USER_SNS_AUTH = facebook;
                    // sync connect switch
                    $('.setup-notice p.fb-connect a.switch-on').removeClass('hide');
                    $('.setup-notice p.fb-connect a.switch-off').addClass('hide');
                    // sync channel setting
                    if ($('#settingForm').length > 0) {
                        var isAutoCheckedTimeline = ('channel-add.html' === CMS_CONF.USER_URL.attr('file')) ? true : false;
                        renderAutoShareUI(facebook, isAutoCheckedTimeline);
                    }
                });
            }
        });
    } else {
        nn.log('Can not init Facebook JavaScript SDK!', 'error');
    }
}   // end of initFacebookJavaScriptSdk()

function buildEpcurateCuration(pageId, fm, crumb) {
    nn.log(crumb, 'debug');
    var eid = fm.id.value,
        cid = fm.channelId.value;
    $('#cur-add textarea').attr('placeholder', nn._([CMS_CONF.PAGE_ID, 'add-video', 'Paste YouTube video URLs to add (separate with different lines)']));
    if (!eid && !cid) {
        showSystemErrorOverlayAndHookError('Invalid channel ID and episode ID, please try again.');
        return;
    }
    if (!eid) {
        // insert mode: data from cookie
        if (!crumb.name || '' === $.trim(crumb.name)) {
            crumb.name = 'New episode';
        }
        if (cid > 0 && !isNaN(cid) && CMS_CONF.USER_DATA.id) {
            nn.api('GET', CMS_CONF.API('/api/users/{userId}/channels', {
                userId: CMS_CONF.USER_DATA.id
            }), null, function (data) {
                var channelIds = [];
                if (data.length > 0) {
                    $.each(data, function (i, list) {
                        channelIds.push(list.id);
                    });
                }
                if (-1 === $.inArray(parseInt(cid, 10), channelIds)) {
                    showSystemErrorOverlayAndHookError('You are not authorized to edit episodes in this channel.');
                    return;
                }
                nn.api('GET', CMS_CONF.API('/api/channels/{channelId}', {
                    channelId: cid
                }), null, function (channel) {
                    if (channel.contentType === CMS_CONF.YOUR_FAVORITE) {
                        showSystemErrorOverlayAndHookError('The favorites channel can not be edited.');
                        return;
                    }
                    showProcessingOverlay();
                    $('#epcurate-info').remove();
                    $('#epcurate-info-tmpl').tmpl(crumb).prependTo('#epcurateForm');
                    $('.storyboard-info').html($('#storyboard-info-tmpl').tmpl({
                        chName: channel.name,
                        epName: crumb.name
                    }));
                    $('#epcurate-nav-publish, #form-btn-save, #form-btn-next').click(function (e) {
                        $(fm).trigger('submit', e);
                        return false;
                    });
                    setVideoMeasure();
                    setSpace();
                    scrollbar('#storyboard-wrap', '#storyboard-list', '#storyboard-slider');
                    $('#overlay-s').fadeOut();
                });
            });
        } else {
            showSystemErrorOverlayAndHookError('Invalid channel ID, please try again.');
            return;
        }
    } else {
        // update mode: data from api
        nn.api('GET', CMS_CONF.API('/api/episodes/{episodeId}', {
            episodeId: $('#id').val()
        }), null, function (episode) {
            if (cid > 0 && parseInt(cid, 10) !== episode.channelId) {
                showSystemErrorOverlayAndHookError('You are not authorized to edit this episode.');
                return;
            }
            nn.api('GET', CMS_CONF.API('/api/users/{userId}/channels', {
                userId: CMS_CONF.USER_DATA.id
            }), null, function (data) {
                var channelIds = [];
                if (data.length > 0) {
                    $.each(data, function (i, list) {
                        channelIds.push(list.id);
                    });
                }
                if (-1 === $.inArray(parseInt(episode.channelId, 10), channelIds)) {
                    showSystemErrorOverlayAndHookError('You are not authorized to edit episodes in this channel.');
                    return;
                }
                nn.api('GET', CMS_CONF.API('/api/channels/{channelId}', {
                    channelId: episode.channelId
                }), null, function (channel) {
                    if (channel.contentType === CMS_CONF.YOUR_FAVORITE) {
                        showSystemErrorOverlayAndHookError('The favorites channel can not be edited.');
                        return;
                    }
                    showProcessingOverlay();
                    crumb = $.extend({}, crumb, episode);
                    $('#epcurate-info').remove();
                    $('#epcurate-info-tmpl').tmpl(crumb).prependTo('#epcurateForm');
                    $('.storyboard-info').html($('#storyboard-info-tmpl').tmpl({
                        chName: channel.name,
                        epName: episode.name
                    }));
                    // merge 9x9 api and youtube api (ytId, ytDuration, uploader, uploadDate, isZoneLimited, isSyndicateLimited, isEmbedLimited, isUnplayableVideo)
                    var normalPattern = /^http(?:s)?:\/\/www.youtube.com\/watch\?v=([^&]{11})/,
                        preloadImage = [],
                        programList = [],
                        invalidList = [],
                        committedCnt = 0,
                        ytData = null,
                        ytItem = {},
                        ytList = [],
                        beginTitleCard = null,
                        endTitleCard = null,
                        isPrivateVideo = null,
                        isZoneLimited = null,
                        hasSyndicateDenied = null,
                        hasLimitedSyndication = null,
                        isSyndicateLimited = null,
                        isEmbedLimited = null,
                        isUnplayableVideo = null;
                    nn.api('GET', CMS_CONF.API('/api/episodes/{episodeId}/programs', {
                        episodeId: $('#id').val()
                    }), null, function (programs) {
                        $.each(programs, function (idx, programItem) {
                            if (normalPattern.test(programItem.fileUrl)) {
                                programList.push(programItem);
                            }
                        });
                        $.each(programList, function (idx, programItem) {
                            nn.on([400, 401, 403, 404], function (jqXHR, textStatus) {
                                committedCnt += 1;
                                invalidList.push(programItem.fileUrl);
                                nn.log(textStatus + ': ' + jqXHR.responseText, 'warning');
                                nn.log(programItem.fileUrl, 'debug');
                                $('#videourl').val(invalidList.join('\n'));
                                $('#cur-add .notice').text(nn._([CMS_CONF.PAGE_ID, 'add-video', 'Invalid URL, please try again!'])).removeClass('hide').show();
                                if (committedCnt === programList.length) {
                                    committedCnt = -1;   // reset to avoid collision
                                    if (preloadImage.length > 0) {
                                        $('#preload-image').html('');
                                        $('#preload-image-tmpl-item').tmpl(preloadImage).prependTo('#preload-image');
                                    }
                                    $('#storyboard-listing').html('');
                                    $('#storyboard-listing-tmpl-item').tmpl(ytList).prependTo('#storyboard-listing');
                                    sumStoryboardInfo();
                                    rebuildVideoNumber();
                                    $('.ellipsis').ellipsis();
                                    $('#overlay-s').fadeOut();
                                }
                            });
                            nn.api('GET', 'http://gdata.youtube.com/feeds/api/videos/' + programItem.fileUrl.slice(-11) + '?alt=jsonc&v=2&callback=?', null, function (youtubes) {
                                nn.api('GET', CMS_CONF.API('/api/programs/{programId}/title_cards', {
                                    programId: programItem.id
                                }), null, function (title_card) {
                                    nn.api('GET', CMS_CONF.API('/api/programs/{programId}/poi_points', {
                                        programId: programItem.id
                                    }), null, function (poi_points) {
                                        committedCnt += 1;
                                        beginTitleCard = null;
                                        endTitleCard = null;
                                        if (title_card.length > 0) {
                                            if (title_card[1]) {
                                                if (1 === title_card[1].type) {
                                                    beginTitleCard = title_card[0];
                                                    endTitleCard = title_card[1];
                                                } else {
                                                    beginTitleCard = title_card[1];
                                                    endTitleCard = title_card[0];
                                                }
                                            } else {
                                                if (title_card[0]) {
                                                    if (0 === title_card[0].type) {
                                                        beginTitleCard = title_card[0];
                                                    } else {
                                                        endTitleCard = title_card[0];
                                                    }
                                                }
                                            }
                                        }
                                        if (beginTitleCard && beginTitleCard.message && '' !== $.trim(beginTitleCard.message)) {
                                            beginTitleCard.message = $.trim(beginTitleCard.message).replace(/\{BR\}/g, '\n');
                                            if (beginTitleCard.bgImage && '' !== $.trim(beginTitleCard.bgImage)) {
                                                preloadImage.push({
                                                    image: beginTitleCard.bgImage
                                                });
                                            }
                                        } else {
                                            beginTitleCard = null;
                                        }
                                        if (endTitleCard && endTitleCard.message && '' !== $.trim(endTitleCard.message)) {
                                            endTitleCard.message = $.trim(endTitleCard.message).replace(/\{BR\}/g, '\n');
                                            if (endTitleCard.bgImage && '' !== $.trim(endTitleCard.bgImage)) {
                                                preloadImage.push({
                                                    image: endTitleCard.bgImage
                                                });
                                            }
                                        } else {
                                            endTitleCard = null;
                                        }
                                        if (youtubes.data) {
                                            ytData = youtubes.data;
                                            isPrivateVideo = false;
                                            isZoneLimited = (ytData.restrictions) ? true : false;
                                            hasSyndicateDenied = (ytData.accessControl && ytData.accessControl.syndicate && 'denied' === ytData.accessControl.syndicate) ? true : false;
                                            hasLimitedSyndication = (ytData.status && ytData.status.reason && 'limitedSyndication' === ytData.status.reason) ? true : false;
                                            isSyndicateLimited = (hasSyndicateDenied || hasLimitedSyndication) ? true : false;
                                            isEmbedLimited = (ytData.accessControl && ytData.accessControl.embed && 'denied' === ytData.accessControl.embed) ? true : false;
                                            isUnplayableVideo = (isEmbedLimited || hasSyndicateDenied || (ytData.status && !hasLimitedSyndication)) ? true : false;
                                        } else {
                                            ytData = null;
                                            isPrivateVideo = (youtubes.error && youtubes.error.code && 403 === youtubes.error.code) ? true : false;
                                            isZoneLimited = null;
                                            isSyndicateLimited = null;
                                            isEmbedLimited = null;
                                            isUnplayableVideo = null;
                                        }
                                        if (ytData && false === isEmbedLimited) {
                                            ytItem = {
                                                poiList: poi_points,
                                                beginTitleCard: beginTitleCard,
                                                endTitleCard: endTitleCard,
                                                ytId: ytData.id,
                                                fileUrl: programItem.fileUrl,
                                                imageUrl: 'http://i.ytimg.com/vi/' + ytData.id + '/mqdefault.jpg',
                                                //duration: ytData.duration,      // ON PURPOSE to mark this line to keep trimmed duration from 9x9 API
                                                ytDuration: ytData.duration,    // keep original duration from YouTube
                                                name: ytData.title,
                                                intro: ytData.description,
                                                uploader: ytData.uploader,
                                                uploadDate: ytData.uploaded,
                                                isPrivateVideo: isPrivateVideo,
                                                isZoneLimited: isZoneLimited,
                                                isSyndicateLimited: isSyndicateLimited,
                                                isEmbedLimited: isEmbedLimited,
                                                isUnplayableVideo: isUnplayableVideo
                                            };
                                        } else {
                                            ytItem = {
                                                poiList: poi_points,
                                                beginTitleCard: beginTitleCard,
                                                endTitleCard: endTitleCard,
                                                ytId: programItem.fileUrl.slice(-11),
                                                ytDuration: 0,                                                                      // fake origin duration (invalid video)
                                                uploader: ((youtubes.error) ? youtubes.error.message : 'Unplayable-Video'),         // fake uploader (error message)
                                                uploadDate: ((youtubes.error) ? (youtubes.error.code + 'T') : 'Unplayable-VideoT'), // fake uploadDate (error code)
                                                isPrivateVideo: isPrivateVideo,
                                                isZoneLimited: isZoneLimited,
                                                isSyndicateLimited: isSyndicateLimited,
                                                isEmbedLimited: isEmbedLimited,
                                                isUnplayableVideo: isUnplayableVideo
                                            };
                                        }
                                        ytItem = $.extend(programItem, ytItem);
                                        ytList[idx] = ytItem;
                                        if (committedCnt === programList.length) {
                                            committedCnt = -1;   // reset to avoid collision
                                            if (preloadImage.length > 0) {
                                                $('#preload-image').html('');
                                                $('#preload-image-tmpl-item').tmpl(preloadImage).prependTo('#preload-image');
                                            }
                                            $('#storyboard-listing').html('');
                                            $('#storyboard-listing-tmpl-item').tmpl(ytList).prependTo('#storyboard-listing');
                                            sumStoryboardInfo();
                                            rebuildVideoNumber();
                                            $('.ellipsis').ellipsis();
                                            $('#overlay-s').fadeOut();
                                        }
                                    });
                                });
                            }, 'jsonp');
                        });
                    });
                    $('#epcurate-nav-publish, #form-btn-save, #form-btn-next').click(function (e) {
                        $(fm).trigger('submit', e);
                        return false;
                    });
                    setVideoMeasure();
                    setSpace();
                    scrollbar('#storyboard-wrap', '#storyboard-list', '#storyboard-slider');
                });
            });
        });
    }
}   // end of buildEpcurateCuration()

function buildEpcuratePublish(pageId, fm, crumb) {
    nn.log(crumb, 'debug');
    var eid = fm.id.value,
        cid = fm.channelId.value,
        scheduleDateTime = '',
        tomorrow = '';
    if (!eid || !crumb.id) {
        if (crumb.channelId) {
            $('#form-btn-leave').data('gobackUrl', $('#epcurate-nav-curation').attr('href'));
        }
        showSystemErrorOverlayAndHookError('Invalid episode ID, please try again.');
        return;
    }
    nn.api('GET', CMS_CONF.API('/api/episodes/{episodeId}', {
        episodeId: $('#id').val()
    }), null, function (episode) {
        if (cid > 0 && parseInt(cid, 10) !== episode.channelId) {
            showSystemErrorOverlayAndHookError('You are not authorized to edit this episode.');
            return;
        }
        $('#channelId').val(episode.channelId);
        nn.api('GET', CMS_CONF.API('/api/users/{userId}/channels', {
            userId: CMS_CONF.USER_DATA.id
        }), null, function (data) {
            var channelIds = [];
            if (data.length > 0) {
                $.each(data, function (i, list) {
                    channelIds.push(list.id);
                });
            }
            if (-1 === $.inArray(parseInt(episode.channelId, 10), channelIds)) {
                showSystemErrorOverlayAndHookError('You are not authorized to edit episodes in this channel.');
                return;
            }
            nn.api('GET', CMS_CONF.API('/api/channels/{channelId}', {
                channelId: episode.channelId
            }), null, function (channel) {
                if (channel.contentType === CMS_CONF.YOUR_FAVORITE) {
                    showSystemErrorOverlayAndHookError('The favorites channel can not be edited.');
                    return;
                }
                showProcessingOverlay();
                $('#epcurateForm .constrain').html('');
                $('#epcurate-form-tmpl').tmpl(episode, {
                    publishLabel: (true === episode.isPublic) ? 'Published' : 'Publish Now'
                }).appendTo('#epcurateForm .constrain');
                setFormWidth();
                if ($('#uploadThumbnail').length > 0) {
                    uploadImage();
                }
                $('#origin_status').val('Draft');
                $('#status_draft').prop('checked', true);
                $('p.radio-list input').uniform();
                if (true === episode.isPublic) {
                    $('#origin_status').val('Published');
                    $('p.radio-list').removeClass('draft');
                    $('#schedule-publish-label').addClass('hide');
                    $('#schedule-publish').addClass('hide');
                    $('#schedule-rerun-label').removeClass('hide');
                    $('#schedule-rerun').removeClass('hide');
                    $('#status_published').prop('checked', true);
                } else {
                    $('p.radio-list').addClass('draft');
                    $('#schedule-publish-label').removeClass('hide');
                    $('#schedule-publish').removeClass('hide');
                    $('#schedule-rerun-label').addClass('hide');
                    $('#schedule-rerun').addClass('hide');
                }
                if (episode.scheduleDate) {
                    if (true === episode.isPublic) {
                        $('#origin_status').val('Scheduled to rerun');
                        $('#rerun_y').prop('checked', true);
                    } else {
                        $('#origin_status').val('Scheduled to publish');
                        $('#status_scheduled').prop('checked', true);
                    }
                    scheduleDateTime = formatTimestamp(episode.scheduleDate, '/', ':').split(' ');
                    $('#publishDate').val(scheduleDateTime[0]);
                    $('#publishHour').val(scheduleDateTime[1]);
                } else {
                    // default schedule
                    tomorrow = new Date((new Date()).getTime() + (24 * 60 * 60 * 1000));
                    $('#publishDate').val(tomorrow.getFullYear() + '/' + (tomorrow.getMonth() + 1) + '/' + tomorrow.getDate());
                    $('#publishHour').val('20:00');
                }
                switchPublishStatus($('input[name=status]:checked').val(), $('input[name=status]:checked').attr('name'));
                switchRerunCheckbox();
                $.uniform.update();
                nn.api('GET', CMS_CONF.API('/api/episodes/{episodeId}/programs', {
                    episodeId: $('#id').val()
                }), null, function (programs) {
                    $('#img-list').html('');
                    $('#img-list-tmpl-item').tmpl(programs).appendTo('#img-list');
                    if ('' !== episode.imageUrl) {
                        var hasMatch = false;
                        $('#imageUrl').val(episode.imageUrl);
                        $('#imageUrlOld').val(episode.imageUrl);
                        $('#img-list li').each(function () {
                            if (episode.imageUrl === $(this).children('.img').children('img').attr('src')) {
                                hasMatch = true;
                                $(this).clone().prependTo('#img-list');
                                $(this).remove();
                            }
                        });
                        if (!hasMatch) {
                            $('#img-list').prepend('<li class="new"><div class="img"><img src="' + episode.imageUrl + '" alt="' + episode.name + '" /></div></li>');
                        }
                    }
                    $('#thumbnail-list ul').cycle({
                        fx: 'scrollHorz',
                        prev: '#thumbnail-list .img-prev',
                        next: '#thumbnail-list .img-next',
                        speed: 1000,
                        timeout: 0,
                        cleartypeNoBg: true,
                        before: function () {
                            $('body').addClass('has-change');                   // NOTE: must to remove change hook after first load
                            $('#imageUrl').val($('img', this).attr('src'));
                        }
                    });
                    $('#epcurate-nav-curation, #form-btn-save, #form-btn-back').click(function (e) {
                        $(fm).trigger('submit', e);
                        return false;
                    });
                    $('body').removeClass('has-change');                        // NOTE: remove change hook after first load
                    $('#overlay-s').fadeOut();
                });
            });
        });
    });
}   // end of buildEpcuratePublish()

function listEpisode(pageId, id) {
    if (id > 0 && !isNaN(id) && CMS_CONF.USER_DATA.id) {
        nn.api('GET', CMS_CONF.API('/api/users/{userId}/channels', {
            userId: CMS_CONF.USER_DATA.id
        }), null, function (data) {
            var channelIds = [];
            if (data.length > 0) {
                $.each(data, function (i, list) {
                    channelIds.push(list.id);
                });
            }
            if (-1 === $.inArray(parseInt(id, 10), channelIds)) {
                showSystemErrorOverlayAndHookError('You are not authorized to edit episodes in this channel.');
                return;
            }
            showProcessingOverlay();
            nn.api('GET', CMS_CONF.API('/api/channels/{channelId}', {
                channelId: id
            }), null, function (channel) {
                $('#func-nav ul').html('');
                $('#func-nav-tmpl').tmpl(channel).appendTo('#func-nav ul');
                if (channel.contentType === CMS_CONF.YOUR_FAVORITE) {
                    nn.api('GET', CMS_CONF.API('/api/users/{userId}/my_favorites', {
                        userId: CMS_CONF.USER_DATA.id
                    }), null, function (favorites) {
                        var cntEpisode = favorites.length;
                        channel.name = CMS_CONF.USER_DATA.name + nn._([pageId, 'title-func', "'s Favorite"]);
                        $('#title-func').html('');
                        $('#title-func-tmpl').tmpl(channel, {
                            cntEpisode: cntEpisode
                        }).appendTo('#title-func');
                        $('#channel-name').data('width', $('#channel-name').width());
                        $('#content-main-wrap .constrain').html('');
                        if (cntEpisode > 0) {
                            $('#episode-favorite-list-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
                            $('#episode-favorite-list-tmpl-item').tmpl(favorites).appendTo('#episode-list');
                        } else {
                            $('#episode-favorite-first-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
                        }
                        setEpisodeWidth();
                        autoHeight();
                        scrollbar('#content-main', '#content-main-wrap', '#main-wrap-slider');
                        $('#overlay-s').fadeOut();
                    });
                } else {
                    nn.api('GET', CMS_CONF.API('/api/channels/{channelId}/episodes', {
                        channelId: id
                    }), null, function (episodes) {
                        var cntEpisode = episodes.length,
                            tmpCntEpisode = cntEpisode,
                            tmpEpisodes = [],
                            i = 0,
                            cntPage = 0,
                            iPageSize = 30,
                            cntPageFirstEpisodes = 0,
                            tmpStart = 0,
                            tmpEnd = 0,
                            ii = 0;
                        $('#title-func').html('');
                        $('#title-func-tmpl').tmpl(channel, {
                            cntEpisode: cntEpisode
                        }).appendTo('#title-func');
                        $('#channel-name').data('width', $('#channel-name').width());
                        $('#content-main-wrap .constrain').html('');
                        CMS_CONF.EPISODES_PAGING = [];
                        CMS_CONF.EPISODES_PAGING_INFO = [];
                        if (cntEpisode > 0) {
                            // pagging
                            if (cntEpisode > iPageSize) {
                                cntPage = parseInt((cntEpisode / iPageSize), 10);
                                cntPageFirstEpisodes = cntEpisode % iPageSize;
                                if (cntPage > 1 && cntPageFirstEpisodes === 0) {
                                    cntPage -= 1;
                                    cntPageFirstEpisodes = 30;
                                }
                                tmpEpisodes = [];
                                for (i = 0; i < cntPageFirstEpisodes; i += 1) {
                                    episodes[i].seq = tmpCntEpisode - i;
                                    tmpEpisodes.push(episodes[i]);
                                }
                                CMS_CONF.EPISODES_PAGING.push(tmpEpisodes);
                                CMS_CONF.EPISODES_PAGING_INFO.push({
                                    'pageID': 0,
                                    'pageStart': tmpCntEpisode,
                                    'pageEnd': (tmpCntEpisode - cntPageFirstEpisodes + 1)
                                });
                                for (i = 0; i < cntPage; i += 1) {
                                    tmpEpisodes = [];
                                    tmpStart = i * iPageSize + cntPageFirstEpisodes;
                                    tmpEnd = tmpStart + iPageSize;
                                    ii = 0;
                                    for (ii = tmpStart; ii < tmpEnd; ii += 1) {
                                        // serial DESC
                                        episodes[ii].seq = cntEpisode - ii;
                                        tmpEpisodes.push(episodes[ii]);
                                    }
                                    CMS_CONF.EPISODES_PAGING.push(tmpEpisodes);
                                    CMS_CONF.EPISODES_PAGING_INFO.push({
                                        'pageID': (i + 1),
                                        'pageStart': (tmpCntEpisode - tmpStart),
                                        'pageEnd': (tmpCntEpisode - tmpEnd + 1)
                                    });
                                }
                            } else {
                                tmpEpisodes = [];
                                for (i = 0; i < cntEpisode; i += 1) {
                                    // the number srilal is DESC
                                    episodes[i].seq = cntEpisode - i;
                                    tmpEpisodes.push(episodes[i]);
                                }
                                CMS_CONF.EPISODES_PAGING.push(tmpEpisodes);
                            }

                            $('#episode-list-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
                            $('#episode-list-tmpl-item').tmpl(CMS_CONF.EPISODES_PAGING[0]).appendTo('#episode-list');
                            // folder list
                            $('#episode-list-tmpl-folder').tmpl(CMS_CONF.EPISODES_PAGING_INFO).appendTo('#episode-list');
                            // episode list sorting
                            $('#episode-list').sortable({
                                cursor: 'move',
                                revert: true,
                                cancel: '.isFolder',
                                change: function (event, ui) {
                                    $('body').addClass('has-change');
                                }
                            });
                            $('#episode-list').sortable('disable');
                        } else {
                            $('#episode-first-tmpl').tmpl({
                                id: id
                            }).appendTo('#content-main-wrap .constrain');
                            // episode first cycle
                            $('#selected-episode p.episode-pager').html('');
                            $('#selected-episode .wrapper ul.content').cycle({
                                pager: '.episode-pager',
                                activePagerClass: 'active',
                                updateActivePagerLink: null,
                                fx: 'scrollHorz',
                                speed: 1000,
                                timeout: 6000,
                                pagerEvent: 'mouseover',
                                pause: 1,
                                cleartypeNoBg: true
                            });
                        }
                        setEpisodeWidth();
                        autoHeight();
                        scrollbar('#content-main', '#content-main-wrap', '#main-wrap-slider');
                        $('#overlay-s').fadeOut();

                        // sharing url
                        nn.api('GET', CMS_CONF.API('/api/channels/{channelId}/autosharing/validBrands', {
                            channelId: id
                        }), null, function (cBrands) {
                            var tmpBrand = [ { brand: cBrands[0].brand } ];
                            $('#get-url-part-tmpl').tmpl(cBrands, {
                                li_sel: cBrands[0].brand
                            }).appendTo('#tmpHtml2');
                            $('#tmpHtml').html('');
                            $('#get-url-tmpl').tmpl(tmpBrand, {
                                li_items: $('#tmpHtml2').html()
                            }).appendTo('#tmpHtml');
                            $('div.get-url').each(function () {
                                $(this).children().remove();
                                $(this).append($('#tmpHtml').html());
                            });
                        });
                    });
                }
            });
        });
    } else if ('' !== id && parseInt(id, 10) === 0 && CMS_CONF.USER_DATA.id) {
        // for fake favorite channel
        showProcessingOverlay();
        nn.api('GET', CMS_CONF.API('/api/users/{userId}/my_favorites', {
            userId: CMS_CONF.USER_DATA.id
        }), null, function (favorites) {
            var cntEpisode = favorites.length,
                channel = {
                    contentType: CMS_CONF.YOUR_FAVORITE,
                    name: CMS_CONF.USER_DATA.name + nn._([pageId, 'title-func', "'s Favorite"])
                };
            $('#func-nav ul').html('');
            $('#func-nav-tmpl').tmpl(channel).appendTo('#func-nav ul');
            $('#title-func').html('');
            $('#title-func-tmpl').tmpl(channel, {
                cntEpisode: cntEpisode
            }).appendTo('#title-func');
            $('#channel-name').data('width', $('#channel-name').width());
            $('#content-main-wrap .constrain').html('');
            if (cntEpisode > 0) {
                $('#episode-favorite-list-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
                $('#episode-favorite-list-tmpl-item').tmpl(favorites).appendTo('#episode-list');
            } else {
                $('#episode-favorite-first-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
            }
            setEpisodeWidth();
            autoHeight();
            scrollbar('#content-main', '#content-main-wrap', '#main-wrap-slider');
            $('#overlay-s').fadeOut();
        });
    } else {
        showSystemErrorOverlayAndHookError('Invalid channel ID, please try again.');
        return;
    }
}   // end of listEpisode()

function buildChannelPoi(pageId, id) {
    if (id > 0 && !isNaN(id) && CMS_CONF.USER_DATA.id) {
        nn.api('GET', CMS_CONF.API('/api/users/{userId}/channels', {
            userId: CMS_CONF.USER_DATA.id
        }), null, function (data) {
            var channelIds = [],
                channelPoi = {},
                poiPage = [],
                poiItem = [];
            if (data.length > 0) {
                $.each(data, function (i, list) {
                    channelIds.push(list.id);
                });
            }
            if (-1 === $.inArray(parseInt(id, 10), channelIds)) {
                showSystemErrorOverlayAndHookError('You are not authorized to edit this channel.');
                return;
            }
            nn.api('GET', CMS_CONF.API('/api/channels/{channelId}', {
                channelId: id
            }), null, function (channel) {
                if (channel.contentType === CMS_CONF.YOUR_FAVORITE) {
                    showSystemErrorOverlayAndHookError('The favorites channel can not be edited.');
                    return;
                }
                showProcessingOverlay();
                nn.api('GET', CMS_CONF.API('/api/channels/{channelId}/episodes', {
                    channelId: id
                }), null, function (epList) {
                    nn.api('GET', CMS_CONF.API('/api/channels/{channelId}/poi_points', {
                        channelId: id
                    }), null, function (poiList) {
                        channelPoi = $.extend(channelPoi, channel);
                        channelPoi.epList = epList;
                        channelPoi.poiList = poiList;
                        $('#poi-event-overlay .wrap').html('');     // reset for language switch
                        $('#func-nav ul').html('');
                        $('#func-nav-tmpl').tmpl(channel).appendTo('#func-nav ul');
                        $('#content-main').html('');
                        $('#content-main-tmpl').tmpl(channelPoi).appendTo('#content-main');
                        if (epList && epList.length <= 0) {
                            $('#poi-list .btn-create-poi').removeClass('enable').addClass('disable');
                            $('#poi-list .no-episode').removeClass('hide');
                        }
                        if (poiList && poiList.length > 0) {
                            $('#poi-list .btn-create-poi').removeClass('enable').addClass('disable');
                            $('#poi-list .has-poi').removeClass('hide');
                            $('#poi-list .poi-info').removeClass('hide');
                            $.each(poiList, function (i, item) {
                                poiItem.push(item);
                            });
                            if (poiItem.length > 0) {
                                poiPage.push({poiItem: poiItem});
                                poiItem = [];
                            }
                        }
                        $('#poi-list-page').html('');
                        $('#poi-list-page-tmpl').tmpl(poiPage).prependTo('#poi-list-page');
                        $('#overlay-s').fadeOut('fast', function () {
                            $('#title-func h2.poi-list em').data('width', $('#title-func h2.poi-list em').width());
                            $('#title-func h2.poi-create em').data('width', $('#title-func h2.poi-create em').width());
                            $('#title-func h2.poi-edit em').data('width', $('#title-func h2.poi-edit em').width());
                            $('#title-func h2').hide();
                            $('#title-func h2.poi-list').show();
                            setFormHeight();
                            preloadChannelVideo();
                        });
                    });
                });
            });
        });
    } else {
        showSystemErrorOverlayAndHookError('Invalid channel ID, please try again.');
        return;
    }
}   // end of buildChannelPoi()

function updateChannel(pageId, id) {
    if (id > 0 && !isNaN(id) && CMS_CONF.USER_DATA.id) {
        nn.api('GET', CMS_CONF.API('/api/users/{userId}/channels', {
            userId: CMS_CONF.USER_DATA.id
        }), null, function (data) {
            var channelIds = [];
            if (data.length > 0) {
                $.each(data, function (i, list) {
                    channelIds.push(list.id);
                });
            }
            if (-1 === $.inArray(parseInt(id, 10), channelIds)) {
                showSystemErrorOverlayAndHookError('You are not authorized to edit this channel.');
                return;
            }
            nn.api('GET', CMS_CONF.API('/api/channels/{channelId}', {
                channelId: id
            }), null, function (channel) {
                if (channel.contentType === CMS_CONF.YOUR_FAVORITE) {
                    showSystemErrorOverlayAndHookError('The favorites channel can not be edited.');
                    return;
                }
                showProcessingOverlay();
                $('#func-nav ul').html('');
                $('#func-nav-tmpl').tmpl(channel).appendTo('#func-nav ul');
                $('#content-main').html('');
                $('#content-main-tmpl').tmpl(channel).appendTo('#content-main');

                // sharing url
                nn.api('GET', CMS_CONF.API('/api/channels/{channelId}/autosharing/brand', {
                    channelId: id
                }), null, function (cBrand) {
                    $("#surl-text").text(cBrand.brand);
                }).then(function (ccBrand) {
                    nn.api('GET', CMS_CONF.API('/api/channels/{channelId}/autosharing/validBrands', {
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
                    clear: false
                });
                $('#intro').charCounter(70, {
                    container: '#intro-charcounter',
                    format: '%1',
                    delay: 0,
                    clear: false
                });
                if ($('#uploadThumbnail').length > 0) {
                    uploadImage();
                }
                if ($('.connected input').length > 0) {
                    $('.connected input').uniform();
                }
                initFacebookJavaScriptSdk();
                $('#channel-name').data('width', $('#channel-name').width());
                // setup channel data
                if ('' !== $.trim(channel.imageUrl)) {
                    $('#thumbnail-imageUrl').attr('src', channel.imageUrl + '?n=' + Math.random());
                }
                if ('' !== channel.lang && CMS_CONF.LANG_MAP[channel.lang]) {
                    $('#lang-select-txt').text(CMS_CONF.LANG_MAP[channel.lang]);
                }
                if ('' !== channel.sphere && CMS_CONF.SPHERE_MAP[channel.sphere]) {
                    $('#sphere-select-txt').text(CMS_CONF.SPHERE_MAP[channel.sphere]);
                    $('.category').removeClass('disable').addClass('enable');
                    var sphere = channel.sphere;
                    if ('other' === sphere) {
                        sphere = 'en';
                    }
                    nn.api('GET', CMS_CONF.API('/api/categories'), {
                        lang: sphere
                    }, function (categories) {
                        $('#browse-category').data('realCateCnt', categories.length);
                        $.each(categories, function (i, list) {
                            CMS_CONF.CATEGORY_MAP[list.id] = list.name;
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
                        if ('' !== channel.categoryId && CMS_CONF.CATEGORY_MAP[channel.categoryId]) {
                            $('.tag-list').removeClass('hide');
                            $('#categoryId-select-txt').text(CMS_CONF.CATEGORY_MAP[channel.categoryId]);
                            nn.api('GET', CMS_CONF.API('/api/tags'), {
                                categoryId: channel.categoryId
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
                truncateFormTitle();
                // ON PURPOSE to wait api (async)
                $('#overlay-s').fadeOut(5000, function () {
                    autoHeight();
                    setFormHeight();
                    setTaglistWidth();
                    scrollbar('#content-main', '#content-main-wrap', '#main-wrap-slider');
                    $('#settingForm .btn-save').removeClass('disable').addClass('enable');
                });
            });
        });
    } else {
        showSystemErrorOverlayAndHookError('Invalid channel ID, please try again.');
        return;
    }
}   // end of updateChannel()

function createChannel(pageId) {
    showProcessingOverlay();
    $('#content-main').html('');
    $('#content-main-tmpl').tmpl().appendTo('#content-main');
    $('#name').charCounter(20, {
        container: '#name-charcounter',
        format: '%1',
        delay: 0,
        clear: false
    });
    $('#intro').charCounter(70, {
        container: '#intro-charcounter',
        format: '%1',
        delay: 0,
        clear: false
    });
    if ($('#uploadThumbnail').length > 0) {
        uploadImage();
    }
    if ($('.connected input').length > 0) {
        $('.connected input').uniform();
    }
    initFacebookJavaScriptSdk();
    // ON PURPOSE to wait api (async)
    $('#overlay-s').fadeOut(3000, function () {
        autoHeight();
        setFormHeight();
        setTaglistWidth();
        scrollbar('#content-main', '#content-main-wrap', '#main-wrap-slider');
        $('#settingForm .btn-cancel, #settingForm .btn-create').removeClass('disable').addClass('enable');
    });
}   // end of createChannel()

function buildCmsSettings(pageId) {
    showProcessingOverlay();
    $('#content-main').html('');
    $('#content-main-tmpl').tmpl().appendTo('#content-main');
    $('#change-pwd-overlay .overlay-container').html('');
    $('#change-pwd-overlay-tmpl').tmpl().appendTo('#change-pwd-overlay .overlay-container');
    $('#overlay-s').fadeOut('fast', function () {
        $('#username').charCounter(16, {
            container: '<span class="hide"><\/span>',
            format: '%1 characters to go!',
            delay: 0,
            multibyte: true
        });
        setFormHeight();
        $(window).trigger('resize');
    });
}   // end of buildCmsSettings()

function listChannel(pageId) {
    if (CMS_CONF.USER_DATA.id) {
        showProcessingOverlay();
        nn.api('GET', CMS_CONF.API('/api/users/{userId}/channels', {
            userId: CMS_CONF.USER_DATA.id
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
                    channel.moreImageUrl_1 = CMS_CONF.CHANNEL_DEFAULT_IMAGE;
                    channel.moreImageUrl_2 = CMS_CONF.CHANNEL_DEFAULT_IMAGE2;
                    channel.moreImageUrl_3 = CMS_CONF.CHANNEL_DEFAULT_IMAGE2;
                    if (channel.contentType === CMS_CONF.YOUR_FAVORITE) {
                        hasFavoriteChannel = true;
                        channel.moreImageUrl_1 = 'images/favorite_ch.png';
                        if (channel.moreImageUrl && '' !== $.trim(channel.moreImageUrl)) {
                            temp = channel.moreImageUrl.split('|');
                            if (temp[0] && temp[0] !== CMS_CONF.EPISODE_DEFAULT_IMAGE) {
                                channel.moreImageUrl_2 = temp[0];
                            }
                        }
                        channel.name = CMS_CONF.USER_DATA.name + nn._([pageId, 'channel-list', "'s Favorite"]);
                    } else {
                        if (channel.imageUrl && '' !== $.trim(channel.imageUrl) && channel.imageUrl !== CMS_CONF.EPISODE_DEFAULT_IMAGE) {
                            channel.moreImageUrl_1 = channel.imageUrl;
                        }
                        if (CMS_CONF.CHANNEL_DEFAULT_IMAGE === channel.moreImageUrl_1) {
                            channel.moreImageUrl_1 = 'images/ch_default.png';
                        }
                        if (channel.moreImageUrl && '' !== $.trim(channel.moreImageUrl)) {
                            temp = channel.moreImageUrl.split('|');
                            if (temp[0] && temp[0] !== CMS_CONF.EPISODE_DEFAULT_IMAGE) {
                                channel.moreImageUrl_2 = temp[0];
                            }
                        }
                    }
                    items.push(channel);
                });
                $('#channel-list').html('');
                $('#channel-list-tmpl-item').tmpl(items, {
                    userId: CMS_CONF.USER_DATA.id
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
            }
            if (cntChannel <= 0 || (1 === cntChannel && hasFavoriteChannel)) {
                if (!$.cookie('cms-cct')) {
                    $.cookie('cms-cct', 'seen');
                    $('#lightbox-create-channel').remove();
                    $('#lightbox-create-channel-tmpl').tmpl().prependTo('body');
                    $('.blockOverlay').height($(window).height() - 45);
                    $.blockUI.defaults.overlayCSS.opacity = '0.9';
                    $.blockUI({
                        message: $('#lightbox-create-channel')
                    });
                }
            }
            setFormHeight();
            autoHeight();
            scrollbar('#content-main', '#content-main-wrap', '#main-wrap-slider');
            $('#overlay-s').fadeOut();
        });
    } else {
        location.href = '../';
    }
}   // end of listChannel()

function fadeEpcurateHeaderAndFooter() {
    var cmsEpe = $.cookie('cms-epe'),
        referrer = document.referrer;
    if (!cmsEpe) {
        $('#header, #footer-control, #footer').removeClass('hide').fadeOut(3000);
        if (!referrer) {
            referrer = 'index.html';
        }
        $.cookie('cms-epe', referrer);
        $('#epcurate-nav-back').attr('href', referrer);
        $('#form-btn-leave').data('leaveUrl', referrer);
    } else {
        $('#header, #footer-control, #footer').addClass('hide');
        $('#epcurate-nav-back').attr('href', cmsEpe);
        $('#form-btn-leave').data('leaveUrl', cmsEpe);
    }
}   // end of fadeEpcurateHeaderAndFooter()

function rebuildCrumbAndParam(cid, eid) {
    var cmsCrumb = {},
        cidFromGet = 0,
        eidFromGet = 0,
        qrystr = {};
    if ($.cookie('cms-crumb')) {
        cmsCrumb = $.url('http://fake.url.dev.teltel.com/?' + $.cookie('cms-crumb')).param();
    }
    // ON PURPOSE by pass no check (GET or function param) for handle error by oneself
    if (undefined === cid) {
        cidFromGet = CMS_CONF.USER_URL.param('cid');
        if (cidFromGet) {
            cmsCrumb.channelId = cidFromGet;
        } else {
            // make sure channel id passed by GET or function param, or else delete it
            if (cmsCrumb.channelId) {
                delete cmsCrumb.channelId;
            }
        }
    } else {
        cmsCrumb.channelId = cid;
    }
    if (undefined === eid) {
        eidFromGet = CMS_CONF.USER_URL.param('id');
        if (eidFromGet) {
            cmsCrumb.id = eidFromGet;
        } else {
            // make sure episode id passed by GET or function param, or else delete it
            if (cmsCrumb.id) {
                delete cmsCrumb.id;
            }
        }
    } else {
        cmsCrumb.id = eid;
    }
    $.cookie('cms-crumb', $.param(cmsCrumb));
    // rebuild url param by first-time entry
    if (cmsCrumb.channelId && cmsCrumb.channelId > 0) {
        qrystr.cid = cmsCrumb.channelId;
    }
    if (cmsCrumb.id && cmsCrumb.id > 0) {
        qrystr.id = cmsCrumb.id;
    }
    qrystr = $.param(qrystr);
    if ('' !== qrystr) {
        qrystr = '?' + qrystr;
    }
    $('#epcurate-nav-curation').attr('href', 'epcurate-curation.html' + qrystr);
    $('#epcurate-nav-publish').attr('href', 'epcurate-publish.html' + qrystr);
    $('#form-btn-back').attr('href', $('#epcurate-nav-' + $('#form-btn-back').attr('rel')).attr('href'));
    $('#form-btn-next').attr('href', $('#epcurate-nav-' + $('#form-btn-next').attr('rel')).attr('href'));
    if (cmsCrumb.id) {
        $('#id').val(cmsCrumb.id);
    }
    if (cmsCrumb.channelId) {
        $('#channelId').val(cmsCrumb.channelId);
    }

    return cmsCrumb;
}   // end of rebuildCrumbAndParam()

function setupUserCampaignId() {
    if (null !== CMS_CONF.USER_DATA) {
        if (CMS_CONF.CAMPAIGN_ID && !isNaN(CMS_CONF.CAMPAIGN_ID)) {
            return CMS_CONF.CAMPAIGN_ID;
        }
        nn.api('GET', CMS_CONF.API('/api/users/{userId}/poi_campaigns', {
            userId: CMS_CONF.USER_DATA.id
        }), null, function (poi_campaign) {
            if (poi_campaign && poi_campaign.length > 0 && poi_campaign[0] && !isNaN(poi_campaign[0].id)) {
                CMS_CONF.CAMPAIGN_ID = poi_campaign[0].id;
                return CMS_CONF.CAMPAIGN_ID;
            }
            var parameter = {
                name: CMS_CONF.USER_DATA.name + "'s campaign"
            };
            nn.api('POST', CMS_CONF.API('/api/users/{userId}/poi_campaigns', {
                userId: CMS_CONF.USER_DATA.id
            }), parameter, function (poi_campaign) {
                CMS_CONF.CAMPAIGN_ID = poi_campaign.id;
                return CMS_CONF.CAMPAIGN_ID;
            });
        });
    } else {
        nn.log('Can not invoke getUserCampaignId()!', 'error');
    }
}   // end of setupUserCampaignId()

function setupLanguageAndRenderPage(user, isStoreLangKey) {
    // fetch user lang
    CMS_CONF.USER_DATA = user;
    var msie = /MSIE/.test(navigator.userAgent),
        lang = CMS_CONF.USER_DATA.lang;
    if (-1 === $.inArray(lang, CMS_CONF.LANG_SUPPORT)) {
        lang = 'en';
        CMS_CONF.USER_DATA.lang = lang;
    }
    $('html').removeClass(CMS_CONF.LANG_SUPPORT.join(' ')).addClass(lang);
    $('html').attr('lang', lang);

    nn.api('GET', 'lang/' + lang + '.json', null, function (langPack) {
        var userUrlFile = null,
            cmsCrumb = null,
            fm = null;
        // setup user profile
        $('#selected-profile').text(CMS_CONF.USER_DATA.name);

        // setup lang pack
        CMS_CONF.LANG_MAP = langPack['lang-map'];
        CMS_CONF.SPHERE_MAP = langPack['sphere-map'];
        CMS_CONF.EFFECT_MAP = langPack['effect-map'];
        nn.i18n(langPack);

        // store lang key
        if (true === isStoreLangKey) {
            if (!msie) {
                // avoid IE8 bug
                $('title').data('langkey', $('title').text());
            }
            $('#title-func .langkey, #header a, #footer span, #footer a, .lightbox-content .btns a, #studio-nav a, #studio-nav .langkey, #func-nav a, #epcurate-nav .langkey, #epcurateForm .langkey').each(function () {
                $(this).data('langkey', $(this).text());
            });
            $('.overlay-l h4, .overlay-l h5, .overlay-l .content').each(function () {
                $(this).data('langkey', $(this).html());
            });
            $('#epcurateForm .langkey-val').each(function () {
                $(this).data('langkey', $(this).val());
            });
            // portal manage
            $('#portal-layer .langkey, #portal-add-layer .langkey, #store-layer .langkey, #brand-layer .langkey').each(function () {
                $(this).data('langkey', $(this).text());
            });
            $('#portal-add-layer .langkeyVal').each(function () {
                $(this).data('langkey', $(this).val());
            });
            $('#portal-add-layer .langkeyH').each(function () {
                $(this).data('langkey', $(this).html());
            });
        }

        // render page
        userUrlFile = CMS_CONF.USER_URL.attr('file');
        if ('' === userUrlFile) {
            userUrlFile = 'index.html';
        }
        CMS_CONF.PAGE_ID = userUrlFile.substr(0, userUrlFile.indexOf('.'));
        if (-1 === $.inArray(userUrlFile, ['epcurate-curation.html', 'epcurate-publish.html'])) {
            $.removeCookie('cms-epe');
            $.removeCookie('cms-crumb');

            switch (userUrlFile) {
            case 'signin.html':
                break;
            case 'pcs-error':
                // do nothing
                break;
            case 'brand-setting.html':
                showProcessingOverlay();
                brandSeting();
                break;
            case 'store-manage.html':
                showProcessingOverlay();
                storeManage();
                break;
            case 'portal-manage.html':
                showProcessingOverlay();
                portalManage();
                break;
            case 'portal-set.html':
                showProcessingOverlay();
                portalSet();
                break;
            case 'index.html':
                initFacebookJavaScriptSdk();
                listChannel(CMS_CONF.PAGE_ID);
                break;
            case 'cms-settings.html':
                initFacebookJavaScriptSdk();
                buildCmsSettings(CMS_CONF.PAGE_ID);
                break;
            case 'channel-add.html':
                CMS_CONF.PAGE_ID = 'channel';
                // because auto share template parse order issue, initFacebookJavaScriptSdk() be bundled to createChannel()
                createChannel(CMS_CONF.PAGE_ID);
                break;
            case 'channel-setting.html':
                CMS_CONF.PAGE_ID = 'channel';
                // because auto share template parse order issue, initFacebookJavaScriptSdk() be bundled to updateChannel()
                updateChannel(CMS_CONF.PAGE_ID, CMS_CONF.USER_URL.param('id'));
                break;
            case 'channel-poi.html':
                setupUserCampaignId();
                initFacebookJavaScriptSdk();
                buildChannelPoi(CMS_CONF.PAGE_ID, CMS_CONF.USER_URL.param('id'));
                break;
            case 'episode-list.html':
                initFacebookJavaScriptSdk();
                listEpisode(CMS_CONF.PAGE_ID, CMS_CONF.USER_URL.param('id'));
                break;
            default:
                nn.log('Can not render page!', 'error');
                break;
            }
        } else {
            fadeEpcurateHeaderAndFooter();
            cmsCrumb = rebuildCrumbAndParam();
            fm = document.epcurateForm;
            switch (userUrlFile) {
            case 'epcurate-publish.html':
                buildEpcuratePublish(CMS_CONF.PAGE_ID, fm, cmsCrumb);
                break;
            case 'epcurate-curation.html':
                setupUserCampaignId();
                $('#epcurate-curation ul.tabs li a.cur-add').trigger('click');
                buildEpcurateCuration(CMS_CONF.PAGE_ID, fm, cmsCrumb);
                break;
            default:
                nn.log('Can not render page!', 'error');
                break;
            }
        }

        // replace lang value
        // NOTE: get CMS_CONF.PAGE_ID after render page
        if (!msie) {
            // avoid IE8 bug
            $('title').text(nn._([CMS_CONF.PAGE_ID, 'html-title', $('title').data('langkey')]));
        }
        $('#header a').each(function () {
            $(this).text(nn._(['header', $(this).data('langkey')]));
        });
        $('#studio-nav a, #studio-nav .langkey').each(function () {
            $(this).html(nn._(['studio-nav', $(this).data('langkey')]));
        });
        $('#footer span, #footer a').each(function () {
            $(this).text(nn._(['footer', $(this).data('langkey')]));
        });
        $('.overlay-l h4, .overlay-l h5, .overlay-l .content').each(function () {
            $(this).html(nn._(['overlay', 'facebook', $(this).data('langkey')]));
        });
        $('.lightbox-content .btns a').each(function () {
            $(this).html(nn._(['overlay', 'button', $(this).data('langkey')]));
        });
        $('#func-nav a').each(function () {
            $(this).text(nn._([CMS_CONF.PAGE_ID, 'func-nav', $(this).data('langkey')]));
        });
        $('#epcurate-nav .langkey').each(function () {
            $(this).text(nn._([CMS_CONF.PAGE_ID, 'epcurate-nav', $(this).data('langkey')]));
        });
        $('#epcurateForm .langkey').each(function () {
            $(this).html(nn._([CMS_CONF.PAGE_ID, 'epcurate-form', $(this).data('langkey')]));
        });
        $('#epcurateForm .langkey-val').each(function () {
            $(this).val(nn._([CMS_CONF.PAGE_ID, 'epcurate-form', $(this).data('langkey')]));
        });
        $('#language').text(langPack['lang-map'][CMS_CONF.USER_DATA.lang]);
        $('#language-en, #language-zh').parent('li').removeClass('on');
        $('#language-' + lang).parent('li').addClass('on');
    }, 'json');
}   // end of setupLanguageAndRenderPage()

function setupLanguagePage() {
    // fetch user lang
    var msie = /MSIE/.test(navigator.userAgent),
        lang = $.cookie('signLang');
    if (-1 === $.inArray(lang, CMS_CONF.LANG_SUPPORT)) {
        lang = 'en';
    }
    $('#language').text($('#language-' + lang).text());
    $('#language-en, #language-zh').parent('li').removeClass('on');
    $('#language-' + lang).parent('li').addClass('on');
    $('html').removeClass(CMS_CONF.LANG_SUPPORT.join(' ')).addClass(lang);
    $('html').attr('lang', lang);

    nn.api('GET', 'lang/' + lang + '.json', null, function (langPack) {
        // setup lang pack
        CMS_CONF.LANG_MAP = langPack['lang-map'];
        CMS_CONF.SPHERE_MAP = langPack['sphere-map'];
        CMS_CONF.EFFECT_MAP = langPack['effect-map'];
        nn.i18n(langPack);

        if (!msie) {
            if ($('title').data('langkey') === undefined) {
                $('title').data('langkey', $('title').text());
            }
            $('title').text(nn._(['signin', 'html-title', $('title').data('langkey')]));
        }
        $('#header a').each(function () {
            if ($(this).data('langkey') === undefined) {
                $(this).data('langkey', $(this).text());
            }
            $(this).text(nn._(['header', $(this).data('langkey')]));
        });

        $('#login-layer .langkey, #signup-layer .langkey, #forgot-password-layer .langkey, #reset-password-layer .langkey').each(function () {
            if ($(this).data('langkey') === undefined) {
                $(this).data('langkey', $(this).text());
            }
            $(this).text(nn._(['signin', 'login-holder', $(this).data('langkey')]));
        });

        $('#signup-layer .langkeyH').each(function () {
            if ($(this).data('langkey') === undefined) {
                $(this).data('langkey', $(this).html());
            }
            $(this).html(nn._(['signin', 'login-holder', $(this).data('langkey')]));
        });

        var tmpStr = '';
        $('#login-layer .flangkey, #signup-layer .flangkey, #forgot-password-layer .flangkey, #reset-password-layer .flangkey').each(function () {
            if ($(this).data('langkey') === undefined) {
                $(this).data('langkey', $(this).attr('defvalue'));
            }
            tmpStr = nn._(['signin', 'login-holder', $(this).data('langkey')]);
            $(this).attr('defvalue', tmpStr);
            $(this).attr('value', tmpStr);
        });
        resetPassCheck();
    }, 'json');
}   // end of setupLanguagePage()

$(function () {
    nn.api('GET', CMS_CONF.API('/api/login'), function (user) {
        var tmpUrl = $.url(location.href.replace('@', '%40')),
            tmpPriv = 0,
            isStoreLangKey = true;
        if (!user || !user.id) {
            if ('signin.html' !== tmpUrl.attr('file')) {
                location.href = 'signin.html';
            } else {
                setupLanguagePage();
            }
        } else {
            if ('signin.html' === tmpUrl.attr('file')) {
                location.href = 'index.html';
            } else {
                tmpPriv = parseInt(user.priv, 10) / 1000 + 111;
                CMS_CONF.MSO = 0;
                if (tmpPriv > 221 && user.msoId > 0) {
                    CMS_CONF.MSO = user.msoId;
                }
                if (CMS_CONF.MSO > 0) {
                    $('#studio-nav #my-portal').removeClass('hide');
                } else {
                    $('#studio-nav #my-portal').remove();
                }
                CMS_CONF.USER_URL = $.url();
                setupLanguageAndRenderPage(user, isStoreLangKey);
            }
        }
    });
});
