console.log("Initiating Logger test...");
var logger = require('./Logger.js');
logger.setComponentId("07-pipeline");

if(logger) {
	
	var doc_name = "Modules_00_Hub";
	var config = require("../get-config/get-config.js")(doc_name, function(credentialsJson) {	
		if (credentialsJson) {	
	
			logger.logCred(logger.ERROR, "test-1: Testing Log error","00-hub", function(err, result) {
				if(!err) {
					console.log("test-1: Successfully logged test error message!");
					console.log(result);
				}
				else {
					console.log("test-1: Error in log test!");
					console.log(err);
				}
			});
					
			logger.logDetailsCred(logger.FATAL,"test-2: Testing LogDetails (additional info is a JSON)", "messageIDsample123", "00-hub", "{\"Error\":\"Additional information JSON test\"}",  function(err, result) {
				if(!err) {
					console.log("test-2: Successfully logged detail JSON test error message!");
					console.log(result);
				}
				else {
					console.log("test-2: Error in detailed log test!");
					console.log(err);
				}
			});
			
			logger.logDetailsCred(logger.INFO,"test-3: Testing LogDetails (additional info NOT a JSON)", "messageIDsample456", "00-hub", "Adding additonal information as a string test.",  function(err, result) {
				if(!err) {
					console.log("test-3: Successfully logged detailed non-JSON test error message!");
					console.log(result);
				}
				else {
					console.log("test-3: Error in detailed log test!");
					console.log(err);
				}
			});
			
			logger.logCred(credentialsJson, logger.ERROR, "test-4: Testing Log error - with credentialsJson","00-hub", function(err, result) {
				if(!err) {
					console.log("test-4: Successfully logged test error message!");
					console.log(result);
				}
				else {
					console.log("test-4: Error in log test!");
					console.log(err);
				}
			});
					
			logger.logDetailsCred(credentialsJson, logger.FATAL,"test-5: Testing LogDetails (additional info is a JSON) - with credentialsJson", "messageIDsample123", "00-hub", "{\"Error\":\"Additional information JSON test\"}",  function(err, result) {
				if(!err) {
					console.log("test-5: Successfully logged detail JSON test error message!");
					console.log(result);
				}
				else {
					console.log("test-5: Error in detailed log test!");
					console.log(err);
				}
			});			
		}
		else {
			console.log("AccessCredentials failed - unable to create credentialsJson object.");
		}  // end if (localCredentialsJson) {
	}); // end var config = require("../
}
else {
	console.log("Failed reading logger.js file");
} // end of if(logger)