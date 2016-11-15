var _ = require("underscore");
var async = require("async");
var request = require("request");

var env = { mode: "DEV", debug: true };
if (process.env.FR_ROLE) {
	env.mode = (process.env.FR_ROLE).toUpperCase();
}
if (process.env.FR_DEBUG_MODE) {
	env.debug = (process.env.FR_DEBUG_MODE === "true");
}

var dbConfig;
var dbLogs;
var dbLogsTest;
var dbTickets;
var dbTicketsTest;
var dbAnswersTest;
var dbAnswersTrial;
var dbTests;
var dbAnalytics;

var cloudantConfig;
var cloudantLogs;
var cloudantLogsTest;
var cloudantTickets;
var cloudantTicketsTest;
var cloudantAnswersTest;
var cloudantAnswersTrial;
var cloudantTests;
var cloudantAnalytics;

var dbCredentialsConfig = {};
var dbCredentialsLogs = {};
var dbCredentialsLogsTest = {};
var dbCredentialsTickets = {};
var dbCredentialsTicketsTest = {};
var dbCredentialsAnswersTest = {};
var dbCredentialsAnswersTrial = {};
var dbCredentialsTests = {};
var dbCredentialsAnalytics = {};

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
			//console.log(dbCredentialsConfig.url);
		}
	} else {
		console.error("CLOUDANT_R environment var is not set. It needs to have credentials to the configuration DB.");
		console.error("export CLOUDANT_R=\"{\"cloudant\":{\"db\":\"databasename\",\"username\":\"username\",\"password\":\"password\",\"host\":\"hostname\",\"prop_file\":\"docid\"}}\"");
	}
	
	cloudantConfig = require('cloudant')(dbCredentialsConfig.url);
	
	dbConfig = cloudantConfig.use(dbCredentialsConfig.dbName);
	
	dbConfig.get("module_09_managementux", function(err, result) {
		if (err) return console.log("Failed to get UX configuration");
		
		dbCredentialsLogsTest.host = result.cloudant.logstest_db_readwrite.host;
		dbCredentialsLogsTest.user = result.cloudant.logstest_db_readwrite.username;
		dbCredentialsLogsTest.password = result.cloudant.logstest_db_readwrite.password;
		dbCredentialsLogsTest.dbName = result.cloudant.logstest_db_readwrite.db;
		dbCredentialsLogsTest.url = "https://" + dbCredentialsLogsTest.user + ":" + dbCredentialsLogsTest.password + "@" + dbCredentialsLogsTest.host;
		cloudantLogsTest = require('cloudant')(dbCredentialsLogsTest.url);
		dbLogsTest = cloudantLogsTest.use(dbCredentialsLogsTest.dbName);
		
		dbCredentialsLogs.host = result.cloudant.logs_db_read.host;
		dbCredentialsLogs.user = result.cloudant.logs_db_read.username;
		dbCredentialsLogs.password = result.cloudant.logs_db_read.password;
		dbCredentialsLogs.dbName = result.cloudant.logs_db_read.db;
		dbCredentialsLogs.url = "https://" + dbCredentialsLogs.user + ":" + dbCredentialsLogs.password + "@" + dbCredentialsLogs.host;
		cloudantLogs = require('cloudant')(dbCredentialsLogs.url);
		dbLogs = cloudantLogs.use(dbCredentialsLogs.dbName);
		
		dbCredentialsTicketsTest.host = result.cloudant.ticketstest_db_readwrite.host;
		dbCredentialsTicketsTest.user = result.cloudant.ticketstest_db_readwrite.username;
		dbCredentialsTicketsTest.password = result.cloudant.ticketstest_db_readwrite.password;
		dbCredentialsTicketsTest.dbName = result.cloudant.ticketstest_db_readwrite.db;
		dbCredentialsTicketsTest.url = "https://" + dbCredentialsTicketsTest.user + ":" + dbCredentialsTicketsTest.password + "@" + dbCredentialsTicketsTest.host;
		cloudantTicketsTest = require('cloudant')(dbCredentialsTicketsTest.url);
		dbTicketsTest = cloudantTicketsTest.use(dbCredentialsTicketsTest.dbName);
		
		dbCredentialsTickets.host = result.cloudant.tickets_db_read.host;
		dbCredentialsTickets.user = result.cloudant.tickets_db_read.username;
		dbCredentialsTickets.password = result.cloudant.tickets_db_read.password;
		dbCredentialsTickets.dbName = result.cloudant.tickets_db_read.db;
		dbCredentialsTickets.url = "https://" + dbCredentialsTickets.user + ":" + dbCredentialsTickets.password + "@" + dbCredentialsTickets.host;
		cloudantTickets = require('cloudant')(dbCredentialsTickets.url);
		dbTickets = cloudantTickets.use(dbCredentialsTickets.dbName);
		
		dbCredentialsAnswersTest.host = result.cloudant.answerstest_db_readwrite.host;
		dbCredentialsAnswersTest.user = result.cloudant.answerstest_db_readwrite.username;
		dbCredentialsAnswersTest.password = result.cloudant.answerstest_db_readwrite.password;
		dbCredentialsAnswersTest.dbName = result.cloudant.answerstest_db_readwrite.db;
		dbCredentialsAnswersTest.url = "https://" + dbCredentialsAnswersTest.user + ":" + dbCredentialsAnswersTest.password + "@" + dbCredentialsAnswersTest.host;
		cloudantAnswersTest = require("cloudant")(dbCredentialsAnswersTest.url);
		dbAnswersTest = cloudantAnswersTest.use(dbCredentialsAnswersTest.dbName);
		
		dbCredentialsAnswersTrial.host = result.cloudant.answerstrial_db_readwrite.host;
		dbCredentialsAnswersTrial.user = result.cloudant.answerstrial_db_readwrite.username;
		dbCredentialsAnswersTrial.password = result.cloudant.answerstrial_db_readwrite.password;
		dbCredentialsAnswersTrial.dbName = result.cloudant.answerstrial_db_readwrite.db;
		dbCredentialsAnswersTrial.url = "https://" + dbCredentialsAnswersTrial.user + ":" + dbCredentialsAnswersTrial.password + "@" + dbCredentialsAnswersTrial.host;
		cloudantAnswersTrial = require("cloudant")(dbCredentialsAnswersTrial.url);
		dbAnswersTrial = cloudantAnswersTrial.use(dbCredentialsAnswersTrial.dbName);
		
		dbCredentialsTests.host = result.cloudant.tests_db_readwrite.host;
		dbCredentialsTests.user = result.cloudant.tests_db_readwrite.username;
		dbCredentialsTests.password = result.cloudant.tests_db_readwrite.password;
		dbCredentialsTests.dbName = result.cloudant.tests_db_readwrite.db;
		dbCredentialsTests.url = "https://" + dbCredentialsTests.user + ":" + dbCredentialsTests.password + "@" + dbCredentialsTests.host;
		cloudantTests = require("cloudant")(dbCredentialsTests.url);
		dbTests = cloudantTests.use(dbCredentialsTests.dbName);
		
		dbCredentialsAnalytics.host = result.cloudant.analytics_db_readwrite.host;
		dbCredentialsAnalytics.user = result.cloudant.analytics_db_readwrite.username;
		dbCredentialsAnalytics.password = result.cloudant.analytics_db_readwrite.password;
		dbCredentialsAnalytics.dbName = result.cloudant.analytics_db_readwrite.db;
		dbCredentialsAnalytics.url = "https://" + dbCredentialsAnalytics.user + ":" + dbCredentialsAnalytics.password + "@" + dbCredentialsAnalytics.host;
		cloudantAnalytics = require('cloudant')(dbCredentialsAnalytics.url);
		dbAnalytics = cloudantAnalytics.use(dbCredentialsAnalytics.dbName);
	});
}

