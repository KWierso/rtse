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

const Cc = Components.classes;
const Ci = Components.interfaces;
var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
                    .getService(Components.interfaces.nsIRTSE);
var wizard = {
  // used for the Setup Wizard

 /**
  * Applies the settings from the Setup Wizard
  * @return true if successful, false if failure.
  */
  apply: function apply() {
    try {
      // Editor
      gRTSE.prefsSetBool("extensions.rtse.editor",
                         document.getElementById("editor").checked);

      // "In reply to" text when quoting
      gRTSE.prefsSetBool("extensions.rtse.editor.quoteReply", 
                         document.getElementById("replytext").checked)

      // Sidebar/Header/FriendsJournal
      gRTSE.prefsSetBool("extensions.rtse.sidebar",
                         document.getElementById("sidebar").checked);
      gRTSE.prefsSetBool("extensions.rtse.header",
                         document.getElementById("header").checked);
      gRTSE.prefsSetBool("extensions.rtse.journals",
                         document.getElementById("journal").checked);

      // userInfo extra links
      if(!document.getElementById("userInfo").checked) {
        gRTSE.prefsSetBool("extensions.rtse.link.enabled", false);
      }

      // Finishing up
      gRTSE.prefsSetBool('extensions.rtse.firstInstall',false);
    } catch(e) {
      alert("We're sorry, but an error occured.");
      Components.utils.reportError(e);
    }
    return true;
  }
}
