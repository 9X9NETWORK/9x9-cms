/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, sub: true, vars: true */
/*global $, nn, cms */

(function ($page) {
    'use strict';

    var $common = cms.common;


    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {

        $common.showProcessingOverlay();

        nn.log({
            // NOTE: remember to change page-key to match file-name
            subject: 'CMS.PAGE.INITIALIZED: app-notification',
            options: options
        }, 'debug');

        var msoId = cms.global.MSO;

        if (msoId < 1) {
            location.href = "./";
        } else {

            // $page.drawPromotionCategory(msoId, 0);

            // $("#store-category .info").show();

            // $('#store-category-ul').sortable({
            //     cancel: '.empty',
            //     change: function (event, ui) {
            //         $page.setSaveButton("on");
            //     }
            // });

            $('#func-nav .langkey').each(function () {
                $(this).text(nn._([cms.global.PAGE_ID, 'func-nav', $(this).data('langkey')]));
            });
            $('#title-func .langkey').each(function () {
                $(this).text(nn._([cms.global.PAGE_ID, 'title-func', $(this).data('langkey')]));
            });
            $('.intro .langkey').each(function () {
                $(this).text(nn._([cms.global.PAGE_ID, 'title-func', $(this).data('langkey')]));
            });
            // $('#portal-add-layer .langkey').each(function () {
            //     $(this).text(nn._([cms.global.PAGE_ID, 'portal-add-layer', $(this).data('langkey')]));
            // });
            // $('#portal-add-layer .langkeyH').each(function () {
            //     $(this).html(nn._([cms.global.PAGE_ID, 'portal-add-layer', $(this).data('langkey')]));
            // });
            // $('#portal-add-layer .langkeyVal').each(function () {
            //     $(this).val(nn._([cms.global.PAGE_ID, 'channel-list', $(this).data('langkey')]));
            //     $(this).data("tmpIn", $(this).val());
            // });
            // $('#store-layer .langkey').each(function () {
            //     $(this).text(nn._([cms.global.PAGE_ID, 'store-layer', $(this).data('langkey')]));
            // });
            // $common.autoHeight();
            // $common.scrollbar("#store-constrain", "#store-list", "#store-slider");
            $('#content-main-wrap').perfectScrollbar({ marginTop: 25, marginBottom: 63 });

            $('#overlay-s').fadeOut("slow");
        }

    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('app-notification')));