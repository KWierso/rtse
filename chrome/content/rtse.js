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
 * Portions created by the Initial Developer are Copyright (C) 2005-2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
                    .createInstance(Components.interfaces.nsIRTSE);
var RTSE = {
 /**
  * Function that initializes everything for each windows
  */
  init: function init() {
    // Ininitialzing other data
    this.smilies.init();
    if (gRTSE.prefsGetBool("extensions.rtse.editor"))
      this.editor.init();

		// Check if wizard should run
		if (gRTSE.prefsGetBool('extensions.rtse.firstInstall'))
			window.openDialog('chrome://rtse/content/setupwizard.xul','RTSEsetup','chrome,centerscreen');

		// Sign in
		gRTSE.login();

		var appcontent=document.getElementById("appcontent");	/* This is the browser */
		if(appcontent)
			appcontent.addEventListener("DOMContentLoaded",this.onPageLoad,true);
		var menu=document.getElementById("contentAreaContextMenu");	/* This is the context menu */
		if(menu)
			menu.addEventListener("popupshowing",this._menu,false);

		/* Checking Version Number Pref - Updating if need be */
		const UA_STRING='RTSE/'+gRTSE.version;
		if( gRTSE.prefsGetString('general.useragent.extra.rtse')!=UA_STRING )
			gRTSE.prefsSetString('general.useragent.extra.rtse',UA_STRING);
		
	},

	onPageLoad: function(aEvent) {
		/* the document is doc */
		var doc=aEvent.originalTarget;
		
		/* Run on all RT pages */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com(.*)?$/.test(doc.location.href) ) {
			// Add custom CSS
			RTSE_addCSS(doc);

			// Fix Links
      RTSE_linkFix(doc);
			
			// Themer
			if (gRTSE.prefsGetBool("extensions.rtse.themer"))
				RTSE_themeIt(doc);
			
			/* Forum Quick Jump */
			RTSE_forumListBox(doc);

			/* Add sidebar items */
			RTSE_addToSideBar(doc);

      // MozSearch
      RTSE_addSearchPlugins(doc);

			/* Editor */
			if( doc.getElementById('Add a Comment') )
				RTSE_insertEditor(doc,'comment');
		} else
			return;
		
		/* Run on journal pages */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/journal(.*)?$/.test(doc.location.href) ) {
			/* Editor */
			if( doc.getElementById('Make a Journal Entry') )
				RTSE_insertEditor(doc,'journal');

			/* Run on your journal page */
			if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/journal\/?$/.test(doc.location.href) ||
				/^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/journal\/index\.php.*$/.test(doc.location.href) ) {
				/* Editor */
				RTSE_insertEditor(doc,'journal');
			}

			/* Run on edit Journal page */
			if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/journal\/editEntry\.php.*$/.test(doc.location.href) ) {
				/* Editor */
				RTSE_insertEditor(doc,'ejournal');
			}

			// Run on Journal Comment pages
			if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/journal\/entry\.php.*$/.test(doc.location.href) ) {
				// Permalinks
				RTSE_postPermalink(doc);

				// Replies
				RTSE_addReply(doc);

				// Quotes
				RTSE_addQuote(doc)
			}
		}

		/* Run on all topic pages */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/forum\/viewTopic\.php(.*)?$/.test(doc.location.href) ) {
			/* Editor */
			RTSE_insertEditor(doc,'fcomment');

			// Permalinks
			RTSE_postPermalink(doc);

			// Quotes
			RTSE_addQuote(doc)
		}

		/* Run on topic reply page */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/forum\/reply\.php(.*)?$/.test(doc.location.href) ) {
			/* Editor */
			RTSE_insertEditor(doc,'freply');
		}

		/* Run on add topic page */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/forum\/addTopic\.php\?fid=([0-9]+)$/.test(doc.location.href) ) {
			/* Editor */
			RTSE_insertEditor(doc,'atopic');
		}

		/* Run on Homepage */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/?$/.test(doc.location.href) ||
			/^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/index\.php.*$/.test(doc.location.href) ) {
			/* Editor */
			RTSE_insertEditor(doc,'journal');
		}

		/* Run on preview page */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/preview\.php$/.test(doc.location.href) ) {
			/* Editor */
			RTSE_insertEditor(doc,'cpreview');
		}

		/* Run on edit page */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/editMe\.php.*$/.test(doc.location.href) ) {
			/* Editor */
			RTSE_insertEditor(doc,'cedit');
		}

		/* Messaging */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/messaging.*$/.test(doc.location.href) ) {
			/* Reply to message */
			if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/messaging\/reply\.php.*$/.test(doc.location.href) ||
			    /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/messaging\/previewReply\.php.*$/.test(doc.location.href) ) {
				/* Editor */
				RTSE_insertEditor(doc,'rmessage');
			}

			/* Messaging */
			if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/messaging\/send\.php\?.*$/.test(doc.location.href) ||
				/^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/messaging\/preview\.php.*$/.test(doc.location.href) ) {
				/* Editor */
				RTSE_insertEditor(doc,'nmessage');
			}

			/* Messaging (blank) */
			if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/messaging\/send\.php$/.test(doc.location.href) ) {
				/* Editor */
				RTSE_insertEditor(doc,'bmessage');
			}
		}

		// Run on Image comment Pages
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/members\/images\/image\.php.*$/.test(doc.location.href) ) {
			// Permalinks
			RTSE_postPermalink(doc);
			
			// Replies
			RTSE_addReply(doc);

			// Quotes
			RTSE_addQuote(doc)
		}
	},
	
	_notify: function(title,text,image) {
		/* Used to notify user of something */
		var alertsService=Components.classes["@mozilla.org/alerts-service;1"]
		                            .getService(Components.interfaces.nsIAlertsService);
		if(alertsService)
			alertsService.showAlertNotification(image,title,text,false,"",null);
	},

	_menu: function() {
		/* Context Menu Goodies */
		var url=gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex).contentDocument.location.href;
		if( gContextMenu.onImage && gContextMenu.onLink &&
			/^https?:\/\/(www|rvb|sh|panics).roosterteeth.com(.*)?$/.test(url) &&
			gContextMenu.target.parentNode.href &&
			/profile\.php\?uid=[0-9]+$/.test(gContextMenu.target.parentNode.href) ) {
			/* Should target only user avatars */
			gContextMenu.showItem("rtse-sub-menu",true);
			var target=new String(gContextMenu.target.parentNode.href);
			var uid=target.replace(/^https?:\/\/(www|rvb|sh|panics).roosterteeth.com\/members\/profile.php\?uid=([0-9]+)$/,'$2','$1');
			
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
        const ID = "RTSE@shawnwilsher.com"
        var file = Components.classes["@mozilla.org/file/directory_service;1"]
                             .getService(Components.interfaces.nsIProperties)
                             .get("ProfD", Components.interfaces.nsIFile);
        file.append("rtse");
        if (!file.exists()) file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0664);

        var ext = Components.classes["@mozilla.org/extensions/manager;1"]
                            .getService(Components.interfaces.nsIExtensionManager)
                            .getInstallLocation(ID)
                            .getItemLocation(ID);
        ext.append("defaults");
        ext.append("smilies.xml");
        ext.copyTo(file, "smilies.xml");
      }
      this.data.load(file);
      return this.data.ok;
    },

   /**
    * Converts the suplied text using the XPCOM method
    * @param aText the text to be converted
    * @return the converted text
    */
    convert: function convert(aText)
    {
      return this.data.ok ? this.data.convertText(aText) : aText;
    },

   /**
    * Removes an conversions that may have taken place from convert
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
  },

 /**
  * Object used to manage the editor
  */
  editor: {
    ///////////////////////////////////////////////////////////////////////////
    //// Private Variables

    mOk: false,

    ///////////////////////////////////////////////////////////////////////////
    //// Functions

   /**
    * Initializes everything for the editor to work properly
    */
    init: function init()
    {
      var elm = document.getElementById("rtse-statusbar-editor");
      elm.addEventListener("click", RTSE.editor.toggleEditor, false);

      gBrowser.mPanelContainer.addEventListener("DOMContentLoaded",
                                                RTSE.editor.toggleIcon,
                                                false);
      gBrowser.mPanelContainer.addEventListener("select",
                                                RTSE.editor.toggleIcon,
                                                false);
      gBrowser.mPanelContainer.addEventListener("DOMContentLoaded",
                                                RTSE.editor.toggleEditor,
                                                false);
      gBrowser.mPanelContainer.addEventListener("select",
                                                RTSE.editor.toggleEditor,
                                                false);

      this.mOk = true;
    },

   /**
    * Determines if the icon should be visable.  Should only be called from an
    *  event listener
    * @param aEvent The event passed to the function
    */
    toggleIcon: function toggleIcon(aEvent)
    {
      var show = false;
      var doc = gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex)
                        .contentDocument;
      if (/^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com(.*)?$/.test(doc.location.href)) {
        show = doc.getElementById("Add a Comment") ||
               doc.getElementById("Make a Journal Entry") ||
               doc.getElementById("Edit Journal Entry") ||
               doc.getElementById("Add a New Topic") ||
               doc.getElementById("Reply") ||
               doc.getElementById("Send a Message") ||
               doc.getElementById("Post") ||
               doc.getElementById("Edit") ||
               doc.getElementById("Edit Post");
        if (!doc.editor) doc.editor = new RTSE_editor();
      }
      document.getElementById("rtse-statusbar-editor").hidden = !show;
    },

   /**
    * Shows/hides the editor and preview pane
    * @param aEvent The event passed to the function
    */
    toggleEditor: function toggleEditor(aEvent)
    {
      var doc = gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex)
                        .contentDocument;
      var pane = document.getElementById("rtse-realtimeEditor");
      if (!doc.editor) {
        pane.hidden = true;
        return;
      }
      var win = {
        height: gBrowser.contentWindow.innerHeight,
        width: gBrowser.contentWindow.innerWidth
      };
      pane.setAttribute("height", Math.floor(win.height/4));

      // updating values
      document.getElementById("rtse-editor-body").value = doc.editor.body;
      document.getElementById("rtse-editor-title").value = doc.editor.title;

      // toggle visibility
      pane.hidden = aEvent.type == "click" ? !pane.hidden : !doc.editor.visible;
      doc.editor.visible = !pane.hidden;
    },

    ///////////////////////////////////////////////////////////////////////////
    //// Attributes

   /**
    * Indicates if the object is ready yet
    * @return The status of the object (true or false)
    */
    get ok()
    {
      return this.mOk;
    }
  }
}
