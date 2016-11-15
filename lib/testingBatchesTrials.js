/**
 * Management UX Testing Batches Library
 * @module lib/testingBatches
 */

var env = { mode: "DEV", debug: true };
if (process.env.FR_ROLE) {
	env.mode = (process.env.FR_ROLE).toUpperCase();
}
if (process.env.FR_DEBUG_MODE) {
	env.debug = (process.env.FR_DEBUG_MODE === "true");
}

var _ = require("underscore");
var async = require("async");
var json2csv = require("json2csv");
var Readable = require("stream").Readable;

var dbConfig;
var dbTests;
var dbAnswers;
var dbAnswersTrial;
var dbBatchTransactions;

var analyticsConfig = {};

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
		if (err) return console.error("Failed to get UX configuration");
		
		var dbCredentialsTests = {};
		var dbCredentialsAnswers = {};
		var cloudantAnswersTrial;
		var dbCredentialsBatchTransactions = {};
		
		var cloudantTests;
		var cloudantAnswers;
		var dbCredentialsAnswersTrial = {};
		var cloudantBatchTransactions;
		
		dbCredentialsTests.host = result.cloudant.tests_db_read.host;
		dbCredentialsTests.user = result.cloudant.tests_db_read.username;
		dbCredentialsTests.password = result.cloudant.tests_db_read.password;
		dbCredentialsTests.dbName = result.cloudant.tests_db_read.db;
		dbCredentialsTests.url = "https://" + dbCredentialsTests.user + ":" + dbCredentialsTests.password + "@" + dbCredentialsTests.host;
		cloudantTests = require('cloudant')(dbCredentialsTests.url);
		dbTests = cloudantTests.use(dbCredentialsTests.dbName);
		
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

		dbCredentialsAnswersTrial.host = result.cloudant.answerstrial_db_readwrite.host;
		dbCredentialsAnswersTrial.user = result.cloudant.answerstrial_db_readwrite.username;
		dbCredentialsAnswersTrial.password = result.cloudant.answerstrial_db_readwrite.password;
		dbCredentialsAnswersTrial.dbName = result.cloudant.answerstrial_db_readwrite.db;
		dbCredentialsAnswersTrial.url = "https://" + dbCredentialsAnswersTrial.user + ":" + dbCredentialsAnswersTrial.password + "@" + dbCredentialsAnswersTrial.host;
		cloudantAnswersTrial = require("cloudant")(dbCredentialsAnswersTrial.url);
		dbAnswersTrial = cloudantAnswersTrial.use(dbCredentialsAnswersTrial.dbName);

		dbCredentialsBatchTransactions.host = result.cloudant.batchtransactions_db_readwrite.host;
		dbCredentialsBatchTransactions.user = result.cloudant.batchtransactions_db_readwrite.username;
		dbCredentialsBatchTransactions.password = result.cloudant.batchtransactions_db_readwrite.password;
		dbCredentialsBatchTransactions.dbName = result.cloudant.batchtransactions_db_readwrite.db;
		dbCredentialsBatchTransactions.url = "https://" + dbCredentialsBatchTransactions.user + ":" + dbCredentialsBatchTransactions.password + "@" + dbCredentialsBatchTransactions.host;
		cloudantBatchTransactions = require('cloudant')(dbCredentialsBatchTransactions.url);
		dbBatchTransactions = cloudantBatchTransactions.use(dbCredentialsBatchTransactions.dbName);
		
		// Initialize analytics configuration
		analyticsConfig = result.analytics;
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
 * Get results of a trial by batch ID
 * @param {string} batchIds  - comma delimited list of batch IDs
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.getTrialResultsByBatch = function(batchIds, cb) {
	var ids = null;
	if (batchIds && batchIds !== "") {
		if (batchIds.indexOf(",") >= 0) {
			ids = batchIds.split(",");
		} else {
			ids = [batchIds];
		}
	}

	dbTests.fetch({keys: ids}, function(err, result) {
		if (err) return cb(err);
		try {
			var tickets = [];
			result.rows.forEach(function(row) {
				tickets = tickets.concat(row.doc.tickets);
			});
			var qparams = {keys: tickets};
			dbAnswersTrial.fetch(qparams, function(err, result) {
				if (err) return cb(err);
				try {
					var count = 0;
					var tickets = [];
					result.rows.forEach(function(row) {
						tickets.push(row.doc);
						count++;
					});
					return cb(null, {count: count, tickets: tickets});
				} catch(e) {
					cb(e)
				}
			});
		} catch(e) {
			cb(e);
		}

	});
};

