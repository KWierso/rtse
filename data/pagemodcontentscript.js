var userInfo = document.getElementById("userInfoDiv");

/*
  account:
  0 = signed out
  1 = signed in (non-sponsor)
  2 = signed in (sponsor)
*/
var account = RTSE_updateAccount(userInfo);

// Do stuff on every page
self.postMessage("RTSE::WatchingRequest");
self.postMessage("RTSE::NextPageRequest");
self.postMessage("RTSE::LinkFixRequest");
self.postMessage("RTSE::AddExtraTab");
self.postMessage("RTSE::ForumJumpListRequest");

RTSE_addCSS();

// Do stuff for signed in user
if(account > 0) {
  // Call RTSE_addToUserInfo in an async way (so we have time to get the relevant prefs)
  self.postMessage("RTSE::UserInfoRequest");
}


/*
Program Logic
----------------------------------------------------------
Program Functions
*/

function RTSE_addExtraTab(msg) {
  if(msg == "undefined") {
    return;
  }
  var extraTabData = JSON.parse(msg);

  if(extraTabData.length < 1)
    return;

  var navBar = document.getElementById("navButtonsInnerMost")
  
  var newHeader = document.createElement("ul");
  newHeader.setAttribute("class", "nav");
  var headerLI = document.createElement("li");
  headerLI.setAttribute("class", "navItem");
  
  var headerLink = document.createElement("a");
  headerLink.textContent = "RTSE";
  headerLink.setAttribute("class", "naviLink");
  headerLink.href = "HI";
  
  var headerImage = document.createElement("img");
  headerImage.setAttribute("width", "10");
  headerImage.setAttribute("height", "6");
  headerImage.setAttribute("style", "padding-left:5px;");
  headerImage.setAttribute("src", "data:image/png;base64," +
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAGCAYAAAD68A/GAAAACXBI" +
    "WXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAG2YAABzjgAA4EoAAIZf" +
    "AAB4gwAAyr4AADMrAAAcdsTGc5wAAAA8SURBVHjahMpBCgAwCAPB" +
    "+PKSl28vFUQs7kUwI8DsWYAWbEAJf9i5V9ix6xaAWn731OcExy4A" +
    "AAD//wMAQFGWeYkVCjQAAAAASUVORK5CYII=");
  
  headerLink.appendChild(headerImage);
  headerLI.appendChild(headerLink);
  
  var headerUL = document.createElement("ul");
  headerUL.setAttribute("class", "subnav");
  
  headerLI.appendChild(headerUL);
  newHeader.appendChild(headerLI);
  
  navBar.appendChild(newHeader);
  
  for(i in extraTabData) {
    let itemLI = document.createElement("li");
    itemLI.setAttribute("style", "display:block;");
    itemLI.setAttribute("class", "subnavItem");
    
    var itemLink = document.createElement("a");
    itemLink.setAttribute("class", "navHovLink");
    itemLink.href = extraTabData[i].url;
    itemLink.textContent = extraTabData[i].label;
    headerUL.appendChild(itemLI);
    itemLI.appendChild(itemLink);
  }
}

