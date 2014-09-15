/*jslint nomen: true, unparam: true */
/*global $, nn, cms */

(function ($page) {
    'use strict';

    var $common = cms.common;
    $page.s3Info = {
        isGet: false,
        parameter: {},
        s3attr: {}
    };

    $page.createEpisodeProgram = function(epObj) {
        var thisObj = epObj,
            s3FileName = $(thisObj).data("s3filename"),
            epName = $(thisObj).find("p.video-name").text().replace(".mp4", ""),
            channelId = cms.global.USER_URL.param('cid');


        nn.api('POST', cms.reapi('/api/channels/{channelId}/episodes', {
            channelId: channelId
        }), {
            duration: 0,
            isPublic: true,
            contentType: 5,
            name: epName
        }, function (epObj) {
            nn.api('POST', cms.reapi('/api/episodes/{episodeId}/programs', {
                episodeId: epObj.id
            }), {
                duration: 0,
                channelId: channelId,
                contentType: 5,
                startTime: 0,
                subSeq: 1,
                fileUrl: s3FileName,
                name: epName,
                uploader: cms.global.USER_DATA.id,
                uploadDate: "NOW"
            }, function (pObj) {

                nn.api('GET', cms.reapi('/api/thumbnails'), {
                    "url": s3FileName
                }, function (thVideo) {
                    if(thVideo.length >0){
                        nn.api('PUT', cms.reapi('/api/episodes/{episodesId}', {
                            episodesId: epObj.id
                        }), {
                            imageUrl: thVideo[0].url
                        }, function (ppObj) {
                            $(thisObj).data("done", "yes");
                            $(thisObj).data("imageurl", thVideo[0].url);
                        });
                    }else{
                        $(thisObj).data("done", "yes");
                    }
                });
            });
        });
    };


    $page.videoUpload = function (fileObj, eKey) {

        var timestamp = (new Date()).getTime(),
            filenamePreFix = timestamp + eKey,
            tmpS3attr = $page.s3Info.s3attr,
            upFileName = $page.s3Info.parameter.prefix + filenamePreFix + ".mp4",
            s3Url = "http://" + tmpS3attr.bucket + ".s3.amazonaws.com/",
            s3FileName = s3Url + upFileName;


        $('#upload-element-tmpl').tmpl({
            tmpId: filenamePreFix,
            tmpFileName: fileObj.name
        }, null).appendTo('#upload-area');

        var thisObj = $("#up_" + filenamePreFix),
            tmpProgress = $(thisObj).find("div.progress-bar"),
            tmpProgressText = $(thisObj).find("span.progress-bar-text"),
            formData = new FormData();

        formData.append('AWSAccessKeyId', tmpS3attr.id);
        formData.append('key', upFileName);
        formData.append('acl', 'public-read');
        formData.append('policy', tmpS3attr.policy);
        formData.append('signature', tmpS3attr.signature);
        formData.append('content-type', "video");
        formData.append('filename', upFileName);
        formData.append('success_action_status', "201");
        formData.append('file', fileObj);

        var xhr = new XMLHttpRequest(),
            cntTotal = $common.fileSizeUnit(0, fileObj.size);

        xhr.open('POST', s3Url);
        xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
                var complete = (event.loaded / event.total * 100 | 0);

                tmpProgress.css("width", complete + "%")
                tmpProgressText.text(" " + complete + "% ")

                if (thisObj.hasClass("del-upload")) {
                    xhr.abort();
                    thisObj.remove();
                }
            }
        }
        xhr.onload = function() {
            $(thisObj).addClass("is-success");
            $(thisObj).data("s3filename", s3FileName);
            $page.createEpisodeProgram(thisObj);
        };
        xhr.send(formData);
    };

    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {
        nn.log({
            // NOTE: remember to change page-key to match file-name
            subject: 'CMS.PAGE.INITIALIZED: video-upload',
            options: options
        }, 'debug');

        var id = cms.global.USER_URL.param('cid'),
            isVideoAuth = cms.global.USER_PRIV.isVideoAuth;

        if (!isVideoAuth) {
            $common.showSystemErrorOverlayAndHookError('You are not authorized to edit episodes in this program.');
            return;
        } else {
            $common.showProcessingOverlay();

            $('.langkeyT').each(function() {
                $(this).data('langkey', $(this).text());
            });
            $('.langkeyH').each(function() {
                $(this).data('langkey', $(this).html());
            });

            $('.langkeyT').each(function() {
                $(this).text(nn._([cms.global.PAGE_ID, 'content-area', $(this).data('langkey')]));
            });
            $('.langkeyH').each(function() {
                $(this).html(nn._([cms.global.PAGE_ID, 'content-area', $(this).data('langkey')]));
            });

            $("a.btn-backEpisode").attr("href", "episode-list.html?id=" + id);

            // cms.global.USER_DATA.id
            nn.api('GET', cms.reapi('/api/channels/{channelId}', {
                channelId: id
            }), null, function (channel) {
                // user id check
                if (cms.global.USER_DATA.id !== channel.userId) {
                    $('#overlay-s').fadeOut();
                    $common.showSystemErrorOverlayAndHookError('You are not authorized to edit episodes in this program.');
                    return false;
                }
                $("#channel-name").text(channel.name);
                $("#content-main").removeClass("hide");
                
                $page.s3Info.parameter = {
                    'prefix': 'up-video-' + cms.global.MSO + '-' + id + '-',
                    'type': 'video',
                    'size': 31267400,
                    'acl': 'public-read',
                    'mso': cms.global.MSO
                };

                nn.api('GET', cms.reapi('/api/s3/attributes'), $page.s3Info.parameter, function (s3attr) {
                    $page.s3Info.s3attr = s3attr;
                    $page.s3Info.isGet = true;
                    $("#upload-box").removeClass("hide");
                });


                $('#overlay-s').fadeOut();

            });
        }
    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('video-upload')));