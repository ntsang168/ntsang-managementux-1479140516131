/**********************************************************************
*
* get-config.js
* 
*   A Node module fetch configuration data and secure credentials
*   for born-on-cloud applications.
*   
*   Pass me in the name of a configuration file - which is to say, 
*   the document id of a document in the configuration database, 
*   and I'll fetch it from first-response.cloudant.com/configuration
*   
*   returns the content of the configuration file as an object
*   
*   usage:
*   
*   var config = require(get-config)("config_file_name", callback);
*
**********************************************************************/

var script_version = "2.0";
var script_author = "mmccawley@us.ibm.com";
var script_date = "2015-01-16";

/**
 * getting two variables from the environment telling me how to behave
 * 
 * if fr_role == TEST then execute test cases and only output will be 
 * asserting TESTNAME: PASS or FAIL
 * 
 * DEV, STAGE and PROD might change some fundamentals, such as where 
 * to get data sources and where to log output and if alarms should be
 * sent to admins.
 *  
 */ 

var debug   = false;   // TRUE, FALSE, undefined
var fr_role = process.env.FR_ROLE;         // DEV, TEST, STAGE, PROD, undefined

// load the npm modules and libraries we are going to need
var request = require('request');

/** 
 * this is the only module that logs to console.  (can't very well 
 * log to cloudant until after we connect to it successfully.)
 */

if (debug) console.log("get-config.js " + script_version + " has started.");
if (debug) console.log("Debug Mode enabled.");

module.exports = function(config_file, callback) {
    
    /********************************************************************* 
    * The format for the contents will be as follows:
    * 
    * CLOUDANT_R will contain a json payload that will be parsed into
    * 	cloudant.host        e.g. first-response.cloudant.com
    *   cloudant.password    e.g. 7aCD3Cq1qFp5QA5TDLO2sRXMqFp5QqFp5
    *   cloudant.username    e.g. fredbarneywilmabettypebblesbambam
    *   cloudant.db          e.g. configuration
    *
    * The CLOUDANT_R will contain +read permissions
    * similarly CLOUDANT_W will contain +write, 
    * CLOUDANT_RW will contain +read+write
    * 
    * There will be a CLOUDANT_ADMIN set, but that will be withheld from 
    * the Softlayer instances.  ADMIN is to be used creating, destroying, 
    * replicating, indexing, or modifying permissions on the database level.
    *
    **********************************************************************/
    
    var cloudant_r = process.env.CLOUDANT_R;
    var config = {};
    
    if (cloudant_r) {
    	try {
    		
    	
    	config = JSON.parse(cloudant_r);
    	config = config.cloudant;
    	}
    
	    catch (e) {
	    	console.log(e)
	    }
    } else {
    	if (debug) console.log("process.env.CLOUDANT_R contains garbage. :" + cloudant_r); 
    	return;
    }
    
    if (debug) console.log("parsed the creds as : ", config);
    
    /**********************************************************************
    *
    * Use the Cloudant node.js library rather than bare requests
    *
    **********************************************************************/
    
    // compose the url from the components
    config.url = "https://" + config.username 
                            + ":" + config.password 
                            + "@" + config.host;
    
    if (debug) console.log("cloudant.url = ", config.url);
    
    // initialize the Cloudant library
    var cloudant = require('cloudant')(config);
    var db = cloudant.db.use(config.db);

    db.get(config_file, null, function(err, body) {
	if (!err) {
	    if (debug) console.log("The json to return is = ", body);
	    
	    callback(body);
	    
	} else {
	    console.log("Whine!  Couldn't GET " + config_file + " and here's why:\n" + err);  
	}  
    });
    
    
};

// all done.

