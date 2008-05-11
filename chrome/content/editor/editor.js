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
 * Portions created by the Initial Developer are Copyright (C) 2006-2007
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
      let pane = RTSE.editor.editorElement;
      if (pane.state == "closed")
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
    gBrowser.mPanelContainer.addEventListener("DOMContentLoaded",
                                              RTSE.editor.insert,
                                              false);

    RTSE.editor.setup();

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
    var toUser = document.getElementById("rtse-editor-toUser").inputField;
    focus = function focus() {
      if (this.value == RTSE.editor.defaultToUser) this.value = "";
    };
    blur = function blur() {
      if (this.value == "") this.value = RTSE.editor.defaultToUser;
    };
    toUser.addEventListener("focus", focus, false);
    toUser.addEventListener("blur", blur, false);
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

    // Real Time Preview
    /*
    RTSE.editor.realTimePreview
        .addEventListener("click", RTSE.editor.previewClickHandler, false);
    document.getElementById("rtse-editor-body")
            .addEventListener("input", RTSE.editor.preview, false);
    */

    this.mOk = true;
  },

 /**
  * Performs the preference sensative setup of data for the editor.
  */
  setup: function setup()
  {
    var sponsor = gRTSE.prefsGetBool("extensions.rtse.sponsor");

    // Visibility
    document.getElementById("rtse-editor-sponsorSmilies").hidden = !sponsor;
    document.getElementById("rtse-editor-color").hidden = !sponsor;

    // Real Time Preview
    /*
    var rtp = RTSE.editor.realTimePreview;
    var username = gRTSE.prefsGetString("extensions.rtse.username");
    rtp.getElementById("username").innerHTML = username;
    rtp.getElementById("user-image")
       .setAttribute("src", "http://66.81.80.139/" + username + ".jpg");
    rtp.getElementById("sponsor").style.display = sponsor ? "inline" : "none";
    */

    // Smilies
    var smileyState = gRTSE.prefsGetBool("extensions.rtse.smilies");
    var elm = document.getElementById("rtse-editor-smiley");
    elm.hidden = !smileyState;
    document.getElementById("rtse-editor-convertSmilies").hidden = !smileyState;
    if (smileyState) {
      if (elm.childNodes.length) return;

      var smilies = RTSE.smilies.items;
      const XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
      let menu = document.getElementById("rtse-editor-smiley-menu");
      var mi, key;
      for (var i in smilies) {
        mi = document.createElementNS(XUL, "menuitem");
        mi.setAttribute("image", smilies[i].path);
        mi.setAttribute("label", smilies[i].name);
        mi.setAttribute("validate", "never");
        mi.setAttribute("class", "menuitem-iconic");
        mi.setAttribute("key", smilies[i].key);
        mi.setAttribute("oncommand",
                        "RTSE.editor.insertTag('" + smilies[i].key + "');");
        menu.appendChild(mi);
      }
      elm.appendChild(menu);
    }
  },

 /**
  * Initializes a document for the editor
  *
  * @param aEvent The event passed to the function
  */
  initDoc: function initDoc(aEvent)
  {
    var doc = aEvent.originalTarget;
    if (!/^https?:\/\/([a-zA-Z]+)\.roosterteeth\.com(.*)?$/.test(doc.location.href))
      return;
    if (!RTSE.editor.replaceableElements(doc))
      return;
    var form = doc.createElement("form");
    form.setAttribute("name", "rtse");
    form.setAttribute("style", "display: none;");
    doc.getElementsByTagName("body")[0].appendChild(form);

    form = doc.forms.namedItem("rtse");
    var elms = ["visible", "body", "show-body", "title", "show-title",
                "friendsOnly", "show-friendsOnly", "toUser", "show-toUser"];
    var vals = ["false", "", "true", "", "false", "", "false", "", "false"];
    for (var i in elms) {
      var elm = doc.createElement("input");
      elm.setAttribute("type", "hidden");
      elm.setAttribute("name", elms[i]);
      form.appendChild(elm);
    }

    // Event Listeners
    form = doc.forms.namedItem("post");
    form.addEventListener("submit", RTSE_convertExtraBB, false);

    RTSE_deconvertExtraBB(doc);
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
        /^https?:\/\/([a-zA-Z]+)\.roosterteeth\.com(.*)?$/.test(doc.location.href))
      show = RTSE.editor.replaceableElements(doc);
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
    let pane = RTSE.editor.editorElement;

    if (doc.forms && !doc.forms.namedItem("rtse") ||
        !/^https?:\/\/([a-zA-Z]+)\.roosterteeth\.com(.*)?$/.test(doc.location.href)) {
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
    let pane = RTSE.editor.editorElement;;
    var doc  = gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument;

    /*
    if (!pane.hidden)
      RTSE.editor.ensureEditorIsHidden();
    */

    RTSE.editor.mCurrentDoc = doc;

    // Visibility of certain elements XXX there has to be a better way...
    document.getElementById("rtse-editor-title").hidden =
      RTSE.editor.getProperty(doc, "show-title") != "true";
    document.getElementById("rtse-editor-toUser").hidden =
      RTSE.editor.getProperty(doc, "show-toUser") != "true";
    document.getElementById("rtse-editor-friendsOnly").hidden =
      RTSE.editor.getProperty(doc, "show-friendsOnly") != "true"

    // XXX some kind of loop here?
    document.getElementById("rtse-editor-body").value =
      RTSE.editor.getProperty(doc, "body");
    /*
    if (document.getElementById("rtse-editor-body").value == "")
      RTSE.editor.realTimePreview.getElementById("post").innerHTML = "";
    */
    document.getElementById("rtse-editor-title").value =
      RTSE.editor.getProperty(doc, "title");
    document.getElementById("rtse-editor-toUser").value =
      RTSE.editor.getProperty(doc, "toUser");
    RTSE.editor.setProperty(doc, "visible", "true");

    pane.hidden = false;
    pane.openPopup(document.getElementById("rtse-statusbar-editor"),
                   "before_start", 0, 0, false, false);

    /*
    var body = document.getElementById("rtse-editor-body");
    if (body.value != "")
      RTSE.editor.preview();
    */
  },

 /**
  * Makes sure that the editor is hidden in the window.
  */
  ensureEditorIsHidden: function ensureEditorIsHidden()
  {
    let pane = RTSE.editor.editorElement;;
    var doc  = RTSE.editor.mCurrentDoc;

    if (doc === null || pane.state == "closed")
      return;

    RTSE.editor.setProperty(doc, "body",
                    document.getElementById("rtse-editor-body").value);
    RTSE.editor.setProperty(doc, "title",
                    document.getElementById("rtse-editor-title").value);
    RTSE.editor.setProperty(doc, "toUser",
                    document.getElementById("rtse-editor-toUser").value);
    pane.hidePopup();
    pane.hidden = true;
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
  insert: function insert(aEvent)
  {
    var doc = aEvent.originalTarget;
    if (!gRTSE.prefsGetBool("extensions.rtse.editor") ||
        !/^https?:\/\/([a-zA-Z]+)\.roosterteeth\.com(.*)?$/.test(doc.location.href))
      return;
    const DATA = RTSE.editor.dataFields;
    var form = doc.forms.namedItem("post");
    if (!form) return;

    var ref = RTSE.editor.replaceableElements(doc);
    if (!ref) throw "Editor cannot be inserted";

    // Taking care of hidden fields that get removed
    var elms = ["uid"];
    var elm, clone;
    for (var i = (elms.length - 1); i >= 0; --i) {
      elm = form.elements.namedItem(elms[i]);
      if (elm) {
        clone = elm.cloneNode(true);
        elm.parentNode.removeChild(elm);
        form.appendChild(clone);
      }
    }

    for (var i = (DATA.length - 1); i >= 0; --i) {
      if (form.elements.namedItem(DATA[i])) {
        var value = form.elements.namedItem(DATA[i]).value
        RTSE.editor.setProperty(doc, DATA[i], value);
        RTSE.editor.setProperty(doc, "show-" + DATA[i], "true");
      } else
        RTSE.editor.setProperty(doc, "show-" + DATA[i], "false");
    }
    if (RTSE.editor.getProperty(doc, "show-title") == "true" &&
        RTSE.editor.getProperty(doc, "title") == "")
      RTSE.editor.setProperty(doc, "title", RTSE.editor.defaultTitle);
    if (RTSE.editor.getProperty(doc, "show-toUser") == "true" &&
        RTSE.editor.getProperty(doc, "toUser") == "")
      RTSE.editor.setProperty(doc, "toUser", RTSE.editor.defaultToUser);
    var editor = doc.createElement("div");
    var elm = doc.createElement("textarea");
    var style = "margin:3px 4px 3px 4px;";
    elm.setAttribute("style", style);
    editor.appendChild(elm);
    editor.setAttribute("id", ref.getAttribute("id"));
    editor.addEventListener("click", RTSE.editor.ensureEditorIsVisible, false);
    style = "background-color:#f4f4f4;" +
            "border:1px solid #000000;" +
            "border-top:0px;";
    editor.setAttribute("style", style);
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
        var value = document.getElementById("rtse-editor-" + DATA[i]).value ||
          RTSE.editor.getProperty(doc,DATA[i]);
        elm.setAttribute("value", value);
        form.appendChild(elm);
      }
    }

    RTSE.editor.ensureEditorIsHidden();

    var e = doc.createEvent("HTMLEvents");
    e.initEvent("submit", true, true);
    form.dispatchEvent(e);
    content.focus();
  },

 /**
  * Validates the entered data before submission
  *
  * @param aDoc The document that we are checking
  * @return True if ok, false otherwise
  */
  validate: function validate(aDoc)
  {
    var body   = document.getElementById("rtse-editor-body");
    var title  = document.getElementById("rtse-editor-title");
    var toUser = document.getElementById("rtse-editor-toUser");

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

    if (RTSE.editor.getProperty(aDoc, "show-toUser") == "true" &&
        (toUser.value == "" || toUser.value == RTSE.editor.defaultToUser)) {
      alert('You must specify who this is going to');
      toUser.focus();
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
        // Ok, so apparently we are just inserting whatever was passed
        tag = aID;
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
  * Adds the specified color to the selected text or where the cursor is.
  *
  * @param aColor The color value of the color to add.
  */
  colorize: function colorize(aColor)
  {
    var toggle = aColor == null;
    document.getElementById("rtse-editor-colorSwitch").checked = true;

    var text = document.getElementById("rtse-editor-body");

    if (text.selectionStart == text.selectionEnd || toggle) {
      // No text selected
      document.getElementById("rtse-editor-color").hidden = !toggle;
      document.getElementById("rtse-editor-colorSwitch").hidden = toggle;
      var tag = toggle ? "[/color]" : "[color=#" + aColor + "]";
      var pos = text.selectionStart + tag.length;
      text.value = text.value.substring(0, text.selectionStart) + tag +
                   text.value.substring(text.selectionStart, text.textLength);
      text.setSelectionRange(pos, pos);
    } else {
      // Text is selected
      var tag = "[color=#" + aColor + "]";
      var length = tag.length;
      var data = text.value.substring(0, text.selectionStart) + tag;
      tag = "[/color]";
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
  * Obtains a custom color.
  */
  getColor: function getColor()
  {
    var body = document.getElementById("rtse-editor-body");
    var out = {
      color: null,
      accpeted: false
    };

    window.openDialog("chrome://rtse/content/editor/colorpicker.xul",
                      "colorpicker", "chrome,modal,centerscreen", out);
    if (!out.accepted) return;

    RTSE.editor.colorize(out.color);
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
                      "link", "chrome,modal,centerscreen", out);

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
    body.dispatchEvent(e);

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
    if (!/mac/i.test(navigator.platform) && !aEvent.altKey ||
        /mac/i.test(navigator.platform) && !aEvent.ctrlKey  ) {
      return;
    }

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
  */
  preview: function preview()
  {
    var parser = function parser(aText)
    {
      aText = RTSE.editor.convertExtraBB(aText);

      aText = aText.replace(/</g, "&lt;");
      aText = aText.replace(/>/g, "&gt;");
      aText = aText.replace(/\n/g, "<br>");
      aText = aText.replace(/\[(\/)?([b|i|u])\]/g, "<$1$2>");
      aText = aText.replace(/\[(\/)?s\]/g, "<$1del>");
      aText = aText.replace(/\[img\]http:\/\/(.*?)\[\/img\]/g,
                            "<img src='http://$1' style='float: none;'>");
      aText = aText.replace(/\[quote\](.*?)\[\/quote\]/g,
        "<blockquote style='border: 1px solid rgb(204, 204, 204); padding: 4px; background-color: rgb(241, 241, 241);'>$1</blockquote>");
      aText = aText.replace(/\[link=(.*?)\](.*?)\[\/link\]/g, "<a href='$1'>$2</a>");

      // Sponsor Only Stuff
      if (!gRTSE.prefsGetBool("extensions.rtse.sponsor"))
        return aText;

      aText = aText.replace(/\[color=(#[0-9A-Fa-f]{1,6})\]/g,
                            "<span style='color:$1'>");
      aText = aText.replace(/\[color=([a-zA-Z ]+)\]/g,
                            "<span style='color:$1'>");
      aText = aText.replace(/\[\/color\]/g, "</span>");
      aText = aText.replace(/\[smiley([0-9]{1,2})\]/g,
        "<img style='float: none; clear: none; display: inline;' src='http://www.roosterteeth.com/assets/images/emoticons/smiley$1.gif'>");

      return aText;
    };

    var body = document.getElementById("rtse-editor-body");
    /*
    var rtp  = RTSE.editor.realTimePreview;
    rtp.getElementById("post").innerHTML = parser(body.value);
    */
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

    // Protecting users from themselves
    aText = aText.replace(/\[(\/)?B\]/g, "[$1b]");
    aText = aText.replace(/\[(\/)?I\]/g, "[$1i]");
    aText = aText.replace(/\[(\/)?U\]/g, "[$1u]");
    aText = aText.replace(/\[(\/)?S\]/g, "[$1s]");
    aText = aText.replace(/\[(\/)?IMG\]/g, "[$1img]");
    aText = aText.replace(/\[(\/)?QUOTE\]/g, "[$1quote]");
    aText = aText.replace(/\[\/LINK\]/g, "[/link]");
    aText = aText.replace(/\[LINK=(.*?)\]/g, "[link=$1]");

    return aText;
  },

 /**
  * The document elements that could be replaced for the editor.
  *
  * @param aDoc The document to check.
  * @return The element to be used.
  */
  replaceableElements: function replaceableElements(aDoc)
  {
    return aDoc.getElementById("Add a Comment") ||
           aDoc.getElementById("Make a Journal Entry") ||
           aDoc.getElementById("Edit Journal Entry") ||
           aDoc.getElementById("Add a New Topic") ||
           aDoc.getElementById("Reply") ||
           aDoc.getElementById("Send a Message") ||
           aDoc.getElementById("Post") ||
           aDoc.getElementById("Edit") ||
           aDoc.getElementById("Edit Post");
  },

  /**
   * Handles clicking in the real time preview.
   *
   * @param aEvent The event that is passed.
   */
  previewClickHandler: function previewClickHandler(aEvent)
  {
    if (aEvent.target.localName === "A" && aEvent.target.href != "") {
      openUILinkIn(aEvent.target.href, "tab", true);
    }
    aEvent.preventDefault();
  },

  /////////////////////////////////////////////////////////////////////////////
  //// Attributes

  /**
   * Obtains the editor element.
   */
  get editorElement()
  {
    return document.getElementById("rtse-realtime-editor");
  },

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
  * The default text for the toUser field
  *
  * @return The text for an unentered toUser field
  */
  get defaultToUser()
  {
    return "Who is this going to?";
  },

 /**
  * The array of all fields used
  *
  * @return An array of the data fields used in the editor
  */
  get dataFields()
  {
    return ["body", "title", "friendsOnly", "toUser"];
  },

 /**
  * The document element for the real time preview
  *
  * @return Document element used to get to real time preview.
  */
  get realTimePreview()
  {
    return document.getElementById("rtse-editor-real-time-preview")
                   .contentDocument;
  },

 /**
  * Obtains the text used for protected journals.
  */
  get protectedJournalText()
  {
    return "[b][/b][i][/i][u][/u][s][/s][quote]What's this?\n" +
           "Even friends only journals can be read by determined people, no " +
           "matter if they are on your friends list or not. But do not worry," +
           " RTSE protects you against even the most prying eye. The only " +
           "thing they'll get to see is the title of this journal.[/quote]";
  }
};
