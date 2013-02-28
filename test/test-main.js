var main = require("./main");
var tabs = require("sdk/tabs");
var data = require("self").data;
var OS = require("sdk/system/runtime").OS;
var timers = require("sdk/timers");

const { keyDown } = require("sdk/dom/events/keys");
const winUtils = require("sdk/deprecated/window-utils");

// Make sure that the hotkeys module works as expected
exports["test hotkeys"] = function(test) {
  test.waitUntilDone(); // This test will take a while

  // hotkey modifier is different on OSX
  let modifier;
  if(OS == "Darwin") {
    modifier = "accel-alt-";
  } else {
    modifier = "alt-";
  }

  // Open the RT user homepage in a tab
  // This assumes the test is run in an existing profile with an RT login
  tabs.open({
    url: "http://roosterteeth.com/members/?s=watching",
    onReady: function(tab) {
      // attach our test helper to the tab
      var worker = tab.attach({
        contentScriptFile: data.url("test-rtse.js")
      });
      // the tab has loaded sufficiently
      worker.port.on("ready", function(msg) {
        test.waitUntilDone(); // OMG this test will take a while
        worker.port.emit("hotkeys", "test");
      });

      // The test helper sends us a single hotkey to run
      worker.port.on("sendKeyRequest", function(key) {
        test.waitUntilDone(); // Don't let the test harness kill us!
        let element = winUtils.activeBrowserWindow.document.documentElement;

        // Fire the hotkey with the correct modifier
        keyDown(element, modifier + key);

        // The link hotkey needs some special handling and more time
        if(key == "l") {
          timers.setTimeout(function() {main.submitPanel();}, 1000);
          timers.setTimeout(function() {worker.port.emit("keySent", key);}, 1000);
        } else {
          worker.port.emit("keySent", key);
        }
      });

      // No more hotkeys to test, lets check the results
      worker.port.on("done", function(results) {
        for(i in results) {
          test.assertEqual(results[i].result, true, "Testing " + i + " hotkey");
        }
        test.done();
      });
    }
  });
}