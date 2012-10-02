self.port.on("tag", function(tag) {
  var activeElement = document.activeElement;
  // Is this a valid post textarea in the page?
  if(activeElement.tagName == "TEXTAREA" && (activeElement.id == "body" || 
    activeElement.id.split("body")[1] == activeElement.parentNode.id.split("textareaContain")[1])) {
    var val = activeElement.value;
    var ss1 = val.substring(0, activeElement.selectionStart);
    var ss2 = val.substring(activeElement.selectionEnd);
    // If nothing is selected, just insert the opening and closing tags together
    if(activeElement.selectionStart == activeElement.selectionEnd) {
      var newVal = ss1 + "[" + tag + "][/" + tag + "]" + ss2;

      // Replace the text value with the newly inserted tag, and put the focus between the tags
      activeElement.value = newVal;
      activeElement.setSelectionRange(ss1.length + tag.length + 2, ss1.length + tag.length + 2);
    } else { // Else, something was selected, we need to handle the selection
      var selectedText = val.substring(activeElement.selectionStart, activeElement.selectionEnd);
      var newVal = ss1 + "[" + tag + "]" + selectedText + "[/" + tag + "]" + ss2;

      // Replace the text value with the newly inserted tag, and select the original selection
      activeElement.value = newVal;
      activeElement.setSelectionRange(ss1.length + tag.length + 2, ss1.length + tag.length + 2 + selectedText.length);
    }
  }
  self.port.emit("destroy", "blah");
});