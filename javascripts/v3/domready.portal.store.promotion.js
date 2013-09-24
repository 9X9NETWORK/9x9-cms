/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, sub: true, vars: true */
/*global $, nn, cms */

$(function () {
    'use strict';

    // NOTE: remember to change page-key to match file-name
    var $page = cms['store-promotion'],
        $common = cms.common;

    // add promotion category
    $(document).on("click", ".addPromotionCategory", function(event) {
        // 用到
        var overLayInfo = {
            actType: "add",
            overLayTitle: nn._([cms.global.PAGE_ID, 'overlay', "Add Category"]),
            actButton: nn._([cms.global.PAGE_ID, 'overlay', "Add Category"]),
            valEnName: "",
            valZhName: ""
        };

        if ($(this).hasClass("disable")) {
            $('#change-category-overlay .overlay-container').empty();
            $('#change-category-overlay-tmpl').tmpl(overLayInfo).appendTo('#change-category-overlay .overlay-container');

            $.blockUI({
                message: $('#change-category-overlay')
            });
        }
        return false;
    });

    // add promotion category - cancel button
    $(document).on("click", "#change-category-overlay .btn-close, #change-category-overlay .btn-cancel", function(event) {
        // 用到
        // add promotion category
        // $('#change-category-overlay').fadeOut("slow");
        $.unblockUI();
        return false;
    });

    // edit promotion category - show prompt window
    $(document).on("click", ".catLi .btn-edit", function(event) {
        // 用到
        // var thisLi = $(this).parent().parent("li").data("meta");
        var thisLi = $(this).parent("li"),
            overLayInfo = {
                actType: "edit",
                catId:  parseInt(thisLi.attr("id").replace("catLi_", ""), 10),
                overLayTitle: nn._([cms.global.PAGE_ID, 'overlay', "Edit Category"]),
                actButton: nn._([cms.global.PAGE_ID, 'overlay', "Edit Category"]),
                valEnName: $(thisLi).data("enname"),
                valZhName: $(thisLi).data("zhname")
            };

        $('#change-category-overlay .overlay-container').empty();
        $('#change-category-overlay-tmpl').tmpl(overLayInfo).appendTo('#change-category-overlay .overlay-container');
        $.blockUI({
            message: $('#change-category-overlay')
        });
        return false;
    });


    // add / edit promotion category - action button
    $(document).on("click", "#change-category-overlay .btn-chg-category", function(event) {
        // 用到
        var actType = $(this).data("acttype"),
            inEnName = $("#proCatEnName").val(),
            inZhName = $("#proCatZhName").val(),
            catId = $(this).data("catid");

        switch (actType) {
            case "add":
                // add promotion category
                if ("" !== inEnName && "" !== inZhName) {
                    $('#store-category-li-tmpl').tmpl({
                        enName: inEnName,
                        zhName: inZhName,
                        id: new Date().getTime()
                    }, {
                        isNew: "new"
                    }).appendTo('#store-category-ul');

                    $('#store-category-ul li').show();

                    $('body').addClass('has-change');
                    $("#set-save p.btns").removeClass("disable");
                }
                break;

            case "edit":
                // edit promotion category
            if ("" !== inEnName && "" !== inZhName && catId > 0) {
                var actLi = $("#catLi_" + catId),
                    oriEnName = actLi.data("enname"),
                    oriZhName = actLi.data("zhname");

                if (oriEnName !== inEnName || oriZhName != inZhName) {
                    actLi.data("enname", inEnName);
                    actLi.data("zhname", inZhName);

                    actLi.find("span a").text(inZhName);
                    actLi.addClass('has-change');
                }


            }
                break;
        }
        // add promotion category
        // $('#change-category-overlay').fadeOut("slow");
        // alert(actType);
        $.unblockUI();
        return false;
    });

    // delete promotion category - show prompt window
    $(document).on("click", ".catLi .btn-remove", function(event) {
        // 用到
        var thisLi = $(this).parent("li"),
            catId = parseInt(thisLi.attr("id").replace("catLi_", ""), 10);

        $('#confirm-prompt').data("actli", catId);

        $('#confirm-prompt .content').text(nn._([cms.global.PAGE_ID, 'overlay', "Are you sure to remove this promotion Category?"]));
        $.blockUI({
            message: $('#confirm-prompt')
        });

        return false;
    });

    // delete promotion category - confirm to delete
    $('#confirm-prompt .btn-leave').click(function(event) {
        // 用到
        var catId = $('#confirm-prompt').data("actli"),
            thisLi = $("#catLi_" + catId),
            isNew = thisLi.hasClass("newCat"),
            isOn = thisLi.hasClass("on");

        // when it's a new promotion category leave it, don't push into delete list , because it didn't real exist
        if (catId > 0 && !isNew) {
            $page.promoCatRemoveList.push(catId);
            thisLi.remove();
            $('body').addClass('has-change');
            $("#set-save p.btns").removeClass("disable");

            $.unblockUI();
        }
        // nn.log("cat id : [" + catId + "]" + "  ******  isNew  : [" + isNew + "]" + "  ******  isOn  : [" + isOn + "]");
        return false;
    });


    // promotion category save funtion
    // todo: 
    // done 1. process promotion category 
    // done   a. each li to generate update and new promotion category infomation
    // done   b. $page.promoCatRemoveList to generate delete promotion category information 
    // 2. process promotion category channels
    $(document).on("click", "#set-save", function(event) {
        // 用到
        if (!$("#set-save p.btns").hasClass("disable")) {
            var msoId = cms.global.MSO,
                catLiLists = $("#store-category-ul li.catLi"),
                tmpSeq = 0,
                tmpHasChange = false,
                theSeq = 0,
                procList = [],
                tmpItem = {},
                stSwitchOn = !$(".switch-on").hasClass("hide"),
                stSwitchOff = !$(".switch-off").hasClass("hide"),
                catMinus = $("#store-category-ul li.minus"),
                catMinusList = [],
                tmpMsoAdd = cms.global.USER_DATA["msoAdd"],
                tmpMsoRemove = cms.global.USER_DATA["msoRemove"];

            $common.showProcessingOverlay();

            $.each(catLiLists, function(eKey, eValue) {
                tmpItem = {};
                tmpHasChange = false;
                theSeq = eKey + 1;
                tmpSeq = $(eValue).data("seq");
                tmpHasChange = $(eValue).hasClass("has-change");


                if (theSeq != tmpSeq || tmpHasChange) {

                    tmpItem["msoId"] = msoId;
                    tmpItem["seq"] = theSeq;
                    tmpItem["zhName"] = $(eValue).data("zhname");
                    tmpItem["enName"] = $(eValue).data("enname");
                    tmpItem["name"] = $(eValue).data("zhname");
                    tmpItem["id"] = $(eValue).data("meta");
                    if ($(eValue).hasClass("newCat")) {
                        tmpItem["id"] = 0;
                    }
                    procList.push(tmpItem);
                }

            });


            procPromotionCat(procList)
                .then(procChannels)
                .then(procEnd);


        }

        function procPromotionCat(procList) {
            var deferred = $.Deferred(),
                tmpItem,
                catDelLists = $page.promoCatRemoveList;

            $.each(procList, function(eKey, eValue) {
                if (eValue.id > 0) {
                    // promotion category update
                    nn.api('PUT', cms.reapi('/api/category/{categoryId}', {
                        categoryId: eValue.id
                    }), {
                        seq: eValue.seq,
                        enName: eValue.enName,
                        zhName: eValue.zhName
                    }, null);
                } else {
                    // promotion category add
                    nn.api('POST', cms.reapi('/api/mso/{msoId}/categories', {
                        msoId: eValue.msoId
                    }), {
                        name: eValue.name,
                        seq: eValue.seq,
                        enName: eValue.enName,
                        zhName: eValue.zhName
                    }, null);
                }
            });

            // promotion category delete
            $.each(catDelLists, function(eKey, eValue) {

                nn.api('DELETE', cms.reapi('/api/category/{categoryId}', {
                    categoryId: eValue
                }), null, function(category) {
                    nn.log(category);
                });

            });
            $page.promoCatRemoveList = [];
            deferred.resolve();

            return deferred.promise();
        }

        function procEnd() {
            var deferred = $.Deferred();
            $('#overlay-s').fadeOut("slow");
            $('body').removeClass('has-change');
            $("#set-save p.btns").addClass("disable");
            deferred.resolve();

            return deferred.promise();
        }


        function procChannels(Channels) {
            var deferred = $.Deferred();

            // if (cid > 0 && parseInt(cid, 10) !== episode.channelId) {
            //     $common.showSystemErrorOverlayAndHookError('You are not authorized to edit this episode.');
            //     // return;
            //     deferred.reject();
            // } else {
            //     nn.api('GET', cms.reapi('/api/users/{userId}/channels', {
            //         userId: cms.global.USER_DATA.id
            //     }), null, function (data) {
            //         // data = response;
            //         deferred.resolve(data, episode);
            //     });
            // }
            deferred.resolve();

            return deferred.promise();
            // return deferred.promise();
        }


    });


    $(document).on("click", ".catLi .btn-minus", function(e) {
        var upLi = $(this).parents("li");

        if ($(upLi).hasClass("minus")) {
            // add channel
            $(upLi).removeClass("minus");
        } else {
            // remove channle
            $(upLi).hasClass("minus");
        }
        e.stopPropagation();
    });

    $(document).on("click", ".btn-minus", function (e) {
        alert("test");
        var thisDiv = $(this),
            upLi = $(this).parents("li"),
            channelId = parseInt(upLi.attr("id").replace("channel_", ""), 10),

            inCurrent = false,
            inAdd = false,
            inRemove = false;

        if (-1 !== $.inArray(channelId, cms.global.USER_DATA["msoCurrent"])) {
            inCurrent = true;
        }
        if (-1 !== $.inArray(channelId, cms.global.USER_DATA["msoAdd"])) {
            inAdd = true;
        }
        if (-1 !== $.inArray(channelId, cms.global.USER_DATA["msoRemove"])) {
            inRemove = true;
        }

        if ($(this).hasClass("on")) {
            // add channel
            if (inCurrent === false && inRemove === false) {
                cms.global.USER_DATA["msoAdd"].push(channelId);
            } else if (inCurrent === true && inRemove === true) {
                cms.global.USER_DATA["msoRemove"].splice($.inArray(channelId, cms.global.USER_DATA["msoRemove"]), 1);
            }
            thisDiv.removeClass("on");
            upLi.removeClass("minus");
            thisDiv.find("p.center").text(nn._([cms.global.PAGE_ID, 'channel-list', 'Remove channel']));
            $('body').addClass('has-change');
            $("#set-save p.btns").removeClass("disable");
        } else {
            // remove channle
            if (inCurrent === true && inAdd === false) {
                cms.global.USER_DATA["msoRemove"].push(channelId);
            } else if (inCurrent === false && inAdd === true) {
                cms.global.USER_DATA["msoAdd"].splice($.inArray(channelId, cms.global.USER_DATA["msoAdd"]), 1);
            }
            $('body').addClass('has-change');
            $("#set-save p.btns").removeClass("disable");
            thisDiv.addClass("on");
            upLi.addClass("minus");
            thisDiv.find("p.center").text(nn._([cms.global.PAGE_ID, 'channel-list', 'Add channel']));
        }
    });

    // system catetory on to off
    $(document).on("click", ".intro a.switch-on", function (event) {
        if (!$("#store-layer").hasClass("collapse")) {
            $page._categoryBlockSlide("up");
        }
        if ($('body').hasClass('has-change')) {
            $("#unsave-prompt .btn-leave").addClass("switch-on-off");
            $common.showUnsaveOverlay();
        } else {
            cms.global.USER_DATA["pageInfo"] = [];
            cms.global.USER_DATA["msoSource"] = [];
            cms.global.USER_DATA["msoCurrent"] = [];
            $('body').addClass('has-change');
            $("#set-save p.btns").removeClass("disable");
            $common.showProcessingOverlay();
            $('#store-layer').hide();
            $('.intro a.switch-off').removeClass("hide");
            $('.intro a.switch-on').addClass("hide");
            $('.intro .msg-error').removeClass("hide");
            $('.intro .msg-error').show();
            $('#overlay-s').fadeOut("slow");
            $("#store-list .channel-list").empty();
        }
        $("#set-save p.btns").removeClass("disable");
    });

    // system catetory off to on 
    $(document).on("click", ".intro a.switch-off", function (event) {
        var lang = cms.global.USER_DATA.lang,
            msoId = cms.global.MSO;

        $common.showProcessingOverlay();
        $('#store-layer').show();
        $('.intro a.switch-off').addClass("hide");
        $('.intro a.switch-on').removeClass("hide");
        $('.intro .msg-error').addClass("hide");

        $page.drawCategory(msoId, lang);
        $("#set-save p.btns").removeClass("disable");
    });

    $('#store-list').scroll(function (event) {
        var $storeList = $('#store-list');

        if ($storeList.scrollTop() + $storeList.outerHeight() >= $storeList[0].scrollHeight && cms.global.USER_DATA["pageInfo"].pageCurrent < cms.global.USER_DATA["pageInfo"].pageTotal) {
            $storeList.find('.load').fadeIn('slow');
            $page.getMoreChannels();
        }
    });




    $(document).on('click', '#unsave-prompt .btn-leave', function () {
        if ($("#unsave-prompt .btn-leave").hasClass("switch-on-off")) {
            cms.global.USER_DATA["pageInfo"] = [];
            cms.global.USER_DATA["msoSource"] = [];
            cms.global.USER_DATA["msoCurrent"] = [];
            $("#unsave-prompt .btn-leave").removeClass("switch-on-off");
            $('body').removeClass('has-change');
            $.unblockUI();
            $common.showProcessingOverlay();
            $('#store-layer').hide();
            $('.intro a.switch-off').removeClass("hide");
            $('.intro a.switch-on').addClass("hide");
            $('.intro .msg-error').removeClass("hide");
            $(".channel-list").html("");
            if (!$("#store-layer").hasClass("collapse")) {
                $page._categoryBlockSlide("up");
            }
            $('#overlay-s').fadeOut("slow");
        } else {
            var tmpLeaveUrl = $('body').data('leaveUrl');
            if (undefined === tmpLeaveUrl) {
                tmpLeaveUrl = "";
            }
            $('body').removeClass('has-change');
            $.unblockUI();
            if (null !== tmpLeaveUrl && tmpLeaveUrl !== "") {
                location.href = $('body').data('leaveUrl');
            } else {
                $page._categoryBlockSlide("up");
                $page.catLiClick($(".btn-leave").data("meta"));
            }
        }
        return false;
    });

    $('.unblock, .btn-close, .btn-no, .setup-notice .btn-ok').click(function () {
        $.unblockUI();
        $('body').data('leaveUrl', "");
        $("#unsave-prompt .btn-leave").removeClass("switch-on-off");
        return false;
    });

    $(document).on('click', '#content-nav a, .select-list li a, .studio-nav-wrap a, #profile-dropdown a', function (e) {
        if ($('body').hasClass('has-change')) {
            if (e && $(e.currentTarget).attr('href')) {
                $('body').data('leaveUrl', $(e.currentTarget).attr('href'));
            }
            $common.showUnsaveOverlay();
            return false;
        }
    });

    $(document).on("click", "#store-category .btn-gray", function (event) {
         // alert("test");
        if ($("#store-layer").hasClass("collapse")) {
            $page._categoryBlockSlide("down");

        } else {
            $page._categoryBlockSlide("up");
        }
    });

    $('#system-error .btn-ok, #system-error .btn-close').click(function () {
        $.unblockUI();
        if ($('body').hasClass('has-error')) {
            location.replace('index.html');
        }
        return false;
    });
    // leave and unsave

    function confirmExit() {
        if ($('body').hasClass('has-change')) {
            // Unsaved changes will be lost, are you sure you want to leave?
            return $('#unsave-prompt p.content').text();
        }
    }
    window.onbeforeunload = confirmExit;
    // NOTE: Keep Window Resize Event at the bottom of this file
    $(window).resize(function () {
        var $storeList = $('#store-list');

        // Scroll to the exact bottom of the new window size.
        if ($storeList.scrollTop() + $storeList.height() > $storeList.find('.channel-list').height()) {
            $storeList.scrollTop($storeList.find('.channel-list').height() - $storeList.height());
        }

        $('#store-list').perfectScrollbar('update');

        if ($storeList.scrollTop() + $storeList.outerHeight() >= $storeList[0].scrollHeight && cms.global.USER_DATA["pageInfo"].pageCurrent < cms.global.USER_DATA["pageInfo"].pageTotal) {
            $storeList.find('.load').fadeIn('slow');
            $page.getMoreChannels();
        }
    });
});