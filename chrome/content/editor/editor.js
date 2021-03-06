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
    if(!elm) {
      elm = document.getElementById("rtse-addonbar-editor");
    }
    var click = function toggle(e) {
      let pane = RTSE.editor.editorElement;
      if (pane.state == "closed") {
        RTSE.editor.ensureEditorIsVisible();
        this.setAttribute("closed", "false");
      }
      else {
        RTSE.editor.ensureEditorIsHidden();
        this.setAttribute("closed", "true");
      }
      e.preventDefault();
      e.stopPropagation();
    };
    try {
        elm.addEventListener("click", click, false);
    } catch(e) { 
        /* 
           Firefox 4b7+ note: 
           If Button isn't added to _some_ toolbar, 
           this listener won't attach. Which is bad.
        */
        if(gRTSE.prefsGetBool("extensions.rtse.addonbarwarning")) {
            var bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                             .getService(Components.interfaces.nsIStringBundleService)
                             .createBundle("chrome://rtse/locale/editor.properties");

            var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                    .getService(Components.interfaces.nsIPromptService);
             
            var promptresult = prompts.confirm(null, bundle.GetStringFromName("addonbarwarningtitle"), bundle.GetStringFromName("addonbarwarning"));
            if(promptresult) {
              gRTSE.prefsSetBool("extensions.rtse.addonbarwarning", false);
            }
        }
    }

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

    gBrowser.tabContainer.addEventListener("TabSelect", 
                                           this.tabSelected,
                                           false);

    RTSE.editor.setup();

    // Event Listeners
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

    this.mOk = true;
  },

 /**
  * Determine Sponsor Smilies visibility
  */
  sponsorSmilies: function sponsorSmilies() {
    let sponsor = RTSE.sponsor;
    let ahSmileys = gRTSE.prefsGetBool("extensions.rtse.ahSmilies");

    document.getElementById("rtse-editor-sponsorSmilies").hidden = !sponsor;
    document.getElementById("rtse-editor-color").hidden = !sponsor;

    document.getElementById("rtse-editor-ahSmileySpacer").hidden = !ahSmileys;
    document.getElementById("rtse-editor-ahSmilies").hidden = !ahSmileys;
  },

