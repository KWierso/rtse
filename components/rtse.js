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
const nsIRTSE=Components.interfaces.nsIRTSE;
const nsISupports=Components.interfaces.nsISupports;
const CLASS_ID=Components.ID("{0960cf50-d196-11da-a94d-0800200c9a66}");
const CLASS_NAME="Rooster Teeth Site Extender XPCOM Component";
const CONTRACT_ID="@shawnwilsher.com/rtse;1";

/* class definition */
function RTSE()
// OVERVIEW: This is the constructor function
{
};
RTSE.prototype = {
	// OVERVIEW: This is the class definition.  Defines the functions
	//           that are exposed in the interface.
	mVersion: '1.1.0a1',
	mLoginSent: false,

	get version()
	// EFFECTS: returns the value of 'version' - used as an attribute
	{
		return this.mVersion;
	},

	login: function()
	// EFFECTS: if the preference 'extensions.rtse.autologin' is set,
	//          it will log you in to the site.
	{
		try {
			if( !this.mLoginSent && this.prefsGetBool('autologin') && this.prefsGetString('username') ) {
				// pulls from password manager
				var pm=Components.classes["@mozilla.org/passwordmanager;1"]
				                 .getService(Components.interfaces.nsIPasswordManager);
				var nsIPwd,pwd;
				var found=false;
				var username=this.prefsGetString('username');
				while( !found && pm.enumerator.hasMoreElements() ) {
					nsIPwd=pm.enumerator.getNext();
					if( nsIPwd.host=='rtse' && nsIPwd.user==username ) {
						pwd=nsIPwd.password;
						found=true;
					}
				}
				if( ref && username && pwd ) {
					var req=Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
					                  .getService(Components.interfaces.nsIXMLHttpRequest);
					req.open("POST",'http://www.roosterteeth.com/members/signinPost.php',true);
					req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
					req.send('user='+username+'&pass='+pwd);
				} else {
					throw NS_ERROR_FAILURE;
				}
				
				this.mLoginSent=true;
			}
		} catch(e) {
			this.sendReport(e);
		}
	},

	sendReport: function(aError)
	// EFFECTS: Sends the error back to server to establish common problems people may be having.
	{
		var req=Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
		                  .getService(Components.interfaces.nsIXMLHttpRequest);
		req.open("POST",'http://services.shawnwilsher.com/errorlogging/rtse.php',true);
		req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		req.send(aError);
	},

	prefsRegisterObserver: function(aPref,aFunc)
	// EFFECTS: Registers aFunc as an observer to aPref on
	//          extensions.rtse. branch.
	{
		var prefService=Components.classes["@mozilla.org/preferences-service;1"]
		                          .getService(Components.interfaces.nsIPrefService);
		this._branch=prefService.getBranch("extensions.rtse.");
		this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
		this._branch.addObserver(aPref,aFunc,false);
	},
	prefsUnregisterObserver: function(aPref,aFunc)
	// EFFECTS: Unregisters aFunc as an observer to aPref on
	//          extensions.rtse. branch.
	{
		if(!this._branch) return;
    		this._branch.removeObserver(aPref,aFunc);
	},
	prefsSetBool: function(aName,aValue)
	// EFFECTS: Sets a boolean preference aName with aValue.
	{
		var prefs=Components.classes["@mozilla.org/preferences-service;1"]
		                    .getService(Components.interfaces.nsIPrefService);
		var temp=aName.split('.');
		var root='';
		for( var i=0; i<(temp.length-1); i++ ) {
			root=root+temp[i]+'.';
		}
		prefs=prefs.getBranch(root);
		prefs.setBoolPref(temp[temp.length-1],aValue);
	},
	prefsSetString: function(aName,aValue)
	// EFFECTS: Sets a string preference aName with aValue.
	{
		var prefs=Components.classes["@mozilla.org/preferences-service;1"]
		                    .getService(Components.interfaces.nsIPrefService);
		var temp=aName.split('.');
		var root='';
		for( var i=0; i<(temp.length-1); i++ ) {
			root=root+temp[i]+'.';
		}
		prefs=prefs.getBranch(root);
		prefs.setCharPref(temp[temp.length-1],aValue);
	},
	prefsGetBool: function(aName)
	// EFFECTS: Returns the value of aName.
	{
		var prefs=Components.classes["@mozilla.org/preferences-service;1"]
		                    .getService(Components.interfaces.nsIPrefService);
		var temp=aName.split('.');
		var root='';
		for( var i=0; i<(temp.length-1); i++ ) {
			root=root+temp[i]+'.';
		}
		prefs=prefs.getBranch(root);
		return prefs.getBoolPref(temp[temp.length-1]);
	},
	prefsGetString: function(aName)
	// EFFECTS: Returns the value of aName.
	{ 
		var prefs=Components.classes["@mozilla.org/preferences-service;1"]
		                    .getService(Components.interfaces.nsIPrefService);
		var temp=aName.split('.');
		var root='';
		for( var i=0; i<(temp.length-1); i++ ) {
			root=root+temp[i]+'.';
		}
		prefs=prefs.getBranch(root);
		return prefs.getCharPref(temp[temp.length-1]);
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
