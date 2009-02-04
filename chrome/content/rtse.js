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
 /**
  * Function that initializes everything for each windows
  */
  init: function init() {
    // Ininitialzing other data
    this.smilies.init();
    if (gRTSE.prefsGetBool("extensions.rtse.editor"))
      RTSE.editor.init();

    // Check if wizard should run
    if (gRTSE.prefsGetBool('extensions.rtse.firstInstall'))
      window.openDialog('chrome://rtse/content/setupwizard.xul','RTSEsetup','chrome,centerscreen');

    // Sign in
    gRTSE.login();

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

  onPageLoad: function(aEvent) {
    /* the document is doc */
    var doc=aEvent.originalTarget;
    
    /* Run on all RT pages */
    if( /^https?:\/\/([a-zA-Z]+)\.roosterteeth\.com(.*)?$/.test(doc.location.href) ) {
      // Add custom CSS
      RTSE_addCSS(doc);
      
      /*Add UserInfo Links*/
      RTSE_addToUserInfo(doc);

      // Fix Links
      RTSE_linkFix(doc);
      
      /* Forum Quick Jump */
      RTSE_forumListBox(doc);

      // MozSearch
      RTSE_addSearchPlugins(doc);
    } else
      return;
    
    /* Run on journal pages */
    if( /^https?:\/\/([a-zA-Z]+)\.roosterteeth\.com\/members\/journal(.*)?$/.test(doc.location.href) ) {
        /* Run on your journal page */
        if( /^https?:\/\/([a-zA-Z]+)\.roosterteeth\.com\/members\/journal\/?$/.test(doc.location.href) ||
            /^https?:\/\/([a-zA-Z]+)\.roosterteeth\.com\/members\/journal\/index\.php.*$/.test(doc.location.href) ) {
            /* Editor */
            RTSE_insertEditor(doc,'journal');
        }
    }

    if(doc.getElementById("pageContent").getElementsByTagName("span")[0].innerHTML!="Locked:") {
      // Run on all other pages with posts
      if( doc.location.href.match("entry.php") != 'null' || doc.location.href.match("viewEntry.php") != 'null' || 
              doc.location.href.match("viewTopic.php") != 'null' || doc.location.href.match("image.php") != 'null') {
              
          // Replies
          RTSE_modifyReply(doc);

          // Quotes
          RTSE_modifyQuote(doc);

          // Permalinks
          RTSE_postPermalink(doc);
      }
    }
  },
  
  _menu: function() {
    /* Context Menu Goodies */
    var url=gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex).contentDocument.location.href;
    if( gContextMenu.onImage && gContextMenu.onLink &&
      /^https?:\/\/([a-zA-Z]+).roosterteeth.com(.*)?$/.test(url) &&
      gContextMenu.target.parentNode.href &&
      /profile\.php\?uid=[0-9]+$/.test(gContextMenu.target.parentNode.href) ) {
      /* Should target only user avatars */
      gContextMenu.showItem("rtse-sub-menu",true);
      var target=new String(gContextMenu.target.parentNode.href);
      var uid=target.replace(/^https?:\/\/([a-zA-Z]+).roosterteeth.com\/members\/profile.php\?uid=([0-9]+)$/,'$2','$1');
      
      /* Send PM */
      document.getElementById('rtse-user-sendPM').setAttribute('oncommand','gBrowser.addTab("http://'+
            gRTSE.prefsGetString("extensions.rtse.themeType")+'.roosterteeth.com/members/messaging/send.php?to='+uid+'");');
      /* Add Friend */
      document.getElementById('rtse-user-friends').setAttribute('oncommand','gBrowser.addTab("http://'+
            gRTSE.prefsGetString("extensions.rtse.themeType")+'.roosterteeth.com/members/addFriend.php?uid='+uid+'");');
      /* Watch */
      document.getElementById('rtse-user-watch').setAttribute('oncommand','gBrowser.addTab("http://'+
            gRTSE.prefsGetString("extensions.rtse.themeType")+'.roosterteeth.com/members/addWatch.php?uid='+uid+'");');
      
      
    } else {
      gContextMenu.showItem("rtse-sub-menu",false);
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
      return this.data.ok ? this.data.convertText(aText) : aText;
    },

   /**
    * Removes any conversions that may have taken place from convert
    * @param aText the text to be deconverted
    * @return unconverted text
    */
    deconvert: function deconvert(aText)
    {
      return this.data.ok ? this.data.deconvertText(aText): aText;
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