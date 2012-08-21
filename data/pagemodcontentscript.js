var userInfo = document.getElementById("userInfoDiv");

/*
  account:
  0 = signed out
  1 = signed in (non-sponsor)
  2 = signed in (sponsor)
*/
var account = RTSE_updateAccount(userInfo);

// Do stuff on every page
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
  var extraTabData = JSON.parse(msg);

  if(extraTabData.length < 1)
    return;

  var navBar = document.getElementById("searchTd").previousElementSibling
                       .getElementsByTagName("td")[0];
  
  var newHeader = document.createElement("div");
  newHeader.setAttribute("class", "navDivTop");
  newHeader.setAttribute("style", "padding-right:0;");
  
  var headerLink = document.createElement("a");
  headerLink.textContent = "RTSE";
  headerLink.setAttribute("id", "navButton99");
  headerLink.setAttribute("class", "navbutton");
  headerLink.setAttribute("onmouseover", "navShow(99);");
  
  var headerImage = document.createElement("img");
  headerImage.setAttribute("width", "10");
  headerImage.setAttribute("height", "6");
  headerImage.setAttribute("style", "padding-left:5px;");
  headerImage.setAttribute("src", "http://s3.roosterteeth.com/assets/style/flashy/bits/navArrow.png");
  
  headerLink.appendChild(headerImage);
  
  var headerDiv = document.createElement("div");
  headerDiv.setAttribute("id", "navDiv99");
  headerDiv.setAttribute("class", "navDiv");
  headerDiv.setAttribute("style", "top: 15px;");
  
  headerDiv.appendChild(document.createElement("div"));
  
  newHeader.appendChild(headerLink);
  newHeader.appendChild(headerDiv);
  
  navBar.appendChild(newHeader);
  
  for(i in extraTabData) {
    var itemLink = document.createElement("a");
    itemLink.setAttribute("class", "navHovLink");
    itemLink.href = extraTabData[i].url;
    itemLink.textContent = extraTabData[i].label;
    headerDiv.firstElementChild.appendChild(itemLink);
  }
}

