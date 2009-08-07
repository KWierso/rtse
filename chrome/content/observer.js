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

var RTSE_PrefsChangeObserver =
{
  observe: function observe(aSubject, aTopic, aData)
  {
    switch (aData) {
      case "extensions.rtse.username":
      case "extensions.rtse.sponsor":
      case "extensions.rtse.smilies":
        RTSE.editor.setup();
        break;
      case "extensions.rtse.header":
      case "extensions.rtse.sidebar":
      case "extensions.rtse.journals":
        RTSE.registerStyleSheets();
        break;
    }
  }
};
