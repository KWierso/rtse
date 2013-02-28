//give the page some time to finish loading
window.setTimeout(function() {self.port.emit("ready", "hello")}, 3000);

// test the ability to use rtse hotkeys in the textareas
self.port.on("hotkeys", function(msg) {

  // object holding all possible hotkeys and their results
  let results = {
    bold: {
      key: "b",
      tag: "b",
      result: null
    },
    italic: {
      key: "i",
      tag: "i",
      result: null
    },
    underline: {
      key: "u",
      tag: "u",
      result: null
    },
    strike: {
      key: "s",
      tag: "s",
      result: null
    },
    image: {
      key: "p",
      tag: "img",
      result: null
    },
    spoiler: {
      key: "o",
      tag: "spoiler",
      result: null
    },
    quote: {
      key: "q",
      tag: "quote",
      result: null
    },
    code: {
      key: "c",
      tag: "code",
      result: null
    },
    link: {
      key: "l",
      tag: "link",
      result: null
    }
  }

  // get the text area for posting a new journal on the user's rt homepage
  let textareaContain = document.getElementById("textareaContain");
  let composerBody = textareaContain.firstElementChild;

  // activate the textarea and make sure it's empty
  composerBody.click();
  composerBody.focus();
  composerBody.value = "";

  // start by requesting the test to send the first hotkey
  self.port.emit("sendKeyRequest", results["bold"].key);

  // this is received after the test activated a hotkey
  self.port.on("keySent", function(key) {
    let tag;
    let time = 0;

    // figure out which hotkey is being tested
    for(i in results) {
      if(results[i].key == key) {
        tag = results[i].tag;
        break;
      }
    }

    // the link hotkey is slightly different than the others
    if(tag == "link") {
      tag = tag + "=";
      time = 1000;
    }

    // if this is the link hotkey, give it time to finish up
    window.setTimeout(function() {
      let check = "[" + tag + "][/" + tag.replace("=","") + "]";
      let value = composerBody.value;

      // make sure the hotkey makes the correct changes to the textarea
      let result = value == check;
      composerBody.value = "";

      // record the test result and request the next test, or finish when done
      for(i in results) {
        if(results[i].key == key) {
          results[i].result = result;
          checkResults(results);
        } else if(results[i].result == null) {
          self.port.emit("sendKeyRequest", results[i].key);
          break;
        }
      }
    }, time);
  });

  // if all of the tests have been run, submit the done() event
  function checkResults(results) {
    let finished = "yes";
    for(i in results) {
      if(results[i].result == null) {
        finished = null;
      }
    }
    if(finished == "yes") {
      self.port.emit("done", results);
    }
  }
});

