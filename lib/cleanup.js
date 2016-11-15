/**
 * Management UX Cleanup Library
 * @module lib/cleanup
 */

var _ = require("underscore");
var async = require("async");
var request = require("request");
var q = require("q");

var env = { mode: "DEV", debug: true };
if (process.env.FR_ROLE) {
	env.mode = (process.env.FR_ROLE).toUpperCase();
}
if (process.env.FR_DEBUG_MODE) {
	env.debug = (process.env.FR_DEBUG_MODE === "true");
}

var dbConfig;
var dbTickets;
var dbLogs;
var dbAnswers;

var whitelist = {};

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
	
	dbConfig.get("module_09_managementux", function(err, result) {
		if (err) return console.log("Failed to get UX configuration");
		
		var dbCredentialsTickets = {};
		var dbCredentialsLogs = {};
		var dbCredentialsAnswers = {};
		
		var cloudantTickets;
		var cloudantLogs;
		var cloudantAnswers;
		
		dbCredentialsTickets.host = result.cloudant.ticketstest_db_readwrite.host;
		dbCredentialsTickets.user = result.cloudant.ticketstest_db_readwrite.username;
		dbCredentialsTickets.password = result.cloudant.ticketstest_db_readwrite.password;
		dbCredentialsTickets.dbName = result.cloudant.ticketstest_db_readwrite.db;
		if (env.mode === "PROD") {
			dbCredentialsTickets.host = result.cloudant.tickets_db_readwrite.host;
			dbCredentialsTickets.user = result.cloudant.tickets_db_readwrite.username;
			dbCredentialsTickets.password = result.cloudant.tickets_db_readwrite.password;
			dbCredentialsTickets.dbName = result.cloudant.tickets_db_readwrite.db;
		}
		dbCredentialsTickets.url = "https://" + dbCredentialsTickets.user + ":" + dbCredentialsTickets.password + "@" + dbCredentialsTickets.host;
		cloudantTickets = require('cloudant')(dbCredentialsTickets.url);
		dbTickets = cloudantTickets.use(dbCredentialsTickets.dbName);
		
		dbCredentialsLogs.host = result.cloudant.logstest_db_readwrite.host;
		dbCredentialsLogs.user = result.cloudant.logstest_db_readwrite.username;
		dbCredentialsLogs.password = result.cloudant.logstest_db_readwrite.password;
		dbCredentialsLogs.dbName = result.cloudant.logstest_db_readwrite.db;
		if (env.mode === "PROD") {
			dbCredentialsLogs.host = result.cloudant.logs_db_readwrite.host;
			dbCredentialsLogs.user = result.cloudant.logs_db_readwrite.username;
			dbCredentialsLogs.password = result.cloudant.logs_db_readwrite.password;
			dbCredentialsLogs.dbName = result.cloudant.logs_db_readwrite.db;
		}
		dbCredentialsLogs.url = "https://" + dbCredentialsLogs.user + ":" + dbCredentialsLogs.password + "@" + dbCredentialsLogs.host;
		cloudantLogs = require('cloudant')(dbCredentialsLogs.url);
		dbLogs = cloudantLogs.use(dbCredentialsLogs.dbName);
		
		dbCredentialsAnswers.host = result.cloudant.answerstest_db_readwrite.host;
		dbCredentialsAnswers.user = result.cloudant.answerstest_db_readwrite.username;
		dbCredentialsAnswers.password = result.cloudant.answerstest_db_readwrite.password;
		dbCredentialsAnswers.dbName = result.cloudant.answerstest_db_readwrite.db;
		if (env.mode === "PROD") {
			dbCredentialsAnswers.host = result.cloudant.answers_db_readwrite.host;
			dbCredentialsAnswers.user = result.cloudant.answers_db_readwrite.username;
			dbCredentialsAnswers.password = result.cloudant.answers_db_readwrite.password;
			dbCredentialsAnswers.dbName = result.cloudant.answers_db_readwrite.db;
		}
		dbCredentialsAnswers.url = "https://" + dbCredentialsAnswers.user + ":" + dbCredentialsAnswers.password + "@" + dbCredentialsAnswers.host;
		cloudantAnswers = require("cloudant")(dbCredentialsAnswers.url);
		dbAnswers = cloudantAnswers.use(dbCredentialsAnswers.dbName);
		
		// Initialize whitelist
		initWhitelist();
	});
}

/** Initialize Component ID Whitelist */
function initWhitelist() {
	dbConfig.get("modules_00_hub_component_whitelist", function(err, result) {
		if (err) return console.error("Failed to get component ID whitelist");
		try {
			result.allow.forEach(function(compId) {
				if (compId !== "AgentWatsonTestCompId") {
					whitelist[compId.component_id] = {startDate: compId.start_date, endDate: compId.end_date};
				}
			});
		} catch(e) {
			console.error(e);
		}
	});
}

initDBConnection();

/**
 * REST API callback
 * @callback apiCallback
 * @param {Object} err - error
 * @param {Object} data - JSON data result
 */

