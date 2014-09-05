/*jslint nomen: true, unparam: true */
/*global $, nn, cms */

(function ($page) {
    'use strict';

    var $common = cms.common;

    $page.imageUpload = function (inObj, parameter) {

        var loadingImg = "images/loading.gif",
            opObj = inObj.opObj,
            acObj = inObj.acObj,
            progressObj = acObj.parent().find("div.progress"),
            progressObjStatus = progressObj.find("div.progress-bar.progress-bar-striped.active"),
            imgTitleObj = acObj.parent().find("span.imgTitle"),
            oldImg = "",
            objMsg = {
                "bTxtUploading": '<span class="uploadstyle">' + nn._(['upload', 'Uploading...']) + "</span>",
                "bTxtUpload": '<span class="uploadstyle">' + nn._(['upload', 'Upload image']) + "</span>"
            };
        nn.api('GET', cms.reapi('/api/s3/attributes'), parameter, function(s3attr) {
            var timestamp = (new Date()).getTime(),
                handlerUploadProgress = function (file, completed, total) {
                    var percent = Math.floor(completed / total * 100);
                    this.setButtonText(objMsg.bTxtUploading);

                    if(percent >90){
                        percent = percent -2;
                    }
                    // nn.log(progressObjStatus);
                    progressObjStatus.css("width", percent+"%");
                },
                handlerUploadSuccess = function (file, serverData, recievedResponse) {
                    var tmpImg = new Image();
                    this.setButtonText(objMsg.bTxtUpload);
                    if (!file.type) {
                        file.type = nn.getFileTypeByName(file.name);
                    }

                    // enable upload button again
                    this.setButtonDisabled(false);

                    // image url
                    var url = 'http://' + s3attr.bucket + '.s3.amazonaws.com/' + parameter.prefix + timestamp + '-' + file.size + file.type.toLowerCase();
                    // action after upload
                    acObj.css("background-image", "url(" + url + ") " );

                    tmpImg.src = url;
                    $page.onImgLoad(tmpImg, function () {
                        imgTitleObj.addClass("hide");
                        progressObj.addClass("hide");
                        tmpImg = "";
                    });

                    oldImg = "";
                    acObj.addClass("has-change");
                    acObj.data("meta", url);
                    $('body').addClass("has-change");
                },
                handlerUploadError = function (file, code, message) {
                    this.setButtonText(objMsg.bTxtUpload);
                    this.setButtonDisabled(false);

                    imgTitleObj.addClass("hide");
                    progressObj.addClass("hide");
                    if(oldImg !== ""){
                        acObj.css("background-image", oldImg);
                        oldImg = "";
                    }

                    if (code === -280) { // user cancel upload
                        alert(message);
                        // show some error prompt
                    } else {
                        alert(message);
                        // show some error prompt
                    }
                },
                handlerFileQueue = function (file) {
                    if (file.size > parameter.size) {
                        alert("upload failed");
                        return false;
                    }
                    if (!file.type) {
                        file.type = nn.getFileTypeByName(file.name);
                        // Mac Chrome compatible
                    }
                    var postParams = {
                        "AWSAccessKeyId": s3attr.id,
                        "key": parameter.prefix + timestamp + '-' + file.size + file.type.toLowerCase(),
                        "acl": parameter.acl,
                        "policy": s3attr.policy,
                        "signature": s3attr.signature,
                        "content-type": parameter.type,
                        "success_action_status": "201"
                    };
                    this.setPostParams(postParams);
                    this.startUpload(file.id);
                    this.setButtonDisabled(true);

                    imgTitleObj.removeClass("hide");
                    progressObj.removeClass("hide");
                    progressObjStatus.css("width", "1%");
                    oldImg = acObj.css("background-image");
                    setTimeout( function(){
                        acObj.css("background-image", "");
                    }, 600 );
               },
                handlerFileQueueError = function (file, code, message) {
                    if (code === -130) { // error file type

                        // $('#brand-logo').removeClass('hide');
                        // $('.img .loading').hide();
                    }
                },
                settings = {
                    flash_url: 'javascripts/libs/swfupload/swfupload.swf',
                    upload_url: 'http://' + s3attr.bucket + '.s3.amazonaws.com/', // http://9x9tmp-ds.s3.amazonaws.com/
                    file_size_limit: parameter.size,
                    file_types: '*.png; *.jpg',
                    file_types_description: 'Thumbnail',
                    file_post_name: 'file',
                    button_placeholder: opObj.get(0),
                    button_image_url: '',
                    button_width: '490',
                    button_height: '150',
                    button_text: objMsg.bTxtUpload,
                    button_text_style: '.uploadstyle { color: #ffffff; font-family: Arial, Helvetica; font-size: 16px; text-align: center; } .uploadstyle:hover { color: #ffffff; }',
                    button_text_top_padding: 120,
                    button_action: SWFUpload.BUTTON_ACTION.SELECT_FILE,
                    button_cursor: SWFUpload.CURSOR.HAND,
                    button_window_mode: SWFUpload.WINDOW_MODE.TRANSPARENT,
                    http_success: [201],
                    upload_progress_handler: handlerUploadProgress,
                    upload_success_handler: handlerUploadSuccess,
                    upload_error_handler: handlerUploadError,
                    file_queued_handler: handlerFileQueue,
                    file_queue_error_handler: handlerFileQueueError,
                    debug: false
                },
                swfu = new SWFUpload(settings);

            swfu.debug = cms.config.IS_DEBUG;
        });
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

                $('#overlay-s').fadeOut();

            });
        }
    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('video-upload')));