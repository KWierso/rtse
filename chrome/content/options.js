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
                    .createInstance(Components.interfaces.nsIRTSE);
function apply() {

	return true;
}

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
}

function theme() {
	/* Function called when 'theme' is enabled or disabled */
	if( document.getElementById('theme').checked ) {
		document.getElementById('themeType').disabled=false
	} else {
		document.getElementById('themeType').disabled=true;
	}
}

function smilieFilePicker(aWin)
// EFFECTS: Displays the dialog to select the file for a new smiley pack
{
	var picker=Components.classes['@mozilla.org/filepicker;1']
	                     .createInstance(Components.interfaces.nsIFilePicker);
	picker.appendFilters(picker.filterXML);
	picker.init(aWin,'Select Smiley File',picker.modeOpen);
	var ok=picker.show();
	if( ok==picker.returnOK )
		/* stuff that loads goes here */;
}

function displaySmilies()
// EFFECTS: Generates preview of currently loaded smilies
{
	var s=Components.classes["@shawnwilsher.com/smilies;1"]
	                .getService(Components.interfaces.nsISmilies);
	var ref=document.getElementById('smileyPreview');
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