/**
  * Determine Quote Button Visibility
  */
  quoteButtons: function quoteButtons() {
    let quoteBox = gRTSE.prefsGetBool("extensions.rtse.extras.quoteButtons");
    let quoteButton1 = gRTSE.prefsGetString("extensions.rtse.extras.quoteButton1");
    let quoteButton2 = gRTSE.prefsGetString("extensions.rtse.extras.quoteButton2");
    let quoteButton3 = gRTSE.prefsGetString("extensions.rtse.extras.quoteButton3");
    let quoteButton4 = gRTSE.prefsGetString("extensions.rtse.extras.quoteButton4");

     document.getElementById("rtse-editor-quoteBox").hidden = !quoteBox;
     document.getElementById("rtse-editor-quote1").hidden = quoteButton1 == "";
     document.getElementById("rtse-editor-quote1").setAttribute("tooltiptext", quoteButton1);

     document.getElementById("rtse-editor-quote2").hidden = quoteButton2 == "";
     document.getElementById("rtse-editor-quote2").setAttribute("tooltiptext", quoteButton2);

     document.getElementById("rtse-editor-quote3").hidden = quoteButton3 == "";
     document.getElementById("rtse-editor-quote3").setAttribute("tooltiptext", quoteButton3);

     document.getElementById("rtse-editor-quote4").hidden = quoteButton4 == "";
     document.getElementById("rtse-editor-quote4").setAttribute("tooltiptext", quoteButton4);
  },

 /**
  * Performs the preference sensative setup of data for the editor.
  */
  setup: function setup()
  {
    let sponsor = RTSE.sponsor;

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
    
    if(doc.location.protocol == "about:")
      return;

    if (!RTSE_findOnDomain(doc.domain))
      return;

    if (!RTSE.editor.replaceableElements(doc))
      return;

    var form = doc.createElement("form");
    form.setAttribute("name", "rtse");
    form.setAttribute("style", "display: none;");
    doc.getElementsByTagName("body")[0].appendChild(form);

    form = doc.forms.namedItem("rtse");
    var elms = ["visible", "body", "show-body", "title", "show-title",
                "friendsOnly", "show-friendsOnly", "toUser", "show-toUser",
                "pollq", "show-pollq", "polla-1", "polla-2", "polla-3",
                "polla-4", "polla-5", "polla-6", "polla-7", "polla-8",
                "polla-9", "polla-10"];
    let vals = ["false", "", "true", "", "false", "", "false", "", "false",
                "", "false", "", "", "", "", "", "", "", "", "", ""];

    for (var i in elms) {
      var elm = doc.createElement("input");
      elm.setAttribute("type", "hidden");
      elm.setAttribute("name", elms[i]);
      form.appendChild(elm);
    }

    // Pre-add "Tweet" input element
    if(doc.getElementById("Make a Journal Entry") && doc.getElementsByName("tweet")[0])
        RTSE.editor.toggleTweet();

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
    if(doc.location.protocol != "about:")
      if ( gRTSE.prefsGetBool("extensions.rtse.editor") &&
           RTSE_findOnDomain(doc.domain) )
        show = RTSE.editor.replaceableElements(doc);
    if(document.getElementById("rtse-statusbar-editor"))
      document.getElementById("rtse-statusbar-editor").hidden = !show;
    if(document.getElementById("rtse-addonbar-editor"))
      document.getElementById("rtse-addonbar-editor").hidden = !show;
  },

  /**
   * Hide the ATE when new tabs are opened.
   */
  tabSelected: function RTSE_tabSelected(event)
  {
    var browser = gBrowser.getBrowserForTab(event.target);
    if(browser.currentURI.spec == "about:blank")
        RTSE.editor.ensureEditorIsHidden();
  },

  /**
   * Adds an additional option for polls.
   */
  addPollAnswer: function RTSE_addPollAnswer()
  {
    let $ = function(aID) document.getElementById(aID)

    let num = RTSE.editor.getPollAnswerCount();

    // Unhide the new answer
    let elm = $("rtse-poll-answer-" + (num + 1)); 
    elm.hidden = false;

    // Disable the "Add" button once ten answers are posted.
    if(num >= 9) {
        $("rtse-poll-add-answer").disabled = true;
    }
  },
  
  /**
   *  Determine how many answers currently exist in a poll
   */
  getPollAnswerCount: function RTSE_getPollAnswerCount()
  {
    let $ = function(aID) document.getElementById(aID)
    
    let container = $("rtse-poll-container");
    let count = 0;
    for(let i = 1; i < 11;i++) {
        if(container.childNodes[i].hidden == false)
            count = count + 1;
    }
    return count;
  },

  /**
   *  Add or remove the form element controlling Tweeting
   */
  toggleTweet: function toggleTweet() {
    var doc = gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument;
    let form = doc.forms.namedItem("post");

    let checked = document.getElementById("rtse-editor-tweet").checked;
    if(checked) {
        try {
            let tweetInput = doc.createElement("input");
            tweetInput.setAttribute("name", "tweet");
            tweetInput.setAttribute("type", "hidden");
            tweetInput.setAttribute("value", "on");
            form.appendChild(tweetInput);
        } catch (e) {
            //Apparently this didn't work
        }
    } else {
        try {
            form.removeChild(form.elements.namedItem("tweet"));
        } catch (e) {
            //Apparently this didn't work
        }
    }
  },

  /**
   * Shows/hides the editor and preview pane
   *
   * @param aEvent The event passed to the function
   */
  toggleEditor: function toggleEditor(aEvent)
  {
    var doc = gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument;

    if(doc.location.protocol == "about:")
      return;

    if (doc.forms && !doc.forms.namedItem("rtse") ||
        !RTSE_findOnDomain(doc.domain)) {
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
    let $ = function(aID) document.getElementById(aID)
    let pane = RTSE.editor.editorElement;
    var doc  = gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument;

    // Save our current state
    if (RTSE.editor.mCurrentDoc)
      RTSE.editor._saveEditorData();

    RTSE.editor.mCurrentDoc = doc;

    // Visibility of certain elements XXX there has to be a better way...
    document.getElementById("rtse-editor-title").hidden =
      RTSE.editor.getProperty(doc, "show-title") != "true";
    document.getElementById("rtse-editor-toUser").hidden =
      RTSE.editor.getProperty(doc, "show-toUser") != "true";
    document.getElementById("rtse-editor-tweet").hidden = 
      !(doc.getElementsByName("tweet")[0] &&
       doc.getElementById("Make a Journal Entry"));
    let friendsOnly = document.getElementById("rtse-editor-friendsOnly");
    friendsOnly.hidden = RTSE.editor.getProperty(doc, "show-friendsOnly") != "true";
    if(!friendsOnly.hidden) {
      if(RTSE.editor.getProperty(doc, "friendsOnly") == 1) {
        friendsOnly.checked = true;
        friendsOnly.image = "chrome://rtse/content/images/locked.png";
        friendsOnly.tooltip = "rtse-editor-tooltip-locked";
      } else {
        friendsOnly.checked = false;
        friendsOnly.image = "chrome://rtse/content/images/unlocked.png";
        friendsOnly.tooltip = "rtse-editor-tooltip-unlocked";
      }
    }

    $("rtse-poll-container").hidden =
      RTSE.editor.getProperty(doc, "show-pollq") != "true";

    // Hide the unused poll answers, and see if the "add" button should be disabled
    for(let i = 10; i > 1; i--) {
        if($("rtse-poll-answer-" + i).value == "" && i > 3)
            $("rtse-poll-answer-" + i).hidden = true;
        else {
            break;
        }
    }
    let num = RTSE.editor.getPollAnswerCount();
    if(num > 9)
        $("rtse-poll-add-answer").disabled = true;
    else
        $("rtse-poll-add-answer").disabled = false;

    // XXX some kind of loop here?
    document.getElementById("rtse-editor-body").value =
      RTSE.editor.getProperty(doc, "body");

    document.getElementById("rtse-editor-title").value =
      RTSE.editor.getProperty(doc, "title");
    document.getElementById("rtse-editor-toUser").value =
      RTSE.editor.getProperty(doc, "toUser");
    RTSE.editor.setProperty(doc, "visible", "true");

    // And now for the fun of polls!
    $("rtse-poll-question").value = RTSE.editor.getProperty(doc, "pollq");
    for (let i = 1; RTSE.editor.hasProperty(doc, "polla-" + i); i++) {
      let elm = $("rtse-poll-answer-" + i);
      if (!elm) {
        RTSE.editor.addPollAnswer();
        elm = $("rtse-poll-answer-" + i);
      }
      elm.value = RTSE.editor.getProperty(doc, "polla-" + i);
    }

    pane.hidden = false;
    pane.openPopup(document.getElementById("browser-bottombox"),
                   "before_start", 0, 0, false, false);
  },

 /**
  * Makes sure that the editor is hidden in the window.
  */
  ensureEditorIsHidden: function ensureEditorIsHidden()
  {
    let pane = RTSE.editor.editorElement;

    if (pane.state == "closed")
      return;

    RTSE.editor._saveEditorData();

    pane.hidePopup();
  },

  /**
   * Saves the current state of the editor.
   */
  _saveEditorData: function RTSE_saveEditorData()
  {
    let doc = RTSE.editor.mCurrentDoc;
    if (!doc) return;
    let $ = function(aID) document.getElementById(aID)
    let value = function(aID) $(aID).value

    RTSE.editor.setProperty(doc, "body", value("rtse-editor-body"));
    RTSE.editor.setProperty(doc, "title", value("rtse-editor-title"));
    RTSE.editor.setProperty(doc, "toUser", value("rtse-editor-toUser"));

    // Poll fun!
    if (value("rtse-poll-question")) {
      RTSE.editor.setProperty(doc, "show-pollq", "true");
      RTSE.editor.setProperty(doc, "pollq", value("rtse-poll-question"));

      for (let i = 1; $("rtse-poll-answer-" + i); i++) {
        if (value("rtse-poll-answer-" + i)) {
          RTSE.editor.setProperty(doc, "polla-" + i,
                                  value("rtse-poll-answer-" + i));
        }
      }
    }
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
  * Sets the specified property for the editor.  The property will be created
  * if it does not exist.
  *
  * @param aDoc The document which we are using
  * @param aProp The property to be set
  * @param aValue The value the property is to be set to
  */
  setProperty: function RSTE_setProperty(aDoc, aProp, aValue)
  {
    let form = aDoc.forms.namedItem("rtse");
    let elm = form.elements.namedItem(aProp);
    if (!elm) {
      elm = aDoc.createElement("input");
      elm.setAttribute("type", "hidden");
      elm.setAttribute("name", aProp);
      form.appendChild(elm);
    }
    elm.value = aValue;
  },

  /**
   * Determines if the specified property exists for the editor.
   *
   * @param aDoc The document which we are using
   * @param aProp The property to be set
   * @returns true if it exists, false otherwise.
   */
  hasProperty: function RTSE_hasProperty(aDoc, aProp)
  {
    let form = aDoc.forms.namedItem("rtse");
    let elm = form.elements.namedItem(aProp);
    return elm ? true : false;
  },

  /**
  * Inserts the editor box into the document
  *
  * @param aDoc The document to be checked to insert the editor
  */
  insert: function insert(aEvent)
  {
    var doc = aEvent.originalTarget;

    if(doc.location.protocol == "about:")
      return;

    if (!gRTSE.prefsGetBool("extensions.rtse.editor") ||
        !RTSE_findOnDomain(doc.domain))
      return;
    const DATA = RTSE.editor.dataFields;

    var form = doc.forms.namedItem("post");
    if (!form) return;

    var ref = RTSE.editor.replaceableElements(doc);
    if (!ref) throw "Editor cannot be inserted";

    // Get all of the answers to a poll, if it exists
    try {
        let addapoll = doc.getElementById("addapoll").getElementsByTagName("tr");
        let pollanswers = new Array();
        for(let i = 1;i< 11; i++) {
            pollanswers.push(doc.getElementById("an"+i).getElementsByTagName("input")[0].value);
            RTSE.editor.setProperty(doc, "polla-" + i, doc.getElementById("an"+i).getElementsByTagName("input")[0].value);
        }
    } catch(e) {
        // Polls don't exist on this page
        // This is probably a occurring on a Message page
    }

    // Taking care of hidden fields that get removed
    var elms = ["uid", "tid"];
    for (let i in elms) {
      let elm = form.elements.namedItem(elms[i]);
      if (elm) {
        let clone = elm.cloneNode(true);
        elm.parentNode.removeChild(elm);
        form.appendChild(clone);
      }
    }

    for (let i in DATA) {
      if (form.elements.namedItem(DATA[i])) {
        let value = form.elements.namedItem(DATA[i]).value
        RTSE.editor.setProperty(doc, DATA[i], value);
        RTSE.editor.setProperty(doc, "show-" + DATA[i], "true");
      } else
        RTSE.editor.setProperty(doc, "show-" + DATA[i], "false");
    }
     
    var editor = doc.createElement("div");
    let clickable = doc.createElement("textarea");
    let style = "margin:3px 4px 3px 4px; width:98%;";
    clickable.setAttribute("style", style);
    clickable.setAttribute("title", "Click to Activate Editor!");
    editor.appendChild(clickable);
    editor.setAttribute("id", ref.getAttribute("id"));
    editor.addEventListener("click", RTSE.editor.ensureEditorIsVisible, false);
    style = "background-color:#f4f4f4;";
    editor.setAttribute("style", style);
    ref.parentNode.replaceChild(editor, ref);

    // If Hide Homepage Elements is enabled, and if the "Make a Journal Entry" pref is set to display,
    // make sure that the replaced element has the correct className for visibility.
    if(gRTSE.prefsGetBool("extensions.rtse.homepage.3") && !gRTSE.prefsGetBool("extensions.rtse.homepage"))
        editor.className = "shown";

    // If editing or previewing a post, automatically display the editor
    if(doc.location.href.match("editMe.php") || doc.location.href.match("editEntry.php") || doc.location.href.match("preview.php")) { 
        RTSE.editor.ensureEditorIsVisible();
    }
  },

  /**
   * Private function that copies important data to the rtse form for submission
   *
   * @returns [the document, the form] the data was updated for.
   */
  _updateFormData: function RTSE_updateFormData()
  {
    let doc = gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument;
    if (!RTSE.editor.validate(doc)) return [null, null];

    let form = doc.forms.namedItem("post");
    // Copying values
    const DATA = RTSE.editor.dataFields;
    for (let i = (DATA.length - 1); i >= 0; --i) {
      if (form.elements.namedItem(DATA[i])) {
        form.elements.namedItem(DATA[i])
            .value = document.getElementById("rtse-editor-" + DATA[i]).value;
      } else if (RTSE.editor.getProperty(doc, "show-" + DATA[i]) == "true") {
        let elm = doc.createElement("input");
        elm.setAttribute("type", "hidden");
        elm.setAttribute("name", DATA[i]);
        let value = RTSE.editor.getProperty(doc, DATA[i]);
        elm.setAttribute("value", value);
        form.appendChild(elm);
      }
    }

    // And poll answers, since they are a royal pain...
    for (let i = 1; RTSE.editor.hasProperty(doc, "polla-" + i); i++) {
      let elm = doc.createElement("input");
      elm.setAttribute("type", "hidden");
      elm.setAttribute("name", "polla[]");
      elm.setAttribute("value", RTSE.editor.getProperty(doc, "polla-" + i));
      form.appendChild(elm);
    }

    return [doc, form];
  },

  /**
   * Submits the data from the editor to the right place
   */
  submit: function submit()
  {
    RTSE.editor.ensureEditorIsHidden();

    let doc, form;
    [doc, form] = RTSE.editor._updateFormData();
    if (!doc) return;

    let e = doc.createEvent("HTMLEvents");
    e.initEvent("submit", true, true);
    form.dispatchEvent(e);
    content.focus();
  },

  /**
   * Submits the data from the editor to the right place for a preview
   */
  preview: function RTSE_preview()
  {
    RTSE.editor.ensureEditorIsHidden();

    let doc, form;
    [doc, form] = RTSE.editor._updateFormData();
    if (!doc) return;

    let e = doc.createEvent("HTMLEvents");
    e.initEvent("submit", true, true);
    let message = form.elements.namedItem("toUser") ||
                  form.elements.namedItem("uid");
    // Which page should be submitted? New message preview,
    // regular preview, or a preview for a message reply?
    form.action = message ? "/members/messaging/preview.php" : "/preview.php";
    message = form.elements.namedItem("titleOld");
    form.action = message ? "/members/messaging/previewReply.php" : form.action;
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

    if (RTSE.editor.getProperty(aDoc, "show-title") == "true" && !title.value) {
      alert('You must enter a title');
      title.focus();
      return false;
    }

    if (RTSE.editor.getProperty(aDoc, "show-toUser") == "true" &&
        !toUser.value) {
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
        // One of the quote buttons was pressed, paste that quote here
        if(aID.match(/quotebutton[0-9]+/)) {
          let buttonNumber = aID.split("quotebutton")[1];
          
          tag = gRTSE.prefsGetString("extensions.rtse.extras.quoteButton" + buttonNumber);
        }
        else
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

    if (!out.accepted) {
        var start = body.selectionStart;
        var end = body.selectionEnd;
    }
    else{
        var tag = "[link=" + out.url + "]" + out.label + "[/link]";

        var start  = body.selectionStart;
        var end    = body.selectionStart + tag.length;
        body.value = body.value.substring(0, start) + tag +
                       body.value.substring(body.selectionEnd,
                                            body.textLength);
    }
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
    // Hide editor if "esc" key is pressed while in the editor
    if(aEvent.keyCode == "27") {
        RTSE.editor.ensureEditorIsHidden();
    }

    if (!/mac/i.test(navigator.platform) && !aEvent.altKey ||
        /mac/i.test(navigator.platform) && !aEvent.ctrlKey  ) {
      return;
    }

    aEvent.stopPropagation();
    aEvent.preventDefault();

    var key = String.fromCharCode(aEvent.charCode).toLowerCase();;

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
      case "o":
        RTSE.editor.insertTag("spoiler");
        break;
      case "l":
        RTSE.editor.link();
        break;
      default:
        break;
    }
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
    if (gRTSE.prefsGetBool('extensions.rtse.editor') && gRTSE.prefsGetBool('extensions.rtse.smilies')) {
      var checkbox = document.getElementById("rtse-editor-convertSmilies");
      if (checkbox.checked) aText = RTSE.smilies.convert(aText);
    }

    // BB Code
    aText = aText.replace(/\[quote=([a-zA-Z0-9_]{4,12})\]([\s\S]+)\[\/quote\]/g,'[b]Quoting $1:[/b][quote]$2[/quote]');

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
           aDoc.getElementById("Make a News Entry") ||
           aDoc.getElementById("Edit News Entry") ||
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
  * The array of all fields used
  *
  * @return An array of the data fields used in the editor
  */
  get dataFields()
  {
    // The defaults that are always there
    let fields = [
      "body",
      "title",
      "friendsOnly",
      "toUser",
      "pollq",
    ];

    return fields;
  }
};
