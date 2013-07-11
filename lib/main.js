// Import the APIs we need.

/* These aren't in use yet. Maybe eventually.*/
//var request = require("sdk/request");
//var tabs = require("sdk/tabs");
//var widget = require("sdk/widget");

var pageMod = require("sdk/page-mod");
var data = require("sdk/self").data;
var simplePrefs = require("sdk/simple-prefs");
var sss = require("./stylesheetservice");
var tabs = require("sdk/tabs");
var simpleStorage = require("sdk/simple-storage");
var cm = require("sdk/context-menu");
var hotkeys = require("sdk/hotkeys");
var panel;
try {
  panel = require("sdk/panel");
} catch(e) {
  // Requiring panel breaks the world when opted in to private windows
}
var OS = require("sdk/system/runtime").OS;

// Declare all stylesheet URIs
var watchlistcss = sss.getURI("watchlistcoloring.css");
var sidebar = sss.getURI("sidebar.css");
var header = sss.getURI("header.css");
var membersidebar = sss.getURI("membersidebar.css");

var keyWorker;

registerStyleSheets();

var forumNames = JSON.parse(data.load("forums.json"));

var RTDomains = ["roosterteeth.com", "redvsblue.com", "roosterteethcomics.com", 
                 "strangerhood.com", "captaindynamic.com", "achievementhunter.com"]

cm.Item({
  label: "Jump to last page",
  context: cm.SelectorContext("a[href]"),
  contentScript: 'self.on("context", function (node) {' +
                 '  while(node.tagName != "A") {node = node.parentNode;}' +
                 '  var isThread = /viewTopic.php/.test(node.href) ||' +
                 '                 /entry.php/.test(node.href) ||' +
                 '                 /link.php/.test(node.href) ||' +
                 '                 /home.php/.test(node.href) ||' +
                 '                 /\\/podcast\\//.test(node.href) ||' +
                 '                 /modHistory.php/.test(node.href) ||' +
                 '                 /friendsJournals.php/.test(node.href) ||' +
                 '                 /image.php/.test(node.href);' +
                 
                 '  var isRTLink = /roosterteeth.com/.test(node.href) ||' +
                 '                 /achievementhunter.com/.test(node.href) ||' +
                 '                 /rtxevent.com/.test(node.href);' +
                 '  return isThread && isRTLink;' +
                 '});' +

                 'self.on("click", function (node, data) {' +
                 '  var url = node.href;' +
                 '  var split = url.split("&");' +
                 '  for(i in split) {' +
                 '    if(split[i].match("page") == "page") {' +
                 '      url = url.replace(split[i], "page=99999");' +
                 '    }' +
                 '    if(split[i].match("c=") == "c=") {' +
                 '      url = url.replace(split[i], "");' +
                 '    }' +
                 '  }' +
                 '  if(!url.match("page")) {' +
                 '    if(url.split("?") == url) {' +
                 '      url = url + "?page=99999";' +
                 '    } else {' +
                 '      url = url + "&page=99999";' +
                 '    }' +
                 '  }' +
                 '  document.location = url;' +
                 '});'
});

/*
 *
 */
var linkpanel;
try {
  linkpanel = panel.Panel({
    width:400,
    height:200,
    contentURL: data.url("linkpanel.html"),
    contentScriptFile: data.url("linkpanel.js"),
    onHide: function() { linkpanel.port.emit("cleareverything", "") },
    onShow: function() { linkpanel.port.emit("focusurl", "")}
  });

  linkpanel.port.on("cancel", function() { linkpanel.hide(); });

  linkpanel.port.on("ok", function(linkObject) { 
    linkpanel.hide();
    keyWorker.port.emit("linkContent", {"url":linkObject.url, "body":linkObject.body});
  });
  exports.submitPanel = function() {
    linkpanel.port.emit("forceOK", "");
  }
} catch(e) {
  //Can't use panels with pwpb
}
/*
 * Hotkeys for post/comment/reply box BBCode tags
 */
