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
const nsISmilies=Components.interfaces.nsISmilies;
const nsISupports=Components.interfaces.nsISupports;
const CLASS_ID=Components.ID("{258adac0-d49a-11da-a94d-0800200c9a66}");
const CLASS_NAME="Smilies Plugin";
const CONTRACT_ID="@shawnwilsher.com/smilies;1";

/* class definition */
function Smilies()
// OVERVIEW: This is the constructor function
{
	this.init();
};
Smilies.prototype = {
	// OVERVIEW: This is the class definition.  Defines the functions
	//           that are exposed in the interface.
	mNames: null,
	mPaths: null,
	mKeys: null,
	mLoaded: false,
	mErrorFileDNE: "File does not exist.",
	mErrorNameDNE: "Name does not exist.",

 /**
  * The status of the component
  * @return true if file loaded, false otherwise
  */
  get ok()
  {
    return this.mLoaded;
  },

	get errorFileDNE()
	// EFFECTS: getter for mErrorFileDNE
	{
		return this.mErrorFileDNE;
	},

	get errorNameDNE()
	// EFFECTS: getter for mErrorNameDNE
	{
		return this.mErrorNameDNE;
	},

	getNames: function(aCount)
	// EFFECTS: returns an iterator for the names
	{
		aCount.value=this.mNames.length;
		return this.mNames;
	},

	getPath: function(aName)
	// EFFECTS: returns the path for the given name
	{
		if( !this.mPaths[aName] )
			throw this.mErrorNameDNE;
		return this.mPaths[aName];
	},

	getKey: function(aName)
	// EFFECTS: returns the keys for the given name
	{
		if( !this.mKeys[aName] )
			throw this.mErrorNameDNE;
		return this.mKeys[aName][0];
	},

	init: function()
	// EFFECTS: Resets invariant
	{
		this.mNames=new Array();
		this.mKeys=new Array();
		this.mPaths=new Array();
	},

	convertText: function(aText)
	// EFFECTS: Converts aText into image tags where appropriate
	{
		var out=aText;
		var key,regEx;
		for( var i in this.mNames ) {
			for( var j in this.mKeys[this.mNames[i]] ) {
				key=this.mKeys[this.mNames[i]][j];
				
				// Cleans up for a good Regular Expression
				key=key.replace(/\)/g,'\\)');
				key=key.replace(/\(/g,'\\(');
				key=key.replace(/\*/g,'\\*');
				key=key.replace(/\?/g,'\\?');
				
				// Making Regular Expression and replacing
				regEx=new RegExp(key,'gi');
				out=out.replace(regEx,'[img]'+this.mPaths[this.mNames[i]]+'[/img]');
			}
		}
		
		return out;
	},

	deconvertText: function(aText)
	// EFFECTS: Does the opposite of convertText
	{
		var out=aText;
		var key,path,regEx;
		for( var i in this.mNames ) {
			// Getting a key for each path
			key=this.mKeys[this.mNames[i]][0];
			path=this.mPaths[this.mNames[i]];
			path='[img]'+path+'[/img]';
			
			// Cleaning up path for Regular Expression
			path=path.replace(/\[/g,'\\[');
			path=path.replace(/\]/g,'\\]');
			
			// Making regular expression and replacing
			regEx=new RegExp(path,'gi');
			out=out.replace(regEx,key);
		}
		
		return out;
	},

	load: function(aFile)
	// EFFECTS: Loads the nsIFile aFile into memory
	{
		// needs to be clear
		this.init();
		
		// Getting data
		var data=this.grabData(aFile);

		// Parsing data
		var parser=Components.classes["@mozilla.org/xmlextras/domparser;1"]
		                     .createInstance(Components.interfaces.nsIDOMParser);
		var doc=parser.parseFromString(data,'text/xml');
		var smilies=this.evaluateXPath(doc,'//smiley[@name and @path]');
		var keys,name,path;
		
		for( var i in smilies ) {
			name=smilies[i].getAttribute('name');
			path=smilies[i].getAttribute('path');
			
			// Getting Keys
			this.mKeys[name]=new Array();
			keys=this.evaluateXPath(smilies[i],'//smiley[@name="'+name+'" and @path="'+path+'"]/key');
			for( var j in keys )
				this.mKeys[name].push(keys[j].firstChild.nodeValue);
			this.mNames.push(name);
			this.mPaths[name]=path;
		}

		this.mLoaded=true;
	},

	validateFile: function(aFile)
	// EFFECTS: returns true if the file passed is a valid smiley file, false otherwise
	{
		var data=this.grabData(aFile);

		// Parsing data
		var parser=Components.classes["@mozilla.org/xmlextras/domparser;1"]
		                     .createInstance(Components.interfaces.nsIDOMParser);
		var doc=parser.parseFromString(src,'text/xml');
		var smilies=this.evaluateXPath(doc,'//smiley[@name and @path]/key');

		// Checking
		if( smilies.lenght>=1 )
			return true;
		else
			return false;
	},

	grabData: function(aFile)
	// EFFECTS: retunrs the string data located in aFile
	{
		// Checking to make sure it's there
		if( !aFile.exists() ) {
			throw this.mErrorFileDNE;
		}

		var src="";
		var fstream=Components.classes["@mozilla.org/network/file-input-stream;1"]
		                      .createInstance(Components.interfaces.nsIFileInputStream);
		var sstream=Components.classes["@mozilla.org/scriptableinputstream;1"]
		                      .createInstance(Components.interfaces.nsIScriptableInputStream);
		fstream.init(aFile,1,0,false);
		sstream.init(fstream); 

		// Grabbing data
		var str = sstream.read(-1);
		while( str.length>0 ) {
			src+=str;
			str=sstream.read(-1);
		}
		
		sstream.close();
		fstream.close();

		return src;
	},

	evaluateXPath: function(aNode,aExpr)
	// EFFECTS: returns an array of the DOM nodes from aNode specified by aExpr
	{
		var xpe=Components.classes["@mozilla.org/dom/xpath-evaluator;1"]
		                  .createInstance(Components.interfaces.nsIDOMXPathEvaluator);;
		var nsResolver=xpe.createNSResolver(aNode.ownerDocument==null?
		                                    aNode.documentElement:aNode.ownerDocument.documentElement);
		var result=xpe.evaluate(aExpr,aNode,nsResolver,0,null);
		var found=[];
		var res;
		while( res=result.iterateNext() ) {
			found.push(res);
		}
		return found;
	},

	QueryInterface: function(aIID)
	{
		if( !aIID.equals(nsISmilies) && !aIID.equals(nsISupports) )
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};

/* class factory (hey, I didn't name it) */
var SmiliesFactory = {
	createInstance: function(aOuter,aIID)
	{
		if( aOuter!=null )
			throw Components.results.NS_ERROR_NO_AGGREGATION;
		return (new Smilies()).QueryInterface(aIID);
	}
};

/* module definition (xpcom registration) */
var SmiliesModule = {
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
			return SmiliesFactory;

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
	return SmiliesModule;
}
