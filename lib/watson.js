/**
 * Management UX Watson Library. Provides services managed by Watson team that can be consumed by other clients like ICSW.
 * @module lib/watson
 */

var env = { mode: "DEV", debug: true };
if (process.env.FR_ROLE) {
	env.mode = (process.env.FR_ROLE).toUpperCase();
}
if (process.env.FR_DEBUG_MODE) {
	env.debug = (process.env.FR_DEBUG_MODE === "true");
}


var dbConfig;
var mappingDocId = "watson-url-type-regex-mapping-test";
if ( "PROD" === env.mode) {	
	mappingDocId = "watson-url-type-regex-mapping";
}

/** Initialize Cloudant DB connections */
function initDBConnection() {
	var dbCredentialsConfig = {};
	var cloudantConfig;
	if (process.env.CLOUDANT_R) {
		var cloudantR = JSON.parse(process.env.CLOUDANT_R);
		if(cloudantR) {
			dbCredentialsConfig.host = cloudantR.cloudant.host;
			dbCredentialsConfig.user = cloudantR.cloudant.username;
			dbCredentialsConfig.password = cloudantR.cloudant.password;
			dbCredentialsConfig.dbName = cloudantR.cloudant.db;
			dbCredentialsConfig.url = "https://" + dbCredentialsConfig.user + ":" + dbCredentialsConfig.password + "@" + dbCredentialsConfig.host;
			dbCredentialsConfig.propFile = cloudantR.cloudant.prop_file;
		}
	} else {
		console.error("CLOUDANT_R environment var is not set. It needs to have credentials to the configuration DB.");
		console.error("export CLOUDANT_R=\"{\"cloudant\":{\"db\":\"databasename\",\"username\":\"username\",\"password\":\"password\",\"host\":\"hostname\",\"prop_file\":\"docid\"}}\"");
	}
	cloudantConfig = require('cloudant')(dbCredentialsConfig.url);
	dbConfig = cloudantConfig.use(dbCredentialsConfig.dbName);
	
}


initDBConnection();

/**
 * Reads the data from the database to pull the type to regex mapping for urls.
 * @param cb - callback
 */
function readDataFromDB(cb) {
		
	dbConfig.get(mappingDocId, function(err, doc) {
		if (err) return cb(err);
		try {
			cb(null, doc)
		} catch(e) {
			cb(e);
		}
	});
}

module.exports = {

/**
 * REST API callback
 * @callback apiCallback
 * @param {Object} err - error
 * @param {Object} data - JSON data result
 */

	/**
	 * Get a mapping of doc type to url regex patterns to be able to classify urls and normalize them
	 * as appropriate.
	 * @param params - request object params e.g. req.params
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON containing the doct type to url regex patterns mapping.
	 * 
	 */
	getUrlsPatterns: function(params, cb) {
		// FIXME add validation
		try {		
			readDataFromDB( function(err, data){
				if (err) return cb(err);
				
				cb(null, data);
						
			});
		} catch(e) {
			cb(e);
		}
	}
	
}