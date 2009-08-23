/* ***** BEGIN LICENSE BLOCK *****
 * Version: Open Software License v. 2.1
 *
 * The contents of this file are subject to the Open Software License Version
 * 2.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.opensource.org/licenses/osl-2.1.php
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the 'Rooster Teeth Site Extender'.
 *
 * The Initial Developer of the Original Code is
 * Shawn Wilsher
 *
 * Portions created by the Initial Developer are Copyright (C) 2005-2006
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
                    .getService(Components.interfaces.nsIRTSE);
function load() {
    // Load Smilies Preview
    displaySmilies();

  // Forum Names
  var bundle = document.getElementById('bundle_forums');
  var ref = document.getElementById('forums').children;
  var topic, id;
  for (var i = (ref.length - 1); i >= 0; --i) {
    topic = ref[i].getElementsByTagName('checkbox');
    if (topic.length) {
      id = topic[0].id.replace(/^forum([0-9]+)$/i, '$1');
      topic[0].setAttribute('label', bundle.getString(id));
    }
  }
  
  addTab();
  forumJump();
  linkDisplay();
}

function onAccept() {
  return true;
}

function onDisclosure() {
    return window.openDialog("chrome://rtse/content/options/changelog.xul", "changelog", 
                                "chrome,modal,centerscreen");
}

/**
 * Function to disable/enable the forum jump filter
 */
function forumJump()
{
  document.getElementById('forums').hidden =
    !document.getElementById('forum').checked;
  document.getElementById('forums_desc').hidden =
    !document.getElementById('forum').checked;
}

/**
 * Function to disable/enable the userInfo selector
 */
function linkDisplay()
{
  document.getElementById('link_display').hidden =
    !document.getElementById('userInfo').checked;
}

/**
 * Function loads the file picker to select the file and the processes the new
 *  file.
 *
 * @param aWin The window that is opening the file picker.
 */
function smileyFilePicker(aWin)
{
  var picker = Components.classes['@mozilla.org/filepicker;1']
                         .createInstance(Components.interfaces.nsIFilePicker);
  picker.appendFilters(picker.filterXML);
  picker.init(aWin, 'Select Smiley File', picker.modeOpen);
  var ok = picker.show();
  if (ok == picker.returnOK) {
    var file = picker.file;
    var smilies = Components.classes['@shawnwilsher.com/smilies;1']
                            .getService(Components.interfaces.nsISmilies);
    
    if (!smilies.validateFile(file)) {
      alert("Sorry, but this is not a valid smiley file");
      return;
    }

    // can old file
    var old = Components.classes["@mozilla.org/file/directory_service;1"]
                        .createInstance(Components.interfaces.nsIProperties)
                        .get("ProfD", Components.interfaces.nsIFile);
    old.append("rtse");
    old.append("smilies.xml");
    if (old.exists()) old.remove(false);
    
    // let's copy the file over
    var dir = Components.classes["@mozilla.org/file/directory_service;1"]
                        .createInstance(Components.interfaces.nsIProperties)
                        .get("ProfD", Components.interfaces.nsIFile);
    dir.append("rtse");
    file.copyTo(dir, "smilies.xml");

    var nFile = Components.classes["@mozilla.org/file/directory_service;1"]
                          .createInstance(Components.interfaces.nsIProperties)
                          .get("ProfD", Components.interfaces.nsIFile);
    nFile.append("rtse");
    nFile.append("smilies.xml");

    // reloading and display
    smilies.load(nFile);
    window.setTimeout('displaySmilies()', 1000);
  }
}

function displaySmilies()
// EFFECTS: Generates preview of currently loaded smilies
{
    var s=Components.classes["@shawnwilsher.com/smilies;1"]
                    .getService(Components.interfaces.nsISmilies);
    var ref=document.getElementById('smileyPreview');
    if (!s.ok) {
    alert("The smilie service is not ok");
  }
  var names=s.getNames({});
    // remove any existing children
    while( ref.lastChild ) {
        ref.removeChild(ref.lastChild);
    }

    // add new
    var item,img,label,box;
    for( var i in names ) {
        item=document.createElement('richlistitem');
        box=document.createElement('hbox');

        img=document.createElement('image');
        img.setAttribute('src',s.getPath(names[i]));
        box.appendChild(img);

        label=document.createElement('label');
        label.setAttribute('value',names[i]);
        box.appendChild(label);

        item.appendChild(box);
        ref.appendChild(item);
    }
}

function addTab() {
    document.getElementById('tabInfo').hidden =
        !document.getElementById('tab').checked;
    document.getElementById('tab_desc').hidden =
        !document.getElementById('tab').checked;
}

/**
 * Function restores RTSE to initial configuration
 *
 */
function resetRTSE() {
    let confirm = window.confirm(document.getElementById("string-bundle")
                                         .getString('resetConfirm'));

    if(confirm) {
        // Erase user's smilies.xml file
        let old = Components.classes["@mozilla.org/file/directory_service;1"]
                            .createInstance(Components.interfaces.nsIProperties)
                            .get("ProfD", Components.interfaces.nsIFile);
        old.append("rtse");
        old.append("smilies.xml");
        if (old.exists()) old.remove(false);

        // Replaces smilies.xml with the default file
        const ID = "rtse-nightly@shawnwilsher.com"
        let file = Components.classes["@mozilla.org/file/directory_service;1"]
                             .getService(Components.interfaces.nsIProperties)
                             .get("ProfD", Components.interfaces.nsIFile);
        file.append("rtse");
        if (!file.exists())
          file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);

        let ext = Components.classes["@mozilla.org/extensions/manager;1"]
                            .getService(Components.interfaces.nsIExtensionManager)
                            .getInstallLocation(ID)
                            .getItemLocation(ID);
        ext.append("defaults");
        ext.append("smilies.xml");
        ext.copyTo(file, "smilies.xml");

        // Get array of all non-default RTSE preferences, and reset them to default.
        let prefs = Components.classes["@mozilla.org/preferences-service;1"]
                              .getService(Components.interfaces.nsIPrefService);
        prefs = prefs.getBranch("extensions.rtse.");
        let children = prefs.getChildList("",{});
        for(i in children){
            if(prefs.prefHasUserValue(children[i])) {
                prefs.clearUserPref(children[i]);
            }
        }

        // Re-run the initial setup wizard
        return window.openDialog('chrome://rtse/content/setupwizard.xul',
                                 'RTSEsetup','chrome,centerscreen');
    }
}

/**
 * Function: Selects or unselects all forums for the jump list with one checkbox
 *
 */
function forumAll() {
    let allCheckboxes = document.getElementById('forums').getElementsByTagName("checkbox");
    let checked = document.getElementById('forumAll').checked;
    for(let i in allCheckboxes) {
        allCheckboxes[i].checked = checked;
        if(allCheckboxes[i].id) // For some reason, extra elements were being included in the loop,
            allCheckboxes[i].doCommand(); // This if statement prevents them from being used
    }
}
