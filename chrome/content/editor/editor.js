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
    var toggle = function toggle() {
      if (this.checked) {
        this.image = "chrome://rtse/content/images/locked.png";
        this.tooltip = "rtse-editor-tooltip-locked";
      } else {
        this.image = "chrome://rtse/content/images/unlocked.png";
        this.tooltip = "rtse-editor-tooltip-unlocked";
      }
    };
    document.getElementById("rtse-editor-friendsOnly")
            .addEventListener("command", toggle, false);

    document.getElementById("rtse-editor-body")
            .addEventListener("keypress", RTSE.editor.keypressListener, false);

    // Smilies
    if (gRTSE.prefsGetBool("extensions.rtse.smilies")) {
      var smilies = RTSE.smilies.items;
      const XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
      var menu = document.createElementNS(XUL, "menupopup");
      var mi, key;
      for (var i in smilies) {
        mi = document.createElementNS(XUL, "menuitem");
        mi.setAttribute("image", smilies[i].path);
        mi.setAttribute("label", smilies[i].name);
        mi.setAttribute("validate", "never");
        mi.setAttribute("class", "menuitem-iconic");
        mi.setAttribute("key", smilies[i].key);
        mi.addEventListener("command", function() {
          RTSE.editor.insertTag(this.getAttribute("key"));
        }, false);
        menu.appendChild(mi);
      }

      var elm = document.getElementById("rtse-editor-smiley")
      elm.appendChild(menu);
      elm.setAttribute("type", "menu");
      elm.setAttribute("autoCheck", "false");
      elm.hidden = false;
      document.getElementById("rtse-editor-convertSmilies").hidden = false;
    }

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
    if (!RTSE.editor.replaceableElements)
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

    // Event Listeners
    form.addEventListener("submit", RTSE_convertExtraBB, false);

    // Inserting
    RTSE.editor.insert(doc);
  },

 /**
  * Determines if the icon should be visible.  Should only be called from an
  *  event listener
  *
  * @param aEvent The event passed to the function
  */
  toggleIcon: function toggleIcon(aEvent)
  {
    var show = false;
    var browser = gBrowser.getBrowserForTab(gBrowser.selectedTab);
    var doc = browser.contentDocument;
    if (/^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com(.*)?$/.test(doc.location.href))
      show = RTSE.editor.replaceableElements;
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
      pane.collapsed = true;
      return;
    }

    // updating values
    if (pane.collapsed) {
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
    pane.collapsed = aEvent.type == "click" ? !pane.collapsed :
                       RTSE.editor.getProperty(doc, "visible") != "true";
    document.getElementById("rtse-ContentSplitter").collapsed = pane.collapsed;
    RTSE.editor.setProperty(doc, "visible", !pane.collapsed);
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
    const DATA = RTSE.editor.dataFields;
    var form = aDoc.forms.namedItem('post');
    if (!form) throw "Form not available - " + aDoc.location.href;

    var ref = RTSE.editor.replaceableElements;
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

    editor = aDoc.createElement("textarea");
    editor.addEventListener("click", RTSE.editor.toggleEditor, false);

    ref.parentNode.replaceChild(editor, ref);
  },

 /**
  * Submits the data from the editor to the right place
  */
  submit: function submit()
  {
    var doc = gBrowser.getBrowserForTab(gBrowser.selectedTab)
                      .contentDocument;
    if (!RTSE.editor.validate(doc)) return;

    var form = doc.forms.namedItem("post");
    // Copying values
    const DATA = RTSE.editor.dataFields;
    for (var i = (DATA.length - 1); i >= 0; --i) {
      if (form.elements.namedItem(DATA[i])) {
        form.elements.namedItem(DATA[i])
            .value = document.getElementById("rtse-editor-" + DATA[i]).value;
      } else if (RTSE.editor.getProperty(doc, "show-" + DATA[i]) == "true") {
        var elm = doc.createElement("input");
        elm.setAttribute("type", "hidden");
        elm.setAttribute("name", DATA[i]);
        elm.setAttribute("value",
                      document.getElementById("rtse-editor-" + DATA[i]).value);
        form.appendChild(elm);
      }
    }

    RTSE.editor.toggleEditor({type: "click"});

    var e = doc.createEvent("HTMLEvents");
    e.initEvent("submit", true, true);
    form.dispatchEvent(e);
  },

 /**
  * Validates the entered data before submission
  *
  * @param aDoc The document that we are checking
  * @return True if ok, false otherwise
  */
  validate: function validate(aDoc)
  {
    var body  = document.getElementById("rtse-editor-body");
    var title = document.getElementById("rtse-editor-title");

    if (body.value == "") {
      alert('You must enter a body');
      body.focus();
      return false;
    }

    if (RTSE.editor.getProperty(aDoc, "show-title") == "true" &&
        (title.value == "" || title.value == RTSE.editor.defaultTitle)) {
      alert('You must enter a title');
      title.focus();
      return false;
    }

    // should be all good
    return true;
  },

 /**
  * Inserts a BBcode tag into the editor
  *
  * @param aID The id of the element that was clicked.
  */
  insertTag: function insertTag(aID)
  {
    var text = document.getElementById("rtse-editor-body");
    var elm  = document.getElementById("rtse-editor-" + aID);

    if (text.selectionStart == text.selectionEnd || !elm) {
      // No text selected or tag has no closing
      var bool;
      if (elm || aID.match(/smiley[0-9]+/)) {
        bool = elm ? elm.checked : false;
        tag = bool ? "[/" + aID + "]" :  "[" + aID + "]"
      } else {
        tag = tagText;
      }
      var pos = text.selectionStart + tag.length;
      if (elm)
        elm.checked = !bool;
      text.value = text.value.substring(0, text.selectionStart) + tag +
                   text.value.substring(text.selectionStart, text.textLength);
      text.setSelectionRange(pos, pos);
    } else {
      // Text is selected 
      var tag = "[" + aID + "]";
      var length = tag.length;
      var data = text.value.substring(0, text.selectionStart) + tag;
      tag = "[/" + aID + "]";
      length += tag.length;
      var start = text.selectionStart;
      var end = text.selectionEnd;
      data += text.value.substring(text.selectionStart, text.selectionEnd) +
              tag + text.value.substring(text.selectionEnd, text.textLength);
      text.value = data;
      text.setSelectionRange(start, end + length);
    }
    
    text.focus();
  },

 /**
  * Event Listener for shortcut keys in editor
  *
  * @param aEvent The event passed to the function.
  */
  keypressListener: function keypressListener(aEvent)
  {
    if (!aEvent.altKey)
      return;

    aEvent.stopPropagation();
    aEvent.preventDefault();

    switch (aEvent.keyCode) {
      case "b":
      case "i":
      case "u":
      case "s":
        RTSE.editor.insertTag(aEvent.keyCode);
        break;
      case "p":
        RTSE.editor.insertTag("img");
        break;
      default:
        break;
    }
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
  },

 /**
  * The array of all fields used
  *
  * @return An array of the data fields used in the editor
  */
  get dataFields()
  {
    return ["body", "title", "friendsOnly"];
  },

 /**
  * The document elements that could be replaced for the editor.
  *
  * @return The element to be used.
  */
  get replaceableElements()
  {
    var doc = gBrowser.getBrowserForTab(gBrowser.selectedTab)
                      .contentDocument;
    return doc.getElementById("Add a Comment") ||
           doc.getElementById("Make a Journal Entry") ||
           doc.getElementById("Edit Journal Entry") ||
           doc.getElementById("Add a New Topic") ||
           doc.getElementById("Reply") ||
           doc.getElementById("Send a Message") ||
           doc.getElementById("Post") ||
           doc.getElementById("Edit") ||
           doc.getElementById("Edit Post");
  }
};
