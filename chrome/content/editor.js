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

if( !gRTSE )
	var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
	                    .createInstance(Components.interfaces.nsIRTSE);
var editor={
	load: function() {
		/* Runs at load for editor.xul */
		var doc=window.parent.document;
		if(!doc) return false;

		/* Spellbound */
		try {
			editor._setupSpellBound();
		} catch(e) {
			gRTSE.sendReport(e);
		}

		/* Loading Config */
		editor.config=new RTSE_Config();
		editor.config.load();

		/* Getting Right buttons */
		var theme=this.config.get('themeType','none');
		if( theme=='none' )
			theme=doc.location.href.replace(/^https?:\/\/(www|sh|rvb|panics)/i,'$1');
		switch(theme) {
			case 'sh':
			 document.getElementById('submit').image='chrome://rtse/skin/images/editor/sh_submit.png';
			 document.getElementById('preview').image='chrome://rtse/skin/images/editor/sh_preview.png';
			 break;
			case 'panics':
			 document.getElementById('submit').image='chrome://rtse/skin/images/editor/panics_submit.png';
			 document.getElementById('preview').image='chrome://rtse/skin/images/editor/panics_preview.png';
			 break;
		}			 
		
		/* Smilies */
		try {
			editor.smilies.load();
		} catch(e) {
			gRTSE.sendReport(e);
		}

		/* Adding things if a sponsor */
		if( this.config.get('sponsor','false')=='true' ) {
			document.getElementById('defaultSmiliesToolbar').hidden=false;
			document.getElementById('color').hidden=false;
		}

		/* Adding Seperators (don't add in XUL for some reason...) */
		var sep=document.createElement('toolbarseparator');
		document.getElementById('toolbar').insertBefore(sep,document.getElementById('cut'));

		/* Adding specific content */
		var type=doc.getElementById('rtseType');
		if(!type) return(false);
		type=type.value;
		var submit=document.getElementById('submit');
		var form=doc.forms.namedItem('post');
		var xul=doc.getElementById('rtseXULeditor').contentDocument.wrappedJSObject;

		/* Copying value of old body and title */
		if( form.elements.namedItem('oldTitle') ) {
			if( form.elements.namedItem('oldTitle').value!='' )
				document.getElementById('title').value=form.elements.namedItem('oldTitle').value;
			document.getElementById('title').hidden=false;
			var removeTitle=function() {
				if( this.value=='Please Specify a Title ' )
					this.value='';
			};
			document.getElementById('title').addEventListener('focus',removeTitle,false);
			document.getElementById('title').addEventListener('click',removeTitle,false);			
		}
		if( form.elements.namedItem('oldBody') )
			document.getElementById('body').value=form.elements.namedItem('oldBody').value;
		
		switch(type) {
			case 'freply':
			 var button=RTSE_evaluateXPath(doc,'//td/table/tbody/tr/td/input[@class="submit" and @type="button"]')[0];
			 button.setAttribute('onclick','');
			 button.addEventListener('click',function() {
				var text=RTSE_evaluateXPath(doc,'//td[@class="comment"]/table/tbody/tr/td[2]/table/tbody/tr[2]/td')[0];
				text=editor.HTMLParse(text.innerHTML);
				xul.getElementById('body').value+='[quote]'+text+'[/quote]\n\n';
				editor._focus();
			 },false);
			 break;
			case 'journal':
			 /* Adding content */
			 var parent=document.getElementById('toolbar');
			 var elm=document.createElement('toolbarseparator');
			 parent.appendChild(elm);
			 elm=document.createElement('toolbarbutton');
			 elm.setAttribute('label','Visible to All');
			 elm.setAttribute('id','friendsOnly');
			 elm.setAttribute('command','cmd_friendsOnly');
			 elm.setAttribute('type','checkbox');		 	
			 parent.appendChild(elm);
			 if( form.elements.namedItem('oldFriendsOnly') ) {
				if( form.elements.namedItem('oldFriendsOnly').value=='1' )
					document.getElementById('friendsOnly').checked=true;
				else
					document.getElementById('friendsOnly').checked=false;
			 }
			 // journal protection removal
			 var text=editor.protectedJournalText();
			 text=text.replace(/\[/g,'\\[');
			 text=text.replace(/\]/g,'\\]');
			 text=text.replace(/\?/g,'\\?');
			 text=text.split('\n');
			 var exp;
			 for( var i=(text.length-1); (i>=0 && text[i]!='\n'); --i ) {
			 	text[i]=text[i].replace(/\n/g,'');
			 	exp=new RegExp(text[i],'gi');
			 	document.getElementById('body').value=document.getElementById('body').value.replace(exp,'');
			 }
			 while( document.getElementById('body').value[0]=='\n' )
			 	document.getElementById('body').value=document.getElementById('body').value.substring(1);
			 break;
			case 'rmessage':
			 var button=document.createElement('toolbarbutton');
			 button.setAttribute('label','New Conversation');
			 button.setAttribute('oncommand','editor.newConv();');
			 document.getElementById('toolbar').appendChild(button);
			 break;
			case 'bmessage':
			 var parent=document.getElementById('toolbar').parentNode;
			 var elm=document.createElement('label');
			 elm.setAttribute('value','To:');
			 elm.setAttribute('control','toUser');
			 elm.setAttribute('style','font-size:12pt;');
			 parent.parentNode.insertBefore(elm,parent);
			 elm=document.createElement('textbox');
			 elm.setAttribute('multiline','false');
			 elm.setAttribute('maxlength','40');
			 elm.setAttribute('id','toUser');
			 parent.parentNode.insertBefore(elm,parent);
			 break;
			default:
			 break;			 
		}
		
		editor.smilies.deconvert();
		editor.extraBB.deconvert();
		
		return(true);
	},

	validate: function() {
		/* Checks the content to make sure you have everything in an ok state */
		var body=document.getElementById('body');
		var title=document.getElementById('title');
		if( !title.hidden ) {
			if( title.value=='' || title.value=='Please Specify a Title ' ) {
				alert('You must enter a title');
				title.focus();
				return false;
			}
		}
		if( body.value=='' ) {
			alert('You must enter a body');
			body.focus();
			return false;
		}
		return true;
	},

	preview: function() {
		/* Sends to preview page */
		var doc=window.parent.document;
		if(!doc) return(false);
		var type=doc.getElementById('rtseType');
		if(!type) return(false);
		type=type.value;

		var form=doc.forms.namedItem('post');
		var body=document.getElementById('body');
		var title=document.getElementById('title');
		if( !editor.validate() )
			return false;

		switch(type) {
			case 'comment':
			case 'freply':
			case 'fcomment':
			case 'cpreview':
			case 'cedit':
			case 'journal':
			case 'atopic':
			 form.setAttribute('action','/preview.php');
			 break;
			case 'rmessage':
			case 'nmessage':
			 var pid=form.elements.namedItem('pid');
			 if(pid) {
			 	if( pid.value!='0' )
			 		form.setAttribute('action','/members/messaging/previewReply.php');
			 	else
			 		form.setAttribute('action','/members/messaging/preview.php');
			 } else
			  	form.setAttribute('action','/members/messaging/preview.php');
			 break;
			case 'bmessage':
			 form.setAttribute('action','/members/messaging/preview.php');
			 break;
		}

        return editor.submit();
	},

	submit: function() {
		/* Submits form */
		var doc=window.parent.document;
		if(!doc) return(false);
		var type=doc.getElementById('rtseType');
		if(!type) return(false);
		type=type.value;

		var form=doc.forms.namedItem('post');
		var body=document.getElementById('body');
		var title=document.getElementById('title');
		if( !editor.validate() )
			return false;
		body=body.value;
		var input=doc.createElement('input');
		input.setAttribute('type','hidden');
		input.setAttribute('name','body');
		input.value=body;
		form.appendChild(input);
		var text;

		switch(type) {
			case 'journal':
			 input=doc.createElement('input');
			 input.setAttribute('type','hidden');
			 input.setAttribute('name','title');
			 input.value=document.getElementById('title').value;
			 form.appendChild(input);

			 input=doc.createElement('input');
			 input.setAttribute('type','hidden');
			 input.setAttribute('name','friendsOnly');
			 if( document.getElementById('friendsOnly').checked ) {
				input.value='1';
				// Protecting Friends only journals!
				text=form.elements.namedItem('body').value;
				form.elements.namedItem('body').value=editor.protectedJournalText()+text;
			 } else
			 	input.value='0';
			 form.appendChild(input);
			 break;
			case 'atopic':
			case 'rmessage':
			case 'nmessage':
			 input=doc.createElement('input');
			 input.setAttribute('type','hidden');
			 input.setAttribute('name','title');
			 input.value=document.getElementById('title').value;
			 form.appendChild(input);
			 break;
			case 'bmessage':
			 input=doc.createElement('input');
			 input.setAttribute('type','hidden');
			 input.setAttribute('name','title');
			 input.value=document.getElementById('title').value;
			 form.appendChild(input);

			 input=doc.createElement('input');
			 input.setAttribute('type','hidden');
			 input.setAttribute('name','toUser');
			 input.value=document.getElementById('toUser').value;
			 form.appendChild(input);
			 break;
		}

        editor.smilies.convert(form.elements.namedItem('body'));
		editor.extraBB.convert(form.elements.namedItem('body'));
		
		form.submit();
		return true;
	},

	newConv: function() {
		/* For messaging...creates new conversation */
		var doc=window.parent.document;
		if(!doc) return(false);
		var type=doc.getElementById('rtseType');
		if(!type) return(false);
		type=type.value;

		var form=doc.forms.namedItem('post');
		form.elements.namedItem('pid').value='0';
		document.getElementById('title').disabled=false;
		return(true);
	},

	insertTag: function(name) {
		/* Used to insert a tag at the desired location */
		var text=document.getElementById('body');

		if( text.selectionStart==text.selectionEnd ) {
			/* No text selected */
			var bool=document.getElementById(name);
			if(bool)
				bool=bool.checked;
			else
				bool=false;
			var tag=editor._getCode(name,bool);
			var pos=text.selectionStart+tag.length;
			editor._toggleButton(name);
			text.value=text.value.substring(0,text.selectionStart)+tag+text.value.substring(text.selectionStart,text.textLength);
			text.setSelectionRange(pos,pos);
			text.focus();
		} else {
			/* Text is selected */
			var tag=editor._getCode(name,false);
			var length=tag.length;
			var data=text.value.substring(0,text.selectionStart)+tag;
			tag=editor._getCode(name,true);
			length+=tag.length;
			var start=text.selectionStart;
			var end=text.selectionEnd;
			data+=text.value.substring(text.selectionStart,text.selectionEnd)+tag+text.value.substring(text.selectionEnd,text.textLength);
			text.value=data;
			text.setSelectionRange(start,end+length);
			text.focus();
		}
		return(true);
	},

	_getCode: function(tag,end) {
		/* Private member to return proper code	*
		 * Tag is a string of the ID of the tag	*
		 * end is boolean for if the end tag is	*
		 *	to be returned instead.				*/
		var result=false;
		switch(tag) {
			case 'bold':
			 result=(!end)?'[b]':'[/b]';
			 break;
			case 'italic':
			 result=(!end)?'[i]':'[/i]';
			 break;
			case 'underline':
			 result=(!end)?'[u]':'[/u]';
			 break;
			case 'strike':
			 result=(!end)?'[s]':'[/s]';
			 break;
			case 'image':
			 result=(!end)?'[img]':'[/img]';
			 break;
			case 'quote':
			 result=(!end)?'[quote]':'[/quote]';
			 break;
			case 'smiley0':
			 result='[smiley0]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley1':
			 result='[smiley1]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley2':
			 result='[smiley2]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley3':
			 result='[smiley3]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley4':
			 result='[smiley4]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley5':
			 result='[smiley5]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley6':
			 result='[smiley6]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley7':
			 result='[smiley7]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley8':
			 result='[smiley8]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley9':
			 result='[smiley9]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley10':
			 result='[smiley10]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley11':
			 result='[smiley11]';
			 editor._toggleButton(tag);
			 break;
			case 'smiley12':
			 result='[smiley12]';
			 editor._toggleButton(tag);
			 break;
			default:
			 result=tag;
		}
		return(result);
	},

	addColor: function(hex) {
		/* Adds color to the text window */
		var text=document.getElementById('body');

		if( text.selectionStart==text.selectionEnd ) {
			/* No text selected */
			var button=document.getElementById('color');
			if( button.getAttribute('type')=='menu' ) {
				var tag='[color=#'+hex+']';
				editor._colorSelection=button.cloneNode(true);
				var replacement=document.createElement('toolbarbutton');
				replacement.setAttribute('id','color');
				replacement.setAttribute('image','chrome://rtse/skin/images/editor/color.png');
				replacement.setAttribute('tooltip','tt_color');
				replacement.setAttribute('type','checkbox');
				replacement.setAttribute('autoCheck','false');
				replacement.setAttribute('oncommand','editor.addColor(null);');
				button.parentNode.replaceChild(replacement,button);
				document.getElementById('color').checked=true;
			} else {
				var tag='[/color]';
				button.parentNode.replaceChild(editor._colorSelection,button);
				document.getElementById('color').open=false;
			}
			var pos=text.selectionStart+tag.length;
			editor._toggleButton(name);
			text.value=text.value.substring(0,text.selectionStart)+tag+text.value.substring(text.selectionStart,text.textLength);
			text.setSelectionRange(pos,pos);
		} else {
			/* Text is selected */
			var tag='[color=#'+hex+']';
			var length=tag.length;
			var data=text.value.substring(0,text.selectionStart)+tag;
			tag='[/color]';
			length+=tag.length;
			var start=text.selectionStart;
			var end=text.selectionEnd;
			data+=text.value.substring(text.selectionStart,text.selectionEnd)+tag+text.value.substring(text.selectionEnd,text.textLength);
			text.value=data;
			text.setSelectionRange(start,end+length);
		}

		text.focus();
	},

	copy: function() {
		/* Used to copy...duh */
		var trans=Components.classes["@mozilla.org/widget/transferable;1"]
		                    .createInstance(Components.interfaces.nsITransferable);
		if (!trans) return false;
		var string=Components.classes["@mozilla.org/supports-string;1"]
		                     .createInstance(Components.interfaces.nsISupportsString);
		if (!string) return false;
		var clip=Components.classes["@mozilla.org/widget/clipboard;1"]
		                   .getService(Components.interfaces.nsIClipboard);
		if (!clip) return false;
		
		var text=document.getElementById('body');
		var data=text.value.substring(text.selectionStart,text.selectionEnd);
		string.data=data;
		
		trans.addDataFlavor("text/unicode");
		trans.setTransferData("text/unicode",string,data.length*2);	/* The joys of unicode result in *2 */
		
		clip.setData(trans,null,Components.interfaces.nsIClipboard.kGlobalClipboard);

		return(true);
	},

	cut: function() {
		/* Used to cut...duh */
		var text=document.getElementById('body');
		editor.copy();
		var data=text.value.substring(0,text.selectionStart);
		data+=text.value.substring(text.selectionEnd,text.textLength);
		text.value=data;
	},

	paste: function() {
		/* Used to paste...duh */
		var text=document.getElementById('body');
		var clip=Components.classes["@mozilla.org/widget/clipboard;1"]
                           .getService(Components.interfaces.nsIClipboard);
		if (!clip) return false;
		var trans=Components.classes["@mozilla.org/widget/transferable;1"]
                            .createInstance(Components.interfaces.nsITransferable);
		if (!trans) return false;
		trans.addDataFlavor("text/unicode");

		clip.getData(trans,clip.kGlobalClipboard);
		var str=new Object();
		var length=new Object();
		trans.getTransferData("text/unicode",str,length);
		
		if (str) str=str.value.QueryInterface(Components.interfaces.nsISupportsString);
		if( str )
			var data=str.data.substring(0,length.value/2);
		/* Doesn't matter if text is selected or not */
		var value=text.value.substring(0,text.selectionStart);
		value+=data;
		value+=text.value.substring(text.selectionEnd,text.textLength);
		var start=text.selectionStart;
		var end=text.selectionStart+data.length;
		text.value=value;
		text.setSelectionRange(start,end);
		text.focus();

		return(true);
	},

	_toggleButton: function(tag) {
		/* Private member used to toggle up or down a button */
		var elm=document.getElementById(tag);
		if(elm)
			elm.checked=!elm.checked;
	},

	_setupSpellBound: function() {
		/* determine if spellbound is available - do nothing if not	*
		 * Taken from http://spellbound.sourceforge.net/dev	and		*
		 * modified.												*/
		if(typeof(Components.classes["@mozilla.org/spellbound;1"])=="undefined") return(false);
		
		// define the commandset, menu, and
		// keyset to use with spellbound
		const commandset_id="cmds";
		const keyset_id="keys";
		const menu_id="menu";
		const toolbar_id="toolbar";

		// append spellbound command to existing commandset
		var parent=document.getElementById(commandset_id);
		var elem=document.createElement("command");
		elem.setAttribute("id","cmd_ExtSpellBound");
		elem.setAttribute("oncommand","editor.spellBound_useNode();");
		parent.appendChild(elem);

		// append spellbound stringbundle to
		// the parent of commandset
		elem=document.createElement("stringbundle");
		elem.setAttribute("id","sb_ExtSpellBound");
		elem.setAttribute("src","chrome://spellbound/locale/spellboundOverlay.properties");
		parent.parentNode.appendChild(elem);
		var sb=document.getElementById("sb_ExtSpellBound");

		// append spellbound key to existing keyset
		parent=document.getElementById(keyset_id);
		elem=document.createElement("key");
		elem.setAttribute("id","key_ExtSpellBound");
		elem.setAttribute("keycode",sb.getString("editcheckspelling.keybinding"));
		elem.setAttribute("command","cmd_ExtSpellBound");
		elem.setAttribute("modifiers","accel,shift");
		parent.appendChild(elem);

		// append spellbound menuseparator to existing menu
		parent=document.getElementById(menu_id);
		elem=document.createElement("menuseparator");
		parent.appendChild(elem);

		// append spellbound menuitem to existing menu
		elem=document.createElement("menuitem");
		elem.setAttribute("id","menu_ExtSpellBound");
		elem.setAttribute("observes","cmd_ExtSpellBound");
		elem.setAttribute("label",sb.getString("checkSpellingCmd.label"));
		elem.setAttribute("key","key_ExtSpellBound");
		elem.setAttribute("accesskey",sb.getString("editcheckspelling.accesskey"));
		elem.setAttribute("command","cmd_ExtSpellBound");
		elem.setAttribute("image","chrome://rtse/skin/images/editor/spell.png");
		parent.appendChild(elem);

		/* Append spellbound to Toolbar */ 
		parent=document.getElementById(toolbar_id);
		elem=document.createElement('toolbarbutton');
		elem.setAttribute('id','toolbar_ExtSpellBound');
		elem.setAttribute("observes","cmd_ExtSpellBound");
		elem.setAttribute("key","key_ExtSpellBound");
		elem.setAttribute("command","cmd_ExtSpellBound");
		elem.setAttribute("image","chrome://rtse/skin/images/editor/spell.png");
		parent.appendChild(elem);
	},

	spellBound_useNode: function() {
		/* Calls the spellchecker Spellbound */
		var node = document.getElementById("body");
		var args = [];
		args[0] = node;

		var params = "chrome,close,titlebar,modal";
		var pref = Components.classes["@mozilla.org/preferences-service;1"]
		                     .getService(Components.interfaces.nsIPrefBranch);

		try {
			if (pref.getBoolPref("spellbound.spellcheck.modal") == false);
			params = "chrome,close,titlebar";
		} catch (e) { }

		window.openDialog(
			"chrome://spellbound/content/SBSpellCheck.xul",
			"_blank", params, false, false, true, args);
	},

	switchJournal: function() {
		/* Switches text */
		var elm=document.getElementById('friendsOnly');
		if(elm.checked) {
			elm.setAttribute('label','Visible to All');
			elm.checked=false;
		} else {
			elm.setAttribute('label','Friends Only');
			elm.checked=true;
		}
	},

	link: function() {
		/* Opens the link dialog */
		var win=window.openDialog('chrome://rtse/content/link.xul','addLink','chrome,centerscreen',editor);
	},

	color: function() {
		/* Opens the color dialog */
		var win=window.openDialog('chrome://rtse/content/colorpicker.xul','addLink','chrome,centerscreen',editor);
	},

	_addLink: function(url,text) {
		/* Adds link */
		var body=document.getElementById('body');
		var tag='[link='+url+']'+text+'[/link]';

		var start=body.selectionStart;
		var end=body.selectionStart+tag.length;
		body.value=body.value.substring(0,body.selectionStart)+tag+body.value.substring(body.selectionEnd,body.textLength);
		body.setSelectionRange(start,end);
		body.focus();
		
		return true;
	},

	_focus: function() {
		/* Makes focus on textbox */
		document.getElementById('body').focus();
		return(true);
	},

    HTMLParse: function(text) {
        /* Parses HTML into BBcode */
        text=text.replace(/<b>(.*?)<\/b>/g,'[b]$1[/b]');
		text=text.replace(/<i>(.*?)<\/i>/g,'[i]$1[/i]');
		text=text.replace(/<u>(.*?)<\/u>/g,'[u]$1[/u]');
		text=text.replace(/<del>(.*?)<\/del>/g,'[s]$1[/s]');
		text=text.replace(/<a class="body" href="(.*?)" target="_blank">(.*?)<\/a>/g,'[link=$1]$2[/link]');
		text=text.replace(/<a href="(.*?)" target="_blank">(.*?)<\/a>/g,'[link=$1]$2[/link]');
		text=text.replace(/<a href="(.*?)">(.*?)<\/a>/g,'[link=$1]$2[/link]');
		text=text.replace(/<font color=".*">(.*?)<\/font>/g,'$1'); /* Old way maybe? */
		text=text.replace(/<span style="color:.*">(.*?)<\/span>/g,'$1');
		text=text.replace(/<img .*?src="\/(.*?)".*?>/g,'[img]http://www.roosterteeth.com/$1[/img]');
		text=text.replace(/<img.*? src="(.*?)".*?>/g,'[img]$1[/img]');
		text=text.replace(/<br><br><span class="small"(.*?)>(.*?)<\/span>/g,'');
		text=text.replace(/<blockquote(.*?)>(.*?)<\/blockquote>/g,'');
		text=text.replace(/\t/g,'');
		text=text.replace(/\n/g,'');
		text=text.replace(/<br>/g,'\n');

		return text;
    },

	extraBB: {
		/* Parses extra BBcode added by RTSE */
		convert: function(aElm)
		// EFFECTS: converts to the site BBcode.  Takes an element in the parent document.
		//          Looks for rtseLocation for a path for any 'in reply to...' sections.
		{
			aElm.value=aElm.value.replace(/\[quote=([a-zA-Z0-9_]{4,12})\]([\s\S]+)\[\/quote\]/g,'[b]Quoting $1:[/b][quote]$2[/quote]');
			
			// Numbers in forum
			var doc=aElm.ownerDocument;
			var loc;
			if( doc.getElementById('rtseLocation') ) {
				loc=doc.getElementById('rtseLocation').value;
			} else {
				loc=doc.location.href.replace(/^https?:\/\/(www|sh|rvb|panics)\.roosterteeth\.com(.*)$/i,'$2');
				loc=loc.replace(/#[a-z0-9]+/i,''); // clears any anchors
			}
			loc=loc.replace(/&page=[0-9]+/i,''); // clears any currently set page
			var post,page;
			while( aElm.value.match(/\[i\]In reply to [a-zA-Z0-9_]{4,12}, #[0-9]+:\[\/i\]/i) ) {
				post=aElm.value.replace(/^[\s\S]*\[i\]In reply to [a-zA-Z0-9_]{4,12}, #([0-9]+):\[\/i\][\s\S]*/i,'$1');
				page=(loc=='')?'':'&page='+Math.ceil(post/30);
				aElm.value=aElm.value.replace(/\[i\]In reply to ([a-zA-Z0-9_]{4,12}), #([0-9]+):\[\/i\]/i,
				                              '[i]In reply to $1, [link='+loc+page+'#t$2][i]#$2[/i][/link]:[/i]');
			}
		},
		deconvert: function()
		// EFFECTS: takes special BBcode from RTSE and converts it back to RT BBcode.  To preserve path's of 'in reply to...' text,
		//          it will dump the location into a form field that convert will use.
		{
			/* converts to RTSE BB */
			var body=document.getElementById('body');

			body.value=body.value.replace(/\[b\]Quoting ([a-zA-Z0-9_]{4,12}):\[\/b\]\[quote\]([\s\S]+)\[\/quote\]/g,'[quote=$1]$2[/quote]');

			// Numbers in forum
			if( body.value.match(/\[i\]In reply to [a-zA-Z0-9_]{4,12}, \[link=.*?#t[0-9]+\]\[i\]#[0-9]+\[\/i\]\[\/link\]:\[\/i\]/g) ) {
				// creating a form element to preserve the path
				var doc=window.parent.document;
				var path=body.value.replace(/^[\s\S]*\[i\]In reply to ([a-zA-Z0-9_]{4,12}), \[link=(.*?)#t[0-9]+\]\[i\](#[0-9]+)\[\/i\]\[\/link\]:\[\/i\][\s\S]*$/i,
				                            '$2');
				var elm=doc.createElement('input');
				elm.value=path;
				elm.id='rtseLocation';
				elm.setAttribute('type','hidden');
				doc.forms.namedItem('post').appendChild(elm);
				
				body.value=body.value.replace(/\[i\]In reply to ([a-zA-Z0-9_]{4,12}), \[link=.*?#t[0-9]+\]\[i\](#[0-9]+)\[\/i\]\[\/link\]:\[\/i\]/g,
				                             '[i]In reply to $1, $2:[/i]');
			}
		}
	},

	smilies: {
		/* Object used for all smiley things */
		load: function()
		// EFFECTS: Loads the smilies from the componenet, and adds to the menu
		{
			
			this.data=Components.classes["@shawnwilsher.com/smilies;1"]
	                            .getService(Components.interfaces.nsISmilies);

			
			// Loading file
			var file=Components.classes["@mozilla.org/file/directory_service;1"]
			                   .getService(Components.interfaces.nsIProperties)
			                   .get("ProfD",Components.interfaces.nsIFile);
			file.append("rtse");
			file.append("smilies.xml");
			if( !file.exists() ) {
				// Now we have to make the file
				const id="RTSE@shawnwilsher.com"
				var file=Components.classes["@mozilla.org/file/directory_service;1"]
				                   .getService(Components.interfaces.nsIProperties)
				                   .get("ProfD",Components.interfaces.nsIFile);
				file.append("rtse");	// Directory Name
				if( !file.exists() ) {	// If it doesn't exist, create
					file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE,0664);
				}

				var ext=Components.classes["@mozilla.org/extensions/manager;1"]
				                  .getService(Components.interfaces.nsIExtensionManager)
				                  .getInstallLocation(id)
				                  .getItemLocation(id);
				ext.append("defaults");
				ext.append("smilies.xml");
				ext.copyTo(file,"smilies.xml");
			}
			this.data.load(file);

			editor.smilies._addToMenu();
		},

		_addToMenu: function() {
			/* Addes the smilies to the menu */
			var ref=document.getElementById('smiley');
			ref.setAttribute('type','menu');
			var menu=document.createElement('menupopup');
			var item,name,key;
			
			var names=editor.smilies.data.getNames({});
			for( var i in names ) {
				name=names[i];
				key=editor.smilies.data.getKey(name);
				item=document.createElement('menuitem');
				item.setAttribute('image',editor.smilies.data.getPath(name));
				item.setAttribute('label',name);
				item.setAttribute('validate','never');				
				item.setAttribute('style','background-color:#D4D0C8 !important;')
				item.setAttribute('class','menuitem-iconic');
				item.setAttribute('oncommand','editor.insertTag("'+key+'");');
				menu.appendChild(item);
			}

			ref.appendChild(menu);
			if( editor.config.get('smilies','true')=='false' )
				document.getElementById('convertSmilies').checked=false;
		},

		convert: function(elm) {
			/* Converts text to smilies */
			if( !document.getElementById('convertSmilies').checked ) return(false);
			elm.value=this.data.convertText(elm.value);
		},

		deconvert: function() {
			/* Reverses the change for smilies */
			var elm=document.getElementById('body');
			elm.value=this.data.deconvertText(elm.value);
		}
	},

	protectedJournalText: function()
	// EFFECTS:  returns the text to indicate a protected journal
	{
		var text='[quote]What\'s this?\n'+
		         'Well you see, even friends only journals can be read by '+
		         'determined people, no matter if they are on your friends list'+
		         ' or not.  But do not worry, RTSE protects you against even '+
		         'the most prying eye.  The only thing they\'ll get to see is '+
		         'the title of this journal.\n'+
		         '-RTSE devs[/quote]\n\n';
		return text;
	}
	
}
