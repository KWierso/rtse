/* ***** BEGIN LICENSE BLOCK *****
 * Version: Open Software License v. 2.1
 *
 * The contents of this file are subject to the Open Software License Version
 * 2.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.opensource.org/licenses/osl-2.1.php
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the 'Rooster Teeth Site Extender'.
 *
 * The Initial Developer of the Original Code is
 * Shawn Wilsher
 *
 * Portions created by the Initial Developer are Copyright (C) 2005-2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
                    .getService(Components.interfaces.nsIRTSE);
var RTSE = {
  // Initialize sponsor setting for session
  sponsor: false,

 /**
  * Function that initializes everything for each windows
  */
  init: function init() {
    // Ininitialzing other data
    this.smilies.init();
    RTSE.editor.init();

    // Check if wizard should run
    if (gRTSE.prefsGetBool('extensions.rtse.firstInstall'))
      window.openDialog('chrome://rtse/content/setupwizard.xul','RTSEsetup','chrome,centerscreen');

    var appcontent=document.getElementById("appcontent"); /* This is the browser */
    if(appcontent)
      appcontent.addEventListener("DOMContentLoaded",this.onPageLoad,true);
    var menu=document.getElementById("contentAreaContextMenu"); /* This is the context menu */
    if(menu)
      menu.addEventListener("popupshowing",this._menu,false);

    var pb = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefBranch2);
    pb.addObserver("extensions.rtse", RTSE_PrefsChangeObserver, false);
  },

  destruct: function destruct()
  {
    var pb = Components.classes["@mozilla.org/preferences-service;1"]
                       .getService(Components.interfaces.nsIPrefBranch2);
    pb.removeObserver("extensions.rtse", RTSE_PrefsChangeObserver);
  },

  updateSponsor: function(doc) {
    try {
      let userInfoElem = doc.getElementById("userInfo").getElementsByTagName("td")[0]
                        .getElementsByTagName("a");

          this.sponsor = userInfoElem[5].innerHTML == "Sponsor" ||
                         userInfoElem[6].innerHTML == "Sponsor";
    } catch(e) { this.sponsor = false; }
  },

  onPageLoad: function(aEvent) {
    /* the document is doc */
    var doc=aEvent.originalTarget;

    if(doc.location.protocol != "about:" && doc.location.protocol != "resource:")
      if(RTSE_findOnDomain(doc.domain)) {
      /* Run on all RT pages */
        let rtURL = doc.location.href.split(doc.domain)[1];

        // Get Sponsor status for this browser session
        RTSE.updateSponsor(doc);
        RTSE.editor.sponsorSmilies();

        // Visibility of the quotebuttons in the ATE
        RTSE.editor.quoteButtons();

        // Add custom CSS
        RTSE_addCSS(doc);

        /* Adjust positioning of floating navbar */
        try {
            if(!gRTSE.prefsGetBool("extensions.rtse.header"))
              RTSE_adjustFloatingBar(doc);
        } catch(e) { /* It breaks here? That's weird */ }

        /*Add UserInfo Links*/
        /* DISABLED BECAUSE THE SITE CHANGED STUFF
        if(gRTSE.prefsGetBool("extensions.rtse.link.enabled"))
          RTSE_addToUserInfo(doc);
        */

        /*Hide Homepage Elements*/
        /* DISABLED BECAUSE THE SITE CHANGED STUFF
        if((rtURL == "/members/" || rtURL == "/members/index.php") &&
            !gRTSE.prefsGetBool("extensions.rtse.homepage"))
            RTSE_hideHomepageElements(doc);
        */

        /*Add Extra Tab*/
        RTSE_addExtraTab(doc);

        // Fix Links
        RTSE_linkFix(doc);

        // Fix Go to Parent link for Video Mod History items
        if(rtURL.match("members/modHistoryView.php") + "?" + rtURL.match("a=videoLinks") == 
                       "members/modHistoryView.php?a=videoLinks")
            RTSE_fixGoToParent(doc)

        /* Forum Quick Jump */
        RTSE_forumListBox(doc);

        // Page jump
        RTSE_pageJump(doc);

        // MozSearch
        RTSE_addSearchPlugins(doc);

        /* Run on journal pages */
        if( /^\/members\/journal(.*)?$/.test(rtURL) ) {
            /* Run on your journal page */
            if( /^\/members\/journal\/?$/.test(rtURL) ||
                /^\/members\/journal\/index\.php.*$/.test(rtURL) ) {
                /* Fix Search */
                try {
                    RTSE_fixSearch(doc);
                } catch(e) {
                    //If the user is not using the beta journal layout, fail quietly.
                }
            }
        }

        let isLocked = doc.getElementById("pageContent").getElementsByTagName("span")[0];
        if(isLocked) {
            if(isLocked.innerHTML!="Locked:") {
              // Run on all other pages with posts
              if( doc.location.href.match("entry.php") == 'entry.php' || 
                  doc.location.href.match("viewEntry.php") == 'viewEntry.php' || 
                  doc.location.href.match("viewTopic.php") == 'viewTopic.php' || 
                  doc.location.href.match("image.php") == 'image.php' || 
                  doc.location.href.match("video.php") == 'video.php' ||
                  doc.location.href.match("strip.php") == 'strip.php' || 
                  doc.location.href.match("viewItem.php") == 'viewItem.php' ||
                  doc.location.href.match("episode.php") == 'episode.php') {

                  // Replies
                  try {
                    RTSE_modifyReply(doc);
                  } catch(e) { /* Eat any errors that occur here */}

                  // Quotes
                  try {
                    RTSE_modifyQuote(doc);
                  } catch(e) { /* Eat any errors that occur here */}

                  // Permalinks
                  try {
                    RTSE_postPermalink(doc);
                  } catch(e) { /* Eat any errors that occur here */}
              }
              
              // Modify links for user comment pages
              if(doc.location.href.match("comments") == 'comments' || doc.location.href.match("profile.php") == 'profile.php'||
                (doc.getElementById("Add a Comment") && doc.getElementById(" Friends") && doc.getElementById("The Goods"))) 
              {              // Those getElementById's essentially confirm that this is a user's profile
                  // Replies
                  try {
                    RTSE_modifyReply(doc);
                  } catch(e) { /* Eat any errors that occur here */}

                  // Quotes
                  try {
                    RTSE_modifyQuote(doc);
                  } catch(e) { /* Eat any errors that occur here */}
              }
            }
        }
        // Modify post form for journal entries to direct user to the latest page of the journal when replying
        if(doc.location.href.match("/members/journal/entry.php") == "/members/journal/entry.php") {
            let lastPageURL = doc.location.href;

            // Does the URL already have a page number?
            if(lastPageURL.search("&page=") == -1) {
                lastPageURL = lastPageURL + "&page=9999999";
            }
            else {
                lastPageURL = lastPageURL.split("&page=")[0] + "&page=9999999";
            }

            RTSE_modifyForm(doc, null, lastPageURL, null, null, true);
        }

        // Add Watchlist and Alerts if enabled.
        if( (rtURL != "/members/" && rtURL != "/members/index.php" && rtURL != "members/signin.php") && 
                gRTSE.prefsGetBool("extensions.rtse.watchlist") )
            RTSE_addWatchlistAlerts(doc);
      } else
        return;
  },

  _menu: function() {
    /* Context Menu Goodies */
    let url=gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex).contentDocument.location;
    let regEx=/^https?:\/\/((|panics.|magic.|m.|myspace.)roosterteeth|achievementhunter|strangerhood|redvsblue|roosterteethcomics|captaindynamic).com(.*)$/i

    // Hide the menu by default. Only show it if conditions are met.
    gContextMenu.showItem("rtse-sub-menu",false);

    //These checks occur regardless of context
    if(gContextMenu.onLink && regEx.test(url.href)) {

        // Are we on the ONline user div?
        let targetON = false;
        if(gContextMenu.target.innerHTML == "ON" &&  /onTag/.test(gContextMenu.target.parentNode.id) && !gContextMenu.onImage ) {
            targetON = true;
        }

        // User/Avatar context items
        if( (gContextMenu.onImage && gContextMenu.target.parentNode.href) || targetON) {
          let target = gContextMenu.target;

          // Adjust target if over the ONline div
          if(targetON) {
            target = gContextMenu.target.parentNode.parentNode.getElementsByTagName("a")[1].getElementsByTagName("img")[0];
          }
          if(/avatar av{0,1}/.test(target.className)) {
            gContextMenu.showItem("rtse-sub-menu",true);

            let uid = target.getAttribute("data-uid");
            let dom = url.hostname;

            // Only show the items if the uID can be found
            if(uid) {
                // Make only user items visible
                document.getElementById('rtse-tournament-bracket').style.display = 'none';
                document.getElementById('rtse-thread-watch').style.display = 'none';
                document.getElementById('rtse-user-log').style.display = '';
                document.getElementById('rtse-user-watch').style.display = '';
                document.getElementById('rtse-user-block').style.display = '';
                document.getElementById('rtse-user-friends').style.display = '';
                document.getElementById('rtse-user-sendPM').style.display = '';
                document.getElementById('rtse-user-journal').style.display = '';
                document.getElementById('rtse-user-images').style.display = '';
                document.getElementById('rtse-user-videos').style.display = '';
                document.getElementById('rtse-user-comments').style.display = '';
                document.getElementById('rtse-no-uid').style.display = 'none';
                document.getElementById('rtse-search-last').style.display = 'none';
                document.getElementById('rtse-search-group-news').style.display = 'none';
                document.getElementById('rtse-search-group-forum').style.display = 'none';
                document.getElementById('rtse-search-group-images').style.display = 'none';
                document.getElementById('rtse-search-group-members').style.display = 'none';
                document.getElementById('rtse-edit-name').style.display = 'none';
                document.getElementById('rtse-edit-zip').style.display = 'none';
                document.getElementById('rtse-edit-location').style.display = 'none';
                document.getElementById('rtse-edit-occupation').style.display = 'none';
                document.getElementById('rtse-edit-about').style.display = 'none';
                document.getElementById('rtse-edit-interests').style.display = 'none';
                document.getElementById('rtse-edit-music').style.display = 'none';
                document.getElementById('rtse-edit-movies').style.display = 'none';
                document.getElementById('rtse-edit-tv').style.display = 'none';
                document.getElementById('rtse-edit-books').style.display = 'none';
                document.getElementById('rtse-edit-games').style.display = 'none';
                document.getElementById('rtse-edit-screenname').style.display = 'none';
                document.getElementById('rtse-edit-gamertag').style.display = 'none';
                document.getElementById('rtse-edit-twitter').style.display = 'none';
                document.getElementById('rtse-edit-title').style.display = 'none';

                // Send PM
                    RTSE_openContextItem("rtse-user-sendPM", "http://" + dom + "/members/messaging/send.php?to=" + uid, 1);
                // Add Friend
                    RTSE_openContextItem("rtse-user-friends", "http://" + dom + "/members/addFriend.php?uid=" + uid, 1);
                // Watch
                    RTSE_openContextItem("rtse-user-watch", "http://" + dom + "/members/addWatch.php?uid=" + uid, 1);
                // Block
                    RTSE_openContextItem("rtse-user-block", "http://" + dom + "/members/addBlock.php?uid=" + uid, 1);

                // View Log
                if (!RTSE.sponsor) {
                  document.getElementById('rtse-user-log').style.display = 'none';
                }
                RTSE_openContextItem("rtse-user-log", "http://" + dom + "/members/log.php?uid=" + uid, 1);

                // View Journal
                RTSE_openContextItem("rtse-user-journal", "http://" + dom + "/members/journal/?uid=" + uid, 1);
                // View Images
                RTSE_openContextItem("rtse-user-images", "http://" + dom + "/members/images/?uid=" + uid, 1);
                // View Videos
                RTSE_openContextItem("rtse-user-videos", "http://" + dom + "/members/videos/?uid=" + uid, 1);
                // View Comments
                RTSE_openContextItem("rtse-user-comments", "http://" + dom + "/members/comments/?uid=" + uid, 1);
            } else {
                document.getElementById('rtse-tournament-bracket').style.display = 'none';
                document.getElementById('rtse-thread-watch').style.display = 'none';
                document.getElementById('rtse-user-log').style.display = 'none';
                document.getElementById('rtse-user-watch').style.display = 'none';
                document.getElementById('rtse-user-block').style.display = 'none';
                document.getElementById('rtse-user-friends').style.display = 'none';
                document.getElementById('rtse-user-sendPM').style.display = 'none';
                document.getElementById('rtse-user-journal').style.display = 'none';
                document.getElementById('rtse-user-images').style.display = 'none';
                document.getElementById('rtse-user-videos').style.display = 'none';
                document.getElementById('rtse-user-comments').style.display = 'none';
                document.getElementById('rtse-no-uid').style.display = '';
                document.getElementById('rtse-search-last').style.display = 'none';
                document.getElementById('rtse-search-group-news').style.display = 'none';
                document.getElementById('rtse-search-group-forum').style.display = 'none';
                document.getElementById('rtse-search-group-images').style.display = 'none';
                document.getElementById('rtse-search-group-members').style.display = 'none';
                document.getElementById('rtse-edit-name').style.display = 'none';
                document.getElementById('rtse-edit-zip').style.display = 'none';
                document.getElementById('rtse-edit-location').style.display = 'none';
                document.getElementById('rtse-edit-occupation').style.display = 'none';
                document.getElementById('rtse-edit-about').style.display = 'none';
                document.getElementById('rtse-edit-interests').style.display = 'none';
                document.getElementById('rtse-edit-music').style.display = 'none';
                document.getElementById('rtse-edit-movies').style.display = 'none';
                document.getElementById('rtse-edit-tv').style.display = 'none';
                document.getElementById('rtse-edit-books').style.display = 'none';
                document.getElementById('rtse-edit-games').style.display = 'none';
                document.getElementById('rtse-edit-screenname').style.display = 'none';
                document.getElementById('rtse-edit-gamertag').style.display = 'none';
                document.getElementById('rtse-edit-twitter').style.display = 'none';
                document.getElementById('rtse-edit-title').style.display = 'none';
            }
          }
          // Tournament context items
          if(/tournaments\/event.php/.test(gContextMenu.target.parentNode.href) ){
            gContextMenu.showItem("rtse-sub-menu",true);

            let dom = url.hostname;
            let tid = gContextMenu.target.parentNode.href.split("id=")[1];

            // Make sure only tourney items are visible
            document.getElementById('rtse-user-log').style.display = 'none';
            document.getElementById('rtse-user-watch').style.display = 'none';
            document.getElementById('rtse-user-block').style.display = 'none';
            document.getElementById('rtse-user-friends').style.display = 'none';
            document.getElementById('rtse-user-sendPM').style.display = 'none';
            document.getElementById('rtse-user-journal').style.display = 'none';
            document.getElementById('rtse-user-images').style.display = 'none';
            document.getElementById('rtse-user-videos').style.display = 'none';
            document.getElementById('rtse-user-comments').style.display = 'none';
            document.getElementById('rtse-thread-watch').style.display = 'none';
            document.getElementById('rtse-tournament-bracket').style.display = '';
            document.getElementById('rtse-no-uid').style.display = 'none';
            document.getElementById('rtse-search-last').style.display = 'none';
            document.getElementById('rtse-search-group-news').style.display = 'none';
            document.getElementById('rtse-search-group-forum').style.display = 'none';
            document.getElementById('rtse-search-group-images').style.display = 'none';
            document.getElementById('rtse-search-group-members').style.display = 'none';
            document.getElementById('rtse-edit-name').style.display = 'none';
            document.getElementById('rtse-edit-zip').style.display = 'none';
            document.getElementById('rtse-edit-location').style.display = 'none';
            document.getElementById('rtse-edit-occupation').style.display = 'none';
            document.getElementById('rtse-edit-about').style.display = 'none';
            document.getElementById('rtse-edit-interests').style.display = 'none';
            document.getElementById('rtse-edit-music').style.display = 'none';
            document.getElementById('rtse-edit-movies').style.display = 'none';
            document.getElementById('rtse-edit-tv').style.display = 'none';
            document.getElementById('rtse-edit-books').style.display = 'none';
            document.getElementById('rtse-edit-games').style.display = 'none';
            document.getElementById('rtse-edit-screenname').style.display = 'none';
            document.getElementById('rtse-edit-gamertag').style.display = 'none';
            document.getElementById('rtse-edit-twitter').style.display = 'none';
            document.getElementById('rtse-edit-title').style.display = 'none';

            /* View Tourney Bracket */
            RTSE_openContextItem("rtse-tournament-bracket", "http://" + dom + "/tournaments/bracket.php?id=" + tid, 1);
          }
        }
        // Forum Thread context items
        if(/forum\/viewTopic.php/.test(gContextMenu.target.href) || /forum\/viewTopic.php/.test(gContextMenu.target.parentNode.href)) {
            gContextMenu.showItem("rtse-sub-menu",true);

            let dom = url.hostname;
            let link = gContextMenu.target.href;
            if(!link) {
                link = gContextMenu.target.parentNode.href;
            }
            let tid = link.split("id=")[1];
            link = link.split("&")[0];

            // Make only thread items visible
            document.getElementById('rtse-user-log').style.display = 'none';
            document.getElementById('rtse-user-watch').style.display = 'none';
            document.getElementById('rtse-user-block').style.display = 'none';
            document.getElementById('rtse-user-friends').style.display = 'none';
            document.getElementById('rtse-user-sendPM').style.display = 'none';
            document.getElementById('rtse-user-journal').style.display = 'none';
            document.getElementById('rtse-user-images').style.display = 'none';
            document.getElementById('rtse-user-videos').style.display = 'none';
            document.getElementById('rtse-user-comments').style.display = 'none';
            document.getElementById('rtse-tournament-bracket').style.display = 'none';
            document.getElementById('rtse-thread-watch').style.display = '';
            document.getElementById('rtse-no-uid').style.display = 'none';
            document.getElementById('rtse-search-last').style.display = '';
            document.getElementById('rtse-search-group-news').style.display = 'none';
            document.getElementById('rtse-search-group-forum').style.display = 'none';
            document.getElementById('rtse-search-group-images').style.display = 'none';
            document.getElementById('rtse-search-group-members').style.display = 'none';
            document.getElementById('rtse-edit-name').style.display = 'none';
            document.getElementById('rtse-edit-zip').style.display = 'none';
            document.getElementById('rtse-edit-location').style.display = 'none';
            document.getElementById('rtse-edit-occupation').style.display = 'none';
            document.getElementById('rtse-edit-about').style.display = 'none';
            document.getElementById('rtse-edit-interests').style.display = 'none';
            document.getElementById('rtse-edit-music').style.display = 'none';
            document.getElementById('rtse-edit-movies').style.display = 'none';
            document.getElementById('rtse-edit-tv').style.display = 'none';
            document.getElementById('rtse-edit-books').style.display = 'none';
            document.getElementById('rtse-edit-games').style.display = 'none';
            document.getElementById('rtse-edit-screenname').style.display = 'none';
            document.getElementById('rtse-edit-gamertag').style.display = 'none';
            document.getElementById('rtse-edit-twitter').style.display = 'none';
            document.getElementById('rtse-edit-title').style.display = 'none';

            /* Watch Thread */
            if(!/groups\//.test(gContextMenu.target.href)) {
                RTSE_openContextItem("rtse-thread-watch", "http://" + dom + 
                    "/forum/watch.php?id=" + tid + "&return=/forum/viewTopic.php?id=" + tid, 1);
            } else {
                RTSE_openContextItem("rtse-thread-watch", "http://" + dom + 
                    "/groups/forum/watch.php?id=" + tid + "&return=/groups/forum/viewTopic.php?id=" + tid, 1);
            }
            /* Go to Last Page of Link */
                RTSE_openContextItem("rtse-search-last", link + "&page=9999999", 0);
        }
        // Journal, Comic, News, Blog Comments context items
        if(/members\/journal\/entry.php/.test(gContextMenu.target.href) || /members\/journal\/entry.php/.test(gContextMenu.target.parentNode.href) ||
           /media\/viewItem.php/.test(gContextMenu.target.href) || /media\/viewItem.php/.test(gContextMenu.target.parentNode.href) ||
           /comics\/strip.php/.test(gContextMenu.target.href) || /comics\/strip.php/.test(gContextMenu.target.parentNode.href) ||
           /blog\//.test(gContextMenu.target.href) || /blog\//.test(gContextMenu.target.parentNode.href) ||
           /home.php/.test(gContextMenu.target.href) || /home.php/.test(gContextMenu.target.parentNode.href)) {
            gContextMenu.showItem("rtse-sub-menu",true);

            let dom = url.hostname;
            let link = gContextMenu.target.href;
            if(!link) {
                link = gContextMenu.target.parentNode.href;
            }
            let tid = link.split("id=")[1];
            link = link.split("&")[0];

            // Make only thread items visible
            document.getElementById('rtse-user-log').style.display = 'none';
            document.getElementById('rtse-user-watch').style.display = 'none';
            document.getElementById('rtse-user-block').style.display = 'none';
            document.getElementById('rtse-user-friends').style.display = 'none';
            document.getElementById('rtse-user-sendPM').style.display = 'none';
            document.getElementById('rtse-user-journal').style.display = 'none';
            document.getElementById('rtse-user-images').style.display = 'none';
            document.getElementById('rtse-user-videos').style.display = 'none';
            document.getElementById('rtse-user-comments').style.display = 'none';
            document.getElementById('rtse-tournament-bracket').style.display = 'none';
            document.getElementById('rtse-thread-watch').style.display = 'none';
            document.getElementById('rtse-no-uid').style.display = 'none';
            document.getElementById('rtse-search-last').style.display = '';
            document.getElementById('rtse-search-group-news').style.display = 'none';
            document.getElementById('rtse-search-group-forum').style.display = 'none';
            document.getElementById('rtse-search-group-images').style.display = 'none';
            document.getElementById('rtse-search-group-members').style.display = 'none';
            document.getElementById('rtse-edit-name').style.display = 'none';
            document.getElementById('rtse-edit-zip').style.display = 'none';
            document.getElementById('rtse-edit-location').style.display = 'none';
            document.getElementById('rtse-edit-occupation').style.display = 'none';
            document.getElementById('rtse-edit-about').style.display = 'none';
            document.getElementById('rtse-edit-interests').style.display = 'none';
            document.getElementById('rtse-edit-music').style.display = 'none';
            document.getElementById('rtse-edit-movies').style.display = 'none';
            document.getElementById('rtse-edit-tv').style.display = 'none';
            document.getElementById('rtse-edit-books').style.display = 'none';
            document.getElementById('rtse-edit-games').style.display = 'none';
            document.getElementById('rtse-edit-screenname').style.display = 'none';
            document.getElementById('rtse-edit-gamertag').style.display = 'none';
            document.getElementById('rtse-edit-twitter').style.display = 'none';
            document.getElementById('rtse-edit-title').style.display = 'none';

            /* Go to Last Page of Link */
            if(link.search(/\?/) > -1)
                RTSE_openContextItem("rtse-search-last", link + "&page=9999999", 0);
            else {
                RTSE_openContextItem("rtse-search-last", link + "?page=9999999", 0);
            }
        }
        if(gContextMenu.target == "[object XPCNativeWrapper [object HTMLDivElement]]") {
            // Search Dropdown context items (thread, journal and group items)
            if(gContextMenu.target.parentNode.className == "available"){
                let link = gContextMenu.target.parentNode.href;
                let typeCheck = gContextMenu.target.parentNode.getElementsByTagName("div")[1].innerHTML;
                switch(typeCheck) {
                  case "Forum Thread":
                  case "Comments":
                    if(typeCheck == "Comments") {
                        if(!/members\/journal\/entry.php/.test(link)) {
                            break;
                        }
                    }
                    gContextMenu.showItem("rtse-sub-menu",true);

                    // Make only last-page items visible
                    document.getElementById('rtse-user-log').style.display = 'none';
                    document.getElementById('rtse-user-watch').style.display = 'none';
                    document.getElementById('rtse-user-block').style.display = 'none';
                    document.getElementById('rtse-user-friends').style.display = 'none';
                    document.getElementById('rtse-user-sendPM').style.display = 'none';
                    document.getElementById('rtse-user-journal').style.display = 'none';
                    document.getElementById('rtse-user-images').style.display = 'none';
                    document.getElementById('rtse-user-videos').style.display = 'none';
                    document.getElementById('rtse-user-comments').style.display = 'none';
                    document.getElementById('rtse-tournament-bracket').style.display = 'none';
                    document.getElementById('rtse-thread-watch').style.display = 'none';
                    document.getElementById('rtse-no-uid').style.display = 'none';
                    document.getElementById('rtse-search-last').style.display = '';
                    document.getElementById('rtse-search-group-news').style.display = 'none';
                    document.getElementById('rtse-search-group-forum').style.display = 'none';
                    document.getElementById('rtse-search-group-images').style.display = 'none';
                    document.getElementById('rtse-search-group-members').style.display = 'none';
                    document.getElementById('rtse-edit-name').style.display = 'none';
                    document.getElementById('rtse-edit-zip').style.display = 'none';
                    document.getElementById('rtse-edit-location').style.display = 'none';
                    document.getElementById('rtse-edit-occupation').style.display = 'none';
                    document.getElementById('rtse-edit-about').style.display = 'none';
                    document.getElementById('rtse-edit-interests').style.display = 'none';
                    document.getElementById('rtse-edit-music').style.display = 'none';
                    document.getElementById('rtse-edit-movies').style.display = 'none';
                    document.getElementById('rtse-edit-tv').style.display = 'none';
                    document.getElementById('rtse-edit-books').style.display = 'none';
                    document.getElementById('rtse-edit-games').style.display = 'none';
                    document.getElementById('rtse-edit-screenname').style.display = 'none';
                    document.getElementById('rtse-edit-gamertag').style.display = 'none';
                    document.getElementById('rtse-edit-twitter').style.display = 'none';
                    document.getElementById('rtse-edit-title').style.display = 'none';

                    /* Go to Last Page of Link */
                    RTSE_openContextItem("rtse-search-last", link + "&page=9999999", 0);
                    break;
                  case "Group":
                    gContextMenu.showItem("rtse-sub-menu",true);

                    let dom = url.hostname;
                    let gID = link.split("id=")[1].split("&")[0];
                    // Make only Group items visible
                    document.getElementById('rtse-user-log').style.display = 'none';
                    document.getElementById('rtse-user-watch').style.display = 'none';
                    document.getElementById('rtse-user-block').style.display = 'none';
                    document.getElementById('rtse-user-friends').style.display = 'none';
                    document.getElementById('rtse-user-sendPM').style.display = 'none';
                    document.getElementById('rtse-user-journal').style.display = 'none';
                    document.getElementById('rtse-user-images').style.display = 'none';
                    document.getElementById('rtse-user-videos').style.display = 'none';
                    document.getElementById('rtse-user-comments').style.display = 'none';
                    document.getElementById('rtse-tournament-bracket').style.display = 'none';
                    document.getElementById('rtse-thread-watch').style.display = 'none';
                    document.getElementById('rtse-no-uid').style.display = 'none';
                    document.getElementById('rtse-search-last').style.display = 'none';
                    document.getElementById('rtse-search-group-news').style.display = '';
                    document.getElementById('rtse-search-group-forum').style.display = '';
                    document.getElementById('rtse-search-group-images').style.display = '';
                    document.getElementById('rtse-search-group-members').style.display = '';
                    document.getElementById('rtse-edit-name').style.display = 'none';
                    document.getElementById('rtse-edit-zip').style.display = 'none';
                    document.getElementById('rtse-edit-location').style.display = 'none';
                    document.getElementById('rtse-edit-occupation').style.display = 'none';
                    document.getElementById('rtse-edit-about').style.display = 'none';
                    document.getElementById('rtse-edit-interests').style.display = 'none';
                    document.getElementById('rtse-edit-music').style.display = 'none';
                    document.getElementById('rtse-edit-movies').style.display = 'none';
                    document.getElementById('rtse-edit-tv').style.display = 'none';
                    document.getElementById('rtse-edit-books').style.display = 'none';
                    document.getElementById('rtse-edit-games').style.display = 'none';
                    document.getElementById('rtse-edit-screenname').style.display = 'none';
                    document.getElementById('rtse-edit-gamertag').style.display = 'none';
                    document.getElementById('rtse-edit-twitter').style.display = 'none';
                    document.getElementById('rtse-edit-title').style.display = 'none';

                    /* Open each Group item in a new tab when clicked */
                    RTSE_openContextItem("rtse-search-group-news", "http://" + dom + "/groups/news/?id=" + gID, 1);
                    RTSE_openContextItem("rtse-search-group-forum", "http://" + dom + "/groups/forum/?id=" + gID, 1);
                    RTSE_openContextItem("rtse-search-group-images", "http://" + dom + "/groups/images/?id=" + gID, 1);
                    RTSE_openContextItem("rtse-search-group-members", "http://" + dom + "/groups/members.php?id=" + gID, 1);
                    break;
                  default:
                    gContextMenu.showItem("rtse-sub-menu", false);
                }
            }
        }
        // Show direct links to the various "edit profile" pages.
        if(gContextMenu.target.parentNode.href.match("members/editProfile.php") == "members/editProfile.php") {
            gContextMenu.showItem("rtse-sub-menu",true);

            document.getElementById('rtse-tournament-bracket').style.display = 'none';
            document.getElementById('rtse-thread-watch').style.display = 'none';
            document.getElementById('rtse-user-log').style.display = 'none';
            document.getElementById('rtse-user-watch').style.display = 'none';
            document.getElementById('rtse-user-block').style.display = 'none';
            document.getElementById('rtse-user-friends').style.display = 'none';
            document.getElementById('rtse-user-sendPM').style.display = 'none';
            document.getElementById('rtse-user-journal').style.display = 'none';
            document.getElementById('rtse-user-images').style.display = 'none';
            document.getElementById('rtse-user-videos').style.display = 'none';
            document.getElementById('rtse-user-comments').style.display = 'none';
            document.getElementById('rtse-no-uid').style.display = 'none';
            document.getElementById('rtse-search-last').style.display = 'none';
            document.getElementById('rtse-search-group-news').style.display = 'none';
            document.getElementById('rtse-search-group-forum').style.display = 'none';
            document.getElementById('rtse-search-group-images').style.display = 'none';
            document.getElementById('rtse-search-group-members').style.display = 'none';
            document.getElementById('rtse-edit-name').style.display = '';
            document.getElementById('rtse-edit-zip').style.display = '';
            document.getElementById('rtse-edit-location').style.display = '';
            document.getElementById('rtse-edit-occupation').style.display = '';
            document.getElementById('rtse-edit-about').style.display = '';
            document.getElementById('rtse-edit-interests').style.display = '';
            document.getElementById('rtse-edit-music').style.display = '';
            document.getElementById('rtse-edit-movies').style.display = '';
            document.getElementById('rtse-edit-tv').style.display = '';
            document.getElementById('rtse-edit-books').style.display = '';
            document.getElementById('rtse-edit-games').style.display = '';
            document.getElementById('rtse-edit-screenname').style.display = '';
            document.getElementById('rtse-edit-gamertag').style.display = '';
            document.getElementById('rtse-edit-twitter').style.display = '';
            document.getElementById('rtse-edit-title').style.display = '';

            let dom = url.hostname;
            RTSE_openContextItem("rtse-edit-name", "http://" + dom + "/members/editField.php?field=name", 0);
            RTSE_openContextItem("rtse-edit-zip", "http://" + dom + "/members/editField.php?field=zip", 0);
            RTSE_openContextItem("rtse-edit-location", "http://" + dom + "/members/editField.php?field=location", 0);
            RTSE_openContextItem("rtse-edit-occupation", "http://" + dom + "/members/editField.php?field=occupation", 0);
            RTSE_openContextItem("rtse-edit-about", "http://" + dom + "/members/editField.php?field=about", 0);
            RTSE_openContextItem("rtse-edit-interests", "http://" + dom + "/members/editField.php?field=interests", 0);
            RTSE_openContextItem("rtse-edit-music", "http://" + dom + "/members/editField.php?field=favMusic", 0);
            RTSE_openContextItem("rtse-edit-movies", "http://" + dom + "/members/editField.php?field=favMovies", 0);
            RTSE_openContextItem("rtse-edit-tv", "http://" + dom + "/members/editField.php?field=favTV", 0);
            RTSE_openContextItem("rtse-edit-books", "http://" + dom + "/members/editField.php?field=favBooks", 0);
            RTSE_openContextItem("rtse-edit-games", "http://" + dom + "/members/editField.php?field=favGames", 0);
            RTSE_openContextItem("rtse-edit-screenname", "http://" + dom + "/members/editField.php?field=screenName", 0);
            RTSE_openContextItem("rtse-edit-gamertag", "http://" + dom + "/members/editField.php?field=gamertag", 0);
            RTSE_openContextItem("rtse-edit-twitter", "http://" + dom + "/members/editField.php?field=twitter", 0);
            RTSE_openContextItem("rtse-edit-title", "http://" + dom + "/members/editField.php?field=title", 0);
        }
    }
  },

  // Stylesheet handling
  // Registers and unregisters stylesheets for instant application of preferences.
  registerStyleSheets: function registerStyleSheets()
  {
      var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
                      .getService(Ci.nsIStyleSheetService);
      var ios = Cc["@mozilla.org/network/io-service;1"]
                      .getService(Ci.nsIIOService);
      var uri2 = ios.newURI("chrome://rtse/content/styles2.css", null, null);
      var uri3 = ios.newURI("chrome://rtse/content/styles3.css", null, null);
      var uri4 = ios.newURI("chrome://rtse/content/styles4.css", null, null);
      var uri5 = ios.newURI("chrome://rtse/content/styles5.css", null, null);
      var uri6 = ios.newURI("chrome://rtse/content/styles6.css", null, null);
      var uriHome = ios.newURI("chrome://rtse/content/homepage.css", null, null);
      var uriWatch = ios.newURI("chrome://rtse/content/watchlist.css", null, null);

      if(!gRTSE.prefsGetBool("extensions.rtse.sidebar")) {
        if(!sss.sheetRegistered(uri2, sss.USER_SHEET))
            sss.loadAndRegisterSheet(uri2, sss.USER_SHEET);

      } else {
        if(sss.sheetRegistered(uri2, sss.USER_SHEET))
            sss.unregisterSheet(uri2, sss.USER_SHEET);
      }

      if(!gRTSE.prefsGetBool("extensions.rtse.header")) {
        if(!sss.sheetRegistered(uri3, sss.USER_SHEET))
            sss.loadAndRegisterSheet(uri3, sss.USER_SHEET);
      } else {
        if(sss.sheetRegistered(uri3, sss.USER_SHEET))
            sss.unregisterSheet(uri3, sss.USER_SHEET);
      }

      if(!gRTSE.prefsGetBool("extensions.rtse.journals")) {
        if(!sss.sheetRegistered(uri4, sss.USER_SHEET))
            sss.loadAndRegisterSheet(uri4, sss.USER_SHEET);
      } else {
        if(sss.sheetRegistered(uri4, sss.USER_SHEET))
            sss.unregisterSheet(uri4, sss.USER_SHEET);
      }

      if(!gRTSE.prefsGetBool("extensions.rtse.background")) {
        if(!sss.sheetRegistered(uri5, sss.USER_SHEET)) {
            sss.loadAndRegisterSheet(uri5, sss.USER_SHEET);
        }
      } else {
        if(sss.sheetRegistered(uri5, sss.USER_SHEET))
            sss.unregisterSheet(uri5, sss.USER_SHEET);
      }

      if(!gRTSE.prefsGetBool("extensions.rtse.homepage")) {
        if(!sss.sheetRegistered(uriHome, sss.USER_SHEET))
            sss.loadAndRegisterSheet(uriHome, sss.USER_SHEET);
      } else {
        if(sss.sheetRegistered(uriHome, sss.USER_SHEET))
            sss.unregisterSheet(uriHome, sss.USER_SHEET);
      }

      if(gRTSE.prefsGetBool("extensions.rtse.watchlistcolor")) {
        if(!sss.sheetRegistered(uriWatch, sss.USER_SHEET))
            sss.loadAndRegisterSheet(uriWatch, sss.USER_SHEET);
      } else {
        if(sss.sheetRegistered(uriWatch, sss.USER_SHEET))
            sss.unregisterSheet(uriWatch, sss.USER_SHEET);
      }

      if(!gRTSE.prefsGetBool("extensions.rtse.videosidebar")) {
        if(!sss.sheetRegistered(uri6, sss.USER_SHEET))
            sss.loadAndRegisterSheet(uri6, sss.USER_SHEET);
      } else {
        if(sss.sheetRegistered(uri6, sss.USER_SHEET))
            sss.unregisterSheet(uri6, sss.USER_SHEET);
      }
  },

 /**
  * Object that takes care of smilie conversion
  */
  smilies: {
   /**
    * Loads the smilies using the XPCOM component
    * @return true if successful, false otherwise
    */
    init: function init()
    {
      this.data = Components.classes["@shawnwilsher.com/smilies;1"]
                            .getService(Components.interfaces.nsISmilies);
      if (!this.data) return false;

      this.converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                                 .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
      this.converter.charset = "UTF-8";

      // Get the profile directory
      var profD = Components.classes["@mozilla.org/file/directory_service;1"]
                         .getService(Components.interfaces.nsIProperties)
                         .get("ProfD", Components.interfaces.nsIFile);

      // Loading smilies file
      var file=profD.clone();
      file.append("rtse");
      file.append("smilies.xml");

      if (!file.exists()) {
        // Now we have to make the file
        const ID = "rtse-nightly@shawnwilsher.com"
        var file = profD.clone();
        file.append("rtse");

        if (!file.exists())
          file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);

        // Doing this without using the extension manager to find the addon's 
        // installLocation means that you can't be running RTSE from outside
        // of your profile directory (for development work). If I can figure
        // out how to use the new API's getResourceURL(), I might be able
        // to get that working again in the future.
        var ext = profD.clone();
        ext.append("extensions");
        ext.append(ID);
        ext.append("defaults");
        ext.append("smilies.xml");
        ext.copyTo(file, "smilies.xml");
        // XXX this takes care of an initial install where the code seems to
        // die outside of this
        return this.init();
      }
      this.data.load(file);
      return this.data.ok;
    },

   /**
    * Converts the supplied text using the XPCOM method
    * @param aText the text to be converted
    * @return the converted text
    */
    convert: function convert(aText)
    {
      return this.data.ok ? 
                        this.converter.ConvertToUnicode(
                            this.data.convertText(
                                this.converter.ConvertFromUnicode(aText)
                            )
                        ) + this.converter.Finish() : aText;
    },

   /**
    * Removes any conversions that may have taken place from convert
    * @param aText the text to be deconverted
    * @return unconverted text
    */
    deconvert: function deconvert(aText)
    {
      return this.data.ok ? 
                        this.converter.ConvertToUnicode(
                            this.data.deconvertText(
                                this.converter.ConvertFromUnicode(aText)
                            )
                        ) + this.converter.Finish() : aText;
    },

    ///////////////////////////////////////////////////////////////////////////
    //// Attributes
   
   /**
    * The names of the smilies
    * @return an array of objects with the name, key, and path for each smiley
    */
    get items()
    {
      if (!this.data.ok) return [];
      var names =  this.data.getNames({});
      var out = [];
      for (var i in names) {
        out.push({ name: names[i],
                   key:  this.data.getKey(names[i]),
                   path: this.data.getPath(names[i])
                 });
      }
      return out;
    }
  }
};
