/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, vars: true */
/*global $, nn, cms, SWFUpload */

(function ($page) {
    'use strict';

    var $common = cms.common;

    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {
        nn.log({
            // NOTE: remember to change page-key to match file-name
            subject: 'CMS.PAGE.INITIALIZED: app-brand',
            options: options
        }, 'debug');

        $('[data-toggle=popover]').popover({
            html: true,
            trigger: 'hover'

        })
        $('[data-toggle="tooltip"]').tooltip();

        nn.log("Page Id["+cms.global.PAGE_ID+"]");

        $common.showProcessingOverlay();
        setTimeout(function() {
            $common.hideProcessingOverlay();
            nn.log(cms.global.MSOINFO.isNotify);
        }, 2000);

    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('app-brand')));