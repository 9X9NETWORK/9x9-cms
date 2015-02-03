/**
 * @file Vimeo relative utility.
 * @author Mars Hsu <marshsu.9x9@gmail.com>
 */
(function (cms) {
    'use strict';
    cms.vimeoUtility = cms.vimeoUtility || {
        /**
         * Check Vimeo video validity.
         * @param {object} inVideo - The Vimeo data API response.
         * @returns {object} Checked validity result.
         */
        checkVideoValidity: function (inVideo) {

            var checkResult = {
                    // Private video?
                    isPrivateVideo: false,
                    // Not playable in some regions?
                    isZoneLimited: false,
                    // Not playable on mobile device?
                    isSyndicateLimited: false,
                    // Non-embeddable video?
                    isEmbedLimited: false,
                    // Deleted or not found?
                    isInvalid: false,
                    // Unplayable video?
                    isUnplayableVideo: false,
                    // Is the video still processing/uploading?
                    isProcessing: false,
                    // Is the video not available in the curator's region?
                    isRequesterRegionRestricted: false
                },
                inPrivacy = {},
                viewPrivate = ["nobody", "password", "contancts", "Mango"];

            if (inVideo.privacy) {
                inPrivacy = inVideo.privacy;
                if ("available" === inVideo.status) {
                    checkResult.isEmbedLimited = !!("anybody" === inPrivacy.view && 'private' === inPrivacy.embed);
                    checkResult.isPrivateVideo = !!(viewPrivate.indexOf(inPrivacy.view) > -1 && 'public' === inPrivacy.embed);
                } else {
                    checkResult.isInvalid = !checkResult.isPrivateVideo;
                }
            } else {
                checkResult.isPrivateVideo = !!(inVideo.error && inVideo.error.code && 403 === inVideo.error.code);
                checkResult.isInvalid = !checkResult.isPrivateVideo;
            }

            return checkResult;
        }

    };

})(cms);