initDBConnection();

/**
 * REST API callback
 * @callback apiCallback
 * @param {Object} err - error
 * @param {Object} data - JSON data result
 */

exports.getTestResults = function(limit, cb) {	
	var design = "ux";
	var view = "testReport";
	var qparams = {limit: limit, include_docs: true, descending: true};
	
	var db = dbLogsTest;
	if (env.mode === "PROD") {
		db = dbLogs;
	}
	db.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		
		var count = 0;
		var testResults = [];
		result.rows.forEach(function(row) {
			testResults.push({
				id: row.id,
				timestamp: row.doc.timestamp,
				message: row.doc.message,
				additionalInformation: JSON.stringify(row.doc.additionalInformation, null, "    ")
			});
			count++;
		});
		cb(null, {count: count, testResults: testResults});
	});
};

exports.getTestResultsById = function(id, cb) {	
	var db = dbLogsTest;
	if (env.mode === "PROD") {
		db = dbLogs;
	}
	db.get(id, function(err, result) {
		if (err) return cb(err);
		var testResults = [];
		testResults.push({
			id: result._id,
			timestamp: result.timestamp,
			message: result.message,
			additionalInformation: JSON.stringify(result.additionalInformation, null, "    ")
		});
		cb(null, {count: 1, testResults: testResults});
	});
};

