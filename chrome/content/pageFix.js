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
 *     Brandon Jernigan
 *
 * ***** END LICENSE BLOCK ***** */

if( !gRTSE )
	var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
	                    .createInstance(Components.interfaces.nsIRTSE);
function RTSE_linkFix(doc) {
	/* removes all targets from links to RT sites and makes it go to your own flavor */
	try {
		var links=RTSE_evaluateXPath(doc.getElementById('pageContent'),'//a[@target="_blank"]');
		var regEx=/^http:\/\/(www|rvb|sh|panics).roosterteeth.com(.*)$/i;
		for( var i=(links.length-1); i>=0; i-- ) {
			if( links[i].href.match(regEx) ) {
				links[i].removeAttribute('target');	/* Prevents new window */
				links[i].href=links[i].href.replace(regEx,'$2');
			} else if( links[i].href.match(/^\/(.*)$/i) ) {
				links[i].removeAttribute('target'); /* Prevents new window */
			}
		}
	} catch(e) {
		gRTSE.sendReport(e);
	}
}

function RTSE_addCSS(aDoc)
// EFFECTS: adds special CSS instructions to the head of each RT page
{
	var head=aDoc.getElementsByTagName('head')[0];
	var css=aDoc.createElement('style');
	css.setAttribute('type','text/css');
	css.setAttribute('media','screen');
	
	// fix for too long of text in textboxes
	var text=aDoc.createTextNode('textarea { overflow-x:auto; }\n');
	css.appendChild(text);
	
	// Appending
	head.appendChild(css);
}

function RTSE_themeIt(doc) {
	/* changes the CSS to the right one for your flavor */
	try {
		var theme=RTSE.config.get('themeType','www');
		var css=RTSE_evaluateXPath(doc,'//link[@rel="stylesheet"]');
		var regEx=new RegExp('/assets/'+theme+'.css','i');
		if( !(regEx.test(css[0].href)) ) {
			var link=doc.createElement('link');
			link.setAttribute('type','text/css');
			link.setAttribute('rel','stylesheet');
			link.setAttribute('href','/assets/'+theme+'.css');
			doc.getElementsByTagName('head')[0].appendChild(link);
		}
	} catch(e) {
		gRTSE.sendReport(e);
	}
}

function RTSE_forumListBox(doc) {
	/* Used to create and insert the list box to jump to a forum */
	var listBox=doc.createElement('select');
	var ids=new Array();
	var names=new Array();
	var option;
	var text;
	
	/* Declaring all forums */
	ids.push(7);
	names.push('The Basement');
	ids.push(27);
	names.push('Forum Games');
	ids.push(17);
	names.push('Lopez\'s Garage');
	ids.push(11);
	names.push('Technical');
	ids.push(14);
	names.push('Politics & Current Events');
	ids.push(12);
	names.push('Sports');
	ids.push(29);
	names.push('Art');
	ids.push(28);
	names.push('The Billboard');
	ids.push(25);
	names.push('Comics & Anime');
	ids.push(15);
	names.push('Books');
	ids.push(4);
	names.push('Music');
	ids.push(16);
	names.push('Television');
	ids.push(13);
	names.push('Film Making & Machinima');
	ids.push(5);
	names.push('Movies');
	ids.push(24);
	names.push('Board Games & Tabletop Games');
	ids.push(23);
	names.push('Classics & Handhelds');
	ids.push(22);
	names.push('Gamecube');
	ids.push(21);
	names.push('Playstation');
	ids.push(31);
	names.push('Xbox 360');
	ids.push(20);
	names.push('Xbox');
	ids.push(26);
	names.push('The Sims');
	ids.push(19);
	names.push('Halo');
	ids.push(18);
	names.push('PC Gaming');
	ids.push(3);
	names.push('General Gaming');
	ids.push(30);
	names.push('PANICS');
	ids.push(10);
	names.push('The Strangerhood');
	ids.push(2);
	names.push('Red vs Blue');
	ids.push(9);
	names.push('Rooster Teeth');
	ids.push(8);
	names.push('Website Forum');
	ids.push(1);
	names.push('First Stop');
	ids.push(104);
	names.push('18 and Up');
	ids.push(103);
	names.push('Level 20+');
	ids.push(101);
	names.push('Sponsors');
	ids.push('null');
	names.push('Jump to forum...');
	
	try {
		/* Creating the listBox */
		for( var i=(ids.length-1); i>=0; i-- ) {
			if( RTSE.config.get('show_ftopic_'+ids[i],'true')=='true' ) {
				option=doc.createElement('option');
				option.setAttribute('value',ids[i]);
				option.innerHTML=names[i];
				listBox.appendChild(option);
			}
		}

		/* Adding redirector */
		listBox.addEventListener('change',function() {
			if( this.options[this.selectedIndex].value!='null' )
				doc.location='/forum/forum.php?fid='+this.options[this.selectedIndex].value;
		},false);

		/* Now that we have the listBox all filled up... */
		var ref=doc.getElementById('tabsHolder').parentNode;
		var cont=doc.createElement('tr');
		cont.appendChild(listBox);
		ref.appendChild(cont);
	} catch(e) {
		gRTSE.sendReport(e);
	}
}

