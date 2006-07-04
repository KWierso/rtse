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

/**
 * Object used to manage the editor
 */
RTSE.editor = {
  /////////////////////////////////////////////////////////////////////////////
  //// Private Variables

  mOk: false,

  /////////////////////////////////////////////////////////////////////////////
  //// Functions

 /**
  * Initializes everything for the editor to work properly
  */
  init: function init()
  {
    var elm = document.getElementById("rtse-statusbar-editor");
    elm.addEventListener("click", RTSE.editor.toggleEditor, false);

    gBrowser.mPanelContainer.addEventListener("DOMContentLoaded",
                                              RTSE.editor.toggleIcon,
                                              false);
    gBrowser.mPanelContainer.addEventListener("select",
                                              RTSE.editor.toggleIcon,
                                              false);
    gBrowser.mPanelContainer.addEventListener("DOMContentLoaded",
                                              RTSE.editor.toggleEditor,
                                              false);
    gBrowser.mPanelContainer.addEventListener("select",
                                              RTSE.editor.toggleEditor,
                                              false);

    this.mOk = true;
  },

 /**
  * Determines if the icon should be visable.  Should only be called from an
  *  event listener
  * @param aEvent The event passed to the function
  */
  toggleIcon: function toggleIcon(aEvent)
  {
    var show = false;
    var doc = gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex)
                      .contentDocument;
    if (/^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com(.*)?$/.test(doc.location.href)) {
      show = doc.getElementById("Add a Comment") ||
             doc.getElementById("Make a Journal Entry") ||
             doc.getElementById("Edit Journal Entry") ||
             doc.getElementById("Add a New Topic") ||
             doc.getElementById("Reply") ||
             doc.getElementById("Send a Message") ||
             doc.getElementById("Post") ||
             doc.getElementById("Edit") ||
             doc.getElementById("Edit Post");
      if (!doc.editor) doc.editor = new RTSE_editor();
    }
    document.getElementById("rtse-statusbar-editor").hidden = !show;
  },

 /**
  * Shows/hides the editor and preview pane
  * @param aEvent The event passed to the function
  */
  toggleEditor: function toggleEditor(aEvent)
  {
    var doc = gBrowser.getBrowserAtIndex(gBrowser.mTabContainer.selectedIndex)
                      .contentDocument;
    var pane = document.getElementById("rtse-realtimeEditor");
    if (!doc.editor) {
      pane.hidden = true;
      return;
    }
    var win = {
      height: gBrowser.contentWindow.innerHeight,
      width: gBrowser.contentWindow.innerWidth
    };
    pane.setAttribute("height", Math.floor(win.height/4));

    // updating values
    document.getElementById("rtse-editor-body").value = doc.editor.body;
    document.getElementById("rtse-editor-title").value = doc.editor.title;

    // toggle visibility
    pane.hidden = aEvent.type == "click" ? !pane.hidden : !doc.editor.visible;
    doc.editor.visible = !pane.hidden;
  },

  /////////////////////////////////////////////////////////////////////////////
  //// Attributes

 /**
  * Indicates if the object is ready yet
  * @return The status of the object (true or false)
  */
  get ok()
  {
    return this.mOk;
  }
};