exports.getTestResultsCSV = function(limit, cb) {	
	var design = "ux";
	var view = "testReport";
	var qparams = {limit: limit, include_docs: true, descending: true};
	
	var db = dbLogsTest;
	if (env.mode === "PROD") {
		db = dbLogs;
	}
	db.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		
		var testResults = [];
		testResults.push(["ID", "USER", "TIMESTAMP", "MESSAGE", "TESTRESULTS"]);
		result.rows.forEach(function(row) {
			var info = row.doc.additionalInformation;
			var user = "";
			var results = "";
			if (info) {
				if (info.user) user = info.user;
				if (info.results) results = info.results;
			}
			testResults.push([
				row.id,
				user,
				row.doc.timestamp,
				row.doc.message,
				JSON.stringify(results)
			]);
		});
		cb(null, testResults);
	});
};

exports.getTestCases = function(cb) {	
	dbConfig.get("module_09_managementux", function(err, result) {
		if (err) return cb(err);
		cb(null, result.testing);
	});
};

/**
 * Call the component API to execute the test cases
 * @param server {string} - server to call
 * @param port {string} - port number for server
 * @param url {string} - URL of test API
 * @param tests {Object} - array of test cases e.g. ["TC1", "TC2"]
 * @param user {string} - user executing the tests
 * @param parameters {Object} - map of test case parameters
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON
 */
exports.executeTestCases = function(server, port, url, tests, user, parameters, cb) {
	var bodyJSON = {scriptList: tests};
	if (parameters) {
		var tcParams = JSON.parse(parameters);
		for (var tc in tcParams) {
			bodyJSON[tc] = tcParams[tc];
		}
	}
	
	var params = {
		url: "http://" + server + ":" + port + "/" + url + "/" + user,
		json: true,
		body: bodyJSON
	};
	
	request.post(params, function(err, res, body) {
		if (err) return cb(err);
		//console.log(res, body);
		cb(null, {result: body});
	});
};

