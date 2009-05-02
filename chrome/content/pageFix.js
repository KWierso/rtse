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
 * Shawn Wilsher <me@shawnwilsher.com>
 *
 * Portions created by the Initial Developer are Copyright (C) 2005-2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *     Brandon Jernigan
 *
 * ***** END LICENSE BLOCK ***** */

if( !gRTSE )
  var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
                      .getService(Components.interfaces.nsIRTSE);

function RTSE_pageJump(aDoc)
// EFFECTS: Adds a textbox next to the page ranges on each page. 
//          The value in the textbox is validated to be a number within the page range.
//          If the value is valid, the browser will jump to that page.
{
    let maxPage;
    let allA;
    let elementArray = [];
    let elements;

    let newText = aDoc.createElement("span");
    newText.style.fontSize = "x-small";
    newText.appendChild(aDoc.createTextNode("Page Jump: "));

    let newInput = aDoc.createElement("input");
    newInput.style.width = "20px";
    newInput.style.fontSize = "x-small";
    newInput.style.height = "10px";
    newInput.maxLength = "6";
    newInput.title = "Enter a page number and press ENTER to go to that page!";

    newText.appendChild(newInput);
    newText.verticalAlign = "middle";
    newText.style.padding = "1px";

    // Find all page number elements for modification.
    elements = RTSE_evaluateXPath(aDoc.getElementById("pageContent"),"//table/tbody/tr/td/table/tbody/tr/td/a/b");
    for(let i in elements) {
        try {
            if(elements[i].parentNode.parentNode.getElementsByTagName("a")[0].href.match(/page=1/) &&
                    !elements[i].parentNode.parentNode.innerHTML.match("new reply") ) // Don't let watchlist items get added!
                elementArray.push(elements[i].parentNode.parentNode);
        } catch(e) { }
    }

    // If there are no page numbers on the current page, terminate function immediately.
    if(elementArray.length == 0)
        return;

    try {
        // Get the highest allowed page number
        allA = elementArray[0].getElementsByTagName("a");
        maxPage = allA[allA.length - 1];
        // If you're already on the last page, it's bolded on the site, so we need to account for this.
        if(maxPage.innerHTML.match("<b>"))
            maxPage = maxPage.firstChild;
        maxPage = parseInt(maxPage.innerHTML);

        if(elementArray.length > 1) {
        // Insert Jump box at top of page.
            elementArray[0].insertBefore(newText.cloneNode(true), elementArray[0].childNodes[0]);
            elementArray[0].insertBefore(aDoc.createTextNode("  "), elementArray[0].childNodes[1]);
            elementArray[0].getElementsByTagName("input")[0].addEventListener("keydown", function(e) { 
                // Validate the value in the textbox
                if(e.keyCode == 13) {
                    if(!this.value.match(/\D/g)) {
                        if(this.value >= 1 && this.value <= maxPage) {
                            // If everything's okay, jump to specified page.
                            let newURL = aDoc.URL.split("#")[0].split("&page=")[0] + "&page=" + this.value;
                            aDoc.location.href = newURL; 
                        } else {
                            alert("Page value not in the accepted range of pages!");
                        }
                    } else { alert("Only numeric values are acceptable. Please remove any non-numeric values from the textbox."); }
                }
            }, false);
        }

        // Insert Jump box at bottom of page.
        elementArray[elementArray.length - 1].appendChild(aDoc.createElement("br"));
        elementArray[elementArray.length - 1].appendChild(newText.cloneNode(true));
        elementArray[elementArray.length - 1].getElementsByTagName("input")[0].addEventListener("keydown", function(e) { 
            // Validate the value in the textbox
            if(e.keyCode == 13) {
                if(!this.value.match(/\D/g)) {
                    if(this.value >= 1 && this.value <= maxPage) {
                        // If everything's okay, jump to specified page.
                        let newURL = aDoc.URL.split("#")[0].split("&page=")[0] + "&page=" + this.value;
                        aDoc.location.href = newURL; 
                    } else {
                        alert("Page value not in the accepted range of pages!");
                    }
                } else { alert("Only numeric values are acceptable. Please remove any non-numeric values from the textbox."); }
            }
        }, false);
    } catch(e) { 
         // Apparently something didn't work quite right.
         // Let's not break the entire addon because of it.
    }
}

