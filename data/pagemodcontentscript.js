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
  var account = 0;
  try {
    let profile = document.getElementById("profile-menu-toggle");
    if(profile) {
      account = 1;
      let star = profile.getElementsByClassName("icon ion-star");
      if(star[0]) {
        account = 2;
      }
    }
  } catch(e) {
    account = 0;
  }
  return account;
}

function RTSE_linkFix(rootElement)
// EFFECTS: Keeps you on your chosen domain
{
  var RTDomains = ["roosterteeth.com", "redvsblue.com", "roosterteethcomics.com", 
                   "strangerhood.com", "captaindynamic.com", "achievementhunter.com"];
  var allLinks;
  allLinks = rootElement.getElementsByTagName("a");
console.log(allLinks.length)
  for(var i = 0; i< allLinks.length; i++) {
    var link = RTSE_parseURI(allLinks[i].href);
    if(RTDomains.indexOf(link.hostname) >= 0) {
      if(link.hostname == document.domain) {
        link.hostname = "redvsblue.com";
        //<<<<
      }
      allLinks[i].href = link.href;
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
      RTSE_linkFix(document.getElementById("body-block"));
      if(account > 0) {
        document.getElementById("notification-count-toggle").addEventListener("mouseenter", RTSE_notificationClickListener, false)
      }
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

/*
 * Message handling stuff
 * ---------------------------------------------------------------------------
 * Utilities
 */

function RTSE_parseURI(href) {
  var parser = document.createElement("a");
  parser.href = href;
  
  return parser;
}

function RTSE_notificationClickListener() {
  RTSE_linkFix(document.getElementById("notification-menu"));
}