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
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

if( !gRTSE )
	var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
	                    .createInstance(Components.interfaces.nsIRTSE);
function Smilies() {
	/* Object used to load Smiley data */
	
	this._keys=new Array();
	this.names=new Array();
	this._paths=new Array();

	this.load=function() {
		/* Code that loads config.xml */
		try {
			var file=Components.classes["@mozilla.org/file/directory_service;1"]
			                   .getService(Components.interfaces.nsIProperties)
			                   .get("ProfD", Components.interfaces.nsIFile);
			file.append("rtse");
			file.append("smilies.xml");
			if( !file.exists() ) {
				this._createFile();
			}
			var src="";
			var fstream=Components.classes["@mozilla.org/network/file-input-stream;1"]
			                      .createInstance(Components.interfaces.nsIFileInputStream);
			var sstream=Components.classes["@mozilla.org/scriptableinputstream;1"]
			                      .createInstance(Components.interfaces.nsIScriptableInputStream);
			fstream.init(file,1,0,false);
			sstream.init(fstream); 
		
			var str = sstream.read(-1);
			while( str.length>0 ) {
				src+=str;
				str=sstream.read(-1);
			}
		
			sstream.close();
			fstream.close();

			var parser=new DOMParser();
			var doc=parser.parseFromString(src,'text/xml');
			var smilies=RTSE_evaluateXPath(doc,'//smiley[@name and @path]');
			var name,path,keys;
		
			for( var i in smilies ) {
				name=smilies[i].getAttribute('name');
				path=smilies[i].getAttribute('path');
				this.names.push(name);
				this._paths[name]=path;
				keys=RTSE_evaluateXPath(smilies[i],'//smiley[@name="'+name+'" and @path="'+path+'"]/key');;
				this._keys[name]=new Array();
				for( var j in keys )
					this._keys[name].push(keys[j].firstChild.nodeValue);
			}
		} catch(e) {
			gRTSE.sendReport(e);
		}
	}

	this.getKeys=function(name) {
		/* Returns the keys for give smiley */
		return(this._keys[name]);
	}

	this.getPath=function(name) {
		/* Returns the path for give smiley */
		return(this._paths[name]);
	}

	this._createFile=function() {
		/* Creates Directory (if needed) and copies the default smilies.xml file */
		try {
			const id="RTSE@shawnwilsher.com"
			var file=Components.classes["@mozilla.org/file/directory_service;1"]
			                   .getService(Components.interfaces.nsIProperties)
			                   .get("ProfD", Components.interfaces.nsIFile);
			file.append("rtse");	// Directory Name
			if( !file.exists() ) {	// If it doesn't exist, create
				file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0664);
			}

			var ext=Components.classes["@mozilla.org/extensions/manager;1"]
			                  .getService(Components.interfaces.nsIExtensionManager)
			                  .getInstallLocation(id)
			                  .getItemLocation(id);
			ext.append("defaults");
			ext.append("smilies.xml");
			ext.copyTo(file,"smilies.xml");
		} catch(e) {
			gRTSE.sendReport(e);
		}
	}
}
