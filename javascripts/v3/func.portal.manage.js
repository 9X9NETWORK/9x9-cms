/*jslint browser: true, devel: true, eqeq: true, nomen: true, unparam: true, vars: true */
/*global $, nn, cms */

(function ($page) {
    'use strict';

    var $common = cms.common;
    $page.sortingType = 1;
    $page.onTopLimit = 4;
    $page.setId = 0;
    $page.setCanChannel = 999999;
    $page.onTopList = [];
    $page.nomoList = [];
    $page.currentList = [];
    $page.addList = [];
    $page.removeList = [];
    $page.onTopAddList = [];
    $page.onTopRemoveList = [];
    $page.chSetLimit = 30;
    $page.chSetProgramLimit = 27;

    $page.ChannelSetRemoveList = [];

    $page.catGetNonNew = function () {
        var retValue = 0,
            catList = $("#store-category-ul .catLi"),
            tmpCat,
            i,
            j;

        for (i = 0, j = catList.length; i < j; i += 1) {
            tmpCat = catList[i];
            if (!$(tmpCat).hasClass("newCat")) {
                retValue = $(tmpCat).data("meta");
                return retValue;
            }

        }
        return retValue;
    };

    $page.isChannelSetAdd = function() {
        var cuntChannelSet = $(".catLi").length,
            limitChannelSet = parseInt(cms.global.MSOINFO.limitCh, 10);

        if(isNaN(cms.global.MSOINFO.limitCh)){
            limitChannelSet = $page.chSetLimit;
        }
        return limitChannelSet > cuntChannelSet
    };

    $page._search_channel_clean = function () {
        $("#msg-search").hide();
        $("#sRusult").html("");
        $("#search-channel-list").html("");
        $("#searchAdd").hide();
        $("#searchPrev").hide();
        $("#searchNext").hide();
        $("#input-portal-ch").val($("#input-portal-ch").data("tmpIn"));
    };

    $page.procPartList = function (inList, partType) {

        var retValue = [],
            tmpOnTop = [],
            tmpNomo = [];

        $.each(inList, function (i, channel) {
            if (channel.alwaysOnTop === true) {
                tmpOnTop.push(channel);
            } else {
                tmpNomo.push(channel);
            }
        });

        if ("onTop" === partType) {
            retValue = tmpOnTop;
        } else {
            retValue = tmpNomo;
        }
        return retValue;
    };

    $page._getItemIdArray = function (inList) {
        var retValue = [];

        $.each(inList, function (i, channel) {
            retValue.push(channel.id);
        });
        return retValue;
    };

    $page.procNomoList = function (inList, sortingType) {
        // 
        var retValue = [];
        if (1 === sortingType) {
            retValue = inList;
        } else {
            retValue = $page.procPartList(inList, "");
        }
        return retValue;
    };

    $page.procOnTopList = function (inList, sortingType) {
        var retValue = [];
        if (2 === sortingType) {
            retValue = $page.procPartList(inList, "onTop");
        }
        return retValue;
    };

    $page.prepareChannels = function (inList) {
        var retValue = [], temp = [], tmpId = 0, tmpMsoName = cms.global.MSOINFO.name || "9x9";

        $.each(inList, function (i, channel) {
            temp = [];
            if (channel.imageUrl == '') {
                channel.imageUrl = 'images/ch_default.png';
                if (channel.moreImageUrl && '' !== $.trim(channel.moreImageUrl)) {
                    temp = channel.moreImageUrl.split('|');
                    if (temp[0] && temp[0] !== cms.config.EPISODE_DEFAULT_IMAGE) {
                        channel.imageUrl = temp[0];
                    }
                }
            }
            tmpId = parseInt(channel.id, 10);
            if (-1 === $.inArray(tmpId, $page.currentList)) {
                channel.alreadyAdd = false;
            } else {
                channel.alreadyAdd = true;
            }
            channel.msoName = tmpMsoName;
            retValue.push(channel);
        });
        return retValue;
    };

    $page._getNowOrder = function () {
        var this_id = 0,
            tmpDiv = null,
            arrChannels = [],
            arrChannelOnTop = [],
            arrChannelNonOnTop = [];

        $("#channel-list  li.itemList").each(function () {
            this_id = parseInt($(this).attr("id").replace("set_", ""), 10);
            tmpDiv = $(this).find(".btn-top");

            if ($(tmpDiv[0]).hasClass("on")) {
                arrChannelOnTop.push(this_id);
            } else {
                arrChannelNonOnTop.push(this_id);
            }
            arrChannels.push(this_id);
        });

        return [arrChannels, arrChannelOnTop, arrChannelNonOnTop];
    };

    $page._setOnTop = function (inObj) {
        var tmpArr = [];
        if (1 === $page.sortingType) {
            tmpArr = $page.nomoList;
        } else {
            tmpArr = $page.onTopList.concat($page.nomoList);
        }

        $.each(tmpArr, function (i, channel) {
            if (undefined !== channel) {
                if (inObj == channel.id) {
                    if (tmpArr[i].alwaysOnTop === true) {
                        tmpArr[i].alwaysOnTop = false;
                    } else {
                        tmpArr[i].alwaysOnTop = true;
                    }
                }
            }
        });

        $page.nomoList = $page.procNomoList(tmpArr, $page.sortingType);
        $page.onTopList = $page.procOnTopList(tmpArr, $page.sortingType);
        $page._drawChannelLis();
    };

    $page._removeChannelFromList = function (inObj) {
        $.each($page.nomoList, function (i, channel) {
            if (undefined !== channel) {
                if (inObj == channel.id) {
                    $page.nomoList.splice(i, 1);
                }
            }
        });

        if (2 === $page.sortingType) {
            $.each($page.onTopList, function (i, channel) {
                if (undefined !== channel) {
                    if (inObj == channel.id) {
                        $page.onTopList.splice(i, 1);
                    }
                }
            });

        }

    };

    $page._reListSeq = function () {
        var nowOrderList = [],
            arrChannels = [],
            arrChannelOnTop = [];

        nowOrderList = $page._getNowOrder();
        arrChannels = nowOrderList[0];
        arrChannelOnTop = nowOrderList[1];

        if (1 === $page.sortingType) {
            $.each($page.onTopAddList, function (i, channel) {
                $page.onTopAddList[i].seq = $.inArray(channel.id, arrChannels) + 1;
            });
            $page.nomoList.sort(function (a, b) {
                return a.seq - b.seq;
            });
        } else if (2 === $page.sortingType) {
            $.each($page.onTopList, function (i, channel) {
                $page.onTopList[i].seq = $.inArray(channel.id, arrChannelOnTop) + 1;
            });
            $page.onTopList.sort(function (a, b) {
                return a.seq - b.seq;
            });
        }

    };

    $page._procSort = function (inObj) {

        var tmpDiv,
            channels = [],
            nowTopList = [],
            this_id = 0;

        $("#channel-list li.itemList").each(function () {
            this_id = $(this).attr("id").replace("set_", "");
            if (this_id > 0) {
                channels.push(this_id);
            }
            tmpDiv = $(this).find(".btn-top");

            if ($(tmpDiv[0]).hasClass("on")) {
                nowTopList.push(this_id);
            }
        });



        if (channels.length > 0) {
            nn.api('PUT', cms.reapi('/api/sets/{setId}/channels/sorting', {
                setId: inObj
            }), {
                channels: channels.join(',')
            }, function (set) {

                if (2 === $page.sortingType) {
                    nn.api('GET', cms.reapi('/api/sets/{setId}/channels', {
                        setId: inObj
                    }), null, function (chanels) {
                        var cntChanels = chanels.length,
                            dbTopList = [],
                            procList = [],
                            tmpId = 0,
                            actChannelCount2 = 0;

                        if (cntChanels > 0) {
                            dbTopList = $page._getItemIdArray($page.procOnTopList(chanels, $page.sortingType));
                        }

                        $.each(nowTopList, function (i, chId) {
                            tmpId = parseInt(chId, 10);
                            if ($.inArray(tmpId, dbTopList) > -1) {
                                dbTopList.splice($.inArray(tmpId, dbTopList), 1);
                            } else {
                                procList.push({
                                    onTop: true,
                                    chId: tmpId
                                });
                            }

                        });

                        $.each(dbTopList, function (i, chId) {
                            tmpId = parseInt(chId, 10);
                            if (tmpId > 0) {
                                procList.push({
                                    onTop: false,
                                    chId: tmpId
                                });
                            }
                        });
                        actChannelCount2 = procList.length;

                        if (actChannelCount2 > 0) {

                            $.each(procList, function (i, channel) {
                                nn.api("POST", cms.reapi('/api/sets/{setId}/channels', {
                                    setId: inObj
                                }), {
                                    channelId: channel.chId,
                                    alwaysOnTop: channel.onTop
                                }, function (retValue) {
                                    actChannelCount2 = actChannelCount2 - 1;
                                    if (actChannelCount2 === 0) {

                                        $('#overlay-s').fadeOut("slow");
                                    }
                                });
                            });
                        } else {
                            $('#overlay-s').fadeOut("slow");
                        }

                    });

                } else {
                    $('#overlay-s').fadeOut("slow");
                }

            });
        } else {
            $('#overlay-s').fadeOut("slow");
        }
    };

    $page._drawChannelLis = function () {

        $('#channel-list').empty();
        $('#portal-set-empty-chanels-tmpl').tmpl([{
            cntChanels: 1
        }]).appendTo('#channel-list');

        if (1 === $page.sortingType) {
            $page.nomoList.sort(function (a, b) {
                return a.seq - b.seq;
            });
        } else if (2 === $page.sortingType) {
            $page.onTopList.sort(function (a, b) {
                return a.seq - b.seq;
            });
            $page.nomoList.sort(function (a, b) {
                // return parseInt(a.updateDate, 10) < parseInt(b.updateDate, 10);
                // return a.updateDate.toString() < b.updateDate.toString();
                return b.updateDate - a.updateDate;
            });
        }
        $('#portal-set-chanels-tmpl').tmpl($page.onTopList).appendTo('#channel-list');
        $('#portal-set-chanels-tmpl').tmpl($page.nomoList).appendTo('#channel-list');
        if ($page.sortingType === 1) {
            $(".btn-top").hide();
        }

    };

    $page._arrsort = function (a, b) {
        if (a.alwaysOnTop !== true && b.alwaysOnTop !== true) {
            return a.updateDate < b.updateDate;
        }
        return a.seq - b.seq;
    };

    $page.drawChannelPrograms = function (msoId, inSet) {
        // 用到
        nn.api('GET', cms.reapi('/api/mso/{msoId}/sets', {
            msoId: msoId
        }), null, function (sets) {
            var cntSet = sets.length,
                setId = 0;
            if (cntSet > 0) {
                setId = setId[0].id;
            }
            if (inSet > 0) {
                setId = inSet;
            }
            if (cntSet > 0 && setId != undefined && setId > 0) {
                $page.listCategory(categories, catId);
                $page.catLiClick(catId);
                if (cntCategories > 11) {
                    $("#store-category-ul").height(96);
                }
                // $("#store-category-ul").show();
                $("#store-category-ul li").show();
                // $('#overlay-s').fadeOut("slow");

            } else {
                $page.listCategory(categories, catId);
                $("#store-category-ul li").show();
                $('#overlay-s').fadeOut("slow");
                // location.href = "./";
            }
        });
    };

    $page.emptyChannel = function() {
        $page.currentList = [];
        $page.nomoList = [];
        $page.onTopList = [];

        $('.channel-list').empty();

        $page._drawChannelLis();
    };

    $page.emptySet = function() {
        $page.currentList = [];
        $page.nomoList = [];
        $page.onTopList = [];

        $('.set_name').empty();
        $('.channel-list').empty();
        $('.info .form-title').empty();
        $('.info .form-content ').empty();
    };

    $page.listSetProgram = function (inMsoId, inSetId) {
        if ($("#catLi_" + inSetId).hasClass("newCat")) {
            $page.sortingType = $("#catLi_" + inSetId).data("sortingtype");
            $page.emptyChannel();
            var cntChanels = $(".itemList").length;
            $("div.info .form-title").html(nn._([cms.global.PAGE_ID, 'channel-list', "Program List : ? Programs"], [cntChanels]));
            $("div.info .form-content").empty();
            $('#channel-set-sorting-tmpl').tmpl([{
                sortingType: $page.sortingType
            }]).appendTo("div.info .form-content");
            $('#overlay-s').fadeOut("slow");
        } else {
            if (inSetId > 0) {
                // nn.log("abc::" + inCatId);
                nn.api('GET', cms.reapi('/api/sets/{setId}/channels', {
                    setId: inSetId
                }), null, function(chanels) {
                    var cntChanels = chanels.length;
                    $('#channel-list').empty();
                    if (cntChanels > 0) {
                        var tmpMsoName = cms.global.MSOINFO.name || "9x9";
                        $.each(chanels, function(i, channel) {
                            if ('' === channel.imageUrl) {
                                channel.imageUrl = "images/ch_default.png";
                            }
                            channel.msoName = tmpMsoName;
                            $page.currentList.push(channel.id);
                        });

                        $page.nomoList = $page.procNomoList(chanels, $page.sortingType);
                        $page.onTopList = $page.procOnTopList(chanels, $page.sortingType);
                        $page._drawChannelLis();
                    }

                    var expSort = ".empty, .isSortable",
                        setSortingType = $page.sortingType;

                    if (expSort === 1) {
                        expSort = ".empty";
                    } else {
                        $(".isSortable").css("cursor", "pointer");
                    }
                    $('#channel-list').sortable({
                        cursor: 'move',
                        revert: true,
                        cancel: expSort,
                        change: function(event, ui) {
                            $('body').addClass('has-change');
                        }
                    });
                    //$common.scrollbar("#portal-constrain", "#portal-list", "#portal-slider");
                    $(".info").show();
                    // $(".form-content").show();

                    $("div.info .form-title").html(nn._([cms.global.PAGE_ID, 'channel-list', "Program List : ? Programs"], [cntChanels]));
                    $("div.info .form-content").empty();
                    $('#channel-set-sorting-tmpl').tmpl([{sortingType:$page.sortingType}]).appendTo("div.info .form-content");

                    $('#portal-list').perfectScrollbar({
                        marginTop: 25,
                        marginBottom: 63
                    });
                    $('#overlay-s').fadeOut("slow");
                });
// ///////////////////////////////
                // nn.api('GET', cms.reapi('/api/category/{categoryId}/channels', {
                //     categoryId: inSetId
                // }), null, function (channels) {
                //     var cntChannelSource = channels.length;
                //     $page.currentList = [];
                //     $page.nomoList = [];
                //     $page.onTopList = [];

                //     $('.channel-list').empty();

                //     if (cntChannelSource > 0) {

                //         var tmpMsoName = cms.global.MSOINFO.name || "9x9";
                //         $.each(channels, function (i, channel) {
                //             if ('' === channel.imageUrl) {
                //                 channel.imageUrl = "images/ch_default.png";
                //             }
                //             channel.msoName = tmpMsoName;
                //             $page.currentList.push(channel.id);
                //         });
                //         nn.log("+++++ Channels:::" + channels.length);

                //         $page.nomoList = $page.procNomoList(channels, $page.sortingType);
                //         $page.onTopList = $page.procOnTopList(channels, $page.sortingType);
                //         $page._drawChannelLis();
                //     } else {
                //         $page._drawChannelLis();
                //         $('#overlay-s').fadeOut("slow");
                //     }
                // });
            } else {
                $page.currentList = [];
                $page.nomoList = [];
                $page.onTopList = [];
                $('.channel-list').empty();
                $page._drawChannelLis();
                $('#overlay-s').fadeOut("slow");
            }
        }
    };

    $page.catLiClick = function (inObj) {
        var msoId = 0;
        msoId = cms.global.MSO;
        $common.showProcessingOverlay();
        $(".catLi").removeClass("on");
        $("#catLi_" + inObj).addClass("on");
        var tmpCategoryName = $("#catLi_" + inObj + " span a").text();
        $("#title-func .set_name").text(tmpCategoryName);
        $('#channel-list').empty();
        $('#store-list').scrollTop(0);
        $page.listSetProgram(msoId, inObj);
        $('#store-list').perfectScrollbar('update');
    };

    $page.availableSetAdd = function (inCount) {
        // 用到
        if ($page.chSetLimit > inCount) {
            $("#store-category-ul .addPromotionCategory").removeClass("disable");
        } else {
            $("#store-category-ul .addPromotionCategory").addClass("disable");
        }
    };

    $page.listSet = function(inSet, inSetId) {
        // 用到
        $('#store-category-ul').empty();

        $('#store-empty-category-li-tmpl').tmpl().appendTo('#store-category-ul');
        $page.availableSetAdd(inSet.length);
        $('#store-category-li-tmpl').tmpl(inSet, {
            actCat: inSetId
        }).appendTo('#store-category-ul');
        //$(".func_name").text($("#store-category-ul li.on").text());
    };

    $page.getSortingType = function(inSets, inSetId) {
        var retValue = 0,
            tmpId = 0,
            tmpSortingType = 0;
        $.each(inSets, function(eKye, eValue) {
            tmpId = eValue.id;
            tmpSortingType = eValue.sortingType;
            if (tmpId === inSetId) {
                retValue = tmpSortingType;
            }
        });
        return retValue;
    };

    $page.drawChannelSets = function (msoId, inSet) {
        // 用到
        nn.api('GET', cms.reapi('/api/mso/{msoId}/sets', {
            msoId: msoId
        }), null, function (sets) {
            var cntSet = sets.length,
                setId = 0;
            if (cntSet > 0) {
                setId = sets[0].id;
            }
            if (inSet > 0) {
                setId = inSet;
            }
            if (cntSet > 0 && setId != undefined && setId > 0) {
                $page.listSet(sets, setId);
                $page.sortingType = $page.getSortingType(sets, setId);
                // $page.catLiClick(setId);
                // if (cntCategories > 11) {
                //     $("#store-category-ul").height(96);
                // }
                $("#store-category-ul").show();
                $("#store-category-ul li").show();

                $page.catLiClick(setId);
                // $('#overlay-s').fadeOut("slow");
                
            } else {
                $page.listCategory(sets, setId);
                $("#store-category-ul").show();
                $("#store-category-ul li").show();
                $('#overlay-s').fadeOut("slow");
                // location.href = "./";
            }
        });
    };
   

    // NOTE: page entry point (keep at the bottom of this file)
    $page.init = function (options) {
        nn.log({
            // NOTE: remember to change page-key to match file-name
            subject: 'CMS.PAGE.INITIALIZED: portal-manage',
            options: options
        }, 'debug');

        if (options && options.init) {
            $common.showProcessingOverlay();
            $('#yes-no-prompt .content').text(nn._([cms.global.PAGE_ID, 'channel-list', "You will change the order of program list to \"update time\", it will sort by update time of programs automatically so you can't change the order manually except set on top programs."]));
        }
        var setId = 0,
            msoId = cms.global.MSO,
            tmpLi = null;

        if (!isNaN(parseInt(cms.global.USER_URL.param('id'), 10))) {
            setId = parseInt(cms.global.USER_URL.param('id'), 10);
        }

        $page.drawChannelSets(msoId, setId);

        // nn.on(404, function (jqXHR, textStatus) {
        //     var tmpTxt = $.trim(jqXHR.responseText);
        //     if (tmpTxt === "Mso Not Found") {
        //         location.href = "./";
        //     }
        // });
        // nn.api('GET', cms.reapi('/api/mso/{msoId}/sets', {
        //     msoId: msoId
        // }), null, function (sets) {
        //     var cntSetsItem = sets.length;
        //     if (cntSetsItem > 0) {
        //         $page.setId = setId;
        //         if (setId < 1) {
        //             $page.setId = sets[0].id;
        //         }
        //         setId = $page.setId;
        //         var setItems = [];
        //         $.each(sets, function (i, channel) {
        //             channel.isActive = 0;
        //             if (channel.id == setId) {
        //                 channel.isActive = 1;
        //             }
        //             setItems.push(channel);
        //         });
        //         $('#func-nav .sub-nav').remove();
        //         // $('#func-nav .sub-nav').html('');
        //         // $('#portal-func-nav-sub-tmpl').tmpl(setItems).appendTo('#func-nav .sub-nav');

        //         // $('#store-category-ul').empty();
        //         // $('#store-empty-category-li-tmpl').tmpl(null).appendTo('#store-category-ul');
        //         // $('#store-category-li-tmpl').tmpl(setItems).appendTo('#store-category-ul');
        //         // $("#store-category-ul").show();
        //         // $("#store-category-ul li").show();

        //         nn.api('GET', cms.reapi('/api/sets/{setId}', {
        //             setId: setId
        //         }), null, function (set) {
        //             // $('#store-category').html('');
        //             // sets info

        //             $('#portal-set-form-tmpl').tmpl(set).appendTo('#store-category');
        //             // $('#title-func .set_name').html(set.name);

        //             $page.sortingType = set.sortingType;
        //             $page.currentList = [];

        //             // sets channel list
        //             if (set.channelCnt > 0) {
        //                 nn.api('GET', cms.reapi('/api/sets/{setId}/channels', {
        //                     setId: set.id
        //                 }), null, function (chanels) {
        //                     var cntChanels = chanels.length;
        //                     $('#channel-list').empty();
        //                     if (cntChanels > 0) {
        //                         var tmpMsoName = cms.global.MSOINFO.name || "9x9";
        //                         $.each(chanels, function (i, channel) {
        //                             if ('' === channel.imageUrl) {
        //                                 channel.imageUrl = "images/ch_default.png";
        //                             }
        //                             channel.msoName = tmpMsoName;
        //                             $page.currentList.push(channel.id);
        //                         });

        //                         $page.nomoList = $page.procNomoList(chanels, $page.sortingType);
        //                         $page.onTopList = $page.procOnTopList(chanels, $page.sortingType);
        //                         $page._drawChannelLis();
        //                     }

        //                     var expSort = ".empty, .isSortable";
        //                     if (set.sortingType === 1) {
        //                         expSort = ".empty";
        //                     } else {
        //                         $(".isSortable").css("cursor", "pointer");
        //                     }
        //                     $('#channel-list').sortable({
        //                         cursor: 'move',
        //                         revert: true,
        //                         cancel: expSort,
        //                         change: function (event, ui) {
        //                             $('body').addClass('has-change');
        //                         }
        //                     });
        //                     //$common.scrollbar("#portal-constrain", "#portal-list", "#portal-slider");
        //                     $('#portal-list').perfectScrollbar({ marginTop: 25, marginBottom: 63 });
        //                     $('#overlay-s').fadeOut("slow");
        //                 });
        //             } else {
        //                 // no channels
        //                 $("#cntChannelEmpty").show();
        //                 $('#channel-list').html('');
        //                 $('#portal-set-empty-chanels-tmpl').tmpl([{
        //                     cntChanels: set.channelCnt
        //                 }]).appendTo('#channel-list');
        //                 $('#overlay-s').fadeOut("slow");
        //             }
        //         });
        //     } else {
        //         location.href = "./";
        //     }
        // });

        // portal manage
        $('#portal-add-layer .langkey').each(function () {
            $(this).text(nn._([cms.global.PAGE_ID, 'portal-add-layer', $(this).data('langkey')]));
        });
        $('#portal-layer .langkey').each(function () {
            $(this).text(nn._([cms.global.PAGE_ID, 'portal-layer', $(this).data('langkey')]));
        });
        $('#portal-add-layer .langkeyH').each(function () {
            $(this).html(nn._([cms.global.PAGE_ID, 'portal-add-layer', $(this).data('langkey')]));
        });
        $('#portal-add-layer .langkeyVal').each(function () {
            $(this).val(nn._([cms.global.PAGE_ID, 'channel-list', $(this).data('langkey')]));
            $(this).data("tmpIn", $(this).val());
        });
        $('#func-nav .langkey').each(function () {
            $(this).text(nn._([cms.global.PAGE_ID, 'func-nav', $(this).data('langkey')]));
        });
        $('#title-func .langkey').each(function () {
            $(this).text(nn._([cms.global.PAGE_ID, 'title-func', $(this).data('langkey')]));
        });
    };

    // NOTE: remember to change page-key to match file-name
}(cms.namespace('portal-manage')));