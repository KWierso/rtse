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
	init: function() {
		/* Load Config */
		RTSE.config=new RTSE_Config();
		RTSE.config.load();

		/* Add config listener */
		gRTSE.prefsRegisterObserver('config.reload',RTSE.config);

		/* Check if wizard should run */
		if( RTSE.config.get('firstInstall','true')=='true' )
			var win=window.openDialog('chrome://rtse/content/setupwizard.xul','RTSEsetup','chrome,centerscreen',RTSE);

		/* Sign in */
		if( RTSE.config.get('signin','false')=='true' )
			RTSE_signin();

		var appcontent=document.getElementById("appcontent");	/* This is the browser */
		if(appcontent)
			appcontent.addEventListener("DOMContentLoaded",this.onPageLoad,true);
		var menu=document.getElementById("contentAreaContextMenu");	/* This is the context menu */
		if(menu)
			menu.addEventListener("popupshowing",this._menu,false);

		/* Checking Version Number Pref - Updating if need be */
		const UA_STRING='RTSE/'+gRTSE.version;
		if( gRTSE.prefsGetString('rtse','general.useragent.extra.')!=UA_STRING )
			gRTSE.prefsSetString('rtse',UA_STRING,'general.useragent.extra.');
		
	},

	onPageLoad: function(aEvent) {
		/* the document is doc */
		var doc=aEvent.originalTarget;
		
		/* Run on all RT pages */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com(.*)?$/.test(doc.location.href) ) {
			/* Fix Links */
			if( RTSE.config.get('fixLinks','true')=='true' )
				RTSE_linkFix(doc);
			
			/* Theme */
			if( RTSE.config.get('theme','false')=='true' )
				RTSE_themeIt(doc);
			
			/* Forum Quick Jump */
			RTSE_forumListBox(doc);

			/* Replace Arrows */
			RTSE_switchArrows(doc);

			/* Add sidebar items */
			RTSE_addToSideBar(doc);

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
			}
		}

		/* Run on all topic pages */
		if( /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com\/forum\/viewTopic\.php(.*)?$/.test(doc.location.href) ) {
			/* Editor */
			RTSE_insertEditor(doc,'fcomment');

			// Permalinks
			RTSE_postPermalink(doc);
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
				    RTSE.config.get('themeType','www')+'.roosterteeth.com/members/messaging/send.php?to='+uid+'");');
			/* Add Friend */
			document.getElementById('rtse-user-friends').setAttribute('oncommand','gBrowser.addTab("http://'+
				    RTSE.config.get('themeType','www')+'.roosterteeth.com/members/addFriend.php?uid='+uid+'");');
			/* Watch */
			document.getElementById('rtse-user-watch').setAttribute('oncommand','gBrowser.addTab("http://'+
				    RTSE.config.get('themeType','www')+'.roosterteeth.com/members/addWatch.php?uid='+uid+'");');
			
			
		} else {
			gContextMenu.showItem("rtse-sub-menu",false);
		}
	}
}
