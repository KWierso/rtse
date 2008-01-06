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
 *
 * ***** END LICENSE BLOCK ***** */

/* constants */
const Cc = Components.classes;
const Ci = Components.interfaces;
const nsIRTSE     = Components.interfaces.nsIRTSE;
const nsISupports = Components.interfaces.nsISupports;
const CLASS_ID    = Components.ID("{0960cf50-d196-11da-a94d-0800200c9a66}");
const CLASS_NAME  = "Rooster Teeth Site Extender XPCOM Component";
const CONTRACT_ID = "@shawnwilsher.com/rtse;1";

const nsIPrefService = Components.interfaces.nsIPrefService;
const nsIPasswordManagerInternal = Components.interfaces
                                             .nsIPasswordManagerInternal;
const nsIXMLHttpRequest = Components.interfaces.nsIXMLHttpRequest;
const nsIStyleSheetService = Components.interfaces.nsIStyleSheetService;
const nsIIOService = Components.interfaces.nsIIOService;

/* class definition */
function RTSE()
// OVERVIEW: This is the constructor function
{
  // Style Sheet Loading
  var sss = Components.classes["@mozilla.org/content/style-sheet-service;1"]
                      .getService(nsIStyleSheetService);
  var ios = Components.classes["@mozilla.org/network/io-service;1"]
                      .getService(nsIIOService);
  var uri = ios.newURI("chrome://rtse/content/styles.css", null, null);
  sss.loadAndRegisterSheet(uri, sss.USER_SHEET);

  // Version
  const UA_STRING = "RTSE/" + this.version;
  if (this.prefsGetString("general.useragent.extra.rtse") != UA_STRING)
    this.prefsSetString("general.useragent.extra.rtse", UA_STRING);
};
RTSE.prototype =
{
  // OVERVIEW: This is the class definition.  Defines the functions
  //           that are exposed in the interface.
  mVersion: '1.1.0a1',
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

 /**
  * Attempts to log a user in.  This only happens if
  *   "extensions.rtse.autologin" is set to true.
  */
  login: function login()
  {
    if (!this.mLoginSent && this.prefsGetBool("extensions.rtse.signin") &&
        this.username ) {
      let usr = { value: "" };
      let pwd = { value: "" };
      if ("@mozilla.org/passwordmanager;1" in Cc) {
        let pm = Cc["@mozilla.org/passwordmanager;1"].
                 getService(Ci.nsIPasswordManagerInternal);
        try {
          let login = { value: "" };
          pm.findPasswordEntry("rtse", this.username, "", login, usr, pwd);
        } catch (e) {
          // password manager didn't find what we wanted
          Components.utils.reportError(e);
          return;
        }
      } else if ("@mozilla.org/login-manager;1" in Cc) {
        let lm = Cc["@mozilla.org/login-manager;1"].
                 getService(Ci.nsILoginManager);
        let logins = lm.findLogins({}, "rtse", "rtse", null);
        if (logins.length) {
          usr.value = logins[0].username;
          pwd.value = logins[0].password;
        }
      }

      if (usr.value && pwd.value) {
        var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                            .getService(nsIXMLHttpRequest);
        req.open("POST", "http://www.roosterteeth.com/members/signinPost.php",
                 true);
        req.setRequestHeader("Content-Type",
                             "application/x-www-form-urlencoded");
        req.send("user=" + this.username + "&pass=" + pwd.value);
      } else {
        Components.utils.reportError("RTSE Login Failure.\n" +
                                     "Username/password not stored.");
      }

      this.mLoginSent = true;
    }
  },

 /**
  * Function that sends the error report if the preference is set to do so
  *  regardless, it logs a message to the error console.
  */
  sendReport: function sendReport(aError)
  {
    if (this.prefsGetBool('extensions.rtse.talkback')) {
      var req=Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                        .getService(Components.interfaces.nsIXMLHttpRequest);
      req.open("POST",'http://services.shawnwilsher.com/errorlogging/rtse.php',true);
      req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
      req.send(aError);
    }
    Components.utils.reportError(aError);
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
    prefs.branch = Components.classes["@mozilla.org/preferences-service;1"]
                             .getService(nsIPrefService);
    var temp = aName.split('.');
    var root = '';
    for (var i = 0; i < (temp.length - 1); ++i ) {
      root = root + temp[i] + '.';
    }
    prefs.branch = prefs.branch.getBranch(root);
    prefs.name   = temp[temp.length - 1];
    return prefs;
  },

  QueryInterface: function(aIID)
  {
    if( !aIID.equals(nsIRTSE) && !aIID.equals(nsISupports) )
      throw Components.results.NS_ERROR_NO_INTERFACE;
    return this;
  }
};

/* class factory (hey, I didn't name it) */
var RTSEFactory = {
  createInstance: function(aOuter,aIID)
  {
    if( aOuter!=null )
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    return (new RTSE()).QueryInterface(aIID);
  }
};

/* module definition (xpcom registration) */
var RTSEModule = {
  _firstTime: true,
  registerSelf: function(aCompMgr,aFileSpec,aLocation,aType)
  {
    aCompMgr=aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID,CLASS_NAME,CONTRACT_ID,aFileSpec,aLocation,aType);
  },

  unregisterSelf: function(aCompMgr,aLocation,aType)
  {
    aCompMgr=aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID,aLocation);        
  },
  
  getClassObject: function(aCompMgr,aCID,aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
      return RTSEFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr)
  {
    return true;
  }
};

/* module initialization */
function NSGetModule(aCompMgr,aFileSpec)
{
  return RTSEModule;
}
