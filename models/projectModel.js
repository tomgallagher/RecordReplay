class Project {

    //pass in an options object with the values we are looking for
    constructor(options) {
  
        // set default values for the project class - these should be matched by the storage class
        const defaults = {
            projectName: 'N/A',
            projectDescription: 'N/A',
            projectAuthor: 'N/A',
            projectCreated: Date.now()
        };      
        
        // create a new object with the defaults over-ridden by the options passed in
        let opts = Object.assign({}, defaults, options);
  
        // assign options to instance data (using only property names contained in defaults object to avoid copying properties we don't want)
        Object.keys(defaults).forEach(prop => { this[prop] = opts[prop]; });
    }
  
}