/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, vars: true */
/*global $, nn, cms, SWFUpload */

(function ($page) {
    'use strict';

    var $common = cms.common;
    $page.supportedRegion = "";
    $page.isMsoInfo = false;
    $page.isSNS = false;
    $page.isSuggested = false;
    $page.limitSNS = 5;
    $page.limitSuggestedMin = 4;
    $page.limitSuggested = 6;
    $page.defImgSNS = "http://fakeimg.pl/100/";
    $page.defImgSugg = "http://fakeimg.pl/200/";
    $page.saveItems = 0;
    $page.typeSNS = 1;
    $page.typeSugg = 2;
    $page.defImgsSNS = [
        "/cms/images/icon-pcs-sns-fb.png",
        "/cms/images/icon-pcs-sns-gplus.png",
        "/cms/images/icon-pcs-sns-youtube.png",
        "/cms/images/icon-pcs-sns-twitter.png"];

    $page.isDoSuggested = function() {
        var retValue = false;
        if ($page.supportedRegion === "zh") {
            retValue = true;
        }
        // allow every region use this feature
        retValue = true;
        return retValue;
    };

    $page.procPromotionAdd = function (inObj) {
        var strPrefix = "",
            strNewId = "",
            theObj;

        if ($page.typeSNS == inObj.type) {
            strPrefix = "#listsSNS div.listItem";
            strNewId = "SNS_" + inObj.id;
        } else {
            strPrefix = "#listsSuggested div.listItem";
            strNewId = "Sugg_" + inObj.id;
        }

        $(strPrefix).each(function() {
            theObj = $(this);

            if (theObj.data("seq") == inObj.seq) {
                theObj.removeClass("newItem");

                theObj.attr("id", strNewId);
                theObj.data("meta", inObj.id);
            }
        });

    };

    $page.chkProcPromotion = function () {
        if ($page.saveItems == 0) {
            $(".has-change").removeClass("has-change");
            $common.hideProcessingOverlay();
        }
    };


    $page.onImgLoad = function (selector, callback) {
        $(selector).each(function() {
            if (this.complete || /*for IE 10-*/ $(this).height() > 0) {
                callback.apply(this);
            } else {
                $(this).on('load', function() {
                    callback.apply(this);
                });
            }
        });
    };


    $page.procPromotion = function (opObj, inType) {
        var act = opObj.act,
            actId = opObj.id,
            objParameters = {
                link: opObj.link,
                title: "",
                logoUrl: opObj.logoUrl,
                type: inType,
                seq: opObj.seq
            };
        // sns add title too
        if(inType === $page.typeSugg || inType === $page.typeSNS){
            objParameters.title = opObj.title;
        }

        switch (act) {
            case "POST":
                nn.api('POST', cms.reapi('/api/mso/{msoId}/promotions', {
                    msoId: cms.global.MSO
                }), objParameters, function(dataInfo) {
                    nn.log(dataInfo);
                    $page.procPromotionAdd(dataInfo);

                    $page.saveItems --;
                    $page.chkProcPromotion();
                });
                break;

            case "DELETE":
                nn.api('DELETE', cms.reapi('/api/mso_promotions/{id}', {
                    id: actId
                }), null, function(dataInfo) {
                    $page.saveItems --;
                    $page.chkProcPromotion();
                });
                break;
            case "PUT":
                nn.api('PUT', cms.reapi('/api/mso_promotions/{id}', {
                    id: actId
                }), objParameters, function(dataInfo) {
                    $page.saveItems --;
                    $page.chkProcPromotion();

                });
                break;

        }
    };

    $page.itemHasChange = function (opObj) {
        if(!opObj.hasClass("newItem")){
            opObj.addClass("has-change");
        }
    };

    $page.imageUpload = function (inType, parameter) {
 
        var thisId = $("#imageUpload").data("meta"),
            loadingImg = "images/loading.gif";

        nn.api('GET', cms.reapi('/api/s3/attributes'), parameter, function (s3attr) {
            var timestamp = (new Date()).getTime(),
                handlerUploadProgress = function (file, completed, total) {
                    var thisLogUrl = $("#" + thisId).find("img.logoUrl");
                    this.setButtonText('<span class="uploadstyle">' + nn._(['upload', 'Uploading...']) + '</span>');
                    if(thisLogUrl.attr("src")!= loadingImg){
                        thisLogUrl.data("oldLogoUrl", thisLogUrl.attr("src"));
                        thisLogUrl.attr("src",loadingImg);
                    }
                },
                handlerUploadSuccess = function (file, serverData, recievedResponse) {
                    var thisImg =  $("#" + thisId).find("img.logoUrl");
                    if(thisImg.length ===0 && inType ==="SNS"){
                        $("#" + thisId).find("a.logoSNS").html('<img src="'+loadingImg+'" class="logoUrl btn-inner-image">');
                    }

                    this.setButtonText('<span class="uploadstyle">' + nn._(['upload', 'Upload']) + '</span>');
                    if (!file.type) {
                        file.type = nn.getFileTypeByName(file.name);
                    }

                    this.setButtonDisabled(false);
                    // enable upload button again
                    var url = 'http://' + s3attr.bucket + '.s3.amazonaws.com/' + parameter.prefix + timestamp + '-' + file.size + file.type.toLowerCase();
                    $('body').addClass("has-change");
                    $("#" + thisId).addClass("has-change");
                    $("#" + thisId).find("img.logoUrl").attr("src", url).data("oldLogoUrl", "");
                    setTimeout(function() {
                        $('#imageUpload').modal('hide');
                    }, 500);
                },
                handlerUploadError = function (file, code, message) {
                    var thisLogUrl = $("#" + thisId).find("img.logoUrl"); 

                    this.setButtonText('<span class="uploadstyle">' + nn._(['upload', 'Upload']) + '</span>');
                    this.setButtonDisabled(false);
                    if("" !== thisLogUrl.data("oldLogoUrl")){
                        thisLogUrl.attr("src", thisLogUrl.data("oldLogoUrl")).data("oldLogoUrl", "");
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
                retValue = $page.defImgsSNS[0];// "images/icon-pcs-sns-fb.png";
                break;
            case "plus.google.com":
                retValue = $page.defImgsSNS[1];// "images/icon-pcs-sns-gplus.png";

                break;
            case "www.youtube.com":
                retValue = $page.defImgsSNS[2];// "images/icon-pcs-sns-youtube.png";

                break;
            case "twitter.com":
                retValue = $page.defImgsSNS[3];// "images/icon-pcs-sns-twitter.png";
                break;
        }
        return retValue;
    };

    $page.addCheckSNS = function () {
        var itemCount = $page.itemCountSNS();

        if (itemCount.itemCount >= $page.limitSNS) {
            $("#addNewSNS").addClass("hide");
        } else {
            $("#addNewSNS").removeClass("hide");
        }
    };

    $page.itemCountSNS = function () {
        var retValue = {
            delCount: $('#listsSNS .listItem.delItem').length,
            itemCount: $('#listsSNS .listItem').length - $('#listsSNS .listItem.delItem').length
        };
        return retValue;
    };

    $page.addCheckSugg = function () {
        var itemCount = $page.itemCountSugg();

        if (itemCount.itemCount >= $page.limitSuggested) {
            $("#addNewSuggested").addClass("hide");
        } else {
            $("#addNewSuggested").removeClass("hide");
        }
    };

    $page.itemCountSugg = function () {
        var retValue = {
            delCount: $('#listsSuggested .listItem.delItem').length,
            itemCount: $('#listsSuggested .listItem').length - $('#listsSuggested .listItem.delItem').length
        };
        return retValue;
    };

    $page.chkFormSet = function () {
        if ($page.isMsoInfo && $page.isSNS && $page.isSuggested) {
            $('[data-toggle=popover]').popover({
                html: true,
                trigger: 'hover'
            });
            $('[data-toggle="tooltip"]').tooltip();
            $common.hideProcessingOverlay();
        }
    };

    $page.seqUpdateSugg = function () {
        var opObj, tmpLink, tmpTitle, tmpLogoUrl, countI = 0,
            countTmp = 0,
            tmpMin = $page.limitSuggestedMin;

        $("#listsSuggested  div.listItem").each(function () {
            opObj = $(this);
            tmpLink = opObj.find("input.inLinkSugg").val();
            tmpTitle = opObj.find("input.inTitleSugg").val();
            tmpLogoUrl = opObj.find("img.logoUrl").attr("src");

            countTmp = countI + 1;

            if (countTmp > tmpMin && opObj.hasClass("newItem") && "" === tmpLink && "" === tmpTitle) {
                opObj.remove();
                $page.addCheckSugg();
           } else {
                // skip delete item
                if (!opObj.hasClass("delItem")) {
                    countI++;
                    // seq update
                    if (countI != opObj.data("seq")) {
                        opObj.data("seq", countI);
                        $page.itemHasChange(opObj);
                        $("body").addClass("has-change");
                    }
                }
            }
        });
    };

    $page.inSugg = function() {
        var retValue = {
            isChecked: false,
            errCount: 0,
            items: []
        }, tmpItem, opObj, countI = 0,
            countTmp = 0,
            isDel = false,
            tmpMin = $page.limitSuggestedMin;

        $page.seqUpdateSugg();

        $("#listsSuggested  div.listItem").each(function () {
            opObj = $(this);
            countI ++;
            isDel = false;
            tmpItem = {
                id: 0,
                seq: 0,
                link: "",
                title: "",
                logoUrl: "",
                act: ""
            };

            countTmp = countI + 1;

            tmpItem.link = opObj.find("input.inLinkSugg").val();
            tmpItem.title = opObj.find("input.inTitleSugg").val();
            tmpItem.logoUrl = opObj.find("img.logoUrl").attr("src");

            if (!opObj.hasClass("delItem") && ("" === tmpItem.link || "" === tmpItem.title)) {
                retValue.errCount++;
            } else {
                tmpItem.id = opObj.data("meta");
                tmpItem.seq = opObj.data("seq");

                if (opObj.hasClass("delItem")) {
                    tmpItem.act = "DELETE";
                } else if (opObj.hasClass("newItem")) {
                    tmpItem.act = "POST";
                } else if (opObj.hasClass("has-change")) {
                    tmpItem.act = "PUT";
                }
                if ("" !== tmpItem.act) {
                    countI ++;
                    retValue.items.push(tmpItem);
                }
            }

        });

        if (0 === retValue.errCount) {
            retValue.isChecked = true;
        }
        return retValue;
    };

    $page.seqUpdateSNSText = function () {
        var opObj, tmpLabel, tmpLogoUrl, countI = 0;

        $("#listsSNS  div.listItem").each(function () {
            opObj = $(this);
            tmpLabel = opObj.find("label.SNS-Seq");
            countI++;
            tmpLabel.text(countI + " .");
        });
    };

    $page.seqUpdateSNS = function () {
        var opObj, tmpLink, tmpLogoUrl, tmpTitle, countI = 0;

        $("#listsSNS  div.listItem").each(function () {
            opObj = $(this);
            tmpLink = opObj.find("input.inUrlSNS").val();
            tmpTitle = opObj.find("input.inTitleSNS").val();
            tmpLogoUrl = opObj.find("img.logoUrl").attr("src");

            if (opObj.hasClass("newItem") && undefined === tmpLogoUrl && "" === tmpLink) {
                opObj.remove();
                $page.addCheckSNS();
            } else {
                // skip delete item
                if (!opObj.hasClass("delItem")) {
                    countI++;
                    // seq update
                    if (countI != opObj.data("seq")) {
                        opObj.data("seq", countI);

                        $page.itemHasChange(opObj);
                        $("body").addClass("has-change");
                    }
                }
            }
        });
    };

    $page.inSNS = function() {
        var retValue = {
            isChecked: false,
            errCount: 0,
            items: []
        }, tmpItem, opObj, countI = 0,
            isDel = false;

        $page.seqUpdateSNS();

        $("#listsSNS  div.listItem").each(function () {
            opObj = $(this);
            countI ++;
            isDel = false;
            tmpItem = {
                id: 0,
                seq: 0,
                link: "",
                logoUrl: "",
                act: ""
            };

            tmpItem.link = opObj.find("input.inUrlSNS").val();
            tmpItem.title = opObj.find("input.inTitleSNS").val();
            tmpItem.logoUrl = opObj.find("img.logoUrl").attr("src");

            if (!opObj.hasClass("delItem") && undefined === tmpItem.logoUrl || "" === tmpItem.link) {
                retValue.errCount++;
                // retValue.items.push(tmpItem);

            } else {
                tmpItem.id = opObj.data("meta");
                tmpItem.seq = opObj.data("seq");

                if (opObj.hasClass("delItem")) {
                    tmpItem.act = "DELETE";
                } else if (opObj.hasClass("newItem")) {
                    tmpItem.act = "POST";
                } else if (opObj.hasClass("has-change")) {
                    tmpItem.act = "PUT";
                }
                if ("" !== tmpItem.act) {
                    retValue.items.push(tmpItem);
                }
            }

        });

        if (0 === retValue.errCount) {
            retValue.isChecked = true;
        }
        return retValue;
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
        retValue.iosUrl = $("#iosUrl").val();
        retValue.androidUrl = $("#androidUrl").val();
        retValue.isChecked = true;
        return retValue;
    };

    $page.defaultMsoInfo = function () {
        var opObj, tmpString = "";

        opObj = $("#appIntro");
        tmpString = opObj.attr("placeholder");
        if ("" === opObj.val()) {
            opObj.val(tmpString);
        }

        opObj = $("#appSortIntro");
        tmpString = opObj.attr("placeholder");
        if ("" === opObj.val()) {
            opObj.val(tmpString);
        }

        opObj = $("#appSlogan");
        tmpString = opObj.attr("placeholder");
        if ("" === opObj.val()) {
            opObj.val(tmpString);
        }
    };

    $page.formSetMsoInfo = function () {
        nn.api('GET', cms.reapi('/api/mso/{msoId}', {
            msoId: cms.global.MSO
        }), null, function (msoInfo) {
            $page.supportedRegion = msoInfo.supportedRegion;
            $page.formSetSuggested();

            $("#appTitle").val(msoInfo.title);
            $("#appLogo").attr("src", msoInfo.logoUrl);

            $("#appIntro").val($.trim(msoInfo.intro));
            $("#appSortIntro").val($.trim(msoInfo.shortIntro));
            $("#appSlogan").val($.trim(msoInfo.slogan));

            $("#iosUrl").val($.trim(msoInfo.iosUrl));
            $("#androidUrl").val($.trim(msoInfo.androidUrl));

            $page.defaultMsoInfo();

            $page.isMsoInfo = true;
            $page.chkFormSet();
            $(".wordsCount").keyup();
        });
    };

    $page.formSetSNS = function () {
        nn.api('GET', cms.reapi('/api/mso/{msoId}/promotions', {
            msoId: cms.global.MSO
        }), {
            type: 1
        }, function (dataLists) {

            $('#tmpl-lists-SNS').tmpl(dataLists, null).appendTo('#listsSNS');
            $page.addCheckSNS();
            $page.isSNS = true;
            $page.chkFormSet();
            $( "#addNewSNS" ).trigger( "click" );

        });
    };

    $page.formSetSuggested = function() {
        if (!$page.isDoSuggested()) {
            $page.isSuggested = true;
        } else {
            nn.api('GET', cms.reapi('/api/mso/{msoId}/promotions', {
                msoId: cms.global.MSO
            }), {
                type: 2
            }, function (dataLists) {
                var newSugg = $page.limitSuggestedMin - dataLists.length;
                $.each(dataLists, function(eKey, eValue) {
                    if ("" == eValue.logoUrl) {
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

                $page.addCheckSugg();
                $page.isSuggested = true;
                $page.chkFormSet();

                if (newSugg > 0) {
                    for (var i = 1; i <= newSugg; i++) {
                        $("#addNewSuggested").trigger("click");
                    };
                }
            });
            $(".formSugg").removeClass("hide");
        }
    };

    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {
        nn.log({
            // NOTE: remember to change page-key to match file-name
            subject: 'CMS.PAGE.INITIALIZED: app-brand',
            options: options
        }, 'debug');

        $common.showProcessingOverlay();

        // placeholder
        $(".langkeyPH").each(function() {
            var oriString = $(this).attr("placeholder"), 
            transString = nn._([cms.global.PAGE_ID, 'main-area', oriString]);
            $(this).data('langkey', oriString );
            $(this).attr('placeholder', transString);
        });

        $page.formSetMsoInfo();
        $page.formSetSNS();
        // $page.formSetSuggested();

        $page.onImgLoad($('img'), function() {
            $(this).hide().fadeIn(700);
        });
    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('app-brand')));