/**
 * Copy Prod tickets to Test
 * Tickets will be randomly selected based on a starting date from the Prod "tickets" DB.
 * Those tickets will be copied to the Test "tickets-test" DB.
 * @param params - request object params e.g. req.params
 * @param params.startdate {string} - start date to look for tickets
 * @param params.enddate {string} - end date to look for tickets
 * @param params.limit {number} - limit to number of tickets to copy, default is 100
 * @param params.state {string} - initial state to set the ticket to, default is Processed
 * @param params.type {string} - type of ticket [sw|hw|all]
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.copyProdTicketsToTest = function(params, cb) {
	var startKey = "";
	if (params.startdate) {
		startKey = params.startdate;
	}
	var endKey = "";
	if (params.enddate) {
		endKey = params.enddate;
	}
	var limit = 100;
	if (params.limit) {
		limit = params.limit;
	}
	var state = "Processed";
	if (params.state) {
		state = params.state;
	}
	var ticketType = "all";
	if (params.type) {
		ticketType = params.type;
	}
	
	var design = "ux";
	var view = "ticketsProcessed";
	if (ticketType === "sw") {
		view = "ticketsProcessedSW";
	} else if (ticketType ==="hw") {
		view = "ticketsProcessedHW";
	}
	var qparams = {startkey: startKey, endkey: endKey, reduce: false};
	/** Get list of tickets processed based on start date and end date */
	dbLogs.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		try {
			//console.log(result);
			var tickets = [];
			result.rows.forEach(function(row) {
				var ticketId = row.value.ticketId;
				if (ticketId && ticketId != "") {
					tickets.push(row.value.ticketId);
				}
			});
			
			var ticketsToCopy = _.sample(tickets, limit);
			var qparams = {keys: ticketsToCopy, include_docs: true};
			/** Fetch the ticket docs for the random sample */
			dbTickets.fetch(qparams, function(err, result) {
				if (err) return cb(err);
				try {
					//console.log(result)
					var count = 0;
					var ticketDocs = [];
					result.rows.forEach(function(row) {
						var ticketDoc = row.doc;
						delete ticketDoc["_rev"];
						ticketDoc.state = state;
						ticketDoc.customer_email = "";
						ticketDoc.flag = "CopiedFromProd";
						ticketDocs.push(ticketDoc);
						count++;
					});
					//cb(null, {count: count, tickets: ticketDocs});
					/** Load tickets into "tickets-test" DB */
					dbTicketsTest.bulk({docs: ticketDocs}, function(err, result) {
						if (err) return cb(err);
						cb(null, result);
					});
				} catch(e) {
					cb(e);
				}
			});
		} catch(e) {
			cb(e);
		}
	});
};
	