var cleanupResults = [];

function clearAnswerWhitelistFlagByBatch(params, callback) {
	dbAnswers.list({
		skip: params.skip,
		limit: params.limit,
		include_docs: true
	}, function(err, result) {
		if (err) return callback(err);
		try {
			var offset = result.offset;
			var docs = [];
			result.rows.forEach(function(row) {
				if (typeof row.doc.whitelistCompId === "undefined") {
					//console.log(row.doc);
					row.doc.whitelistCompId = 0;
					docs.push(row.doc);
				}
			});
			//cleanupResults.push({offset: offset, docs: docs});
			//console.log((new Date()).toISOString(), "completed", params);
			//callback(null);
			dbAnswers.bulk({docs: docs}, function(err, result) {
				if (err) return cb(err);
				//cleanupResults.push({offset: offset, result: result});
				console.log((new Date()).toISOString(), "completed", params);
				callback(null);
			});
		} catch(e) {
			callback(e);
		}
	});
}

function setAnswerWhitelistFlagById(ids, callback) {
	//console.log(ids);
	//callback(null);
	dbAnswers.fetch({
		keys: ids
	}, function(err, result) {
		if (err) return callback(err);
		try {
			var docs = [];
			result.rows.forEach(function(row) {
				if (typeof row.doc.whitelistCompId === "undefined" || (typeof row.doc.whitelistCompId !== "undefined" && row.doc.whitelistCompId === 0)) {
					row.doc.whitelistCompId = 1;
					docs.push(row.doc);
				}
			});
			//cleanupResults.push(docs);
			//console.log((new Date()).toISOString(), "completed processing", ids);
			//callback(null);
			dbAnswers.bulk({docs: docs}, function(err, result) {
				if (err) return cb(err);
				//cleanupResults.push({result: result});
				console.log((new Date()).toISOString(), "completed processing", ids);
				callback(null);
			});
		} catch(e) {
			callback(e);
		}
	});
}

