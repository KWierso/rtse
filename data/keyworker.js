var val, ss1, ss2, activeElement;

self.port.on("tag", function(tag) {
  activeElement = document.activeElement;
  // Is this a valid post textarea in the page?
  if(activeElement.tagName == "TEXTAREA" && (activeElement.id == "body" || 
    activeElement.id.split("body")[1] == activeElement.parentNode.id.split("textareaContain")[1])) {


    val = activeElement.value;
    ss1 = val.substring(0, activeElement.selectionStart);
    ss2 = val.substring(activeElement.selectionEnd);
    // If nothing is selected, just insert the opening and closing tags together
    if(activeElement.selectionStart == activeElement.selectionEnd) {
      if(tag == "link") {
        self.port.emit("showlinkpanel", {"linkbody":""});
      } else {
        var newVal = ss1 + "[" + tag + "][/" + tag + "]" + ss2;
        // Replace the text value with the newly inserted tag, and put the focus between the tags
        activeElement.value = newVal;
        activeElement.setSelectionRange(ss1.length + tag.length + 2, ss1.length + tag.length + 2);
        self.port.emit("destroy", "blah");
      }
    } else { // Else, something was selected, we need to handle the selection
      var selectedText = val.substring(activeElement.selectionStart, activeElement.selectionEnd);
      
      if(tag == "link") {
        self.port.emit("showlinkpanel", {"linkbody":selectedText});
      } else {
        var newVal = ss1 + "[" + tag + "]" + selectedText + "[/" + tag + "]" + ss2;

        // Replace the text value with the newly inserted tag, and select the original selection
        activeElement.value = newVal;
        activeElement.setSelectionRange(ss1.length + tag.length + 2, ss1.length + tag.length + 2 + selectedText.length);
        self.port.emit("destroy", "blah");
      }
    }
  }
});

self.port.on("linkContent", function(link) {
  var url = link.url;
  var body = link.body;
  var newVal = ss1 + "[link=" + url + "]" + body + "[/link]" + ss2;
  activeElement.value = newVal;
  activeElement.focus();
  activeElement.setSelectionRange(ss1.length + url.length + 7, ss1.length + url.length + 7 + body.length);
  self.port.emit("destroy", "blah");
});

self.port.on("linkpanelfail", function(tag) {
  activeElement = document.activeElement;
  // Is this a valid post textarea in the page?
  if(activeElement.tagName == "TEXTAREA" && (activeElement.id == "body" || 
    activeElement.id.split("body")[1] == activeElement.parentNode.id.split("textareaContain")[1])) {


    val = activeElement.value;
    ss1 = val.substring(0, activeElement.selectionStart);
    ss2 = val.substring(activeElement.selectionEnd);
    // If nothing is selected, just insert the opening and closing tags together
    if(activeElement.selectionStart == activeElement.selectionEnd) {
        var newVal = ss1 + "[" + tag + "][/" + tag + "]" + ss2;
        // Replace the text value with the newly inserted tag, and put the focus between the tags
        activeElement.value = newVal;
        activeElement.setSelectionRange(ss1.length + tag.length + 2, ss1.length + tag.length + 2);
        self.port.emit("destroy", "blah");
    } else { // Else, something was selected, we need to handle the selection
      var selectedText = val.substring(activeElement.selectionStart, activeElement.selectionEnd);
        var newVal = ss1 + "[" + tag + "]" + selectedText + "[/" + tag + "]" + ss2;

        // Replace the text value with the newly inserted tag, and select the original selection
        activeElement.value = newVal;
        activeElement.setSelectionRange(ss1.length + tag.length + 2, ss1.length + tag.length + 2 + selectedText.length);
        self.port.emit("destroy", "blah");
    }
  }
});
