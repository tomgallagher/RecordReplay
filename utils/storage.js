//define nampespace for storage
var StorageUtils = {};

//open database connection using dexie and unlimited storage
StorageUtils.openModelObjectDatabaseConnection = function(caller) {
  
    return new Promise(resolve => {
        //give the database a name - if it has already been defined then this just returns the existing database
        var db = new Dexie("modelObjectDatabase");
        //set up the database with the required fields - this is where we add fields in a second version so we can update users' databases
        db.version(1).stores({
            projects: "++id,projectName,projectDescription,projectAuthor",
            tests: "++id,testName,testDescription,testAuthor,testProjectId,testProjectName,testStartUrl,testBandwidthValue,testBandwidthName,testLatencyValue,testLatencyName,testPerformanceTimings,testResourceLoads,testScreenshot"
        });
        //report that the database connection is open
        console.log(`${caller} has opened modelObjectDatabase Connection`);
        //then resolve with the open database connection
        resolve(db);
    });

};

//simple function to return all records count - this must be updated at same time as new tables are added
StorageUtils.getRecordsCount = function() {

    return new Promise(resolve => {

        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
        //then get all the records as a promise all, just projects at the moment
            .then(db => Promise.all( [ db.projects.count(), db.tests.count() ] ) )
            //then we return each of them as a value array
            .then(valuesArray => {
                const countResponse = {
                    //start with projects and zeros for undefined tables
                    projects: valuesArray[0],
                    tests: valuesArray[1],
                    recordings: 0,
                    replays: 0
                };
                resolve(countResponse);
            })
                
    });
};

//add a new model object to the database
StorageUtils.addModelObjectToDatabaseTable = function(caller, object, table) {

    return new Promise(resolve => {

        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, add the new object to the database, using the object shorthand to get the right database
            .then(db => db[table].add(object) )
            //then this will return an ID, which we can use to log the successful operation
            .then(id => {
                //helps us to keep track of which operations have been performed and when
                console.log(`Storage has saved new model object with id ${id} to table ${table} for ${caller}`);
                resolve();
            });
            
    });

};

//update an existing model object to the database
StorageUtils.updateModelObjectInDatabaseTable = function(caller, key, object, table) {

    return new Promise(resolve => {

        const checkedKey = StorageUtils.standardiseKey(key);
        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, update the existing object to the database, using the object shorthand to get the right database
            .then(db => db[table].update(checkedKey, object) )
            //then this will return the number of updated records (1 if an object was updated, otherwise 0).
            .then(updated => {
                //helps us to keep track of which operations have been performed and when
                if (updated) {
                    //report a good update using key, table and caller
                    console.log (`Storage has updated model object with id ${key} in table ${table} for ${caller}`);
                } else {
                    //report a failed update in case of problems
                    console.log (`Storage has performed no update - either no model object with id ${key} or no changes detected`);
                }
                //resolve in any case
                resolve();
            });
            
    });

};

//delete an existing model object from the database
StorageUtils.deleteModelObjectInDatabaseTable = function(caller, key, table) {

    return new Promise((resolve, reject) => {

        const checkedKey = StorageUtils.standardiseKey(key);
        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, update the existing object to the database, using the object shorthand to get the right database
            .then(db => db[table].delete(checkedKey) )
            //then this will return the number of updated records (1 if an object was updated, otherwise 0).
            .then(() => {
                //report a good delete using key, table and caller
                console.log (`Storage has deleted model object with id ${key} from ${table} table for ${caller}`);
                resolve();
            })
            //rejection happens if the provided key is not a valid key (not a Number, String, Date) or if the current transaction is readonly or inactive
            .catch(() => {
                //report a failed delete using key, table and caller
                console.log (`Storage has failed to delete model object with id ${key} from table ${table} for ${caller}`);
                reject();
            });
    });

};

//return an array of model objects from the database
StorageUtils.getAllObjectsInDatabaseTable = function(caller, table) {

    return new Promise(resolve => {

        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //then with the opened database connection, get all the objects in the table as an array
            .then(db => db[table].toArray() )
            //then this will return the number of updated records (1 if an object was updated, otherwise 0).
            .then(array => {
                //report a good delete using key, table and caller
                console.log (`Storage has found ${array.length} model objects in ${table} table for ${caller}`);
                resolve(array);
            });
            
    });

};

//return a single model object from the database
StorageUtils.getSingleObjectFromDatabaseTable = function(caller, key, table) {

    return new Promise((resolve, reject) => {

        const checkedKey = StorageUtils.standardiseKey(key);
        //open the database connection
        StorageUtils.openModelObjectDatabaseConnection("Storage")
            //retrieve the object
            .then(db => db[table].get(checkedKey) )
            //then resolve
            .then(object => resolve(object) )
            //If operation fails, returned promise will reject
            .catch(() => {
                //report a good delete using key, table and caller
                console.log (`Storage has failed to find model object with id ${key} from table ${table} for ${caller}`);
                reject();
            });
            
    });

};

//then we need a utility function to make sure that incoming keys are numbers, as required by the database, when we may be accessing them as strings from data properties
StorageUtils.standardiseKey = function(key) {

    //if the number is already an integer, as required by the database using auto-increment, then just return
    if (Number.isInteger(key)) { return key; }
    //otherwise we need to try to convert it
    else {
        //use the number function to attempt conversion
        const adjustedKey = Number(key);
        //then test that conversion has happened and return
        if (typeof adjustedKey == 'number' && adjustedKey % 1 === 0) { return adjustedKey }
        if (Number.isNaN(adjustedKey)) { throw `StorageUtils.standardiseKey: Incoming Key: ${typeof key} Adjusted Key: ${adjustedKey} is not a number!`; }
    }

}