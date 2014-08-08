/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, vars: true */
/*global $, nn, cms */

$(function () {
    'use strict';

    // NOTE: remember to change page-key to match file-name
    var $page = cms['app-brand'],
        $common = cms.common;

    $(document).on("change", ".inUrlSNS", function (event) {
        var thisVal = $(this).val().trim(),
            msgBox = $(this).parent().parent().find("span.msgSNS");

        $(this).val(thisVal);
        if (thisVal !== "") {
            msgBox.addClass("hide");
        } else {
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
        }
    });

    $(document).on("click", "#addNewSuggested", function(event) {
        var emptyItem = {
            "id": new Date().getTime(),
            "type": 2,
            "seq": 0,
            "title": "",
            "link": "",
            "logoUrl": ""
        },
            itemCount = $('#listsSuggested .listItem').length;


        if ($page.limitSuggested > itemCount) {
            $('#tmpl-lists-Suggested').tmpl(emptyItem, null).appendTo('#listsSuggested');
            itemCount ++;
            if(itemCount >= $page.limitSuggested){
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

        nn.log(inMsoInfo);
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