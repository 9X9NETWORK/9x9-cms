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

    $page.itemCountSNS = function () {
        var retValue = {
            delCount: $('#listsSNS .listItem.delItem').length,
            itemCount: $('#listsSNS .listItem').length - $('#listsSNS .listItem.delItem').length
        };

        // retValue.itemCount = retValue.itemCount - retValue.delCount;

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
        }, function (dataLists) {
            nn.log("SNS count["+dataLists.length+"]");


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