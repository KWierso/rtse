// Evaluate an XPath expression aExpression against a given DOM node
// or Document object (aNode), returning the results as an array
// thanks wanderingstan at morethanwarm dot mail dot com for the
// initial work.
function RTSE_evaluateXPath(aNode, aExpr) {
  var xpe = new XPathEvaluator();
  var nsResolver = xpe.createNSResolver(aNode.ownerDocument == null ?
    aNode.documentElement : aNode.ownerDocument.documentElement);
  var result = xpe.evaluate(aExpr, aNode, nsResolver, 0, null);
  var found = [];
  var res;
  while (res = result.iterateNext())
    found.push(res);
  return found;
}

function RTSE_editor() {}
RTSE_editor.prototype = {
  /////////////////////////////////////////////////////////////////////////////
  //// Local Data
  mBody: "",
  mTitle: "",
  mFO: false,
  mTo: "",
  mVisible: false,

  /////////////////////////////////////////////////////////////////////////////
  //// Attributes

 /**
  * Gets the text of the body
  * @return The text of the body of the content
  */
  get body()
  {
    return this.mBody;
  },
 /**
  * Sets the text of the body
  * @param aVal The new string value to be stored
  * @return The value that is now stored
  */
  set body(aVal)
  {
    this.mBody = aVal;
    return this.mBody;
  },

 /**
  * Gets the text of the title
  * @return The text of the title of the content
  */
  get title()
  {
    return this.mTitle;
  },
 /**
  * Sets the text of the title
  * @param aVal The new string value to be stored
  * @return The value that is now stored
  */
  set title(aVal)
  {
    this.mTitle = aVal;
    return this.mTitle;
  },

 /**
  * Gets the text of the to field
  * @return The text of the to field
  */
  get to()
  {
    return this.mTo;
  },
 /**
  * Sets the text of the to field
  * @param aVal The new string value to be stored
  * @return The value that is now stored
  */
  set to(aVal)
  {
    this.mTo = aVal;
    return this.mTo;
  },

 /**
  * Gets the value of the friends only field
  * @return The text of the to field
  */
  get friendsOnly()
  {
    return this.mFO;
  },
 /**
  * Sets the value of the friends only field
  * @param aVal The new boolean value to be stored
  * @return The value that is now stored
  */
  set friendsOnly(aVal)
  {
    this.mFO = aVal;
    return this.mFO;
  },

 /**
  * Whether or not the editor should be visible
  * @return A boolean value of the visibility of the editor
  */
  get visible()
  {
    return this.mVisible;
  },
 /**
  * Sets whether or not the editor should be visible
  * @param aVal The new value to be stored
  * @return A boolean value of the visibility of the editor
  */
  set visible(aVal)
  {
    this.mVisible = aVal;
    return this.mVisible;
  }
};
// Adding the editor to the standard HTML Document
HTMLDocument.prototype.editor = {};
