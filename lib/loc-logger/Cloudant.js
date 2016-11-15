var cloudant;
var debug   = process.env.FR_DEBUG_MODE;   // TRUE, FALSE, undefined
var fr_role = process.env.FR_ROLE;         // DEV, TEST, STAGE, PROD, undefined
if(debug === "FALSE" || debug === "false" || typeof debug === 'undefined'){
	debug = false;
}
//Might need to ensure util is installed globally or as a dependent if debugging. 
var util;
if(debug) {
	util = require('util');
}

var dbCredentials = {
		dbName : ''
};

if(fr_role == "PROD"){
	dbCredentials.dbName = 'logs';
}
else {
	dbCredentials.dbName = 'logs-test';
}



var db = {};

var credentialsJson = {};
function initDBConnection(credentialsJson) {
	if(fr_role === "PROD"){
		dbCredentials.host = credentialsJson.logs_w.host;
		dbCredentials.user = credentialsJson.logs_w.username;
		dbCredentials.password = credentialsJson.logs_w.password;
		dbCredentials.dbName = credentialsJson.logs_w.db;
	}
//	else if(fr_role === "TEST") {
//		dbCredentials.host = credentialsJson['logs-test_w'].host;
//		dbCredentials.user = credentialsJson['logs-test_w'].username;
//		dbCredentials.password = credentialsJson['logs-test_w'].password;
//		dbCredentials.dbName = credentialsJson['logs-test_w'].db;
//	}
	else {
		dbCredentials.host = credentialsJson['logs-test_w'].host;
		dbCredentials.user = credentialsJson['logs-test_w'].username;
		dbCredentials.password = credentialsJson['logs-test_w'].password;
		dbCredentials.dbName = credentialsJson['logs-test_w'].db;
	}
	dbCredentials.url = "https://" + dbCredentials.user + ":" + dbCredentials.password + "@" + dbCredentials.host; // (https://istancengstoredighteledi:S1V0X3DpbMoDhd5XVvhETer4@first-response.cloudant.com)
	if(debug) console.log('Loaded log DB credentials before connecting to Cloudant.');
	cloudant = require('cloudant')(dbCredentials.url);
	var db = cloudant.use(dbCredentials.dbName);
}

module.exports = {
		//message is a string presentation of message
		createLog: function(credentialsJson, message, callback) {
			try {
				//if(debug) console.log("Using credentials: "+util.inspect(credentialsJson, false, null));
				//use the credentials from the Json
				initDBConnection(credentialsJson);
				var entry = cloudant.db.use(dbCredentials.dbName);
				entry.insert(message, '', function(err, body) {
					if(err){
						callback(err);
					}
					else{
						callback(null, body);
					}
				});
			}
			catch(e) {
				if(debug) console.log("Error inserting to logs db in cloudant");
				callback(e);
			}
		},
};

