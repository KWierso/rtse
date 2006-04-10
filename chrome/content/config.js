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

function RTSE_Config() {
	/* Object used to load config data						*
	 * Only public members are get, set, setMult, and load	*/
	
	this._settings=new Array();
	this._names=new Array();
	
	this.get=function(name,def) {
		/* Used to get a setting */
		if( this._settings[name] )
			return(this._settings[name].value);
		else
			return(def);
	}

	this.set=function(name,value) {
		/* Sets a setting with this._set, then saves the new file */
		this._set(name,value);
		var doc=this._constructDoc()
		this._save(doc);
	}

	this.setMult=function(names,values) {
		/* Same as set, but takes a set of arrays, then sets the values */
		for( var i in names ) {
			this._set(names[i],values[i]);
		}
		var doc=this._constructDoc();
		this._save(doc);
	}

	this._save=function(doc) {
		/* Used to save the config file. */
		var foStream=Components.classes["@mozilla.org/network/file-output-stream;1"]
				               .createInstance(Components.interfaces.nsIFileOutputStream);
		var file=Components.classes["@mozilla.org/file/directory_service;1"]
				           .getService(Components.interfaces.nsIProperties)
				           .get("ProfD", Components.interfaces.nsIFile); // get profile folder
		file.append("rtse");
		file.append("config.xml");
		foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);   // write, create, truncate
		foStream.write(doc,doc.length);
		foStream.close();		
	}

	this._set=function(name,value) {
		/* Private member that updates the settings of this._settings - Does not apply changes to file */
		if( this._settings[name] && value!='' ) {
			this._settings[name].value=value;
		} else if( value!='' ) {
			var setting=new RTSE_Setting(name,value);
			this._settings[name]=setting;
			this._names.push(name);
		}
	}

	this._constructDoc=function() {
		/* Called to construct the document to be saved */
		var config='<?xml version="1.0" ?><config>';
		var name;
		var value;
		var ind;
		for( var i in this._names ) {
			ind=this._names[i];
			name=new String(this._settings[ind].name);
			value=new String(this._settings[ind].value);
			config+='<setting name="'+name+'">';
			config+=value+'</setting>';
		}
		config+='</config>';
		return(config);
	}
	
	this.load=function() {
		/* Code that loads config.xml */
		var file=Components.classes["@mozilla.org/file/directory_service;1"]
		                   .getService(Components.interfaces.nsIProperties)
		                   .get("ProfD", Components.interfaces.nsIFile);
		file.append("rtse");
		file.append("config.xml");
		if( !file.exists() ) {
			this._createConfig();
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
		var settings=RTSE_evaluateXPath(doc,'//setting[@name]');
		var setting;
		var name;
		
		for( var i in settings ) {
			name=settings[i].getAttribute('name');
			setting=new RTSE_Setting(name,settings[i].firstChild.data);
			this._names.push(name);
			this._settings[name]=setting;
		}
	}

	this._createConfig=function() {
		/* Creates Directory (if needed) and copies the default config.xml file */
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
		ext.append("config.xml");
		ext.copyTo(file,"config.xml");
	}

	this.observe=function(aSubject,aTopic,aData) {
		/* Observer for a reloading config */
		if(!RTSE) return;
		var value=RTSE.prefs.get.bool(aData);
		if(value)
			RTSE.config.load();
		RTSE.prefs.observe.unregister(aData,RTSE.config);
		RTSE.prefs.set.bool(aData,false);
		RTSE.prefs.observe.register(aData,RTSE.config);

		return(true);
	}
}

function RTSE_Setting(name,value) {
	/* Object used for each setting */
	this.name=name;
	this.value=value;
}
