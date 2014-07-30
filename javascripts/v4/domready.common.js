/*jslint browser: true, unparam: true */
/*global $, nn, cms */

$(function () {
    'use strict';

    var $common = cms.common;

    //-------------------------------------------------------------------------
    // Setup Global Variable
    //-------------------------------------------------------------------------

    cms.global.USER_URL = $.url();

    //-------------------------------------------------------------------------
    // Page Entry Point
    //-------------------------------------------------------------------------

    nn.api('GET', cms.reapi('/api/login'), function (user) {
        var tmpUrl = $.url(location.href.replace('@', '%40')),
            tmpPriv = {},
            isStoreLangKey = true,
            msoName = "flipr",
            loginUrl = "https://" + tmpUrl.attr('host') + '/cms/signin.html',
            homeUrl = "http://" + tmpUrl.attr('host') + '/cms/index.html';

        if (tmpUrl.attr('host') === "localhost") {
            loginUrl = "http://" + tmpUrl.attr('host') + '/signin.html',
            homeUrl = "http://" + tmpUrl.attr('host') + '/index.html';
        }

        if ('signin.html' === tmpUrl.attr('file') && 'http' === tmpUrl.attr('protocol') && tmpUrl.attr('host') !== "localhost") {
            location.href = loginUrl;
        } else if ('https' === tmpUrl.attr('protocol') && 'signin.html' !== tmpUrl.attr('file')) {
            location.href = "http://" + tmpUrl.attr('host') + tmpUrl.attr('directory');
        }

        if (null === user || "null" === user || !user || !user.id) {
            if ('signin.html' !== tmpUrl.attr('file')) {
                location.href = loginUrl;
            } else {
                $common.setupLanguagePage();
            }
        } else {
            if ('signin.html' === tmpUrl.attr('file')) {
                if (cms.config.CMS_ENV === 'prototype') {
                    $common.setupLanguagePage();
                } else {
                    location.href = homeUrl;
                }
            } else {
                tmpPriv = $common.privParser(user.priv);
                cms.global.USER_PRIV = tmpPriv;
                cms.global.MSO = 0;
                if (tmpPriv.isPCS && user.msoId > 0) {
                    cms.global.MSO = user.msoId;
                    if(cms.global.MSO === 12){
                        cms.global.IS_REMARK = false;
                    }
                    if (-1 !== $.inArray(tmpUrl.attr('file'), ['store-manage.html', 'store-promotion.html', 'portal-manage.html', 'brand-setting.html', 'app-notification.html'])) {
                        // set mso info
                        nn.api('GET', cms.reapi('/api/mso/{msoId}', {
                            msoId: cms.global.MSO
                        }), null, function (msoInfo) {
                            cms.global.MSOINFO = msoInfo;
                            cms.global.MSOINFO.isNotify = false;
                            if (true === msoInfo.apnsEnabled || true === msoInfo.gcmEnabled) {
                                cms.global.MSOINFO.isNotify = true;
                            } else {
                                if ('app-notification.html' === tmpUrl.attr('file')) {
                                    location.href = "portal-manage.html";
                                    return false;
                                }
                                $("#menuNotify").attr("href", "#").attr("onClick", "return false;").addClass("disable");
                            }
                        });
                    }
                }

                msoName = user.msoName || "flipr";
                cms.global.SHARE_URL_BASE = $common.shareUrlBaseParser(location.href, msoName);

                if (cms.global.MSO > 0) {
                    $('#my-portal').removeClass('hide');
                } else {
                    $('#my-portal').remove();
                }
                $common.setupLanguageAndRenderPage(user, isStoreLangKey);
            }
        }
    });

    //-------------------------------------------------------------------------
    // Common DOM Ready
    //-------------------------------------------------------------------------

    // HACK: for Mac style
    if (navigator.userAgent.indexOf('Mac') > 0) {
        $('body').addClass('mac');
    }

    // header link - logout
    $('#profile-logout').click(function () {
        if (!$('body').hasClass('has-change')) {
            nn.api('DELETE', cms.reapi('/api/login'), null, function (data) {
                location.href = 'signin.html';
            });
            return false;
        }
    });

});