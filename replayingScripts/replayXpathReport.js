class ReplayXpathReport {

    constructor(options) {

        //we need to create a uniform class with the given selector, using inputs that we get from the EventRecorder
        //the first three are the same as for the CSS selector report
        this.selectorKey = options.key;
        this.targetHtmlElement = options.targetHtmlName;
        this.targetHtmlTag = options.targetHtmlTag;
        //we need a different string here to pass into the xpath function
        this.xpathString = options.xpathString;
        //we can just set the xpath to the incoming xpath string, to make it uniform with the css selector
        this.xpath = options.xpathString;

        //NOTE THAT WE HAVE TO GENERATE OWN OWN CSS SELECTOR IF WE FIND A GOOD ELEMENT
        
        //then the class needs to provide log messages
        this.logMessages = [];
        //then the class needs to provide warning messages
        this.warningMessages = [];

        //then we need to start performing our checks and adjusting the object as we go
        //see if we can find the selectedItem with document evaluate, which searches the document for all elements matching the string  
        //note that document.evaluate does not return an element but an unordered node iterator. */
        const nodeIterator = document.evaluate(this.xpathString, document, null, XPathResult.ANY_TYPE, null);
        //we then need to select the first element from the iterator
        this.selectedItem = nodeIterator.iterateNext();
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
            this.warningMessages.push(`${this.selectorKey} Unmatched Constructor Name: ${this.selectedItem.constructor.name}`);
            //this is an early exit as there's nothing more to do
            return this;
        }
        //if the item does not have the same tagname we need to return
        if (this.selectedItem.tagName != this.targetHtmlTag) {
            //so the CSS selector has found an element but it does not match by tag name
            this.invalidSelector = true;
            //then give some feedback
            this.warningMessages.push(`${this.selectorKey} Unmatched Tag Name: ${this.selectedItem.tagName}`);
            //this is an early exit as there's nothing more to do
            return this;
        }

        //then we need to generate the CSS selector string that will be used by the type replayers
        this.selectorString = this.getCSSPath(this.selectedItem);
        //so we have a good xpath, lets just get the constructor name so we can inspect reports
        this.selectedItem = this.selectedItem.constructor.name;
        
        //then we report good finish
        this.logMessages.push(`${this.selectorKey} Found in Document`);

    }

    //function for defining css path of element
    getCSSPath = element => {
        //set up the array to hold each step up the tree
        var names = [];
        //while the element has a parent node, i.e. we are not at the root, keep adding to the array
		while (element.parentNode) {
            //if the element has an id then we may be able to stop
			if (element.id) {
                //see if the id is unique in the page
                if (document.querySelectorAll(`#${element.id}`).length == 1) {
                    //then we have a unique id and we can stop
				    names.unshift(`#${element.id}`);
                    break;
                } else {
                    //we have a naughty double id and we need to add the nth child and continue
                    //we do not need to worry about nthchild selectors for document and body elements
                    if (element === element.ownerDocument.documentElement || element === element.ownerDocument.body) {
                        //just push the tag into the array
                        names.unshift(element.tagName);
                    } else {
                        //we see how many previous siblings there are to work out the nthchild index
                        for (var c = 1, e = element; e.previousElementSibling; e = e.previousElementSibling, c++) {}
                        //push the nthchild selector into the array
                        names.unshift(element.tagName + ':nth-child(' + c + ')');
                    }
                    //then continue
                    element = element.parentNode;
                }
			} else {
                //we do not need to worry about nthchild selectors for document and body elements
				if (element === element.ownerDocument.documentElement || element === element.ownerDocument.body) {
                    //just push the tag into the array
					names.unshift(element.tagName);
				} else {
                    //we see how many previous siblings there are to work out the nthchild index
                    for (var c = 1, e = element; e.previousElementSibling; e = e.previousElementSibling, c++) {}
                    //push the nthchild selector into the array
					names.unshift(element.tagName + ':nth-child(' + c + ')');
                }
                //then continue
				element = element.parentNode;
			}
		}
		return names.join(' > ');

    }


}

