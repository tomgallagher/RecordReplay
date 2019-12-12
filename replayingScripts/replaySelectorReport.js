class ReplaySelectorReport {

    constructor(options) {

        //we need to create a uniform class with the given selector, using inputs that we get from the EventRecorder
        this.selectorKey = options.key;
        this.selectorString = options.selectorString;
        this.targetHtmlElement = options.targetHtmlName;
        this.targetHtmlTag = options.targetHtmlTag;
        
        //then the class needs to provide log messages
        this.logMessages = [];
        //then the class needs to provide warning messages
        this.warningMessages = []; 

        //then we need to start performing our checks and adjusting the object as we go
        //see if we can find the selectedItem with document query
        this.selectedItem = document.querySelector(this.selectorString);
        //if the item is null, it cannot be found in the document
        if (this.selectedItem == null) {
            //so we need to report an invalid selector and return the object
            this.invalidSelector = true;
            //then give some feedback
            this.warningMessages.push(`${this.selectorKey} Selector Returned Null`);
            //this is an early exit as there's nothing more to do
            return this;
        }
        //if the item is not the same html element we need to return, unless we are dealing with the HTML document, as CSS selectors return constructor name as HTMLHtmlElement
        if (this.targetHtmlElement != "HTMLDocument" && this.selectedItem.constructor.name != this.targetHtmlElement) {
            //so the CSS selector has found an element but it does not match by constrcutor name
            this.invalidSelector = true;
            //then give some feedback
            this.warningMessages.push(`${this.selectorKey} Unmatched Constructor Name ${this.selectedItem.constructor.name}`);
            //this is an early exit as there's nothing more to do
            return this;
        }
        //if the item does not have the same tagname we need to return
        if (this.selectedItem.tagName != this.targetHtmlTag) {
            //so the CSS selector has found an element but it does not match by tag name
            this.invalidSelector = true;
            //then give some feedback
            this.warningMessages.push(`${this.selectorKey} Unmatched Tag Name ${this.selectedItem.tagName}`);
            //this is an early exit as there's nothing more to do
            return this;
        }

        //then if we pass all the checks, we want to get the xpath of the selected element, so we can check against the listener later
        this.xpath = this.getXpath(this.selectedItem);
        //so we have a good selector, lets just get the outerhtml so we can inspect reports
        this.selectedItem = this.selectedItem.constructor.name;

        //then we need to warn on multiple matches, as we can start to have problems with targeting
        this.selectedItems = [].slice.call(document.querySelectorAll(this.selectorString)).map(item => item.constructor.name);
        //we cannot afford to use a selector that generates multiple matches
        if (this.selectedItems.length > 1) {
            //so the CSS selector has found too many elements
            this.invalidSelector = true;
            //then give some feedback
            this.warningMessages.push(`${this.selectorKey} Multiple Selector Matches`);
            //this is an early exit as there's nothing more to do
            return this;
        }
        
        //then we report good finish
        this.logMessages.push(`${this.selectorKey} Found in Document`);

    }

    //function for defining xpath of element
    getXpath = element => {
        //get all the nodes in the document by tagname wildcard
        var allNodes = document.getElementsByTagName('*');
        //create the array to hold the different bits of the xpath, execute the code block if we have an element and the element is an element node, 
        //then jump up to parent when finished with each node   
        for (var segs = []; element && element.nodeType == 1; element = element.parentNode) {
            //check to see if the element has an id because this is then going to be fast
            if (element.hasAttribute('id')) {
                //set the marker for whether the id is unique in the page
                var uniqueIdCount = 0;
                //search through all the nodes 
                for (var n=0; n < allNodes.length; n++) {
                    //if we have a duplicate id, this is not going to work so bump the marker
                    if (allNodes[n].hasAttribute('id') && allNodes[n].id == element.id) uniqueIdCount++;
                    //then if we do not have a unique id we break out of the loop
                    if (uniqueIdCount > 1) break;
                }
                //the marker holds the value
                if (uniqueIdCount == 1) {
                    //if we only have one element with that id we can create the xpath now so we push the start path and then id into the array at the beginning
                    segs.unshift("//*[@id='" + element.getAttribute('id') + "']");
                    //then we're done and we send it back to the caller
                    return segs.join('/');
                } else {
                    //otherwise we save the tagname and the id and continue on as we are going to need more qualifiers for a unqiue xpath
                    segs.unshift(element.localName.toLowerCase() + '[@id="' + element.getAttribute('id') + '"]');
                }
            } else {
                //with no id, we need to do something different
                //we need to identify its place amongst siblings - is it the first list item or the third
                for (var i = 1, sib = element.previousSibling; sib; sib = sib.previousSibling) {
                    //this counts back until we have no previous sibling
                    if (sib.localName == element.localName)  i++; 
                }
                //just push the local name into the array along with the position
                segs.unshift(element.localName.toLowerCase() + '[' + i + ']');
            }
         }
         //then once we've worked our way up to an element with id or we are at the element with no parentNode - the html - we return all the strings joined with a backslash
         return segs.length ? '/' + segs.join('/') : null;
    }

}