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


function apply() {
	var i;

	/* Function used to store and changes to prefs */
	RTSE.config=new RTSE_Config();
	RTSE.config.load();
	
	var names=new Array();
	var values=new Array();
	
	/* Username */
	names.push('username');
	values.push(document.getElementById('username').value);
	
	/* Password */
	names.push('pwd');
	values.push(document.getElementById('pwd').value);

	/* Auto-Login */
	if( document.getElementById('signin').checked )
		values.push('true');
	else
		values.push('false');
	names.push('signin');

	/* Sponsor */
	if( document.getElementById('sponsor').checked )
		values.push('true');
	else
		values.push('false');
	names.push('sponsor');

	/* Themer */
	if( document.getElementById('theme').checked ) {
		values.push('true');
		names.push('theme');
		names.push('themeType');
		values.push(document.getElementById('themeType').selectedItem.value);
	} else {
		values.push('false');
		names.push('theme');
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
		values.push('true');
	else
		values.push('false');
	names.push('editor');

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
	RTSE.config.setMult(names,values);
	RTSE.prefs.set.bool('config.reload',true);
	return true;
}

function load() {
	/* Function ran at load to set values */
	RTSE.config=new RTSE_Config();
	RTSE.config.load();

	var i;
	
	/* Username */
	document.getElementById('username').value=RTSE.config.get('username','');
	
	/* Password */
	document.getElementById('pwd').value=RTSE.config.get('pwd','');
	
	/* Auto-Login */
	if( RTSE.config.get('signin','false')=='false' )
		document.getElementById('signin').checked=false;
	else
		document.getElementById('signin').checked=true;
	
	/* Sponsor */
	if( RTSE.config.get('sponsor','false')=='false' )
		document.getElementById('sponsor').checked=false;
	else
		document.getElementById('sponsor').checked=true;
	
	/* Themer */
	if( RTSE.config.get('theme','false')=='true' ) {
		document.getElementById('themeType').value=RTSE.config.get('themeType','www');
		document.getElementById('theme').checked=true;
	} else {
		document.getElementById('themeType').disabled=true;
		document.getElementById('theme').checked=false;
	}
	document.getElementById('theme').addEventListener('CheckboxStateChange',theme,false);
	
	/* Link Fixer */
	if( RTSE.config.get('linkFix','true')=='true' )
		document.getElementById('linkFix').checked=true;
	else
		document.getElementById('linkFix').checked=false;
	
	/* Topic Filter */
	var ref=document.getElementById('forumList').childNodes;
	for( i=(ref.length-1); i>=0; i-- ) {
		if( ref[i].firstChild.tagName=='checkbox' && RTSE.config.get('show_ftopic_'+ref[i].firstChild.getAttribute('value'),'true')=='true' )
			ref[i].firstChild.checked=true;
		else
			ref[i].firstChild.checked=false;
	}

	/* Editor */
	if( RTSE.config.get('editor','true')=='true' )
		document.getElementById('editor').checked=true;
	else
		document.getElementById('editor').checked=false;

	/* Smilies */
	if( RTSE.config.get('smilies','true')=='true' )
		document.getElementById('smilies').checked=true;
	else
		document.getElementById('smilies').checked=false;
	
	/* Same page reply */
	if( RTSE.config.get('same_page_reply','false')=='true' )
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