function RTSE_linkFix(aDoc)
// EFFECTS: removes all targets from links and prevents links from opening in a
//          new flavor.  In addition, it changes any anchors for that page to
//          scroll into view as opposed to loading a new url.
{
  // Scroll Into view for links on same page
  var loc = aDoc.location.href
                .replace(/^https?:\/\/(www|rvb|sh|panics|magic|myspace|ah|m)\.roosterteeth\.com(.*)$/i,'$2');
  var func = function showMe(aEvent) {
    var id = this.href.replace(/^.*?#([\S\s]+)$/i,'$1');
    var doc = this.ownerDocument;
    var elm = doc.getElementById(id) ? doc.getElementById(id) :
                                       doc.getElementsByName(id)[0];
    if (elm) {
      elm.scrollIntoView(true);
      aEvent.preventDefault();
    }
  };
  var links = RTSE_evaluateXPath(aDoc,"//a[contains(@href,'#') and contains(@href,'" + loc + "')]");
  for (var i = (links.length - 1); i >= 0; --i) {
    links[i].addEventListener("click", func, false);
  }

  // Remove target and keep same flavor
  if (!gRTSE.prefsGetBool("extensions.rtse.fixLinks")) return;
  links = RTSE_evaluateXPath(aDoc,'//a[@target="_blank"]');
  var regEx = /^http:\/\/(www|rvb|sh|panics|magic|myspace|ah|m).roosterteeth.com(.*)$/i;
  for (var i = (links.length - 1); i >= 0; --i) {
    if (links[i].href.match(regEx)) {
      links[i].removeAttribute('target');
      links[i].href=links[i].href.replace(regEx, '$2');
    } else if (links[i].href.match(/^\/(.*)$/i)) {
      links[i].removeAttribute('target');
    }
  }
}

function RTSE_addCSS(aDoc)
// EFFECTS: adds special CSS instructions to the head of each RT page
{
  var head=aDoc.getElementsByTagName('head')[0];
  var css=aDoc.createElement('style');
  css.setAttribute('type','text/css');
  css.setAttribute('media','screen');
  
  // fix for too long of text in textboxes
  css.appendChild(aDoc.createTextNode('textarea { overflow-x:auto; }\n'));
  
  // Appending
  head.appendChild(css);
}

function RTSE_forumListBox(doc) {
  /* Used to create and insert the list box to jump to a forum */
  if (!gRTSE.prefsGetBool("extensions.rtse.forum")) return;
  var listBox=doc.createElement('select');
  let ids = [
    7,
    27,
    17,
    11,
    38,
    14,
    12,
    29,
    28,
    25,
    15,
    4,
    16,
    13,
    5,
    33,
    32,
    24,
    23,
    22,
    21,
    31,
    20,
    26,
    36,
    19,
    18,
    41,
    3,
    35,
    30,
    10,
    2,
    39,
    9,
    34,
    8,
    37,
    1,
    104,
    106,
    103,
    109,
    101,
    108,
    102,
    'null'
  ];
  var bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                         .getService(Components.interfaces.nsIStringBundleService)
                         .createBundle("chrome://rtse/locale/forums.properties");
  var getName = function getName(aName) {
    return bundle.GetStringFromName(aName);
  };
  var option;
  /* Creating the listBox */
  for (var i = (ids.length - 1); i >= 0; --i) {
    try {
      if ((typeof(ids[i]) == "number" &&
           gRTSE.prefsGetBool("extensions.rtse.forum." + ids[i])) ||
          ids[i] == 'null') {
        option=doc.createElement('option');
        option.setAttribute('value',ids[i]);
        option.innerHTML=getName(ids[i]);
        listBox.appendChild(option);
      }
    } catch (e) { /* eat any exceptions due to bad prefs */ }
  }

  /* Adding redirector */
  listBox.addEventListener('change', function() {
      if (this.options[this.selectedIndex].value != 'null')
          doc.location = '/forum/forum.php?fid=' + this.options[this.selectedIndex].value;
  }, false);

  /* Now that we have the listBox all filled up... */
  let ref = doc.getElementById('tabsHolder')
            .getElementsByTagName("table")[1]
            .firstChild.firstChild;
  let cont = doc.createElement('td');
  listBox.setAttribute("style", "position:relative;right:1px;top:-1px;");
  cont.appendChild(listBox);
  cont.style.padding = "0px 3px 3px 0px";
  cont.setAttribute("align", "right");
  cont.setAttribute("valign", "middle");
  ref.replaceChild(cont, ref.childNodes[3]);
}

function RTSE_fixSearch(doc) {
    let search = doc.getElementById("search");
    let searchForm = search.parentNode;
    searchForm.method = "POST";
    searchForm.setAttribute("onsubmit", "this.action = '/members/journal/index.php?newLayout=1&search='+escape(this.search.value);", 0);
}

function RTSE_addToUserInfo(doc) {
    /* Adds additional links to the userInfo element in the site header */
    if(doc.getElementById("userInfo").getElementsByTagName("a").length != 2) {
        var lng = 11;
        if (!RTSE.sponsor) {
            lng = 7;
        }
        var userInfo = RTSE_evaluateXPath(doc,"//table[@id='userInfo']");
        userInfo = userInfo[0].firstChild.firstChild.firstChild;
        var userLinks = userInfo.getElementsByTagName('a');
        var userName = userLinks[0];
        var newNames = new Array( userName.innerHTML, "Sign Out", "Comments", "Log", 
            "Journal", "Messages", "Settings", "My Stats", "Mod History", 
            "Friend Journals", RTSE.sponsor ? "Sponsor" : "Become a Sponsor");
        if(doc.domain == "ah.roosterteeth.com")
            newNames[7] = "Stats";
        var newLinks = new Array( "/members/", "/members/signout.php", 
            "/members/comments/", "/members/log.php", "/members/journal", 
            "/members/messaging/", "/members/settings/", "/members/stats/myStats.php", 
            "/members/modHistory.php?nc=1", "/members/journal/friendsJournals.php?nc=1", 
            "/sponsRedir.php");
        var checkPrefs = new Array( "extensions.rtse.link.user", "extensions.rtse.link.signOut", 
        "extensions.rtse.link.comments", "extensions.rtse.link.log", "extensions.rtse.link.journal", 
        "extensions.rtse.link.messages", "extensions.rtse.link.settings", "extensions.rtse.link.myStats", 
        "extensions.rtse.link.modHistory", "extensions.rtse.link.friendJournals", 
        "extensions.rtse.link.sponsor", "extensions.rtse.link.avatar");
        var td = "";
        var line1 = 0;
        var line2 = 0;
        var line3 = 0;
        if(userLinks[1].innerHTML.match("new") ||
                userLinks[1].innerHTML.match("comic")) {
            td += "<a class='userInfo' style='opacity: 0.5;' " +
              "href='/members/'>You have new alerts</a>&nbsp;&middot;&nbsp;";
        }
        for(i = 0; i < lng; i++) {
            if (gRTSE.prefsGetBool(checkPrefs[i])) {
                if(i < 2) {
                    ++line1;
                }
                else if(i < 7) {
                    ++line2;
                }
                else {
                    ++line3;
                }
            }
        }
        for(i = 0; i < lng; i++) {
            if(i == 2 && line1 > 0 || i == 7 && line2 > 0) {
                td += "<br\>";
            }
            if (gRTSE.prefsGetBool(checkPrefs[i])) {
                if(i == 10 && gRTSE.prefsGetBool("extensions.rtse.link.star")) {
                        td += "<img " +
                            "src='/assets/images/subscriberStarSmallTrans.png'" +
                            " style='float: none;'>&nbsp;&nbsp;";
                }
                td += "<a href=" + newLinks[i] + " class=userInfo>" + 
                    newNames[i] + "</a>";
                if(i <= 1 && line1 > 1) {
                    td += "&nbsp;&middot;&nbsp;";
                    --line1;
                }
                if(2 <= i && i <= 6 && line2 > 1) {
                    td += "&nbsp;&middot;&nbsp;";
                    --line2;
                }
                if(7 <= i && line3 > 1) {
                    td += "&nbsp;&middot;&nbsp;";
                    --line3;
                }
            }
        }
        if(lng==7 && gRTSE.prefsGetBool(checkPrefs[10])){
            td += "<br\>"
            if(gRTSE.prefsGetBool("extensions.rtse.link.star")){
                td += "&nbsp;<img src='/assets/images/subscriberStarSmallTrans.png' " +
                "style='float: none;'>&nbsp;";
            }
            td += "<a href=" + newLinks[10] + " class=userInfo>" + newNames[10] + "</a>";
        }
        userInfo.innerHTML = td;
        if(!gRTSE.prefsGetBool(checkPrefs[11])) {
            userInfo.parentNode.getElementsByTagName("td")[1].style.display = "none";
        }
    }
}

function RTSE_addExtraTab(aDoc) {
// EFFECTS: Adds a tab with user-set links
  if(gRTSE.prefsGetBool("extensions.rtse.extras.tab")) {
    // Let's not break the entire add-on if something didn't validate correctly.
    try {
        let texts = gRTSE.prefsGetString("extensions.rtse.extras.tabText0") + "," + 
                    gRTSE.prefsGetString("extensions.rtse.extras.tabText1") + "," +
                    gRTSE.prefsGetString("extensions.rtse.extras.tabText2") + "," +
                    gRTSE.prefsGetString("extensions.rtse.extras.tabText3") + ",";
        let links = gRTSE.prefsGetString("extensions.rtse.extras.tabLink0") + "," + 
                    gRTSE.prefsGetString("extensions.rtse.extras.tabLink1") + "," +
                    gRTSE.prefsGetString("extensions.rtse.extras.tabLink2") + "," +
                    gRTSE.prefsGetString("extensions.rtse.extras.tabLink3") + ",";
        
        let textArray = texts.split(",");
        let linkArray = links.split(",");
        
        if(textArray.length > 0 && linkArray.length > 0) {
            //cuts off the end of the list of tabs, allowing us to directly insert  our new tab
            var tabs = aDoc.getElementById("sddm");
            var arr = tabs.innerHTML.split("");
            var idx = tabs.innerHTML.length-5;
            arr.splice(idx,5);
            tabs.innerHTML = arr.join("");
            
            if(textArray[0] == "")
                textArray[0] = " ";
            if(linkArray[0] == "")
                linkArray[0] = " ";
            //remove the "href="+linkArray[0]+" portion if you wish for the tab header to do nothing.
            tabs.innerHTML += "<li><a class='tabRoot' id='mlink7' href="+linkArray[0]+" onmouseover='mopen(\"7\");' onmouseout='mclosetime();'>"+textArray[0]+"</a>"+
                    "<div id='m7' class='hold' style='border: 0pt none ; background: transparent none repeat scroll 0% 0%; padding-top: 0px; z-index: 210; width: 150px; -moz-background-clip: border; -moz-background-origin: padding; -moz-background-inline-policy: continuous; outline-color: -moz-use-text-color; outline-style: none; outline-width: 0pt;' onmouseover='mcancelclosetime()'>"+
                    "<div style='visibility: inherit; position: static; z-index: 220;' onmouseover='mcancelclosetime()' onmouseout='mclosetime()'>"+
                    "</div>"+
                    "</div>"+
                    "</li></ul>";

            for(let i = 1; i < 4 && i < textArray.length && i < linkArray.length; i++) {
                let newChildLink = aDoc.createElement("a");
                newChildLink.href = linkArray[i];
                newChildLink.innerHTML = textArray[i];
                if(textArray[i] != "" && linkArray[i] != "") {
                    aDoc.getElementById("m7").firstChild.appendChild(newChildLink);
                }
            }

            if(aDoc.getElementById("m7").firstChild.firstChild == null) {
                tabs.lastChild.removeChild(tabs.lastChild.lastChild);
            } else {
                let newSpan = aDoc.createElement("span");
                newSpan.className = "redBar";
                aDoc.getElementById("m7").getElementsByTagName("div")[0].appendChild(newSpan);
            }
        }
    } catch(e) {
        throw("addExtraTab() experienced an error. Try validating its options.");
    }
  }
}

function RTSE_postPermalink(aDoc)
// EFFECTS: Adds a permalink to posts on a page in aDoc
{
    let elms=RTSE_evaluateXPath(aDoc,"//td[@id='pageContent']/table/tbody/tr[1]/td/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[1]/span");
    if(elms.length == 0)
        elms=RTSE_evaluateXPath(aDoc,"//td[@id='pageContent']/table/tbody/tr[1]/td/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[1]/span");
    let a,text,num;
    let base=new String(aDoc.location.href);
    base=base.replace(/^https?:\/\/(www|rvb|sh|panics|magic)\.roosterteeth\.com(.*)$/,'$2');
    base=base.replace(/.*(#[c|t][0-9]+)$/i,'');
    for( let i in elms ) {
      text=elms[i].firstChild.data;
      if( /^\s*#([0-9]+)[\s\S]*$/i.test(text) ) {
        a=aDoc.createElement('a');
        a.setAttribute('title','Permalink');
        text=text.replace(/(\n|\t)/gmi,'');
        num=text.replace(/^.*#([0-9]+).*$/i,'$1');
        a.setAttribute('href',base+'#t'+num);
        a.appendChild(aDoc.createTextNode('#'+num));
        text=' '+text.replace(/^#[0-9]+(.*?)$/,'$1');
        elms[i].replaceChild(aDoc.createTextNode(text),elms[i].firstChild);
        elms[i].insertBefore(a,elms[i].firstChild);
      }
    }
}

function RTSE_samePageReply(aEvent)
// EFFECTS: Function called when clicking on reply when same page replies is enabled
{
  let name, num;
  // Get post and what-not
  try {
    name = this.parentNode.parentNode.parentNode.parentNode.parentNode
                 .parentNode.parentNode.parentNode.parentNode.parentNode
                 .getElementsByTagName('td')[0]
                 .getElementsByTagName('table')[0]
                 .getElementsByTagName('tbody')[0]
                 .getElementsByTagName('tr')[1].getElementsByTagName('td')[0]
                 .getElementsByTagName('span')[0]
                 .firstChild.firstChild.innerHTML;
  }
  catch (e) {
    name = this.parentNode.parentNode.parentNode.parentNode.parentNode
                 .parentNode.parentNode.parentNode.parentNode.parentNode
                 .getElementsByTagName('td')[0]
                 .getElementsByTagName('table')[0]
                 .getElementsByTagName('tbody')[0]
                 .getElementsByTagName('tr')[1].getElementsByTagName('td')[0]
                 .getElementsByTagName('a')[0].innerHTML;
  }

  name=name.replace(new RegExp('\t','gmi'),'');
  name=name.replace(new RegExp('\n','gmi'),'');

  try {
    num = this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
                .getElementsByTagName('td')[0].getElementsByTagName("span")[0].getElementsByTagName('a')[0]
                .firstChild.data;
    num = num.replace(/#([0-9]+)/,'$1');
  } catch(e) { /* this is either a comments page, or postPermalink did not run correctly */ }

  // Convert the form so that it posts to Blog Thread's Commentary if "reply"
  // is clicked from a Blog itself.
  let doc = this.ownerDocument;
  let blogId = doc.URL.split("&")[0].split("id=")[1];
  let threads = {
    "2176351": "2221303",
    "2186795": "2186937"
  };
  let titles = {
    "2176351": "Tech Blog Commentary Thread",
    "2186795": "P&CE Blog Commentary Thread"
  };

  if(gRTSE.prefsGetBool("extensions.rtse.extras.formRedirect")) {
    if(blogId in threads) {
      RTSE_modifyForm(doc, "/forum/viewTopic.php?id=" + threads[blogId], "/forum/viewTopic.php?id=" + threads[blogId],
                      titles[blogId], "/forum/replyPost.php?id=" + threads[blogId]);
      num = "[link=" + doc.URL.split("&page=")[0] + "&post=" + num +"]Blog Post #" + num + "[/link]";
    }
    if(doc.URL.match("/comments/") == "/comments/" || doc.URL.match("/members/profile.php") == "/members/profile.php") {
      let uID;
      try {
         uID = this.parentNode.parentNode.parentNode.parentNode.parentNode
                   .parentNode.parentNode.parentNode.parentNode.parentNode
                   .getElementsByTagName('td')[0]
                   .getElementsByTagName('table')[0]
                   .getElementsByTagName('tbody')[0]
                   .getElementsByTagName('tr')[1].getElementsByTagName('td')[0]
                   .getElementsByTagName('span')[0]
                   .firstChild.firstChild.href.split("?uid=")[1];
      } catch(e) {
         uID = this.parentNode.parentNode.parentNode.parentNode.parentNode
                   .parentNode.parentNode.parentNode.parentNode.parentNode
                   .getElementsByTagName('td')[0]
                   .getElementsByTagName('table')[0]
                   .getElementsByTagName('tbody')[0]
                   .getElementsByTagName('tr')[1].getElementsByTagName('td')[0]
                   .getElementsByTagName('a')[0].href.split("?uid=")[1];
      }
      RTSE_modifyForm(doc, "/members/comments/commentPost.php?uid=" + uID, doc.URL,
                      name + "'s Comments", "/members/comments/commentPost.php?uid=" + uID);
    }
  }

  // Append to editor
  let editor, text;
  if(num) {
    if(num.search("#") < 0)
      num = "#" + num;
    text = '[i]In reply to '+name+', '+num+':[/i]\n\n';
  }
  else
    text = '[i]In reply to '+name+':[/i]\n\n';
  let useEditor = gRTSE.prefsGetBool("extensions.rtse.editor");
  if (useEditor) {
    editor = document.getElementById("rtse-editor-body");
    RTSE.editor.ensureEditorIsVisible();
  } else {
    editor = this.ownerDocument.forms.namedItem('post').elements.namedItem('body');
  }

  let buttonText = gRTSE.prefsGetBool("extensions.rtse.editor.buttonText");
  if(buttonText) {
      //insert 'reply to' text at cursor
      try {
        let pos = editor.selectionStart + text.length;

        editor.value = editor.value.substring(0, editor.selectionStart) + text +
                    editor.value.substring(editor.selectionStart, editor.textLength);
        editor.setSelectionRange(pos, pos);
      } catch(e) {
        //add the text, even if the editor is currently closed
        editor.value = editor.value + text;
      }
  }
  else {  
    editor.value = editor.value + text;
  }
  
  if (useEditor) {
    // We want to simulate the user doing this, so send out an input event.
    let e = document.createEvent("UIEvents");
    e.initUIEvent("input", true, false, window, 0);
    editor.dispatchEvent(e);
  }
  editor.focus();
}

/**
 * Modifies the post form on the current page to post to a different page
 *
 * @param aDoc The document to be modified
 * @param toVal The post's destination value
 * @param returnVal The page that the site loads after submission
 * @param previewTitleVal The name of the page being previewed
 * @param actionVal The form's new action parameter
 */
function RTSE_modifyForm(aDoc, toVal, returnVal, previewTitleVal, actionVal)
{
    // Show notificationbox to inform the user
    let notifyBox = gBrowser.getNotificationBox();
    notifyBox.removeAllNotifications(false)
    let box = notifyBox.appendNotification("Now Replying Directly to " + previewTitleVal, "rtse-direct", null, notifyBox.PRIORITY_INFO_LOW, null);
    box.persistence = 0;

    previewTitleVal = previewTitleVal.replace("'", "&#039;");
    // Change the form to reply directly to commentary thread
    aDoc.forms.namedItem("post").elements.namedItem("to").value = toVal;
    aDoc.forms.namedItem("post").elements.namedItem("return").value = returnVal;
    aDoc.forms.namedItem("post").elements.namedItem("previewTitle").value = previewTitleVal;
    aDoc.forms.namedItem("post").action = actionVal;
}

/**
 * Modifies all replies to keep them on the same page.
 *
 * @param aDoc The document to be modified.
 */
function RTSE_modifyReply(aDoc)
{
  if(!RTSE.editor.replaceableElements(aDoc))
    return;

  let elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[1]/td/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[1]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[2]/td/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[1]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[1]/td/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[1]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr/td/table/tbody/tr/td/table[2]/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[1]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[2]/td/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[1]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[2]/td/table/tbody/tr/td/table[2]/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[1]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr/td/table/tbody/tr[1]/td/table[2]/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[1]/a/b");
  if(elms.length == 0) {
    elms = RTSE_evaluateXPath(aDoc.getElementById("comments").parentNode, "//table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[1]/a/b");
  }
  for (let i in elms) {    
    elms[i].parentNode.removeAttribute("href");
	elms[i].parentNode.removeAttribute("onclick");
    //only go down to RT's editor if that's what you're using
    if(!gRTSE.prefsGetBool("extensions.rtse.editor"))
        elms[i].parentNode.href = aDoc.getElementById("Post") ? "#Post" : "#add";
    elms[i].addEventListener("click", RTSE_samePageReply, false);
  }
}

function RTSE_modifyQuote(aDoc)
{
  let span,a,b;
  if(!RTSE.editor.replaceableElements(aDoc))
    return;
  let elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[1]/td/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[2]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[2]/td/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[2]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[1]/td/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[2]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr/td/table/tbody/tr/td/table[2]/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[2]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[2]/td/table/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[2]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[2]/td/table/tbody/tr/td/table[2]/tbody/tr[2]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[2]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr/td/table/tbody/tr[1]/td/table[2]/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[2]/a/b");
  if(elms.length == 0) {
    elms = RTSE_evaluateXPath(aDoc.getElementById("comments").parentNode, "//table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[2]/a/b");
  }
  for (let i in elms) {    
    elms[i].parentNode.removeAttribute("href");
	elms[i].parentNode.removeAttribute("onclick");
    span=aDoc.createElement('span');
    a=aDoc.createElement('a');
    b=aDoc.createElement('b');
    a.setAttribute('class','small');
    a.addEventListener('click',RTSE_quotePost,false);
    b.appendChild(aDoc.createTextNode('Quote'))
    a.appendChild(b);
    span.appendChild(a);
    //only go down to RT's editor if that's what you're using
    if(!gRTSE.prefsGetBool("extensions.rtse.editor"))
        a.href = aDoc.getElementById("Post") ? "#Post" : "#add";
    elms[i].parentNode.replaceChild(span, elms[i]);
  }
}

function RTSE_quotePost(aEvent)
// EFFECTS: Quotes a post
{
  let name, num;
  let text = "";
  if(gRTSE.prefsGetBool("extensions.rtse.editor.quoteReply")) {
      //Generate the "Reply To" text as well
      try {
        name = this.parentNode.parentNode.parentNode.parentNode.parentNode
                    .parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
                     .getElementsByTagName('td')[0]
                     .getElementsByTagName('table')[0]
                     .getElementsByTagName('tbody')[0]
                     .getElementsByTagName('tr')[1].getElementsByTagName('td')[0]
                     .getElementsByTagName('span')[0]
                     .firstChild.firstChild.innerHTML;
      }
      catch (e) {
        name = this.parentNode.parentNode.parentNode.parentNode.parentNode
                    .parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
                     .getElementsByTagName('td')[0]
                     .getElementsByTagName('table')[0]
                     .getElementsByTagName('tbody')[0]
                     .getElementsByTagName('tr')[1].getElementsByTagName('td')[0]
                     .getElementsByTagName('a')[0].innerHTML;
      }
      name=name.replace(new RegExp('\t','gmi'),'');
      name=name.replace(new RegExp('\n','gmi'),'');

      num = this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode
                    .getElementsByTagName('td')[0].getElementsByTagName('a')[0]
                    .firstChild.data;
      num = num.replace(/#([0-9]+)/,'$1');
      text = '[i]In reply to '+name+', #'+num+':[/i]\n\n';
  }
  let ref = this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode;
  let post = RTSE_evaluateXPath(ref,'./tr[2]/td');
  let text2 = new String(post[0].innerHTML);

  text += '[quote]' + RTSE_HTMLtoBB(text2) + '[/quote]\n\n';

  // update the text of the body
  let editor;
  let useEditor = gRTSE.prefsGetBool("extensions.rtse.editor");
  if (useEditor) {
    editor = document.getElementById("rtse-editor-body");
    RTSE.editor.ensureEditorIsVisible();
  } else {
    editor = this.ownerDocument.forms.namedItem("post").elements
                 .namedItem("body");
  }

  let buttonText = gRTSE.prefsGetBool("extensions.rtse.editor.buttonText");
  if(buttonText) {
      //insert quoted text at cursor
      try {
        let pos = editor.selectionStart + text.length;

        editor.value = editor.value.substring(0, editor.selectionStart) + text +
                    editor.value.substring(editor.selectionStart, editor.textLength);
        editor.setSelectionRange(pos, pos);
      } catch(e) {
        //add the text, even if editor is currently closed
        editor.value = editor.value + text;
      }
  }
  else {  
    editor.value = editor.value + text;
  }
  
  if (useEditor) {
    // We want to simulate the user doing this, so send out an input event.
    let e = document.createEvent("UIEvents");
    e.initUIEvent("input", true, false, window, 0);
    editor.dispatchEvent(e);
  }
  editor.focus();
}

function RTSE_convertExtraBB(aEvent)
// EFFECTS: converts to the site BBcode.  Takes an element in the parent document.
{
  var doc = aEvent.originalTarget.ownerDocument;
  var form = doc.forms.namedItem("post");
  var body = form.elements.namedItem("body");

  body.value = RTSE.editor.convertExtraBB(body.value);
}

function RTSE_deconvertExtraBB(aDoc)
// EFFECTS: takes special BBcode from RTSE and converts it back to RT BBcode.
{
  var form = aDoc.forms.namedItem('post');
  // converts to RTSE BB
  var body = form.elements.namedItem('body');
  if (!body) return;

  // Smilies
  if (gRTSE.prefsGetBool('extensions.rtse.editor')) {
    body.value = RTSE.smilies.deconvert(body.value);
  }

  body.value = body.value.replace(/\[b\]Quoting ([a-zA-Z0-9_]{4,12}):\[\/b\]\[quote\]([\s\S]+)\[\/quote\]/g,'[quote=$1]$2[/quote]');
}

function RTSE_HTMLtoBB(aText)
// EFFECTS: Converts site HTML to BBcode
{
  // Takes care of nesting problems due to In Reply to...
  aText = aText.replace(/<a href=".*?"><i>#([0-9]+)<\/i><\/a>/g,'#$1');

  aText = aText.replace(/<(b|i|u)>/g,'[$1]');
  aText = aText.replace(/<\/(b|i|u)>/g,'[/$1]');
  aText = aText.replace(/<del>/g,'[s]');
  aText = aText.replace(/<\/del>/g,'[/s]');
  aText = aText.replace(/<a href="([^" \t\n<>]+)" target="_blank">/g,'[link=$1]');
  aText = aText.replace(/<a href="(\/[^" \t\n<>]+)">/g,'[link=$1]');
  aText = aText.replace(/<\/a>/g,'[/link]');

  aText = aText.replace(/<\/pre>/g,'[/code]'); 
  aText = aText.replace(/<pre>/g,'[code]'); 

  aText = aText.replace(/<img .*?src="\/assets\/images\/emoticons\/(.*?)\.gif".*?>/g,'[$1]');
  aText = aText.replace(/<img.*? src="(.*?)".*?>/g,'[img]$1[/img]');
  aText = aText.replace(/<br><br><span class="small"(.*?)>(.*?)<\/span>/g,'');
  aText = aText.replace(/<blockquote(.*?)>(.*?)<\/blockquote>/g,'');
  aText = aText.replace(/\t/g,'');
  aText = aText.replace(/<wbr>/g,'');
  aText = aText.replace(/\n/g,'');
  aText = aText.replace(/<br>/g,'\n');

  aText = aText.replace(/<span style="background-color: rgb\(221, 221, 221\); color: rgb\(221, 221, 221\);">(.*?)<\/span>/, "[spoiler]$1[/spoiler]");
  // Sponsor stuff for colors (preserves if you are a sponsor)
  if (RTSE.sponsor) {
    while(/<span style="color: rgb(.*?);">/.test(aText)) {
       let numbers = aText.split(/<span style="color: rgb\(/)[1].split(/\);">/)[0].split(", ");
       for(i in numbers) {
          numbers[i] = parseInt(numbers[i]).toString(16);
          if(numbers[i].length < 2) {
             numbers[i] = "0" + numbers[i];
          }
       }
       aText = aText.replace(/<span style="color: rgb(.*?);">/, "[color=#" + numbers[0] +numbers[1] +numbers[2] + "]");
    }
     aText = aText.replace(/<span style="color: (.*?);">/g,'[color=$1]');
     aText = aText.replace(/<\/span>/g,'[/color]');
  } else {
    aText = aText.replace(/<span style="color:.*?">/g,'');
    aText = aText.replace(/<\/span>/g,'');
  }

  // HTML entities
  aText = aText.replace(/&amp;/g,'&');
  aText = aText.replace(/&lt;/g,'<');
  aText = aText.replace(/&gt;/g,'>');

  return aText;
}

function RTSE_addSearchPlugins(aDoc)
// EFFECTS: Adds the proper link tags for the search plugins
{
  var head = aDoc.getElementsByTagName("head")[0];
  var titles = ["RT User Search",
                "RT Tag Search",
                "RT Forum Thread Search",
                "RT Forum Post Search"];
  var hrefs = ["http://files.shawnwilsher.com/projects/rtse/search/users.xml",
               "http://files.shawnwilsher.com/projects/rtse/search/tags.xml",
               "http://files.shawnwilsher.com/projects/rtse/search/threads.xml",
               "http://files.shawnwilsher.com/projects/rtse/search/posts.xml"];
  var link;
  for (var i = (titles.length - 1); i >= 0; --i) {
    link = aDoc.createElement("link");
    link.setAttribute("rel", "search");
    link.setAttribute("type", "application/opensearchdescription+xml");
    link.setAttribute("title", titles[i]);
    link.setAttribute("href", hrefs[i]);
    head.appendChild(link);
  }
}

