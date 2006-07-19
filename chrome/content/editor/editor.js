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
    gBrowser.mPanelContainer.addEventListener("DOMContentLoaded",
                                              RTSE.editor.initDoc,
                                              false);

    // Visibility
    if (gRTSE.prefsGetBool("extensions.rtse.sponsor")) {
      document.getElementById("rtse-editor-sponsorSmilies").hidden = false;
    }

    // Event Listeners
    var focus, blur;
    var title = document.getElementById("rtse-editor-title").inputField;
    focus = function focus() {
      if (this.value == RTSE.editor.defaultTitle) this.value = "";
        this.style.borderColor = "";
    };
    blur = function blur() {
        if (this.value == "") {
          this.value = RTSE.editor.defaultTitle;
          this.style.borderColor = '#FF0000';
        }
    };
    title.addEventListener("focus", focus, false);
    title.addEventListener("blur", blur, false);

    this.mOk = true;
  },

 /**
  * Initializes a document for the editor
  *
  * @param aEvent The event passed to the function
  */
  initDoc: function initDoc(aEvent)
  {
    var doc = aEvent.originalTarget;
    if (!/^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com(.*)?$/.test(doc.location.href))
      return;
    var form = doc.createElement("form");
    form.setAttribute("name", "rtse");
    form.setAttribute("style", "display: none;");
    doc.getElementsByTagName("body")[0].appendChild(form);

    form = doc.forms.namedItem("rtse");
    var elms = ["visible", "body", "show-body", "title", "show-title",
                "friendsOnly", "show-friendsOnly"];
    var vals = ["false", "", "true", "", "false", "", "false"];
    for (var i in elms) {
      var elm = doc.createElement("input");
      elm.setAttribute("type", "hidden");
      elm.setAttribute("name", elms[i]);
      form.appendChild(elm);
    }

    // Inserting
    RTSE.editor.insert(doc);
  },

 /**
  * Determines if the icon should be visable.  Should only be called from an
  *  event listener
  *
  * @param aEvent The event passed to the function
  */
  toggleIcon: function toggleIcon(aEvent)
  {
    var show = false;
    var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
    var doc = browser.contentDocument;
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
    }
    document.getElementById("rtse-statusbar-editor").hidden = !show;
  },

 /**
  * Shows/hides the editor and preview pane
  *
  * @param aEvent The event passed to the function
  */
  toggleEditor: function toggleEditor(aEvent)
  {
    var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
    var doc = browser.contentDocument;
    var pane = document.getElementById("rtse-realtimeEditor");
    if (!doc.forms.namedItem("rtse")) {
      pane.hidden = true;
      return;
    }
    /*var win = {
      height: gBrowser.contentWindow.innerHeight,
      width: gBrowser.contentWindow.innerWidth
    };
    pane.setAttribute("height", Math.floor(win.height/4));*/

    // updating values
    if (pane.hidden) {
      document.getElementById("rtse-editor-body").value =
        RTSE.editor.getProperty(doc, "body");
      document.getElementById("rtse-editor-title").value =
        RTSE.editor.getProperty(doc, "title");
    } else {
      RTSE.editor.setProperty(doc, "body",
                    document.getElementById("rtse-editor-body").value);
      RTSE.editor.setProperty(doc, "title",
                    document.getElementById("rtse-editor-title").value);
    }

    // Visibility of certain elements
    document.getElementById("rtse-editor-title").hidden =
      RTSE.editor.getProperty(doc, "show-title") != "true";
    document.getElementById("rtse-editor-friendsOnly").hidden =
      RTSE.editor.getProperty(doc, "show-friendsOnly") != "true";

    // toggle visibility
    pane.hidden = aEvent.type == "click" ? !pane.hidden :
                    RTSE.editor.getProperty(doc, "visible") != "true";
    RTSE.editor.setProperty(doc, "visible", !pane.hidden);
    document.getElementById("rtse-editor-body").focus();
  },

 /**
  * Obtains the specified property for the editor
  *
  * @param aDoc The document which we are checking
  * @param aProp The property to be gotten
  * @return The value of the property
  */
  getProperty: function getProperty(aDoc, aProp)
  {
    var form = aDoc.forms.namedItem("rtse");
    return form.elements.namedItem(aProp).value;
  },

 /**
  * Sets the specified property for the editor
  *
  * @param aDoc The document which we are using
  * @param aProp The property to be set
  * @param aValue The value the property is to be set to
  * @return The value of the property
  */
  setProperty: function setProperty(aDoc, aProp, aValue)
  {
    var form = aDoc.forms.namedItem("rtse");
    return form.elements.namedItem(aProp).value = aValue;
  },

 /**
  * Inserts the editor box into the document
  *
  * @param aDoc The document to be checked to insert the editor
  */
  insert: function insert(aDoc)
  {
    if (!gRTSE.prefsGetBool('extensions.rtse.editor')) return;
    const DATA = new Array("body", "title", "friendsOnly");
    var form = aDoc.forms.namedItem('post');
    if (!form) throw 'Form not available';

    var ref = aDoc.getElementById("Add a Comment") ||
              aDoc.getElementById("Make a Journal Entry") ||
              aDoc.getElementById("Edit Journal Entry") ||
              aDoc.getElementById("Add a New Topic") ||
              aDoc.getElementById("Reply") ||
              aDoc.getElementById("Send a Message") ||
              aDoc.getElementById("Post") ||
              aDoc.getElementById("Edit") ||
              aDoc.getElementById("Edit Post");
    if (!ref) throw 'Editor cannot be inserted';

    for (var i = (DATA.length - 1); i >= 0; --i) {
      if (form.elements.namedItem(DATA[i])) {
        var value = form.elements.namedItem(DATA[i]).value
        RTSE.editor.setProperty(aDoc, DATA[i], value);
        RTSE.editor.setProperty(aDoc, "show-" + DATA[i], "true");
      } else
        RTSE.editor.setProperty(aDoc, "show-" + DATA[i], "false");
    }
    if (RTSE.editor.getProperty(aDoc, "show-title") == "true" &&
        RTSE.editor.getProperty(aDoc, "title") == "")
      RTSE.editor.setProperty(aDoc, "title", RTSE.editor.defaultTitle);
  },

  /////////////////////////////////////////////////////////////////////////////
  //// Attributes

 /**
  * Indicates if the object is ready yet
  *
  * @return The status of the object (true or false)
  */
  get ok()
  {
    return this.mOk;
  },

 /**
  * The default text for a title
  *
  * @return The text for an unentered title
  */
  get defaultTitle()
  {
    return "Please Specify a Title";
  }
};
