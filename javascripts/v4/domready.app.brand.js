/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, vars: true */
/*global $, nn, cms */

$(function () {
    'use strict';

    // NOTE: remember to change page-key to match file-name
    var $page = cms['app-brand'],
        $common = cms.common;

    $(document).on("click", "#funcCancel", function (event) {
        

        $('#imageUpload').modal('show');
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

        thisSugg.addClass("has-change");
        $("body").addClass("has-change");
    });


    $(document).on("change", ".inUrlSNS", function (event) {
        var thisSNS = $(this).parent().parent().parent(),
            thisVal = $(this).val().trim(),
            msgBox = $(this).parent().parent().find("span.msgSNS"),
            logoBox = $(this).parent().find("a.logoSNS"),
            iconImg = "";

        thisSNS.addClass("has-change");
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

        if (itemCount.itemCount >= $page.limitSNS) {
            $("#addNewSNS").addClass("hide");
        } else {
            $("#addNewSNS").removeClass("hide");
        }
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
            if (itemCount.itemCount >= $page.limitSNS) {
                $("#addNewSNS").addClass("hide");
            }
            $('[data-toggle=popover]').popover({
                html: true,
                trigger: 'hover'

            });
        }
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

        if (itemCount.itemCount >= $page.limitSuggested) {
            $("#addNewSuggested").addClass("hide");
        } else {
            $("#addNewSuggested").removeClass("hide");
        }
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
            if (itemCount >= $page.limitSuggested) {
                $("#addNewSuggested").addClass("hide");
            }
        }
    });

    $(document).on("click", "#btnSave", function(event) {
        var inMsoInfo = $page.inMsoinfo();


        if (inMsoInfo.isChecked) {
            $common.showProcessingOverlay();
            nn.api('PUT', cms.reapi('/api/mso/{msoId}', {
                msoId: cms.global.MSO
            }), inMsoInfo, function (msoInfo) {
                $common.hideProcessingOverlay();
            });
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