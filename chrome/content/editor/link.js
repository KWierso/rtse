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
 *   Shawn Wilsher
 *
 * Portions created by the Initial Developer are Copyright (C) 2005-2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

///////////////////////////////////////////////////////////////////////////////
//// Global Variables

var gRTSE = Components.classes['@shawnwilsher.com/rtse;1']
                      .createInstance(Components.interfaces.nsIRTSE);
var dialog;

///////////////////////////////////////////////////////////////////////////////
//// Initialization/Destruction

window.addEventListener("load", LinkDialog_initialize, false);

function LinkDialog_initialize()
{
  dialog = new LinkDialog();
  dialog.initialize();
}

///////////////////////////////////////////////////////////////////////////////
//// class LinkDialog

function LinkDialog()
{
  this.mData = window.arguments[0];

  this.url   = document.getElementById("tx_url");
  this.label = document.getElementById("tx_label");
}

LinkDialog.prototype =
{
 /**
  * This function initializes the content of the dialog.
  */
  initialize: function initialize()
  {
    this.url.value   = this.mData.url;
    this.label.value = this.mData.label;

    this.url.focus();
  },

 /**
  * The function that is called on accept.  Sets data.
  */
  accept: function accept()
  {
    this.mData.url      = this.url.value;
    this.mData.label    = this.label.value;
    this.mData.accepted = true;
    return true;
  }
}