function RTSE_addToUserInfo(uiprefs) {
  if(uiprefs != "undefined") {
    uiprefs = JSON.parse(uiprefs);
  } else {
    return;
  }
  // helper function to make code shorter
  function addToStyleSafely(el) {
    return el.hasAttribute("style") ? el.getAttribute("style") : "";
  }

  let newuiprefs = {}
  for(i in uiprefs) {
    newuiprefs[uiprefs[i].item] = uiprefs[i].checked;
  }

  //uiprefs=="DISABLED" is message from addon script to NOT run this
  if(uiprefs != "DISABLED") {
    let paneText = document.getElementById("userPane").lastElementChild;
    
    if(!newuiprefs.userInfoName) {
      let nametable = document.getElementById("memberBox");
      nametable.setAttribute("style", addToStyleSafely(nametable) + "display:none!important;");
    }
    
    if(!newuiprefs.userInfoMessages) {
      let panespans = paneText.getElementsByTagName("span");
      for(i in panespans) {
        if(panespans[i].innerHTML == "Messages") {
          panespans[i].parentNode.setAttribute("style", addToStyleSafely(panespans[i].parentNode) + "display:none!important;");
          break;
        }
      }
    }
    
    if(!newuiprefs.userInfoRequests) {
      let panespans = paneText.getElementsByTagName("span");
      for(i in panespans) {
        if(panespans[i].innerHTML == "Requests") {
          panespans[i].parentNode.setAttribute("style", addToStyleSafely(panespans[i].parentNode) + "display:none!important;");
          break;
        }
      }
    }
    
    if(newuiprefs.userInfoGroups) {
      let panespans = paneText.getElementsByTagName("span");
      let groupParent;
      for(i in panespans) {
        if(panespans[i].innerHTML == "Requests") {
          groupParent = panespans[i].parentNode;
          break;
        }
      }
      let groupElement = document.createElement("a");
      groupElement.className = "small light";
      groupElement.textContent = "Groups";
      groupElement.href = "/members/groups.php";
      let groupText = document.createElement("span");
      if(newuiprefs.userInfoMessages || newuiprefs.userInfoRequests) {
        groupText.innerHTML = " &nbsp;|&nbsp; ";
      }
      groupText.appendChild(groupElement);
      groupParent.appendChild(groupText);
    }
    
    if(newuiprefs.userInfoLog) {
      let panelinks = paneText.getElementsByTagName("a");
      let logParent;
      let signoutLink;
      for(i in panelinks) {
        if(panelinks[i].innerHTML == "Sign Out") {
          logParent = panelinks[i].parentNode;
          signoutLink = panelinks[i];
          break;
        }
      }
      let logElement = document.createElement("a");
      logElement.className = "small light";
      logElement.textContent = "Log";
      logElement.href = "/members/log.php";
      let logText = document.createElement("span");
      logText.appendChild(logElement);
      if(newuiprefs.userInfoSignout) {
        logText.innerHTML = logText.innerHTML + " &nbsp;|&nbsp; ";
      }
      logParent.insertBefore(logText, signoutLink);
    }
    
    if(!newuiprefs.userInfoSponsor) {
      let panespans = paneText.getElementsByTagName("span");
      for(i in panespans) {
        if(panespans[i].innerHTML == "Sponsor") {
          panespans[i].parentNode.setAttribute("style", addToStyleSafely(panespans[i].parentNode) + "display:none!important;");
          break;
        }
      }
    }
    
    if(!newuiprefs.userInfoSettings) {
      let panelinks = paneText.getElementsByTagName("a");
      for(i in panelinks) {
        if(panelinks[i].innerHTML == "Settings") {
          panelinks[i].setAttribute("style", addToStyleSafely(panelinks[i]) + "display:none!important;");
          break;
        }
      }
    }
    
    if(!newuiprefs.userInfoSignout) {
      let panelinks = paneText.getElementsByTagName("a");
      for(i in panelinks) {
        if(panelinks[i].innerHTML == "Sign Out") {
          panelinks[i].setAttribute("style", addToStyleSafely(panelinks[i]) + "display:none!important;");
          break;
        }
      }
    }
    
    if(!newuiprefs.userInfoSponsor && !newuiprefs.userInfoSettings && !newuiprefs.userInfoSignout && !newuiprefs.userInfoLog) {
      let panelinks = paneText.getElementsByTagName("a");
      for(i in panelinks) {
        if(panelinks[i].innerHTML == "Settings") {
          panelinks[i].parentNode.setAttribute("style", addToStyleSafely(panelinks[i].parentNode) + "display:none!important;");
          break;
        }
      }
    }
    
    if(!newuiprefs.userInfoMessages && !newuiprefs.userInfoRequests && !newuiprefs.userInfoGroups) {
      let panespans = paneText.getElementsByTagName("span");
      for(i in panespans) {
        if(panespans[i].innerHTML == "Messages") {
          panespans[i].parentNode.parentNode.setAttribute("style", addToStyleSafely(panespans[i].parentNode.parentNode) + "display:none!important;");
          break;
        }
      }
    }
    
    if((newuiprefs.userInfoFJ || newuiprefs.userInfoMods || newuiprefs.userInfoStats) && account == 2) {
      let sponsDiv = document.createElement("div");
      sponsDiv.className = "paneLinks";
      let panespans = paneText.getElementsByTagName("span");
      let nextRow;
      for(i in panespans) {
        if(panespans[i].innerHTML == "Messages") {
          nextRow = panespans[i].parentNode.parentNode;
          break;
        }
      }
      paneText.insertBefore(sponsDiv, nextRow);
      
      if(newuiprefs.userInfoStats) {
        let statsLink = document.createElement("a");
        statsLink.className = "small light";
        statsLink.textContent = "Stats";
        statsLink.href = "/members/stats/myStats.php";
        sponsDiv.appendChild(statsLink);
      }
      
      if(newuiprefs.userInfoStats && (newuiprefs.userInfoMods || newuiprefs.userInfoFJ)) {
        let emptyText = document.createElement("span");
        emptyText.innerHTML = " &nbsp;|&nbsp; ";
        sponsDiv.appendChild(emptyText);
      }
      
      if(newuiprefs.userInfoMods) {
        let mhLink = document.createElement("a");
        mhLink.className = "small light";
        mhLink.textContent = "Mod History";
        mhLink.href = "/members/modHistory.php";
        sponsDiv.appendChild(mhLink);
      }
      
      if((newuiprefs.userInfoStats || newuiprefs.userInfoMods) && newuiprefs.userInfoFJ) {
        let emptyText = document.createElement("span");
        emptyText.innerHTML = " &nbsp;|&nbsp; ";
        sponsDiv.appendChild(emptyText);
      }
      
      if(newuiprefs.userInfoFJ) {
        let fjLink = document.createElement("a");
        fjLink.className = "small light";
        fjLink.textContent = "Friends' Journals";
        fjLink.href = "/members/journal/friendsJournals.php";
        sponsDiv.appendChild(fjLink);
      }
    }
    
    if(newuiprefs.userInfoComments || newuiprefs.userInfoJournal || newuiprefs.userInfoImages || newuiprefs.userInfoLinks) {
      let contentDiv = document.createElement("div");
      contentDiv.className = "paneLinks";
      let panespans = paneText.getElementsByTagName("span");
      let nextRow;
      for(i in panespans) {
        if(panespans[i].innerHTML == "Messages") {
          nextRow = panespans[i].parentNode.parentNode;
          break;
        }
      }
      paneText.insertBefore(contentDiv, nextRow);
      
      if(newuiprefs.userInfoComments) {
        let commLink = document.createElement("a");
        commLink.className = "small light";
        commLink.textContent = "Comments";
        commLink.href = "/members/comments/";
        contentDiv.appendChild(commLink);
      }
      
      if(newuiprefs.userInfoStats && (newuiprefs.userInfoMods || newuiprefs.userInfoFJ)) {
        let emptyText = document.createElement("span");
        emptyText.innerHTML = " &nbsp;|&nbsp; ";
        contentDiv.appendChild(emptyText);
      }
      
      if(newuiprefs.userInfoJournal) {
        let jLink = document.createElement("a");
        jLink.className = "small light";
        jLink.textContent = "Journal";
        jLink.href = "/members/journal/";
        contentDiv.appendChild(jLink);
      }
      
      if((newuiprefs.userInfoStats || newuiprefs.userInfoMods) && newuiprefs.userInfoFJ) {
        let emptyText = document.createElement("span");
        emptyText.innerHTML = " &nbsp;|&nbsp; ";
        contentDiv.appendChild(emptyText);
      }
      
      if(newuiprefs.userInfoImages) {
        let imgLink = document.createElement("a");
        imgLink.className = "small light";
        imgLink.textContent = "Images";
        imgLink.href = "/members/images/";
        contentDiv.appendChild(imgLink);
      }
      
      if((newuiprefs.userInfoStats || newuiprefs.userInfoMods || newuiprefs.userInfoFJ) && newuiprefs.userInfoLinks) {
        let emptyText = document.createElement("span");
        emptyText.innerHTML = " &nbsp;|&nbsp; ";
        contentDiv.appendChild(emptyText);
      }
      
      if(newuiprefs.userInfoLinks) {
        let linksLink = document.createElement("a");
        linksLink.className = "small light";
        linksLink.textContent = "Links";
        linksLink.href = "/members/links.php";
        contentDiv.appendChild(linksLink);
      }
    }
  }
}


