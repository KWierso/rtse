var url = document.getElementById("url");
var body = document.getElementById("body");
var ok = document.getElementById("ok");
var cancel = document.getElementById("cancel");

document.body.addEventListener("keydown", function(evt) {
  if(evt.keyCode == 13) {
    var event = document.createEvent('Event');
    event.initEvent('click', false, false);
    ok.dispatchEvent(event);
  }
}, false);

cancel.addEventListener("click", function() {
  self.port.emit("cancel", "");
}, false);

ok.addEventListener("click", function() {
  self.port.emit("ok", {"url":url.value, "body": body.value});
}, false);


self.port.on("selectedtext", function(msg) {
  body.value = msg.linkbody;
})

self.port.on("cleareverything", function() {
  body.value = "";
  url.value = "";
});

self.port.on("focusurl", function() {
  url.focus();
});