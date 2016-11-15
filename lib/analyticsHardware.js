/**
 * Management UX Analytics Spotlight Library
 * @module lib/analyticsSpotlight
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
var dbTickets;
var dbLogs;
var dbAnswers;
var dbPmr;
var dbPmrsMetrics;
var dbAnalytics;

var spotlightProducts = {};
var divisions = [];
var componentIdsMap = {};
var ticketsKpiConfig;
var solutionStatsDoc = "";
var dataSpotlightTimeSeriesDoc = "";
var dataSpotlightTicketsUpdatedKMMDoc = "";

var kmmFeedbackScale = {
	"R": 5,
	"Y": 4,
	"N": 3
};

var reportTxtFieldsTicketsUpdatedKMMFlat = [
	"ticket_id",
	"timestamp",
	"problem_desc",
	"machine_type",
	"country",
	"answer1_id",
	"answer1_url",
	"answer1_title",
	"answer1_contrib_ind",
	"answer1_score",
	"answer1_ranker_score",
	"answer2_id",
	"answer2_url",
	"answer2_title",
	"answer2_contrib_ind",
	"answer2_score",
	"answer2_ranker_score",
	"answer3_id",
	"answer3_url",
	"answer3_title",
	"answer3_contrib_ind",
	"answer3_score",
	"answer3_ranker_score",
	"answer4_id",
	"answer4_url",
	"answer4_title",
	"answer4_contrib_ind",
	"answer4_score",
	"answer4_ranker_score",
	"answer5_id",
	"answer5_url",
	"answer5_title",
	"answer5_contrib_ind",
	"answer5_score",
	"answer5_ranker_score"
];

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
		var dbCredentialsTickets = {};
		var dbCredentialsLogs = {};
		var dbCredentialsAnswers = {};
		var dbCredentialsPmr = {};
		var dbCredentialsPmrsMetrics = {};
		var dbCredentialsAnalytics = {};

		var cloudantTests;
		var cloudantTickets;
		var cloudantLogs;
		var cloudantAnswers;
		var cloudantPmr;
		var cloudantPmrsMetrics;
		var cloudantAnalytics;

		dbCredentialsTests.host = result.cloudant.tests_db_read.host;
		dbCredentialsTests.user = result.cloudant.tests_db_read.username;
		dbCredentialsTests.password = result.cloudant.tests_db_read.password;
		dbCredentialsTests.dbName = result.cloudant.tests_db_read.db;
		dbCredentialsTests.url = "https://" + dbCredentialsTests.user + ":" + dbCredentialsTests.password + "@" + dbCredentialsTests.host;
		cloudantTests = require('cloudant')(dbCredentialsTests.url);
		dbTests = cloudantTests.use(dbCredentialsTests.dbName);

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

		// Store the configuration for the tickets kpi report
		ticketsKpiConfig = result.analytics;

		// Load the pmr cloudant db config
		dbCredentialsPmr.host = result.cloudant.pmrtest_db_read.host;
		dbCredentialsPmr.user = result.cloudant.pmrtest_db_read.username;
		dbCredentialsPmr.password = result.cloudant.pmrtest_db_read.password;
		dbCredentialsPmr.dbName = result.cloudant.pmrtest_db_read.db;
		if (env.mode === "PROD") {
			dbCredentialsPmr.host = result.cloudant.pmr_db_read.host;
			dbCredentialsPmr.user = result.cloudant.pmr_db_read.username;
			dbCredentialsPmr.password = result.cloudant.pmr_db_read.password;
			dbCredentialsPmr.dbName = result.cloudant.pmr_db_read.db;
		}
		dbCredentialsPmr.url = "https://" + dbCredentialsPmr.user + ":" + dbCredentialsPmr.password + "@" + dbCredentialsPmr.host;
		cloudantpmr = require('cloudant')(dbCredentialsPmr.url);
		dbPmr = cloudantpmr.use(dbCredentialsPmr.dbName);

		// Load the pmrs-metrics cloudant db config
		dbCredentialsPmrsMetrics.host = result.cloudant.pmrsmetricstest_db_read.host;
		dbCredentialsPmrsMetrics.user = result.cloudant.pmrsmetricstest_db_read.username;
		dbCredentialsPmrsMetrics.password = result.cloudant.pmrsmetricstest_db_read.password;
		dbCredentialsPmrsMetrics.dbName = result.cloudant.pmrsmetricstest_db_read.db;
		if (env.mode === "PROD") {
			dbCredentialsPmrsMetrics.host = result.cloudant.pmrsmetrics_db_read.host;
			dbCredentialsPmrsMetrics.user = result.cloudant.pmrsmetrics_db_read.username;
			dbCredentialsPmrsMetrics.password = result.cloudant.pmrsmetrics_db_read.password;
			dbCredentialsPmrsMetrics.dbName = result.cloudant.pmrsmetrics_db_read.db;
		}
		dbCredentialsPmrsMetrics.url = "https://" + dbCredentialsPmrsMetrics.user + ":" + dbCredentialsPmrsMetrics.password + "@" + dbCredentialsPmrsMetrics.host;
		cloudantPmrsMetrics = require('cloudant')(dbCredentialsPmrsMetrics.url);
		dbPmrsMetrics = cloudantPmrsMetrics.use(dbCredentialsPmrsMetrics.dbName);

		dbCredentialsAnalytics.host = result.cloudant.analytics_db_readwrite.host;
		dbCredentialsAnalytics.user = result.cloudant.analytics_db_readwrite.username;
		dbCredentialsAnalytics.password = result.cloudant.analytics_db_readwrite.password;
		dbCredentialsAnalytics.dbName = result.cloudant.analytics_db_readwrite.db;
		dbCredentialsAnalytics.url = "https://" + dbCredentialsAnalytics.user + ":" + dbCredentialsAnalytics.password + "@" + dbCredentialsAnalytics.host;
		cloudantAnalytics = require('cloudant')(dbCredentialsAnalytics.url);
		dbAnalytics = cloudantAnalytics.use(dbCredentialsAnalytics.dbName);

		// Initialize docs
		if (env.mode === "PROD") {
			solutionStatsDoc = result.analytics.spotlight_solution_stats_doc;
			dataSpotlightTimeSeriesDoc = result.analytics.data_spotlight_time_series_doc;
			dataSpotlightTicketsUpdatedKMMDoc = result.analytics.data_spotlight_tickets_updated_kmm_doc;
		} else {
			solutionStatsDoc = result.analytics.spotlight_solution_stats_doc_test;
			dataSpotlightTimeSeriesDoc = result.analytics.data_spotlight_time_series_doc_test;
			dataSpotlightTicketsUpdatedKMMDoc = result.analytics.data_spotlight_tickets_updated_kmm_doc_test;
		}

		// Initialize division component ID product map
		initSpotlightProducts();

		// Initialize division component ID product map
		initComponentIds();
	});
}

/** Initialize list of Spotlight Products */
function initSpotlightProducts() {
	dbConfig.get("modules_00_hub_spotlight_products", function(err, result) {
		if (err) return console.error("Failed to get spotlight products");
		try {
			products = result.products;
			products.forEach(function(product) {
				if (!spotlightProducts[product.component_id]) {
					spotlightProducts[product.component_id] = {
						start_date: product.start_date,
						end_date: product.end_date
					}
				}
			});
		} catch(e) {
			console.error("Failed to get spotlight products", e);
		}
	});
}

