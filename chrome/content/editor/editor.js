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

RTSE.editor =
{
  /////////////////////////////////////////////////////////////////////////////
  //// Private Variables

  mOk: false,
  mCurrentDoc: null,
  
  /////////////////////////////////////////////////////////////////////////////
  //// Functions

 /**
  * Initializes everything for the editor to work properly
  */
  init: function init()
  {
    var elm = document.getElementById("rtse-statusbar-editor");
    var click = function toggle() {
      var pane = document.getElementById("rtse-realtimeEditor");
      if (pane.collapsed)
        RTSE.editor.ensureEditorIsVisible();
      else
        RTSE.editor.ensureEditorIsHidden();
    };
    elm.addEventListener("click", click, false);

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
      var doc  = gBrowser.getBrowserForTab(gBrowser.selectedTab)
                         .contentDocument;
      if (this.checked) {
        this.image = "chrome://rtse/content/images/locked.png";
        this.tooltip = "rtse-editor-tooltip-locked";
        RTSE.editor.setProperty(doc, "friendsOnly", "1");
      } else {
        this.image = "chrome://rtse/content/images/unlocked.png";
        this.tooltip = "rtse-editor-tooltip-unlocked";
        RTSE.editor.setProperty(doc, "friendsOnly", "0");
      }
    };
    document.getElementById("rtse-editor-friendsOnly")
            .addEventListener("command", toggle, false);

    document.getElementById("rtse-editor-body")
            .addEventListener("keypress", RTSE.editor.keypressListener, true);

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

    // Real Time Preview
    var rtp = RTSE.editor.realTimePreview;
    var username = gRTSE.prefsGetString("extensions.rtse.username");
    rtp.getElementById("username").innerHTML = username;
    rtp.getElementById("user-image")
       .setAttribute("src", "http://66.81.80.139/" + username + ".jpg");
    if (!gRTSE.prefsGetBool("extensions.rtse.sponsor")) {
      rtp.getElementById("sponsor").style.display = "none";
    }
    document.getElementById("rtse-editor-body")
            .addEventListener("input", RTSE.editor.preview, false);

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
    form = doc.forms.namedItem("post");
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
    if (gRTSE.prefsGetBool("extensions.rtse.editor") &&
        /^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com(.*)?$/.test(doc.location.href))
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
    var doc = gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument;
    var pane = document.getElementById("rtse-realtimeEditor");

    if (!doc.forms.namedItem("rtse")) {
      RTSE.editor.ensureEditorIsHidden();
      return;
    }

    if (RTSE.editor.getProperty(doc, "visible") == "true") {
      RTSE.editor.ensureEditorIsVisible();
    } else {
      RTSE.editor.ensureEditorIsHidden();
    }
  },

 /**
  * Makes sure that the editor is visible in the window.
  */
  ensureEditorIsVisible: function ensureEditorIsVisible()
  {
    var pane = document.getElementById("rtse-realtimeEditor");
    var doc  = gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument;
    
    if (!pane.collapsed)
      RTSE.editor.ensureEditorIsHidden();

    RTSE.editor.mCurrentDoc = doc;

    // Visibility of certain elements
    document.getElementById("rtse-editor-title").hidden =
      RTSE.editor.getProperty(doc, "show-title") != "true";
    document.getElementById("rtse-editor-friendsOnly").hidden =
      RTSE.editor.getProperty(doc, "show-friendsOnly") != "true"

    document.getElementById("rtse-editor-body").value =
      RTSE.editor.getProperty(doc, "body");
    if (document.getElementById("rtse-editor-body").value == "")
      RTSE.editor.realTimePreview.getElementById("post").innerHTML = "";
    document.getElementById("rtse-editor-title").value =
      RTSE.editor.getProperty(doc, "title");
    RTSE.editor.setProperty(doc, "visible", "true");
    document.getElementById("rtse-ContentSplitter")
            .collapsed = pane.collapsed = false;
    document.getElementById("rtse-editor-body").focus();
  },

 /**
  * Makes sure that the editor is hidden in the window.
  */
  ensureEditorIsHidden: function ensureEditorIsHidden()
  {
    var pane = document.getElementById("rtse-realtimeEditor");
    var doc  = RTSE.editor.mCurrentDoc;

    if (doc === null)
      return;

    if (!pane.collapsed) {
      RTSE.editor.setProperty(doc, "body",
                    document.getElementById("rtse-editor-body").value);
      RTSE.editor.setProperty(doc, "title",
                    document.getElementById("rtse-editor-title").value);
    }
    document.getElementById("rtse-ContentSplitter")
            .collapsed = pane.collapsed = true;
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

    // Taking care of hidden fields that get removed
    var elms = ["uid"];
    var elm, clone;
    for (var i = (elms.length - 1); i >= 0; --i)
      elm = form.elements.namedItem(elms[i]);
      if (elm) {
        clone = elm.cloneNode(true);
        elm.parentNode.removeChild(elm);
        form.appendChild(clone);
      }

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
    editor.setAttribute("id", ref.getAttribute("id"));
    editor.addEventListener("click", RTSE.editor.ensureEditorIsVisible, false);

    ref.parentNode.replaceChild(editor, ref);
  },

 /**
  * Submits the data from the editor to the right place
  */
  submit: function submit()
  {
    var doc = gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument;
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

    RTSE.editor.ensureEditorIsHidden();

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

    // We want to simulate the user doing this, so send out an input event.
    var e = document.createEvent("UIEvents");
    e.initUIEvent("input", true, false, window, 0);
    text.dispatchEvent(e);

    text.focus();
  },

 /**
  * Gets the link URI and Label
  */
  link: function link()
  {
    var body = document.getElementById("rtse-editor-body");

    var out = {
      url:      "http://",
      label:    body.selectionStart == body.selectionEnd ? "" :
                  body.value.substring(body.selectionStart,
                                       body.selectionEnd),
      accepted: false
    };

    window.openDialog("chrome://rtse/content/editor/link.xul",
                      "link",
                      "chrome,modal,centerscreen",
                      out);

    if (!out.accepted) return;

    var tag = "[link=" + out.url + "]" + out.label + "[/link]";

    var start  = body.selectionStart;
    var end    = body.selectionStart + tag.length;
    body.value = body.value.substring(0, start) + tag +
                   body.value.substring(body.selectionEnd,
                                        body.textLength);

    // We want to simulate the user doing this, so send out an input event.
    var e = document.createEvent("UIEvents");
    e.initUIEvent("input", true, false, window, 0);
    text.dispatchEvent(e);

    body.setSelectionRange(start, end);
    body.focus();
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

    var key = String.fromCharCode(aEvent.charCode);

    switch (key) {
      case "b":
      case "i":
      case "u":
      case "s":
        RTSE.editor.insertTag(key);
        break;
      case "p":
        RTSE.editor.insertTag("img");
        break;
      case "q":
        RTSE.editor.insertTag("quote");
        break;
      case "l":
        RTSE.editor.link();
        break;
      default:
        break;
    }
  },

 /**
  * Preview event listener.  Generates the preview from the editor.
  *
  * @param aEvent The event passed to the function.
  */
  preview: function preview(aEvent)
  {
    var parser = function parser(aText)
    {
      aText = RTSE.editor.convertExtraBB(aText);

      aText = aText.replace(/\n/g, "<br>");
      aText = aText.replace(/\[(\/)?([b|i|u])\]/g, "<$1$2>");
      aText = aText.replace(/\[(\/)?s\]/g, "<$1del>");
      aText = aText.replace(/\[img\]http:\/\/(.*?)\[\/img\]/g,
                            "<img src='http://$1' style='float: none;'>");
      aText = aText.replace(/\[quote\](.*)\[\/quote\]/g,
        "<blockquote style='border: 1px solid rgb(204, 204, 204); padding: 4px; background-color: rgb(241, 241, 241);'>$1</blockquote>");
      aText = aText.replace(/\[link=(.*?)\](.*?)\[\/link\]/g, "<a href='$1'>$2</a>");

      // Sponsor Only Stuff
      if (!gRTSE.prefsGetBool("extensions.rtse.sponsor"))
        return aText;

      aText = aText.replace(/\[smiley([0-9]{1,2})\]/g,
        "<img style='float: none; clear: none; display: inline;' src='http://www.roosterteeth.com/assets/images/emoticons/smiley$1.gif'>");

      return aText;
    };

    var body = document.getElementById("rtse-editor-body");
    var rtp  = RTSE.editor.realTimePreview;
    rtp.getElementById("post").innerHTML = parser(body.value);
  },

 /**
  * This is the parser for additional BB codes.
  *
  * @param aText The text to be converted into RT BB code
  * @return RT BB code.
  */
  convertExtraBB: function convertExtraBB(aText)
  {
    // Smilies
    if (gRTSE.prefsGetBool('extensions.rtse.editor')) {
      var checkbox = document.getElementById("rtse-editor-convertSmilies");
      if (checkbox.checked) aText = RTSE.smilies.convert(aText);
    }

    // BB Code
    aText = aText.replace(/\[quote=([a-zA-Z0-9_]{4,12})\]([\s\S]+)\[\/quote\]/g,'[b]Quoting $1:[/b][quote]$2[/quote]');

    return aText;
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
  },

 /**
  * The document element for the real time preview
  *
  * @return Document element used to get to real time preview.
  */
  get realTimePreview()
  {
    return document.getElementById("rtse-editor-real-time-preview").contentDocument;
  }
};