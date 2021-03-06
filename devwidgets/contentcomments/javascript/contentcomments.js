/*
 * Licensed to the Sakai Foundation (SF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The SF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */
/*
 * Dependencies
 *
 * /dev/lib/misc/trimpath.template.js (TrimpathTemplates)
 * /dev/lib/jquery/plugins/jquery.pager.js (pager)
 */
/*global Config, $, pagerClickHandler */

require(["jquery", "sakai/sakai.api.core", "/dev/javascript/content_profile.js"], function($, sakai) {
    /**
     * @name sakai_global.contentcomments
     *
     * @class contentcomments
     *
     * @description
     * Initialize the contentcomments widget
     *
     * @version 0.0.1
     * @param {String} tuid Unique id of the widget
     * @param {Boolean} showSettings Show the settings of the widget or not
     */
    sakai_global.contentcomments = function(tuid, showSettings){


        /////////////////////////////
        // Configuration variables //
        /////////////////////////////

        var json = false; // Variable used to recieve information by json
        var widgetSettings = {}; // Will hold the widget settings.
        var me = sakai.data.me; // Contains information about the current user
        var rootel = $("#" + tuid); // Get the main div used by the widget
        var jsonDisplay = {};
        var start = 0; // Start fetching from the first comment.
        var clickedPage = 1;
        var defaultPostsPerPage = 10;
        var widgeturl = "";
        var contentPath = "";
        var store = "";
        var showCommentsChecked = true;

        // Main Ids
        var contentcomments = "#contentcomments";
        var contentcommentsName = "contentcomments";
        var contentcommentsClass = ".contentcomments";

        // Output containers
        var contentcommentsOutputContainer = contentcomments + "_mainContainer";
        var contentcommentsFillInComment = contentcomments + "_fillInComment";
        var contentcommentsUserCommentContainer = contentcomments + "_userCommentContainer";
        var contentcommentsPostCommentStart = contentcomments + "_postComment";
        var contentcommentsShowComments = contentcomments + "_showComments";
        var contentcommentsNumComments = contentcomments + "_numComments";
        var contentcommentsNumCommentsDisplayed = contentcommentsNumComments + "Displayed";
        var contentcommentsCommentComments = contentcomments + "_contentcommentscomment";
        var contentcommentsCancelComment = contentcomments + "_cancelComment";

        // Edit parts
        var contentcommentsEdit = contentcommentsClass + "_edit";
        var contentcommentsMessage = contentcomments + "_message_";
        var contentcommentsMessageEditContainer = contentcommentsMessage + "editContainer_";
        var contentcommentsEditText = contentcomments + "_editComment_txt_";
        var contentcommentsEditSave = contentcommentsClass + "_editComment_save";
        var contentcommentsEditCancel = contentcommentsClass + "_editComment_cancel";
        var contentcommentsPath = contentcomments + "_path_";
        var contentcommentsEditorOptions = contentcomments + "_editorOptions";

        // Delete
        var contentcommentsDelete = contentcommentsClass + "_delete";
        var contentcommentsUnDelete = contentcommentsClass + "_undelete";

        // Comment permissions
        var contentcommentsShowCheckbox = contentcomments + "_showCommentsCheckbox";
        var contentcommentsAllowCheckbox = contentcomments + "_allowCommentsCheckbox";

        // Output textboxes
        var contentcommentsMessageTxt = contentcomments + "_txtMessage";
        var contentcommentsNamePosterTxt = contentcomments + "_txtNamePoster";
        var contentcommentsMailPosterTxt = contentcomments + "_txtMailPoster";
        // Their containers
        var contentcommentsNamePosterTxtContainer = contentcommentsNamePosterTxt + "_container";
        var contentcommentsMailPosterTxtContainer = contentcommentsMailPosterTxt + "_container";

        // Output classes
        var contentcommentsCommentBtn = contentcommentsClass + "_comment";
        var contentcommentsPager = contentcommentsClass + "_jqpager";


        // Output templates
        var contentcommentsShowCommentsTemplate = contentcommentsName + "_showCommentsTemplate";

        // Settings
        var contentcommentsSettingsContainer = contentcomments + "_settings";

        // Settings checkboxes and radiobuttons
        var contentcommentsEmailReqChk = contentcomments + "_Emailrequired";
        var contentcommentsNameReqChk = contentcomments + "_Namerequired";
        var contentcommentsSendMailChk = contentcomments + "_SendMail";
        var contentcommentsPageTxt = contentcomments + "_txtPage";

        // Settings buttons
        var contentcommentsSubmit = contentcomments + "_submit";
        var contentcommentsCancel = contentcomments + "_cancel";

        // Settings names
        var contentcommentsDisplayRbt = contentcommentsName + "_ChooseDisplayComments";
        var contentcommentsDirectionRbt = contentcommentsName + "_ChooseDirectionComments";
        var contentcommentsPermissionsRbt = contentcommentsName + "_ChoosePermissionComments";

        // Resize textarea to match width
        var contentcommentsMainContainerTextarea = contentcommentsOutputContainer + " textarea";
        var contentcommentsTitlebar = contentcomments + "_titlebar";

        ////////////////////////
        // Utility  functions //
        ////////////////////////

        /**
         * returns how many years, months, days or hours since the dateinput
         * @param {Date} date
         */
        var getTimeAgo = function(date){
            return sakai.api.Datetime.getTimeAgo(date);
        };

        /**
         * Converts all HTML to flat text and converts \n to <br />
         * @param {String} str
         */
        var tidyInput = function(str){
            str = str.toString(); // in the event its not already a string, make it one
            str = str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            str = str.replace(/\n/g, '<br />');
            return str;
        };

        /**
         * Show the users profile picture
         */
        var displayUserProfilePicture = function(){
            if (me.profile) {
                var profile = me.profile;
                var picture = sakai.api.Util.constructProfilePicture(profile);
                if (!picture) {
                    picture = sakai.config.URL.USER_DEFAULT_ICON_URL;
                }
                $("#contentcomments_userProfileAvatarPicture").attr("src", picture);
            }
        };

        /**
         * Callback function to sort contentcomments based on created date
         */
        var sortComments = function(a, b){
            return a._created < b._created ? 1 : -1;
        };

        ///////////////////
        // show contentcomments //
        ///////////////////

        /**
         * Show the contentcomments in a paged state or not
         */
        var displayCommentsPagedOrNot = function(){
            jsonDisplay = {
                "comments": [],
                "settings": widgetSettings
            };

            // sort contentcomments on create date
            json.comments.sort(sortComments);

            // Loops through all the contentcomments and does the necessary changes to render the JSON-object
            for (var i = 0; i < json.comments.length; i++) {
                jsonDisplay.comments[i] = {};
                var comment = json.comments[i];
                // Checks if the date is already parsed to a date object
                var tempDate = comment._created;
                try {
                    // if the date is not a string this should generate en exception
                    comment.date = sakai.api.l10n.fromEpoch(tempDate, sakai.data.me);
                }
                catch (ex) {
                    if (comment.date instanceof Date) {
                        comment.date = tempDate;
                    } else {
                        comment.date = new Date(comment.date);
                    }
                }

                comment.timeAgo = "about " + getTimeAgo(comment.date) + " "+sakai.api.i18n.General.getValueForKey("AGO");
                comment.formatDate = sakai.api.l10n.transformDateTimeShort(comment.date);
                comment.messageTxt = comment.comment;
                comment.message = tidyInput(comment.comment);
                comment.canEdit = false;
                comment["sakai:id"] = comment.commentId.substring((comment.commentId.lastIndexOf("/") + 1),comment.commentId.length);

                var user = {};
                // User
                // Puts the userinformation in a better structure for trimpath
                if (comment.userid) {
                    if (sakai_global.content_profile.content_data.isManager){
                        comment.canDelete = true;
                    }
                    var profile = comment;
                    user.fullName = sakai.api.User.getDisplayName(profile);
                    user.uid = profile.userid;
                    user.pictureUrl = sakai.config.URL.USER_DEFAULT_ICON_URL;
                    // Check if the user has a picture
                    var pictureUrl = sakai.api.Util.constructProfilePicture(profile);
                    if (pictureUrl){
                        user.pictureUrl = pictureUrl;
                    }
                    user.profile = "/~" + sakai.api.Util.safeURL(user.uid);
                }
                else {
                    // This is an anonymous user.
                    comment.profile = {};
                    comment.profile.fullName = "Anonymous";
                    comment.profile.email = "noreply@sakaiproject.org";
                    if (widgetSettings["sakai:forcename"] === true) {
                        comment.profile.fullName = comment['sakai:name'];
                    }
                    if (widgetSettings["sakai:forcemail"] === true) {
                        comment.profile.email = comment['sakai:email'];
                    }
                }

                comment.user = user;

                jsonDisplay.comments[i] = comment;
            }
            jsonDisplay.sakai = sakai;
            $(contentcommentsShowComments, rootel).html(sakai.api.Util.TemplateRenderer(contentcommentsShowCommentsTemplate, jsonDisplay));
        };

        /**
         * Show all the posted contentcomments
         * This function first retrieves all the users who have posted in this widget and then call the displayCommentsPagedOrNot function
         */
        var showComments = function(){
            // Show the nr of contentcomments we are showing.
            var showingComments = json.total;
            if (widgetSettings.perPage < json.total) {
                showingComments = widgetSettings.perPage;
            }
            $(contentcommentsNumCommentsDisplayed, rootel).html(showingComments);
            // Puts the number of contentcomments on the page
            $(contentcommentsNumComments, rootel).html(json.total);
            // Change to "comment" or "contentcomments"
            if (json.total === 1) {
                $(contentcommentsCommentComments, rootel).text(sakai.api.i18n.General.getValueForKey("COMMENT"));
            }


            // Change the page-number on the display
    /*        $(contentcommentsPager, rootel).pager({
                pagenumber: clickedPage,
                pagecount: Math.ceil(json.total / widgetSettings.perPage),
                buttonClickCallback: pagerClickHandler
            });*/

            if (json.total > widgetSettings.perPage) {
                $(contentcommentsPager, rootel).show();
            }
            // Checks if the contentcomments undefined or if it's length is 0
            displayCommentsPagedOrNot();
        };

        /**
         * Gets the contentcomments from the service.
         */
        var getComments = function(){
            var sortOn = "_created";
            var sortOrder = "desc";
            var items = 10;
            if (widgetSettings.direction && widgetSettings.direction === "contentcomments_FirstDown") {
                sortOrder = "asc";
            }
            if (widgetSettings.perPage) {
                items = widgetSettings.perPage;
            }

            var url = "/p/" + sakai_global.content_profile.content_data.data["_path"] + ".comments?sortOn=" + sortOn + "&sortOrder=" + sortOrder + "&page=" + (clickedPage - 1) + "&items=" + items;

            $.ajax({
                url: url,
                cache: false,
                success: function(data){
                    json = $.extend(data, {}, true);
                    showComments();
                },
                error: function(xhr, textStatus, thrownError){
                    sakai.api.Util.notification.show(sakai.api.i18n.Widgets.getValueForKey("contentcomments","","COMMENTS_AN_ERROR_OCCURRED"), " (" + xhr.status + ")",sakai.api.Util.notification.type.ERROR);
                }
            });
        };

        /**
         * Pager click handler
         * @param {Number} pageclickednumber
         */
        var pagerClickHandler = function(pageclickednumber){
            clickedPage = pageclickednumber;

            // Change the page-number on the display
    /*        $(contentcommentsPager, rootel).pager({
                pagenumber: pageclickednumber,
                pagecount: Math.ceil(json.total / widgetSettings.perPage),
                buttonClickCallback: pagerClickHandler
            });*/
            getComments();
        };

        /**
         * Post a new comment
         */
        var postComment = function(){
            var comment = {
                // Replaces the \n (enters) with <br />
                "message": $(contentcommentsMessageTxt, rootel).val()
            };
            comment["sakai:type"] = "comment";

            var isLoggedIn = (me.user.anon && me.user.anon === true) ? false : true;
            var allowPost = true;
            // If the user is not loggedin but we allow anon contentcomments, we check some extra fields.
            if (!isLoggedIn && widgetSettings['sakai:allowanonymous'] === true) {
                if (!isLoggedIn && widgetSettings['sakai:forcename']) {
                    comment["sakai:name"] = $(contentcommentsNamePosterTxt, rootel).val();
                    if (comment["sakai:name"].replace(/\s/g, "") === "") {
                        allowPost = false;
                    }
                }
                if (!isLoggedIn && widgetSettings['sakai:forcemail']) {
                    comment["sakai:email"] = $(contentcommentsMailPosterTxt, rootel).val();
                    if (comment["sakai:email"].replace(/\s/g, "") === "") {
                        allowPost = false;
                    }
                }
            }
            if (!isLoggedIn && widgetSettings['sakai:allowanonymous'] === false) {
                // This should not even happen.. Somebody is tinkering with the HTML.
                allowPost = false;
                sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("ANON_NOT_ALLOWED"),"",sakai.api.Util.notification.type.ERROR);
            }

            var subject = "Comment";
            //var to = "internal:w-" + widgeturl + "/message";

            var body = $(contentcommentsMessageTxt, rootel).val();
            if (allowPost && body !== "") {
                var message = {
                    "_charset_":"utf-8",
                    "comment": body
                };

                var url = "/p/" + sakai_global.content_profile.content_data.data["_path"] + ".comments";
                $.ajax({
                    url: url,
                    type: "POST",
                    cache: false,
                    success: function(data){
                        // Hide the form.
                        //$(contentcommentsUserCommentContainer, rootel).hide();
                        // Clear the textboxes.
                        $(contentcommentsMessageTxt, rootel).val("");
                        $(contentcommentsNamePosterTxt, rootel).val("");
                        $(contentcommentsMailPosterTxt, rootel).val("");
                        // Add an acitivty
                        sakai.api.Activity.createActivity("/p/" + sakai_global.content_profile.content_data.data["_path"], "content", "default", {"sakai:activityMessage": "CONTENT_ADDED_COMMENT"}, function(responseData, success){
                            if (success) {
                                // update the entity widget with the new activity
                                $(window).trigger("updateContentActivity.entity.sakai", "CONTENT_ADDED_COMMENT");
                            }
                        });
                        // Get the contentcomments.
                        getComments();
                    },
                    error: function(xhr, textStatus, thrownError){
                        if (xhr.status === 401) {
                            sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("YOU_NOT_ALLOWED"),"",sakai.api.Util.notification.type.ERROR);
                        }
                        else {
                            sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("FAILED_TO_SAVE"),"",sakai.api.Util.notification.type.ERROR);
                        }
                    },
                    data: message
                });
            }
            else {
                sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("PLEASE_FILL_ALL_FIELDS"),"",sakai.api.Util.notification.type.ERROR);
            }
        };

        ////////////////////////
        // Settings functions //
        ////////////////////////

        /**
         * show the settingsscreen
         * @param {Boolean} exists
         * @param {Object} response
         */
        var showSettingScreen = function(exists, response){
            $(contentcommentsOutputContainer, rootel).hide();
            $(contentcommentsSettingsContainer, rootel).show();

            // If you're changing an comment-widget, then the saved values need to be filled in
            if (exists) {
                $("input[name='" + contentcommentsDirectionRbt + "'][value='" + widgetSettings.direction + "']", rootel).attr("checked", true);
                if (widgetSettings['sakai:allowanonymous'] && widgetSettings['sakai:allowanonymous'] === true) {
                    $("#contentcomments_DontRequireLogInID", rootel).attr("checked", true);
                    $(contentcommentsNameReqChk, rootel).attr("disabled", false);
                    $(contentcommentsEmailReqChk, rootel).attr("disabled", false);
                } else {
                    $("#contentcomments_RequireLogInID", rootel).attr("checked", true);
                    $(contentcommentsNameReqChk, rootel).attr("disabled", true);
                    $(contentcommentsEmailReqChk, rootel).attr("disabled", true);
                }
                $(contentcommentsEmailReqChk, rootel).attr("checked", widgetSettings['sakai:forcemail']);
                $(contentcommentsNameReqChk, rootel).attr("checked", widgetSettings['sakai:forcename']);


                $(contentcommentsSendMailChk, rootel).attr("checked", widgetSettings['sakai:notification']);
                $(contentcommentsPageTxt, rootel).val(widgetSettings.perPage);
            }
        };

        /**
         * When the settings are saved to JCR, this function will be called.
         * It will notify the container that it can be closed.
         */
        var finishNewSettings = function(){
            sakai.api.Widgets.Container.informFinish(tuid, "contentcomments");
        };

        /**
         * fills up the settings JSON-object
         * @return {Object} the settings JSON-object, returns {Boolean} false if input is invalid
         */
        var getCommentsSettings = function(){
            var contentcomments = {};
            contentcomments.contentcomments = [];

            // Checks if there's already some contentcomments placed on the widget
            contentcomments.contentcomments = json.contentcomments || [];

            contentcomments.perPage = parseInt($(contentcommentsPageTxt, rootel).val(), 10);
            if (isNaN(contentcomments.perPage)) {
                contentcomments.perPage = defaultPostsPerPage;
            }

            if (contentcomments.perPage < 1) {
                sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("PLEASE_FILL_POSITIVE_NUM"),"",sakai.api.Util.notification.type.ERROR);
                return false;
            }
            // Check if a valid number is inserted
            else
                if ($(contentcommentsPageTxt, rootel).val().search(/^\d*$/)) {
                    sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("PLEASE_FILL_VALID_NUM"),"",sakai.api.Util.notification.type.ERROR);
                    return false;
                }


            contentcomments.direction = $("input[name=" + contentcommentsDirectionRbt + " ]:checked", rootel).val();

            // These properties are noy yet used in the contentcomments-widget, but are saved in JCR
            contentcomments['sakai:allowanonymous'] = true;
            if ($("#contentcomments_RequireLogInID", rootel).is(":checked")) {
                contentcomments['sakai:allowanonymous'] = false;
            }
            contentcomments['sakai:forcename'] = $(contentcommentsNameReqChk, rootel).attr("checked");
            contentcomments['sakai:forcemail'] = $(contentcommentsEmailReqChk, rootel).attr("checked");
            contentcomments['sakai:notification'] = $(contentcommentsSendMailChk, rootel).attr("checked");
            contentcomments['sakai:notificationaddress'] = me.user.userid;
            contentcomments['sling:resourceType'] = 'sakai/settings';
            contentcomments['sakai:marker'] = tuid;
            contentcomments['sakai:type'] = "comment";

            return contentcomments;
        };

        /**
         * Makes sure that values that are supposed to be booleans, really are booleans.
         * @param {String[]} arr Array of strings which holds keys for the widgetSettings variable that needs to be checked.
         */
        var cleanBooleanSettings = function(arr){
            for (var i = 0; i < arr.length; i++) {
                var name = arr[i];
                widgetSettings[name] = (widgetSettings[name] && (widgetSettings[name] === true || widgetSettings[name] === "true" || widgetSettings[name] === 1)) ? true : false;
            }
        };

        /**
         * Gets the widget settings and shows the appropriate view.
         */
        var getWidgetSettings = function(){

            sakai.api.Widgets.loadWidgetData(tuid, function(success, data){
                if (success) {
                    if (!data.message) {
                        sakai.api.Widgets.saveWidgetData(tuid, {"message":{"sling:resourceType":"sakai/messagestore"}}, null);
                    }
                    widgetSettings = data;
                    // Clean up some values so that true is really true and not "true" or 1 ...
                    var keysToClean = ['sakai:forcename', 'sakai:forcemail', 'notification', 'sakai:allowanonymous'];
                    cleanBooleanSettings(keysToClean);

                    var isLoggedIn = (me.user.anon && me.user.anon === true) ? false : true;
                    if (widgetSettings["sakai:allowanonymous"] === false && !isLoggedIn) {
                        $(contentcommentsCommentBtn, rootel).parent().hide();
                    }

                    if (showSettings) {
                        showSettingScreen(true, data);
                    } else {
                        pagerClickHandler(1);
                    }
                }
                else {
                    if (showSettings) {
                        showSettingScreen(false, data);
                    } else {
                        pagerClickHandler(1);
                    }
                }
            });

        };

        /**
         * Gets the comment allow/show settings and shows the appropriate view.
         * @param {Boolean} getComments true = fetch contentcomments if contentcomments are to be shown, false = do not fetch contentcomments.
         */
        var checkCommentsPermissions = function(getComments){
            var showComments = sakai_global.content_profile.content_data.data["sakai:showcontentcomments"];
            var allowComments = sakai_global.content_profile.content_data.data["sakai:allowcontentcomments"];
            if (showComments === true) {
                if (getComments) {
                    pagerClickHandler(1);
                }
                if (sakai.api.User.isAnonymous(sakai.data.me)) {
                    // hide contentcomments entry box
                    $("#contentcomments_userCommentContainer", rootel).hide();
                } else {
                    $("#contentcomments_userCommentContainer", rootel).show();
                }
                $("#contentcomments_contentcommentsDisabled", rootel).hide();
                $("#contentcomments_showComments", rootel).show();
            } else {
                // hide contentcomments entry box and existing contentcomments
                $("#contentcomments_userCommentContainer", rootel).hide();
                $("#contentcomments_showComments", rootel).hide();
                $("#contentcomments_contentcommentsDisabled", rootel).show();
            }
        };


        ////////////////////
        // Event Handlers //
        ////////////////////

        /** Bind the choose display radiobuttons button */
        $("input[name=" + contentcommentsDisplayRbt + "]", rootel).bind("click", function(e, ui){
            var selectedValue = $("input[name=" + contentcommentsDisplayRbt + "]:checked", rootel).val();
            // When the perPage-rbt is selected the focus should be set to the Page-textbox
            if (selectedValue === "contentcomments_PerPage") {
                $(contentcommentsPageTxt, rootel).focus();
            }
        });

        /** Bind the choose permissions radiobuttons button */
        $("input[name=" + contentcommentsPermissionsRbt + "]", rootel).bind("change", function(e, ui){
            var selectedValue = $("input[name=" + contentcommentsPermissionsRbt + "]:checked", rootel).val();
            // If a login is required the user shouldn't have the posibility to check Name-required or Email-required
            $(contentcommentsNameReqChk, rootel).attr("disabled", selectedValue === "contentcomments_RequireLogIn");
            $(contentcommentsEmailReqChk, rootel).attr("disabled", selectedValue === "contentcomments_RequireLogIn");

        });

        /** Bind the settings submit button*/
        $(contentcommentsSubmit, rootel).bind("click", function(e, ui){
            // If the settings-input is valid an object will be returned else false will be returned
            var settings = getCommentsSettings();
            if (settings) {
                settings["_charset_"] = "utf-8";

                sakai.api.Widgets.saveWidgetData(tuid, settings, function(success){
                    if (success) {
                        finishNewSettings();
                    }
                    else {
                        sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("FAILED_TO_SAVE"),"",sakai.api.Util.notification.type.ERROR);
                    }
                });

            }

        });

        /** Bind the insert comment button*/
        $(contentcommentsCommentBtn, rootel).bind("click", function(e, ui){
            $(contentcommentsMainContainerTextarea, rootel).width($(contentcommentsTitlebar).width() - 90);
            // checks if the user is loggedIn
            var isLoggedIn = (me.user.anon && me.user.anon === true) ? false : true;
            var txtToFocus = contentcommentsMessageTxt;
            // If the user is not loggedin but we allow anon contentcomments, we show some extra fields.
            if (!isLoggedIn && widgetSettings['sakai:allowanonymous'] === true) {
                if (widgetSettings['sakai:forcename'] !== false) {
                    txtToFocus = contentcommentsNamePosterTxt;
                    $(contentcommentsNamePosterTxtContainer, rootel).show();
                }
                if (widgetSettings['sakai:forcemail'] !== false) {
                    // If name is not nescecary we focus the email address.
                    if (txtToFocus === contentcommentsMessageTxt) {
                        txtToFocus = contentcommentsMailPosterTxt;
                    }
                    $(contentcommentsMailPosterTxtContainer, rootel).show();
                }
            }
            if (!isLoggedIn && widgetSettings['sakai:allowanonymous'] === false) {
                // This should not even happen.. Somebody is tinkering with the HTML.
                sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("ANON_NOT_ALLOWED"),"",sakai.api.Util.notification.type.ERROR);
            }
            // Show the form.
            $(contentcommentsUserCommentContainer, rootel).show();
            $(txtToFocus, rootel).focus();
        });

        /**
         * Hide the form, but keep the input.
         */
        $(contentcommentsCancelComment, rootel).bind('click', function(){
            $(contentcommentsUserCommentContainer, rootel).hide();
        });

        /** Bind submit comment button */
        $(contentcommentsPostCommentStart, rootel).bind("click", function(e, ui){
            postComment();
        });

        /** Bind the settings cancel button */
        $(contentcommentsCancel, rootel).bind("click", function(e, ui){
            sakai.api.Widgets.Container.informCancel(tuid, "contentcomments");
        });

        /** Bind the checkboxes */
        $("#contentcomments_allowCommentsOption label, #contentcomments_allowCommentsCheckbox", rootel).bind("click", function(e){
            if (showCommentsChecked) {
                var allowComments = "false";
                if ($(contentcommentsAllowCheckbox, rootel).attr("checked")) {
                    if ($(this).attr("id") !== "contentcomments_allowCommentsCheckbox") {
                        $(contentcommentsAllowCheckbox, rootel).removeAttr("checked");
                    } else {
                        allowComments = "true";
                    }
                }
                else {
                    if ($(this).attr("id") !== "contentcomments_allowCommentsCheckbox") {
                        $(contentcommentsAllowCheckbox, rootel).attr("checked", "checked");
                        allowComments = "true";
                    }
                }

                $.ajax({
                    url: "/p/" + sakai_global.content_profile.content_data.data["_path"] + ".html",
                    type: "POST",
                    cache: false,
                    data: {
                        "sakai:allowcontentcomments": allowComments
                    },
                    success: function(data){
                        sakai_global.content_profile.content_data.data["sakai:allowcontentcomments"] = allowComments;
                        checkCommentsPermissions(false);
                    }
                });
            }
        });
        $("#contentcomments_showCommentsOption label, #contentcomments_showCommentsCheckbox", rootel).bind("click", function(e){
            var showComments = "false";
            if ($(contentcommentsShowCheckbox, rootel).attr("checked")){
                if ($(this).attr("id") !== "contentcomments_showCommentsCheckbox"){
                    showCommentsChecked = false;
                    $(contentcommentsShowCheckbox, rootel).removeAttr("checked");
                    $(contentcommentsAllowCheckbox, rootel).removeAttr("checked");
                    $(contentcommentsAllowCheckbox, rootel).attr("disabled", "disabled");
                } else {
                    showComments = "true";
                    showCommentsChecked = true;
                    $(contentcommentsAllowCheckbox, rootel).removeAttr("checked");
                    $(contentcommentsAllowCheckbox, rootel).removeAttr("disabled");
                }
            } else {
                if ($(this).attr("id") !== "contentcomments_showCommentsCheckbox"){
                    showComments = "true";
                    showCommentsChecked = true;
                    $(contentcommentsShowCheckbox, rootel).attr("checked", "checked");
                    $(contentcommentsAllowCheckbox, rootel).removeAttr("checked");
                    $(contentcommentsAllowCheckbox, rootel).removeAttr("disabled");
                } else {
                    showCommentsChecked = false;
                    $(contentcommentsAllowCheckbox, rootel).removeAttr("checked");
                    $(contentcommentsAllowCheckbox, rootel).attr("disabled", "disabled");
                }
            }

            $.ajax({
                url: "/p/" + sakai_global.content_profile.content_data.data["_path"] + ".html",
                type: "POST",
                cache: false,
                data: {
                    "sakai:showcontentcomments": showComments,
                    "sakai:allowcontentcomments": "false"
                },
                success: function(data){
                    sakai_global.content_profile.content_data.data["sakai:showcontentcomments"] = showComments;
                    sakai_global.content_profile.content_data.data["sakai:allowcontentcomments"] = "false";
                    checkCommentsPermissions(true);
                }
            });
        });


        /////////////////
        // DELETE LINK //
        /////////////////

        /**
         * Deletes or undeleted a post with a certain id.
         * @param {String} id The id of the post.
         * @param {Boolean} deleteValue true = delete it, false = undelete it.
         */
        var doDelete = function(id, deleteValue){
            var url = contentPath + ".comments?commentId=" + id;
            $.ajax({
                url: url,
                type: 'DELETE',
                success: function(){
                    getComments();
                },
                error: function(xhr, textStatus, thrownError){
                    sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("FAILED_TO_DELETE"),"",sakai.api.Util.notification.type.ERROR);
                }
            });
        };

        $(contentcommentsDelete, rootel).live("click", function(e, ui){
            var id = e.target.id.replace(contentcommentsDelete.replace(/\./g, "") + "_", "");
            doDelete(id, true);
            return false;
        });

        $(contentcommentsUnDelete, rootel).live("click", function(e, ui){
            var id = e.target.id.replace(contentcommentsUnDelete.replace(/\./g, ""), "");
            doDelete(id, false);
            return false;
        });


        ////////////////
        // EDIT PARTS //
        ////////////////

        /**
         * Edit link
         */
        $(contentcommentsEdit, rootel).live('click', function(e, ui){
            $(contentcommentsMainContainerTextarea, rootel).width($(contentcommentsTitlebar).width() - 90);
            var id = e.target.id.replace("contentcomments_edit_", "");
            // Show the textarea
            $(contentcommentsMessage + id, rootel).hide();
            $(contentcommentsMessageEditContainer + id, rootel).show();
        });

        /**
         * Save the edited comment.
         */
        $(contentcommentsEditSave, rootel).live('click', function(e, ui){
            var id = e.target.id.replace(contentcommentsEditSave.replace(/\./g, ""), "");
            var message = $(contentcommentsEditText + id, rootel).val();
            if (message !== "") {
                var data = {
                    "sakai:body": message,
                    "sakai:editedby": me.user.userid
                };
                // Do a post to the comment to edit the message.
                var commentUrl = $(contentcommentsPath+id).val();
                $.ajax({
                    url: commentUrl,
                    cache: false,
                    type: 'POST',
                    success: function(data){
                        // Set the new message
                        $(contentcommentsMessage + id, rootel).html(sakai.api.Security.saneHTML(tidyInput(message)));
                        // Hide the form
                        $(contentcommentsMessageEditContainer + id, rootel).hide();
                        $(contentcommentsMessage + id, rootel).show();
                    },
                    error: function(xhr, textStatus, thrownError){
                        sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("FAILED_TO_EDIT"),"",sakai.api.Util.notification.type.ERROR);
                    },
                    data: data
                });
            }
            else {
                sakai.api.Util.notification.show(sakai.api.i18n.General.getValueForKey("PLEASE_ENTER_MESSAGE"),"",sakai.api.Util.notification.type.ERROR);
            }
        });

        /**
         * Cancel the edit comment.
         */
        $(contentcommentsEditCancel, rootel).live('click', function(e, ui){
            var id = e.target.id.replace(contentcommentsEditCancel.replace(".", ""), "");
            // Show the textarea
            $(contentcommentsMessageEditContainer + id, rootel).hide();
            $(contentcommentsMessage + id, rootel).show();
        });

        /////////////////////////////
        // Initialisation function //
        /////////////////////////////
        /**
         * Switch between main and settings page
         * @param {Boolean} showSettings Show the settings of the widget or not
         */
        var doInit = function(){
            // Temporarily set these here, always allowing comments
            sakai_global.content_profile.content_data.data["sakai:showcontentcomments"] = true;
            sakai_global.content_profile.content_data.data["sakai:allowcontentcomments"] = true;
            $(contentcommentsEditorOptions).hide();
            if (sakai_global.content_profile && sakai_global.content_profile.content_data){
                contentPath = "/p/" + sakai_global.content_profile.content_data.path.split("/")[2];

                // check if contentcomments are allowed or shown and display the checkbox options for the manager
                if (sakai_global.content_profile.content_data.isManager){
                    if (sakai_global.content_profile.content_data.data["sakai:allowcontentcomments"] === false){
                        $(contentcommentsAllowCheckbox, rootel).removeAttr("checked");
                    } else {
                        sakai_global.content_profile.content_data.data["sakai:allowcontentcomments"] = true;
                        $(contentcommentsAllowCheckbox, rootel).attr("checked", "checked");
                    }
                    if (sakai_global.content_profile.content_data.data["sakai:showcontentcomments"] === false){
                        $(contentcommentsShowCheckbox, rootel).removeAttr("checked");
                        $(contentcommentsAllowCheckbox, rootel).removeAttr("checked");
                        $(contentcommentsAllowCheckbox, rootel).attr("disabled", "disabled");
                        showCommentsChecked = false;
                    } else {
                        sakai_global.content_profile.content_data.data["sakai:showcontentcomments"] = true;
                        $(contentcommentsShowCheckbox, rootel).attr("checked", "checked");
                        $(contentcommentsAllowCheckbox, rootel).removeAttr("disabled");
                    }
                    $(contentcommentsEditorOptions).show();
                }
            }
            if (!showSettings) {
                // Show the main view.
                displayUserProfilePicture();
                $(contentcommentsSettingsContainer, rootel).hide();
                $(contentcommentsOutputContainer, rootel).show();
                var isLoggedIn = (me.user.anon && me.user.anon === true) ? false : true;
                if (!isLoggedIn) {
                    $(contentcommentsUserCommentContainer, rootel).hide();
                }
            }
            //getWidgetSettings();
            //pagerClickHandler(1);
            checkCommentsPermissions(true);

            // listen for event if new content profile is loaded
            $(window).unbind("content_profile_hash_change");
            $(window).bind("content_profile_hash_change", function(e){
                doInit();
            });
        };
        if (sakai_global.content_profile && sakai_global.content_profile.content_data) {
            doInit();
        } else {
            $(window).bind("ready.contentprofile.sakai", function() {
                doInit();
            });
        }

    };

    sakai.api.Widgets.widgetLoader.informOnLoad("contentcomments");
});
