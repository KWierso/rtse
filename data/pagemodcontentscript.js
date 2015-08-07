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
self.postMessage("RTSE::ForumJumpListRequest");

RTSE_addCSS();

// Do stuff for signed in user
if(account > 0) {
}


/*
Program Logic
----------------------------------------------------------
Program Functions
*/

function RTSE_updateAccount() {
// EFFECTS: takes the userInfo element from the page
// and determines whether the user is signed in.
// If the user is signed in, it continues to check whether
// the user's account is an RT sponsor.
/* INITIAL REWRITE
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
*/
  return 0;
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
/* INITIAL REWRITE
  var head=document.getElementsByTagName('head')[0];
  var css=document.createElement('style');
  css.setAttribute('type','text/css');
  css.setAttribute('media','screen');
  
  // fix for too long of text in textboxes
  css.appendChild(document.createTextNode('textarea { overflow-x:auto; }\n'));
  
  // Appending
  head.appendChild(css);
*/
}

function RTSE_forumListBox(forumList, names) {
  /* Used to create and insert the list box to jump to a forum */
  forumList.reverse();
  forumList.push("null");
  forumList.reverse();

  var listBoxContainer = document.createElement("li");
  var listBox=document.createElement('select');
  listBoxContainer.appendChild(listBox);

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
                      "/forum/" + this.options[this.selectedIndex].value);
        } else {
          document.location = '/forum/' + this.options[this.selectedIndex].value;
        }
      }
  }, false);
  listBox.addEventListener('keypress', function(e) {
      if(e.keyCode == 13) {
        if (this.options[this.selectedIndex].value != 'null') {
          if(e.altKey) {
            window.open(document.location.protocol + "//" + document.location.hostname + 
                        "/forum/" + this.options[this.selectedIndex].value);
          } else {
            document.location = '/forum/' + this.options[this.selectedIndex].value;
          }
        }
      }
  }, false);

  /* Now that we have the listBox all filled up... */
  let ref = document.getElementById('global-nav-strip');
  listBox.setAttribute("style", "margin-top:2px;");
  if(ref) {
    ref.firstElementChild.firstElementChild.appendChild(listBoxContainer);
  }
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
  if(message.split("::")[0] == "RTSELINKFIXRESPONSE") {
    if(message.split("RTSELINKFIXRESPONSE::")[1] == "true") {
      RTSE_linkFix();
    }
  } else if(message.split("::")[0] == "RTSEFORUMJUMPLISTRESPONSE") {
    let forumPrefs = JSON.parse(message.split("RTSEFORUMJUMPLISTRESPONSE::")[1]);
    if(typeof forumPrefs.list != "undefined") {
      RTSE_forumListBox(forumPrefs.list, forumPrefs.names);
    }
  } else {
    // Message is unknown
    //console.log(message);
  }
});