/** Initialize Component ID Whitelist and Divisions */
function initComponentIds() {
	dbAnalytics.get("map_compids_divisions_products", function(err, result) {
		if (err) return console.error("Failed to get component ID map");
		componentIdsMap = result.component_ids;
		divisions = result.divisions.sort();
	});
}

initDBConnection();

/**
 * Get KMM responses for Hardware tickets that were updated
 * Tickets that are updated by our solution have a log entry with messageId=WFS00-TicketWriterSent
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {string} output - determine output, either dashboard stats or raw data [dashboard|statsbyday|data]
 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
 * @param {string} machineTypes - comma delimited list of machine types to filter by
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON
 */
exports.getHardwareTicketsUpdatedKMM = function(start, end, output, response, machineTypes, cb) {
	var startDate = "";
	var endDate = "";
	var outputType = "dashboard";
	var responseType = "all";
	var pmrType = "hardware";
	var machineTypesMap = {};

	if (start && start !== "") {
		startDate = start;
	}
	if (end && end !== "") {
		endDate = end;
	}

	if (output && output !== "") {
		outputType = output;
	}

	if (response && response !== "" && response !== "all") {
		responseType = response;
	}

	if (machineTypes && machineTypes !== "") {
		if (machineTypes.indexOf(",") >= 0) {
			machineTypes.split(",").forEach(function(type) {
				machineTypesMap[type.trim()] = 1;
			});
		} else {
			machineTypesMap[machineTypes.trim()] = 1;
		}
	}

	var design = "ux";
	var view = "dataSpotlightTicketsUpdatedKMMTest";
	if (env.mode === "PROD") {
		view = "dataSpotlightTicketsUpdatedKMM";
	}
	var qparams = {include_docs: true};
	if (start || end) {
		if (start && start !== "") {
			qparams.startkey = start.substring(0,7);
		}
		if (end && end !== "") {
			qparams.endkey = end.substring(0,7);
		}
	}
	dbAnalytics.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		try {
			var kmmStats = {
				kmm_r: 0,
				kmm_y: 0,
				kmm_n: 0,
				kmm_u: 0,
				kmm_x: 0,
				kmm_none: 0
			};
			kmmByDay = {};

			var ticketIds = [];
			var tickets = [];
			result.rows.forEach(function(row) {
				if (row.doc) {
					var ticketsData = row.doc.tickets;
					ticketsData.forEach(function(ticket) {
						var afterStart = true;
						if (startDate !== "" && ticket.timestamp < startDate) {
							afterStart = false;
						}
						var beforeEnd = true;
						if (endDate !== "" && ticket.timestamp >= endDate) {
							beforeEnd = false;
						}
						var responseTypeMatch = true;
						if (responseType !== "all") {
							responseTypeMatch = false;
							if (responseType !== "none") {
								ticket.answers.forEach(function(answer) {
									if (answer.contrib_ind && answer.contrib_ind === responseType) {
										responseTypeMatch = true;
									} else if (answer.feedback && answer.feedback.contrib_ind && answer.feedback.contrib_ind === responseType) {
										responseTypeMatch = true;
									}
								});
							} else {
								var allHaveKMM = true;
								ticket.answers.forEach(function(answer) {
									if (!answer.contrib_ind || (answer.contrib_ind && answer.contrib_ind === "")) {
										allHaveKMM = false;
									}
								});
								if (!ticket.answers || !allHaveKMM) {
									responseTypeMatch = true;
								}
							}
						}
						var pmrTypeMatch = true;
						if (pmrType !== "all") {
							pmrTypeMatch = false;
							if (ticket.pmr_type && (ticket.pmr_type.toLowerCase() === pmrType)) {
								pmrTypeMatch = true;
							}
						}
						var machineTypeMatch = true;
						if (!_.isEmpty(machineTypesMap)) {
							machineTypeMatch = false;
							for (id in machineTypesMap) {
								if (!machineTypeMatch && id === ticket.machine_type) {
									machineTypeMatch = true;
								}
							}
						}

						if (afterStart && beforeEnd && responseTypeMatch && pmrTypeMatch && machineTypeMatch) {
							ticketIds.push(ticket.ticket_id);
							tickets.push(ticket);

							var timestamp = ticket.timestamp.substring(0,10);
							if (!kmmByDay[timestamp]) {
								kmmByDay[timestamp] = {
									kmm_r: 0,
									kmm_y: 0,
									kmm_n: 0,
									kmm_u: 0,
									kmm_x: 0,
									kmm_none: 0
								};
							}
							var bestAnswer = "";
							ticket.answers.forEach(function(answer) {
								var contribInd = "";
								if (answer.feedback && answer.feedback.contrib_ind) {
									contribInd = answer.feedback.contrib_ind;
								}
								if (contribInd) {
									if (kmmFeedbackScale[contribInd]) {
										if (bestAnswer) {
											if (kmmFeedbackScale[contribInd] > kmmFeedbackScale[bestAnswer]) {
												bestAnswer = contribInd;
											}
										} else {
											bestAnswer = contribInd;
										}
									} else {
										kmmStats["kmm_" + contribInd.toLowerCase()]++;
										kmmByDay[timestamp]["kmm_" + contribInd.toLowerCase()]++;
									}
								} else {
									kmmStats.kmm_none++;
									kmmByDay[timestamp]["kmm_none"]++;
								}
							});

							if (bestAnswer) {
								kmmStats["kmm_" + bestAnswer.toLowerCase()]++;
								kmmByDay[timestamp]["kmm_" + bestAnswer.toLowerCase()]++;
							}
						}
					});
				}
			});
			//cb(null, {count: ticketIds.length, ticket: ticketIds});

			// If output is "dashboard" return overall dashboard stats
			if (outputType === "dashboard") {
				cb(null, {count: tickets.length, kmm: kmmStats});
				// If output is "statsbyday" return stats broken down by day
			} else if (outputType === "statsbyday") {
				cb(null, {count: tickets.length, tickets_updated_kmm_by_day: kmmByDay})
				// Else return ticket data
			} else {
				// Get details
				var ticketIds = [];
				tickets.forEach(function(ticket) {
					ticketIds.push(ticket.ticket_id);
				});
				dbTickets.fetch({keys: ticketIds}, function(err, result) {
					if (err) return cb(err);
					var docs = {};
					result.rows.forEach(function(row) {
						if (row.doc) {
							docs[row.doc._id] = row.doc;
						}
					});
					tickets.forEach(function(ticket) {
						if (docs[ticket.ticket_id]) {
							ticket.problem_desc = docs[ticket.ticket_id].problem_desc;
						}
					});
					cb(null, {count: tickets.length, tickets: tickets});
				});
			}
		} catch(e) {
			cb(e);
		}
	});
};

