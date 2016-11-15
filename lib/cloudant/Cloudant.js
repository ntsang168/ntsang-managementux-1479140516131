//CLOUDANT CONNECTION
var debug   = process.env.FR_DEBUG_MODE;   // TRUE, FALSE, undefined
var fr_role = process.env.FR_ROLE;         // DEV, TEST, STAGE, PROD, undefined
var request = require("request");
if(debug === "FALSE" || debug === "false" || typeof debug === 'undefined'){
	debug = false;
}else {
	var util = require('util');
}
var async = require('async');

//TODO: This should be initialized at startup to the db specified based on fr_role and component
var dbCredentials = {
};
var transactionIdJson = {};
var dbCredentialsCommon = {};

/**
 * Obtain UUIDs from the answers (answers-test if not PROD) db to use as transaction IDs
 * 
 * @param trAmount - The number of UUIDs to obtain.
 */
function initDBConnection(trAmount) {
	
	//TODO: Move these credentials to cloudant Configuration database and send them by hub
	if(fr_role === "PROD"){
		dbCredentials.dbName = 'answers';
		dbCredentials.host = "first-response.cloudant.com";
		dbCredentials.user = "icesomentsperielfdogerro";
		dbCredentials.password = "Akrqd1o0iLy2mB55ESaPUiSV";
		dbCredentials.url = "https://" + dbCredentials.user + ":" + dbCredentials.password + "@" + dbCredentials.host +"/_uuids?count="+trAmount; // https://first-response.cloudant.com/_uuids?count=2
	}
	else{
		dbCredentials.dbName = 'answers-test';
		dbCredentials.host = "first-response.cloudant.com";
		dbCredentials.user = "thatherediverestattlentl";
		dbCredentials.password = "8DWRoQXlFyuc6xayfvjfyR4v";
		dbCredentials.url = "https://" + dbCredentials.user + ":" + dbCredentials.password + "@" + dbCredentials.host +"/_uuids?count="+trAmount; // https://first-response.cloudant.com/_uuids?count=2
	}

}

function initDBConnectionCommon(credentialsJson,dbname,idname) {

	var credentialsPath;
	if (idname)
		credentialsPath = credentialsJson[dbname][idname];
	else
		credentialsPath = credentialsJson[dbname];
	
	dbCredentialsCommon.host = credentialsPath.host;
	dbCredentialsCommon.dbName = credentialsPath.db;
	dbCredentialsCommon.user =  credentialsPath.username;
	dbCredentialsCommon.password =  credentialsPath.password;
	dbCredentialsCommon.url = "https://" + dbCredentialsCommon.user + ":" + dbCredentialsCommon.password + "@" + dbCredentialsCommon.host;
	cloudant = require('cloudant')(dbCredentialsCommon.url);
	db = cloudant.use(dbCredentialsCommon.dbName);
	//if(debug) console.log('Using Cloudant DB credentials with url: ' + dbCredentialsCommon.url +"Database: " +dbCredentialsCommon.dbName );
}
module.exports = {

		
		getTransactionIDs: function(trAmount, callback) {
			initDBConnection(trAmount);
			request({
			    url: dbCredentials.url,
			    json: true
			}, function (error, response, body) {

			    if (!error && response.statusCode === 200) {
			       if (debug) console.log(body); // Print the json response
			       callback(null, body);
			    }else callback(error, null);
			})
			
			
		},
		
		createDocumentCommon: function(credentialsJson, values, dbname, idname, callback) {
			initDBConnectionCommon(credentialsJson, dbname, idname);
			try {
				var entry = cloudant.db.use(dbCredentialsCommon.dbName);
				entry.insert(values, function(err, body) {
					if(err){
						callback(err);
					}
					else{
						callback(null, body);
					}
				});
			}
			catch(e) {
				callback(e);
			}
		},
		
		getDocumentCommon: function(credentialsJson, dbname, docId, callback) {
			initDBConnectionCommon(credentialsJson, dbname, null);
			db.get(docId, null, function(err, body) {
				if (!err) {
					callback(null, body);
				}
				else {
					console.log("Error from Cloudant in getDocumentCommon with docid " + docId);
					callback(err, null);
				}
			});
		},
		
		
		updateDocumentCommon: function(credentialsJson, dbname, docId, values, callback) {
			initDBConnectionCommon(credentialsJson, dbname, null);
			db.insert(values, docId, function (inserterror, body) {
				if(!inserterror) { 
					//Successfully updated
					callback(null, body);
				} else {
					callback(inserterror);
				}
			});
			
		},
		
		getUnprocessedTickets: function(credentialsJson, dbname, callback){
			initDBConnectionCommon(credentialsJson, dbname, null);
			db.view("analytics", "unProcessedTickets", function(err, body) {
				if (!err) {
					var unProcessedTickets = new Array();
				    body.rows.forEach(function(doc) {
				      console.log(doc.value);
				      unProcessedTickets.push(doc.value);
				    });
				    callback(null, unProcessedTickets);
				}
				else{
					callback(err, null);
				}
			});
		},
		
		getRecrodsWithTrId: function(credentialsJson, trId, dbname, callback){
			initDBConnectionCommon(credentialsJson, dbname, null);
			//examples:
			//hector: https://first-response.cloudant.com/logs-test/_design/ux/_view/byTransaction?key=%2269d030a869d7733af43f50713b74ef45%22&include_docs=true 
			//cogIR: https://first-response.cloudant.com/logs-test/_design/ux/_view/byTransaction?key=%2246fae60adcb99efe8eb5bd6b6b32cf1f%22&include_docs=true
			db.view("ux", "byTransaction",{ keys: [trId] } , function(err, body) {
				if (!err) {
					var recordsWithTrid = new Array();
				    body.rows.forEach(function(doc) {	    
				    	recordsWithTrid.push(doc);
				    });
				    callback(null, recordsWithTrid);
				}
				else{
					callback(err, null);
				}
			});
		},
		
		getRecrodsByTrId: function(credentialsJson, idList, dbname, callback){
			initDBConnectionCommon(credentialsJson, dbname, null);
			var arrayOfRecords = new Array();
			
			async.each(idList, function(doc, callback) {
				db.get(doc.id, null, function(err, body) {
					if (!err) {
						arrayOfRecords.push(body);
						callback();
					}
					else {
						console.log("Error from Cloudant in getDocumentCommon with docid " + docId);
						callback(err);
					}
				});
				}, function(err){
				    if( err ) {
				      console.log("ERROR:" + err);
				      callback(err, null);
				    } else {
				      //console.log('All Cloudant records retrieved successfully: ' + util.inspect(arrayOfRecords,false,null));
				      callback(null, arrayOfRecords);
				    }
				});
		}
		
		
};