var modifier;
if(OS == "Darwin") {
  modifier = "accel-alt-";
} else {
  modifier = "alt-";
}
 var boldHotkey = hotkeys.Hotkey({
  combo: modifier + "b",
  onPress: function() {
    sendKey("b");
  }
});
var italicHotkey = hotkeys.Hotkey({
  combo: modifier + "i",
  onPress: function() {
    sendKey("i");
  }
});
var underlineHotkey = hotkeys.Hotkey({
  combo: modifier + "u",
  onPress: function() {
    sendKey("u");
  }
});
var strikeHotkey = hotkeys.Hotkey({
  combo: modifier + "s",
  onPress: function() {
    sendKey("s");
  }
});
var linkHotkey = hotkeys.Hotkey({
  combo: modifier + "l",
  onPress: function() {
    sendKey("l");
  }
});
var imgHotkey = hotkeys.Hotkey({
  combo: modifier + "p",
  onPress: function() {
    sendKey("p");
  }
});
var spoilerHotkey = hotkeys.Hotkey({
  combo: modifier + "o",
  onPress: function() {
    sendKey("o");
  }
});
var quoteHotkey = hotkeys.Hotkey({
  combo: modifier + "q",
  onPress: function() {
    sendKey("q");
  }
});
var codeHotkey = hotkeys.Hotkey({
  combo: modifier + "c",
  onPress: function() {
    sendKey("c");
  }
});

/*
 * Module imports
 * ----------------------------------------------------------------------------
 * Add-on script functions
 */

simplePrefs.on("addExtraTab", function() {
  tabs.open({
    url: data.url("index.html#extratab"),
    onReady: function(tab) {
      var worker = tab.attach({
        contentScriptFile: data.url("index.js")
      });
      worker.port.on("message", function(msg) {
        //console.log(msg);
      });
      worker.port.on("getExtraTab", function(msg) {
        worker.port.emit("getExtraTab", getExtraTabSettings());
      });
      worker.port.on("saveExtraTabs", function(msg) {
        simpleStorage.storage.extraTabSettings = msg;
        worker.tab.close();
      });
    }
  });
});

simplePrefs.on("forumListButton", function() {
  tabs.open({
    url: data.url("index.html#jumplist"),
    onReady: function(tab) {
      var worker = tab.attach({
        contentScriptFile: data.url("index.js")
      });
      worker.port.on("message", function(msg) {
        //console.log(msg);
      });
      worker.port.on("getForumList", function(msg) {
        worker.port.emit("getForumList", getForumListSettings());
      });
      worker.port.on("saveForumList", function(msg) {
        simpleStorage.storage.forumListSettings = msg;
        worker.tab.close();
      });
    }
  });
});

simplePrefs.on("userInfoButton", function() {
  tabs.open({
    url: data.url("index.html#userinfo"),
    onReady: function(tab) {
      var worker = tab.attach({
        contentScriptFile: data.url("index.js")
      });
      worker.port.on("message", function(msg) {
        //console.log(msg);
      });
      worker.port.on("getUserInfo", function(msg) {
        worker.port.emit("getUserInfo", simpleStorage.storage.userInfoSettings);
      });
      worker.port.on("saveUserInfo", function(msg) {
        simpleStorage.storage.userInfoSettings = msg;
        worker.tab.close();
      });
    }
  });
});

simplePrefs.on("colorWatchlist", function(pref) {
  if(simplePrefs.prefs[pref]) {
      sss.register(watchlistcss);
  } else {
      sss.unregister(watchlistcss);
  }
});
simplePrefs.on("siteHeader", function(pref) {
  if(!simplePrefs.prefs[pref]) {
      sss.register(header);
  } else {
      sss.unregister(header);
  }
});
simplePrefs.on("sidebar", function(pref) {
  if(!simplePrefs.prefs[pref]) {
      sss.register(sidebar);
  } else {
      sss.unregister(sidebar);
  }
});
simplePrefs.on("memberSidebar", function(pref) {
  if(!simplePrefs.prefs[pref]) {
      sss.register(membersidebar);
  } else {
      sss.unregister(membersidebar);
  }
});

/* DISABLED BECAUSE WE DON'T NEED IT AT THIS POINT
simplePrefs.on("watchingRedirect", function(pref) {
  if(simplePrefs.prefs[pref]) {
    // Register redirector
  } else {
    // Unregister redirector
  }
});
*/

/*
 * Initial stylesheet registration at startup
 */
function registerStyleSheets() {
  // Check watchlist stylesheet's preference
  if(simplePrefs.prefs["colorWatchlist"]) {
      sss.register(watchlistcss);
  } else {
      sss.unregister(watchlistcss);
  }

  // Check site sidebar stylesheet's preference
  if(!simplePrefs.prefs["sidebar"]) {
      sss.register(sidebar);
  } else {
      sss.unregister(sidebar);
  }

  // Check site header stylesheet's preference
  if(!simplePrefs.prefs["siteHeader"]) {
      sss.register(header);
  } else {
      sss.unregister(header);
  }

  // Check journal sidebar stylesheet's preference
  if(!simplePrefs.prefs["memberSidebar"]) {
      sss.register(membersidebar);
  } else {
      sss.unregister(membersidebar);
  }
}

