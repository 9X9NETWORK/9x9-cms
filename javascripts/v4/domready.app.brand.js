/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, vars: true */
/*global $, nn, cms */

$(function () {
    'use strict';

    // NOTE: remember to change page-key to match file-name
    var $page = cms['app-brand'],
        $common = cms.common;

    $(document).on("click", "#funcCancel", function (event) {
        // for test
        var aa = $page.inSugg();

        nn.log(aa);
        // $('#imageUpload').modal('show');
    });

    $(document).on("keyup", ".wordsCount", function (event) {
        var thisObj = $(this),
            thisCount = $(this).parent().find("span.words-amount"),
            thisCountWord = 0;

        thisCount.val($.trim(thisCount.val()));
        thisCountWord = thisObj.val().length;
        // if (thisCountWord === 0) {
        //     thisObj.val(thisObj.attr("placeholder"));
        //     thisCountWord = thisObj.val().length;
        // }
        $(thisCount).text(thisCountWord);
    });

    $(document).on("change", ".wordsCount", function (event) {
        var thisObj = $(this),
            thisCount = $(this).parent().find("span.words-amount");
        // if(thisObj.val().length === 0){
        //     thisObj.val(thisObj.attr("placeholder"));
        //     thisObj.trigger( "keyup" );
        // }
        $('#msoInfo').addClass('has-change');
        $('body').addClass('has-change');
    });

    $(document).on("click", ".logoSNS", function (event) {
        var thisSNS = $(this).parent().parent().parent().parent(),
            snsId = thisSNS.data("meta"),
            parameter = {
                'prefix': 'app-brand-SNS-',
                'type': 'image',
                'size': 512000,
                'acl': 'public-read'
            };

        $common.showProcessingOverlay();

        $("#imageUpload").data("meta", thisSNS.attr("id"));
        $("#modalUpload").html("<p id='uploadThumbnail'></p>");

        $page.imageUpload("SNS", parameter);
    });


    $(document).on("change", ".inLinkSugg", function (event) {
        var thisSugg = $(this).parent().parent().parent().parent(),
            thisSuggStatus = $(this).parent(),
            thisSuggInput = $(this),
            urlParser = $common.playerUrlParserMso(thisSuggInput.val()),
            errMsg = nn._([cms.global.PAGE_ID, 'main-area', 'Please use your branding URL']) + ", ex. http://" + cms.global.MSOINFO.name + ".flipr.tv/view/p1234";

        thisSuggStatus.removeClass("has-error");
        thisSuggInput.removeClass("has-error");

        if (true === urlParser.isAllow) {
            if (urlParser.chId > 0) {
                nn.api('GET', cms.reapi('/api/channels/{channelId}', {
                    channelId: urlParser.chId
                }), null, function (channel) {
                    if ("" !== channel.imageUrl) {
                        thisSugg.find("img.logoUrl").attr("src", channel.imageUrl)
                    }
                    if ("" !== channel.name) {
                        thisSugg.find("input.inTitleSugg").val(channel.name)
                    }
                    $page.itemHasChange(thisSugg);
                    $("body").addClass("has-change");
                });
            } else {
                $page.itemHasChange(thisSugg);
                $("body").addClass("has-change");
            }

        } else {
            thisSuggStatus.addClass("has-error");
            thisSuggInput.addClass("has-error");
            $("#sysMessage div.modal-body").text(errMsg);
            $('#sysMessage').modal('show');
        }
    });


    $(document).on("change", ".inTitleSugg", function (event) {
        var thisSugg = $(this).parent().parent().parent().parent();

        $page.itemHasChange(thisSugg);
        $("body").addClass("has-change");
    });


    $(document).on("change", ".inTitleSNS", function (event) {
        var thisSNS = $(this).parent().parent().parent();

        $page.itemHasChange(thisSNS);
        $("body").addClass("has-change");
    });


    $(document).on("change", ".inUrlSNS", function (event) {
        var thisSNS = $(this).parent().parent().parent(),
            thisVal = $(this).val().trim(),
            msgBox = $(this).parent().parent().find("span.msgSNS"),
            logoBox = $(this).parent().find("a.logoSNS"),
            logoBoxSrc = logoBox.find("img.logoUrl").attr("src"),
            iconImg = "";

        $page.itemHasChange(thisSNS);
        $("body").addClass("has-change");

        $(this).val(thisVal);

        iconImg = $page.changeUrlSNS(thisVal);

        if (undefined !== logoBoxSrc && $.inArray(logoBoxSrc, $page.defImgsSNS) < 0 && iconImg === "") {
            iconImg = logoBoxSrc;
        }

        if (iconImg !== "") {
            logoBox.html("<img class='logoUrl btn-inner-image' src='" + iconImg + "'>");
            msgBox.addClass("hide");
        } else {
            logoBox.html("<span class='glyphicon glyphicon-cloud-upload'></span>");
            msgBox.removeClass("hide");
        }
    });

    $(document).on("click", ".delSNS", function (event) {
        var opObj = $(this).parent().parent().parent().parent(),
            itemCount = $page.itemCountSNS();

        if (opObj.hasClass("newItem")) {
            opObj.remove();
        } else {
            opObj.addClass("hide").addClass("delItem");
        }

        itemCount = $page.itemCountSNS();

        $page.addCheckSNS();

        $page.itemHasChange(opObj);
        $page.seqUpdateSNSText();
        $("body").addClass("has-change");
    });


    $(document).on("click", "#addNewSNS", function (event) {
        var emptyItem = {
            "id": new Date().getTime(),
            "type": 1,
            "seq": 0,
            "title": "",
            "link": "",
            "logoUrl": ""
        },
            itemCount = $page.itemCountSNS();

        if ($page.limitSNS > itemCount.itemCount) {
            $('#tmpl-lists-SNS').tmpl(emptyItem, null).appendTo('#listsSNS');

            itemCount = $page.itemCountSNS();
            $page.addCheckSNS();
            $('[data-toggle=popover]').popover({
                html: true,
                trigger: 'hover'

            });
        }
        $page.seqUpdateSNSText();
        $("body").addClass("has-change");
    });

    $(document).on("click", ".uploadSugg", function (event) {

        // $('#imageUpload').modal('show');
        // nn.log(".uploadSugg .uploadSugg . uploadSugg. uploadSugg. uploadSugg");

        var thisSNS = $(this).parent().parent(),
            snsId = thisSNS.data("meta"),
            parameter = {
                'prefix': 'app-brand-Suggested-',
                'type': 'image',
                'size': 5120000,
                'acl': 'public-read'
            };

        $common.showProcessingOverlay();

        $("#imageUpload").data("meta", thisSNS.attr("id"));
        $("#modalUpload").html("<p id='uploadThumbnail'></p>");

        $page.imageUpload("Sugg", parameter);
    });

    $(document).on("click", ".delSugg", function (event) {
        var opObj = $(this).parent().parent().parent(),
            itemCount = $page.itemCountSugg();

        if (opObj.hasClass("newItem")) {
            opObj.remove();
        } else {
            opObj.addClass("hide").addClass("delItem");
        }

        itemCount = $page.itemCountSNS();

        $page.addCheckSugg();

        $page.itemHasChange(opObj);
        $("body").addClass("has-change");
    });

    $(document).on("click", "#addNewSuggested", function (event) {
        var emptyItem = {
            "id": new Date().getTime(),
            "type": 2,
            "seq": 0,
            "title": "",
            "link": "",
            "logoUrl": $page.defImgSugg,
            "isSecII": false
        },
            itemCount = $('#listsSuggested .listItem').length;

        if (itemCount >= $page.limitSuggestedMin) {
            emptyItem.isSecII = true;
        }

        if ($page.limitSuggested > itemCount) {
            $('#tmpl-lists-Suggested').tmpl(emptyItem, null).appendTo('#listsSuggested');
            itemCount++;
            $page.addCheckSugg();
        }

        $("body").addClass("has-change");
    });

    $(document).on("click", "#btnSave", function (event) {
        var inMsoInfo = $page.inMsoinfo(),
            inSNS = $page.inSNS(),
            inSugg = $page.inSugg();

        $("#sbErrMsg").text("");

        if(!$page.isDoSuggested()){
           inSugg.isChecked = true; 
        }

        if (inMsoInfo.isChecked && inSNS.isChecked && inSugg.isChecked) {
            $common.showProcessingOverlay();

            nn.api('PUT', cms.reapi('/api/mso/{msoId}', {
                msoId: cms.global.MSO
            }), inMsoInfo, function (msoInfo) {
                $page.chkProcPromotion();
            });

            $page.saveItems = inSNS.items.length + inSugg.items.length;

            $(".listItem.delItem").remove();

            $.each(inSNS.items, function (eKey, eValue) {
                $page.procPromotion(eValue, $page.typeSNS);
            });

            $.each(inSugg.items, function (eKey, eValue) {
                $page.procPromotion(eValue, $page.typeSugg);
            });


        }else{
            // error
            $("#sbErrMsg").text(nn._([cms.global.PAGE_ID, 'main-area', 'Please fill in all required fields.']));
            // $('#sysMessage').modal('show');
        }

        return false;
    });


    function confirmExit() {
        if ($('body').hasClass('has-change')) {
            // Unsaved changes will be lost, are you sure you want to leave?
            return $('#unsave-prompt p.content').text();
        }
    }
    window.onbeforeunload = confirmExit;
});