/**
 * Get KMM responses for Hardware tickets that were updated formatted in a delimited text
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
 * @param {string} machineTypes = comma delimited list of machine types to filter by
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @param {string} format - type of output format [default|flat|min]
 * @param {apiCallback} cb - callback that handles the response
 * @returns {string} - delmited text
 */
exports.getHardwareTicketsUpdatedKMMTxt = function(start, end, response, machineTypes, delimiter, stream, format, cb) {
	var streamResponse = true;
	if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
		streamResponse = false;
	}

	var txtDelimiter = "\t";
	if (delimiter && delimiter !== "") {
		txtDelimiter = delimiter;
	}

	var self = this;
	self.getHardwareTicketsUpdatedKMM(start, end, "data", response, machineTypes, function(err, result) {
		try {
			var tickets = result.tickets;
			var fields = reportTxtFieldsTicketsUpdatedKMMFlat;
			var data = [];
			switch(format) {
				case "flat":
				default:
					fields = reportTxtFieldsTicketsUpdatedKMMFlat;
					tickets.forEach(function(ticket) {
						var row = {
							ticket_id: ticket.ticket_id,
							timestamp: ticket.timestamp,
							status: ticket.status,
							close_date: ticket.close_date,
							problem_desc: ticket.problem_desc,
							machine_type: ticket.machine_type,
							country: ticket.country,
							owner_name: ticket.owner_name,
							owner_id: ticket.owner_id,
							resolver_name: ticket.resolver_name
						};
						var answers = ticket.answers;
						if (answers && answers.length) {
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
								var contribInd = "";
								var actionDt = "";
								var actionTm = "";
								if (ticket.pmr_type.toLowerCase() === "hardware" && answer.feedback && answer.feedback.contrib_ind) {
									contribInd = answer.feedback.contrib_ind;
									actionDt = answer.feedback.action_dt;
								}
								row[answerLabel + "_score"] = answer.score;
								row[answerLabel + "_ranker_score"] = answer.ranker_score;
								row[answerLabel + "_rank_score"] = answer.rank_score;
								row[answerLabel + "_ir_engine"] = answer.ir_engine;
								row[answerLabel + "_ir_engine_id"] = answer.ir_engine_id;
								row[answerLabel + "_confidence"] = answer.confidence;
								row[answerLabel + "_contrib_ind"] = contribInd;
								row[answerLabel + "_content_src"] = answer.content_src;
								row[answerLabel + "_action_dt"] = actionDt;
								row[answerLabel + "_action_tm"] = actionTm;
								answerPos++;
							});
						}
						data.push(row);
					});
					break;
			}

			json2csv({ data: data, fields: fields, del: txtDelimiter }, function(err, tsv) {
				if (err) cb(err);
				if (streamResponse) {
					var s = new Readable;
					s.push(tsv);
					s.push(null);
					cb(null, s);
				} else {
					cb(null, tsv);
				}
			});
		} catch(e) {
			cb(e);
		}
	});
};