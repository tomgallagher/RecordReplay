class DomSelectorReport {

    constructor(options) {

        //the use of the anonymous async function in constructor enables us to set up the tab runner with any callback functions and receive responses
        //see https://stackoverflow.com/questions/43431550/async-await-class-constructor

        return (async () => {

            //we need to create a uniform class with the given selector, using inputs that we get from the EventRecorder
            this.selectorKey = options.key;
            this.selectorString = options.selectorString;
            this.targetHtmlTag = options.targetHtmlTag;
            this.browserTabId = options.browserTabId;
            
            //then the class needs to provide log messages
            this.logMessages = [];
            //then the class needs to provide warning messages
            this.warningMessages = [];
            //and the class needs to save a reference to the chosen selector's found element node id
            this.nodeId - null;

            //we need to get the document, so we can use the document node id for query selector and query selector all
            const doc = await new Promise(res => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "DOM.getDocument", {depth: -1, pierce: true}, node => res(node) ) );
            
            //then we need to start performing our checks and adjusting the object as we go
            //then we need to get the node id of the matching node for our selector
            this.nodeId = await new Promise(res => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "DOM.querySelector", { nodeId: doc.nodeId, selector: this.selectorString}, nodeId => res(nodeId) ) );
            //if we have query selector return null, it cannot be found in the document
            if (this.nodeId == null) {
                //so we need to report an invalid selector and return the object
                this.invalidSelector = true;
                //then give some feedback
                this.warningMessages.push(`${this.selectorKey} Selector Returned Null`);
                //this is an early exit as there's nothing more to do
                return this;
            }

            //assuming we have found a good node id, then we need to get the node itself, using the node id
            const targetNode = await new Promise(res => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "DOM.describeNode", { nodeId: this.nodeId, depth: -1, pierce: true }, node => res(node) ) );
            //if the item does not have the same tag name we need to return
            if (targetNode.nodeName != this.targetHtmlTag) {
                //so the CSS selector has found an element but it does not match by tag name
                this.invalidSelector = true;
                //then give some feedback
                this.warningMessages.push(`${this.selectorKey} Unmatched Tag Name ${this.selectedItem.tagName}`);
                //this is an early exit as there's nothing more to do
                return this;
            }

            //then we need to warn on multiple matches, as we can start to have problems with targeting
            const matches = await new Promise(res => chrome.debugger.sendCommand({ tabId: this.browserTabId }, "DOM.querySelectorAll", { nodeId: doc.nodeId, selector: this.selectorString}, array => res(array) ) );
            //we cannot afford to use a selector that generates multiple matches
            if (matches > 1) {
                //so the CSS selector has found too many elements
                this.invalidSelector = true;
                //then give some feedback
                this.warningMessages.push(`${this.selectorKey} Multiple Selector Matches`);
                //this is an early exit as there's nothing more to do
                return this;
            }

            //then we report good finish
            this.logMessages.push(`${this.selectorKey} Found in Document`);
            //and we're done - always remember to return this to the constructor in an async function or the whole thing is pointless
            return this; 

        })();

    }

}