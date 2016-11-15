/**
 * Management UX Logs Library
 * @module lib/logs
 */

var env = { mode: "DEV", debug: true };
if (process.env.FR_ROLE) {
	env.mode = (process.env.FR_ROLE).toUpperCase();
}
if (process.env.FR_DEBUG_MODE) {
	env.debug = (process.env.FR_DEBUG_MODE == "true");
}

var dbConfig;
var db;
var orcDb;

var cloudantConfig;
var cloudant;
var orcCloudant;

var dbCredentialsConfig = {};
var dbCredentials = {};
var orcDbCredentials = {};

/** Initialize Cloudant DB connections */
function initDBConnection() {
	if (process.env.CLOUDANT_R) {
		//console.log("Using env CLOUDANT_R");
		var cloudantR = JSON.parse(process.env.CLOUDANT_R);
		if(cloudantR) {
			dbCredentialsConfig.host = cloudantR.cloudant.host;
			dbCredentialsConfig.user = cloudantR.cloudant.username;
			dbCredentialsConfig.password = cloudantR.cloudant.password;
			dbCredentialsConfig.dbName = cloudantR.cloudant.db;
			dbCredentialsConfig.url = "https://" + dbCredentialsConfig.user + ":" + dbCredentialsConfig.password + "@" + dbCredentialsConfig.host;
			dbCredentialsConfig.propFile = cloudantR.cloudant.prop_file;
//			console.log(dbCredentialsConfig.url);
		}
	} else {
		console.error("CLOUDANT_R environment var is not set. It needs to have credentials to the configuration DB.");
		console.error("export CLOUDANT_R=\"{\"cloudant\":{\"db\":\"databasename\",\"username\":\"username\",\"password\":\"password\",\"host\":\"hostname\",\"prop_file\":\"docid\"}}\"");
	}
	
	cloudantConfig = require('cloudant')(dbCredentialsConfig.url);
	
	dbConfig = cloudantConfig.use(dbCredentialsConfig.dbName);
	
	dbConfig.get("module_09_managementux", function(err, result) {
		if (err) return console.log("Failed to get UX configuration");
		
		dbCredentials.host = result.cloudant.logstest_db_readwrite.host;
		dbCredentials.user = result.cloudant.logstest_db_readwrite.username;
		dbCredentials.password = result.cloudant.logstest_db_readwrite.password;
		dbCredentials.dbName = result.cloudant.logstest_db_readwrite.db;
		/**For Orchestrator logging **/
		orcDbCredentials.host = result.cloudant.orc_logs_test.host;
		orcDbCredentials.user = result.cloudant.orc_logs_test.username;
		orcDbCredentials.password = result.cloudant.orc_logs_test.password;
		orcDbCredentials.dbName = result.cloudant.orc_logs_test.db;
		
		if (env.mode == "PROD") {
			dbCredentials.host = result.cloudant.logs_db_readwrite.host;
			dbCredentials.user = result.cloudant.logs_db_readwrite.username;
			dbCredentials.password = result.cloudant.logs_db_readwrite.password;
			dbCredentials.dbName = result.cloudant.logs_db_readwrite.db;
			/**For Orchestrator logging **/
			orcDbCredentials.host = result.cloudant.orc_logs.host;
			orcDbCredentials.user = result.cloudant.orc_logs.username;
			orcDbCredentials.password = result.cloudant.orc_logs.password;
			orcDbCredentials.dbName = result.cloudant.orc_logs.db;
		}
		dbCredentials.url = "https://" + dbCredentials.user + ":" + dbCredentials.password + "@" + dbCredentials.host;
		orcDbCredentials.url = "https://" + orcDbCredentials.user + ":" + orcDbCredentials.password + "@" + orcDbCredentials.host;
		
		cloudant = require('cloudant')(dbCredentials.url);
		orcCloudant = require('cloudant')(orcDbCredentials.url);
		
		db = cloudant.use(dbCredentials.dbName);
		orcDb = orcCloudant.use(orcDbCredentials.dbName);
	});
}

initDBConnection();

/**
 * REST API callback
 * @callback apiCallback
 * @param {Object} err - error
 * @param {Object} data - JSON data result
 */

/**
 * Get log docs
 * Uses the DB view filters
 * @param {string} module - value passed to DB to filter by a specific module
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param params.start - starting timestamp for filtering log entries
 * @param params.end - ending timestamp for filtering log entries
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON of log docs
 */
exports.get = function(module, limit, start, end, cb) {	
	var design = "filters";
	var view = "all";
	if (module) view = module;
	if (!limit) limit = 500;
	
	var qparams = {include_docs: true};
	if (start && start != "") {
		qparams["startkey"] = start;
		if (end && end != "") {
			qparams["endkey"] = end;
		}
	} else if (end && end != "") {
		qparams["endkey"] = end;
	} else {
		qparams["limit"] = limit;
		qparams["descending"] = true;
	}
	db.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		cb(null, result);
	});
}