/*
 * Recieves messages from the content script.
 * Various values trigger different results.
 * Messages prefixed with RTSE:: mean the script wants something done.
 * "this" is the worker for the current page-mod. Use it for messaging.
 */
function handleMessage(message) {
  if(message.split("::")[0] == "RTSE") {
    // Content script wants something from us
    switch(message.split("::")[1]) {
      // Content script wants the userInfo display prefs
      case "UserInfoRequest":
        this.postMessage("RTSEUSERINFORESPONSE::" + JSON.stringify(simpleStorage.storage.userInfoSettings));
        break;

      // Content script wants the fixlinkspref
      case "LinkFixRequest":
        this.postMessage("RTSELINKFIXRESPONSE::" + simplePrefs.prefs["fixLinks"]);
        break;

      case "AddExtraTab":
        this.postMessage("RTSEADDEXTRATABRESPONSE::" + JSON.stringify(getExtraTabSettings()));
        break;

      case "ForumJumpListRequest":
        this.postMessage("RTSEFORUMJUMPLISTRESPONSE::" + JSON.stringify(getForumListPrefs()));
        break;

      case "WatchingRequest":
        if(simplePrefs.prefs["watchingRedirect"])
          this.postMessage("RTSEWATCHINGRESPONSE::YES");
        break;

      // Message not handled/recognized
      default:
        //console.log(message.split("::")[1]);
    }
  } else {
    // Content script just likes talking
    //console.log(message);
  }
}

/*
 * Attach the content script to the browser.
 */
pageMod.PageMod({
  include: ["http://roosterteeth.com/*", "http://redvsblue.com/*", "http://roosterteethcomics.com/*", 
            "http://strangerhood.com/*", "http://captaindynamic.com/*", "http://achievementhunter.com/*",
            "https://roosterteeth.com/*", "https://redvsblue.com/*", "https://roosterteethcomics.com/*", 
            "https://strangerhood.com/*", "https://captaindynamic.com/*", "https://achievementhunter.com/*"],
  contentScriptWhen: 'ready',
  contentScriptFile: data.url("pagemodcontentscript.js"),
  attachTo: ["top"],
  onAttach: function onAttach(worker, mod) {
    // Register the handleMessage function as a listener
    worker.on('message', handleMessage);
  }
});

/*
 * Add-on script functions
 * ----------------------------------------------------------------------------
 * Message handler functions
 */

function getForumListPrefs() {
  return {
    "list": simpleStorage.storage.forumListSettings,
    "names": forumNames
  }
}

function getExtraTabSettings() {
  return simpleStorage.storage.extraTabSettings;
}

function getForumListSettings() {
  return {"settings": simpleStorage.storage.forumListSettings, "names": forumNames};
}

// Function that is called to send the hotkey message to the current tab
function sendKey(key) {
  var tag;

  // Some hotkeys represent different tags, some ARE tags
  switch(key) {
    case 'l':
      tag = 'link';
//linkpanel.show();
      break;
    case 'p':
      tag = 'img';
      break;
    case 'o':
      tag = 'spoiler';
      break;
    case 'q':
      tag = 'quote';
      break;
    case 'c':
      tag = 'code';
      break;
    case 'b':
    case 'i':
    case 'u':
    case 's':
      tag = key;
  }

  // We shouldn't get any unexpected hotkeys, but just in case...
  if(tag) {
    try {
      // Make sure we're on an RT domain
      var split = tabs.activeTab.url.split("://")[1].split("/")[0];
      if(RTDomains.indexOf(split) >= 0) {
        // Attach a shortlived contentScript to the tab
        keyWorker = tabs.activeTab.attach({
          contentScriptFile: data.url("keyworker.js")
        });
        // Destroy it when done to make sure memory is released
        keyWorker.port.on("destroy", function(msg) {
          keyWorker.destroy();
        })
        //Show the link panel if necessary
        keyWorker.port.on("showlinkpanel", function(msg) {
          try {
            linkpanel.show();
            linkpanel.port.emit("selectedtext", msg);
          } catch(e) {
            keyWorker.port.emit("linkpanelfail", tag);
          }
        })
        // Now that the contentScript is set up, send the tag to it
        keyWorker.port.emit("tag", tag);
      }
    } catch(e) {}
  }
}
