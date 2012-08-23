document.getElementById("extraTabAdd")
        .addEventListener("click", function() {
  createExtraTabItem({"url":"", "label":""});          
}, false);

document.getElementById("extraTabSave")
        .addEventListener("click", function() {
  saveExtraTabData();          
}, false);

document.getElementById("forumListSave")
        .addEventListener("click", function() {
  saveForumListData();          
}, false);

document.getElementById("userInfoSave")
        .addEventListener("click", function() {
  saveUserInfoData();          
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

self.port.on("getForumList", function(msg) {
  for(let i in msg.names) {
    if(i != "null")
      createForumListItem(false, i, msg.names[i]);
  }
  for(let i in msg.settings) {
    document.getElementById("forum" + msg.settings[i])
            .getElementsByTagName("input")[0].checked = true;
  }
  document.getElementById("jumplistConfig").className = "";
});

self.port.on("getUserInfo", function(msg) {

  if(JSON.stringify(msg) == "null") {
    let inputs = document.getElementById("userInfoArea").getElementsByTagName("input");
    for(let i in inputs) { 
      inputs[i].checked = true;
    }
  } else {
    for(let i in msg) {
      document.getElementById(msg[i].item)
              .getElementsByTagName("input")[0].checked = msg[i].checked;
    }
  }
  document.getElementById("userInfoConfig").className = "";
});


switch(document.location.hash) {
  case "#extratab":
    self.port.emit("getExtraTab", "fetch");
    break;

  case "#jumplist":
    self.port.emit("getForumList", "fetch");
    break;

  case "#userinfo":
    self.port.emit("getUserInfo", "fetch");
    break;

  default:
    document.getElementById("default").className = "";
}


function createForumListItem(checked, index, name) {
  var tabArea = document.getElementById("forumListArea")
                        .getElementsByTagName("tbody")[0];
  
  var listItem = document.createElement("tr");
  listItem.id = "forum" + index;
  
  var listItemCheckbox = document.createElement("input");
  var listItemLabel = document.createElement("p");
  var listItemID = document.createElement("p");

  listItemCheckbox.type = "checkbox";
  listItemCheckbox.checked = checked;

  listItemLabel.textContent = name;
  listItemID.textContent = index;
  
  listItem.appendChild(document.createElement("td"));
  listItem.lastElementChild.appendChild(listItemCheckbox);

  listItem.appendChild(document.createElement("td"));
  listItem.lastElementChild.appendChild(listItemLabel);

  listItem.appendChild(document.createElement("td"));
  listItem.lastElementChild.appendChild(listItemID);

  tabArea.appendChild(listItem);
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

function saveForumListData() {
  var forumListSettings = [];
  var forumItems = document.getElementById("forumListArea")
                        .getElementsByTagName("tbody")[0]
                        .getElementsByTagName("tr");

  for(i in forumItems) {
    if(forumItems[i].getElementsByTagName("input")[0].checked) {
      let thisItem = forumItems[i].lastElementChild.lastElementChild.textContent;
      forumListSettings.push(thisItem);
    }
  }

  self.port.emit("saveForumList", forumListSettings);
}

function saveUserInfoData() {
  var userInfoSettings = [];
  var userInfoItems = document.getElementById("userInfoArea")
                        .getElementsByTagName("tbody")[0]
                        .getElementsByTagName("tr");

  for(i in userInfoItems) {
    let thisItem = {
    }

    thisItem.item = userInfoItems[i].id;
    thisItem.checked = userInfoItems[i].getElementsByTagName("input")[0].checked;
    userInfoSettings.push(thisItem);
  }

  self.port.emit("saveUserInfo", userInfoSettings);
}