function RTSE_addToUserInfo(uiprefs) {
  // helper function to make code shorter
  function addToStyleSafely(el) {
    return el.hasAttribute("style") ? el.getAttribute("style") : "";
  }
  
  //uiprefs=="DISABLED" is message from addon script to NOT run this
  if(uiprefs != "DISABLED") {
    let paneText = document.getElementById("userPane").getElementsByTagName("div");
    for(i in paneText) {
      if(paneText[i].className == "paneText" && paneText[i].firstElementChild.tagName == "TABLE") {
        paneText = paneText[i];
        break;
      }
    }
    
    if(!uiprefs.Name) {
      let nametable = paneText.getElementsByTagName("table")[0];
      nametable.setAttribute("style", addToStyleSafely(nametable) + "display:none!important;");
    }
    
    if(!uiprefs.Messages) {
      let panespans = paneText.getElementsByTagName("span");
      for(i in panespans) {
        if(panespans[i].innerHTML == "Messages") {
          panespans[i].parentNode.setAttribute("style", addToStyleSafely(panespans[i].parentNode) + "display:none!important;");
          break;
        }
      }
    }
    
    if(!uiprefs.Requests) {
      let panespans = paneText.getElementsByTagName("span");
      for(i in panespans) {
        if(panespans[i].innerHTML == "Requests") {
          panespans[i].parentNode.setAttribute("style", addToStyleSafely(panespans[i].parentNode) + "display:none!important;");
          break;
        }
      }
    }
    
    if(uiprefs.Groups) {
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
      groupElement.innerHTML = "Groups";
      groupElement.href = "/members/groups.php";
      let groupText = document.createElement("span");
      if(uiprefs.Messages || uiprefs.Requests) {
        groupText.innerHTML = " &nbsp;|&nbsp; ";
      }
      groupText.appendChild(groupElement);
      groupParent.appendChild(groupText);
    }
    
    if(uiprefs.Log) {
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
      logElement.innerHTML = "Log";
      logElement.href = "/members/log.php";
      let logText = document.createElement("span");
      logText.appendChild(logElement);
      if(uiprefs.Signout) {
        logText.innerHTML = logText.innerHTML + " &nbsp;|&nbsp; ";
      }
      logParent.insertBefore(logText, signoutLink);
    }
    
    if(!uiprefs.Sponsor) {
      let panespans = paneText.getElementsByTagName("span");
      for(i in panespans) {
        if(panespans[i].innerHTML == "Sponsor") {
          panespans[i].parentNode.setAttribute("style", addToStyleSafely(panespans[i].parentNode) + "display:none!important;");
          break;
        }
      }
    }
    
    if(!uiprefs.Settings) {
      let panelinks = paneText.getElementsByTagName("a");
      for(i in panelinks) {
        if(panelinks[i].innerHTML == "Settings") {
          panelinks[i].setAttribute("style", addToStyleSafely(panelinks[i]) + "display:none!important;");
          break;
        }
      }
    }
    
    if(!uiprefs.Signout) {
      let panelinks = paneText.getElementsByTagName("a");
      for(i in panelinks) {
        if(panelinks[i].innerHTML == "Sign Out") {
          panelinks[i].setAttribute("style", addToStyleSafely(panelinks[i]) + "display:none!important;");
          break;
        }
      }
    }
    
    if(!uiprefs.Sponsor && !uiprefs.Settings && !uiprefs.Signout && !uiprefs.Log) {
      let panelinks = paneText.getElementsByTagName("a");
      for(i in panelinks) {
        if(panelinks[i].innerHTML == "Settings") {
          panelinks[i].parentNode.setAttribute("style", addToStyleSafely(panelinks[i].parentNode) + "display:none!important;");
          break;
        }
      }
    }
    
    if(!uiprefs.Messages && !uiprefs.Requests && !uiprefs.Groups) {
      let panespans = paneText.getElementsByTagName("span");
      for(i in panespans) {
        if(panespans[i].innerHTML == "Messages") {
          panespans[i].parentNode.parentNode.setAttribute("style", addToStyleSafely(panespans[i].parentNode.parentNode) + "display:none!important;");
          break;
        }
      }
    }
    
    if((uiprefs.FJ || uiprefs.Mods || uiprefs.Stats) && account == 2) {
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
      
      if(uiprefs.Stats) {
        let statsLink = document.createElement("a");
        statsLink.className = "small light";
        statsLink.innerHTML = "Stats";
        statsLink.href = "/members/stats/myStats.php";
        sponsDiv.appendChild(statsLink);
      }
      
      if(uiprefs.Stats && (uiprefs.Mods || uiprefs.FJ)) {
        let emptyText = document.createElement("span");
        emptyText.innerHTML = " &nbsp;|&nbsp; ";
        sponsDiv.appendChild(emptyText);
      }
      
      if(uiprefs.Mods) {
        let mhLink = document.createElement("a");
        mhLink.className = "small light";
        mhLink.innerHTML = "Mod History";
        mhLink.href = "/members/modHistory.php";
        sponsDiv.appendChild(mhLink);
      }
      
      if((uiprefs.Stats || uiprefs.Mods) && uiprefs.FJ) {
        let emptyText = document.createElement("span");
        emptyText.innerHTML = " &nbsp;|&nbsp; ";
        sponsDiv.appendChild(emptyText);
      }
      
      if(uiprefs.FJ) {
        let fjLink = document.createElement("a");
        fjLink.className = "small light";
        fjLink.innerHTML = "Friends' Journals";
        fjLink.href = "/members/journal/friendsJournals.php";
        sponsDiv.appendChild(fjLink);
      }
    }
    
    if(uiprefs.Comments || uiprefs.Journal || uiprefs.Images || uiprefs.Links) {
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
      
      if(uiprefs.Comments) {
        let commLink = document.createElement("a");
        commLink.className = "small light";
        commLink.innerHTML = "Comments";
        commLink.href = "/members/comments/";
        contentDiv.appendChild(commLink);
      }
      
      if(uiprefs.Stats && (uiprefs.Mods || uiprefs.FJ)) {
        let emptyText = document.createElement("span");
        emptyText.innerHTML = " &nbsp;|&nbsp; ";
        contentDiv.appendChild(emptyText);
      }
      
      if(uiprefs.Journal) {
        let jLink = document.createElement("a");
        jLink.className = "small light";
        jLink.innerHTML = "Journal";
        jLink.href = "/members/journal/";
        contentDiv.appendChild(jLink);
      }
      
      if((uiprefs.Stats || uiprefs.Mods) && uiprefs.FJ) {
        let emptyText = document.createElement("span");
        emptyText.innerHTML = " &nbsp;|&nbsp; ";
        contentDiv.appendChild(emptyText);
      }
      
      if(uiprefs.Images) {
        let imgLink = document.createElement("a");
        imgLink.className = "small light";
        imgLink.innerHTML = "Images";
        imgLink.href = "/members/images/";
        contentDiv.appendChild(imgLink);
      }
      
      if((uiprefs.Stats || uiprefs.Mods || uiprefs.FJ) && uiprefs.Links) {
        let emptyText = document.createElement("span");
        emptyText.innerHTML = " &nbsp;|&nbsp; ";
        contentDiv.appendChild(emptyText);
      }
      
      if(uiprefs.Links) {
        let linksLink = document.createElement("a");
        linksLink.className = "small light";
        linksLink.innerHTML = "Links";
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

  forumList.push("null");
  forumList.reverse();

  var listBox=document.createElement('select');

  /* Creating the listBox */
  for (var i = 0; i < forumList.length; i++) {
    try {
      let option=document.createElement('option');
      option.setAttribute('value',forumList[i]);
      option.innerHTML=names[forumList[i]];
      if(option.innerHTML == "undefined") {
        option.innerHTML = "Unknown Forum (" + forumList[i] + ")";
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
    RTSE_addToUserInfo(JSON.parse(message.split("RTSEUSERINFORESPONSE::")[1]));
  } else if(message.split("::")[0] == "RTSELINKFIXRESPONSE") {
    if(message.split("RTSELINKFIXRESPONSE::")[1] == "true") {
      RTSE_linkFix();
    }
  } else if(message.split("::")[0] == "RTSEADDEXTRATABRESPONSE") {
    if(message.split("RTSEADDEXTRATABRESPONSE::")[1] != "false") {
      RTSE_addExtraTab(message.split("RTSEADDEXTRATABRESPONSE::")[1]);
    }
  } else if(message.split("::")[0] == "RTSEFORUMJUMPLISTRESPONSE") {
    let forumPrefs = JSON.parse(message.split("RTSEFORUMJUMPLISTRESPONSE::")[1]);
    if(forumPrefs.Enabled && forumPrefs.List.length > 0) {
      RTSE_forumListBox(forumPrefs.List.replace(" ", "").split(","), forumPrefs.Names);
    }
  } else {
    // Message is unknown
    //console.log(message);
  }
});
