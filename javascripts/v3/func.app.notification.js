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
            $('#content-main-wrap .constrain').html('');
            $('#notify-comm-tmpl').tmpl().appendTo('#content-main-wrap .constrain');
            $('#notify-intro-image-tmpl').tmpl().appendTo('#content-main-wrap .constrain');

            $('#func-nav .langkey').each(function () {
                $(this).text(nn._([cms.global.PAGE_ID, 'func-nav', $(this).data('langkey')]));
            });
            $('#title-func .langkey').each(function () {
                $(this).text(nn._([cms.global.PAGE_ID, 'title-func', $(this).data('langkey')]));
            });
            $('.intro .langkey').each(function () {
                $(this).text(nn._([cms.global.PAGE_ID, 'title-func', $(this).data('langkey')]));
            });

            $('#content-main-wrap').perfectScrollbar({ marginTop: 25, marginBottom: 63 });

            $('#overlay-s').fadeOut("slow");
        }

    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('app-notification')));