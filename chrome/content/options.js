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

var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
                    .createInstance(Components.interfaces.nsIRTSE);
function apply() {
	var i;

	/* Function used to store and changes to prefs */
	this.config=new RTSE_Config();
	this.config.load();
	
	var names=new Array();
	var values=new Array();
	
	/* Username */
	gRTSE.prefsSetString('extensions.rtse.username',document.getElementById('username').value);
	
	/* Password */
	names.push('pwd');
	values.push(document.getElementById('pwd').value);

	/* Auto-Login */
	if( document.getElementById('signin').checked )
		gRTSE.prefsSetBool('extensions.rtse.autologin',true);
	else
		gRTSE.prefsSetBool('extensions.rtse.autologin',false);

	/* Sponsor */
	if( document.getElementById('sponsor').checked )
		gRTSE.prefsSetBool('extensions.rtse.sponsor',true);
	else
		gRTSE.prefsSetBool('extensions.rtse.sponsor',false);

	/* Themer */
	if( document.getElementById('theme').checked ) {
		gRTSE.prefsSetBool('extensions.rtse.themer',true);
		gRTSE.prefsSetString('extensions.rtse.themeType',document.getElementById('themeType').selectedItem.value);
	} else {
		gRTSE.prefsSetBool('extensions.rtse.themer',false);
	}

	/* Link Fixer */
	if( document.getElementById('linkFix').checked )
		values.push('true');
	else
		values.push('false');
	names.push('linkFix');

	/* Topic Filter */
	var ref=document.getElementById('forumList').childNodes;
	for( i=(ref.length-1); i>=0; i-- ) {
		if( ref[i].firstChild.tagName=='checkbox' ) {
			names.push('show_ftopic_'+ref[i].firstChild.getAttribute('value'));
			if( ref[i].firstChild.checked )
				values.push('true');
			else
				values.push('false');
		}
	}

	/* Editor */
	if( document.getElementById('editor').checked )
		gRTSE.prefsSetBool('extensions.rtse.editor',true);
	else
		gRTSE.prefsSetBool('extensions.rtse.editor',false);

	/* Smilies */
	if( document.getElementById('smilies').checked )
		values.push('true');
	else
		values.push('false');
	names.push('smilies');

	/* Same-page Reply */
	if( document.getElementById('same_page_reply').checked )
		values.push('true');
	else
		values.push('false');
	names.push('same_page_reply');

	/* apply changes, change pref, and exit */
	this.config.setMult(names,values);
	gRTSE.prefsSetBool('reload',true,'extensions.rtse.config.');
	return true;
}

function load() {
	/* Function ran at load to set values */
	this.config=new RTSE_Config();
	this.config.load();

	// Load Smilies Preview
	displaySmilies();

	var i;
	
	/* Username */
	document.getElementById('username').value=gRTSE.prefsGetString('extensions.rtse.username');
	
	/* Password */
	document.getElementById('pwd').value=this.config.get('pwd','');
	
	/* Auto-Login */
	if( gRTSE.prefsGetBool('extensions.rtse.autologin')==false )
		document.getElementById('signin').checked=false;
	else
		document.getElementById('signin').checked=true;
	
	/* Sponsor */
	if( gRTSE.prefsGetBool('extensions.rtse.sponsor')==false )
		document.getElementById('sponsor').checked=false;
	else
		document.getElementById('sponsor').checked=true;
	
	/* Themer */
	if( gRTSE.prefsGetBool('extensions.rtse.themer') ) {
		document.getElementById('themeType').value=gRTSE.prefsGetString('extensions.rtse.themeType');
		document.getElementById('theme').checked=true;
	} else {
		document.getElementById('themeType').disabled=true;
		document.getElementById('theme').checked=false;
	}
	document.getElementById('theme').addEventListener('CheckboxStateChange',theme,false);
	
	/* Link Fixer */
	if( this.config.get('linkFix','true')=='true' )
		document.getElementById('linkFix').checked=true;
	else
		document.getElementById('linkFix').checked=false;
	
	/* Topic Filter */
	var ref=document.getElementById('forumList').childNodes;
	for( i=(ref.length-1); i>=0; i-- ) {
		if( ref[i].firstChild.tagName=='checkbox' && this.config.get('show_ftopic_'+ref[i].firstChild.getAttribute('value'),'true')=='true' )
			ref[i].firstChild.checked=true;
		else
			ref[i].firstChild.checked=false;
	}

	/* Editor */
	if( gRTSE.prefsGetBool('extensions.rtse.editor') )
		document.getElementById('editor').checked=true;
	else
		document.getElementById('editor').checked=false;

	/* Smilies */
	if( this.config.get('smilies','true')=='true' )
		document.getElementById('smilies').checked=true;
	else
		document.getElementById('smilies').checked=false;
	
	/* Same page reply */
	if( this.config.get('same_page_reply','false')=='true' )
		document.getElementById('same_page_reply').checked=true;
	else
		document.getElementById('same_page_reply').checked=false;
}

function theme() {
	/* Function called when 'theme' is enabled or disabled */
	if( document.getElementById('theme').checked ) {
		document.getElementById('themeType').disabled=false
	} else {
		document.getElementById('themeType').disabled=true;
	}
}

function smilieFilePicker(aWin)
// EFFECTS: Displays the dialog to select the file for a new smiley pack
{
	var picker=Components.classes['@mozilla.org/filepicker;1']
	                     .createInstance(Components.interfaces.nsIFilePicker);
	picker.appendFilters(picker.filterXML);
	picker.init(aWin,'Select Smiley File',picker.modeOpen);
	var ok=picker.show();
	if( ok==picker.returnOK )
		/* stuff that loads goes here */;
}

function displaySmilies()
// EFFECTS: Generates preview of currently loaded smilies
{
	var s=Components.classes["@shawnwilsher.com/smilies;1"]
	                .getService(Components.interfaces.nsISmilies);
	var ref=document.getElementById('smileyPreview');
	var names=s.getNames({});
	// remove any existing children
	while( ref.lastChild ) {
		ref.removeChild(ref.lastChild);
	}

	// add new
	var item,img,label,box;
	for( var i in names ) {
		item=document.createElement('richlistitem');
		box=document.createElement('hbox');

		img=document.createElement('image');
		img.setAttribute('src',s.getPath(names[i]));
		box.appendChild(img);

		label=document.createElement('label');
		label.setAttribute('value',names[i]);
		box.appendChild(label);

		item.appendChild(box);
		ref.appendChild(item);
	}
}
