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

var link = {
	load: function() {
		/* Runs on load */
		var editor=window.arguments[0];
		var doc=window.opener.wrappedJSObject.document;
		var text=doc.getElementById('body');
		if( text.selectionStart!=text.selectionEnd ) {
			/* Text is selected */
			var value=text.value.substring(text.selectionStart,text.selectionEnd);
			document.getElementById('text').value=value;
		}
	},

	onaccept: function() {
		/* Run on accept */
		var url=document.getElementById('url').value;
		var text=document.getElementById('text').value;
		return(window.arguments[0]._addLink(url,text));
	},

	oncancel: function() {
		/* Run on cancel */
		return(window.arguments[0]._focus());
	}
}
