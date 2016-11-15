var cloudant;
var datetime;
var debug   = process.env.FR_DEBUG_MODE;   // TRUE, FALSE, undefined
var fr_role = process.env.FR_ROLE;         // DEV, TEST, STAGE, PROD, undefined
if(debug === "FALSE" || debug === "false" || typeof debug === 'undefined'){
	debug = false;
}
var os = require('os');
var hostname = os.hostname();
if(debug){
	console.log("System hostname is: "+hostname);
}

var message = {
		severity : '',
		emittedBy : '',
		messageId : '',
		message : '',
		timestamp : '',
		hostname : '',
		additionalInformation : ''
	};


function initCredentials(callback){
	//if(debug) console.log("AccessCredentials Start ");
	var doc_name = "Modules_00_Hub";
	//Let's store all the credentials from Cloudant into credentialsJson
	var config = require("../get-config/get-config.js")(doc_name, function(credentialsJson){
		if (credentialsJson) {
			//if(debug) console.log('Loaded credentials from Cloudant.');
			callback(null, credentialsJson);

		} else {
			if(debug) console.log("AccessCredentials failed - no data");
			callback("{\"Error\":\"AccessCredentials failed - no data\"}");
		}
	});
}	
cloudant = require('./Cloudant.js');

module.exports = {
		DEBUG : "DEBUG",
		INFO : "INFO",
		WARNING : "WARNING",
		ERROR : "ERROR",
		FATAL : "FATAL",

		//Set logger component id:
		setComponentId: function(componentId) {
			message.emittedBy = componentId;
		},
		
		/**
		 * Initlog calls initCredentials to retrieve the credentials from cloudant, if successful return it
		 * This might be a better solution, instead of reading the credentials before every log writing operations...
		 * Function componentID is the component id which leverages this logger
		 * Ex: Collection = com.ibm.watson.first-response.collection
		 */
		initLog: function(callback) {
			initCredentials(function(err,credentialsJson){
				if(!err){
					this.credentialsJson = credentialsJson;
					callback(null, credentialsJson);
				}
				else {
					if(debug) console.log("Error in initCredentials, Could not get it from Cloudant!");
					callback(err);
				}
			});
		},

		
		logCred: function(credentialsJson, severity, msg, functionName, callback) {
			message.hostname = hostname;
			message.emittedBy = functionName;
			message.severity = severity;
			message.message = msg;
			message.messageId = '',
			message.additionalInformation = '';			
			var date = new Date();
			message.timestamp = date.toISOString();
			try {
				cloudant.createLog(credentialsJson, message, function(err, result) {
					if(!err) {
						callback(null, result);
					}
					else {
						callback(err);
					}
				});
			}
			catch(e) {
				console.error(e);
			}						
		}, // end of logCred: function(credentialsJson,....
		
		
		logDetailsCred: function(credentialsJson, severity, msg, messageid, functionName, info, callback) {
			message = {
					severity : '',
					emittedBy : '',
					messageId : '',
					message : '',
					timestamp : '',
					additionalInformation : ''
			};	
			
			message.hostname = hostname;
			message.severity = severity;
			message.emittedBy = functionName;
			message.messageId = messageid;
			message.message = msg;
			try {
				message.additionalInformation = JSON.parse(info);
			}
			catch(e){
				message.additionalInformation = info;
			}
			message.timestamp = (new Date()).toISOString();
			try {
				cloudant.createLog(credentialsJson,message, function(err, result) {
					if(!err) {
						callback(null, result);
					}
					else {
						callback(err);
					}
				});
			}
			catch(e) {
				console.error(e);
			}		
			
		} // end of logDetailsCred: function(credentialsJson,...
		
		
};