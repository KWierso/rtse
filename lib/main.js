// Import the APIs we need.

/* These aren't in use yet. Maybe eventually.*/
//var contextMenu = require("context-menu");
//var request = require("request");
//var tabs = require("tabs");
//var widget = require("widget");
//var panel = require("panel");

var pageMod = require("page-mod");
var data = require("self").data;
var simplePrefs = require("simple-prefs");
var sss = require("rtse-lite/stylesheetservice");
var tabs = require("tabs");
var addontab = require("addon-page");
var simpleStorage = require("simple-storage");

// Declare all stylesheet URIs
var watchlistcss = sss.getURI("watchlistcoloring.css");
var sidebar = sss.getURI("sidebar.css");
var header = sss.getURI("header.css");
var journalsidebar = sss.getURI("journalsidebar.css");
var videosidebar = sss.getURI("videosidebar.css");

registerStyleSheets();

var forumNames = JSON.parse(data.load("forums.json"));

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
simplePrefs.on("siteSidebar", function(pref) {
  if(!simplePrefs.prefs[pref]) {
      sss.register(sidebar);
  } else {
      sss.unregister(sidebar);
  }
});
simplePrefs.on("journalSidebar", function(pref) {
  if(!simplePrefs.prefs[pref]) {
      sss.register(journalsidebar);
  } else {
      sss.unregister(journalsidebar);
  }
});
simplePrefs.on("videoSidebar", function(pref) {
  if(!simplePrefs.prefs[pref]) {
      sss.register(videosidebar);
  } else {
      sss.unregister(videosidebar);
  }
});
 
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
  if(!simplePrefs.prefs["siteSidebar"]) {
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
  if(!simplePrefs.prefs["journalSidebar"]) {
      sss.register(journalsidebar);
  } else {
      sss.unregister(journalsidebar);
  }

  // Check video sidebar stylesheet's preference
  if(!simplePrefs.prefs["videoSidebar"]) {
      sss.register(videosidebar);
  } else {
      sss.unregister(videosidebar);
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
        this.postMessage("RTSEUSERINFORESPONSE::" + JSON.stringify(getUserInfoPrefs()));
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

/*
 * Look in preferences for all of the userInfo display prefs,
 * and pass the results back to the content script as a string.
 */
function getUserInfoPrefs() {
  var uiprefs = {
    "Name": "",
    "Stats": "",
    "Mods": "",
    "FJ": "",
    "Comments": "",
    "Journal": "",
    "Images": "",
    "Links": "",
    "Messages": "",
    "Requests": "",
    "Groups": "",
    "Sponsor": "",
    "Settings": "",
    "Log": "",
    "Signout": ""
  };
  
  var checkPrefs = ["userInfoName", "userInfoStats", 
  "userInfoMods", "userInfoFJ", "userInfoComments", 
  "userInfoJournal", "userInfoImages", "userInfoLinks", 
  "userInfoMessages", "userInfoRequests", "userInfoGroups", 
  "userInfoSponsor", "userInfoSettings", "userInfoLog", "userInfoSignout"];

  for(var i = 0; i < checkPrefs.length; i++) {
    var pref = simplePrefs.prefs[checkPrefs[i]];
    uiprefs[checkPrefs[i].replace("userInfo", "")] = pref;
  }
  return uiprefs;
}

function getForumListPrefs() {
  let forumprefs = {
    "Enabled": "",
    "List": "",
    "Names": forumNames
  }
  
  let checkPrefs = ["forumListEnabled", "forumListList"]
  
  for(var i = 0; i < checkPrefs.length; i++) {
    var pref = simplePrefs.prefs[checkPrefs[i]];
    forumprefs[checkPrefs[i].replace("forumList", "")] = pref;
  }
  
  return forumprefs;
}

function getExtraTabSettings() {
  return simpleStorage.storage.extraTabSettings;
}