/**
 * Get results of a trial by batch ID
 * @param {string} batchIds  - comma delimited list of batch IDs
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON listing tickets copied to Test
 */
exports.getLatestTrialResultsByBatch = function(batchIds, cb) {
	var ids = null;
	if (batchIds && batchIds !== "") {
		if (batchIds.indexOf(",") >= 0) {
			ids = batchIds.split(",");
		} else {
			ids = [batchIds];
		}
	}

	dbTests.fetch({keys: ids}, function(err, result) {
		if (err) return cb(err);
		try {
			var tickets = [];
			result.rows.forEach(function(row) {
				tickets = tickets.concat(row.doc.tickets);
			});
			var qparams = {keys: tickets};
			var countFeedback = 0;
			dbAnswersTrial.fetch(qparams, function(err, result) {
				if (err) return cb(err);
				try {
					var tickets = [];
					result.rows.forEach(function(row) {
						var latestReview = {};
						if (row.doc.answers_review_log) {
							countFeedback++;
							latestReview = row.doc.answers_review_log[row.doc.answers_review_log.length-1];
						}
						var latestFeedback = [];
						if (row.doc.answers_set) {
							row.doc.answers_set[row.doc.answers_set_current].forEach(function(answer) {
								latestFeedback.push(answer);
							});
						}
						tickets.push({
							_id: row.doc._id,
							_rev: row.doc._rev,
							pmr_complete: row.doc.pmr_complete,
							reviewed_by: latestReview.reviewed_by,
							review_date: latestReview.review_date,
							feedback: latestFeedback
						});
					});
					return cb(null, {count: tickets.length, count_feedback: countFeedback, tickets: tickets});
				} catch(e) {
					cb(e)
				}
			});
		} catch(e) {
			cb(e);
		}

	});
};

/**
 * Get list of Batch Transactions
 * @param {string} batchId - batch ID to identify transactions with
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} start - starting timestamp for filtering batch transactions
 * @param {string} end - ending timestamp for filtering batch transactions
 * @param {string} answers - flag to include answers
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON
 */
exports.getBatchTransactions = function(batchId, limit, start, end, answers, cb) {
	var includeAnswers = false;
	if (answers && answers === "true") {
		includeAnswers = true;
	}

	var design = analyticsConfig.design_doc;
	var view = "byBatchId";
	var qparams = {
		reduce: false,
		descending: true,
		include_docs: true,
		limit: limit
	};
	if (batchId) {
		if (start || end) {
			if (start) {
				qparams.endkey = [batchId, start];
			} else {
				qparams.endkey = [batchId, ""];
			}
			if (end) {
				qparams.startkey = [batchId, end];
			} else {
				qparams.startkey = [batchId, {}];
			}
		} else {
			qparams.endkey = [batchId, ""];
			qparams.startkey = [batchId, {}];
		}
	}

	/*if (start && start !== "") {
		qparams.endkey += "_" + start;
	}
	if (end && end !== "") {
		qparams.startkey = batchId + "_" + end;
	}*/
	dbBatchTransactions.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		try {
			var batchTransactions = [];
			var transactionIds = {};
			result.rows.forEach(function(row) {
				batchTransactions.push(row.doc);
				if (row.doc.tickets) {
					row.doc.tickets.forEach(function(ticket) {
						transactionIds[ticket.transaction_id] = 1;
					});
				}
			});

			if (includeAnswers) {
				dbAnswers.fetch({keys: Object.keys(transactionIds)}, function(err, result) {
					if (err) return cb(err);
					try {
						var answerDetails = {};
						result.rows.forEach(function(row) {
							if (row.doc) {
								answerDetails[row.doc._id] = {
									build: row.doc.build,
									answers: row.doc.answers,
									confidence: row.doc.confidence,
									confidence_thresholds: row.doc.confidenceThresholds
								}
							}
						});

						batchTransactions.forEach(function(batchTransaction) {
							batchTransaction.tickets.forEach(function(ticket) {
								if (answerDetails[ticket.transaction_id]) {
									ticket.build = answerDetails[ticket.transaction_id].build;
									ticket.answers = answerDetails[ticket.transaction_id].answers;
									ticket.confidence = answerDetails[ticket.transaction_id].confidence;
									ticket.confidence_thresholds = answerDetails[ticket.transaction_id].confidence_thresholds;
								}
							});
						});
						cb(null, {count: batchTransactions.length, batch_transactions: batchTransactions});
					} catch(e) {
						cb(e);
					}

				});
			} else {
				cb(null, {count: batchTransactions.length, batch_transactions: batchTransactions});
			}
		} catch(e) {
			cb(e);
		}
	});
};
	
