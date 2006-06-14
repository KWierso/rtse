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
 * Portions created by the Initial Developer are Copyright (C) 2005-2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
                    .createInstance(Components.interfaces.nsIRTSE);
var wizard = {
	// used for the Setup Wizard

 /**
  * Applies the settins from the Setup Wizard
  * @return true if successful, false if failure.
  */
	apply: function apply() {
		try {
			// Username
			var user = document.getElementById('username').value;
      gRTSE.prefsSetString('extensions.rtse.username', user);

			// Password
			var pm = Components.classes["@mozilla.org/passwordmanager;1"]
                         .getService(Components.interfaces.nsIPasswordManager);
      pm.addUser('rtse', user, document.getElementById('pwd').value);

			// Auto Sign In
			gRTSE.prefsSetBool('extensions.rtse.signin', document.getElementById('signin').checked);
		
			// Sponsor
			gRTSE.prefsSetBool('extensions.rtse.sponsor', document.getElementById('sponsor').checked);

			// themer
			if (document.getElementById('theme').checked) {
				gRTSE.prefsSetBool('extensions.rtse.themer', true);
				gRTSE.prefsSetString('extensions.rtse.themeType', document.getElementById('themeType').selectedItem.value);
			} else {
				gRTSE.prefsSetBool('extensions.rtse.themer', false);
			}

			// Editor
			gRTSE.prefsSetBool('extensions.rtse.editor', document.getElementById('editor').checked);

      // Talkback
      gRTSE.prefsSetBool('extensions.rtse.talkback', document.getElementById('talkback').checked);

			// Finishing up
      gRTSE.prefsSetBool('extensions.rtse.firstInstall',false);
			return true;
		} catch(e) {
			alert("We're sorry, but an error occured.");
      return false;
		}
	}
}
