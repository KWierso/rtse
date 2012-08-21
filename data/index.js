document.getElementById("extraTabAdd")
        .addEventListener("click", function() {
  createExtraTabItem({"url":"", "label":""});          
}, false);

document.getElementById("extraTabSave")
        .addEventListener("click", function() {
  saveExtraTabData();          
}, false);

/* 
  Port Listeners
*/

self.port.on("message", function(msg) {
  //console.log(msg);
});

self.port.on("getExtraTab", function(msg) {
  for(i in msg) {
    createExtraTabItem(msg[i]);
  }
  document.getElementById("extraTabConfig").className = "";
});




switch(document.location.hash) {
  case "#extratab":
    self.port.emit("getExtraTab", "fetch");
    break;

  case "#jumplist":
    document.getElementById("jumplistConfig").className = "";
    break;

  default:
    document.getElementById("default").className = "";
}




function createExtraTabItem(data) {
  var tabArea = document.getElementById("extraTabArea")
                        .getElementsByTagName("tbody")[0];
  
  var tabItem = document.createElement("tr");
  
  var tabItemLink = document.createElement("input");
  var tabItemLabel = document.createElement("input");

  tabItemLink.type = "text";
  tabItemLabel.type = "text";

  tabItemLink.value = data.url;
  tabItemLabel.value = data.label;

  tabItem.appendChild(document.createElement("td"));
  tabItem.lastElementChild.appendChild(tabItemLabel);

  tabItem.appendChild(document.createElement("td"));
  tabItem.lastElementChild.appendChild(tabItemLink);
  
  tabArea.appendChild(tabItem);
}

function saveExtraTabData() {
  var extraTabItems = [];
  var tabItems = document.getElementById("extraTabArea")
                        .getElementsByTagName("tbody")[0]
                        .getElementsByTagName("tr");

  for(i in tabItems) {
    var thisItem = {"label":"", "url":""}
    thisItem.label = tabItems[i].getElementsByTagName("input")[0].value;
    thisItem.url = tabItems[i].getElementsByTagName("input")[1].value;
    if(thisItem.label != "" && thisItem.url != "")
      extraTabItems.push(thisItem);
  }

  self.port.emit("saveExtraTabs", extraTabItems);
}