function RTSE_updateAccount() {
// EFFECTS: takes the userInfo element from the page
// and determines whether the user is signed in.
// If the user is signed in, it continues to check whether
// the user's account is an RT sponsor.
  var account = 0;
  try {
    let scripts = document.head.getElementsByTagName("script");
    for(i in scripts) {
      if(scripts[i].innerHTML.search("GA_googleAddAttr") != -1) {
        var metadata = scripts[i].innerHTML.replace(/GA_googleAddAttr/g, "").replace(/"/g, "")
        metadata = metadata.replace(/\)/g, "").replace(/\(/g, "").replace(/;/g, "").replace(/ /g, "");
        metadata = metadata.split("\n");
        metadata.shift();
        metadata.pop();
        for(i in metadata) {
          metadata[i] = metadata[i].split(",");
          if(metadata[i][0] == "SignedIn" && metadata[i][1] == "True") {
            account = 1;
          }
          if(metadata[i][0] == "Sponsor" && metadata[i][1] == "True") {
            account = 2;
            break;
          }
        }
        break;
      }
    }
  } catch(e) {
    account = 0;
  }
  return account;
}


function RTSE_linkFix()
// EFFECTS: removes all targets from links and prevents links from opening in a
//          new flavor.  In addition, it changes any anchors for that page to
//          scroll into view as opposed to loading a new url.
{
  // Scroll Into view for links on same page
  var regEx = /^http:\/\/((|panics.|magic.|m.|myspace.)roosterteeth|achievementhunter|strangerhood|redvsblue|roosterteethcomics|captaindynamic).com(.*)$/i;
  var loc = document.location.href
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
  var links = RTSE_evaluateXPath(document,"//a[contains(@href,'#') and contains(@href,'" + loc + "')]");
  for (var i = (links.length - 1); i >= 0; --i) {
    links[i].addEventListener("click", func, false);
  }

  // Remove target and keep same flavor
//  if (!gRTSE.prefsGetBool("extensions.rtse.fixLinks")) return;
  links = RTSE_evaluateXPath(document,'//a[@target="_blank"]');

  for (var i = (links.length - 1); i >= 0; --i) {
    if (links[i].href.match(regEx)) {
      links[i].removeAttribute('target');
      links[i].href=links[i].href.replace(regEx, '$3');
    } else if (links[i].href.match(/^\/(.*)$/i)) {
      links[i].removeAttribute('target');
    }
  }
}


// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
function RTSE_evaluateXPath(aNode, aExpr) {
  var xpe = new XPathEvaluator();
  var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
    aNode.documentElement : aNode.ownerDocument.documentElement);
  var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
  var found = [];
  var res;
  while (res = result.iterateNext())
    found.push(res);
  return found;
}



