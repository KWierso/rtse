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
 * Shawn Wilsher <me@shawnwilsher.com>
 *
 * Portions created by the Initial Developer are Copyright (C) 2005-2008
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *     Brandon Jernigan
 *
 * ***** END LICENSE BLOCK ***** */

if( !gRTSE )
	var gRTSE=Components.classes['@shawnwilsher.com/rtse;1']
	                    .getService(Components.interfaces.nsIRTSE);

function RTSE_linkFix(aDoc)
// EFFECTS: removes all targets from links and prevents links from opening in a
//          new flavor.  In addition, it changes an anchors for that page to
//          scroll into view as opposed to loading a new url.
{
  // Scroll Into view for links on same page
  var loc = aDoc.location.href
                .replace(/^https?:\/\/(www|rvb|sh|panics|magic)\.roosterteeth\.com(.*)$/i,'$2');
  var func = function showMe(aEvent) {
    var id = this.href.replace(/^.*?#([\S\s]+)$/i,'$1');
    var doc = this.ownerDocument;
    var elm = doc.getElementById(id) ? doc.getElementById(id) :
                                       doc.getElementsByName(id)[0];
    if (elm) {
      elm.scrollIntoView(true);
      aEvent.preventDefault();
    }
  };
  var links = RTSE_evaluateXPath(aDoc,"//a[contains(@href,'#') and contains(@href,'" + loc + "')]");
  for (var i = (links.length - 1); i >= 0; --i) {
    links[i].addEventListener("click", func, false);
  }

  // Remove target and keep same flavor
  if (!gRTSE.prefsGetBool("extensions.rtse.fixLinks")) return;
  links = RTSE_evaluateXPath(aDoc,'//a[@target="_blank"]');
  var regEx = /^http:\/\/(www|rvb|sh|panics|magic).roosterteeth.com(.*)$/i;
  for (var i = (links.length - 1); i >= 0; --i) {
    if (links[i].href.match(regEx)) {
      links[i].removeAttribute('target');
      links[i].href=links[i].href.replace(regEx, '$2');
    } else if (links[i].href.match(/^\/(.*)$/i)) {
      links[i].removeAttribute('target');
    }
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
	css.appendChild(aDoc.createTextNode('textarea { overflow-x:auto; }\n'));
	
	// Appending
	head.appendChild(css);
}

function RTSE_themeIt(doc) {
	/* changes the CSS to the right one for your flavor */
	try {
		var theme = gRTSE.prefsGetString("extensions.rtse.themeType");
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
  if (!gRTSE.prefsGetBool("extensions.rtse.forum")) return;
	var listBox=doc.createElement('select');
  let ids = [
    7,
    27,
    17,
    11,
    14,
    12,
    29,
    28,
    25,
    15,
    4,
    16,
    13,
    5,
    24,
    23,
    22,
    33,
    32,
    21,
    31,
    20,
    26,
    19,
    18,
    3,
    35,
    30,
    10,
    2,
    9,
    8,
    1,
    104,
    103,
    101,
    102,
    'null'
  ];
  var bundle = Components.classes["@mozilla.org/intl/stringbundle;1"]
                         .getService(Components.interfaces.nsIStringBundleService)
                         .createBundle("chrome://rtse/locale/forums.properties");
  var getName = function getName(aName) {
    return bundle.GetStringFromName(aName);
  };
	var option;
  /* Creating the listBox */
  for (var i = (ids.length - 1); i >= 0; --i) {
    try {
			if ((typeof(ids[i]) == "number" &&
           gRTSE.prefsGetBool("extensions.rtse.forum." + ids[i])) ||
          ids[i] == 'null') {
				option=doc.createElement('option');
				option.setAttribute('value',ids[i]);
				option.innerHTML=getName(ids[i]);
				listBox.appendChild(option);
			}
    } catch (e) { /* eat any exceptions due to bad prefs */ }
  }

  /* Adding redirector */
  listBox.addEventListener('change', function() {
      if (this.options[this.selectedIndex].value != 'null')
          doc.location = '/forum/forum.php?fid=' + this.options[this.selectedIndex].value;
  }, false);

  /* Now that we have the listBox all filled up... */
  let ref = doc.getElementById('tabsHolder')
            .getElementsByTagName("table")[1]
            .firstChild.firstChild;
  let cont = doc.createElement('td');
  listBox.setAttribute("style", "position:relative;right:1px;top:-1px;");
  cont.appendChild(listBox);
  cont.style.padding = "0px 5px 0px 0px";
  cont.setAttribute("align", "right");
  cont.setAttribute("valign", "middle");
  ref.replaceChild(cont, ref.childNodes[3]);
}

function RTSE_addToSideBar(doc) {
	/* Adds My Stats and Mod history to side navigation panel */
	try {
		if (!gRTSE.prefsGetBool("extensions.rtse.sponsor")) return;
		var ref=RTSE_evaluateXPath(doc,"//td[@id='navCol']/table/tbody/tr[17]");
		ref=ref[0];
		var tr,td,div,a;
		var items=new Array('My Stats','Mod History', 'My Log');
		var links=new Array('/members/stats/myStats.php','/members/modHistory.php', '/members/log.php');
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
		base=base.replace(/^https?:\/\/(www|rvb|sh|panics|magic)\.roosterteeth\.com(.*)$/,'$2');
		base=base.replace(/.*(#[c|t][0-9]+)$/i,'');
		for( var i in elms ) {
			text=elms[i].firstChild.data;
			if( /^\s*#([0-9]+)[\s\S]*$/i.test(text) ) {
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

function RTSE_samePageReply(aEvent)
// EFFECTS: Function called when clicking on reply when same page replies is enabled
{
	// Get post and what-not
  var name = this.parentNode.parentNode.parentNode.parentNode.parentNode
                 .parentNode.parentNode.parentNode
                 .getElementsByTagName('td')[0]
                 .getElementsByTagName('table')[0]
                 .getElementsByTagName('tbody')[0]
                 .getElementsByTagName('tr')[1].getElementsByTagName('td')[0]
                 .getElementsByTagName('table')[0]
                 .getElementsByTagName('tbody')[0]
                 .getElementsByTagName('tr')[0].getElementsByTagName('td')[0]
                 .firstChild.firstChild.data;
	name=name.replace(new RegExp('\t','gmi'),'');
	name=name.replace(new RegExp('\n','gmi'),'');
						
  var num = this.parentNode.parentNode.parentNode.parentNode
                .getElementsByTagName('td')[0].getElementsByTagName('a')[0]
                .firstChild.data;
	num = num.replace(/#([0-9]+)/,'$1');

	// Append to editor
  var editor;
  var text = '[i]In reply to '+name+', #'+num+':[/i]\n\n';
  var useEditor = gRTSE.prefsGetBool("extensions.rtse.editor");
  if (useEditor) {
    editor = document.getElementById("rtse-editor-body");
    RTSE.editor.ensureEditorIsVisible();
  } else {
    editor = this.ownerDocument.forms.namedItem('post').elements.namedItem('body');
  }
  editor.value = editor.value + text;
  if (useEditor) {
    // We want to simulate the user doing this, so send out an input event.
    var e = document.createEvent("UIEvents");
    e.initUIEvent("input", true, false, window, 0);
    editor.dispatchEvent(e);
  }
  editor.focus();
}

function RTSE_addReply(aDoc)
// EFFECTS: Adds the [ reply ] option to posts on a specifed aDoc
{
	var elms=RTSE_evaluateXPath(aDoc,"//table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div");
	var span,a,b;
	var href = (aDoc.getElementById('Post'))?'#Post':'#add';
	for( var i in elms ) {
		span=aDoc.createElement('span');
		a=aDoc.createElement('a');
		b=aDoc.createElement('b');
		a.setAttribute('href',href);
		a.setAttribute('class','small');
		a.addEventListener('click',RTSE_samePageReply,false);
		b.appendChild(aDoc.createTextNode('Reply'))
		a.appendChild(b);
		span.appendChild(aDoc.createTextNode(' [ '));
		span.appendChild(a);
		span.appendChild(aDoc.createTextNode(' ] '));
		elms[i].appendChild(span);
	}
}

/**
 * Modifies all replies to keep them on the same page.
 *
 * @param aDoc The document to be modified.
 */
function RTSE_modifyReply(aDoc)
{
  if (!gRTSE.prefsGetBool("extensions.rtse.samePageReply")) return;
  var elms = RTSE_evaluateXPath(aDoc, "//td[@id='pageContent']/table/tbody/tr[2]/td/table/tbody/tr[3]/td/table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div/a[2]/b");
  for (let i in elms) { 	 
    elms[i].parentNode.removeAttribute("href");
    elms[i].addEventListener("click", RTSE_samePageReply, false);
  }
}

function RTSE_addQuote(aDoc)
// EFFECTS: Adds the [ quote ] option to posts on a specifed aDoc
{
	var elms=RTSE_evaluateXPath(aDoc,"//table/tbody/tr/td/table/tbody/tr/td[2]/table/tbody/tr[1]/td[2]/div");
	var span,a,b;
	for( var i in elms ) {
		span=aDoc.createElement('span');
		a=aDoc.createElement('a');
		b=aDoc.createElement('b');
		a.setAttribute('class','small');
		a.addEventListener('click',RTSE_quotePost,false);
		b.appendChild(aDoc.createTextNode('Quote'))
		a.appendChild(b);
		span.appendChild(aDoc.createTextNode(' [ '));
		span.appendChild(a);
		span.appendChild(aDoc.createTextNode(' ] '));
		elms[i].appendChild(span);
	}
}

function RTSE_quotePost(aEvent)
// EFFECTS: Quotes a post
{
	var ref = this.parentNode.parentNode.parentNode.parentNode.parentNode;
	var post = RTSE_evaluateXPath(ref,'./tr[2]/td');
	var text = new String(post[0].innerHTML);

	text = '[quote]' + RTSE_HTMLtoBB(text) + '[/quote]\n\n';

  // update the text of the body
  var editor;
  var useEditor = gRTSE.prefsGetBool("extensions.rtse.editor");
  if (useEditor) {
    editor = document.getElementById("rtse-editor-body");
    RTSE.editor.ensureEditorIsVisible();
  } else {
    editor = this.ownerDocument.forms.namedItem("post").elements
                 .namedItem("body");
  }
  editor.value = editor.value + text;
  if (useEditor) {
    // We want to simulate the user doing this, so send out an input event.
    var e = document.createEvent("UIEvents");
    e.initUIEvent("input", true, false, window, 0);
    editor.dispatchEvent(e);
  }
  editor.focus();
}

function RTSE_convertExtraBB(aEvent)
// EFFECTS: converts to the site BBcode.  Takes an element in the parent document.
//          Looks for rtseLocation for a path for any 'in reply to...' sections.
{
	var doc = aEvent.originalTarget.ownerDocument;
  var form = doc.forms.namedItem("post");
	var body = form.elements.namedItem("body");

  if (form.elements.namedItem("friendsOnly") &&
      form.elements.namedItem("friendsOnly").value == "1") {
    body.value = RTSE.editor.protectedJournalText + body.value;
  }

  body.value = RTSE.editor.convertExtraBB(body.value);

	var loc;
	if( doc.getElementById('rtseLocation') ) {
		loc = doc.getElementById('rtseLocation').value;
	} else {
		loc = doc.location.href.replace(/^https?:\/\/(www|sh|rvb|panics)\.roosterteeth\.com(.*)$/i,'$2');
		loc = loc.replace(/#[a-z0-9]+/i,''); // clears any anchors
	}
	loc = loc.replace(/&page=[0-9]+/i,''); // clears any currently set page
	var post,page;
	while( body.value.match(/\[i\]In reply to [a-zA-Z0-9_]{4,12}, #[0-9]+:\[\/i\]/i) ) {
		post = body.value.replace(/^[\s\S]*\[i\]In reply to [a-zA-Z0-9_]{4,12}, #([0-9]+):\[\/i\][\s\S]*/i,'$1');
		page = (loc=='')?'':'&page='+Math.ceil(post/30);
		body.value = body.value.replace(/\[i\]In reply to ([a-zA-Z0-9_]{4,12}), #([0-9]+):\[\/i\]/i,
		                                '[i]In reply to $1, [link='+loc+page+'#t$2][i]#$2[/i][/link]:[/i]');
	}
}

function RTSE_deconvertExtraBB(aDoc)
// EFFECTS: takes special BBcode from RTSE and converts it back to RT BBcode.  To preserve path's of 'in reply to...' text,
//          it will dump the location into a form field that convert will use.
{
	var form = aDoc.forms.namedItem('post');
	// converts to RTSE BB
	var body = form.elements.namedItem('body');
	if (!body) return;

  // Protected Journal text
  body.value = body.value.replace(RTSE.editor.protectedJournalText + "\n", "");

  // Smilies
  if (gRTSE.prefsGetBool('extensions.rtse.editor')) {
    body.value = RTSE.smilies.deconvert(body.value);
  }

	body.value = body.value.replace(/\[b\]Quoting ([a-zA-Z0-9_]{4,12}):\[\/b\]\[quote\]([\s\S]+)\[\/quote\]/g,'[quote=$1]$2[/quote]');

	// Numbers in forum
	if( body.value.match(/\[i\]In reply to [a-zA-Z0-9_]{4,12}, \[link=.*?#t[0-9]+\]\[i\]#[0-9]+\[\/i\]\[\/link\]:\[\/i\]/g) ) {
		// creating a form element to preserve the path
		var path = body.value.replace(/^[\s\S]*\[i\]In reply to ([a-zA-Z0-9_]{4,12}), \[link=(.*?)#t[0-9]+\]\[i\](#[0-9]+)\[\/i\]\[\/link\]:\[\/i\][\s\S]*$/i,
		                              '$2');
		var elm = aDoc.createElement('input');
		elm.value = path;
		elm.id = 'rtseLocation';
		elm.setAttribute('type','hidden');
		form.appendChild(elm);
				
		body.value = body.value.replace(/\[i\]In reply to ([a-zA-Z0-9_]{4,12}), \[link=.*?#t[0-9]+\]\[i\](#[0-9]+)\[\/i\]\[\/link\]:\[\/i\]/g,
		                                '[i]In reply to $1, $2:[/i]');
	}
}

function RTSE_HTMLtoBB(aText)
// EFFECTS: Converts site HTML to BBcode
{
	// Takes care of nesting problems due to In Reply to...
	aText = aText.replace(/<a href=".*?"><i>#([0-9]+)<\/i><\/a>/g,'#$1');

	aText = aText.replace(/<(b|i|u)>/g,'[$1]');
	aText = aText.replace(/<\/(b|i|u)>/g,'[/$1]');
	aText = aText.replace(/<del>/g,'[s]');
	aText = aText.replace(/<\/del>/g,'[/s]');
	aText = aText.replace(/<a href="([^" \t\n<>]+)" target="_blank">/g,'[link=$1]');
	aText = aText.replace(/<a href="(\/[^" \t\n<>]+)">/g,'[link=$1]');
	aText = aText.replace(/<\/a>/g,'[/link]');

	aText = aText.replace(/<img .*?src="\/(.*?)".*?>/g,'[img]http://www.roosterteeth.com/$1[/img]');
	aText = aText.replace(/<img.*? src="(.*?)".*?>/g,'[img]$1[/img]');
	aText = aText.replace(/<br><br><span class="small"(.*?)>(.*?)<\/span>/g,'');
	aText = aText.replace(/<blockquote(.*?)>(.*?)<\/blockquote>/g,'');
	aText = aText.replace(/\t/g,'');
	aText = aText.replace(/\n/g,'');
	aText = aText.replace(/<br>/g,'\n');

	// Sponsor stuff for colors (preserves if you are a sponsor
	if (gRTSE.prefsGetBool('extensions.rtse.sponsor')) {
		aText = aText.replace(/<span style="color: (.*?);">/g,'[color=$1]');
		aText = aText.replace(/<\/span>/g,'[/color]');
	} else {
		aText = aText.replace(/<span style="color:.*?">/g,'');
		aText = aText.replace(/<\/span>/g,'');
	}

	// HTML entities
	aText = aText.replace(/&amp;/g,'&');
	aText = aText.replace(/&lt;/g,'<');
	aText = aText.replace(/&gt;/g,'>');

	return aText;
}

function RTSE_addSearchPlugins(aDoc)
// EFFECTS: Adds the proper link tags for the search plugins
{
  var head = aDoc.getElementsByTagName("head")[0];
  var titles = ["RT User Search",
                "RT Forum Thread Search",
                "RT Forum Post Search"];
  var hrefs = ["http://files.shawnwilsher.com/projects/rtse/search/users.xml",
               "http://files.shawnwilsher.com/projects/rtse/search/threads.xml",
               "http://files.shawnwilsher.com/projects/rtse/search/posts.xml"];
  var link;
  for (var i = (titles.length - 1); i >= 0; --i) {
    link = aDoc.createElement("link");
    link.setAttribute("rel", "search");
    link.setAttribute("type", "application/opensearchdescription+xml");
    link.setAttribute("title", titles[i]);
    link.setAttribute("href", hrefs[i]);
    head.appendChild(link);
  }
}
