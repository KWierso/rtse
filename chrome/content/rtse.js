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
    let userInfoElem = doc.getElementById("userInfo").getElementsByTagName("td")[0]
                      .getElementsByTagName("a");
    try {
        this.sponsor = userInfoElem[5].innerHTML == "Sponsor" ||
                       userInfoElem[6].innerHTML == "Sponsor";
    } catch(e) { this.sponsor = false; }
  },

  onPageLoad: function(aEvent) {
    /* the document is doc */
    var doc=aEvent.originalTarget;

    if(RTSE_findOnDomain(doc.domain)) {
    /* Run on all RT pages */
        let rtURL = doc.location.href.split(doc.domain)[1];

        // Get Sponsor status for this browser session
        RTSE.updateSponsor(doc);
        RTSE.editor.sponsorSmilies();

        // Add custom CSS
        RTSE_addCSS(doc);

        /* Adjust positioning of floating navbar */
        try {
            if(!gRTSE.prefsGetBool("extensions.rtse.header"))
              RTSE_adjustFloatingBar(doc);
        } catch(e) { /* It breaks here? That's weird */ }

        /*Add UserInfo Links*/
        if(gRTSE.prefsGetBool("extensions.rtse.link.enabled"))
          RTSE_addToUserInfo(doc);

        /*Hide Homepage Elements*/
        if((rtURL == "/members/" || rtURL == "/members/index.php") &&
            !gRTSE.prefsGetBool("extensions.rtse.homepage"))
            RTSE_hideHomepageElements(doc);

        /*Add Extra Tab*/
        RTSE_addExtraTab(doc);

        // Fix Links
        RTSE_linkFix(doc);

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

        if(doc.getElementById("pageContent").getElementsByTagName("span")[0].innerHTML!="Locked:") {
          // Run on all other pages with posts
          if( doc.location.href.match("entry.php") == 'entry.php' || doc.location.href.match("viewEntry.php") == 'viewEntry.php' || 
                  doc.location.href.match("viewTopic.php") == 'viewTopic.php' || doc.location.href.match("image.php") == 'image.php' ||
                  doc.location.href.match("strip.php") == 'strip.php' || doc.location.href.match("viewItem.php") == 'viewItem.php' ||
                  doc.location.href.match("episode.php") == 'episode.php') {

              // Replies
              RTSE_modifyReply(doc);

              // Quotes
              RTSE_modifyQuote(doc);

              // Permalinks
              RTSE_postPermalink(doc);
          }
          
          // Modify links for user comment pages
          if(doc.location.href.match("comments") == 'comments' || doc.location.href.match("profile.php") == 'profile.php') {
              // Replies
              RTSE_modifyReply(doc);

              // Quotes
              RTSE_modifyQuote(doc);
          }
        }
    } else
        return;
  },

  _menu: function() {
    /* Context Menu Goodies */
    let url=gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex).contentDocument.location;
    let regEx=/^https?:\/\/((|panics.|magic.|m.|myspace.)roosterteeth|achievementhunter|strangerhood|redvsblue|roosterteethcomics).com(.*)$/i
    
    // Help handle the ONline div
    let targetON = false;
    if(gContextMenu.onLink && gContextMenu.target.innerHTML == "ON" && 
       /onTag/.test(gContextMenu.target.parentNode.id) && !gContextMenu.onImage ) {
         targetON = true;
    }

    if( gContextMenu.onLink && regEx.test(url.href) &&
       ( (gContextMenu.onImage && gContextMenu.target.parentNode.href) || targetON || 
         /forum\/viewTopic.php/.test(gContextMenu.target.href) ) ) {
          // /* Should target only user avatars */
          // if(/avatar av{0,1}/.test(gContextMenu.target.className)) {
            // gContextMenu.showItem("rtse-sub-menu",true);
            // let target = gContextMenu.target;

            // // Adjust target if over the ONline div
            // if(targetON) {
              // target = gContextMenu.target.parentNode.parentNode.getElementsByTagName("a")[1];
            // }

            // let uid = target.getAttribute("onerror");
            // uid = uid.split(/uid=/)[1].split(/\"/)[0];
            // let dom = url.hostname;

            // // Make only user items visible
            // document.getElementById('rtse-tournament-bracket').style.display = 'none';
            // document.getElementById('rtse-thread-watch').style.display = 'none';
            // document.getElementById('rtse-user-log').style.display = '';
            // document.getElementById('rtse-user-watch').style.display = '';
            // document.getElementById('rtse-user-block').style.display = '';
            // document.getElementById('rtse-user-friends').style.display = '';
            // document.getElementById('rtse-user-sendPM').style.display = '';
            // document.getElementById('rtse-user-journal').style.display = '';
            // document.getElementById('rtse-user-images').style.display = '';
            // document.getElementById('rtse-user-comments').style.display = '';
              
            // /* Send PM */
            // document.getElementById('rtse-user-sendPM').setAttribute('oncommand','gBrowser.addTab("http://'+
              // dom + '/members/messaging/send.php?to='+uid+'");');
            // /* Add Friend */
            // document.getElementById('rtse-user-friends').setAttribute('oncommand','gBrowser.addTab("http://'+
              // dom + '/members/addFriend.php?uid='+uid+'");');
            // /* Watch */
            // document.getElementById('rtse-user-watch').setAttribute('oncommand','gBrowser.addTab("http://'+
              // dom + '/members/addWatch.php?uid='+uid+'");');
            // /* Block */
            // document.getElementById('rtse-user-block').setAttribute('oncommand','gBrowser.addTab("http://'+
              // dom + '/members/addBlock.php?uid='+uid+'");');
            // /* View Log */
            
            // if (!RTSE.sponsor) {
              // document.getElementById('rtse-user-log').style.display = 'none';
            // } 

                 // document.getElementById('rtse-user-log').setAttribute('oncommand','gBrowser.addTab("http://'+
                // dom + '/members/log.php?uid='+uid+'");');
          // }
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
            document.getElementById('rtse-user-comments').style.display = 'none';
            document.getElementById('rtse-thread-watch').style.display = 'none';
            document.getElementById('rtse-tournament-bracket').style.display = '';

            /* View Tourney Bracket */
            document.getElementById('rtse-tournament-bracket').setAttribute('oncommand','gBrowser.addTab("http://'+
              dom + '/tournaments/bracket.php?id='+tid+'");');
          }
          if(/forum\/viewTopic.php/.test(gContextMenu.target.href) ){
            gContextMenu.showItem("rtse-sub-menu",true);
            
            let dom = url.hostname;
            let tid = gContextMenu.target.href.split("id=")[1];

            // Make only thread items visible
            document.getElementById('rtse-user-log').style.display = 'none';
            document.getElementById('rtse-user-watch').style.display = 'none';
            document.getElementById('rtse-user-block').style.display = 'none';
            document.getElementById('rtse-user-friends').style.display = 'none';
            document.getElementById('rtse-user-sendPM').style.display = 'none';
            document.getElementById('rtse-user-journal').style.display = 'none';
            document.getElementById('rtse-user-images').style.display = 'none';
            document.getElementById('rtse-user-comments').style.display = 'none';
            document.getElementById('rtse-tournament-bracket').style.display = 'none';
            document.getElementById('rtse-thread-watch').style.display = '';
            
            /* Watch Thread */
            if(!/groups\//.test(gContextMenu.target.href)) {
                document.getElementById('rtse-thread-watch').setAttribute('oncommand','gBrowser.addTab("http://'+
                  dom + '/forum/watch.php?id='+tid+'&return=/forum/viewTopic.php?id='+tid+'");');
            } else {
                document.getElementById('rtse-thread-watch').setAttribute('oncommand','gBrowser.addTab("http://'+
                  dom + '/groups/forum/watch.php?id='+tid+'&return=/groups/forum/viewTopic.php?id='+tid+'");');
            }
          }
    } else {
      gContextMenu.showItem("rtse-sub-menu",false);
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
      var uri5 = ios.newURI("chrome://rtse/content/homepage.css", null, null);

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

      if(!gRTSE.prefsGetBool("extensions.rtse.homepage")) {
        if(!sss.sheetRegistered(uri5, sss.USER_SHEET))
            sss.loadAndRegisterSheet(uri5, sss.USER_SHEET);
      } else {
        if(sss.sheetRegistered(uri5, sss.USER_SHEET))
            sss.unregisterSheet(uri5, sss.USER_SHEET);
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

      // Loading file
      var file=Components.classes["@mozilla.org/file/directory_service;1"]
                         .getService(Components.interfaces.nsIProperties)
                         .get("ProfD", Components.interfaces.nsIFile);
      file.append("rtse");
      file.append("smilies.xml");
      if (!file.exists()) {
        // Now we have to make the file
        const ID = "rtse-nightly@shawnwilsher.com"
        var file = Components.classes["@mozilla.org/file/directory_service;1"]
                             .getService(Components.interfaces.nsIProperties)
                             .get("ProfD", Components.interfaces.nsIFile);
        file.append("rtse");
        if (!file.exists())
          file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);

        var ext = Components.classes["@mozilla.org/extensions/manager;1"]
                            .getService(Components.interfaces.nsIExtensionManager)
                            .getInstallLocation(ID)
                            .getItemLocation(ID);
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