/**
 * Get log docs by ticket ID
 * Uses the DB view byTicket
 * @param {string} module - value passed to DB to filter by a specific module
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON of log docs
 */
exports.getLogsByTicket = function(ticketId, cb) {	
	var design = "ux";
	var view = "byTicket";
	
	var qparams = {key: ticketId, include_docs: true};
	
	db.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		cb(null, result);
	});
}

/**
 * Get log docs filtered based on the specified search text
 * Uses the DB view filters
 * @param {string} module - value passed to DB to filter by a specific module
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} searchText - text string used to filter log docs if text contained in messageID, message or additionalInformation fields
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON of log docs
 */
exports.searchLogs = function(module, limit, searchText, start, end, cb) {
	var design = "filters";
	var view = "all";
	if (module) view = module;
	if (!limit) limit = 500;
	
	//var qparams = {include_docs: true, limit: limit, descending: true};
	var qparams = {include_docs: true};
	if (start && start != "") {
		qparams["startkey"] = start;
		if (end && end != "") {
			qparams["endkey"] = end;
		}
	} else if (end && end != "") {
		qparams["endkey"] = end;
	} else {
		qparams["limit"] = limit;
		qparams["descending"] = true;
	}
	
	db.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		try {
			var re = new RegExp(".*" + searchText + ".*", "i");
			var searchResults = [];
			result.rows.forEach(function(row) {
				if (re.test(row.doc.messageId) || re.test(row.doc.message) || re.test(JSON.stringify(row.doc.additionalInformation))) {
					searchResults.push({
						id: row.doc._id
					});
				}
			});
			cb(null, {result: searchResults});
		} catch(e) {
			cb(e);
		}
	});
}

/**
 * Get log doc field values formatted in an array to generate CSV output
 * Uses the DB view filters
 * @param {string} module - value passed to DB to filter by a specific module
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {number} severity - severity value used to filter log docs (not used currently)
 * @param {string} searchText - text string used to filter log docs if text contained in messageID, message or additionalInformation fields
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object[]} array of log doc field values
 */
exports.getCSV = function(module, limit, searchText, start, end, cb) {	
	var design = "filters";
	var view = "all";
	if (module) view = module;
	if (!limit) limit = 500;
	
	//var qparams = {include_docs: true, limit: limit, descending: true};
	var qparams = {include_docs: true};
	if (start && start != "") {
		qparams["startkey"] = start;
		if (end && end != "") {
			qparams["endkey"] = end;
		}
	} else if (end && end != "") {
		qparams["endkey"] = end;
	} else {
		qparams["limit"] = limit;
		qparams["descending"] = true;
	}
	
	db.view(design, view, qparams, function(err, logs) {
		if (err) return cb(err);
		try {
			var design = "search";
			var view = "messageAndInfo";
			var qparams = {limit: 200, q: "message:" + searchText + " OR additionalInformation:" + searchText};
			
			var csvDownloadData = [];
			csvDownloadData.push(["ID", "TIMESTAMP", "SEVERITY", "HOSTNAME", "EMITTEDBY", "MESSAGEID", "MESSAGE", "ADDITIONALINFO"]);
			if (searchText) {
				var re = new RegExp(".*" + searchText + ".*", "i");
				
				logs.rows.forEach(function(row) {
					if (re.test(row.doc.message) || re.test(JSON.stringify(row.doc.additionalInformation))) {
						var additionalInformation = null;
						if (row.doc.additionalInformation) {
							additionalInformation = JSON.stringify(row.doc.additionalInformation);
						}
						csvDownloadData.push([row.id, row.doc.timestamp, row.doc.severity, row.doc.hostname, row.doc.emittedBy.replace("com.ibm.watson.firstresponse.",""), row.doc.messageId, row.doc.message, additionalInformation]);
					}
				});
				cb(null, csvDownloadData);			
			} else {
				logs.rows.forEach(function(row) {
					var additionalInformation = null;
					if (row.doc.additionalInformation) {
						additionalInformation = JSON.stringify(row.doc.additionalInformation);
					}
					csvDownloadData.push([row.id, row.doc.timestamp, row.doc.severity, row.doc.hostname, row.doc.emittedBy.replace("com.ibm.watson.firstresponse.",""), row.doc.messageId, row.doc.message, additionalInformation]);
				});
				cb(null, csvDownloadData);
			}
		} catch(e) {
			cb(e);
		}
	});
}

/**Get Orchestrator logs **/

/**
 * Uses the DB design ux
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param params.start - starting timestamp for filtering log entries
 * @param params.end - ending timestamp for filtering log entries
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON of log docs
 */
exports.getOrchestratorLogs = function(limit, start, end, cb) {	
	var design = "ux";
	var view = "all";
	if (!limit) limit = 500;
	
	var qparams = {};
	if (start && start != "") {
		qparams["startkey"] = start;
		if (end && end != "") {
			qparams["endkey"] = end;
		}
	} else if (end && end != "") {
		qparams["endkey"] = end;
	} else {
		qparams["limit"] = limit;
		qparams["descending"] = true;
	}
	qparams["reduce"] = false;
	orcDb.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		cb(null, result);
	});
}

