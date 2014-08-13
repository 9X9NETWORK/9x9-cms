/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, vars: true */
/*global $, nn, cms */

$(function () {
    'use strict';

    // NOTE: remember to change page-key to match file-name
    var $page = cms['app-brand'],
        $common = cms.common;

    $(document).on("click", "#funcCancel", function (event) {
        
        var aa = $page.inSugg();

        nn.log(aa);
        // $('#imageUpload').modal('show');
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


    $(document).on("change", ".inLinkSugg, .inTitleSugg", function (event) {
        var thisSugg = $(this).parent().parent().parent().parent();

        $page.itemHasChange(thisSugg);
        $("body").addClass("has-change");
    });


    $(document).on("change", ".inUrlSNS", function (event) {
        var thisSNS = $(this).parent().parent().parent(),
            thisVal = $(this).val().trim(),
            msgBox = $(this).parent().parent().find("span.msgSNS"),
            logoBox = $(this).parent().find("a.logoSNS"),
            iconImg = "";

        $page.itemHasChange(thisSNS);
        $("body").addClass("has-change");

        $(this).val(thisVal);
        iconImg = $page.changeUrlSNS(thisVal);
        if (iconImg !== "") {
            logoBox.html("<img class='logoUrl' src='" + iconImg + "' width='30px' height-'30px' >");
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

        if (itemCount >= 4) {
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


        if (inMsoInfo.isChecked && inSNS.isChecked && inSugg.isChecked) {
            $common.showProcessingOverlay();
            nn.api('PUT', cms.reapi('/api/mso/{msoId}', {
                msoId: cms.global.MSO
            }), inMsoInfo, function(msoInfo) {
                $common.hideProcessingOverlay();
            });

            $page.saveItems = inSNS.items.length + inSugg.items.length;

            $(".listItem.delItem").remove();

            nn.api('PUT', cms.reapi('/api/mso/{msoId}', {
                msoId: cms.global.MSO
            }), inMsoInfo, function(msoInfo) {
                $common.hideProcessingOverlay();
            });

            $.each(inSNS.items, function (eKey, eValue) {
                $page.procPromotion(eValue, $page.typeSNS);
            });

            $.each(inSugg.items, function (eKey, eValue) {
                $page.procPromotion(eValue, $page.typeSugg);
            });


        }else{
            nn.log(inMsoInfo);
            nn.log(inSNS);
            nn.log(inSugg);
            $("#sysMessage div.modal-body").text("錯誤!!");
            $('#sysMessage').modal('show');
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