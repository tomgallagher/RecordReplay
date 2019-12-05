

/*

//so we have an incoming set of events that need to be actioned and verified

//USER EVENTS

For User Events, we need to do several things

1: First check that the target element is on the page, some kind of fail if none, then assess the performance of the selectors if one or more
2: Simulate the event on the element, we know the element is on the page, what return value can we get from here?
3: Listen to the simulated event being reflected back, this is final confirmation that the replay has worked as intended

1 Checking the target element is on the page

For all three CSS selectors we can use:

we can use document.querySelector, which returns the first element to match the selector or null
we can use document.querySelectorAll, which returns an array-like structure with 0 to many elements in it

We can then evaluate the performance of the selectors, we should get an element and an array with one element if the selector is doing its job properly
If we get more than one element in array then this should be a WARNING

we can use xpath document.evaluate(
  xpathExpression, a string representing the XPath to be evaluated
  contextNode, It's common to pass document as the context node
  namespaceResolver, null is common for HTML documents or when no namespace prefixes are used.
  resultType, Use named constant properties, such as XPathResult.ANY_TYPE
  result result is an existing XPathResult to use for the results. null is the most common and will create a new XPathResult
);

to FIND elements = although it's hard to see how this will succeed when others fail. We could have changing classes, which would cause a fail
If so, then we need to emit a WARNING, if the matching HTMLElement and tag succeed

We can then check that the target element is matching in terms of HTMLElement and tag, information that we have from the event, make sure we choose the right method regarding uppercase etc

We then save the xpath of the element for matching with playback

2 Simulate the event on the element

Use the standard dispatchEvent method for most of the replays

3 Listen to Playback

Here we cannot rely on the CSS selector being the same as the target can mutate after clicks. 
We can do what the event handler does and get the pre-click selector
Or we can check the xpath of the selected element and then the xpath of the event element and compare the two - this is better as it confirms the equality of position in the document
Port the xpath function from eventRecorder


//USER ASSERTIONS

Just need to do a search as in Step 1 of User Events

Then we need to check either

1) PRESENT: Has attribute
2) CONTENT: Has Attribute, Get attribute
3) TEXT CONTENT: Has text childnodes, get textContent

*/

