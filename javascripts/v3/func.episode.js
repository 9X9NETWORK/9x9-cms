/*jslint nomen: true, unparam: true */
/*global $, nn, cms */

(function ($page) {
    'use strict';

    var $common = cms.common;

    $page.importPrograms = 10;
    $page.isImportEpisode = false;
    $page.s3Info = {
        isGet: false,
        parameter: {},
        s3attr: {},
        gt: (new Date()).getTime()
    };

    $page.createFromEpisode = function(episode, programs) {
        var chId = cms.global.USER_URL.param('id');

        episode.storageId = episode.id;
        episode.isPublic = false;
        episode.publishDate = '';
        episode.scheduleDate = '';
        episode.updateDate = '';
        episode.updateDate = '';
        delete episode.id;
        delete episode.seq;
        delete episode.channelId;

        nn.api('POST', cms.reapi('/api/channels/{channelId}/episodes', {
            channelId: chId
        }), episode, function (newEpisode) {
            var newEpisodeId = newEpisode.id;

            $page.importPrograms = programs.length;

            $.each(programs, function (idx, programItem) {

                programItem.cntView = 0;
                delete programItem.id;
                delete programItem.channelId;
                delete programItem.episodeId;

                // insert program
                nn.api('POST', cms.reapi('/api/episodes/{episodeId}/programs', {
                    episodeId: newEpisodeId
                }), programItem, function (newProgram) {
                    $page.importPrograms --;

                    if(0 === $page.importPrograms){
                        location.href = "epcurate-curation.html?id=" + newEpisodeId;
                    }

                });
            });
        });
    }

    $page.importEp = function (inObj) {
        nn.api('GET', cms.reapi('/api/episodes/{epId}', {
            epId: inObj
        }), null, function (episode) {
            nn.api('GET', cms.reapi('/api/episodes/{epId}/programs', {
                epId: inObj
            }), null, function (programs) {
                $("#new-Episode-Option").addClass("hide");
                $common.showProcessingOverlay();
                $page.createFromEpisode(episode, programs);
            });
        });        
    };

    $page.imageUpload = function (fileObj, eKey) {

        var formData = new FormData(),
            xhr = new XMLHttpRequest(),
            loadingImg = "images/loading.gif",
            timestamp = (new Date()).getTime(),
            filenamePreFix = timestamp + eKey,
            tmpS3attr = $page.s3Info.s3attr,
            upFileName = $page.s3Info.parameter.prefix + filenamePreFix + ".jpg",
            s3Url = "http://" + tmpS3attr.bucket + ".s3.amazonaws.com/",
            s3FileName = s3Url + upFileName,
            procBody = $("#edit-Episode-Info").find("div.progress"),
            procBar = procBody.find("div.progress-bar"),
            procBarText = procBody.find("span.progress-bar-text");


        procBar.css("width", "0%");
        procBarText.text("0%");
        procBody.removeClass("hide");

        formData.append('AWSAccessKeyId', tmpS3attr.id);
        formData.append('key', upFileName);
        formData.append('acl', 'public-read');
        formData.append('policy', tmpS3attr.policy);
        formData.append('signature', tmpS3attr.signature);
        formData.append('content-type', $page.s3Info.parameter.type);
        formData.append('filename', upFileName);
        formData.append('success_action_status', "201");
        formData.append('file', fileObj);

        var cntTotal = $common.fileSizeUnit(0, fileObj.size);

        xhr.open('POST', s3Url);
        xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
                var complete = (event.loaded / event.total * 100 | 0);
                procBar.css("width", complete + "%")
                procBarText.text(" " + complete + "% ")
            }
        }
        xhr.onload = function() {
            $("#epImage").attr("src", s3FileName);
            $("#upload-box").find("span").removeClass("hide");
            procBody.addClass("hide");
            procBar.css("width", "0%");
            procBarText.text("0%");
        };

        $("#epImage").attr("src", "");
        $("#upload-box").find("span").addClass("hide");
        xhr.send(formData);
    };

    $page.prepareS3Attr = function () {
        var timeCheck = (new Date()).getTime() + (50 * 60 * 1000);

        if (!$page.s3Info.isGet || ($page.s3Info.gt > timeCheck)) {
            $page.s3Info.parameter = {
                'prefix': 'up-video-th-' + cms.global.MSO + '-',
                'type': 'image',
                'size': 11267000,
                'acl': 'public-read'
            };

            nn.api('GET', cms.reapi('/api/s3/attributes'), $page.s3Info.parameter, function (s3attr) {
                $page.s3Info.isGet = true;
                $page.s3Info.s3attr = s3attr;
                $page.s3Info.isGet = (new Date()).getTime();
            });
        }
    };

    $page.getEpisodeAndProgram = function (inID) {
        $('#edit-Episode-Info').empty();
        $('#edit-Episode-Info-def-tmpl').tmpl(null).appendTo('#edit-Episode-Info');
        $.blockUI({
            message: $('#edit-Episode-Info')
        });
        nn.api('GET', cms.reapi('/api/episodes/{episodesId}', {
            episodesId: inID
        }), null, function (epObj) {

            nn.api('GET', cms.reapi('/api/episodes/{episodeId}/programs', {
                episodeId: inID
            }), null, function (programs) {
                if (programs.length > 0) {
                    epObj.progId = programs[0].id;
                    $('#edit-Episode-Info').empty();
                    $('#edit-Episode-Info-tmpl').tmpl(epObj).appendTo('#edit-Episode-Info');

                }
            });
        });
    };

    $page.epYoutubeCheck = function (inID) {

        function _getEpisodeProgram(episodeId) {
            var deferred = $.Deferred();

            nn.api('GET', cms.reapi('/api/episodes/{episodeId}/programs', {
                episodeId: episodeId
            }), null, function (programs) {
                deferred.resolve(programs);
            });
            return deferred.promise();
        }

        function _getYoutubes(ytVideo) {
            var deferred = $.Deferred();

            nn.api('GET', 'http://gdata.youtube.com/feeds/api/videos/' + ytVideo.slice(-11) + '?alt=jsonc&v=2&callback=?', null, function (youtubes) {
                deferred.resolve(youtubes);
            }, 'jsonp');
            return deferred.promise();
        }

        function _showResult(showData) {
            var errMsg = "",
                errIcon = "ok",
                errCount = showData.err + showData.warn;

            if (errCount > 0) {
                if (showData.err === 0 && showData.warn > 0) {
                    errIcon = "warn";
                } else {
                    errIcon = "error";
                }
                if (1 === errCount) {
                    errMsg += nn._([cms.global.PAGE_ID, 'episode-list', "Find ? video has problem."], [errCount]);
                } else {
                    errMsg += nn._([cms.global.PAGE_ID, 'episode-list', "Find ? videos have problem."], [errCount]);
                }
            }
            if ("ok" === errIcon) {
                errMsg += nn._([cms.global.PAGE_ID, 'episode-list', "No video has problem"]);
            }

            $("#yuchk-btn-" + inID).removeClass().addClass(errIcon);
            $("#yuchk-msg-" + inID).text(errMsg);

            $('#overlay-s').fadeOut();
        }

        function _chkProgramVideo(programs) {
            var deferred = $.Deferred(),
                videoList = [],
                chkResoult = {
                    cntList: 0,
                    nnCount: 0,
                    isOk: 0,
                    warn: 0,
                    err: 0
                },
                // isPrivateVideo = null,
                // isZoneLimited = null,
                // hasSyndicateDenied = null,
                // hasLimitedSyndication = null,
                // isSyndicateLimited = null,
                // isEmbedLimited = null,
                // isUnplayableVideo = null,
                invalidList = [],
                // committedCnt = 0,
                ytData = null;

            $.each(programs, function (eKey, eValue) {
                videoList.push(eValue.fileUrl);
            });

            chkResoult.cntList = videoList.length;

            $.each(videoList, function (idx, itemVideo) {
                nn.on([400, 401, 403, 404], function (jqXHR, textStatus) {
                    // committedCnt += 1;
                    invalidList.push(itemVideo);
                });
                // if (idx === 0) { // 測試用
                //     itemVideo = "http://www.youtube.com/watch?v=WwY15T5EEpG";
                // }
                $.when(_getYoutubes(itemVideo))
                    .then(function (youtubes) {
                        var ytCheck = null;

                        if (youtubes.data) {
                            ytCheck = cms.youtubeUtility.checkVideoValidity(youtubes);
                            if (ytCheck.isZoneLimited || ytCheck.isEmbedLimited || ytCheck.isSyndicateLimited || ytCheck.isUnplayableVideo) {
                                // unplayable = true;
                                chkResoult.warn += 1;
                            } else {
                                // unplayable = false;
                                chkResoult.isOk += 1;
                            }

                        } else {
                            chkResoult.err += 1;
                        }
                        chkResoult.nnCount += 1;
                        if (chkResoult.nnCount === chkResoult.cntList) {
                            deferred.resolve(chkResoult);
                        }

                    });

            });
            return deferred.promise();
        }

        _getEpisodeProgram(inID)
            .then(_chkProgramVideo)
            .then(_showResult);

    };

    $page.setPageScroll = function (isDown) {
        $('#content-main-wrap').perfectScrollbar('update');
    };

    $page.afterDelete = function (inID) {
        $.each(cms.global.EPISODES_PAGING, function (eKey, eValue) {
            $.each(eValue, function (eeKey, eeValue) {
                if (parseInt(inID, 10) === eeValue.id) {
                    cms.global.EPISODES_PAGING[eKey].splice(eeKey, 1);
                    return false;
                }
            });
        });
    };

    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {
        nn.log({
            // NOTE: remember to change page-key to match file-name
            subject: 'CMS.PAGE.INITIALIZED: episode-list',
            options: options
        }, 'debug');

        var id = cms.global.USER_URL.param('id');
        if (id > 0 && !isNaN(id) && cms.global.USER_DATA.id) {
            if(cms.global.USER_PRIV.isVideoAuth){
                $page.prepareS3Attr();
            }
            if (options && options.init) {
                $common.showProcessingOverlay();
            }
            nn.api('GET', cms.reapi('/api/channels/{channelId}', {
                channelId: id
            }), null, function (channel) {
                // autoSync this field only in this api will beused , in other api this field will alway be "false"
                channel.isYoutubeSync = false;
                cms.global.vIsYoutubeSync = false;
                if (channel.userIdStr !== cms.global.USER_DATA.idStr) {
                    $('#overlay-s').fadeOut();
                    $common.showSystemErrorOverlayAndHookError('You are not authorized to edit episodes in this program.');
                    return;
                }
                // youtube live channel check
                if(13 == channel.contentType){
                    location.href = "index.html";
                    return false;
                }
                // youtube sync channel check 
                if (null != channel.sourceUrl && channel.sourceUrl.length > 10) {
                    channel.isYoutubeSync = true;
                    cms.global.vIsYoutubeSync = true;
                    $("#content-main").addClass("youtube-program");
                }
                $('#func-nav ul').html('');
                $('#func-nav-tmpl').tmpl(channel).appendTo('#func-nav ul');
                if (channel.contentType !== cms.config.YOUR_FAVORITE) {
                    nn.api('GET', cms.reapi('/api/channels/{channelId}/episodes', {
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
                        cms.global.EPISODES_PAGING = [];
                        cms.global.EPISODES_PAGING_INFO = [];
                        if (cntEpisode > 0) {
                            // for imageUrl === '' 
                            $.each(episodes, function (eKey, eValue) {
                                if('' === eValue.imageUrl){
                                    episodes[eKey].imageUrl = 'images/ep_invalid.png';
                                }
                            });
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
                                cms.global.EPISODES_PAGING.push(tmpEpisodes);
                                cms.global.EPISODES_PAGING_INFO.push({
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
                                    cms.global.EPISODES_PAGING.push(tmpEpisodes);
                                    cms.global.EPISODES_PAGING_INFO.push({
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
                                cms.global.EPISODES_PAGING.push(tmpEpisodes);
                            }

                            $('#episode-list-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
                            $('#episode-list-tmpl-item').tmpl(cms.global.EPISODES_PAGING[0]).appendTo('#episode-list');
                            // folder list
                            $('#episode-list-tmpl-folder').tmpl(cms.global.EPISODES_PAGING_INFO).appendTo('#episode-list');
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

                            $('#content-main-wrap').perfectScrollbar("update");

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

                            $('#content-main-wrap').perfectScrollbar({marginTop: 20, marginBottom: 60});
                        }

                        $('#overlay-s').fadeOut();

                        // sharing url
                        nn.api('GET', cms.reapi('/api/channels/{channelId}/autosharing/validBrands', {
                                channelId: id
                            }), null, function (cBrands) {
                            var iBrandCount = cBrands.length,
                                iLoop = 0,
                                tmpBrand = [{
                                    brand: ""
                                }];

                            for (iLoop = 0; iLoop < iBrandCount; iLoop++) {
                                if (cms.global.USER_DATA.msoName === cBrands[iLoop].brand) {
                                    tmpBrand[0].brand = cms.global.USER_DATA.msoName;
                                    break;
                                }
                            };

                            $('#tmpHtml').html('');
                            $('#get-url-tmpl').tmpl(tmpBrand).appendTo('#tmpHtml');

                            $('div.get-url').each(function() {
                                $(this).children().remove();
                                $(this).append($('#tmpHtml').html());
                            });
                        });
                    });
                }
            });
        } else {
            $common.showSystemErrorOverlayAndHookError('Invalid program ID, please try again.');
            return;
        }
    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('episode-list')));