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

var irEngineIgnoreList = {};
var countDuplicates = true;

var kmmFeedbackScale = {
	"R": 5,
	"Y": 4,
	"N": 3
};

var reportTxtFields = [
	"ticket_id",
	"timestamp",
	"pmr_type",
	"component_id",
	"component_desc",
	"machine_type",
	"product_name",
	"division",
	"country",
	"title",
	"description",
	"build",
	"answer1_id",
	"answer1_url",
	"answer1_title",
	"answer1_score",
	"answer1_ranker_score",
	"answer1_rank_score",
	"answer1_ir_engine",
	"answer1_ir_engine_id",
	"answer1_confidence",
	"answer2_id",
	"answer2_url",
	"answer2_title",
	"answer2_score",
	"answer2_ranker_score",
	"answer2_rank_score",
	"answer2_ir_engine",
	"answer2_ir_engine_id",
	"answer2_confidence",
	"answer3_id",
	"answer3_url",
	"answer3_title",
	"answer3_score",
	"answer3_ranker_score",
	"answer3_rank_score",
	"answer3_ir_engine",
	"answer3_ir_engine_id",
	"answer3_confidence",
	"answer4_id",
	"answer4_url",
	"answer4_title",
	"answer4_score",
	"answer4_ranker_score",
	"answer4_rank_score",
	"answer4_ir_engine",
	"answer4_ir_engine_id",
	"answer4_confidence",
	"answer5_id",
	"answer5_url",
	"answer5_title",
	"answer5_score",
	"answer5_ranker_score",
	"answer5_rank_score",
	"answer5_ir_engine",
	"answer5_ir_engine_id",
	"answer5_confidence"
];

var reportTxtFieldsTicketsUpdatedKMM = [
	"ticket_id",
	"timestamp",
	"status",
	"close_date",
	"component_id",
	"component_desc",
	"machine_type",
	"product_name",
	"division",
	"country",
	"owner_name",
	"owner_id",
	"resolver_name",
	"answer_id",
	"answer_url",
	"answer_title",
	"answer_score",
	"answer_ranker_score",
	"answer_rank_score",
	"answer_ir_engine",
	"answer_ir_engine_id",
	"answer_confidence",
	"answer_contrib_ind",
	"answer_content_src",
	"answer_action_dt",
	"answer_action_tm"
];

var reportTxtFieldsTicketsUpdatedKMMFlat = [
	"ticket_id",
	"timestamp",
	"status",
	"close_date",
	"component_id",
	"component_desc",
	"machine_type",
	"product_name",
	"division",
	"country",
	"owner_name",
	"owner_id",
	"resolver_name",
	"answer1_id",
	"answer1_url",
	"answer1_title",
	"answer1_score",
	"answer1_ranker_score",
	"answer1_rank_score",
	"answer1_ir_engine",
	"answer1_ir_engine_id",
	"answer1_confidence",
	"answer1_contrib_ind",
	"answer1_content_src",
	"answer1_action_dt",
	"answer1_action_tm",
	"answer2_id",
	"answer2_url",
	"answer2_title",
	"answer2_score",
	"answer2_ranker_score",
	"answer2_rank_score",
	"answer2_ir_engine",
	"answer2_ir_engine_id",
	"answer2_confidence",
	"answer2_contrib_ind",
	"answer2_content_src",
	"answer2_action_dt",
	"answer2_action_tm",
	"answer3_id",
	"answer3_url",
	"answer3_title",
	"answer3_score",
	"answer3_ranker_score",
	"answer3_rank_score",
	"answer3_ir_engine",
	"answer3_ir_engine_id",
	"answer3_confidence",
	"answer3_contrib_ind",
	"answer3_content_src",
	"answer3_action_dt",
	"answer3_action_tm",
	"answer4_id",
	"answer4_url",
	"answer4_title",
	"answer4_score",
	"answer4_ranker_score",
	"answer4_rank_score",
	"answer4_ir_engine",
	"answer4_ir_engine_id",
	"answer4_confidence",
	"answer4_contrib_ind",
	"answer4_content_src",
	"answer4_action_dt",
	"answer4_action_tm",
	"answer5_id",
	"answer5_url",
	"answer5_title",
	"answer5_score",
	"answer5_ranker_score",
	"answer5_rank_score",
	"answer5_ir_engine",
	"answer5_ir_engine_id",
	"answer5_confidence",
	"answer5_contrib_ind",
	"answer5_content_src",
	"answer5_action_dt",
	"answer5_action_tm"
];

