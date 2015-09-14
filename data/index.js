document.getElementById("forumListSave")
        .addEventListener("click", function() {
  saveForumListData();          
}, false);

/* 
  Port Listeners
*/

self.port.on("message", function(msg) {
  //console.log(msg);
});

self.port.on("getForumList", function(msg) {
  document.title = "RTSE - Create a list of your favorite forums";
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

switch(document.location.hash) {
  case "#jumplist":
    self.port.emit("getForumList", "fetch");
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

function saveForumListData() {
  var forumListSettings = [];
  var forumItems = document.getElementById("forumListArea")
                        .getElementsByTagName("tbody")[0]
                        .getElementsByTagName("tr");

  for (let i of forumItems) {
    if(i.tagName == "TR") {
      try {
        if(i.getElementsByTagName("input")[0].checked) {
          let thisItem = i.lastElementChild.lastElementChild.textContent;
          forumListSettings.push(thisItem);
        }
      } catch(e) { console.log(i); }
    }
  }

  self.port.emit("saveForumList", forumListSettings);
}
