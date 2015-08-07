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

var OS = require("sdk/system/runtime").OS;

// Declare all stylesheet URIs
var nightmode = sss.getURI("nightmode.css");

registerStyleSheets();

var forumNames = JSON.parse(data.load("forums.json"));

var RTDomains = ["roosterteeth.com", "redvsblue.com", "roosterteethcomics.com", 
                 "strangerhood.com", "captaindynamic.com", "achievementhunter.com"]


/*
 * Module imports
 * ----------------------------------------------------------------------------
 * Add-on script functions
 */
console.log("MAIN.JS");

simplePrefs.on("forumListButton", function() {
  tabs.open({
    url: data.url("index.html#jumplist"),
    onReady: function(tab) {
      var worker = tab.attach({
        contentScriptFile: data.url("index.js")
      });
      worker.port.on("message", function(msg) {
        console.log(msg);
      });
      worker.port.on("getForumList", function(msg) {
        console.log("getForumList");
        worker.port.emit("getForumList", getForumListSettings());
      });
      worker.port.on("saveForumList", function(msg) {
        console.log("saveForumList");
        simpleStorage.storage.forumListSettings = msg;
        worker.tab.close();
      });
    }
  });
});

simplePrefs.on("nightmode", function(pref) {
  console.log("WHY");
  if(simplePrefs.prefs[pref]) {
      console.log("register");
      sss.register(nightmode);
  } else {
      console.log("unregister");
      sss.unregister(nightmode);
  }
});

/*
 * Initial stylesheet registration at startup
 */
function registerStyleSheets() {
  console.log("YO");
  // Check journal sidebar stylesheet's preference
  if(simplePrefs.prefs["nightmode"]) {
      sss.register(nightmode);
  } else {
      sss.unregister(nightmode);
  }
}

/*
 * Receives messages from the content script.
 * Various values trigger different results.
 * Messages prefixed with RTSE:: mean the script wants something done.
 * "this" is the worker for the current page-mod. Use it for messaging.
 */
function handleMessage(message) {
  if(message.split("::")[0] == "RTSE") {
    // Content script wants something from us
    switch(message.split("::")[1]) {
      // Content script wants the fixlinkspref
      case "LinkFixRequest":
        this.postMessage("RTSELINKFIXRESPONSE::" + simplePrefs.prefs["fixLinks"]);
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