/**
 * Get list of Batch Transactions, output to delimited TXT
 * @param {string} batchId - batch ID to identify transactions with
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} start - starting timestamp for filtering batch transactions
 * @param {string} end - ending timestamp for filtering batch transactions
 * @param {string} answers - flag to include answers
 * @param {string} delimiter - delimiter to use for output
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON
 */
exports.getBatchTransactionsTxt = function(batchId, limit, start, end, answers, delimiter, cb) {
	var txtDelimiter = "\t";
	if (delimiter && delimiter !== "") {
		txtDelimiter = delimiter;
	}

	var self = this;
	self.getBatchTransactions(batchId, limit, start, end, answers, function(err, result) {
		if (err) return cb(err);
		try {
			var fields = [
				"batch_id",
				"batch_type",
				"batch_transaction_id",
				"batch_timestamp",
				"ticket_id",
				"transaction_id",
				"timestamp",
				"build",
				"confidence",
				"answer1_id",
				"answer1_url",
				"answer1_title",
				"answer1_score",
				"answer1_rank_score",
				"answer1_ranker_score",
				"answer1_ir_engine",
				"answer1_ir_engine_id",
				"answer1_confidence",
				"answer2_id",
				"answer2_url",
				"answer2_title",
				"answer2_score",
				"answer2_rank_score",
				"answer2_ranker_score",
				"answer2_ir_engine",
				"answer2_ir_engine_id",
				"answer2_confidence",
				"answer3_id",
				"answer3_url",
				"answer3_title",
				"answer3_score",
				"answer3_rank_score",
				"answer3_ranker_score",
				"answer3_ir_engine",
				"answer3_ir_engine_id",
				"answer3_confidence",
				"answer4_id",
				"answer4_url",
				"answer4_title",
				"answer4_score",
				"answer4_rank_score",
				"answer4_ranker_score",
				"answer4_ir_engine",
				"answer4_ir_engine_id",
				"answer4_confidence",
				"answer5_id",
				"answer5_url",
				"answer5_title",
				"answer5_score",
				"answer5_rank_score",
				"answer5_ranker_score",
				"answer5_ir_engine",
				"answer5_ir_engine_id",
				"answer5_confidence"
			];
			var data = [];
			var batchTransactions = result.batch_transactions;
			batchTransactions.forEach(function(batchTransaction) {
				var tickets = batchTransaction.tickets;
				tickets.forEach(function(ticket) {
					var row = {
						batch_id: batchTransaction.batch_id,
						batch_type: batchTransaction.batch_type,
						batch_transaction_id: batchTransaction._id,
						batch_timestamp: batchTransaction.batch_timestamp,
						ticket_id: ticket.ticket_id,
						transaction_id: ticket.transaction_id,
						timestamp: ticket.timestamp,
						build: ticket.build,
						confidence: ticket.confidence,
					}

					var answers = ticket.answers;
					if (answers && answers.length > 0) {
						var answerPos = 1;
						answers.forEach(function(answer) {
							var answerLabel = "answer" + answerPos;
							row[answerLabel + "_id"] = answer.id;
							row[answerLabel + "_url"] = answer.url;
							if (answer.title) {
								row[answerLabel + "_title"] = answer.title.replace(/(\r\n|\n|\r)/gm,"");
							} else {
								row[answerLabel + "_title"] = "";
							}
							row[answerLabel + "_score"] = answer.score;
							row[answerLabel + "_rank_score"] = answer.rank_score;
							row[answerLabel + "_ranker_score"] = answer.ranker_score;
							row[answerLabel + "_ir_engine"] = answer.ir_engine;
							row[answerLabel + "_ir_engine_id"] = answer.ir_engine_id;
							row[answerLabel + "_confidence"] = answer.confidence;
							answerPos++;
						});
					}

					data.push(row);
				});
			});

			json2csv({ data: data, fields: fields, del: txtDelimiter }, function(err, tsv) {
				if (err) cb(err);
				var s = new Readable;
				s.push(tsv);
				s.push(null);
				cb(null, s);
			});
		} catch(e) {
			cb(e);
		}
	});
};