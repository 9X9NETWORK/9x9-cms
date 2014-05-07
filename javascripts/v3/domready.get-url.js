/*jslint browser: true, unparam: true */
/*global $, nn, cms */

$(function () {
    'use strict';

    var $geturl = cms['get-url'];

    $(document).on('click', '.url', function (event) {
        var userUrlFile = cms.global.USER_URL.attr('file'),
            obj_get_url = null,
            strMetaCh = '',
            strMetaIn = '';

        if ('' === userUrlFile) {
            userUrlFile = 'index.html';
        }
        if (!$(this).hasClass('disable')) {
            $('.url').removeClass("selected");
            obj_get_url = $(this).parents('li').find('.get-url');
            $(this).addClass("selected");

            $('.get-url').hide();

            if (userUrlFile === 'index.html') {
                strMetaCh = obj_get_url.data('metach');
                strMetaIn = obj_get_url.data('metain');
                // sharing url
                if (strMetaIn !== 1) {
                    nn.api('GET', cms.reapi('/api/channels/{channelId}/autosharing/validBrands', {
                        channelId: strMetaCh
                    }), null, function (cBrands) {
                        var iBrandCount = cBrands.length,
                            iLoop = 0,
                            tmpBrand = [{
                                brand: ""
                            }];

                        for (iLoop = 0; iLoop < iBrandCount; iLoop++) {
                            if (cms.global.USER_DATA.msoName === cBrands[iLoop].brand) {
                                tmpBrand[0].brand = cms.global.USER_DATA.msoName;
                                break;
                            }

                        };

                        $('#tmpHtml').empty();
                        $('#get-url-tmpl').tmpl(tmpBrand).appendTo('#tmpHtml');

                        obj_get_url.children().remove();
                        obj_get_url.append($('#tmpHtml').html());
                        obj_get_url.find('input.srul-text').val($geturl.iniSharingList(obj_get_url, tmpBrand[0].brand));
                        obj_get_url.data('metain', 1);
                    });
                }
            } else {
                obj_get_url.find('input.srul-text').val($geturl.iniSharingList(obj_get_url, obj_get_url.find('input.srul-text').data("mso_name")));
            }
            $(this).parents('li').find('.tip').addClass("hide");
            obj_get_url.fadeIn(400);
        }
    });

    $(document).on('click', 'html', function (event) {
        $('.get-url').hide();
        $('.url').removeClass("selected");
        $(".tip").removeClass("hide");
    });

    $('#content-main-wrap').scroll(function () {
        $('.get-url').hide();
        $('.url').removeClass("selected");
        $(".tip").removeClass("hide");
    });

    $(document).on('click', '.get-url, .url', function (event) {
        event.stopPropagation();
    });

    /* Dropdown Gray */
    $(document).on('click', '.select-gray', function (event) {
        event.stopPropagation();
    });

    $(document).on('click', '.select-gray .select-btn', function (event) {
        $(this).parents('div').find('.select-dropdown').toggleClass('on');
        $(this).toggleClass('on');
    });

    $(document).on('click', '.select-gray .select-dropdown li', function (event) {
        var obj_get_url = $(this).parents('li').find('.get-url');
        $(this).parent('ul').parent('div').find('.select-txt-gray').text($(this).data('meta'));
        $(this).parent('ul').find('li').removeClass('on');
        $(this).addClass('on');
        obj_get_url.find('input.srul-text').val($geturl.iniSharingList(obj_get_url));
        $(this).parents('div').find('.select-dropdown').toggleClass('on');
        $(this).parents('div').find('.select-btn').toggleClass('on');
    });

    // NOTE: Keep Window Resize Event at the bottom of this file
    $(document).on('click', 'html, .get-url', function (event) {
        $('.select-gray .select-dropdown, .select-gray .select-btn').removeClass('on');
    });
});