function RTSE_addCSS()
// EFFECTS: adds special CSS instructions to the head of each RT page
{
  var head=document.getElementsByTagName('head')[0];
  var css=document.createElement('style');
  css.setAttribute('type','text/css');
  css.setAttribute('media','screen');
  
  // fix for too long of text in textboxes
  css.appendChild(document.createTextNode('textarea { overflow-x:auto; }\n'));
  
  // Appending
  head.appendChild(css);
}

function RTSE_forumListBox(forumList, names) {
  /* Used to create and insert the list box to jump to a forum */

  forumList.reverse();
  forumList.push("null");
  forumList.reverse();

  var listBox=document.createElement('select');

  /* Creating the listBox */
  for (let i of forumList) {
    try {
      let option=document.createElement('option');
      option.setAttribute('value', i);
      option.textContent=names[i];
      if(option.innerHTML == "undefined") {
        option.textContent = "Unknown Forum (" + i + ")";
      }
      listBox.appendChild(option);
    } catch (e) { /* eat any exceptions due to bad prefs */ }
  }

  /* Adding redirector */
  listBox.addEventListener('mouseup', function(e) {
      if (this.options[this.selectedIndex].value != 'null') {
        if (e.altKey) {
          window.open(document.location.protocol + "//" + document.location.hostname + 
                      "/forum/forum.php?fid=" + this.options[this.selectedIndex].value);
        } else {
          document.location = '/forum/forum.php?fid=' + this.options[this.selectedIndex].value;
        }
      }
  }, false);
  listBox.addEventListener('keypress', function(e) {
      if(e.keyCode == 13) {
        if (this.options[this.selectedIndex].value != 'null') {
          if(e.altKey) {
            window.open(document.location.protocol + "//" + document.location.hostname + 
                        "/forum/forum.php?fid=" + this.options[this.selectedIndex].value);
          } else {
            document.location = '/forum/forum.php?fid=' + this.options[this.selectedIndex].value;
          }
        }
      }
  }, false);

  /* Now that we have the listBox all filled up... */
  let ref = document.getElementById('barRightInfo');
  listBox.setAttribute("style", "float:left;margin-top:9px;margin-right:14px;");
  ref.insertBefore(listBox, ref.firstChild);
}