function RTSE_insertEditor(doc,type) {
	/* Used to insert the editor in as opposed to the normal interface */
	if( gRTSE.prefsGetBool('extensions.rtse.editor')==false ) return;
	const DEFAULT_HEIGHT='262';
	const TITLE_HEIGHT='287';
	const BLANK_MESSAGE_HEIGHT='356';
	
	try {
		var frame=doc.createElement('iframe');
		frame.setAttribute('id','rtseXULeditor');
		frame.setAttribute('name','rtseXULeditor');


		var form=doc.forms.namedItem('post');
		var input=doc.createElement('input');
		input.setAttribute('type','hidden');
		input.setAttribute('value',type);
		input.setAttribute('id','rtseType');
		form.appendChild(input);

		/* Lets add old body for everything */
		input=doc.createElement('input');
		input.setAttribute('name','oldBody');
		input.setAttribute('type','hidden');
		input.value=form.elements.namedItem('body').value;
		form.appendChild(input);

		/* and add oldTitle if title exists */
		if( form.elements.namedItem('title') ) {
			input=doc.createElement('input');
			input.setAttribute('name','oldTitle');
			input.setAttribute('type','hidden');
			input.value=form.elements.namedItem('title').value;
			form.appendChild(input);
		}
		
		var i;
		switch(type) {
			case 'comment':
			 var ref=doc.getElementById('Add a Comment').firstChild;
			 var width=ref.parentNode.clientWidth+2;
			 frame.setAttribute('style','width:'+width+'px;height:'+DEFAULT_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;
			case 'atopic':
			 var ref=doc.getElementById('Add a New Topic').firstChild;
			 var width=ref.parentNode.clientWidth+2;
			 frame.setAttribute('style','width:'+width+'px;height:'+TITLE_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;
			case 'journal':
			 var ref=doc.getElementById('Make a Journal Entry').firstChild;
			 var width=ref.parentNode.clientWidth+2;
			 frame.setAttribute('style','width:'+width+'px;height:'+TITLE_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;		
			case 'ejournal':
			 var ref=doc.getElementById('Edit Journal Entry').firstChild;
			 var width=ref.parentNode.clientWidth+2;
			 doc.getElementById('rtseType').value='journal';
			 input=doc.createElement('input');
			 input.setAttribute('name','oldFriendsOnly');
			 input.setAttribute('type','hidden');
			 input.value=form.elements.namedItem('friendsOnly').value;
			 form.appendChild(input);
			 frame.setAttribute('style','width:'+width+'px;height:'+TITLE_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;
			case 'rmessage':
			 var ref=doc.getElementById('Reply').firstChild;
			 var width=ref.parentNode.clientWidth+2;
			 frame.setAttribute('style','width:'+width+'px;height:'+TITLE_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;
			case 'bmessage':
			 var ref=doc.getElementById('Send a Message').firstChild;
			 var width=ref.parentNode.clientWidth+2;
			 frame.setAttribute('style','width:'+width+'px;height:'+BLANK_MESSAGE_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;
			case 'nmessage':
			 var ref=doc.getElementById('Send a Message').firstChild;
			 input=form.elements.namedItem('uid').cloneNode(true);
			 form.appendChild(input);
			 var width=ref.parentNode.clientWidth+2;
			 frame.setAttribute('style','width:'+width+'px;height:'+TITLE_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;
			case 'fcomment':
			 var elms=RTSE_evaluateXPath(doc,"//td[@id='pageContent']/table/tbody/tr[2]/td/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/a[2]/b");
			 if( gRTSE.prefsGetBool('extensions.rtse.editor') && RTSE.config.get('same_page_reply','false')=='true' ) {
			 	 /* This is for the single page reply */
				 for( i=(elms.length-1); i>=0; i-- ) {
					elms[i].parentNode.setAttribute('href','#Post');
					elms[i].addEventListener('click',RTSE_samePageReply,false);
				 }
			 } /* end single page reply */
			 var ref=doc.getElementById('Post').firstChild;
			 var width=ref.parentNode.clientWidth+2;
			 frame.setAttribute('style','width:'+width+'px;height:'+DEFAULT_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;
			case 'freply':
			 var ref=doc.getElementById('Reply').firstChild;
			 var width=ref.parentNode.clientWidth+2;
			 frame.setAttribute('style','width:'+width+'px;height:'+DEFAULT_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;
			case 'cpreview':
			 var test=form.elements.namedItem('to').value;
			 var ref=doc.getElementById('Edit').firstChild;
			 var width=ref.parentNode.clientWidth+2;
			 if( test=='/members/journal/journalPost.php' ||
				 /\/members\/journal\/editEntryPost.php\?id=[0-9]+/i.test(test) ) {
			 	/* Hack for journals (*sigh*) */
				doc.getElementById('rtseType').value='journal';
				input=doc.createElement('input');
			 	input.setAttribute('name','oldFriendsOnly');
			 	input.setAttribute('type','hidden');
			 	input.value=form.elements.namedItem('friendsOnly').value;
			 	form.appendChild(input);
				frame.setAttribute('style','width:'+width+'px;height:'+TITLE_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 } else if( /\/forum\/addTopicPost.php\?fid=.*/ig.test(test) ) {
			 	/* Hack for Adding Topic */
				doc.getElementById('rtseType').value='atopic';
			 	frame.setAttribute('style','width:'+width+'px;height:'+TITLE_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 } else
			 	frame.setAttribute('style','width:'+width+'px;height:'+DEFAULT_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;
			case 'cedit':
			 var ref=doc.getElementById('Edit Post').firstChild;
			 var width=ref.parentNode.clientWidth+2;
			 frame.setAttribute('style','width:'+width+'px;height:'+DEFAULT_HEIGHT+'px;border:1px solid #000000;border-top-style:none;');
			 break;
		}
		ref.parentNode.replaceChild(frame,ref);
		doc.getElementById('rtseXULeditor').contentWindow.location.href='chrome://rtse/content/editor.xul';
	} catch(e) {
		gRTSE.sendReport(e);
	}
	return(true);
}

function RTSE_switchArrows(doc) {
	/* Switches arrows to prevent issues */
	try {
		var imgs=RTSE_evaluateXPath(doc,"//img[@src='/assets/images/smallBulletDown.gif']");
		var img;
		for( var i=(imgs.length-1); i>=0; i-- ) {
			img=doc.createElement('img');
			img.setAttribute('src','chrome://rtse/skin/images/global/bluebutton.png');
			img.setAttribute('alt','RTSE');
			img.setAttribute('style','margin:-4px 0px -4px 2px;padding-right:4px;');
			imgs[i].parentNode.parentNode.replaceChild(img,imgs[i].parentNode);
		}
	} catch(e) {
		gRTSE.sendReport(e);
	}
}

function RTSE_addToSideBar(doc) {
	/* Adds My Stats and Mod history to side navigation panel */
	try {
		if( RTSE.config.get('sponsor','false')=='false' ) return;
		var ref=RTSE_evaluateXPath(doc,"//td[@id='navCol']/table/tbody/tr[17]");
		ref=ref[0];
		var tr,td,div,a;
		var items=new Array('My Stats','Mod History');
		var links=new Array('/members/stats/myStats.php','/members/modHistory.php');
		for( var i=(items.length-1); i>=0; i-- ) {
			tr=doc.createElement('tr');
			td=doc.createElement('td');
			td.setAttribute('class','nav');
			div=doc.createElement('div');
			div.setAttribute('class','navLink');
			a=doc.createElement('a');
			a.setAttribute('href',links[i]);
			a.appendChild(doc.createTextNode(items[i]));
			div.appendChild(a);
			td.appendChild(div);
			tr.appendChild(td);
			ref.parentNode.insertBefore(tr,ref.nextSibling);
		}
	} catch(e) {
		gRTSE.sendReport(e);
	}
}

function RTSE_postPermalink(aDoc)
// EFFECTS: Adds a permalink to posts on a page in aDoc
{
	try {
		var elms=RTSE_evaluateXPath(aDoc,"//table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[1]");
		var a,text,num;
		var base=new String(aDoc.location.href);
		base=base.replace(/^https?:\/\/(www|rvb|sh|panics)\.roosterteeth\.com(.*)$/,'$2');
		base=base.replace(/.*(#[c|t][0-9]+)$/i,'');
		for( var i in elms ) {
			text=elms[i].firstChild.data;
			if( text.match(/^.*#([0-9]+).*$/i) ) {
				a=aDoc.createElement('a');
				a.setAttribute('title','Permalink');
				text=text.replace(/(\n|\t)/gmi,'');
				num=text.replace(/^.*#([0-9]+).*$/i,'$1');
				a.setAttribute('href',base+'#t'+num);
				a.appendChild(aDoc.createTextNode('#'+num));
				text=' '+text.replace(/^#[0-9]+(.*?)$/,'$1');
				elms[i].replaceChild(aDoc.createTextNode(text),elms[i].firstChild);
				elms[i].insertBefore(a,elms[i].firstChild);
			}
		}
	} catch(e) {
		gRTSE.sendReport(e);
	}
}

function RTSE_samePageReply()
// EFFECTS: Function called when clicking on reply when same page replies is enabled
{
	// Get post and what-not
	var name=this.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('td')[0].getElementsByTagName('table')[0].getElementsByTagName('tbody')[0].getElementsByTagName('tr')[1].getElementsByTagName('td')[0].getElementsByTagName('table')[0].getElementsByTagName('tbody')[0].getElementsByTagName('tr')[0].getElementsByTagName('td')[0].firstChild.firstChild.data;
	name=name.replace(new RegExp('\t','gmi'),'');
	name=name.replace(new RegExp('\n','gmi'),'');
						
	var num=this.parentNode.parentNode.parentNode.parentNode.getElementsByTagName('td')[0].getElementsByTagName('a')[0].firstChild.data;
	num=num.replace(/#([0-9]+)/,'$1');;

	// Append to editor
	var editor=this.ownerDocument.getElementById('rtseXULeditor').contentDocument.wrappedJSObject.getElementById('body');
	editor.value=editor.value+'[i]In reply to '+name+', #'+num+':[/i]\n\n';
	editor.focus();
}

function RTSE_addReply(aDoc)
// EFFECTS: Adds the [ reply ] option to posts on a specifed aDoc
{
	var elms=RTSE_evaluateXPath(aDoc,"//table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div");
	var span,a,b;
	for( var i in elms ) {
		span=aDoc.createElement('span');
		a=aDoc.createElement('a');
		b=aDoc.createElement('b');
		a.setAttribute('href',(aDoc.getElementById('Post'))?'#Post':'#add');
		a.setAttribute('class','small');
		a.addEventListener('click',RTSE_samePageReply,false);
		b.appendChild(aDoc.createTextNode('Reply'))
		a.appendChild(b);
		span.appendChild(aDoc.createTextNode('&nbsp; [ '));
		span.appendChild(a);
		span.appendChild(aDoc.createTextNode(' ] '));
		elms[i].appendChild(span);
	}
}