module.exports = {
	
	// update every answer doc whitelistCompId = 0
	// ticketsProcessedWhitelist set whitelistCompId = 1
	// nonWhitelistAnswerRecorded set whitelistCompId = 0
	
	/**
	 * Clear the whitelist flags of the answer docs
	 * @param {number} parallelism - number of parallel processes to run at a time
	 * @param {number} batch - number of docs to update per process
	 * @param {number} skip - offset number of docs to skip
	 * @param {number} total - total number of docs to process, if null process everything in answers DB
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	clearWhitelistFlags: function(parallelism, batch, skip, total, cb) {
		cleanupResults = [];
		var parallelProcesses = 5;
		if (parallelism) {
			parallelProcesses = Number(parallelism);
		}
		var batchSize = 100;
		if (batch) {
			batchSize = Number(batch);
		}
		var offset = 0;
		if (skip) {
			offset = Number(skip);
		}
		var totalToProcess = 0;
		if (total) {
			totalToProcess = Number(total);
		}
		
		var params = {limit: 1};
		dbAnswers.list(params, function(err, result) {
			if (err) return cb(err);
			var totalRows = result.total_rows;
			if (totalToProcess !== 0) {
				var totalRows = totalToProcess + offset;
			}
			console.log((new Date()).toISOString(), "starting clearWhitelistFlags process");
			if (offset !== 0) {
				console.log((new Date()).toISOString(), "processing " + (totalRows-offset) + " docs");
			} else {
				console.log((new Date()).toISOString(), "processing " + totalRows + " docs");
			}
			console.log("==============================");
			
			var data = [];
			for (var i=offset; i<totalRows; i=i+batchSize) {
				data.push({skip: i, limit: batchSize});
			}
			async.eachLimit(data, parallelProcesses, clearAnswerWhitelistFlagByBatch, function (err) {
				if (err) return cb(err);
				console.log("==============================");
				console.log((new Date()).toISOString(), "completed clearWhitelistFlags process");
				//cb(null, {total_rows: result.total_rows, results: _.sortBy(cleanupResults, "offset")});
			});
			cb(null, {total_rows: (totalRows-offset), offset: offset});
		});
	},
	
	/**
	 * Set the whitelist flags of answer docs identified to be in the whitelist
	 * @param {number} parallelism - number of parallel processes to run at a time
	 * @param {number} batch - number of docs to update per process
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	setWhitelistFlags: function(parallelism, batch, start, end, cb) {
		cleanupResults = [];
		
		var parallelProcesses = 5;
		if (parallelism) {
			parallelProcesses = Number(parallelism);
		}
		var batchSize = 100;
		if (batch) {
			batchSize = Number(batch);
		}
		
		var startDate = "";
		var endDate = "";
		if (start && start !== "") {
			startDate = start;
		}
		if (end && end !== "") {
			endDate = end;
		}
		
		// Get the list of tickets processed between specified start and end dates
		var design = "ux";
		var view = "ticketsProcessed";
		var qparams = {reduce: false, startkey: startDate, endkey: endDate};
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var txIds = [];
				var ticketIds = [];
				var tickets = [];
				result.rows.forEach(function(row) {
					var ticketEntry = {
						timestamp: row.key,
						log_id: row.id,
						tx_id: row.value.trId,
						ticket_id: row.value.ticketId
					};
					if (row.value.trId) {
						txIds.push(row.value.trId);
					} else if (row.value.ticketId) {
						ticketIds.push(row.value.ticketId);
					}
					tickets.push(ticketEntry);
				});
				
				async.parallel({
					ticketAnswersByTxId: function(callback) {
						// Get answers for tickets based on transaction ID 
						var design = "ux";
						//var view = "byTransaction";
						var view = "ticketsProcessedWhitelistByTxId";
						var qparams = {keys:txIds};
						dbAnswers.view(design, view, qparams, function(err, result) {
							if (err) return callback(err);
							try {
								var countAnswers = 0;
								var answerDetails = {};
								result.rows.forEach(function(row) {
									if (!answerDetails[row.key]) {
										answerDetails[row.key] = {id: row.id, component_id: row.value};
										countAnswers++;
									}
								});
								callback(null, {count: countAnswers, answer_details: answerDetails});
							} catch(e) {
								callback(e)
							}
						});
					},
					ticketAnswersByTicketId: function(callback) {
						// Get answers for tickets based on ticket ID 
						var design = "ux";
						//var view = "byTicket";
						var view = "ticketsProcessedWhitelistByTicketId";
						var qparams = {keys:ticketIds};
						dbAnswers.view(design, view, qparams, function(err, result) {
							if (err) return callback(err);
							try {
								var countAnswers = 0;
								var answerDetails = {};
								result.rows.forEach(function(row) {
									if (!answerDetails[row.key]) {
										answerDetails[row.key] = {id: row.id, component_id: row.value};
										countAnswers++;
									}
								});
								callback(null, {count: countAnswers, answer_details: answerDetails});
							} catch(e) {
								callback(e)
							}
						});
					}
				}, function(error, results) {
					if (error) return cb(error);
					try {
						var answersByTxId = results.ticketAnswersByTxId.answer_details;
						var answersByTicketId = results.ticketAnswersByTicketId.answer_details;
						
						var answersWhitelist = [];
						var totalCount = 0;
						// Determine which of the tickets processed has a comp ID in the whitelist
						tickets.forEach(function(ticket) {
							var id = "";
							var compId = "";
							if (answersByTxId[ticket.tx_id]) {
								id = answersByTxId[ticket.tx_id].id;
								compId = answersByTxId[ticket.tx_id].component_id;
							} else if (answersByTicketId[ticket.ticket_id]) {
								id = answersByTicketId[ticket.ticket_id].id;
								compId = answersByTicketId[ticket.ticket_id].component_id;
							}
							
							if (compId && compId !== "") {
								if (whitelist[compId]) {
									if (whitelist[compId].endDate !== "") {
										if (ticket.timestamp > whitelist[compId].startDate && ticket.timestamp <= whitelist[compId].endDate) {
											answersWhitelist.push(id);
											totalCount++;
										}
									} else {
										if (ticket.timestamp > whitelist[compId].startDate) {
											answersWhitelist.push(id);
											totalCount++;
										}
									}
								}
							}
						});
						
						var answerIds = [];
						var chunk = batchSize;
						for (var i=0; i<answersWhitelist.length; i+=chunk) {
							answerIds.push(answersWhitelist.slice(i,(i+chunk)));
						}
						console.log((new Date()).toISOString(), "starting setWhitelistFlags process");
						console.log((new Date()).toISOString(), "processing " + totalCount + " docs");
						console.log("==============================");
						async.eachLimit(answerIds, parallelProcesses, setAnswerWhitelistFlagById, function (err) {
							if (err) return cb(err);
							console.log("==============================");
							console.log((new Date()).toISOString(), "completed setWhitelistFlags process");
						});
						cb(null, {count: totalCount});
						//cb(null, {count: totalCount, answers: data});
					} catch(e) {
						cb(e);
					}
				});
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Fix the WFS00-NewTicketReceived log entries where a "ticketId" value was not recorded in the "additionaInformation"
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	fixMissingTicketIdForNewTicketsReceived: function(start, end, cb) {
		var startDate = "";
		var endDate = "";
		if (start && start !== "") {
			startDate = start;
		}
		if (end && end !== "") {
			endDate = end;
		}
		
		// Get the list of tickets processed between specified start and end dates
		var design = "ux";
		var view = "ticketsProcessed";
		var qparams = {reduce: false, startkey: startDate, endkey: endDate};
		console.log(qparams);
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				//var txIds = [];
				var txIds = [];
				var tickets = [];
				var countLogMissingTicketId = 0;
				result.rows.forEach(function(row) {
					if (!row.value.ticketId || row.value.ticketId === "undefined") {
						var ticketEntry = {
							timestamp: row.key,
							log_id: row.id,
							tx_id: row.value.trId,
							ticket_id: row.value.ticketId
						};
						countLogMissingTicketId++
						tickets.push(ticketEntry);
						txIds.push(row.value.trId);
					}
				});
				//cb(null, {tickets_length: tickets.length});
				//cb(null, {count: countLogMissingTicketId, tickets: tickets});
				
				// Get answers for tickets based on transaction ID 
				var design = "ux";
				//var view = "byTransaction";
				var view = "byTransaction";
				var qparams = {keys:txIds, include_docs: true};
				dbAnswers.view(design, view, qparams, function(err, result) {
					if (err) return callback(err);
					try {
						var answerDetails = {};
						var answers = [];
						result.rows.forEach(function(row) {
							if (row.doc.pmr_complete.pmr_type.toLowerCase() == "software" && !row.doc.pmr_complete.ticket_id && row.doc.pmr_complete.pmr_cloudant_format) {
								answerDetails[row.key] = {pmr_cloudant_format: row.doc.pmr_complete.pmr_cloudant_format};
								row.doc.pmr_complete.ticket_id = row.doc.pmr_complete.pmr_cloudant_format;
								answers.push(row.doc);
							}
						});
						//cb(null, {count_tickets: tickets.length, count_answers: countAnswers, answerDetails: answerDetails});
						
						var design = "ux";
						var view = "byTransaction";
						var qparams = {keys:txIds, include_docs: true};
						dbLogs.view(design, view, qparams, function(err, result) {
							if (err) return callback(err);
							try {
								var logs = [];
								result.rows.forEach(function(row) {
									if (row.doc.messageId !== "WFS01-TicketReader") {
										if (row.doc.additionalInformation) {
											if (!row.doc.additionalInformation.ticketId || row.doc.additionalInformation.ticketId === "undefined" || row.doc.additionalInformation.ticketId === "null") {
												if (answerDetails[row.doc.additionalInformation.trId]) {
													row.doc.additionalInformation.ticketId = answerDetails[row.doc.additionalInformation.trId].pmr_cloudant_format;
													logs.push(row.doc);
												}
											}
										}
									}
								});
								//cb(null, {count_tickets: tickets.length, count_answers: answers.length, count_logs: logs.length, answers: answers, logs: logs});
								
								dbAnswers.bulk({docs: answers}, function(err, result) {
									if (err) return cb(err);
									var answerUpdateResults = result;
									
									dbLogs.bulk({docs: logs}, function(err, result) {
										if (err) return cb(err);
										var logUpdateResults = result;
										cb(null, {answer_update_results: answerUpdateResults, log_update_results: logUpdateResults});
									});
								});
							} catch(e) {
								cb(e)
							}
						});
					} catch(e) {
						cb(e)
					}
				});
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Fix the WFS00-NewTicketReceived log entries where a "trId" value was not recorded in the "additionaInformation"
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	fixMissingTrIdForNewTicketsReceived: function(start, end, cb) {
		var startDate = "";
		var endDate = "";
		if (start && start !== "") {
			startDate = start;
		}
		if (end && end !== "") {
			endDate = end;
		}
		
		// Get the list of tickets processed between specified start and end dates
		var design = "ux";
		var view = "ticketsProcessed";
		var qparams = {reduce: false, startkey: startDate, endkey: endDate};
		console.log(qparams);
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var tickets = [];
				var ticketIds = [];
				var countLogMissingTrId = 0;
				result.rows.forEach(function(row) {
					if (!row.value.trId) {
						var ticketEntry = {
							timestamp: row.key,
							log_id: row.id,
							tx_id: row.value.trId,
							ticket_id: row.value.ticketId
						};
						countLogMissingTrId++
						ticketIds.push(row.value.ticketId);
						tickets.push(ticketEntry);
					}
				});
				//cb(null, {tickets_length: tickets.length});
				//cb(null, {count: countLogMissingTrId, tickets: tickets});
				
				// Get answers for tickets based on transaction ID 
				var design = "ux";
				//var view = "byTransaction";
				var view = "byTicket";
				var qparams = {keys:ticketIds, include_docs: true};
				dbAnswers.view(design, view, qparams, function(err, result) {
					if (err) return callback(err);
					try {
						var answerDetails = {};
						var answers = [];
						result.rows.forEach(function(row) {
							if (row.doc.pmr_complete.ticket_id && !answerDetails[row.doc.pmr_complete.ticket_id]) {
								answerDetails[row.doc.pmr_complete.ticket_id] = {trID: row.doc._id};
								row.doc.pmr_complete.trID = row.doc._id;
								answers.push(row.doc);
							}
						});
						//cb(null, {count_tickets: tickets.length, count_answers: answers.length, answerDetails: answerDetails});
						//cb(null, {count_tickets: tickets.length, count_answers: result.rows.length, tickets: tickets, answers: result.rows});
						
						var design = "ux";
						var view = "byTicket";
						var qparams = {keys:ticketIds, include_docs: true};
						dbLogs.view(design, view, qparams, function(err, result) {
							if (err) return callback(err);
							try {
								var logs = [];
								result.rows.forEach(function(row) {
									if (row.doc.messageId !== "WFS01-TicketReader") {
										if (row.doc.additionalInformation) {
											if (!row.doc.additionalInformation.trId || row.doc.additionalInformation.trId === "undefined" || row.doc.additionalInformation.trId === "null") {
												if (answerDetails[row.doc.additionalInformation.ticketId]) {
													row.doc.additionalInformation.trId = answerDetails[row.doc.additionalInformation.ticketId].trID;
													logs.push(row.doc);
												}
											}
										}
									}
								});
								//cb(null, {count_tickets: tickets.length, count_answers: answers.length, count_logs: logs.length, answers: answers, logs: logs});
								
								dbAnswers.bulk({docs: answers}, function(err, result) {
									if (err) return cb(err);
									var answerUpdateResults = result;
									
									dbLogs.bulk({docs: logs}, function(err, result) {
										if (err) return cb(err);
										var logUpdateResults = result;
										cb(null, {start: startDate, end: endDate, answer_update_results: answerUpdateResults, log_update_results: logUpdateResults});
									});
								});
							} catch(e) {
								cb(e);
							}
						});
					} catch(e) {
						cb(e);
					}
				});
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Add the missing ticket docs for tickets processed prior to 08/09
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	addMissingTicketDocs: function(start, end, cb) {
		var startDate = "";
		var endDate = "";
		if (start && start !== "") {
			startDate = start;
		}
		if (end && end !== "") {
			endDate = end;
		}
		
		// Get the list of tickets processed between specified start and end dates
		var design = "ux";
		var view = "ticketsProcessed";
		var qparams = {reduce: false, startkey: startDate, endkey: endDate};
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var txIds = [];
				var ticketIds = [];
				var tickets = [];
				result.rows.forEach(function(row) {
					var ticketEntry = {
						timestamp: row.key,
						log_id: row.id,
						tx_id: row.value.trId,
						ticket_id: row.value.ticketId
					};
					if (row.value.ticketId) {
						ticketIds.push(row.value.ticketId);
					}
					if (row.value.trId) {
						txIds.push(row.value.trId);
					}
					tickets.push(ticketEntry);
				});
				ticketIds.push("test");
				//cb(null, {tickets_length: tickets.length});
				//cb(null, {tickets_length: tickets.length, tickets: tickets});
				
				dbTickets.fetch({keys: ticketIds} , function(err, result) {
					if (err) return cb(err);
					//cb(null, result);
					var countMissing = 0;
					var countExists = 0;
					var ticketDetails = {};
					result.rows.forEach(function(row) {
						if (row.doc) {
							ticketDetails[row.key] = row.doc;
						}
					});
					var ticketsExists = [];
					var ticketsMissing = [];
					tickets.forEach(function(ticket) {
						if (ticketDetails[ticket.ticket_id]) {
							countExists++;
							ticketsExists.push(ticket.ticket_id);
						} else {
							countMissing++;
							ticketsMissing.push(ticket.ticket_id);
						}
					});
					//cb(null, {count_tickets: tickets.length, count_exists: countExists, count_missing: countMissing, tickets: tickets, result: result});
					//cb(null, {count_tickets: tickets.length, count_exists: countExists, count_missing: countMissing, tickets_exists: ticketsExists, tickets_missing: ticketsMissing});
					//cb(null, {count_tickets: tickets.length, count_exists: countExists, count_missing: countMissing, tickets_missing: ticketsMissing});
					
					var design = "ux";
					var view = "byTicket";
					//var qparams = {keys: ticketsMissing, include_docs: false};
					var qparams = {keys: ticketsMissing, include_docs: true};
					dbAnswers.view(design, view, qparams, function(err, result) {
						if (err) return cb(err);
						var countAnswers = 0;
						var answerDetails = {};
						result.rows.forEach(function(row) {
							//answerDetails[row.key] = 1;
							if (row.doc) {
								if (!answerDetails[row.key]) {
									answerDetails[row.key] = row.doc.pmr_complete;
									countAnswers++;
								}
							}
						});
						var answerExists = [];
						var answerMissing = [];
						ticketsMissing.forEach(function(ticket) {
							if (answerDetails[ticket]) {
								answerDetails[ticket]._id = ticket;
								answerDetails[ticket].comment = "Ticket doc created as part of cleanup, Story 54306 - Task 54322";
								answerExists.push(answerDetails[ticket]);
							} else {
								answerMissing.push(ticket);
							}
						});
						cb(null, {count_tickets: tickets.length, count_exists: countExists, count_missing: countMissing, count_answer_exists: answerExists.length, count_answer_missing: answerMissing.length, answer_missing: answerMissing});
						//cb(null, {count_tickets: tickets.length, count_exists: countExists, count_missing: countMissing, count_answer_exists: answerExists.length, count_answer_missing: answerMissing.length, ticket_docs_to_create: answerExists});
						
						/*dbTickets.bulk({docs: answerExists}, function(err, result) {
							if (err) return cb(err);
							cb(null, {
								start: startDate,
								end: endDate,
								count_tickets: tickets.length,
								count_exists: countExists,
								count_missing: countMissing,
								count_answer_exists: answerExists.length,
								count_answer_missing: answerMissing.length,
								tickets_results: result
							});
						});*/
					});
				});
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * For whitelist answer docs that are missing the open date, add the open date from the ticket doc
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	addOpenDateToWhitelistAnswerFromTicket: function(limit, skip, cb) {
		// Get the list of tickets processed between specified start and end dates
		var design = "ux";
		var view = "whitelist";
		var qparams = {reduce: false, include_docs: true, limit: limit, skip: skip};
		dbAnswers.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var ticketIds = [];
				var answerDocs = [];
				result.rows.forEach(function(row) {
					if (row.value[1] && row.value[1] !== "") {
						if (!row.doc.pmr_complete.open_date) {
							ticketIds.push(row.value[1]);
							answerDocs.push(row.doc);
						}
					}
				});
				//cb(null, {count: result.total_rows, count_tickets: ticketIds.length});
				//cb(null, {count: result.total_rows, count_tickets: ticketIds.length, answers: answerDocs});
				
				dbTickets.fetch({keys: ticketIds}, function(err, result) {
					if (err) return cb(err);
					try {
						var countOpenDates = 0;
						var ticketDetails = {};
						result.rows.forEach(function(row) {
							if (row.doc.open_date && row.doc.open_date !== "") {
								if (!ticketDetails[row.doc._id]) {
									ticketDetails[row.doc._id] = row.doc.open_date;
									countOpenDates++;
								}
							}
						});
						//cb(null, {count_tickets: ticketIds.length, count_open_dates: countOpenDates});
						//cb(null, {count_tickets: ticketIds.length, count_open_dates: countOpenDates, ticket_details: ticketDetails});
						
						var answerDocsToUpdate = [];
						answerDocs.forEach(function(answer) {
							if (ticketDetails[answer.pmr_complete.ticket_id]) {
								answer.pmr_complete.open_date = ticketDetails[answer.pmr_complete.ticket_id];
								answerDocsToUpdate.push(answer);
							}
						});
						//cb(null, {count_tickets: ticketIds.length, count_open_dates: countOpenDates});
						//cb(null, {count_tickets: ticketIds.length, count_open_dates: countOpenDates, answers: answerDocsToUpdate});
						
						dbAnswers.bulk({docs: answerDocsToUpdate}, function(err, result) {
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
	},
	
	/**
	 * For whitelist answer docs that are missing the open date, add the open date from the WFS00-NewTicketReceived log doc
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	addOpenDateToWhitelistAnswerFromLog: function(limit, skip, cb) {
		// Get the list of tickets processed between specified start and end dates
		var design = "ux";
		var view = "whitelist";
		var qparams = {reduce: false, include_docs: true, limit: limit, skip: skip};
		dbAnswers.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var trIds = [];
				var answerDocs = [];
				result.rows.forEach(function(row) {
					if (row.key && row.key !== "") {
						if (!row.doc.pmr_complete.open_date) {
							trIds.push(row.key);
							answerDocs.push(row.doc);
						}
					}
				});
				//cb(null, {count: result.total_rows, count_tickets: ticketIds.length});
				//cb(null, {count: result.total_rows, count_tickets: ticketIds.length, answers: answerDocs});
				
				var design = "ux";
				var view = "byTransaction";
				var qparams = {keys: trIds, include_docs: true};
				dbLogs.view(design, view, qparams, function(err, result) {
					if (err) return cb(err);
					try {
						var countOpenDates = 0;
						var logDetails = {};
						result.rows.forEach(function(row) {
							if (row.doc.messageId === "WFS00-NewTicketReceived") {
								if (row.doc.additionalInformation.trId) {
									if (!logDetails[row.doc.additionalInformation.trId]) {
										logDetails[row.doc.additionalInformation.trId] = row.doc.timestamp;
										countOpenDates++;
									} else {
										console.log("duplicate", row.doc);
									}
								} else {
									console.log("no trId", row.doc);
								}
							}
						});
						//cb(null, {count: trIds.length, count_open_dates: countOpenDates});
						//cb(null, {count: trIds.length, count_open_dates: countOpenDates, log_details: logDetails});
						
						var answerDocsToUpdate = [];
						answerDocs.forEach(function(answer) {
							if (logDetails[answer.pmr_complete.trID]) {
								answer.pmr_complete.open_date = logDetails[answer.pmr_complete.trID];
								answerDocsToUpdate.push(answer);
							}
						});
						//cb(null, {count: trIds.length, count_update: answerDocsToUpdate.length, answers: answerDocsToUpdate});
						
						dbAnswers.bulk({docs: answerDocsToUpdate}, function(err, result) {
							if (err) return cb(err);
							cb(null, result);
						});
					} catch(e) {
						cb(e);
					}
				});
				/*dbTickets.fetch({keys: ticketIds}, function(err, result) {
					if (err) return cb(err);
					try {
						var countOpenDates = 0;
						var ticketDetails = {};
						result.rows.forEach(function(row) {
							if (row.doc.open_date && row.doc.open_date !== "") {
								if (!ticketDetails[row.doc._id]) {
									ticketDetails[row.doc._id] = row.doc.open_date;
									countOpenDates++;
								}
							}
						});
						//cb(null, {count_tickets: ticketIds.length, count_open_dates: countOpenDates});
						//cb(null, {count_tickets: ticketIds.length, count_open_dates: countOpenDates, ticket_details: ticketDetails});
						
						var answerDocsToUpdate = [];
						answerDocs.forEach(function(answer) {
							if (ticketDetails[answer.pmr_complete.ticket_id]) {
								answer.pmr_complete.open_date = ticketDetails[answer.pmr_complete.ticket_id];
								answerDocsToUpdate.push(answer);
							}
						});
						cb(null, {count_tickets: ticketIds.length, count_open_dates: countOpenDates});
						//cb(null, {count_tickets: ticketIds.length, count_open_dates: countOpenDates, answers: answerDocsToUpdate});
						
						dbAnswers.bulk({docs: answerDocsToUpdate}, function(err, result) {
							if (err) return cb(err);
							cb(null, result);
						});
					} catch(e) {
						cb(e);
					}
				});*/
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Update tickets using old schema (doc.ticket_data) to use the new schema format
	 * @param {string} ticketIds - list of tickets in comma delimited string to process
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	updateTicketSchemaFormatByTicketIds: function(ticketIds, cb) {
		var ids = [];
		if (ticketIds.indexOf(",") >= 0) {
			ticketIds.split(",").forEach(function(id) {
				ids.push(id);
			});
		} else {
			ids.push(ticketIds);
		}
		
		dbTickets.fetch({keys: ids}, function(err, result) {
			if (err) return cb(err);
			var docs = [];
			result.rows.forEach(function(row) {
				var doc = row.doc;
				var ticketData = doc.ticket_data;
				for (key in ticketData) {
					doc[key] = ticketData[key];
				}
				doc.pmr_number = doc._id.substring(0,13).replace(/-/g, ",") + "_" + doc._id.substring(15).replace(/-/g, "/");
				doc.pmr_wellspring_format = doc._id.substring(0,13).replace(/-/g, ",") + " " + doc._id.substring(14).replace(/-/g, "/");
				doc.pmr_cloudant_format = doc._id;
				doc.ticket_id = doc._id;
				doc.state = "Processed";
				doc.flag = "HistoricalImport"
				
				delete doc["ticket_created_date"];
				delete doc["ticket_type"];
				delete doc["ticket_title"];
				delete doc["ticket_body"];
				delete doc["ticket_data"];
				delete doc["answers_review_log"];
				
				docs.push(doc);
			});
			//cb(null, {count: docs.length, docs: docs});
			
			dbTickets.bulk({docs: docs}, function(err, result) {
				if (err) return cb(err);
				cb(null, result);
			});
		});
	},

	getTicketsUpdatedLowConfidence: function(start, end, type, cb) {
		var qparams = {reduce: false};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		}
		
		// Get the list of tickets updated from logs DB identified by WFS00-TicketWriterSubmitted log entries
		var design = "ux";
		var view = "ticketsUpdated";
		if (type && type !== "") {
			switch(type) {
				case "hw":
					view = "ticketsUpdatedHW";
					break;
				case "sw":
					view = "ticketsUpdatedSW";
					break;
			}
		}
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var tickets = {};
				var txIds = [];
				result.rows.forEach(function(row) {
					if (row.value.ticketId && row.value.ticketId !== "null") {
						tickets[row.value.ticketId] = {
							ticket_id: row.value.ticketId,
							timestamp: row.key,
							tx_id: row.value.trId,
							log_id: row.id
						}
						txIds.push(row.value.trId);
					}
				});
				//cb(null, {count: ticketIds.length, tickets: ticketIds});
				
				dbAnswers.fetch({keys: txIds}, function(err, result) {
					if (err) return cb(err);
					try {
						var docs = [];
						result.rows.forEach(function(row) {
							if (row.doc) {
								if (row.doc.confidence && row.doc.confidence === "LOW") {
									if (tickets[row.doc.pmr_complete.ticket_id]) {
										docs.push(tickets[row.doc.pmr_complete.ticket_id]);
									}
								}
							}
						});
						cb(null, {count: docs.length, docs: docs});
					} catch(e) {
						cb(e);
					}
				});
			} catch(e) {
				cb(e);
			}
		});
	},

	/**
	 * Identify the tickets with duplicate WFS00-TicketWriterSubmitted log entries
	 * Defect 56121
	 * @param {string} start - starting timestamp to filter tickets
	 * @param {string} end - ending timestamp to filter tickets
	 * @param {string} type - filter to choose software or hardware tickets [sw|hw]
	 * @param {apiCallback} callback - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketsUpdatedDuplicateTicketWriterSubmitted: function(start, end, type, cb) {
		var qparams = {reduce: false};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		}

		// Get the list of tickets updated from logs DB identified by WFS00-TicketWriterSubmitted log entries
		var design = "ux";
		var view = "ticketsUpdated";
		if (type && type !== "") {
			switch(type) {
				case "hw":
					view = "ticketsUpdatedHW";
					break;
				case "sw":
					view = "ticketsUpdatedSW";
					break;
			}
		}
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var tickets = {};
				var ticketsWithDuplicates = {};
				result.rows.forEach(function(row) {
					if (row.value.ticketId) {
						if (tickets[row.value.ticketId]) {
							tickets[row.value.ticketId]++;
							if (ticketsWithDuplicates[row.value.ticketId]) {
								ticketsWithDuplicates[row.value.ticketId].count++;
							} else {
								ticketsWithDuplicates[row.value.ticketId] = {
									ticket_id: row.value.ticketId,
									timestamp: row.key,
									tx_id: row.value.trId,
									log_id: row.id,
									count: tickets[row.value.ticketId]
								};
							}
						} else {
							tickets[row.value.ticketId] = 1;
						}
					}
				});
				cb(null, {count: Object.keys(ticketsWithDuplicates).length, tickets: ticketsWithDuplicates});
			} catch(e) {
				cb(e);
			}
		});
	},

	/**
	 * Fix the hardware tickets that are missing the WFS00-TicketWriterSubmitted log entries
	 * Defect 56824
	 * @param {string} ticketIds - comma delimited list of ticket IDs
	 * @param {apiCallback} callback - callback that handles the response
	 * @returns {Object} JSON
	 */
	createMissingTicketWriterSubmitted: function(ticketIds, callback) {
		var ids = [];
		if (ticketIds) {
			if (ticketIds.indexOf(",") >= 0) {
				ids = ticketIds.split(",");
			} else {
				ids.push(ticketIds);
			}
		}

		/**
		 * Step 1 - Get the log entries based on the ticket IDs
		 * @returns {*|promise} list of log entries
         */
		function getLogs() {
			var design = "ux";
			var view = "byTicket";
			var params = {
				include_docs: true,
				keys: ids
			};
			var deferred = q.defer();
			dbLogs.view(design, view, params, function(err, result) {
				if (err) {
					deferred.reject(err);
				} else {
					try {
						var logsCheck = {};
						result.rows.forEach(function(row) {
							if (row.doc && row.doc.messageId === "WFS00-TicketWriterSubmitted") {
								logsCheck[row.doc.additionalInformation.trId] = 1;
							}
						});
						var logs = [];
						result.rows.forEach(function(row) {
							if (row.doc && row.doc.messageId === "WFS01-SentUpdateToSR") {
								if (!logsCheck[row.doc.additionalInformation.trId]) {
									logs.push(row.doc);
								}

							}
						});
					} catch(e) {
						deferred.reject(e);
					}
					deferred.resolve(logs);
				}
			});
			return deferred.promise;
		}

		/**
		 * Step 2 - Create the missing WFS00-TicketWriterSubmitted log entries
		 * @returns {*|promise} list new log entries
		 */
		function createTicketWriterSubmitted(logs) {
			var deferred = q.defer();
			try {
				var newLogs = [];
				logs.forEach(function(log) {
					newLog = {
						"severity": "INFO",
						"emittedBy": "00-hub.submitted",
						"messageId": "WFS00-TicketWriterSubmitted",
						"message": "Ticket successfully updated",
						"timestamp": log.timestamp,
						"additionalInformation": {
							"ticketId": log.additionalInformation.ticket_id,
							"trId": log.additionalInformation.trId
						},
						"hostname": "w4s.swg.usma.ibm.com"
					}
					newLogs.push(newLog);
				});
				deferred.resolve(newLogs);
			} catch(e) {
				deferred.reject(e);
			}
			return deferred.promise;
		}

		/**
		 * Step 3 - Save the new log entries to logs DB
		 * @returns {*|promise} results of the bulk document insert
		 */
		function saveLogs(docs) {
			var deferred = q.defer();
			//deferred.resolve({logs: docs, result: {}});
			dbLogs.bulk({docs: docs}, function(err, result) {
				if (err) {
					deferred.reject(err);
				} else {
					deferred.resolve({logs: docs, result: result});
				}
			});
			return deferred.promise;
		}

		getLogs()
			.then(createTicketWriterSubmitted)
			.then(saveLogs)
			.then(function(result) {
				callback(null, {count: result.logs.length, logs: result.logs, result: result.result});
			})
			.catch(function(error) {
				callback(error);
			});
	}
	
};