/*
 * Program functions
 * ----------------------------------------------------------------------------
 * Message Handling stuff
 */


/*
 * Handle messages sent from add-on to the content script
 */
self.on("message", function(message) {
  if(message.split("::")[0] == "RTSEUSERINFORESPONSE") {
    // Message is the userInfo display preferences
    let uiprefs = message.split("RTSEUSERINFORESPONSE::")[1];
    RTSE_addToUserInfo(uiprefs);
  } else if(message.split("::")[0] == "RTSELINKFIXRESPONSE") {
    if(message.split("RTSELINKFIXRESPONSE::")[1] == "true") {
      RTSE_linkFix();
    }
  } else if(message.split("::")[0] == "RTSEADDEXTRATABRESPONSE") {
    if(message.split("RTSEADDEXTRATABRESPONSE::")[1] != "false") {
      RTSE_addExtraTab(message.split("RTSEADDEXTRATABRESPONSE::")[1]);
    }
  } else if(message.split("::")[0] == "RTSEWATCHINGRESPONSE") {
      // Automatically redirect from members/ to members/?s=watching
      /*if((document.location.pathname == "/members" || document.location.pathname == "/members/") && document.location.search == "") {
        document.location.search = "?s=watching";
      }*/

      // Adjust the links to the members/ page so it goes directly to ?s=watching
      var sibling = document.getElementById("userInfoDiv").nextElementSibling;
      try {
        while(sibling.className != "myAvatar") {
          sibling = sibling.nextElementSibling;
        }
      } catch(e) {console.log(e.message);}
      sibling.getElementsByTagName("a")[0].href = "/members/?s=watching";

      let lastHeader = document.getElementById("navButtonsInnerMost").lastElementChild;
      lastHeader.firstElementChild.firstElementChild.href = "/members/?s=watching";
      lastHeader.firstElementChild.lastElementChild.getElementsByTagName("a")[0].href = "/members/?s=watching";
      document.getElementById("footNavLinks8").getElementsByTagName("a")[0].href = "/members/?s=watching";
      document.getElementById("footNavLinks8").getElementsByTagName("a")[1].href = "/members/?s=watching";
      
      document.getElementById("memberBox").firstElementChild.href = "/members/?s=watching";
      document.getElementById("userPane").getElementsByTagName("img")[0].parentNode.href = "/members/?s=watching";
  } else if(message.split("::")[0] == "RTSEFORUMJUMPLISTRESPONSE") {
    let forumPrefs = JSON.parse(message.split("RTSEFORUMJUMPLISTRESPONSE::")[1]);
    if(typeof forumPrefs.list != "undefined") {
      RTSE_forumListBox(forumPrefs.list, forumPrefs.names);
    }
  } else if(message.split("::")[0] == "RTSENEXTPAGERESPONSE") {
    let pages;
    let paginationDivs = document.getElementById("commentsAreaHold").getElementsByTagName("div");
    for(let i of paginationDivs) {
      if(i.className == "paginationRow") {
        pages = i.getElementsByTagName("a");
        break;
      }
    }
    for(let i of pages) {
      if(i.textContent != "1") {
        i.href = i.href + "#comments";
      }
    }
  } else {
    // Message is unknown
    //console.log(message);
  }
});
