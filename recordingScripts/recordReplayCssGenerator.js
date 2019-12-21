/*
    The reasons for writing this:
    1. All the other selector generators use ids as a shortcut - this will cause failure when dynamic ids change on page refresh
    2. The other selector generators do not place attributes, and especially data attributes, high up in order of importance
    3. This makes no sense as attributes, especially data attributes, are often the most unique things in the DOM
    4. The performance of this function matches or exceeds the performance of the others

*/

(function() {
    
    window.recordReplayCssGenerator = (element) => {

        //to generate a CSS path we only need to check html elements
        if (!(element instanceof HTMLElement)) return;
        //set up the variables we need to process the walk up the DOM tree
        //we need a variable to hold the base node descriptor 
        var baseNodeDescriptor;
        //we need a list of common attributes that we want to check
        var attributesArray = ['name', 'value', 'title', 'placeholder', 'data-*'];
        //then we need an array to push into to create the selector
        var selectedArray = [];
        //engine function to call on each iteration step up the dom tree
        getSelector = function(currentElement) {
            //start by putting the element's node name into the array at the front and saving the current node name
            //this will remain the default selector if no classes or attributes are found
            selectedArray.unshift(baseNodeDescriptor = currentElement.nodeName.toLowerCase());
            //then see if we can add specificity with the className, if present
            if (currentElement.className) {
                //if there is a class name then we change the first item in the array to reflect the class, if many classes separated by spaces then we join with dots as per spec
                selectedArray[0] = baseNodeDescriptor += '.' + currentElement.className.trim().replace(/ +/g, '.');
                //then we test to see if that gives us a unique value and, if so, we return true - we're done
                if (uniqueQuery()) return true;
            }
            //then we see if we can add specificity with attributes, if present, by looping through our attributes array
            for (let i = 0; i < attributesArray.length; ++i) {
                //work with the data attributes first
                if (attributesArray[i] === 'data-*') {
                    // Build array of data attributes
                    var dataAttributesArray = Array.prototype.slice.call(currentElement.attributes).filter(attr => attr.name.indexOf('data-') === 0);
                    //then nested loop to add each attribute to the element and test for uniqueness
                    for (let j = 0; j < dataAttributesArray.length; ++j) {
                        //if there is a data attribute then we change the first item in the array to reflect the attribute
                        selectedArray[0] = baseNodeDescriptor += `[${dataAttributesArray[j].name}="${dataAttributesArray[j].value}"]`;
                        //then we test to see if that gives us a unique value and, if so, we return true - we're done
                        if (uniqueQuery()) return true;
                    }
                //then we work we the other attributes if the element has them
                } else if (currentElement.hasAttribute(attributesArray[i])) {
                    //again we add the attribute to the array 
                    selectedArray[0] = baseNodeDescriptor += `[${attributesArray[i]}="${currentElement.getAttribute(attributesArray[i])}"]`;
                    //then we test to see if that gives us a unique value and, if so, we return true - we're done
                    if (uniqueQuery()) return true;
                }
            }
            
            //then if we get here we are on the fallback for generic elements, first using nth-of-type
            //we need to start the loop looking for siblings of the same type, with our element first
            var elementChild = currentElement;
            //and we need a counter for position nth-of-type
            var count = 1;
            //then we loop back and add to the count for nth-of-type where we have matching node
            while (elementChild = elementChild.previousElementSibling) { if (elementChild.nodeName === currentElement.nodeName) ++count; }
            //then we add that to the array
            selectedArray[0] = `${baseNodeDescriptor}:nth-of-type(${count})`;
            //then we test
            if (uniqueQuery()) return true;

            //last option is to use nth-child, so we reset the element child and the count
            elementChild = currentElement;
            count = 1;
            while (elementChild = elementChild.previousElementSibling) { ++count; }
            //then we add that to the array
            selectedArray[0] = (count === 1 ? `${baseNodeDescriptor}:first-child` : `${baseNodeDescriptor}:nth-child(${count})`)
            //then we test
            if (uniqueQuery()) return true;

            //at each stage in the process we need to know if we have a unique query
            function uniqueQuery() {
                //so we make quite an expensive call to query selector all with our current array and see if we get just the one match - unique if so
                return document.querySelectorAll(selectedArray.join('>') || null).length === 1;
            };

        }

        // Walk up the DOM tree to compile a unique selector
        while (element.parentNode) {
            //if we get a unique true returned, we can return the array
            if (getSelector(element)) return selectedArray.join(' > ');
            element = element.parentNode;
        }

    }

}());