var reportTxtFieldsTicketsUpdatedKMMMin = [
	"ticket_id",
	"timestamp",
	"component_id",
	"machine_type",
	"country",
	"answer1_id",
	"answer1_contrib_ind",
	"answer2_id",
	"answer2_contrib_ind",
	"answer3_id",
	"answer3_contrib_ind",
	"answer4_id",
	"answer4_contrib_ind",
	"answer5_id",
	"answer5_contrib_ind"
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

		// Initialize IR Engine ignore list
		if (result.analytics.ir_engine_ignore_list) {
			result.analytics.ir_engine_ignore_list.forEach(function(irEngine) {
				irEngineIgnoreList[irEngine] = 1;
			});
		}

		// Initialize count duplicates flag
		if (result.analytics.count_duplicates) {
			if (env.mode === "PROD") {
				countDuplicates = result.analytics.count_duplicates.prod;
			} else {
				countDuplicates = result.analytics.count_duplicates.test;
			}
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

module.exports = {

/**
 * REST API callback
 * @callback apiCallback
 * @param {Object} err - error
 * @param {Object} data - JSON data result
 */

	/**
	 * Get list of Spotlight Products
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getSpotlightProducts: function(cb) {
		dbConfig.get("modules_00_hub_spotlight_products", function(err, result) {
			if (err) return cb(err);
			try {
				products = result.products;
				var updatedSpotlightProducts = {};
				products.forEach(function(product) {
					if (!updatedSpotlightProducts[product.component_id]) {
						updatedSpotlightProducts[product.component_id] = {
							start_date: product.start_date,
							end_date: product.end_date
						}
					}
				});
				spotlightProducts = updatedSpotlightProducts;
				cb(null, {products: spotlightProducts});
			} catch(e) {
				cb(e);
			}
		});
	},
 
	/**
	 * Get Spotlight tickets processed stats based on the specified period
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} output - determine output, either dashboard total or stats by day [dashboard|statsbyday]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getSpotlightTicketsProcessed: function(start, end, output, type, componentIds, cb) {
		var compIdsMap = {};
		if (componentIds && componentIds !== "") {
			if (componentIds.indexOf(",") >= 0) {
				componentIds.split(",").forEach(function(compId) {
					compIdsMap[compId] = 1;
				});
			} else {
				compIdsMap[componentIds] = 1;
			}
		}
		
		var design = "ux";
		var view = "ticketsProcessed";
		if (type && type !== "") {
			switch(type) {
				case "hw":
					view = "ticketsProcessedHW";
					break;
				case "sw":
					view = "ticketsProcessedSW";
					break;
			}
		}
		
		var qparams = {reduce: false};
		if (start && start !== "") {
			qparams["startkey"] = start;
		}
		if (end && end !== "") {
			qparams["endkey"] = end;
		}
		
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				//var tickets = [];
				var tickets = {};
				var ticketsMap = {};
				var ticketIds = [];
				var txIds = [];
				result.rows.forEach(function(row) {
					ticketIds.push(row.value.ticketId);
					if (countDuplicates) {
						txIds.push(row.value.trId);
						tickets[row.value.trId] = {
							ticket_id: row.value.ticketId,
							tx_id: row.value.trId,
							timestamp: row.key
						};
					} else {
						ticketsMap[row.value.ticketId] = {
							ticket_id: row.value.ticketId,
							tx_id: row.value.trId,
							timestamp: row.key
						}
					}
					/*tickets.push({
						ticket_id: row.value.ticketId,
						tx_id: row.value.trId,
						timestamp: row.key
					});*/
				});
				//cb(null, {count: tickets.length, tickets: tickets});

				if (!countDuplicates) {
					for (id in ticketsMap) {
						txIds.push(ticketsMap[id].tx_id);
						tickets[ticketsMap[id].tx_id] = ticketsMap[id];
					}
				}

				/*var design = "ux";
				var view = "byTicketIdCompId";
				var qparams = {keys: ticketIds};
				dbTickets.view(design, view, qparams, function(err, result) {
					if (err) return cb(err);
					try {
						var ticketsSpotlight = {};
						result.rows.forEach(function(row) {
							// Default to software component ID
							var compId = row.value[0];
							// If no component ID use the hardware machine type
							if (!compId) {
								compId = row.value[1];
							}
							if (spotlightProducts[compId]) {
								ticketsSpotlight[row.id] = compId;
							}
						});
						console.log(ticketsSpotlight);
						
						var ticketsFiltered = [];
						tickets.forEach(function(ticket) {
							if (ticketsSpotlight[ticket.ticket_id]) {
								var compId = ticketsSpotlight[ticket.ticket_id]
								if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (ticket.timestamp > spotlightProducts[compId].start_date)) {
									var endDateCheckPassed = false;
									if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (ticket.timestamp < spotlightProducts[compId].end_date)) {
										endDateCheckPassed = true;
									} else if (!spotlightProducts[compId].end_date) {
										endDateCheckPassed = true;
									}
									
									if (endDateCheckPassed) {
										var compIdMatch = true;
										if (!_.isEmpty(compIdsMap)) {
											compIdMatch = false;
											for (id in compIdsMap) {
												if (!compIdMatch && id === compId) {
													compIdMatch = true;
												}
											}
										}
										if (compIdMatch) {
											ticketsFiltered.push(ticket.timestamp.substring(0,10));
										}
									}
								}
							}
						});
						console.log(ticketsFiltered);*/
				var view = "byTransactionCompId";
				var qparams = {keys: txIds};
				dbAnswers.view(design, view, qparams, function(err, result) {
					if (err) return cb(err);
					try {
						var ticketsFiltered = [];
						result.rows.forEach(function(row) {
							tickets[row.id].has_answer = 1;
							// Default to software component ID
							var compId = row.value[0];
							// If no component ID use the hardware machine type
							if (!compId || row.value[1]) {
								compId = row.value[1];
							}
							
							if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (tickets[row.id].timestamp > spotlightProducts[compId].start_date)) {
								var endDateCheckPassed = false;
								if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (tickets[row.id].timestamp < spotlightProducts[compId].end_date)) {
									endDateCheckPassed = true;
								} else if (!spotlightProducts[compId].end_date) {
									endDateCheckPassed = true;
								}
								
								if (endDateCheckPassed) {
									var compIdMatch = true;
									if (!_.isEmpty(compIdsMap)) {
										compIdMatch = false;
										for (id in compIdsMap) {
											if (!compIdMatch && id === compId) {
												compIdMatch = true;
											}
										}
									}
									if (compIdMatch) {
										tickets[row.id].spotlight = 1;
										tickets[row.id].component_id = compId;
										ticketsFiltered.push(tickets[row.id].timestamp.substring(0,10));
									}
								}
							}
						});
						//cb(null, {count: ticketsFiltered.length, tickets: ticketsFiltered});
						
						var ticketsWithNoAnswer = [];
						for (key in tickets) {
							if (!tickets[key].has_answer) {
								ticketsWithNoAnswer.push(tickets[key].ticket_id);
							}
						}
						
						if (ticketsWithNoAnswer.length <= 0) {
							// Default case where all tickets have an answer doc
							switch(output) {
								case "dashboard":
									cb(null, {count: ticketsFiltered.length});
									break;
								case "statsbyday":
									try {
										var ticketsByDay = {};
										ticketsFiltered.forEach(function(ts) {
											if (!ticketsByDay[ts]) {
												ticketsByDay[ts] = 1;
											} else {
												ticketsByDay[ts] = ticketsByDay[ts] + 1;
											}
										});
										cb(null, {count: ticketsFiltered.length, tickets_processed_by_day: ticketsByDay});
									} catch(e) {
										cb(e);
									}
									break;
								default:
									cb(null, {count: ticketsFiltered.length});
									break;
							}
						} else {
							// Defect 55913 - Account for the situation where the RnR Ranker failed and no answer doc was created
							var design = "ux";
							var view = "byTicketIdCompId";
							var qparams = {keys: ticketsWithNoAnswer};
							dbTickets.view(design, view, qparams, function(err, result) {
								if (err) return cb(err);
								try {
									var ticketsSpotlight = {};
									result.rows.forEach(function(row) {
										// Default to software component ID
										var compId = row.value[0];
										// If no component ID use the hardware machine type
										if (!compId) {
											compId = row.value[1];
										}
										if (spotlightProducts[compId]) {
											ticketsSpotlight[row.id] = compId;
										}
									});
									
									var ticketsFiltered = [];
									for (key in tickets) {
										if (tickets[key].spotlight) {
											ticketsFiltered.push(tickets[key].timestamp.substring(0,10));
										} else if (ticketsSpotlight[tickets[key].ticket_id]) {
											var compId = ticketsSpotlight[tickets[key].ticket_id];
											if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (tickets[key].timestamp > spotlightProducts[compId].start_date)) {
												var endDateCheckPassed = false;
												if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (tickets[key].timestamp < spotlightProducts[compId].end_date)) {
													endDateCheckPassed = true;
												} else if (!spotlightProducts[compId].end_date) {
													endDateCheckPassed = true;
												}
												
												if (endDateCheckPassed) {
													var compIdMatch = true;
													if (!_.isEmpty(compIdsMap)) {
														compIdMatch = false;
														for (id in compIdsMap) {
															if (!compIdMatch && id === compId) {
																compIdMatch = true;
															}
														}
													}
													if (compIdMatch) {
														ticketsFiltered.push(tickets[key].timestamp.substring(0,10));
													}
												}
											}
										}
									}
									
									switch(output) {
										case "dashboard":
											cb(null, {count: ticketsFiltered.length});
											break;
										case "statsbyday":
											try {
												var ticketsByDay = {};
												ticketsFiltered.forEach(function(ts) {
													if (!ticketsByDay[ts]) {
														ticketsByDay[ts] = 1;
													} else {
														ticketsByDay[ts] = ticketsByDay[ts] + 1;
													}
												});
												cb(null, {count: ticketsFiltered.length, tickets_processed_by_day: ticketsByDay});
											} catch(e) {
												cb(e);
											}
											break;
										default:
											cb(null, {count: ticketsFiltered.length});
											break;
									}
								} catch(e) {
									cb(e);
								}
							});
						}
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
	 * Get Spotlight tickets processed stats for tickets that passed the whitelist based on the specified period
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} output - determine output, either dashboard total or stats by day [dashboard|statsbyday]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getSpotlightTicketsProcessedWhitelist: function(start, end, output, type, componentIds, cb) {
		var compIdsMap = {};
		if (componentIds && componentIds !== "") {
			if (componentIds.indexOf(",") >= 0) {
				componentIds.split(",").forEach(function(compId) {
					compIdsMap[compId] = 1;
				});
			} else {
				compIdsMap[componentIds] = 1;
			}
		}

		var design = "ux";
		var view = "whitelist";
		if (type && type !== "") {
			switch(type) {
				case "hw":
					view = "whitelistHW";
					break;
				case "sw":
					view = "whitelistSW";
					break;
			}
		}
		
		var qparams = {reduce: false, include_docs: true};
		if (start) {
			qparams["startkey"] = start;
		}
		if (end) {
			qparams["endkey"] = end;
		}
		
		// Get list of whitelist tickets based on whitelist flags found in the answer docs
		dbAnswers.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var ticketsFiltered = [];
				var ticketsMap = {};
				result.rows.forEach(function(row) {
					var ticketId = row.value[0];
					// Default to software component ID
					var compId = row.value[2];
					// If no component ID use the hardware machine type
					if (!compId || row.value[3]) {
						compId = row.value[3];
					}
					if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (row.key > spotlightProducts[compId].start_date)) {
						var endDateCheckPassed = false;
						if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (row.key < spotlightProducts[compId].end_date)) {
							endDateCheckPassed = true;
						} else if (!spotlightProducts[compId].end_date) {
							endDateCheckPassed = true;
						}
						
						if (endDateCheckPassed) {
							var compIdMatch = true;
							if (!_.isEmpty(compIdsMap)) {
								compIdMatch = false;
								for (id in compIdsMap) {
									if (!compIdMatch && id === compId) {
										compIdMatch = true;
									}
								}
							}
							if (compIdMatch) {
								if (countDuplicates) {
									ticketsFiltered.push(row.key.substring(0,10));
								} else {
									ticketsMap[ticketId] = row.key.substring(0,10);
								}
							}
						}
					}
				});
				if (!countDuplicates) {
					for (id in ticketsMap) {
						ticketsFiltered.push(ticketsMap[id]);
					}
				}
				
				switch(output) {
					case "dashboard":
						cb(null, {count: ticketsFiltered.length});
						break;
					case "statsbyday":
						try {
							ticketsFiltered = ticketsFiltered.sort();
							
							var ticketsByDay = {};
							ticketsFiltered.forEach(function(ts) {
								if (!ticketsByDay[ts]) {
									ticketsByDay[ts] = 1;
								} else {
									ticketsByDay[ts] = ticketsByDay[ts] + 1;
								}
							});
							cb(null, {count: ticketsFiltered.length, tickets_processed_whitelist_by_day: ticketsByDay});
						} catch(e) {
							cb(e);
						}
						break;
					default:
						cb(null, {count: ticketsFiltered.length});
						break;
				}
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Get Spotlight tickets updated statistics based on the specified period
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} output - determine output, either dashboard total or stats by day [dashboard|statsbyday]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getSpotlightTicketsUpdated: function(start, end, output, type, componentIds, cb) {
		var compIdsMap = {};
		if (componentIds && componentIds !== "") {
			if (componentIds.indexOf(",") >= 0) {
				componentIds.split(",").forEach(function(compId) {
					compIdsMap[compId] = 1;
				});
			} else {
				compIdsMap[componentIds] = 1;
			}
		}
		
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
		
		var qparams = {reduce: false};
		if (start && start !== "") {
			qparams["startkey"] = start;
		}
		if (end && end !== "") {
			qparams["endkey"] = end;
		}
		
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var tickets = {};
				//var ticketIds = [];
				var ticketsMap = {};
				var txIds = [];
				result.rows.forEach(function(row) {
					//ticketIds.push(row.value.ticketId);
					if (countDuplicates) {
						txIds.push(row.value.trId);
					} else {
						ticketsMap[row.value.ticketId] = row.value.trId;
					}
					//tickets[row.value.ticketId] = row.key;
					tickets[row.value.trId] = row.key;
				});
				//cb(null, {count: tickets.length, tickets: tickets});
				if (!countDuplicates) {
					for (id in ticketsMap) {
						txIds.push(ticketsMap[id]);
					}
				}
				
				var design = "ux";
				var view = "byTransactionCompId";
				var qparams = {keys: txIds};
				
				dbAnswers.view(design, view, qparams, function(err, result) {
					if (err) return cb(err);
					try {
						var ticketsFiltered = [];
						result.rows.forEach(function(row) {
							// Default to software component ID
							var compId = row.value[0];
							// If no component ID use the hardware machine type
							if (!compId || row.value[1]) {
								compId = row.value[1];
							}
							if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (tickets[row.id] > spotlightProducts[compId].start_date)) {
								var endDateCheckPassed = false;
								if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (tickets[row.id] < spotlightProducts[compId].end_date)) {
									endDateCheckPassed = true;
								} else if (!spotlightProducts[compId].end_date) {
									endDateCheckPassed = true;
								}
								
								if (endDateCheckPassed) {
									var compIdMatch = true;
									if (!_.isEmpty(compIdsMap)) {
										compIdMatch = false;
										for (id in compIdsMap) {
											if (!compIdMatch && id === compId) {
												compIdMatch = true;
											}
										}
									}
									if (compIdMatch) {
										ticketsFiltered.push(tickets[row.id].substring(0,10));
									}
								}
							}
						});
						
						switch(output) {
							case "dashboard":
								cb(null, {count: ticketsFiltered.length});
								break;
							case "statsbyday":
								try {
									ticketsFiltered = ticketsFiltered.sort();
									
									var ticketsByDay = {};
									ticketsFiltered.forEach(function(ts) {
										if (!ticketsByDay[ts]) {
											ticketsByDay[ts] = 1;
										} else {
											ticketsByDay[ts] = ticketsByDay[ts] + 1;
										}
									});
									cb(null, {count: ticketsFiltered.length, tickets_updated_by_day: ticketsByDay});
								} catch(e) {
									cb(e);
								}
								break;
							default:
								cb(null, {count: ticketsFiltered.length});
								break;
						}
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
	 * Get details for Spotlight tickets processed
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} answers - flag to include answers
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products = comma delimited list of products to filter by
	 * @param {string} customerDetails - flag to include customer details
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getSpotlightTicketsProcessedDetails: function(start, end, type, details, answers, divisions, componentIds, products, customerDetails, cb) {
		var qparams = {reduce: false};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		}
		var includeDetails = false;
		if (details && details === "true") {
			includeDetails = true;
		}
		var includeCustomerDetails = false;
		if (customerDetails && customerDetails === "true") {
			includeCustomerDetails = true;
		}
		var includeAnswers = false;
		if (answers && answers === "true") {
			includeAnswers = true;
		}
		
		var hasFilters = false;
		var divisionsMap = {};
		var compIdsMap = {};
		var productsMap = {};
		if (divisions && divisions !== "" && divisions !== "all") {
			if (divisions.indexOf(";") >= 0) {
				divisions.split(";").forEach(function(division) {
					divisionsMap[division] = 1;
				});
			} else {
				divisionsMap[divisions] = 1;
			}
			hasFilters = true;
		}
		if (componentIds && componentIds !== "") {
			if (componentIds.indexOf(",") >= 0) {
				componentIds.split(",").forEach(function(compId) {
					compIdsMap[compId] = 1;
				});
			} else {
				compIdsMap[componentIds] = 1;
			}
			hasFilters = true;
		}
		if (products && products !="") {
			if (products.indexOf(",") >= 0) {
				products.split(",").forEach(function(product) {
					productsMap[product] = 1;
				});
			} else {
				productsMap[products] = 1;
			}
			hasFilters = true;
		}
		
		// Get the list of tickets processed from logs DB identified by WFS00-NewTicketReceived log entries
		var design = ticketsKpiConfig.ticketsKpi.design_doc;
		var view = "ticketsProcessed";
		if (type && type !== "") {
			switch(type) {
				case "hw":
					view = "ticketsProcessedHW";
					break;
				case "sw":
					view = "ticketsProcessedSW";
					break;
			}
		}
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var ticketIds = [];
				var txIds = [];
				var tickets = [];
				result.rows.forEach(function(row) {
					if (row.value.ticketId && row.value.ticketId !== "") {
						ticketIds.push(row.value.ticketId);
						txIds.push(row.value.trId);
						tickets.push({
							ticket_id: row.value.ticketId,
							timestamp: row.key,
							tx_id: row.value.trId,
							log_id: row.id
						});
					}
				});
				//console.log(tickets.length);
				
				async.parallel({
					ticketDetails: function(callback) {
						dbTickets.fetch({keys: ticketIds}, function(err, result) {
							if (err) return callback(err);
							try {
								var count = 0;
								var ticketDetails = {};
								result.rows.forEach(function(row) {
									if (row.doc) {
										if (!ticketDetails[row.doc._id]) {
											ticketDetails[row.doc._id] = row.doc;
											count++;
										}
									}
								});
								callback(null, {count: count, details: ticketDetails});
							} catch(e) {
								callback(e);
							}
						});
					},
					answerDetails: function(callback) {
						var design = "ux";
						var view = "byTransaction";
						var qparams = {keys: txIds, include_docs: true};
						dbAnswers.view(design, view, qparams, function(err, result) {
							if (err) return callback(err);
							try {
								var count = 0;
								var answerDetails = {};
								result.rows.forEach(function(row) {
									if (row.doc) {
										if (!answerDetails[row.doc.pmr_complete.trID]) {
											answerDetails[row.doc.pmr_complete.trID] = row.doc;
											count++;
										}
									}
								});
								callback(null, {count: count, details: answerDetails});
							} catch(e) {
								callback(e);
							}
						});
					}
				}, function(error, results) {
					if (error) cb(error);
					var ticketDetails = results.ticketDetails.details;
					var answerDetails = results.answerDetails.details;
					
					try {
						var ticketsProcessed = [];
						var ticketsProcessedMap = {};
						tickets.forEach(function(ticket) {
							var addTicket = false;
							var compId = "";
							if (answerDetails[ticket.tx_id]) {
								compId = answerDetails[ticket.tx_id].pmr_complete.component_id;
								if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
									compId = answerDetails[ticket.tx_id].pmr_complete.machine_type;
								}
							} else if (ticketDetails[ticket.ticket_id]) {
								compId = ticketDetails[ticket.ticket_id].component_id;
								if (ticketDetails[ticket.ticket_id].pmr_type.toLowerCase() === "hardware") {
									compId = ticketDetails[ticket.ticket_id].machine_type;
								}
							}
								
							if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (ticket.timestamp > spotlightProducts[compId].start_date)) {
								var endDateCheckPassed = false;
								if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (ticket.timestamp < spotlightProducts[compId].end_date)) {
									endDateCheckPassed = true;
								} else if (!spotlightProducts[compId].end_date) {
									endDateCheckPassed = true;
								}
								
								if (endDateCheckPassed) {
									addTicket = true;
									var divisionMatch = true;
									if (!_.isEmpty(divisionsMap)) {
										addTicket = false;
										divisionMatch = false;
										for (division in divisionsMap) {
											if (!divisionMatch && componentIdsMap[compId] && (componentIdsMap[compId].division === division)) {
												divisionMatch = true;
											}
										}
									}
									var compIdMatch = true;
									if (!_.isEmpty(compIdsMap)) {
										addTicket = false;
										compIdMatch = false;
										for (id in compIdsMap) {
											if (!compIdMatch && id === compId) {
												compIdMatch = true;
											}
										}
									}
									var productMatch = true;
									if (!_.isEmpty(productsMap)) {
										addTicket = false;
										 productMatch = false;
										for (product in productsMap) {
											if (!productMatch && componentIdsMap[compId] && (componentIdsMap[compId].product_name.toLowerCase().indexOf(product.toLowerCase()) >= 0)) {
												productMatch = true;
											}
										}
									}
									if (divisionMatch && compIdMatch && productMatch) {
										addTicket = true;
									}
								}
							}
							
							if (addTicket) {
								if (answerDetails[ticket.tx_id]) {
									//console.log("answerDetails", ticket);
									//ticket["pmr_number"] = answerDetails[ticket.tx_id].pmr_complete.pmr_number;
									if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
										ticket["machine_type"] = answerDetails[ticket.tx_id].pmr_complete.machine_type;
									} else if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "software" || !answerDetails[ticket.tx_id].pmr_complete.pmr_type) {
										ticket["component_id"] = answerDetails[ticket.tx_id].pmr_complete.component_id;
										ticket["component_desc"] = answerDetails[ticket.tx_id].pmr_complete.component_desc;
									}
									if (includeDetails) {
										if (componentIdsMap[ticket.component_id]) {
											ticket["product_name"] = componentIdsMap[ticket.component_id].short_name;
											ticket["division"] = componentIdsMap[ticket.component_id].division;
										} else {
											ticket["product_name"] = "";
											ticket["division"] = "";
										}
										ticket["title"] = answerDetails[ticket.tx_id].pmr_complete.problem_title;
										ticket["description"] = answerDetails[ticket.tx_id].pmr_complete.problem_desc;
										ticket["country"] = answerDetails[ticket.tx_id].pmr_complete.country_code;
									}
									if (includeCustomerDetails) {
										ticket["company_name"] = answerDetails[ticket.tx_id].pmr_complete.company_name;
										ticket["customer_email"] = answerDetails[ticket.tx_id].pmr_complete.customer_email;
									}
									ticket["pmr_type"] = answerDetails[ticket.tx_id].pmr_complete.pmr_type;
									ticket["build"] = answerDetails[ticket.tx_id].build;
									if (includeAnswers) {
										ticket["answers"] = answerDetails[ticket.tx_id].answers;
									}
								} else if (ticketDetails[ticket.ticket_id]) {
									if (ticketDetails[ticket.ticket_id].pmr_type.toLowerCase() === "hardware") {
										ticket["machine_type"] = ticketDetails[ticket.ticket_id].machine_type;
									} else if (ticketDetails[ticket.ticket_id].pmr_type.toLowerCase() === "software" || !ticketDetails[ticket.ticket_id].pmr_type) {
										ticket["component_id"] = ticketDetails[ticket.ticket_id].component_id;
										ticket["component_desc"] = ticketDetails[ticket.ticket_id].component_desc;
									}
									if (includeDetails) {
										if (componentIdsMap[ticket.component_id]) {
											ticket["product_name"] = componentIdsMap[ticket.component_id].short_name;
											ticket["division"] = componentIdsMap[ticket.component_id].division;
										} else {
											ticket["product_name"] = "";
											ticket["division"] = "";
										}
										ticket["title"] = ticketDetails[ticket.ticket_id].problem_title;
										ticket["description"] = ticketDetails[ticket.ticket_id].problem_desc;
										ticket["country"] = ticketDetails[ticket.ticket_id].country_code;
									}
									if (includeCustomerDetails) {
										ticket["company_name"] = ticketDetails[ticket.ticket_id].company_name;
										ticket["customer_email"] = ticketDetails[ticket.ticket_id].customer_email;
									}
									ticket["pmr_type"] = ticketDetails[ticket.ticket_id].pmr_type;
								}

								if (countDuplicates) {
									ticketsProcessed.push(ticket);
								} else {
									ticketsProcessedMap[ticket.ticket_id] = ticket;
								}
							}
						});

						if (!countDuplicates) {
							for (id in ticketsProcessedMap) {
								ticketsProcessed.push(ticketsProcessedMap[id]);
							}
						}
						cb(null, {count: ticketsProcessed.length, tickets: ticketsProcessed});
					} catch(e) {
						cb(e);
					}
				});
				
				/*var design = "ux";
				var view = "byTransaction";
				var qparams = {keys: txIds, include_docs: true};
				// Get answers for tickets
				dbAnswers.view(design, view, qparams, function(err, result) {
					if (err) return cb(err);
					try {
						var answerDetails = {};
						result.rows.forEach(function(row) {
							if (row.doc) {
								if (!answerDetails[row.doc.pmr_complete.trID]) {
									answerDetails[row.doc.pmr_complete.trID] = row.doc;
									count++;
								}
							}
						});
						
						var count = 0;
						var ticketsProcessed = [];
						tickets.forEach(function(ticket) {
							var addTicket = false;
							if (answerDetails[ticket.tx_id]) {
								var compId = answerDetails[ticket.tx_id].pmr_complete.component_id;
								if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
									compId = answerDetails[ticket.tx_id].pmr_complete.machine_type;
								}
								
								if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (ticket.timestamp > spotlightProducts[compId].start_date)) {
									var endDateCheckPassed = false;
									if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (ticket.timestamp < spotlightProducts[compId].end_date)) {
										endDateCheckPassed = true;
									} else if (!spotlightProducts[compId].end_date) {
										endDateCheckPassed = true;
									}
									
									if (endDateCheckPassed) {
										addTicket = true;
										var divisionMatch = true;
										if (!_.isEmpty(divisionsMap)) {
											addTicket = false;
											divisionMatch = false;
											for (division in divisionsMap) {
												if (!divisionMatch && componentIdsMap[compId] && (componentIdsMap[compId].division === division)) {
													divisionMatch = true;
												}
											}
										}
										var compIdMatch = true;
										if (!_.isEmpty(compIdsMap)) {
											addTicket = false;
											compIdMatch = false;
											for (id in compIdsMap) {
												if (!compIdMatch && id === compId) {
													compIdMatch = true;
												}
											}
										}
										var productMatch = true;
										if (!_.isEmpty(productsMap)) {
											addTicket = false;
											 productMatch = false;
											for (product in productsMap) {
												if (!productMatch && componentIdsMap[compId] && (componentIdsMap[compId].product_name.toLowerCase().indexOf(product.toLowerCase()) >= 0)) {
													productMatch = true;
												}
											}
										}
										if (divisionMatch && compIdMatch && productMatch) {
											addTicket = true;
										}
									}
								}
							}
							
							if (addTicket) {
								if (answerDetails[ticket.tx_id]) {
									//console.log("answerDetails", ticket);
									//ticket["pmr_number"] = answerDetails[ticket.tx_id].pmr_complete.pmr_number;
									if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
										ticket["machine_type"] = answerDetails[ticket.tx_id].pmr_complete.machine_type;
									} else if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "software" || !answerDetails[ticket.tx_id].pmr_complete.pmr_type) {
										ticket["component_id"] = answerDetails[ticket.tx_id].pmr_complete.component_id;
										ticket["component_desc"] = answerDetails[ticket.tx_id].pmr_complete.component_desc;
									}
									if (includeDetails) {
										if (componentIdsMap[ticket.component_id]) {
											ticket["product_name"] = componentIdsMap[ticket.component_id].short_name;
											ticket["division"] = componentIdsMap[ticket.component_id].division;
										} else {
											ticket["product_name"] = "";
											ticket["division"] = "";
										}
										ticket["title"] = answerDetails[ticket.tx_id].pmr_complete.problem_title;
										ticket["description"] = answerDetails[ticket.tx_id].pmr_complete.problem_desc;
										ticket["country"] = answerDetails[ticket.tx_id].pmr_complete.country_code;
									}
									if (includeCustomerDetails) {
										ticket["company_name"] = answerDetails[ticket.tx_id].pmr_complete.company_name;
										ticket["customer_email"] = answerDetails[ticket.tx_id].pmr_complete.customer_email;
									}
									ticket["pmr_type"] = answerDetails[ticket.tx_id].pmr_complete.pmr_type;
									ticket["build"] = answerDetails[ticket.tx_id].build;
									if (includeAnswers) {
										ticket["answers"] = answerDetails[ticket.tx_id].answers;
									}
								}
								ticketsProcessed.push(ticket);
								count++;
							}
						});
						cb(null, {count: count, tickets: ticketsProcessed});
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
	 * Get details for Spotlight tickets processed, output to delimited TXT
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} answers - flag to include answers
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products = comma delimited list of products to filter by
	 * @param {string} customerDetails - flag to include customer details
	 * @param {string} delimiter - delimiter to use for output
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getSpotlightTicketsProcessedDetailsTxt: function(start, end, type, details, answers, divisions, componentIds, products, customerDetails, delimiter, cb) {
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getSpotlightTicketsProcessedDetails(start, end, type, details, answers, divisions, componentIds, products, customerDetails, function(err, result) {
			try {
				var data = [];
				var tickets = result.tickets;
				//for (id in tickets) {
				tickets.forEach(function(ticket) {
					var row = {
						ticket_id: ticket.ticket_id,
						timestamp: ticket.timestamp,
						pmr_type: ticket.pmr_type,
						component_id: ticket.component_id,
						component_desc: ticket.component_desc,
						machine_type: ticket.machine_type,
						product_name: ticket.product_name,
						division: ticket.division,
						country: ticket.country,
						title: ticket.title,
						description: ticket.description,
						build: ticket.build
					};
					
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
				
				json2csv({ data: data, fields: reportTxtFields, del: txtDelimiter }, function(err, tsv) {
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
	},
	
	/**
	 * Get details for Spotlight tickets processed through our whitelist.
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} answers - flag to include answers
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products = comma delimited list of products to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getSpotlightTicketsProcessedWhitelistDetails: function(start, end, type, details, answers, divisions, componentIds, products, cb) {
		var qparams = {reduce: false, include_docs: true};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		}
		
		var includeDetails = false;
		if (details && details === "true") {
			includeDetails = true;
		}
		var includeAnswers = false;
		if (answers && answers === "true") {
			includeAnswers = true;
		}
		
		var hasFilters = false;
		var divisionsMap = {};
		var compIdsMap = {};
		var productsMap = {};
		if (divisions && divisions !== "" && divisions !== "all") {
			if (divisions.indexOf(";") >= 0) {
				divisions.split(";").forEach(function(division) {
					divisionsMap[division] = 1;
				});
			} else {
				divisionsMap[divisions] = 1;
			}
			hasFilters = true;
		}
		if (componentIds && componentIds !== "") {
			if (componentIds.indexOf(",") >= 0) {
				componentIds.split(",").forEach(function(compId) {
					compIdsMap[compId] = 1;
				});
			} else {
				compIdsMap[componentIds] = 1;
			}
			hasFilters = true;
		}
		if (products && products !="") {
			if (products.indexOf(",") >= 0) {
				products.split(",").forEach(function(product) {
					productsMap[product] = 1;
				});
			} else {
				productsMap[products] = 1;
			}
			hasFilters = true;
		}
		
		var design = "ux";
		var view = "whitelist";
		if (type && type !== "") {
			switch(type) {
				case "hw":
					view = "whitelistHW";
					break;
				case "sw":
					view = "whitelistSW";
					break;
			}
		}
		
		// Get list of whitelist tickets based on whitelist flags found in the answer docs
		dbAnswers.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var ticketIds = [];
				var tickets = [];
				var answerDetails = {};
				result.rows.forEach(function(row) {
					if (row.value[0] && row.value[0] !== "") {
						ticketIds.push(row.value[0]);
						tickets.push({
							ticket_id: row.value[0],
							timestamp: row.key,
							tx_id: row.value[1]
						});
						if (row.value[1] && row.value[1] !== "" && !answerDetails[row.value[1]]) {
							answerDetails[row.value[1]] = row.doc;
						}
					}
				});
				//console.log(tickets.length);

				var ticketsProcessed = [];
				var ticketsMap = {};
				tickets.forEach(function(ticket) {
					var addTicket = false;
					if (answerDetails[ticket.tx_id]) {
						var compId = answerDetails[ticket.tx_id].pmr_complete.component_id;
						if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
							compId = answerDetails[ticket.tx_id].pmr_complete.machine_type;
						}
						
						if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (ticket.timestamp > spotlightProducts[compId].start_date)) {
							var endDateCheckPassed = false;
							if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (ticket.timestamp < spotlightProducts[compId].end_date)) {
								endDateCheckPassed = true;
							} else if (!spotlightProducts[compId].end_date) {
								endDateCheckPassed = true;
							}
							
							if (endDateCheckPassed) {
								addTicket = true;
								var divisionMatch = true;
								if (!_.isEmpty(divisionsMap)) {
									addTicket = false;
									divisionMatch = false
									for (division in divisionsMap) {
										if (!divisionMatch && componentIdsMap[compId] && (componentIdsMap[compId].division === division)) {
											divisionMatch = true;
										}
									}
								}
								var compIdMatch = true;
								if (!_.isEmpty(compIdsMap)) {
									addTicket = false;
									compIdMatch = false;
									for (id in compIdsMap) {
										if (!compIdMatch && id === compId) {
											compIdMatch = true;
										}
									}
								}
								var productMatch = true;
								if (!_.isEmpty(productsMap)) {
									addTicket = false;
									productMatch = false;
									for (product in productsMap) {
										if (!productMatch && componentIdsMap[compId] && (componentIdsMap[compId].product_name.toLowerCase().indexOf(product.toLowerCase()) >= 0)) {
											productMatch = true;
										}
									}
								}
								if (divisionMatch && compIdMatch && productMatch) {
									addTicket = true;
								}
							}
						}
					}
						
					if (addTicket) {
						if (answerDetails[ticket.tx_id]) {
							if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
								ticket["machine_type"] = answerDetails[ticket.tx_id].pmr_complete.machine_type;
							} else if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "software" || !answerDetails[ticket.tx_id].pmr_complete.pmr_type) {
								ticket["component_id"] = answerDetails[ticket.tx_id].pmr_complete.component_id;
								ticket["component_desc"] = answerDetails[ticket.tx_id].pmr_complete.component_desc;
							}
							if (includeDetails) {
								if (componentIdsMap[ticket.component_id]) {
									ticket["product_name"] = componentIdsMap[ticket.component_id].short_name;
									ticket["division"] = componentIdsMap[ticket.component_id].division;
								} else {
									ticket["product_name"] = "";
									ticket["division"] = "";
								}
								ticket["title"] = answerDetails[ticket.tx_id].pmr_complete.problem_title;
								ticket["description"] = answerDetails[ticket.tx_id].pmr_complete.problem_desc;
								ticket["country"] = answerDetails[ticket.tx_id].pmr_complete.country_code;
							}
							ticket["pmr_type"] = answerDetails[ticket.tx_id].pmr_complete.pmr_type;
							ticket["build"] = answerDetails[ticket.tx_id].build;
							if (includeAnswers) {
								ticket["answers"] = answerDetails[ticket.tx_id].answers;
							}
						}
						if (countDuplicates) {
							ticketsProcessed.push(ticket);
						} else {
							ticketsMap[ticket.ticket_id] = ticket;
						}
					}
				});
				if (!countDuplicates) {
					for (id in ticketsMap) {
						ticketsProcessed.push(ticketsMap[id]);
					}
				}
				cb(null, {count: ticketsProcessed.length, tickets: ticketsProcessed});
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Get details for Spotlight tickets processed through our whitelist, output to delimited TXT.
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} answers - flag to include answers
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products = comma delimited list of products to filter by
	 * @param {string} delimiter - delimiter to use for output
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getSpotlightTicketsProcessedWhitelistDetailsTxt: function(start, end, type, details, answers, divisions, componentIds, products, delimiter, cb) {
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getSpotlightTicketsProcessedWhitelistDetails(start, end, type, details, answers, divisions, componentIds, products, function(err, result) {
			if (err) return cb(err);
			try {
				var data = [];
				var tickets = result.tickets;
				tickets.forEach(function(ticket) {
					var row = {
						ticket_id: ticket.ticket_id,
						timestamp: ticket.timestamp,
						pmr_type: ticket.pmr_type,
						component_id: ticket.component_id,
						component_desc: ticket.component_desc,
						machine_type: ticket.machine_type,
						product_name: ticket.product_name,
						division: ticket.division,
						country: ticket.country,
						title: ticket.title,
						description: ticket.description,
						build: ticket.build
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
				
				json2csv({ data: data, fields: reportTxtFields, del: txtDelimiter }, function(err, tsv) {
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
	},
	
	/**
	 * Get details for the Spotlight tickets that were updated
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} answers - flag to include answers
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of tickets
	 */
	getSpotlightTicketsUpdatedDetails: function(start, end, type, details, answers, divisions, componentIds, products, cb) {
		var qparams = {reduce: false};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		}
		
		var includeDetails = false;
		var includeAnswers = false;
		if (details && details === "true") {
			includeDetails = true;
		}
		if (answers && answers === "true") {
			includeAnswers = true;
		}
		
		var hasFilters = false;
		var divisionsMap = {};
		var compIdsMap = {};
		var productsMap = {};
		if (divisions && divisions !== "" && divisions !== "all") {
			if (divisions.indexOf(";") >= 0) {
				divisions.split(";").forEach(function(division) {
					divisionsMap[division] = 1;
				});
			} else {
				divisionsMap[divisions] = 1;
			}
			hasFilters = true;
		}
		if (componentIds && componentIds !== "") {
			if (componentIds.indexOf(",") >= 0) {
				componentIds.split(",").forEach(function(compId) {
					compIdsMap[compId.trim()] = 1;
				});
			} else {
				compIdsMap[componentIds.trim()] = 1;
			}
			hasFilters = true;
		}
		if (products && products !="") {
			if (products.indexOf(",") >= 0) {
				products.split(",").forEach(function(product) {
					productsMap[product] = 1;
				});
			} else {
				productsMap[products] = 1;
			}
			hasFilters = true;
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
				var txIds = [];
				var tickets = [];
				//var logData = {};
				result.rows.forEach(function(row) {
					txIds.push(row.value.trId);
					//logData[row.value.trId] = { logId: row.id, ticketId: row.value.ticketId, timestamp: row.key};
					tickets.push({
						ticket_id: row.value.ticketId,
						timestamp: row.key,
						tx_id: row.value.trId,
						log_id: row.id
					});
				});
				
				// Get answers for tickets based on transaction ID 
				var design = "ux";
				var view = "byTransaction";
				var qparams = {keys:txIds, include_docs:true};
				dbAnswers.view(design, view, qparams, function(err, result) {
					if (err) return cb(err);
					try {
						var answerDetails = {};
						result.rows.forEach(function(row) {
							if (row.doc) {
								if (!answerDetails[row.doc.pmr_complete.trID]) {
									answerDetails[row.doc.pmr_complete.trID] = row.doc;
								}
							}
						});

						var ticketsUpdated = [];
						var ticketsMap = {};
						tickets.forEach(function(ticket) {
							var addTicket = false;
							if (answerDetails[ticket.tx_id]) {
								var compId = answerDetails[ticket.tx_id].pmr_complete.component_id;
								if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
									compId = answerDetails[ticket.tx_id].pmr_complete.machine_type;
								}
								
								if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (ticket.timestamp > spotlightProducts[compId].start_date)) {
									var endDateCheckPassed = false;
									if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (ticket.timestamp < spotlightProducts[compId].end_date)) {
										endDateCheckPassed = true;
									} else if (!spotlightProducts[compId].end_date) {
										endDateCheckPassed = true;
									}
									
									if (endDateCheckPassed) {
										addTicket = true;
										var divisionMatch = true;
										if (!_.isEmpty(divisionsMap)) {
											addTicket = false;
											divisionMatch = false;
											for (division in divisionsMap) {
												if (!divisionMatch && componentIdsMap[compId] && (componentIdsMap[compId].division === division)) {
													divisionMatch = true;
												}
											}
										}
										var compIdMatch = true;
										if (!_.isEmpty(compIdsMap)) {
											addTicket = false;
											compIdMatch = false;
											for (id in compIdsMap) {
												if (!compIdMatch && id === compId) {
													compIdMatch = true;
												}
											}
										}
										var productMatch = true;
										if (!_.isEmpty(productsMap)) {
											addTicket = false;
											 productMatch = false;
											for (product in productsMap) {
												if (!productMatch && componentIdsMap[compId] && (componentIdsMap[compId].product_name.toLowerCase().indexOf(product.toLowerCase()) >= 0)) {
													productMatch = true;
												}
											}
										}
										if (divisionMatch && compIdMatch && productMatch) {
											addTicket = true;
										}
									}
								}

							}
							
							if (addTicket) {
								if (answerDetails[ticket.tx_id]) {
									if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
										ticket["machine_type"] = answerDetails[ticket.tx_id].pmr_complete.machine_type;
									} else if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "software" || !answerDetails[ticket.tx_id].pmr_complete.pmr_type) {
										ticket["component_id"] = answerDetails[ticket.tx_id].pmr_complete.component_id;
										ticket["component_desc"] = answerDetails[ticket.tx_id].pmr_complete.component_desc;
									}
									if (includeDetails) {
										if (componentIdsMap[ticket.component_id]) {
											ticket["product_name"] = componentIdsMap[ticket.component_id].short_name;
											ticket["division"] = componentIdsMap[ticket.component_id].division;
										} else {
											ticket["product_name"] = "";
											ticket["division"] = "";
										}
										ticket["title"] = answerDetails[ticket.tx_id].pmr_complete.problem_title;
										ticket["description"] = answerDetails[ticket.tx_id].pmr_complete.problem_desc;
										ticket["country"] = answerDetails[ticket.tx_id].pmr_complete.country_code;
										
									}
									ticket["pmr_type"] = answerDetails[ticket.tx_id].pmr_complete.pmr_type;
									ticket["build"] = answerDetails[ticket.tx_id].build;
									if (includeAnswers) {
										var confidentAnswers = [];
										answerDetails[ticket.tx_id].answers.forEach(function(answer) {
											var addAnswer = false;
											if (answer.confidence && answer.confidence !== "LOW") {
												if (answer.ticket_updated) {
													addAnswer = true;
												} else if (typeof answer.ticket_updated === "undefined") {
													addAnswer = true;
												}
											} else if (!answer.confidence) {
												addAnswer = true;
											}
											
											if (addAnswer) {
												confidentAnswers.push(answer);
											}
										});
										ticket["answers"] = confidentAnswers;
									}
								}
								if (countDuplicates) {
									ticketsUpdated.push(ticket);
								} else {
									ticketsMap[ticket.ticket_id] = ticket;
								}
							}
						});
						if (!countDuplicates) {
							for (id in ticketsMap) {
								ticketsUpdated.push(ticketsMap[id]);
							}
						}
						cb(null, {count: ticketsUpdated.length, tickets: ticketsUpdated});
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
	 * Get details for the Spotlight tickets that were updated, output to delimited TXT
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} answers - flag to include answers
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} delimiter - delimiter to use for output
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of tickets
	 */
	getSpotlightTicketsUpdatedDetailsTxt: function(start, end, type, details, answers, divisions, componentIds, products, delimiter, cb) {
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getSpotlightTicketsUpdatedDetails(start, end, type, details, answers, divisions, componentIds, products, function(err, result) {
			if (err) return cb(err);
			try {
				var data = [];
				var tickets = result.tickets;
				tickets.forEach(function(ticket) {
					var row = {
						ticket_id: ticket.ticket_id,
						timestamp: ticket.timestamp,
						pmr_type: ticket.pmr_type,
						component_id: ticket.component_id,
						component_desc: ticket.component_desc,
						machine_type: ticket.machine_type,
						product_name: ticket.product_name,
						division: ticket.division,
						country: ticket.country,
						title: ticket.title,
						description: ticket.description,
						build: ticket.build
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
				
				json2csv({ data: data, fields: reportTxtFields, del: txtDelimiter }, function(err, tsv) {
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
	},
	
	/**
	 * Get KMM responses for Spotlight tickets that were updated
	 * Tickets that are updated by our solution have a log entry with messageId=WFS00-TicketWriterSent
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} output - determine output, either dashboard stats or raw data [dashboard|statsbyday|data]
	 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getSpotlightTicketsUpdatedKMM: function(start, end, output, response, type, details, divisions, componentIds, products, cb) {
		var outputType = "dashboard";
		var responseType = "all";
		var divisionsMap = {};
		var compIdsMap = {};
		var productsMap = {};
		
		if (output && output !== "") {
			outputType = output;
		}
		
		var hasFilters = false;
		if (response && response !== "" && response !== "all") {
			responseType = response;
			hasFilters = true
		}
		if (divisions && divisions !== "" && divisions !== "all") {
			if (divisions.indexOf(";") >= 0) {
				divisions.split(";").forEach(function(division) {
					divisionsMap[division] = 1;
				});
			} else {
				divisionsMap[divisions] = 1;
			}
			hasFilters = true;
		}
		if (componentIds && componentIds !== "") {
			if (componentIds.indexOf(",") >= 0) {
				componentIds.split(",").forEach(function(compId) {
					compIdsMap[compId.trim()] = 1;
				});
			} else {
				compIdsMap[componentIds.trim()] = 1;
			}
			hasFilters = true;
		}
		if (products && products !="") {
			if (products.indexOf(",") >= 0) {
				products.split(",").forEach(function(product) {
					productsMap[product] = 1;
				});
			} else {
				productsMap[products] = 1;
			}
			hasFilters = true;
		}
		
		var includeDetails = false;
		if (details && details === "true") {
			includeDetails = true;
		}
		
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
				var tickets = [];
				var ticketIds = [];
				var txIds = [];
				var ticketsMap = {};
				result.rows.forEach(function(row) {
					if (row.value.ticketId && row.value.ticketId !== "null") {
						if (countDuplicates) {
							tickets.push({
								ticket_id: row.value.ticketId,
								timestamp: row.key,
								tx_id: row.value.trId,
								log_id: row.id
							});
							ticketIds.push(row.value.ticketId);
							txIds.push(row.value.trId);
						} else {
							ticketsMap[row.value.ticketId] = {
								ticket_id: row.value.ticketId,
								timestamp: row.key,
								tx_id: row.value.trId,
								log_id: row.id
							}
						}
					}
				});
				if (!countDuplicates) {
					for (id in ticketsMap) {
						tickets.push(ticketsMap[id]);
						ticketIds.push(ticketsMap[id].ticket_id);
						txIds.push(ticketsMap[id].tx_id);
					}
				}
				
				async.parallel({
					ticketAnswersByTxId: function(callback) {
						// Get answers for tickets based on transaction ID 
						var design = "ux";
						var view = "byTransaction";
						var qparams = {keys:txIds, include_docs:true};
						dbAnswers.view(design, view, qparams, function(err, result) {
							if (err) return callback(err);
							try {
								var countAnswers = 0;
								var answerDetails = {};
								result.rows.forEach(function(row) {
									if (row.doc) {
										if (!answerDetails[row.doc.pmr_complete.trID]) {
											answerDetails[row.doc.pmr_complete.trID] = row.doc;
											countAnswers++;
										}
									}
								});
								callback(null, {count: countAnswers, answer_details: answerDetails});
							} catch(e) {
								callback(e)
							}
						});
					},
					ticketKMM: function(callback) {
						if (!type || (type && type !== "hw")) {
							// Get the KMM responses for tickets
							var design = "ux";
							var view = "kmmResponsesByTicket";
							var qparams = {keys: ticketIds, include_docs: true};
							dbPmrsMetrics.view(design, view, qparams, function(err, result) {
								if (err) return cb(err);
								try {
									var countKMM = 0;
									var kmmDetails = {};
									result.rows.forEach(function(row) {
										if (!kmmDetails[row.doc.ticket_id]) {
											kmmDetails[row.doc.ticket_id] = [row.doc];
										} else {
											kmmDetails[row.doc.ticket_id].push(row.doc);
										}
										countKMM++;
									});
									callback(null, {count: countKMM, kmm_details: kmmDetails});
								} catch(e) {
									callback(e);
								}
							});
						} else {
							callback(null, {count: 0, kmm_details: {}});
						}
					},
					ticketDetails: function(callback) {
						// Get the tickets
						dbTickets.fetch({keys: ticketIds}, function(err, result) {
							if (err) return cb(err);
							try {
								var countTickets = 0;
								var ticketDetails = {};
								result.rows.forEach(function(row) {
									if (row.doc) {
										if (!ticketDetails[row.doc._id]) {
											ticketDetails[row.doc._id] = row.doc;
											countTickets++;
										}
									}
								});
								callback(null, {count: countTickets, ticket_details: ticketDetails});
							} catch(e) {
								callback(e);
							}
						});
					}
				}, function(error, results) {
					if (error) cb(error);
					
					var answerDetailsByTxID = results.ticketAnswersByTxId.answer_details;
					var kmmDetails = results.ticketKMM.kmm_details;
					var ticketDetails = results.ticketDetails.ticket_details;
					
					// Construct ticket data for output by combining answers with KMM
					var kmmStats = {
						kmm_r: 0,
						kmm_y: 0,
						kmm_n: 0,
						kmm_u: 0,
						kmm_x: 0,
						kmm_none: 0
					};
					kmmByDay = {};
					var countTickets = 0;
					var countTicketsFiltered = 0;
					var ticketsFiltered = [];
					tickets.forEach(function(ticket) {
						countTickets++;
						
						var hasAnswers = false;
						var responseTypeMatch = false;
						var confidentAnswers = [];
						var compId = "";
						if (answerDetailsByTxID[ticket.tx_id]) {
							compId = answerDetailsByTxID[ticket.tx_id].pmr_complete.component_id;
							if (answerDetailsByTxID[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
								compId = answerDetailsByTxID[ticket.tx_id].pmr_complete.machine_type;
							}
							
							hasAnswers = true;
							if (answerDetailsByTxID[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
								ticket["machine_type"] = answerDetailsByTxID[ticket.tx_id].pmr_complete.machine_type;
							} else if (answerDetailsByTxID[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "software" || !answerDetailsByTxID[ticket.tx_id].pmr_complete.pmr_type) {
								ticket["component_id"] = answerDetailsByTxID[ticket.tx_id].pmr_complete.component_id;
								ticket["component_desc"] = answerDetailsByTxID[ticket.tx_id].pmr_complete.component_desc;
							}
							if (componentIdsMap[ticket.component_id]) {
								ticket["product_name"] = componentIdsMap[ticket.component_id].short_name;
								ticket["division"] = componentIdsMap[ticket.component_id].division;
							} else {
								ticket["product_name"] = "";
								ticket["division"] = "";
							}
							
							if (includeDetails) {
								ticket["title"] = answerDetailsByTxID[ticket.tx_id].pmr_complete.problem_title;
								ticket["description"] = answerDetailsByTxID[ticket.tx_id].pmr_complete.problem_desc;
							}
							if (ticketDetails[ticket.ticket_id]) {								
								var status = "Open";
								if(ticketDetails[ticket.ticket_id].status) {
									status = ticketDetails[ticket.ticket_id].status;									
								}
								ticket['status'] = status;
								
								var closeDate = "";
								if(ticketDetails[ticket.ticket_id].close_date) {
									closeDate = ticketDetails[ticket.ticket_id].close_date;									
								}
								ticket['close_date'] = closeDate;
								
								var ownerName = "";
								if(ticketDetails[ticket.ticket_id].owner_name) {
									ownerName = ticketDetails[ticket.ticket_id].owner_name;
								}
								ticket['owner_name'] = ownerName;
								
								var resolverName = "";
								if(ticketDetails[ticket.ticket_id].resolver_name) {
									resolverName = ticketDetails[ticket.ticket_id].resolver_name;
								}
								ticket['resolver_name'] = resolverName;
								
								var ownerId = "";
								if(ticketDetails[ticket.ticket_id].owner_id) {
									ownerId = ticketDetails[ticket.ticket_id].owner_id;
								}
								ticket['owner_id'] = ownerId;
							} else { // If the ticket is not found in the db then fill in all the fields with empty values
								ticket['status'] = "NA";
								ticket['close_date'] = "NA";
								ticket['owner_name'] = "NA";
								ticket['resolver_name'] = "NA";
								ticket['owner_id'] = "NA";
							}
							
							ticket["country"] = answerDetailsByTxID[ticket.tx_id].pmr_complete.country_code;
							ticket["pmr_type"] = answerDetailsByTxID[ticket.tx_id].pmr_complete.pmr_type;
							ticket["build"] = answerDetailsByTxID[ticket.tx_id].build;
							
							answerDetailsByTxID[ticket.tx_id].answers.forEach(function(answer) {
								var addAnswer = false;
								var ignore = false;
								if (answer.ir_engine && irEngineIgnoreList[answer.ir_engine]) {
									ignore = true;
								}
								if (!ignore) {
									if (answer.confidence && answer.confidence !== "LOW") {
										if (answer.ticket_updated) {
											addAnswer = true;
										} else if (typeof answer.ticket_updated === "undefined") {
											addAnswer = true;
										}
									} else if (!answer.confidence) {
										addAnswer = true;
									}
								}

								if (addAnswer) {
									confidentAnswers.push(answer);
								}
							});
							ticket["answers"] = confidentAnswers;
						} else {
							if (responseType === "none") {
								responseTypeMatch = true;
							}
						}
						
						var passedFilters = false;
						if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (ticket.timestamp > spotlightProducts[compId].start_date)) {
							var endDateCheckPassed = false;
							if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (ticket.timestamp < spotlightProducts[compId].end_date)) {
								endDateCheckPassed = true;
							} else if (!spotlightProducts[compId].end_date) {
								endDateCheckPassed = true;
							}
							
							if (endDateCheckPassed) {
								passedFilters = true;
								var divisionMatch = true;
								if (!_.isEmpty(divisionsMap)) {
									passedFilters = false;
									divisionMatch = false;
									for (division in divisionsMap) {
										if (!divisionMatch && componentIdsMap[ticket.component_id] && (componentIdsMap[ticket.component_id].division === division)) {
											divisionMatch = true;
										}
									}
								}
								var compIdMatch = true;
								if (!_.isEmpty(compIdsMap)) {
									passedFilters = false;
									compIdMatch = false;
									for (id in compIdsMap) {
										if (!compIdMatch && (id === ticket.component_id || id === ticket.machine_type)) {
											compIdMatch = true;
										}
									}
								}
								var productMatch = true;
								if (!_.isEmpty(productsMap)) {
									passedFilters = false;
									productMatch = false;
									for (product in productsMap) {
										if (!productMatch && componentIdsMap[ticket.component_id] && (componentIdsMap[ticket.component_id].product_name.toLowerCase().indexOf(product.toLowerCase()) >= 0)) {
											productMatch = true;
										}
									}
								}
								
								if (divisionMatch && compIdMatch && productMatch) {
									passedFilters = true;
								}
							}
						}
						
						var addTicket = false;
						if (passedFilters) {
							if (hasAnswers) {
								if (confidentAnswers.length) {
									var timestamp = ticket.timestamp.substring(0,10);
									var bestAnswer = "";
									confidentAnswers.forEach(function(answer) {
										//var answerHasKMM = false;
										if (kmmDetails[ticket.ticket_id]) {
											//console.log(kmmDetails[ticket.ticket_id]);
											kmmDetails[ticket.ticket_id].forEach(function(kmm) {
												var match = false;
												if (kmm.content_id && kmm.content_id !== "") {
													if (answer.id && answer.id.indexOf(kmm.content_id) >= 0) {
														match = true;
														//answerHasKMM = true;
													} else if (answer.url && answer.url.indexOf(kmm.content_id) >=0) {
														match = true;
														//answerHasKMM = true;
													}
												}
												if (match) {
													if (answer["contrib_ind"]) {
														var existingActionTimestamp = answer["action_dt"] + " " + answer["action_tm"];
														var newActionTimestamp = kmm.action_dt + " " + kmm.action_tm;
														if (newActionTimestamp > existingActionTimestamp) {
															answer["contrib_ind"] = kmm.contrib_ind;
															answer["content_src"] = kmm.content_src;
															answer["content_id"] = kmm.content_id;
															answer["action_dt"] = kmm.action_dt;
															answer["action_tm"] = kmm.action_tm;
														}
													} else {
														answer["contrib_ind"] = kmm.contrib_ind;
														answer["content_src"] = kmm.content_src;
														answer["content_id"] = kmm.content_id;
														answer["action_dt"] = kmm.action_dt;
														answer["action_tm"] = kmm.action_tm;
													}
												}
											});
										}
										/*else if (answer.feedback && answer.feedback.contrib_ind) {
											console.log(answer.feedback.contrib_ind);
											//answerHasKMM = true;
										}*/
										
										if (responseType !== "all" && !responseTypeMatch) {
											if (responseType === "none") {
												if (!answer.contrib_ind) {
													addTicket = true;
												}
											} else {
												if (answer.contrib_ind && answer.contrib_ind === responseType) {
													addTicket = true;
												} else if (answer.feedback && answer.feedback.contrib_ind && answer.feedback.contrib_ind === responseType) {
													addTicket = true;
												}
											}
										} else {
											addTicket = true;
										}
									});

									if (addTicket) {
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
										confidentAnswers.forEach(function(answer) {
											var contribInd = "";
											if (ticket.pmr_type.toLowerCase() === "software" && answer.contrib_ind) {
												contribInd = answer.contrib_ind;
											} else if (ticket.pmr_type.toLowerCase() === "hardware" && answer.feedback && answer.feedback.contrib_ind) {
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
									}

									if (bestAnswer) {
										kmmStats["kmm_" + bestAnswer.toLowerCase()]++;
										kmmByDay[timestamp]["kmm_" + bestAnswer.toLowerCase()]++;
									}
								}
							}
						}
						
						if (addTicket) {
							ticketsFiltered.push(ticket);
							countTicketsFiltered++;
						}
					});
					
					// If output is "dashboard" return overall dashboard stats
					if (outputType === "dashboard") {
						cb(null, {count: countTicketsFiltered, kmm: kmmStats});
					// If output is "statsbyday" return stats broken down by day
					} else if (outputType === "statsbyday") {
						cb(null, {count: countTicketsFiltered, tickets_updated_kmm_by_day: kmmByDay})
					// Else return ticket data
					} else {
						if (hasFilters) {
							var params = {
								start: start,
								end: end,
								response_type: response,
								division: divisions,
								component_ids: componentIds,
								products: products
							};
							cb(null, {params: params, count: countTicketsFiltered, tickets: ticketsFiltered});
						} else {
							cb(null, {count: countTicketsFiltered, tickets: ticketsFiltered});
						}
					}
				});
			} catch(e) {
				cb(e);
			}
		});
	},

	/**
	 * Get KMM responses for Spotlight tickets that were updated
	 * Tickets that are updated by our solution have a log entry with messageId=WFS00-TicketWriterSent
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} output - determine output, either dashboard stats or raw data [dashboard|statsbyday|data]
	 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getSpotlightTicketsUpdatedKMMCache: function(start, end, output, response, type, divisions, componentIds, products, cb) {
		var startDate = "";
		var endDate = "";
		var outputType = "dashboard";
		var responseType = "all";
		var pmrType = "all";
		var divisionsMap = {};
		var compIdsMap = {};
		var productsMap = {};

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

		if (type && type !== "") {
			switch(type) {
				case "hw":
					pmrType = "hardware";
					break;
				case "sw":
					pmrType = "software";
					break;
			}
		}

		if (divisions && divisions !== "" && divisions !== "all") {
			if (divisions.indexOf(";") >= 0) {
				divisions.split(";").forEach(function(division) {
					divisionsMap[division] = 1;
				});
			} else {
				divisionsMap[divisions] = 1;
			}
		}
		if (componentIds && componentIds !== "") {
			if (componentIds.indexOf(",") >= 0) {
				componentIds.split(",").forEach(function(compId) {
					compIdsMap[compId.trim()] = 1;
				});
			} else {
				compIdsMap[componentIds.trim()] = 1;
			}
		}
		if (products && products !="") {
			if (products.indexOf(",") >= 0) {
				products.split(",").forEach(function(product) {
					productsMap[product] = 1;
				});
			} else {
				productsMap[products] = 1;
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
							var divisionMatch = true;
							if (!_.isEmpty(divisionsMap)) {
								divisionMatch = false;
								for (division in divisionsMap) {
									if (!divisionMatch && componentIdsMap[ticket.component_id] && (componentIdsMap[ticket.component_id].division === division)) {
										divisionMatch = true;
									}
								}
							}
							var compIdMatch = true;
							if (!_.isEmpty(compIdsMap)) {
								compIdMatch = false;
								for (id in compIdsMap) {
									if (!compIdMatch && (id === ticket.component_id || id === ticket.machine_type)) {
										compIdMatch = true;
									}
								}
							}
							var productMatch = true;
							if (!_.isEmpty(productsMap)) {
								productMatch = false;
								for (product in productsMap) {
									if (!productMatch && componentIdsMap[ticket.component_id] && (componentIdsMap[ticket.component_id].product_name.toLowerCase().indexOf(product.toLowerCase()) >= 0)) {
										productMatch = true;
									}
								}
							}

							if (afterStart && beforeEnd && responseTypeMatch && pmrTypeMatch && divisionMatch && compIdMatch && productMatch) {
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
									if (ticket.pmr_type.toLowerCase() === "software" && answer.contrib_ind) {
										contribInd = answer.contrib_ind;
									} else if (ticket.pmr_type.toLowerCase() === "hardware" && answer.feedback && answer.feedback.contrib_ind) {
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
					cb(null, {count: tickets.length, tickets: tickets});
				}
			} catch(e) {
				cb(e);
			}
		});
	},

	/**
	 * Get KMM responses for Spotlight tickets that were updated formatted in a delimited text
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} delimiter - delimiter to use for output
	 * @param {string} stream - flag to determine whether to send stream back as a response or just text
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {string} - delmited text
	 */
	getSpotlightTicketsUpdatedKMMTxt: function(start, end, response, type, divisions, componentIds, products, delimiter, stream, cb) {
		var streamResponse = true;
		if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
			streamResponse = false;
		}
		
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getSpotlightTicketsUpdatedKMM(start, end, "data", response, type, false, divisions, componentIds, products, function(err, result) {
			try {
				var data = [];
				var tickets = result.tickets;
				//for (id in tickets) {
				tickets.forEach(function(ticket) {
					var answers = ticket.answers;
					if (answers && answers.length > 0) {
						answers.forEach(function(answer) {
							var title = answer.title;
							if (title && title !== "") {
								title = title.replace(/(\r\n|\n|\r)/gm,"");
							}
							var contribInd = "";
							var actionDt = "";
							var actionTm = "";
							if (ticket.pmr_type.toLowerCase() === "software" && answer.contrib_ind) {
								contribInd = answer.contrib_ind;
								actionDt = answer.action_dt;
								actionTm = answer.action_tm;
							} else if (ticket.pmr_type.toLowerCase() === "hardware" && answer.feedback && answer.feedback.contrib_ind) {
								contribInd = answer.feedback.contrib_ind;
								actionDt = answer.feedback.action_dt;
							}
							var row = {
								ticket_id: ticket.ticket_id,
								timestamp: ticket.timestamp,
								status: ticket.status,
								close_date: ticket.close_date,
								component_id: ticket.component_id,
								component_desc: ticket.component_desc,
								machine_type: ticket.machine_type,
								product_name: ticket.product_name,
								division: ticket.division,
								country: ticket.country,
								owner_name: ticket.owner_name,
								owner_id: ticket.owner_id,
								resolver_name: ticket.resolver_name,
								answer_id: answer.id,
								answer_url: answer.url,
								answer_title: title,
								answer_score: answer.score,
								answer_ranker_score: answer.ranker_score,
								answer_rank_score: answer.rank_score,
								answer_ir_engine: answer.ir_engine,
								answer_ir_engine_id: answer.ir_engine_id,
								answer_confidence: answer.confidence,
								answer_contrib_ind: contribInd,
								answer_content_src: answer.content_src,
								answer_action_dt: actionDt,
								answer_action_tm: actionTm
							};
							data.push(row);
						});
					} else {
						var row = {
							ticket_id: ticket.ticket_id,
							timestamp: ticket.timestamp,
							status: ticket.status,
							close_date: ticket.close_date,
							component_id: ticket.component_id,
							component_desc: ticket.component_desc,
							machine_type: ticket.machine_type,
							product_name: ticket.product_name,
							division: ticket.division,
							country: ticket.country,
							owner_name: ticket.owner_name,
							owner_id: ticket.owner_id,
							resolver_name: ticket.resolver_name
						};
						data.push(row);
					}
					
				});
				
				json2csv({ data: data, fields: reportTxtFieldsTicketsUpdatedKMM, del: txtDelimiter }, function(err, tsv) {
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
	},
	
	/**
	 * Get KMM responses for Spotlight tickets that were updated formatted in a delimited text
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} delimiter - delimiter to use for output
	 * @param {string} stream - flag to determine whether to send stream back as a response or just text
	 * @param {string} format - type of output format [default|flat|min]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {string} - delmited text
	 */
	getSpotlightTicketsUpdatedKMMCacheTxt: function(start, end, response, type, divisions, componentIds, products, delimiter, stream, format, cb) {
		var streamResponse = true;
		if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
			streamResponse = false;
		}
		
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getSpotlightTicketsUpdatedKMMCache(start, end, "data", response, type, divisions, componentIds, products, function(err, result) {
			try {
				var tickets = result.tickets;
				var fields = reportTxtFieldsTicketsUpdatedKMM;
				var data = [];
				switch(format) {
					case "flat":
						fields = reportTxtFieldsTicketsUpdatedKMMFlat;
						tickets.forEach(function(ticket) {
							var row = {
								ticket_id: ticket.ticket_id,
								timestamp: ticket.timestamp,
								status: ticket.status,
								close_date: ticket.close_date,
								component_id: ticket.component_id,
								component_desc: ticket.component_desc,
								machine_type: ticket.machine_type,
								product_name: ticket.product_name,
								division: ticket.division,
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
									if (ticket.pmr_type.toLowerCase() === "software" && answer.contrib_ind) {
										contribInd = answer.contrib_ind;
										actionDt = answer.action_dt;
										actionTm = answer.action_tm;
									} else if (ticket.pmr_type.toLowerCase() === "hardware" && answer.feedback && answer.feedback.contrib_ind) {
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
					case "min":
						fields = reportTxtFieldsTicketsUpdatedKMMMin;
						tickets.forEach(function(ticket) {
							var row = {
								ticket_id: ticket.ticket_id,
								timestamp: ticket.timestamp,
								component_id: ticket.component_id,
								machine_type: ticket.machine_type,
								country: ticket.country,
							}
							var answers = ticket.answers;
							if (answers && answers.length) {
								var answerPos = 1;
								answers.forEach(function(answer) {
									var answerLabel = "answer" + answerPos;
									row[answerLabel + "_id"] = answer.id;
									var contribInd = "";
									if (ticket.pmr_type.toLowerCase() === "software" && answer.contrib_ind) {
										contribInd = answer.contrib_ind;
									} else if (ticket.pmr_type.toLowerCase() === "hardware" && answer.feedback && answer.feedback.contrib_ind) {
										contribInd = answer.feedback.contrib_ind;
									}
									row[answerLabel + "_contrib_ind"] = contribInd;
									answerPos++;
								});
							}
							data.push(row);
						});
						break;
					default:
						tickets.forEach(function(ticket) {
							var answers = ticket.answers;
							if (answers && answers.length) {
								answers.forEach(function(answer) {
									var title = answer.title;
									if (title && title !== "") {
										title = title.replace(/(\r\n|\n|\r)/gm,"");
									}
									var contribInd = "";
									var actionDt = "";
									var actionTm = "";
									if (ticket.pmr_type.toLowerCase() === "software" && answer.contrib_ind) {
										contribInd = answer.contrib_ind;
										actionDt = answer.action_dt;
										actionTm = answer.action_tm;
									} else if (ticket.pmr_type.toLowerCase() === "hardware" && answer.feedback && answer.feedback.contrib_ind) {
										contribInd = answer.feedback.contrib_ind;
										actionDt = answer.feedback.action_dt;
									}
									var row = {
										ticket_id: ticket.ticket_id,
										timestamp: ticket.timestamp,
										status: ticket.status,
										close_date: ticket.close_date,
										component_id: ticket.component_id,
										component_desc: ticket.component_desc,
										machine_type: ticket.machine_type,
										product_name: ticket.product_name,
										division: ticket.division,
										country: ticket.country,
										owner_name: ticket.owner_name,
										owner_id: ticket.owner_id,
										resolver_name: ticket.resolver_name,
										answer_id: answer.id,
										answer_url: answer.url,
										answer_title: title,
										answer_score: answer.score,
										answer_ranker_score: answer.ranker_score,
										answer_rank_score: answer.rank_score,
										answer_ir_engine: answer.ir_engine,
										answer_ir_engine_id: answer.ir_engine_id,
										answer_confidence: answer.confidence,
										answer_contrib_ind: contribInd,
										answer_content_src: answer.content_src,
										answer_action_dt: actionDt,
										answer_action_tm: actionTm
									}
									data.push(row);
								});
							} else {
								var row = {
									ticket_id: ticket.ticket_id,
									timestamp: ticket.timestamp,
									status: ticket.status,
									close_date: ticket.close_date,
									component_id: ticket.component_id,
									component_desc: ticket.component_desc,
									machine_type: ticket.machine_type,
									product_name: ticket.product_name,
									division: ticket.division,
									country: ticket.country,
									owner_name: ticket.owner_name,
									owner_id: ticket.owner_id,
									resolver_name: ticket.resolver_name
								}
								data.push(row);
							}
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
	},
	
	/**
	 * Generate Spotlight time series data
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} componentIds = comma delimited list of component IDs to filter by, if used live data will be queried and cache will not be used
	 * @param {string} cache - flag to determine whether to get data from cache (yes), partial cache (partial) which means current day KPI and live KMM or live data (no) [yes|partial|no]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON data
	 */
	generateSpotlightTimeSeries: function(start, end, type, componentIds, cache, cb) {
		var self = this;
		
		if (!type) {
			type = "all";
		}
		
		var fromCache = "yes";
		if (componentIds && componentIds !== "") {
			fromCache = "no";
		} else if (cache && cache !== "") {
			fromCache = cache;
		}
		
		if (fromCache === "yes") {
			// Data will come directly from the cached doc
			dbAnalytics.get(dataSpotlightTimeSeriesDoc, function(err, doc) {
				if (err) return cb(err);
				try {
					if (doc.data) {
						var data = {};
						if (type === "all") {
							for (key in doc.data.all) {
								var startCheck = true;
								if (start && start !== "" && key < start) {
									startCheck = false;
								}
								var endCheck = true;
								if (end && end !== "" && key >= end) {
									endCheck = false;
								}
								if (startCheck && endCheck) {
									data[key] = doc.data.all[key];
								}
							}
						} else if (type === "sw") {
							for (key in doc.data.sw) {
								var startCheck = true;
								if (start && start !== "" && key < start) {
									startCheck = false;
								}
								var endCheck = true;
								if (end && end !== "" && key >= end) {
									endCheck = false;
								}
								if (startCheck && endCheck) {
									data[key] = doc.data.sw[key];
								}
							}
						} else if (type === "hw") {
							for (key in doc.data.hw) {
								var startCheck = true;
								if (start && start !== "" && key < start) {
									startCheck = false;
								}
								var endCheck = true;
								if (end && end !== "" && key >= end) {
									endCheck = false;
								}
								if (startCheck && endCheck) {
									data[key] = doc.data.hw[key];
								}
							}
						}

						var result = {
							start: start,
							end: end,
							data: data
						};
						cb(null, result);
					} else {
						cb(null, {});
					}
				} catch(e) {
					cb(e);
				}
			});
		} else if (fromCache === "partial") {
			// For partial we will pull old KPI from the cached doc and 
			// only get the live data for the current day KPI and KMM
			dbAnalytics.get(dataSpotlightTimeSeriesDoc, function(err, doc) {
				if (err) return cb(err);
				try {
					if (doc.data) {
						var data = {};
						if (type === "all") {
							for (key in doc.data.all) {
								var startCheck = true;
								if (start && start !== "" && key < start) {
									startCheck = false;
								}
								var endCheck = true;
								if (end && end !== "" && key >= end) {
									endCheck = false;
								}
								if (startCheck && endCheck) {
									data[key] = doc.data.all[key];
								}
							}
						} else if (type === "sw") {
							for (key in doc.data.sw) {
								var startCheck = true;
								if (start && start !== "" && key < start) {
									startCheck = false;
								}
								var endCheck = true;
								if (end && end !== "" && key >= end) {
									endCheck = false;
								}
								if (startCheck && endCheck) {
									data[key] = doc.data.sw[key];
								}
							}
						} else if (type === "hw") {
							for (key in doc.data.hw) {
								var startCheck = true;
								if (start && start !== "" && key < start) {
									startCheck = false;
								}
								var endCheck = true;
								if (end && end !== "" && key >= end) {
									endCheck = false;
								}
								if (startCheck && endCheck) {
									data[key] = doc.data.hw[key];
								}
							}
						}
						//console.log("data", data);
						
						var d = new Date();
						var dy = new Date();
						dy.setDate(d.getDate()-1);
						var dt = new Date();
						dt.setDate(d.getDate()+1);
						var today = d.toISOString().substring(0,10);
						var startKPI = dy.toISOString().substring(0,10);
						var endKPI = dt.toISOString().substring(0,10);
						//console.log(today, startKPI, endKPI);
						
						async.parallel({
							timeSeriesTicketsProcessed: function(callback){
								if (!end || end === "" || end >= today) {
									self.getSpotlightTicketsProcessed(startKPI, endKPI, "statsbyday", type, componentIds, callback);
								} else {
									callback(null, {});
								}
							},
							timeSeriesTicketsProcessedWhitelist: function(callback){
								if (!end || end === "" || end >= today) {
									self.getSpotlightTicketsProcessedWhitelist(startKPI, endKPI, "statsbyday", type, componentIds, callback);
								} else {
									callback(null, {});
								}
							},
							timeSeriesTicketsUpdated: function(callback){
								if (!end || end === "" || end >= today) {
									self.getSpotlightTicketsUpdated(startKPI, endKPI, "statsbyday", type, componentIds, callback);
								} else {
									callback(null, {});
								}
							},
							timeSeriesTicketsUpdatedKMM: function(callback){
								//self.getSpotlightTicketsUpdatedKMM(start, end, "statsbyday", "all", type, false, null, componentIds, null, callback);
								self.getSpotlightTicketsUpdatedKMMCache(start, end, "statsbyday", "all", type, null, componentIds, null, callback);
							}
						}, function(error, results) {
							if (results.timeSeriesTicketsProcessed.tickets_processed_by_day) {
								var ticketsProcessedByDay = results.timeSeriesTicketsProcessed.tickets_processed_by_day;
								for (key in ticketsProcessedByDay) {
									if (!data[key]) {
										data[key] = {};
										data[key].tickets_processed = ticketsProcessedByDay[key];
									} else {
										data[key].tickets_processed = ticketsProcessedByDay[key];
									}
								}
							}
							
							if (results.timeSeriesTicketsProcessedWhitelist.tickets_processed_whitelist_by_day) {
								var ticketsProcessedWhitelistByDay = results.timeSeriesTicketsProcessedWhitelist.tickets_processed_whitelist_by_day;
								for (key in ticketsProcessedWhitelistByDay) {
									if (!data[key]) {
										data[key] = {};
										data[key].tickets_processed_whitelist = ticketsProcessedWhitelistByDay[key];
									} else {
										data[key].tickets_processed_whitelist = ticketsProcessedWhitelistByDay[key];
									}
								}
							}
							
							if (results.timeSeriesTicketsUpdated.tickets_updated_by_day) {
								var ticketsUpdatedByDay = results.timeSeriesTicketsUpdated.tickets_updated_by_day;
								for (key in ticketsUpdatedByDay) {
									if (!data[key]) {
										data[key] = {};
										data[key].tickets_updated = ticketsUpdatedByDay[key];
									} else {
										data[key].tickets_updated = ticketsUpdatedByDay[key];
									}
								}
							}

							var ticketsUpdatedKMMByDay = results.timeSeriesTicketsUpdatedKMM.tickets_updated_kmm_by_day;
							for (key in ticketsUpdatedKMMByDay) {
								if (!data[key]) {
									data[key] = {};
									for (kmm in ticketsUpdatedKMMByDay[key])
										data[key][kmm] = ticketsUpdatedKMMByDay[key][kmm];
								} else {
									for (kmm in ticketsUpdatedKMMByDay[key])
										data[key][kmm] = ticketsUpdatedKMMByDay[key][kmm];
								}
							}
							
							var result = {
								start: start,
								end: end,
								data: data
							};
							cb(null, result);
						});
					} else {
						var result = {
							start: start,
							end: end,
							data: {}
						};
						cb(null, result);
					}
				} catch(e) {
					cb(e);
				}
			});
		} else {
			async.parallel({
				timeSeriesTicketsProcessed: function(callback){
					self.getSpotlightTicketsProcessed(start, end, "statsbyday", type, componentIds, callback);
				},
				timeSeriesTicketsProcessedWhitelist: function(callback){
					self.getSpotlightTicketsProcessedWhitelist(start, end, "statsbyday", type, componentIds, callback);
				},
				timeSeriesTicketsUpdated: function(callback){
					self.getSpotlightTicketsUpdated(start, end, "statsbyday", type, componentIds, callback);
				},
				timeSeriesTicketsUpdatedKMM: function(callback){
					//self.getSpotlightTicketsUpdatedKMM(start, end, "statsbyday", "all", type, false, null, componentIds, null, callback);
					self.getSpotlightTicketsUpdatedKMMCache(start, end, "statsbyday", "all", type, null, componentIds, null, callback);
				}
			}, function(error, results) {
				if (error) return cb(error);
				try {
					var data = {};
					var ticketsProcessedByDay = results.timeSeriesTicketsProcessed.tickets_processed_by_day;
					for (key in ticketsProcessedByDay) {
						if (!data[key]) {
							data[key] = {};
							data[key].tickets_processed = ticketsProcessedByDay[key];
						} else {
							data[key].tickets_processed = ticketsProcessedByDay[key];
						}
					}
					var ticketsProcessedWhitelistByDay = results.timeSeriesTicketsProcessedWhitelist.tickets_processed_whitelist_by_day;
					for (key in ticketsProcessedWhitelistByDay) {
						if (!data[key]) {
							data[key] = {};
							data[key].tickets_processed_whitelist = ticketsProcessedWhitelistByDay[key];
						} else {
							data[key].tickets_processed_whitelist = ticketsProcessedWhitelistByDay[key];
						}
					}
					var ticketsUpdatedByDay = results.timeSeriesTicketsUpdated.tickets_updated_by_day;
					for (key in ticketsUpdatedByDay) {
						if (!data[key]) {
							data[key] = {};
							data[key].tickets_updated = ticketsUpdatedByDay[key];
						} else {
							data[key].tickets_updated = ticketsUpdatedByDay[key];
						}
					}
					var ticketsUpdatedKMMByDay = results.timeSeriesTicketsUpdatedKMM.tickets_updated_kmm_by_day;
					for (key in ticketsUpdatedKMMByDay) {
						if (!data[key]) {
							data[key] = {};
							for (kmm in ticketsUpdatedKMMByDay[key])
								data[key][kmm] = ticketsUpdatedKMMByDay[key][kmm];
						} else {
							for (kmm in ticketsUpdatedKMMByDay[key])
								data[key][kmm] = ticketsUpdatedKMMByDay[key][kmm];
						}
					}
					
					var result = {
						start: start,
						end: end,
						data: data
					};
					cb(null, result);
				} catch(e) {
					cb(e);
				}
			});
		}
	},
	
	/**
	 * Generate time series data for KPI and KMM with output as delimited TXT
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} delimiter - delimiter to use for output
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} stream - flag to determine whether to send stream back as a response or just text
	 * @param {string} cache - flag to determine whether to get data from cached doc or live data
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {string} - delmited text
	 */
	generateSpotlightTimeSeriesTxt: function(start, end, delimiter, type, componentIds, stream, cache, cb) {
		var streamResponse = true;
		if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
			streamResponse = false;
		}
		
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.generateSpotlightTimeSeries(start, end, type, componentIds, cache, function(err, result) {
			try {
				var first = true;
				var fields = ["date", "tickets_processed", "tickets_processed_whitelist", "tickets_updated", "kmm_r", "kmm_y", "kmm_n", "kmm_u", "kmm_x", "kmm_none"];
				var data = [];
				for (day in result.data) {
					var row = {};
					for (field in result.data[day]) {
							row["date"] = day;
							row[field] = result.data[day][field];
					}
					data.push(row);
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
	},
	
	/**
	 * Save Spotlight time series data for KPI and KMM
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {boolean} save - flag to determine whether to save the data or return results for viewing, default is false or view data
	 * @param {string} cache - flag to determine whether to get data from partial cache (partial) which means current day KPI and live KMM or live data (no) [partial|no]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON data
	 */
	saveSpotlightTimeSeries: function(start, end, save, cache, cb) {
		var saveData = false;
		if ((typeof(save) === "string" && save === "true") || (typeof(save) === "boolean" && save)) {
			saveData = true;
		}
		
		var fromCache = "no";
		if (cache) {
			fromCache = cache;
		}
		
		var self = this;
		async.parallel({
			timeSeriesAll: function(callback){
				self.generateSpotlightTimeSeries(start, end, "all", null, fromCache, callback);
			},
			timeSeriesSW: function(callback){
				self.generateSpotlightTimeSeries(start, end, "sw", null, fromCache, callback);
			},
			timeSeriesHW: function(callback){
				self.generateSpotlightTimeSeries(start, end, "hw", null, fromCache, callback);
			}
		}, function(error, results) {
			if (error) return cb(error);
			dbAnalytics.get(dataSpotlightTimeSeriesDoc, function(err, doc) {
				if (err) return cb(err);
				try {
					var timestamp = (new Date()).toISOString();
					doc.timestamp = timestamp;
					if (doc.data.all) {
						for (key in results.timeSeriesAll.data) {
							doc.data.all[key] = results.timeSeriesAll.data[key];
						}
					}
					
					if (doc.data.sw) {
						for (key in results.timeSeriesSW.data) {
							doc.data.sw[key] = results.timeSeriesSW.data[key];
						}
					}
					
					if (doc.data.hw) {
						for (key in results.timeSeriesHW.data) {
							doc.data.hw[key] = results.timeSeriesHW.data[key];
						}
					}
					
					if (saveData) {
						dbAnalytics.insert(doc, doc._id, function(err, result) {
							if (err) return cb(err);
							cb(null, result);
						});
					} else {
						cb(null, doc);
					}
				} catch(e) {
					cb(e);
				}
			});
		});
	},
	
	/**
	 * Save Spotlight tickets updated KMM data to cache file
	 * @param {string} timestamp - year + month timestamp e.g. 2016-01
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON data
	 */
	saveSpotlightTicketsUpdatedKMM: function(timestamp, cb) {
		//dataSpotlightTicketsUpdatedKMMDoc
		var start = (new Date()).toISOString().substring(0,7);
		if (timestamp && /^[0-9]{4}\-[0-9]{2}$/.test(timestamp)) {
			start = timestamp;
		}
		var year = Number(start.substring(0,4));
		var month = Number(start.substring(5,7));
		if ((month + 1) > 12) {
			year++;
			month = 1;
		} else {
			month++;
		}
		var end = year.toString() + "-"
		if (month < 10) end += "0"
		end += month.toString();
		
		var self = this;
		self.getSpotlightTicketsUpdatedKMM(start, end, "data", null, null, false, null, null, null, function(err, result) {
			if (err) return cb(err);
			var docId = dataSpotlightTicketsUpdatedKMMDoc + start;
			var data = result;
			dbAnalytics.get(docId, function(err, result) {
				if (err) {
					if (err.statusCode === 404) {
						var doc = {
							_id: docId,
							timestamp: (new Date()).toISOString(),
							count: data.count,
							tickets: data.tickets
						};
						//cb(null, doc);
						dbAnalytics.insert(doc, doc._id, function(err, result) {
							if (err) return cb(err);
							cb(null, result);
						});
					} else {
						return cb(err);
					}
				} else {
					var doc = result;
					doc.timestamp = (new Date()).toISOString();
					doc.count = data.count;
					doc.tickets = data.tickets;
					//cb(null, doc);
					dbAnalytics.insert(doc, doc._id, function(err, result) {
						if (err) return cb(err);
						cb(null, result);
					});
				}
				
			})
		});
	},
	
	/**
	 * Generate Solution Stats for Spotlight products
	 * @param {string} timestamp - timestamp for when to generate the snapshot for, default is current date/time, format is ISO standard 2015-09-07T20:24:11.127Z
	 * @param {string} save - flag to determine whether to save updated solution stats back to analytics DB or just display results to user [true|false]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON summary
	 */
	generateSpotlightSolutionStats: function(timestamp, save, cb) {
		var now = new Date();
		if (timestamp && timestamp !== "") {
			now = new Date(timestamp);
		}
		var saveData = false;
		if ((typeof(save) === "string" && save === "true") || (typeof(save) === "boolean" && save)) {
			saveData = true;
		}
		
		var dayDate = new Date(now.toISOString());
		var startDay = dayDate.toISOString().substring(0,10);
		var endDay = (new Date(dayDate.setDate(dayDate.getDate() + 1))).toISOString().substring(0,10);
		
		var weekDate = new Date(now.toISOString());
		var startWeekDate = (new Date(weekDate.setDate(weekDate.getDate() - weekDate.getDay()))).toISOString().substring(0,10);
		var endWeekDate = (new Date(weekDate.setDate(weekDate.getDate() - weekDate.getDay() + 7))).toISOString().substring(0,10);
		
		var monthDate = new Date(now.toISOString());
		var startMonth = now.toISOString().substring(0,7);
		var endMonth = (new Date(monthDate.setMonth(monthDate.getMonth() + 1))).toISOString().substring(0,7);
		
		var yearDate = new Date(now.toISOString());
		var startYear = now.toISOString().substring(0,4);
		var endYear = (new Date(yearDate.setFullYear(yearDate.getFullYear() + 1))).toISOString().substring(0,4);
		
		/*console.log("day", startDay, endDay);
		console.log("week", startWeekDate, endWeekDate);
		console.log("month", startMonth, endMonth);
		console.log("year", startYear, endYear);*/
		
		dbAnalytics.get(dataSpotlightTimeSeriesDoc, function(err, doc) {
			if (err) return cb(err);
			try {
				var data = {
					all: {
						day: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
						week: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
						month: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
						year: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
					},
					sw: {
						day: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
						week: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
						month: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
						year: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
					},
					hw: {
						day: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
						week: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
						month: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
						year: {
							tickets_processed: 0,
							tickets_processed_whitelist: 0,
							tickets_updated: 0,
							kmm_r: 0,
							kmm_y: 0,
							kmm_n: 0,
							kmm_x: 0,
							kmm_u: 0,
							kmm_none: 0,
						},
					}
				};
				
				if (doc.data && doc.data.all) {
					for (key in doc.data.all) {
						if (key >= startDay && key < endDay) {
							for (metric in doc.data.all[key]) {
								data.all.day[metric] += doc.data.all[key][metric];
							}
						}
						if (key >= startWeekDate && key < endWeekDate) {
							for (metric in doc.data.all[key]) {
								data.all.week[metric] += doc.data.all[key][metric];
							}
						}
						if (key >= startMonth && key < endMonth) {
							for (metric in doc.data.all[key]) {
								data.all.month[metric] += doc.data.all[key][metric];
							}
						}
						if (key >= startYear && key < endYear) {
							for (metric in doc.data.all[key]) {
								data.all.year[metric] += doc.data.all[key][metric];
							}
						}
					}
				}
				
				if (doc.data && doc.data.sw) {
					for (key in doc.data.sw) {
						if (key >= startDay && key < endDay) {
							for (metric in doc.data.sw[key]) {
								data.sw.day[metric] += doc.data.sw[key][metric];
							}
						}
						if (key >= startWeekDate && key < endWeekDate) {
							for (metric in doc.data.sw[key]) {
								data.sw.week[metric] += doc.data.sw[key][metric];
							}
						}
						if (key >= startMonth && key < endMonth) {
							for (metric in doc.data.sw[key]) {
								data.sw.month[metric] += doc.data.sw[key][metric];
							}
						}
						if (key >= startYear && key < endYear) {
							for (metric in doc.data.sw[key]) {
								data.sw.year[metric] += doc.data.sw[key][metric];
							}
						}
					}
				}
				
				if (doc.data && doc.data.hw) {
					for (key in doc.data.hw) {
						if (key >= startDay && key < endDay) {
							for (metric in doc.data.hw[key]) {
								data.hw.day[metric] += doc.data.hw[key][metric];
							}
						}
						if (key >= startWeekDate && key < endWeekDate) {
							for (metric in doc.data.hw[key]) {
								data.hw.week[metric] += doc.data.hw[key][metric];
							}
						}
						if (key >= startMonth && key < endMonth) {
							for (metric in doc.data.hw[key]) {
								data.hw.month[metric] += doc.data.hw[key][metric];
							}
						}
						if (key >= startYear && key < endYear) {
							for (metric in doc.data.hw[key]) {
								data.hw.year[metric] += doc.data.hw[key][metric];
							}
						}
					}
				}
				
				var itemsDay = [];
				itemsDay.push({
					title: "Tickets Processed",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.day.tickets_processed},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.day.tickets_processed},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.day.tickets_processed}
					],
				});
				itemsDay.push({
					title: "Tickets Processed Whitelist",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.day.tickets_processed_whitelist},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.day.tickets_processed_whitelist},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.day.tickets_processed_whitelist}
					],
				});
				itemsDay.push({
					title: "Tickets Updated for Support",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.day.tickets_updated},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.day.tickets_updated},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.day.tickets_updated}
					],
				});
				itemsDay.push({
					title: "KMM Resolved (R)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.day.kmm_r},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.day.kmm_r},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.day.kmm_r}
					],
				});
				itemsDay.push({
					title: "KMM Contributed (Y)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.day.kmm_y},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.day.kmm_y},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.day.kmm_y}
					],
				});
				itemsDay.push({
					title: "KMM Not Related (N)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.day.kmm_n},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.day.kmm_n},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.day.kmm_n}
					],
				});
				itemsDay.push({
					title: "KMM Not Evaluated (X)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.day.kmm_x},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.day.kmm_x},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.day.kmm_x}
					],
				});
				itemsDay.push({
					title: "KMM Unknown (U)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.day.kmm_u},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.day.kmm_u},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.day.kmm_u}
					],
				});
				itemsDay.push({
					title: "KMM No Response",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.day.kmm_none},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.day.kmm_none},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.day.kmm_none}
					],
				});
				
				var itemsWeek = [];
				itemsWeek.push({
					title: "Tickets Processed",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.week.tickets_processed},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.week.tickets_processed},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.week.tickets_processed}
					],
				});
				itemsWeek.push({
					title: "Tickets Processed Whitelist",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.week.tickets_processed_whitelist},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.week.tickets_processed_whitelist},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.week.tickets_processed_whitelist}
					],
				});
				itemsWeek.push({
					title: "Tickets Updated for Support",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.week.tickets_updated},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.week.tickets_updated},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.week.tickets_updated}
					],
				});
				itemsWeek.push({
					title: "KMM Resolved (R)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.week.kmm_r},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.week.kmm_r},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.week.kmm_r}
					],
				});
				itemsWeek.push({
					title: "KMM Contributed (Y)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.week.kmm_y},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.week.kmm_y},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.week.kmm_y}
					],
				});
				itemsWeek.push({
					title: "KMM Not Related (N)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.week.kmm_n},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.week.kmm_n},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.week.kmm_n}
					],
				});
				itemsWeek.push({
					title: "KMM Not Evaluated (X)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.week.kmm_x},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.week.kmm_x},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.week.kmm_x}
					],
				});
				itemsWeek.push({
					title: "KMM Unknown (U)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.week.kmm_u},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.week.kmm_u},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.week.kmm_u}
					],
				});
				itemsWeek.push({
					title: "KMM No Response",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.week.kmm_none},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.week.kmm_none},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.week.kmm_none}
					],
				});
				
				var itemsMonth = [];
				itemsMonth.push({
					title: "Tickets Processed",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.month.tickets_processed},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.month.tickets_processed},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.month.tickets_processed}
					],
				});
				itemsMonth.push({
					title: "Tickets Processed Whitelist",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.month.tickets_processed_whitelist},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.month.tickets_processed_whitelist},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.month.tickets_processed_whitelist}
					],
				});
				itemsMonth.push({
					title: "Tickets Updated for Support",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.month.tickets_updated},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.month.tickets_updated},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.month.tickets_updated}
					],
				});
				itemsMonth.push({
					title: "KMM Resolved (R)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.month.kmm_r},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.month.kmm_r},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.month.kmm_r}
					],
				});
				itemsMonth.push({
					title: "KMM Contributed (Y)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.month.kmm_y},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.month.kmm_y},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.month.kmm_y}
					],
				});
				itemsMonth.push({
					title: "KMM Not Related (N)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.month.kmm_n},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.month.kmm_n},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.month.kmm_n}
					],
				});
				itemsMonth.push({
					title: "KMM Not Evaluated (X)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.month.kmm_x},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.month.kmm_x},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.month.kmm_x}
					],
				});
				itemsMonth.push({
					title: "KMM Unknown (U)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.month.kmm_u},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.month.kmm_u},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.month.kmm_u}
					],
				});
				itemsMonth.push({
					title: "KMM No Response",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.month.kmm_none},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.month.kmm_none},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.month.kmm_none}
					],
				});
				
				var itemsYear = [];
				itemsYear.push({
					title: "Tickets Processed",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.year.tickets_processed},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.year.tickets_processed},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.year.tickets_processed}
					],
				});
				itemsYear.push({
					title: "Tickets Processed Whitelist",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.year.tickets_processed_whitelist},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.year.tickets_processed_whitelist},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.year.tickets_processed_whitelist}
					],
				});
				itemsYear.push({
					title: "Tickets Updated for Support",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.year.tickets_updated},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.year.tickets_updated},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.year.tickets_updated}
					],
				});
				itemsYear.push({
					title: "KMM Resolved (R)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.year.kmm_r},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.year.kmm_r},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.year.kmm_r}
					],
				});
				itemsYear.push({
					title: "KMM Contributed (Y)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.year.kmm_y},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.year.kmm_y},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.year.kmm_y}
					],
				});
				itemsYear.push({
					title: "KMM Not Related (N)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.year.kmm_n},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.year.kmm_n},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.year.kmm_n}
					],
				});
				itemsYear.push({
					title: "KMM Not Evaluated (x)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.year.kmm_x},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.year.kmm_x},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.year.kmm_x}
					],
				});
				itemsYear.push({
					title: "KMM Unknown (U)",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.year.kmm_u},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.year.kmm_u},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.year.kmm_u}
					],
				});
				itemsYear.push({
					title: "KMM No Response",
					data: [
						{index: 0, title: ticketsKpiConfig.titleAll, value: data.all.year.kmm_none},
						{index: 1, title: ticketsKpiConfig.titleSW, value: data.sw.year.kmm_none},
						{index: 2, title: ticketsKpiConfig.titleHW, value: data.hw.year.kmm_none}
					],
				});
				
				var result = {
					timestamp: now.toISOString(),
					day: startDay,
					week_start: startWeekDate,
					week_end: endWeekDate,
					month: startMonth,
					year: startYear,
					refresh_interval: ticketsKpiConfig.spotlight_solution_stats_refresh_interval,
					data: {
						day: itemsDay,
						week: itemsWeek,
						month: itemsMonth,
						year: itemsYear
					}
				}
				
				if (saveData) {
					dbAnalytics.get(solutionStatsDoc, function(err, doc) {
						if (err) callback(err);
						try {
							var newDoc = result;
							newDoc["_id"] = doc._id;
							newDoc["_rev"] = doc._rev;
							
							dbAnalytics.insert(newDoc, newDoc._id, function(err, doc) {
								if (err) return cb(err);
								cb(null, doc);
							});
						} catch(e) {
							cb(e);
						}
					});
				} else {
					cb(null, result);
				}
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Gets the Spotlight solution stats
	 * @param period - time period for stats [day|week|month|year]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of dashboard entries to display
	 */
	getSpotlightSolutionStats: function(period, cb) {
		dbAnalytics.get(solutionStatsDoc, function(err, result) {
			cb(null, {items: result.data[period]});
		});
	},
	
	/**
	 * Refresh the Spotlight solution stats
	 * @param {string} timestamp - timestamp to use when refreshing the solution stats
	 * @param {string} period - time period for stats [day|week|month|year]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of dashboard entries to display
	 */
	refreshSpotlightSolutionStats: function(timestamp, period, cb) {
		var self = this;
		var currentYear = timestamp.substring(0,4);
		self.saveSpotlightTimeSeries(currentYear, null, true, "partial", function(err, result) {
			if (err) return cb(err);
			self.generateSpotlightSolutionStats(timestamp, true, function(err, result) {
				if (err) return cb(err);
				dbAnalytics.get(solutionStatsDoc, function(err, result) {
					if (err) return cb(err);
					cb(null, {items: result.data[period]});
				});
			})
		});
	},
	
	/**
	 * Get Spotlight refresh solution stats interval for display in dashboard
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {string} refresh interval value
	 */
	getSpotlightRefreshSolutionStatsInterval: function(cb) {
		dbAnalytics.get(solutionStatsDoc, function(err, result) {
			if (err) return cb(err);
			return cb(null, {refresh_interval: result.refresh_interval});
		});
	}
	
};