/**
 * Get Orchestrator log docs filtered based on the specified search text
 * Uses the DB view ux
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} searchText - text string used to filter log docs if text contained in messageID, message or additionalInformation fields
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON of log docs
 */
exports.searchOrchLogs = function(limit, searchText, start, end, cb) {
	var design = "ux";
	var view = "all";
	if (!limit) limit = 500;
	
	//var qparams = {include_docs: true, limit: limit, descending: true};
	var qparams = {include_docs: true};
	if (start && start != "") {
		qparams["startkey"] = start;
		if (end && end != "") {
			qparams["endkey"] = end;
		}
	} else if (end && end != "") {
		qparams["endkey"] = end;
	} else {
		qparams["limit"] = limit;
		qparams["descending"] = true;
	}
	qparams["reduce"] = false;
	orcDb.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		try {
			var re = new RegExp(".*" + searchText + ".*", "i");
			var searchResults = [];
			result.rows.forEach(function(row) {
				if (re.test(row.doc.messageId) || re.test(row.doc.message) || re.test(JSON.stringify(row.doc.additionalInformation))) {
					searchResults.push({
						id: row.doc._id
					});
				}
			});
			cb(null, {result: searchResults});
		} catch(e) {
			cb(e);
		}
	});
}

exports.searchOrcByQueryId = function(limit, queryId, start, end, cb) {
	var design = "ux";
	var view = "all";
	if (!limit) limit = 500;
	
	//var qparams = {include_docs: true, limit: limit, descending: true};
	var qparams = {include_docs: true};
	if (start && start != "") {
		qparams["startkey"] = start;
		if (end && end != "") {
			qparams["endkey"] = end;
		}
	} else if (end && end != "") {
		qparams["endkey"] = end;
	} else {
		qparams["limit"] = limit;
		qparams["descending"] = true;
	}
	qparams["reduce"] = false;
	orcDb.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		try {
			var re = new RegExp(".*" + queryId + ".*", "i");
			var searchResults = [];
			result.rows.forEach(function(row) {
				if (re.test(row.doc.queryId) || re.test(row.doc.message) || re.test(JSON.stringify(row.doc.additionalInformation))) {
					searchResults.push({
						id: row.doc._id
					});
				}
			});
			cb(null, {result: searchResults});
		} catch(e) {
			cb(e);
		}
	});
}

/**
 * Get Orchestrator log doc field values formatted in an array to generate CSV output
 * Uses the DB view ux
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {number} severity - severity value used to filter log docs (not used currently)
 * @param {string} searchText - text string used to filter log docs if text contained in messageID, message or additionalInformation fields
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object[]} array of log doc field values
 */
exports.getOrcLogCSV = function(limit, searchText, start, end, cb) {	
	var design = "ux";
	var view = "all";
	
	if (!limit) limit = 500;
	
	//var qparams = {include_docs: true, limit: limit, descending: true};
	var qparams = {include_docs: true};
	if (start && start != "") {
		qparams["startkey"] = start;
		if (end && end != "") {
			qparams["endkey"] = end;
		}
	} else if (end && end != "") {
		qparams["endkey"] = end;
	} else {
		qparams["limit"] = limit;
		qparams["descending"] = true;
	}
	qparams["reduce"] = false;
	orcDb.view(design, view, qparams, function(err, logs) {
		if (err) return cb(err);
		try {
			var csvDownloadData = [];
			csvDownloadData.push(["ID", "TIMESTAMP", "SEVERITY", "HOSTNAME", "EMITTEDBY", "MESSAGEID", "MESSAGE", "ADDITIONALINFO"]);
			if (searchText) {
				var re = new RegExp(".*" + searchText + ".*", "i");
				
				logs.rows.forEach(function(row) {
					if (re.test(row.doc.message) || re.test(JSON.stringify(row.doc.additionalInformation))) {
						var additionalInformation = null;
						if (row.doc.additionalInformation) {
							additionalInformation = JSON.stringify(row.doc.additionalInformation);
						}
						csvDownloadData.push([row.id, row.doc.timestamp, row.doc.severity, row.doc.hostname, row.doc.emittedBy.replace("com.ibm.watson.firstresponse.",""), row.doc.messageId, row.doc.message, additionalInformation]);
					}
				});
				cb(null, csvDownloadData);			
			} else {
				logs.rows.forEach(function(row) {
					var additionalInformation = null;
					if (row.doc.additionalInformation) {
						additionalInformation = JSON.stringify(row.doc.additionalInformation);
					}
					csvDownloadData.push([row.id, row.doc.timestamp, row.doc.severity, row.doc.hostname, row.doc.emittedBy.replace("com.ibm.watson.firstresponse.",""), row.doc.messageId, row.doc.message, additionalInformation]);
				});
				cb(null, csvDownloadData);
			}
		} catch(e) {
			cb(e);
		}
	});
}
