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
const nsISmilies  = Components.interfaces.nsISmilies;
const nsISupports = Components.interfaces.nsISupports;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

/* class definition */
function Smilies()
// OVERVIEW: This is the constructor function
{
  this.init();
};
Smilies.prototype =
{
  classDescription: "Smilies Plugin",
  classID: Components.ID("{258adac0-d49a-11da-a94d-0800200c9a66}"),
  contractID: "@shawnwilsher.com/smilies;1",
  QueryInterface: XPCOMUtils.generateQI([nsISmilies]),

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

 /**
  * Sets the object to a fresh state
  */
  init: function()
  {
    this.mNames = new Array();
    this.mKeys = new Array();
    this.mPaths = new Array();
    this.mLoaded = false;
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

 /**
  * Function determines if a file is a valid smiley file
  *
  * @param aFile The nsIFile of the file to be tested.
  * @return Boolean value indiciating if aFile is valid.
  */
  validateFile: function(aFile)
  {
    var data = this.grabData(aFile);

    // Parsing data
    var parser = Components.classes["@mozilla.org/xmlextras/domparser;1"]
                           .createInstance(Components.interfaces.nsIDOMParser);
    var doc = parser.parseFromString(data, 'text/xml');
    var smilies = this.evaluateXPath(doc, '//smiley[@name and @path]/key');

    // Checking
    return smilies.length >= 1;
  },

 /**
  * Obtains the string data from the given file
  *
  * @param aFile A nsIFile that the data will be pulled from
  * @return The text of the file
  */
  grabData: function grabData(aFile)
  {
    const PR_RDONLY = 0x01;
    // Checking to make sure it's there
    if (!aFile.exists()) throw this.mErrorFileDNE;

    var src = "";
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
                            .createInstance(Components.interfaces.nsIFileInputStream);
    var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
                            .createInstance(Components.interfaces.nsIScriptableInputStream);
    fstream.init(aFile, PR_RDONLY, 0600, false);
    sstream.init(fstream); 

    // Grabbing data
    var str = sstream.read(-1);
    while (str.length > 0) {
      src += str;
      str = sstream.read(-1);
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
  }
};

var components = [Smilies];

/**
* XPCOMUtils.generateNSGetFactory was introduced in Mozilla 2 (Firefox 4).
* XPCOMUtils.generateNSGetModule is for Mozilla 1.9.2 (Firefox 3.6).
*/
if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule(components);