/**
 * Clear all the unprocessed tickets by setting the state to "Processed"
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.clearUnprocessedTickets = function(cb) {
		var design = "analytics";
		var view = "unProcessedTickets";
		var qparams = {};
		dbTicketsTest.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var docs = [];
				result.rows.forEach(function(row) {
					var doc = row.value;
					doc.state = "Processed";
					docs.push(doc);
				});
				//cb(null, docs);
				dbTicketsTest.bulk({docs: docs}, function(err, result) {
					if (err) return cb(err);
					cb(null, result);
				});
			} catch(e) {
				cb(e);
			}
		});
	};

/**
 * Copy Prod tickets to Test by list of ticket based on component ID and open date
 * @param {string} start - start key to filter list of tickets, comma delimited with first value equal to component ID and second value equal to start timestamp, e.g. 5725A54ST,2016-01
 * @param {string} end - end key to filter list of tickets, comma delimited with first value equal to component ID and second value equal to end timestamp, e.g. 5725A54ST,2016-02
 * @param {number} limit - max limit of randomly selected tickets to copy
 * @param {string} flag - string value to help identify copied tickets for later usage in Test, e.g. "CopiedFromProd"
 * @param {string} save - flag to determine whether to save tickets or just view potential results [true|false]
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.copyProdTicketsToTestByCompIdOpenDate = function(start, end, limit, flag, save, cb) {
	var qparams = {reduce: false, include_docs: true};
	var randomLimit = 0;

	if (start || end) {
		if (start && start !== "") {
			var startKeys = start.split(",");
			qparams.startkey = startKeys;
		}
		if (end && end !== "") {
			var endKeys = end.split(",");
			if (endKeys.length === 1) {
				endKeys.push({});
			}
			qparams.endkey = endKeys;
		}
	}
	
	if (limit) {
		randomLimit = limit;
	}
	
	var saveData = false;
	if (save && save == "true") {
		saveData = true;
	}
		
	var countryCodes = {
		"000": 1,
		"616": 1,
		"649": 1,
		"744": 1,
		"866": 1
	};
	
	var design = "ux";
	var view = "byCompIdOpenDate";
	dbTickets.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		try {
			var docs = [];
			result.rows.forEach(function(row) {
				var doc = row.doc;
				if (doc._id.substring(15) > "15-06-29" && !doc.etl_last_modified && countryCodes[doc._id.substring(10,13)]) {
					delete doc["_rev"];
					doc.flag = flag;
					doc.state = "Test";
					doc.customer_email = "";
					docs.push(doc);
				}
			});
			var ticketsToCopy = docs;
			if (randomLimit > 0) ticketsToCopy = _.sample(docs, limit);
			var ticketIds = [];
			ticketsToCopy.forEach(function(ticket) {
				ticketIds.push(ticket._id);
			});
			
			if (saveData) {
				dbTicketsTest.bulk({docs: ticketsToCopy}, function(err, result) {
					if (err) return cb(err);
					cb(null, {count: ticketsToCopy.length, ticket_ids: ticketIds, result: result});
				});
			} else {
				cb(null, {count: ticketsToCopy.length, ticket_ids: ticketIds, tickets: ticketsToCopy});
			}
		} catch(e) {
			cb(e);
		}
	});
};

/**
 * Copy Prod tickets to Test by list of ticket docs from a view
 * @param design {string} - Cloudant DB design doc
 * @param view {string} - Cloudant DB view
 * @param keys {string} - list of keys delimited by comma
 * @param start {string} - start key to look for tickets
 * @param end {string} - end key to look for tickets
 * @param limit {number} - the limit to pass to the view, or if start and end dates used it will act as the limit of randomly selected tickets to copy
 * @param skip {number} - the offset to pass to the view
 * @param descending {string} - whether to sort results by descending order
 * @param {string} flag - string value to help identify copied tickets for later usage in Test, e.g. "CopiedFromProd"
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.copyProdTicketsToTestByView = function(design, view, keys, start, end, limit, skip, descending, flag, cb) {
	var qparams = {reduce: false, include_docs: true};
	var randomLimit = 0;
	var setViewParams = true;

	if (keys) {
		var viewKeys = [];
		if (keys.indexOf(",") >= 0) {
			keys.split(",").forEach(function(key) {
				viewKeys.push(key);
			});
		} else {
			viewKeys.push(keys);
		}
		if (limit) {
			randomLimit = limit;
		}
		qparams.keys = viewKeys;
		setViewParams = false;
	} else if (start || end) {
		if (start && start !== "") {
			qparams.startkey = start;
		}
		if (end && end !== "") {
			qparams.endkey = end;
		}
		if (limit) {
			randomLimit = limit;
		}
		setViewParams = false
	}
	
	if (setViewParams) {
		if (limit) {
			qparams.limit = limit;
		}
		if (skip) {
			qparams.skip = skip;
		}
		if (descending && descending === "true") {
			qparams.descending = true;
		}
	}
	
	var countryCodes = {
		"000": 1,
		"616": 1,
		"649": 1,
		"744": 1,
		"866": 1
	};
	dbTickets.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		try {
			var docs = [];
			result.rows.forEach(function(row) {
				var doc = row.doc;
				if (doc._id.substring(15) > "15-06-29" && !doc.etl_last_modified && countryCodes[doc._id.substring(10,13)]) {
					delete doc["_rev"];
					doc.flag = flag;
					doc.state = "Test";
					doc.customer_email = "";
					docs.push(doc);
				}
			});
			var ticketsToCopy = docs;
			if (randomLimit > 0) ticketsToCopy = _.sample(docs, limit);
			
			cb(null, {count: ticketsToCopy.length, tickets: ticketsToCopy});
			/*dbTicketsTest.bulk({docs: ticketsToCopy}, function(err, result) {
				if (err) return cb(err);
				cb(null, result);
			});*/
		} catch(e) {
			cb(e);
		}
	});
};

