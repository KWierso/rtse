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
 * Portions created by the Initial Developer are Copyright (C) 2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 * Wes Kocher
 *
 * ***** END LICENSE BLOCK ***** */
 
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

/* constants */
const Cc = Components.classes;
const Ci = Components.interfaces;
const nsIRTSE     = Ci.nsIRTSE;
const nsISupports = Ci.nsISupports;

const nsIPrefService = Ci.nsIPrefService;
const nsIPasswordManagerInternal = Ci.nsIPasswordManagerInternal;
const nsIXMLHttpRequest = Ci.nsIXMLHttpRequest;
const nsIStyleSheetService = Ci.nsIStyleSheetService;
const nsIIOService = Ci.nsIIOService;

/* class definition */
function RTSE()
// OVERVIEW: This is the constructor function
{
  // Style Sheet Loading
  var sss = Cc["@mozilla.org/content/style-sheet-service;1"]
                      .getService(nsIStyleSheetService);
  var ios = Cc["@mozilla.org/network/io-service;1"]
                      .getService(nsIIOService);
  var uri = ios.newURI("chrome://rtse/content/styles.css", null, null);
  sss.loadAndRegisterSheet(uri, sss.USER_SHEET);
  var uri2 = ios.newURI("chrome://rtse/content/styles2.css", null, null);
  var uri3 = ios.newURI("chrome://rtse/content/styles3.css", null, null);
  var uri4 = ios.newURI("chrome://rtse/content/styles4.css", null, null);
  var uri5 = ios.newURI("chrome://rtse/content/styles5.css", null, null);
  var uri6 = ios.newURI("chrome://rtse/content/styles6.css", null, null);
  var uriHome = ios.newURI("chrome://rtse/content/homepage.css", null, null);
  var uriWatch = ios.newURI("chrome://rtse/content/watchlist.css", null, null);
  if(!this.prefsGetBool("extensions.rtse.sidebar"))
    sss.loadAndRegisterSheet(uri2, sss.USER_SHEET);
  if(!this.prefsGetBool("extensions.rtse.header"))
    sss.loadAndRegisterSheet(uri3, sss.USER_SHEET);
  if(!this.prefsGetBool("extensions.rtse.journals"))
    sss.loadAndRegisterSheet(uri4, sss.USER_SHEET);
  if(!this.prefsGetBool("extensions.rtse.background"))
    sss.loadAndRegisterSheet(uri5, sss.USER_SHEET);
  if(!this.prefsGetBool("extensions.rtse.videosidebar"))
    sss.loadAndRegisterSheet(uri6, sss.USER_SHEET);
  if(!this.prefsGetBool("extensions.rtse.homepage"))
    sss.loadAndRegisterSheet(uriHome, sss.USER_SHEET);
  if(this.prefsGetBool("extensions.rtse.watchlistcolor"))
    sss.loadAndRegisterSheet(uriWatch, sss.USER_SHEET);
};
RTSE.prototype =
{
  classDescription: "Rooster Teeth Site Extender XPCOM Component",
  classID: Components.ID("{0960cf50-d196-11da-a94d-0800200c9a66}"),
  contractID: "@shawnwilsher.com/rtse;1",
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIRTSE]),

  // OVERVIEW: This is the class definition.  Defines the functions
  //           that are exposed in the interface.
  mVersion: '1.2.0.20100727',
  mLoginSent: false,

  get version()
  // EFFECTS: returns the value of 'version' - used as an attribute
  {
    return this.mVersion;
  },

 /**
  * Obtains the username stored in the preferences.
  *
  * @return The stored username.
  */
  get username()
  {
    return this.prefsGetString("extensions.rtse.username");
  },

 /**
  * Sets the username in the preferences.
  *
  * @param aVal The value to set username too.
  */
  set username(aVal)
  {
    this.prefsSetString("extensions.rtse.username", aVal);
  },

  prefsSetBool: function(aName,aValue)
  // EFFECTS: Sets a boolean preference aName with aValue.
  {
    var prefs = this.prefsGetBranch(aName);

    prefs.branch.setBoolPref(prefs.name, aValue);
  },
  prefsSetString: function(aName,aValue)
  // EFFECTS: Sets a string preference aName with aValue.
  {
    var prefs = this.prefsGetBranch(aName);

    prefs.branch.setCharPref(prefs.name, aValue);
  },
  prefsGetBool: function(aName)
  // EFFECTS: Returns the value of aName.
  {
    var prefs = this.prefsGetBranch(aName);

    return prefs.branch.getBoolPref(prefs.name);
  },
  prefsGetString: function(aName)
  // EFFECTS: Returns the value of aName.
  { 
    var prefs = this.prefsGetBranch(aName);

    return prefs.branch.getCharPref(prefs.name);
  },

 /**
  * Obtains the proper preference branch for the preference.
  *
  * @param aName The full name of the preference to obtain.
  * @return An array of the branch and the name of the preference.
  */
  prefsGetBranch: function prefsGetBranch(aName)
  {
    var prefs = {
      name: null,
      branch: null
    };
    prefs.branch = Cc["@mozilla.org/preferences-service;1"]
                             .getService(nsIPrefService);
    var temp = aName.split('.');
    var root = '';
    for (var i = 0; i < (temp.length - 1); ++i ) {
      root = root + temp[i] + '.';
    }
    prefs.branch = prefs.branch.getBranch(root);
    prefs.name   = temp[temp.length - 1];
    return prefs;
  }
};

var components = [RTSE];

/**
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
* XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
*/
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule(components);
