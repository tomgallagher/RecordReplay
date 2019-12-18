class NodeBuilder {

    constructor(options) {

        //we only show the assert checkboxes on replay
        this.isReplay = options.isReplay;
        //then for replay checkboxes we need the id
        this.eventId = options.eventId;
        //then we need to define assertion types here
        this.isVisible = "Visible";
        this.isTextAssertion = "Text Content";
        this.isAttributePresentAssertion = "Present";
        this.hasAttributeContentAssertion = "Content";
        //then we need to only set the element parent if we are seeking to assert on nested elements
        this.nestedLevel = 0;
        //then we need a representation of each building block in the list, starting with the list item
        this.item = document.createElement('div');
        this.item.className = 'item';
        //then the icon item, we add the classes later depending on the type of node
        this.icon = document.createElement('i');
        this.icon.className = 'icon';
        //then the content item
        this.content = document.createElement('div');
        this.content.className = 'content';
        //then the header item
        this.header = document.createElement('div');
        this.header.className = 'header';
        //then the description item
        this.description = document.createElement('div');
        this.description.className = 'description';
        //then the sub-list item
        this.subList = document.createElement('div');
        this.subList.className = 'childnodes list';
        //then the checkbox holder item
        this.checkBox = document.createElement('div');
        this.checkBox.className = 'ui assertion checkbox';
        this.checkBox.style.marginLeft = "margin-left: 5px;";
        //then the checkbox input and label items
        this.checkBoxInput = document.createElement('input');
        this.checkBoxInput.setAttribute('type', 'checkbox');
        this.checkBoxInput.setAttribute('name', 'assertion');
        this.checkBoxLabel = document.createElement('label');

    }

    buildCheckBox = (assertionType, assertionAttribute, assertionAttributeValue, attributeElementParent) => {

        //get a copy of the checkbox
        let checkbox = this.checkBox.cloneNode();
        //then get a copy of the input
        let input = this.checkBoxInput.cloneNode();
        //we need to retrieve these values from the checkbox checks
        //the assertion type tells us if we are asserting Present, Content or Text
        input.setAttribute("data-assertion-type", `${assertionType}`);
        //the assertion attribute gives us the attribute we are looking to assert on
        input.setAttribute("data-assertion-attribute", assertionAttribute);
        //the assertion attribute value gives is the attibute value we are looking to assert on
        input.setAttribute("data-assertion-attribute-value", assertionAttributeValue);
        //the parent gives us the parent we will need to look for when performing assertions, it should be "ROOT" when no nesting
        this.nestedLevel == 0 ? attributeElementParent = "ROOT" : null;
        input.setAttribute("data-assertion-element-parent", attributeElementParent);
        //this reports the nested level
        input.setAttribute("data-assertion-element-nested-level", this.nestedLevel);
        //this reports the replay event id
        input.setAttribute("data-assertion-recording-event-id", this.eventId);
        //then attach
        checkbox.appendChild(input);
        //then the label
        let checkBoxlabel = this.checkBoxLabel.cloneNode();
        //so this should be either 'Present' or 'Content' 
        checkBoxlabel.textContent = `Assert ${assertionType}`;
        //then attach  label to checkbox as well
        checkbox.appendChild(checkBoxlabel);
        //then return it
        return checkbox;

    }

    build = (jsonObject) => {
        
        //THE AIMS HERE ARE TO:
        // 1) Recreate the json representation of the DOM node in visual form that make it easy for the user to select the attributes that need to be asserted
        // 2) Find a way of identifying the exact element within the DOM node with the attributes that need to be asserted IN EXTERNAL VERIFICATION

        //set up the node variable that acts as a starting point, and the node type as well
        var visualNode, icon, content, header, nodeType = jsonObject.nodeType;
        //then each item in the json object has been allocated a node type, we are only really interested in element nodes and text nodes
        switch (nodeType) {
            //ELEMENT_NODE
            case 1:
                //VISUAL REPRESENTATION
                //each element node is a list item, with a tag name as a header and and icon indicating that it's an element node 
                visualNode = this.item.cloneNode();
                //first we clone the icon from the constructor
                icon = this.icon.cloneNode();
                //then we add the specific type of icon
                icon.classList.add('file', 'code', 'outline');
                //then we append that icon to the parent item
                visualNode.appendChild(icon);
                //then we create a container for content
                content = this.content.cloneNode();
                //then append the content to the node
                visualNode.appendChild(content);
                //then we create the header for the content
                header = this.header.cloneNode();
                //then we customize the header
                header.textContent = jsonObject.tagName.toUpperCase();
                //then we want to allow visibility assertion on all nodes and text assertion on elements with text child nodes
                if (this.isReplay) {
                    //we need to know if there's an attribute element parent, which will allow us to search for nested elements
                    let attributeParentNode = jsonObject.tagName.toUpperCase();
                    //visibility first
                    header.appendChild(this.buildCheckBox(this.isVisible, "Display", "N/A", attributeParentNode))
                    //check to see if the elments has child nodes and if any of those child nodes are text nodes
                    if (jsonObject.childNodes.length > 0 && jsonObject.childNodes.some(node => node.nodeType == 3)) {
                        //then we concatenate the textContent of all the child nodes
                        let textValue = jsonObject.childNodes.filter(node => node.nodeType == 3).reduce((acc, node) => { return acc + node.nodeValue; }, '');
                        //append the return value of the checkbox builder
                        //we always need to have the attribute and the attribute value for assertions
                        header.appendChild(this.buildCheckBox(this.isTextAssertion, "Text", textValue, attributeParentNode))
                    }
                }
                //then we append the header to the content
                content.appendChild(header);
                //then we create the list for holding attributes
                let attributeList = this.subList.cloneNode();
                //then we identify the list as the attributes list
                attributeList.classList.add('attributes');
                //then we append the attributes list to the content
                content.appendChild(attributeList);
                //then we need to work each of the attributes, starting with the json objects array or empty
                let attributes = jsonObject.attributes || [];
                //loop through each of the attributes
                for (let i = 0, len = attributes.length; i < len; i++) {
                    //create an item for each attribute
                    let item = this.item.cloneNode();
                    //append the item to the attributes list
                    attributeList.appendChild(item)
                    //first we clone the icon from the constructor
                    let icon = this.icon.cloneNode();
                    //then we add the specific type of icon
                    icon.classList.add('angle', 'right');
                    //then we append that icon to the parent item
                    item.appendChild(icon);
                    //create content container for each attribute
                    let content = this.content.cloneNode();
                    //append the content to the item
                    item.appendChild(content);
                    //then get the attribute
                    let attribute = attributes[i];
                    //then create a title
                    let title = this.header.cloneNode();
                    //then get the attribute name
                    let attributeName = attribute[0];
                    //then set the content of the title as the attribute name
                    title.textContent = attributeName;
                    //then we allow a checkbox on the attribute being present
                    if (this.isReplay) {
                        //we need to know if there's an attribute element parent, which will allow us to search for nested elements
                        let attributeParentNode = jsonObject.tagName.toUpperCase();
                        //append the return value of the checkbox builder
                        //we always need to have the attribute and the attribute value for assertions
                        title.appendChild(this.buildCheckBox(this.isAttributePresentAssertion, attributeName, "N/A", attributeParentNode))
                    }
                    //then append that to the content
                    content.appendChild(title);
                    //then create the description
                    let description = this.description.cloneNode();
                    //then get the attribute value
                    let attributeValue = attribute[1];
                    //then set the content of the description as the attribute value
                    description.textContent = attributeValue.length > 75 ? `${attributeValue.slice(0, 75)} ...` : attributeValue;
                    //IF DISPLAY IS REPLAY, APPEND INLINE CHECK BOXES TO DESCRIPTION FOR ASSERTIONS OF ATTRIBUTES
                    if (this.isReplay) {
                        //we need to know if there's an attribute element parent, which will allow us to search for nested elements
                        let attributeParentNode = jsonObject.tagName.toUpperCase();
                        //append the return value of the checkbox builder
                        //we always need to have the attribute and the attribute value for assertions
                        description.appendChild(this.buildCheckBox(this.hasAttributeContentAssertion, attributeName, attributeValue, attributeParentNode))
                    }
                    //then append the description
                    content.appendChild(description);
                }
                //AND WE@RE DONE
                break;
            //TEXT_NODE
            case 3:
                //VISUAL REPRESENTATION
                //each text node is a list item, with 'TEXT' as a header and and icon indicating that it's a text node 
                visualNode = this.item.cloneNode();
                //first we clone the icon from the constructor
                icon = this.icon.cloneNode();
                //then we add the specific type of icon
                icon.classList.add('file', 'alternate', 'outline');
                //then we append that icon to the parent item
                visualNode.appendChild(icon);
                //then we create a container for content
                content = this.content.cloneNode();
                //then append the content to the node
                visualNode.appendChild(content);
                //then we create the header for the content
                header = this.header.cloneNode();
                //then we customize the header
                header.textContent = "TEXT";
                //then we append the header to the content
                content.appendChild(header);
                //then we create a decription for the text
                let description = this.description.cloneNode();
                //then we set the description equal to the text node's value
                description.textContent = jsonObject.nodeValue.length > 75 ? `${jsonObject.nodeValue.slice(0, 75)} ...` : jsonObject.nodeValue; ;
                //then we attach the text description to the content
                content.appendChild(description);
                //AND WE@RE DONE
                break;
            //THEN WE JUST IGNORE THE REST FOR THE TIME BEING
            case 8: //COMMENT_NODE
            case 9: //DOCUMENT_NODE
            case 10: //DOCUMENT_TYPE_NODE
            case 11: //DOCUMENT_FRAGMENT_NODE
            default:
                //JUST LOG
                console.log(`NodeBuilder: Skipping Node Type ${nodeType}`);
        }
        
        //then we need to work our way down the list of child nodes, doing the same thing recursively
        //WE ONLY FOLLOW RECURSION IF THE NODE IS AN ELEMENT NODE
        if (nodeType == 1) {
            //see if we have any childnodes or empty
            var childNodes = jsonObject.childNodes || [];
            //create the reference to the sublist
            var subList;
            //if the node has any children we need to create a child list
            if (jsonObject.childNodes.length > 0) {
                //find the last content node in the list
                let allContentNodes = visualNode.querySelectorAll('.content');
                //then get the last one so we can append a sublist
                let lastContentNode = allContentNodes[allContentNodes.length -1];
                //then create the sub list and add it to the last content node
                subList = this.subList.cloneNode();
                //mark it as an elements sublist
                subList.classList.add('elements');
                //then add the sublist to the last content node
                lastContentNode.appendChild(subList);
                //then mark the nested level as incremented
                this.nestedLevel++;
            }
            //then for each of the childnodes we loop through
            for (let i = 0, len = childNodes.length; i < len; i++) {
                //VISUAL REPRESENTATION
                //and if we find a child node we need to go through the same process, adding the childnodes to the sublist
                subList.appendChild(this.build(childNodes[i]));
            }
        }
        //then just return the node 
        return visualNode;

    }

}