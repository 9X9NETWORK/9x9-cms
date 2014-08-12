/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, vars: true */
/*global $, nn, cms, SWFUpload */

(function ($page) {
    'use strict';

    var $common = cms.common;
    $page.isMsoInfo = false;
    $page.isSNS = false;
    $page.isSuggested = false;
    $page.limitSNS = 4;
    $page.limitSuggestedMin = 4;
    $page.limitSuggested = 6;
    $page.defImgSNS = "http://fakeimg.pl/100/";
    $page.defImgSugg = "http://fakeimg.pl/200/";

    $page.itemHasChange = function (opObj) {
        if(!opObj.hasClass("newItem")){
            opObj.addClass("has-change");
        }
    };

    $page.imageUpload = function (inType, parameter) {
 
        var thisId = $("#imageUpload").data("meta");
        nn.api('GET', cms.reapi('/api/s3/attributes'), parameter, function (s3attr) {
            var timestamp = (new Date()).getTime(),
                handlerUploadProgress = function (file, completed, total) {
                    this.setButtonText('<span class="uploadstyle">' + nn._(['upload', 'Uploading...']) + '</span>');
                },
                handlerUploadSuccess = function (file, serverData, recievedResponse) {
                    this.setButtonText('<span class="uploadstyle">' + nn._(['upload', 'Upload']) + '</span>');
                    if (!file.type) {
                        file.type = nn.getFileTypeByName(file.name);
                    }
                    this.setButtonDisabled(false);
                    // enable upload button again
                    var url = 'http://' + s3attr.bucket + '.s3.amazonaws.com/' + parameter.prefix + timestamp + '-' + file.size + file.type.toLowerCase();
                    $('body').addClass("has-change");
                    $("#" + thisId).addClass("has-change");
                    $("#" + thisId).find("img.logoUrl").attr("src", url);
                    setTimeout(function() {
                        $('#imageUpload').modal('hide');
                    }, 500);
                },
                handlerUploadError = function (file, code, message) {

                    this.setButtonText('<span class="uploadstyle">' + nn._(['upload', 'Upload']) + '</span>');
                    this.setButtonDisabled(false);
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
                        // $common.showSystemErrorOverlay(nn._([cms.global.PAGE_ID, 'brand-layer', 'your upload file is large than 500KB, please reupload file.']));
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
                    file_types: '*.png',
                    file_types_description: 'Thumbnail',
                    file_post_name: 'file',
                    button_placeholder: $('#uploadThumbnail').get(0),
                    button_image_url: 'images/btn-load.png',
                    button_width: '129',
                    button_height: '29',
                    button_text: '<span class="uploadstyle">' + nn._(['upload', 'Upload']) + '</span>',
                    button_text_style: '.uploadstyle { color: #777777; font-family: Arial, Helvetica; font-size: 15px; text-align: center; } .uploadstyle:hover { color: #999999; }',
                    button_text_top_padding: 1,
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
            $common.hideProcessingOverlay();
            $('#imageUpload').modal('show');
        });
    };

    $page.changeUrlSNS = function (inUrl) {
        var inURL = $.url(inUrl),
            strHost = inURL.attr("host"),
            retValue = "";
        switch (strHost) {
            case "www.facebook.com":
                retValue = "images/icon-pcs-sns-fb.png";
                break;
            case "plus.google.com":
                retValue = "images/icon-pcs-sns-gplus.png";

                break;
            case "www.youtube.com":
                retValue = "images/icon-pcs-sns-youtube.png";

                break;
            case "twitter.com":
                retValue = "images/icon-pcs-sns-twitter.png";
                break;
        }
        return retValue;
    };


    $page.itemCountSNS = function () {
        var retValue = {
            delCount: $('#listsSNS .listItem.delItem').length,
            itemCount: $('#listsSNS .listItem').length - $('#listsSNS .listItem.delItem').length
        };
        return retValue;
    };

    $page.itemCountSugg = function () {
        var retValue = {
            delCount: $('#listsSuggested .listItem.delItem').length,
            itemCount: $('#listsSuggested .listItem').length - $('#listsSuggested .listItem.delItem').length
        };
        return retValue;
    };

    $page.chkFormSet = function() {
        if ($page.isMsoInfo && $page.isSNS && $page.isSuggested) {
            $('[data-toggle=popover]').popover({
                html: true,
                trigger: 'hover'
            })
            $common.hideProcessingOverlay();
        }
    };

    $page.inMsoinfo = function() {
        var retValue = {
            isChecked: false
        };

        retValue.title = $("#appTitle").val();
        retValue.logoUrl = $("#appLogo").attr("src");
        retValue.intro = $("#appIntro").val();
        retValue.shortIntro = $("#appSortIntro").val();
        retValue.slogan = $("#appSlogan").val();
        retValue.isChecked = true;
        return retValue;
    };

    $page.formSetMsoInfo = function () {
        nn.api('GET', cms.reapi('/api/mso/{msoId}', {
            msoId: cms.global.MSO
        }), null, function (msoInfo) {
            $("#appTitle").val(msoInfo.title);
            $("#appLogo").attr("src", msoInfo.logoUrl);
            $("#appIntro").val(msoInfo.intro);
            $("#appSortIntro").val(msoInfo.shortIntro);
            $("#appSlogan").val(msoInfo.slogan);

            $page.isMsoInfo = true;
            $page.chkFormSet();
        });
    };

    $page.formSetSNS = function () {
        nn.api('GET', cms.reapi('/api/mso/{msoId}/promotions', {
            msoId: cms.global.MSO
        }), {
            type: 1
        }, function (dataLists) {


            $('#tmpl-lists-SNS').tmpl(dataLists, null).appendTo('#listsSNS');

            dataLists[1].isSecII = true;
            nn.log(dataLists);
            nn.log("SNS count[" + dataLists.length + "]");
            $page.isSNS = true;
            $page.chkFormSet();

        });
    };

    $page.formSetSuggested = function () {
        nn.api('GET', cms.reapi('/api/mso/{msoId}/promotions', {
            msoId: cms.global.MSO
        }), {
            type: 2
        }, function(dataLists) {
            $.each(dataLists, function(eKey, eValue) {
                if("" == eValue.logoUrl){
                    eValue.logoUrl = $page.defImgSugg;
                }
                if (eKey < $page.limitSuggestedMin) {
                    eValue.isSecII = false;
                } else {
                    eValue.isSecII = true;
                }
                dataLists[eKey] = eValue;
            });

            $('#tmpl-lists-Suggested').tmpl(dataLists, null).appendTo('#listsSuggested');

            $page.isSuggested = true;
            $page.chkFormSet();
        });
    };

    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {
        nn.log({
            // NOTE: remember to change page-key to match file-name
            subject: 'CMS.PAGE.INITIALIZED: app-brand',
            options: options
        }, 'debug');

        $common.showProcessingOverlay();

        $('[data-toggle=popover]').popover({
            html: true,
            trigger: 'hover'

        });

        $page.formSetMsoInfo();
        $page.formSetSNS();
        $page.formSetSuggested();

    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('app-brand')));