/**
 * Copy Prod tickets to Test by list of ticket IDs
 * @param {string} ticketIds - comma delimited list of ticket IDs
 * @param {string} flag - string value to help identify copied tickets for later usage in Test, e.g. "CopiedFromProd"
 * @param {string} save - flag to determine whether to save tickets or just view potential results [true|false]
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.copyProdTicketsToTestByTicketIds = function(ticketIds, flag, save, cb) {
	var ids = [];
	if (ticketIds.indexOf(",") >= 0) {
		ticketIds.split(",").forEach(function(id) {
			ids.push(id);
		});
	} else {
		ids.push(ticketIds);
	}
	
	var saveData = false;
	if (save && save == "true") {
		saveData = true;
	}
	
	dbTickets.fetch({keys: ids}, function(err, result) {
		if (err) return cb(err);
		try {
			var docs = [];
			result.rows.forEach(function(row) {
				if (row.doc) {
					var doc = row.doc;
					delete doc["_rev"];
					doc.state = "Test";
					doc.flag = flag;
					doc.customer_email = "";
					docs.push(doc);
				}
			});
			
			if (saveData) {
				dbTicketsTest.bulk({docs: docs}, function(err, result) {
					if (err) return cb(err);
					cb(null, {count: docs.length, ticket_ids: ids, result: result});
				});
			} else {
				cb(null, {count: docs.length, ticket_ids: ids, tickets: docs});
			}
		} catch(e) {
			cb(e);
		}
	});
};

/**
 * Set tickets to unprocessed by updating the state to "Test"
 * The set of tickets is based on the view specified by the parameters
 * @param design {string} - Cloudant DB design doc
 * @param view {string} - Cloudant DB view
 * @param start {string} - start date to look for tickets
 * @param end {string} - end date to look for tickets
 * @param limit {number} - the limit to pass to the view, or if start and end dates used it will act as the limit of randomly selected tickets to copy
 * @param skip {number} - the offset to pass to the view
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.setTickestToUnprocessedByView = function(design, view, start, end, limit, skip, cb) {
	var qparams = {reduce: false, include_docs: true};
	var randomLimit = 0;
	if (start || end) {
		if (start && start !== "") {
			qparams.startkey = start;
		}
		if (end && end !== "") {
			qparams.endkey = end;
		}
		if (limit) {
			randomLimit = limit;
		}
	} else {
		if (limit) {
			qparams.descending = true;
			qparams.limit = limit;
		}
		if (skip) {
			qparams.skip = skip;
		}
	}

	dbTicketsTest.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		try {
			var docs = [];
			result.rows.forEach(function(row) {
				var doc = row.doc;
				doc.state = "Test";
				doc.customer_email = "";
				docs.push(doc);
			});
			var ticketsToCopy = docs;
			if (randomLimit > 0) ticketsToCopy = _.sample(docs, limit);
			
			//cb(null, {count: ticketsToCopy.length});
			dbTicketsTest.bulk({docs: ticketsToCopy}, function(err, result) {
				if (err) return cb(err);
				cb(null, result);
			});
		} catch(e) {
			cb(e);
		}
	});
};

/**
 * Set tickets to unprocessed by updating the state to "Test"
 * The set of tickets is based on the list of tickets passed as a parameter
 * @param ticketIds {string} - comma delimited list of ticket IDs
 * @param flag {string} - tag to add to ticket to described usage
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.setTickestToUnprocessedByTicketIds = function(ticketIds, flag, cb) {
	var ids = [];
	if (ticketIds.indexOf(",") >= 0) {
		ticketIds.split(",").forEach(function(id) {
			ids.push(id);
		});
	} else {
		ids.push(ticketIds);
	}
	
	dbTicketsTest.fetch({keys: ids}, function(err, result) {
		if (err) return cb(err);
		try {
			var docs = [];
			result.rows.forEach(function(row) {
				var doc = row.doc;
				if (doc) {
					doc.state = "Test";
					doc.customer_email = "";
					if (flag && flag !== "") {
						doc.flag = flag;
					}
					docs.push(doc);
				}
			});
			
			//cb(null, {count: docs.length, docs: docs});
			dbTicketsTest.bulk({docs: docs}, function(err, result) {
				if (err) return cb(err);
				cb(null, result);
			});
		} catch(e) {
			cb(e);
		}
	});
};

/**
 * Copies the answers from the answers-test to the answers-trial DB used for SME validation
 * The set of answers is constrained by a start and end timestamp along with a set of ticket IDs
 *   to allow for copying a very specific set of answers.
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {string} ticketIds  - comma delimited list of ticket IDs
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.copyAnswersTestToTrial = function(start, end, ticketIds, cb) {
	var ticketIdsMap = {};
	if (ticketIds && ticketIds !== "") {
		if (ticketIds.indexOf(",") >= 0) {
			var ids = ticketIds.split(",");
			ids.forEach(function(id) {
				ticketIdsMap[id] = 1;
			});
		}
	}
	
	var design = "ux";
	var view = "ticketsProcessed";
	var qparams = {reduce: false, startkey: start, endkey: end};
	dbLogsTest.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		try {
			var txIds = [];
			result.rows.forEach(function(row) {
				if (ticketIdsMap[row.value.ticketId]) {
					txIds.push(row.value.trId);
				}
			});
			
			var design = "ux";
			var view = "byTransaction";
			var qparams = {include_docs: true, keys: txIds};
			dbAnswersTest.view(design, view, qparams, function(err, result) {
				if (err) return cb(err);
				try {
					var trialDocs = [];
					result.rows.forEach(function(row) {
						var answers = row.doc.answers;
						var answersSet = [];
						var doc = {
							_id: row.doc.pmr_complete.ticket_id,
							pmr_complete: row.doc.pmr_complete,
							answers: answers,
							answers_set_current: 0,
							answers_set: answersSet
						};
						delete(doc.pmr_complete._rev);
						trialDocs.push(doc);
					});
					//cb(null, {length: trialDocs.length, docs: trialDocs});
					
					dbAnswersTrial.bulk({docs: trialDocs}, function(err, result) {
						if (err) return cb(err);
						cb(null, result);
					});
				} catch(e) {
					cb(e);
				}
			});
		} catch(e) {
			cb(e);
		}
	});
};

/**
 * Add an answers set to trial tickets used for SME validation
 * @param {string} ticketIds  - comma delimited list of ticket IDs
 * @param {string} answersFile - file name for JSON file under the agentwatson/trials directory that contains the answer choices for each ticket
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.addAnswersTrialAnswersSet = function(ticketIds, answersFile, cb) {
	var answersJson = require('../trials/' + answersFile);
	
	var keys = [];
	if (ticketIds && ticketIds !== "") {
		if (ticketIds.indexOf(",") >= 0) {
			var ids = ticketIds.split(",");
			ids.forEach(function(id) {
				keys.push(id);
			});
		} else {
			keys.push(ticketIds);
		}
	}
	dbAnswersTrial.fetch({keys: keys}, function(err, result) {
		if (err) return cb(err);
		try {
			var ticketAnswers = {};
			answersJson.tickets.forEach(function(ticket) {
				if (!ticketAnswers[ticket.ticket_id]) {
					ticketAnswers[ticket.ticket_id] = ticket.answers;
				}
			});
			
			var docs = [];
			result.rows.forEach(function(row) {
				var ticketId = row.id;
				var doc = row.doc;
				if (ticketAnswers[ticketId]) {
					if (doc.answers_reviewed) {
						doc.answers_reviewed = false;
					}
					if (doc.answers_set.length > 0) {
						doc.answers_set_current++;
					}
					doc.answers_set.push(ticketAnswers[ticketId]);
				}
				docs.push(doc);
			});
			//cb(null, {length: docs.length, docs: docs});
			
			dbAnswersTrial.bulk({docs: docs}, function(err, result) {
				if (err) return cb(err);
				cb(null, result);
			});
		} catch(e) {
			cb(e);
		}
	});
};

/**
 * Remove last answers set for specified trial tickets
 * @param {string} ticketIds  - comma delimited list of ticket IDs
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.removeLastAnswersTrialAnswersSet = function(ticketIds, cb) {
	var keys = [];
	if (ticketIds && ticketIds !== "") {
		if (ticketIds.indexOf(",") >= 0) {
			var ids = ticketIds.split(",");
			ids.forEach(function(id) {
				keys.push(id);
			});
		} else {
			keys.push(ticketIds);
		}
	}

	dbAnswersTrial.fetch({keys: keys}, function(err, result) {
		if (err) return cb(err, null);
		try {
			var docs = [];
			result.rows.forEach(function(row) {
				var ticketId = row.id;
				var doc = row.doc;
				if (doc.answers_set) {
					doc.answers_set.pop();
					if (doc.answers_set_current > 0) {
						doc.answers_set_current--;
					}
				}
				docs.push(doc);
			});
			//cb(null, {length: docs.length, docs: docs});

			dbAnswersTrial.bulk({docs: docs}, function(err, result) {
				if (err) return cb(err, null);
				cb(null, result);
			});
		} catch(e) {
			cb(e, null);
		}
	});
};

