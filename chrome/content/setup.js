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

var RTSE=window.arguments[0];
var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
                    .createInstance(Components.interfaces.nsIRTSE);
var wizard = {
	/* used for the Setup Wizard */
	apply: function() {
		/* Applies Settings */
		try {
			var names=new Array();
			var values=new Array();
		
			/* username */
			names.push('username');
			values.push(document.getElementById('username').value);

			/* password */
			names.push('pwd');
			values.push(document.getElementById('pwd').value);

			/* auto login */
			if( document.getElementById('signin').checked )
				values.push('true');
			else
				values.push('false');
			names.push('signin');
		
			/* sponsor */
			if( document.getElementById('sponsor').checked )
				values.push('true');
			else
				values.push('false');
			names.push('sponsor');

			/* themer */
			if( document.getElementById('theme').checked ) {
				values.push('true');
				names.push('theme');
				names.push('themeType');
				values.push(document.getElementById('themeType').selectedItem.value);
			} else {
				values.push('false');
				names.push('theme');
			}

			/* editor */
			if( document.getElementById('editor').checked )
				values.push('true');
			else
				values.push('false');
			names.push('editor');

			names.push('firstInstall');
			values.push('false');
			RTSE.config.setMult(names,values);

			return(true);
		} catch(e) {
			gRTSE.sendReport(e);
		}
	}
}
