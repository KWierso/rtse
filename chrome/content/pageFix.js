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
            if((elements[i].parentNode.parentNode.getElementsByTagName("a")[0].href.match(/page=1/) ||
                    elements[i].parentNode.parentNode.getElementsByTagName("a")[0].innerHTML == "Add a Comment") &&
                    !elements[i].parentNode.parentNode.innerHTML.match("new ") && 
                    !elements[i].parentNode.parentNode.innerHTML.match("Back") ) // Don't let watchlist items get added!
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
                            let newURL;
                            if(aDoc.URL.match("modHistory.php") == "modHistory.php" || aDoc.URL.match("top.php") == "top.php") {
                                if(aDoc.URL.match("modHistory.php") == "modHistory.php")
                                    newURL = "http://" + aDoc.domain + "/members/modHistory.php?nc=1&page=" + this.value;
                                else
                                    newURL = "http://" + aDoc.domain + "/forum/top.php?page=" + this.value;
                            }
                            else
                                newURL = aDoc.URL.split("#")[0].split("&page=")[0] + "&page=" + this.value;
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
                        let newURL;
                        if(aDoc.URL.match("modHistory.php") == "modHistory.php" || aDoc.URL.match("top.php") == "top.php") {
                            if(aDoc.URL.match("modHistory.php") == "modHistory.php")
                                newURL = "http://" + aDoc.domain + "/members/modHistory.php?nc=1&page=" + this.value;
                            else
                                newURL = "http://" + aDoc.domain + "/forum/top.php?page=" + this.value;
                        }
                        else
                            newURL = aDoc.URL.split("#")[0].split("&page=")[0] + "&page=" + this.value;
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
  var regEx = /^http:\/\/((|panics.|magic.|m.|myspace.)roosterteeth|achievementhunter|strangerhood|redvsblue|roosterteethcomics|captaindynamic).com(.*)$/i;
  var loc = aDoc.location.href
                .replace(regEx,'$3');
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

  for (var i = (links.length - 1); i >= 0; --i) {
    if (links[i].href.match(regEx)) {
      links[i].removeAttribute('target');
      links[i].href=links[i].href.replace(regEx, '$3');
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
    42,
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
  let ref = doc.getElementById('headerImage');

  let cont = doc.createElement('div');
  listBox.setAttribute("style", "position:absolute;left:15px;top:5px;");
  listBox.setAttribute("align", "right");
  cont.appendChild(listBox);
  cont.style.padding = "1px 0px 0px 1px";
  cont.setAttribute("align", "left");
  cont.setAttribute("valign", "middle");
  cont.setAttribute("width", "350px");
  ref.insertBefore(cont, ref.firstChild);
}

function RTSE_fixSearch(doc) {
    let search = doc.getElementById("search");
    let searchForm = search.parentNode;
    searchForm.method = "POST";
    searchForm.setAttribute("onsubmit", "this.action = '/members/journal/index.php?newLayout=1&search='+escape(this.search.value);", 0);
}

function RTSE_addToUserInfo(doc) {
    /* Adds additional links to the userInfo element in the site header */
    if(doc.getElementById("userInfo").getElementsByTagName("a").length != 3) {
        var lng = 13;
        if (!RTSE.sponsor) {
            lng = 8;
        }
        var userInfo = RTSE_evaluateXPath(doc,"//table[@id='userInfo']");
        userInfo = userInfo[0].firstChild.firstChild.firstChild;
        var userLinks = userInfo.getElementsByTagName('a');
        var userName = userLinks[0];

        // All potential items for inclusion, along with their preferences
        var newNames = new Array( userName.innerHTML, "Sign Out", "Groups", "Comments", "Log", 
            "Journal", "Messages", "Images", "My Stats", "Mod History", "Friend Journals", 
            RTSE.sponsor ? "Sponsor" : "Become a Sponsor", "Settings");
        var newLinks = new Array( "/members/", "/members/signout.php", "/members/groups.php",
            "/members/comments/", "/members/log.php", "/members/journal", 
            "/members/messaging/", "/members/images/", "/members/stats/myStats.php", 
            "/members/modHistory.php?nc=1", "/members/journal/friendsJournals.php?nc=1", 
            "/sponsRedir.php", "/members/settings/");
        var checkPrefs = new Array( "extensions.rtse.link.user", "extensions.rtse.link.signOut", 
        "extensions.rtse.link.groups", "extensions.rtse.link.comments", "extensions.rtse.link.log", 
        "extensions.rtse.link.journal", "extensions.rtse.link.messages", "extensions.rtse.link.images",
        "extensions.rtse.link.myStats", "extensions.rtse.link.modHistory", "extensions.rtse.link.friendJournals", //8 9 10
        "extensions.rtse.link.sponsor", "extensions.rtse.link.settings", "extensions.rtse.link.avatar"); //11 12 13

        // Initialize new element and some counters
        var td = "";
        var line1 = 0;
        var line2 = 0;
        var line3 = 0;

        // Does the user have any alerts displayed?
        if(userLinks[1] != "http://" + doc.domain + "/members/signout.php" &&
           userLinks[1] != "https://" + doc.domain + "/members/signout.php") {
                td += "<a class='userInfo' style='opacity: 0.5;' " +
                      "href='" + userLinks[1] +"'>" + userLinks[1].innerHTML + 
                      "</a>&nbsp;&middot;&nbsp;";
        }

        // Compute how many items will be on each line
        for(i = 0; i < lng; i++) {
            if (gRTSE.prefsGetBool(checkPrefs[i])) {
                if(i < 2) {
                    ++line1;
                }
                else if(i < 8) {
                    ++line2;
                }
                else {
                    ++line3;
                }
            }
        }

        // Add first two rows for everybody, add third row for sponsors
        for(i = 0; i < lng; i++) {
            if(i == 2 && line1 > 0 || i == 8 && line2 > 0) {
                td += "<br\>";
            }
            if (gRTSE.prefsGetBool(checkPrefs[i])) {
                if(i == 8 && gRTSE.prefsGetBool("extensions.rtse.link.star")) {
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
                if(2 <= i && i <= 7 && line2 > 1) {
                    td += "&nbsp;&middot;&nbsp;";
                    --line2;
                }
                if(8 <= i && line3 > 1) {
                    td += "&nbsp;&middot;&nbsp;";
                    --line3;
                }
            }
        }

        // Add any of the enabled non-sponsor items from the third row
        if(lng==8 && (gRTSE.prefsGetBool(checkPrefs[10]) || gRTSE.prefsGetBool(checkPrefs[12])) ) {
            td += "<br\>"
            if(gRTSE.prefsGetBool("extensions.rtse.link.star")){
                td += "&nbsp;<img src='/assets/images/subscriberStarSmallTrans.png' " +
                "style='float: none;'>&nbsp;";
            }
            if(gRTSE.prefsGetBool(checkPrefs[10]))
                td += "<a href=" + newLinks[10] + " class=userInfo>" + newNames[10] + "</a>";
            if(gRTSE.prefsGetBool(checkPrefs[10]) && gRTSE.prefsGetBool(checkPrefs[12]))
                td += "&nbsp;&middot;&nbsp;";
            if(gRTSE.prefsGetBool(checkPrefs[12]))
                td += "<a href=" + newLinks[12] + " class=userInfo>" + newNames[12] + "</a>";
        }

        // Replace the element on the page
        userInfo.innerHTML = td;

        // Hide the user's avatar image if so desired
        if(!gRTSE.prefsGetBool(checkPrefs[13])) {
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
            // Get the element that contains all of the tabs
            let tabs = aDoc.getElementById("barLight").getElementsByTagName("table")[0]
                           .getElementsByTagName("td")[1].getElementsByTagName("table")[1]
                           .getElementsByTagName("td")[0];

             // Create the tab header element
             let newTabDiv = aDoc.createElement("div");
             newTabDiv.className = "navDivTop";
             newTabDiv.setAttribute("style", "padding-right:3px;");

             // Create the text and link for the tab header
             let newTabLink = aDoc.createElement("a");
             newTabLink.id="navButton9";
             newTabLink.className = "navbutton";
             newTabLink.href = linkArray[0];
             newTabLink.setAttribute("onmouseover", "navShow(9);");
             newTabLink.innerHTML = textArray[0];

             // Create the container for the dropdown links
             let newChildDiv = aDoc.createElement("div");
             newChildDiv.id = "navDiv9";
             newChildDiv.className = "navDiv";
             newChildDiv.setAttribute("style", "top:15px;");

             // Another div, because that's the way the site's dropdowns work
             let newInnerDiv = aDoc.createElement("div");
             newInnerDiv.setAttribute("style", "z-index:999;");

             // Attach everything together and append to the navBar
             newChildDiv.appendChild(newInnerDiv);
             newTabDiv.appendChild(newTabLink);
             newTabDiv.appendChild(newChildDiv);
             tabs.insertBefore(newTabDiv, tabs.lastChild);

            if(textArray[0] == "")
                textArray[0] = " ";
            if(linkArray[0] == "")
                linkArray[0] = " ";

            // Insert the links into the dropdown
            for(let i = 1; i < 4 && i < textArray.length && i < linkArray.length; i++) {
                let newChildLink = aDoc.createElement("a");
                newChildLink.href = linkArray[i];
                newChildLink.className = "navHovLink";
                newChildLink.innerHTML = textArray[i];
                if(textArray[i] != "" && linkArray[i] != "") {
                    newInnerDiv.appendChild(newChildLink);
                }
            }

            // Hide the dropdown element if there are no links added
            if(newInnerDiv.firstChild == null) {
                newChildDiv.setAttribute("style", "display:none !important;");
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
    let elms=RTSE_evaluateXPath(aDoc,"//td[@id='pageContent']/table/tbody/tr[1]/td[1]/table/tbody/tr[1]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[1]/span");
    if(elms.length == 0)
        elms=RTSE_evaluateXPath(aDoc,"//td[@id='pageContent']/table/tbody/tr[1]/td/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[1]/span");
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
    if( (doc.URL.match("/comments/") == "/comments/" || doc.URL.match("/members/profile.php") == "/members/profile.php") ||
           (doc.getElementById("Add a Comment") && doc.getElementById(" Friends") && doc.getElementById("The Goods"))) 
                        // Those getElementById's essentially confirm that this is a user's profile
    {
      let uID;
      try {
         // Get uID for redirection from the "Conversation" button
         uID = this.parentNode.parentNode.parentNode.getElementsByTagName('span')[3]
                   .firstElementChild.href;
         uID = uID.split("with=")[1];

         // Saving the old way of finding the uID, since it might come in handy in the future
         // uID = this.parentNode.parentNode.parentNode.parentNode.parentNode
                   // .parentNode.parentNode.parentNode.parentNode.parentNode
                   // .getElementsByTagName('td')[0]
                   // .getElementsByTagName('table')[0]
                   // .getElementsByTagName('tbody')[0]
                   // .getElementsByTagName('img')[0].getAttribute("src");
         // uID = uID.split("?")[1];
      } catch(e) { /* Something went wrong and we can't find the uID */ }
      if(uID != null && uID != "undefined") { // Only modify the form if the uID can be found
         if(doc.URL.match("/conversation.php") != "/conversation.php") // Don't redirect form if on a conversation page
            RTSE_modifyForm(doc, "/members/comments/commentPost.php?uid=" + uID, doc.URL,
                  name + "'s Comments", "/members/comments/commentPost.php?uid=" + uID);
      } else {
        alert("This user's ID number cannot be found for some reason. " +
                         "You should probably reconsider hitting 'submit' " +
                         "before you make a fool of yourself.");
      }
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
function RTSE_modifyForm(aDoc, toVal, returnVal, previewTitleVal, actionVal, noMessage)
{
    // Show notificationbox to inform the user
    if(noMessage == null) {
        let notifyBox = gBrowser.getNotificationBox();
        notifyBox.removeAllNotifications(false)
        let box = notifyBox.appendNotification("Now Replying Directly to " + previewTitleVal, 
                                               "rtse-direct", 
                                               "chrome://rtse/skin/images/icon.png", 
                                               notifyBox.PRIORITY_INFO_LOW, 
                                               Array({label: "Restore Original Target", callback: RTSE_restoreForm}));
        box.persistence = 0;
    }

    // Change the form to reply directly to the intended location
    if(toVal != null)
        aDoc.forms.namedItem("post").elements.namedItem("to").value = toVal;
    if(returnVal != null)
        aDoc.forms.namedItem("post").elements.namedItem("return").value = returnVal;
    if(previewTitleVal != null) {
        previewTitleVal = previewTitleVal.replace("'", "&#039;");
        aDoc.forms.namedItem("post").elements.namedItem("previewTitle").value = previewTitleVal;
    }
    if(actionVal != null)
        aDoc.forms.namedItem("post").action = actionVal;
}

/**
 * Restore the post form to the original information
 */
function RTSE_restoreForm() {
    let aDoc = gBrowser.contentDocument;
    let originalForm = aDoc.getElementById("originalForm");

    // Get the attributes from the hidden element and replace the modified values with the originals
    aDoc.forms.namedItem("post").elements.namedItem("to").value = originalForm.getAttribute("to");
    aDoc.forms.namedItem("post").elements.namedItem("return").value = originalForm.getAttribute("return");
    aDoc.forms.namedItem("post").elements.namedItem("previewTitle").value = originalForm.getAttribute("previewTitle");
    aDoc.forms.namedItem("post").action = originalForm.getAttribute("action");
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

  let elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[1]/td[1]/table/tbody/tr[1]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[1]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[1]/td[1]/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[1]/a/b");
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

  // Add the original form's attributes to a hidden element for restoration if the redirect pref is set
  if(gRTSE.prefsGetBool("extensions.rtse.extras.formRedirect")) {
    let originalForm = aDoc.createElement("div");
    originalForm.id = "originalForm";
    originalForm.setAttribute("style", "display: none !important;");
    originalForm.setAttribute("to", aDoc.forms.namedItem("post").elements.namedItem("to").value);
    originalForm.setAttribute("return", aDoc.forms.namedItem("post").elements.namedItem("return").value);
    originalForm.setAttribute("previewTitle", aDoc.forms.namedItem("post").elements.namedItem("previewTitle").value);
    originalForm.setAttribute("action", aDoc.forms.namedItem("post").action);
    aDoc.getElementsByTagName("body")[0].appendChild(originalForm);
  }
}

function RTSE_modifyQuote(aDoc)
{
  let span,a,b;
  if(!RTSE.editor.replaceableElements(aDoc))
    return;
  let elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[1]/td[1]/table/tbody/tr[1]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[2]/a/b");
  if(elms.length == 0)
    elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[1]/td[1]/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/span[3]/span[2]/a/b");
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

  // Reset all buttons in the ATE
  var editor = document.getElementById("rtse-editor");
  var buttons = editor.getElementsByTagName("button");
  for(let i in buttons)
    buttons[i].checked = false;

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

function RTSE_findOnDomain(dom)
// EFFECT: Returns boolean variable if 'dom' is a roosterteeth domain
{
    // about:blank doesn't pass a domain, but it still calls this function
    // Prevent it from trying to run on about:blank.
    if(dom) {
        let periods = dom.match(/\./g).length;
        if(periods == 1)
            dom = dom.split(".")[0];
        if(periods == 2) 
            dom = dom.split(".")[1];

        let domains = ["roosterteeth", "achievementhunter", "strangerhood", "redvsblue", "roosterteethcomics", "captaindynamic"];

        if(domains.indexOf(dom) >= 0)
            return true;
        else
            return false;
    } else {
        return false;
    }
}

function RTSE_adjustFloatingBar(aDoc) {
// EFFECT: Modifies aspects of the floating nav bar to compensate
//         for the changed height of the header due to RTSE's 
//         "show/hide header" option
    // Adjust initial position of the navbar
    let firstScript = aDoc.getElementsByTagName("script")[0];
    firstScript.innerHTML = "topNavPos = 120;";
    eval(firstScript.innerHTML);

    let scrolling = aDoc.getElementsByTagName("body")[0]
                        .getElementsByTagName("script")[0];
    if(scrolling.innerHTML.search("updateNavScroll") >=0)
    {
        aDoc.getElementById("floatingNavDiv").style.top = null;
        if(aDoc.defaultView.scrollY >= 120)
            aDoc.getElementById("floatingNavDiv").style.top = "0px";
        else
            aDoc.getElementById("floatingNavDiv").style.top = "120px";
        aDoc.getElementById("floatingNavDiv").style.zIndex = null;
        aDoc.getElementById("floatingNavDiv").style.zIndex = "120";
        aDoc.getElementById("floatingNavDiv").className = "adjusted";

        // Override RT's updateNavScroll() method to enforce adjusted height
        let head= aDoc.getElementsByTagName('head')[0];
        let script= aDoc.createElement('script');
        script.type= 'text/javascript';
        script.innerHTML = "function updateNavScroll() {" +
                             "var pos = window.scrollY;" +
                             "topNavPos = 120;" +
                             "var st = document.getElementById('floatingNavDiv');" +
                             "if (pos < topNavPos && st.style.position != 'absolute') {" +
                             "   st.style.position = 'absolute';" +
                             "   st.style.top = '120px';" +
                             "} else if (pos >= topNavPos && st.style.position != 'fixed') {" +
                             "   st.style.position = 'fixed';" +
                             "   st.style.top = '0';" +
                             "}" +
                           "} " + 
                           "updateNavScroll();";
        head.appendChild(script);
        eval(script.innerHTML);
    } else {
        aDoc.getElementById("floatingNavDiv").style.top = "120px";
    }
}

function RTSE_hideHomepageElements(aDoc) {
// EFFECT: Adds a "Show/Hide" button to many items on the user's homepage.
//         Correctly initializes which elements are hidden via preferences.
    // Identifiers for all of the elements available to hide
    let allElementIDs = ["images", "breakdown", "tagged", "Awards", 
                         "Recent Topics", "avatar", "Mod Summary", 
                         "myAlertHolder", "Make a Journal Entry", "Watching",
                         "My Friends", "Groups", "Tournaments", "Store Wishlist"];

    let elementsWithID = new Array();

    // Put all elements that actually have ID's set in HTML into a separate array
    for(let i in allElementIDs) {
        if(allElementIDs[i] != "images" && allElementIDs[i] != "breakdown" &&
           allElementIDs[i] != "tagged" && allElementIDs[i] != "avatar") {
            elementsWithID.push(aDoc.getElementById(allElementIDs[i]));
        } else {
            //alert("not id'd: " + i);
        }
    }

    // For all of the ID'd elements, check their preferences,
    //  insert the show/hide button, and preset their appearance,
    for(let i in elementsWithID) {
        try {
            let parentCell = aDoc.createElement("td");
            parentCell.style.width="45px";
            parentCell.style.padding="5px";
            let button = aDoc.createElement("a");
            if(gRTSE.prefsGetBool("extensions.rtse.homepage." + i)) {
                button.innerHTML = "Hide";
                if(i != 3) {
                    aDoc.getElementById(elementsWithID[i].id).className = "shown";
                } else {
                    aDoc.getElementById("myAlerts").className = "shown";
                }
            } else {
                button.innerHTML = "Show";
                button.setAttribute("hidden", "true");
            }
            button.className = "small title";

            if(i != 3) {
                button.setAttribute("name", elementsWithID[i].id);
                button.setAttribute("number", i);
                parentCell.appendChild(button);

                // Add the onClick event to each button
                button.addEventListener("click", RTSE_toggleHomepageElement, false);

                let insertion = elementsWithID[i].parentNode.getElementsByTagName("tr")[1];
                insertion.insertBefore(parentCell, insertion.getElementsByTagName("td")[0]);
            } else {
                button.setAttribute("name", "myAlerts");
                button.setAttribute("number", i);

                // Add the onClick event to each button
                button.addEventListener("click", RTSE_toggleHomepageElement, false);
                
                elementsWithID[i].className = "box";
                let insertion = elementsWithID[i];
                insertion.insertBefore(button, insertion.firstChild);
            }
        } catch(e) { /* Ignore any missing elements */ }
    }

    // Hide the Tagged Images Element, if it exists
    try {
        let taggedImages;
        let allPageContentLinks = aDoc.getElementById("pageContent").getElementsByTagName("td")[2].getElementsByTagName("a");
        for(i in allPageContentLinks) {
            if(allPageContentLinks[i].href) {
                if(allPageContentLinks[i].href.match("members/images/user.php") == "members/images/user.php") {
                    taggedImages = allPageContentLinks[i].parentNode;
                    break;
                }
            }
        }

        // Create the show/hide button
        let button = aDoc.createElement("a");
        if(gRTSE.prefsGetBool("extensions.rtse.homepage.10")) {
            button.innerHTML = "Hide";
            taggedImages.getElementsByTagName("table")[0].className = "shown";
        } else {
            button.innerHTML = "Show";
            button.setAttribute("hidden", "true");
        }
        button.className = "small title";
        button.setAttribute("name", "tagged");
        button.setAttribute("number", "10");

        button.addEventListener("click", RTSE_toggleHomepageElement, false);
        taggedImages.insertBefore(button, taggedImages.firstChild);

    } catch(e) { /* Don't do anything if it isn't there */ }
}

function RTSE_toggleHomepageElement() {
// EFFECTS: Shows the element if it was hidden upon the click.
//          Hides the element if it was shown upon the click.
//          Sets preferences accordingly.
    let elID = this.name;
    let doc = this.ownerDocument;
    let pref = "extensions.rtse.homepage." + this.getAttribute("number");

    if(elID != "tagged") {
        if(this.hasAttribute("hidden")) {
            doc.getElementById(elID).className = "shown";
            this.innerHTML = "Hide";
            this.removeAttribute("hidden");
            gRTSE.prefsSetBool(pref, true);
        } else {
            doc.getElementById(elID).className = "";
            this.innerHTML = "Show";
            this.setAttribute("hidden", "true");
            gRTSE.prefsSetBool(pref, false);
        }
    } else {
        if(this.hasAttribute("hidden")) {
            this.parentNode.getElementsByTagName("table")[0].className = "shown";
            this.innerHTML = "Hide";
            this.removeAttribute("hidden");
            gRTSE.prefsSetBool(pref, true);
        } else {
            this.parentNode.getElementsByTagName("table")[0].className = "";
            this.innerHTML = "Show";
            this.setAttribute("hidden", "true");
            gRTSE.prefsSetBool(pref, false);
        }
    }
}

function RTSE_addWatchlistAlerts(aDoc) {
// EFFECTS: Pulls in a copy of the user's watchlist and alerts from their homepage.
//          Places these copies on every page of RT.
// PARAMS:  aDoc - The current document.

    let window = aDoc.defaultView;

    //set this to true to add a "Clear Watchlist" button to every page
        let clearEnabled = false;

    // Define and open an HTTPRequest for the user's homepage.
    let httpRequest=new XMLHttpRequest();
    // Have to use aDoc's domain to fulfull Firefox's same-domain requirements
    httpRequest.open("GET",'http://'+aDoc.domain+'/members/index.php', true); 
    httpRequest.onreadystatechange=function(){
        if(httpRequest.readyState==4){
            // When the HTTPRequest is finished, process the received data.
            if(httpRequest.status==200) {
                // Split off everything after this HTML as the beginnings of the Watchlist section.
                let requestParts=httpRequest.responseText.split("View Watchlist</a></td></tr></table></td></tr></table>");

                // Split off everything after this HTML as the beginnings of the Alerts section.
                let requestParts2=httpRequest.responseText.split("<td id='myAlertHolder'>");

                // Remove everything from the Alerts section after this HTML is encountered.
                let alertlistParts=requestParts2[1].split("</td>");

                // Stick that raw HTML from the alerts section into a new div element.
                let alertlist=aDoc.createElement('div');
                alertlist.innerHTML=alertlistParts[0];
                alertlist.getElementsByTagName("td")[0].background= "transparent";

                // Remove everything from the Watchlist section after this HTML is encountered.
                let requestholder = requestParts[1].split("<tr><td height='16' /></tr>");
                requestholder[0] += "</td></tr></table></div>";

                // Stick that raw HTML from the watchlist section into a new div element.
                let watchlist =aDoc.createElement('div');
                watchlist.innerHTML = requestholder[0];
                watchlist.innerHTML = watchlist.innerHTML.replace('id="Watching"', 'id="Watching" class="shown"');

                // The 'clear' element. XXX (Don't have any way to change this yet outside of modifying this file!!!)
                let clear = aDoc.createElement("a");
                clear.className = "small";
                clear.innerHTML = "<b>Clear Watchlist</b>";
                clear.href = "http://" + aDoc.domain + "/members/clearWatchAlerts.php";

                // Check to see if there's actually any items in the watchlist.
                let watchlisttest=/You have no new alerts\./i;
                let watchLength=watchlisttest.test(watchlist.innerHTML);

                if(watchLength != false) {
                    watchlist.innerHTML="<b>Your watchlist is blank.</b>";
                }

                // Are there breadcrumbs on this page?
                let crumbTd = aDoc.getElementById('pageContent').getElementsByTagName("td")[2].className == "crumbTd";

                // Remove ugly styles from the watchlist element
                watchlist.firstElementChild.innerHTML = watchlist.firstElementChild.innerHTML
                         .replace('class="border boxBorder" style="background: none repeat scroll 0% 0% rgb(250, 250, 250); border-top: 0pt none;"', "");
                // Firefox 3.5.* has different attributes than Minefield. Need to replace other things to handle it correctly.
                watchlist.innerHTML = watchlist.innerHTML.replace('class="border boxBorder" style="border-top: 0pt none; background: rgb(250, 250, 250) ' +
                                                                  'none repeat scroll 0% 0%; -moz-background-clip: border; -moz-background-origin: padding; ' +
                                                                  '-moz-background-inline-policy: continuous;"', "");

                // If there's a "Forum" section on the page already, add the watchlist content into that section.
                if(aDoc.URL.search(/\/forum\//) != -1) {
                    let Forum = aDoc.getElementById("Forum");
                    if(Forum == null)
                        Forum = aDoc.getElementById("Group Forum");
                    let trs = Forum.getElementsByTagName("tr");

                    // Add the 'clear' element if it is enabled.
                    let clearEl = trs[0].getElementsByTagName("td")[5].childNodes[1];
                    if(clearEnabled) {
                        clearEl.appendChild(aDoc.createTextNode(" [ "));
                        clearEl.appendChild(clear);
                        clearEl.appendChild(aDoc.createTextNode(" ] "));
                    }

                    // If the watchlist does contain items, add them to the "Forum" section.
                    if(watchlist.innerHTML != "<b>Your watchlist is blank.</b>") {
                        try {
                            let insidethedivs;
                            let tr2 = watchlist.getElementsByTagName("table");

                            let innerdivs = watchlist.getElementsByTagName('div');

                            let dividernum;
                            for(i=1;i<innerdivs.length;i++) {
                                if(innerdivs[i].className == "divider") {
                                    dividernum=i;
                                }

                                if(innerdivs[i].className != "divider") {
                                    innerdivs[i].style.width = "237px";
                                    innerdivs[i].style.padding = "8px 0pt";
                                    innerdivs[i].style.float = "left";
                                    insidethedivs = innerdivs[i].getElementsByTagName("*");
                                }
                            }

                            while(trs[4].hasChildNodes()) {
                                trs[4].removeChild(trs[4].firstChild);
                            }

                            trs[4].appendChild(aDoc.createElement("td"));
                            trs[4].firstChild.appendChild(tr2[0]);
                            trs[4].firstChild.borderTop = "1px solid rgb(221, 221, 221)"; 
                            trs[4].firstChild.paddingTop = "3px";
                            trs[4].firstChild.colSpan = "2";
                        }
                        catch(err) {
                            let tbodyneeded = Forum.getElementsByTagName("tbody");
                            let newtr = aDoc.createElement("tr");
                            tbodyneeded[1].insertBefore(newtr, tbodyneeded[1].firstChild.nextSibling);
                            trs[4].innerHTML = "<td style='border-top: 1px solid rgb(221, 221, 221); padding-top: 3px;' colspan='2'><table>" + watchlist.innerHTML + "</table></td>";
                            let tables = Forum.getElementsByTagName("table");
                        }
                    }
                }
                // Otherwise, just put it near the top of the page.
                // XXX (This needs to be better placed. Profile pages make the watchlist crunched into the corner of the page.)
                else {
                    watchlist.setAttribute('align', 'center');
                    if(watchlist.innerHTML != "<b>Your watchlist is blank.</b>" && clearEnabled) {
                        let clearDiv = aDoc.createElement("div");
                        clearDiv.setAttribute('align', 'left');
                        clearDiv.appendChild(aDoc.createTextNode(" [ "));
                        clearDiv.appendChild(clear);
                        clearDiv.appendChild(aDoc.createTextNode(" ] "));

                        watchlist.insertBefore(clearDiv, watchlist.firstChild);
                    }

                    // If the page has breadcrumbs, put the watchlist in a different place
                    if(crumbTd) {
                        aDoc.getElementById('pageContent').getElementsByTagName("table")[2]
                                                         .insertBefore(watchlist,aDoc.getElementById('pageContent')
                                                         .getElementsByTagName("table")[2].firstChild);
                    } else {
                        if(aDoc.getElementById('pageContent').getElementsByTagName("td")[0].className == "content topContent")
                            aDoc.getElementById('pageContent').getElementsByTagName("td")[0]
                                                              .insertBefore(watchlist,aDoc.getElementById('pageContent')
                                                              .getElementsByTagName("td")[0].firstChild);
                        else
                            aDoc.getElementById('pageContent').getElementsByTagName("td")[1]
                                                              .insertBefore(watchlist,aDoc.getElementById('pageContent')
                                                              .getElementsByTagName("td")[1].firstChild);
                    }
                }

                // Account for presence of breadcrumbs
                if(crumbTd) {
                    aDoc.getElementById('pageContent').getElementsByTagName("table")[2]
                                                     .insertBefore(alertlist,aDoc.getElementById('pageContent')
                                                     .getElementsByTagName("table")[2].firstChild);
                } else {
                    if(aDoc.getElementById('pageContent').getElementsByTagName("td")[0].className == "content topContent")
                            aDoc.getElementById('pageContent').getElementsByTagName("td")[0]
                                                              .insertBefore(alertlist,aDoc.getElementById('pageContent')
                                                              .getElementsByTagName("td")[0].firstChild);
                        else
                            aDoc.getElementById('pageContent').getElementsByTagName("td")[1]
                                                              .insertBefore(alertlist,aDoc.getElementById('pageContent')
                                                              .getElementsByTagName("td")[1].firstChild);
                }
            } else {
                window.console=window.console||{log:opera.postError}||{log:alert};
                console.log("Error loading watchlist page\n"+ httpRequest.status +":"+ httpRequest.statusText);
            }
        }
    };
    httpRequest.send(null);
}
