/**
 * Management UX Analytics Library
 * @module lib/analytics
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
var whitelist = {};
var divisions = [];
var componentIdsMap = {};
var ticketsKpiConfig;
var solutionStatsDoc = "";
var dataTimeSeriesDoc = "";
var dataSpotlightTimeSeriesDoc = "";
var dataTicketsUpdatedKMMDoc = "";

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
	"title",
	"description",
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

var reportTxtFieldsTicketsUpdatedKMMCache = [
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
		
		// Initialize dasboard solution stats doc
		if (env.mode === "PROD") {
			solutionStatsDoc = result.analytics.solution_stats_doc;
			dataTimeSeriesDoc = result.analytics.data_time_series_doc;
			dataSpotlightTimeSeriesDoc = result.analytics.data_spotlight_time_series_doc;
			dataTicketsUpdatedKMMDoc = result.analytics.data_tickets_updated_kmm_doc;
		} else {
			solutionStatsDoc = result.analytics.solution_stats_doc_test;
			dataTimeSeriesDoc = result.analytics.data_time_series_doc_test;
			dataSpotlightTimeSeriesDoc = result.analytics.data_spotlight_time_series_doc_test;
			dataTicketsUpdatedKMMDoc = result.analytics.data_tickets_updated_kmm_doc_test;
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
		
		// Initialize whitelist
		initWhitelist();
		
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

/** Initialize Component ID Whitelist */
function initWhitelist() {
	dbConfig.get(ticketsKpiConfig.ticketsKpi.whitelist, function(err, result) {
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

/** Initialize Component ID Whitelist and Divisions */
function initComponentIds() {
	dbAnalytics.get("map_compids_divisions_products", function(err, result) {
		if (err) return console.error("Failed to get component ID map");
		componentIdsMap = result.component_ids;
		divisions = result.divisions.sort();
	});
}

// Utility functions
/**
 * Calculates the trend based on a given currentValue and lastValue provided
 * @param currentValue number representing the value for current period ie year, month, week, day.
 * @param lastValue number representing the value for last period
 * @returns String increasing, decreasing, flat based on the calculation.
 */
function calculateTrend(currentValue, lastValue) {
	//FIXME validation
	if(currentValue > lastValue) {
		return "increasing";
	} else if(currentValue < lastValue) {
		return "decreasing";
	}
	return "flat";
}

/**
 * Given a current period calculates what the last period should be based on the format of the period provided and the periodFilter.
 * @param String representing the current period to filter. Expected formats year: yyyy, month: yyyy-mm, day: yyyy-mm-dd
 * @param (optional) String periodFilter optional value representing the current period to filter by. Expected values: daily, weekly, monthly and yearly. 
 * By default the code assumes the last period based on the format of the date passed in the first argument. The periodFilter is used primarily for weekly period
 * to remove ambiguity since the format for weekly period would still be same as daily yyyy-mm-dd.
 * Example: If a month format provided yyyy-mm then it looks at the last month for the periodFilter.
 * If monthly period provided: 2015-06 then last period is 2015-5. If period is 2015 then last period is 2016.
 * @return String representing the last period based on the period provided as input.
 */
function getLastPeriod(period, periodFilter) {
	if(!period) {
		return null;
	}
	var datePieces = period.split("-");
	var y, m = 0;
	var d = 1;
	switch (datePieces.length) {
	case 1:
		y = datePieces[0] -1; // substract to get last year. 
		break;
		
	case 2:
		y = datePieces[0]; // substract to get last year. 
		m = datePieces[1] - 2; // Months are zero based in js
		break;
		
	case 3:
		y = datePieces[0]; // substract to get last year. 
		m = datePieces[1] -1;// Months are zero based in js
		d = datePieces[2];
		
		if("weekly" === periodFilter) {
			var dateInput = new Date(y,m,d);
			d = dateInput.getDate() - dateInput.getDay() - 7;
		} else {
			d = d -1;
		}	
		break;

	default:
		return null;
		break;
	}
	
	var lastPeriod = new Date(y, m, d).toISOString();
	
	return lastPeriod.substring(0, period.length);
}

/**
 * Reads the data from the database to pull value and trend. 
 * @param design - design to look at
 * @param view - view to execute
 * @param params - query params used to build the query for filtering
 * @param cb - callback
 */
function readDataFromDB(design, view, params, cb) {
	var data = {};
	var process = {};
	
	process.currentValue = function(callback) {
		var qparams = {};
		// Add filtering based on date if query parameter provided.
		if(params && params.startDate) {
			qparams.startkey = params.startDate;
		}
		
		if(params && params.endDate) {
			qparams.endkey = params.endDate;
		}
		
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				//console.log(JSON.stringify(result));				
				if(result.rows.length === 1 && result.rows[0].value) {
					callback(null, result.rows[0].value);
				} else {
					callback(null, 0); // no results found
				}
			} catch(e) {
				callback(e);
			}
		});
	};
	process.lastValue = function(callback) {
		var qparams = {};
		// Add filtering based on date if query parameter provided.
		if(params && params.startDate) {
			var lastPeriod = getLastPeriod(params.startDate, params.period);
			if(lastPeriod !== null) {
				//console.log("Current start date: " + params.startDate + " filter by period:" + params.period + " . last period date=" + lastPeriod );
				qparams.startkey = lastPeriod;
				qparams.endkey =  params.startDate;
				qparams.inclusive_end = false; // Do not include the end key results in the dataset since those are counted in the current period.
			}			
		}
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				//console.log(JSON.stringify(result));				
				if(result.rows.length === 1 && result.rows[0].value) {						
					
					callback(null, result.rows[0].value);
				}	else {
					callback(null, 0);
				}				
			} catch(e) {
				callback(e);
			}
		});
	};		
	async.parallel(process,
	            // executes once all functions in the parallel array complete or as soon as one encounters an error.
	            function(error, results){
				   if (error) return cb(error);
		
				   //console.log("Current Value:" + results.currentValue + " , Last Period Value:" + results.lastValue);
	               data.value = results.currentValue;
	               data.trend = calculateTrend(results.currentValue, results.lastValue);
	               cb(null, data);
	            });
}

/**
 * Returns true if Agent Watson updated the ticket where at least one of the fields in KMM matched one of the entries submitted by Agent Watson. 
 * @param row - Contains ticket data pmrText which can include text entered by Agent Watson, and kmm field containing all KMM info for the ticket.
 * @returns true if Agent Watson updated the ticket where at least one of the fields in KMM matched one of the entries submitted by Agent Watson.
 */
function isAwAccurate(row) {
	var agentWatsonUpdateHeader = ticketsKpiConfig.agentWatsonUpdateHeader;
	var agentWatsonUpdateFooter = ticketsKpiConfig.agentWatsonUpdateFooter;
	var kmmData = row.value.kmm;
	var isAwAccurate = false;
	if(kmmData) {
		kmmData = (Array.isArray(kmmData)) ? kmmData : [kmmData];
	
    	return (kmmData.some(function(item){
    		if(item.DocId) {
    			// See if agent Watson updated the ticket
    			var pmrBody = row.value.pmrText;
    			if(pmrBody && pmrBody.indexOf(agentWatsonUpdateHeader) > -1) {
    					// Extract the data updated by agent Watson
    					var start = pmrBody.indexOf(agentWatsonUpdateHeader) ;
    					var end = pmrBody.indexOf(agentWatsonUpdateFooter) + agentWatsonUpdateFooter.length;
    					var agentWatsonUpdate = pmrBody.substring(start,end);
    					// Check if the update found by Agent Watson contains the string entered in the KMM field
    					if(agentWatsonUpdate && agentWatsonUpdate.indexOf(item.DocId) > -1) {
    						return true;
    					}
    
    			}
    		} 
    		return false;
    	}));
	}
	return isAwAccurate; // if no kmm data present then cannot really check if agent watson was successful.
}

/**
 * Reads the data from the PMR database to pull all the PMRs that contained KMM data. If the ticket was updated by Agent Watson,
 * then check if the KMM data was present in the solutions written by Agent Watson. Return a percentage of all the tickets that were updated
 * by Agent Watson where at least one of the fields in KMM matched one of the entries submitted by Agent Watson. 
 * @param design - design to look at
 * @param view - view to execute
 * @param params - query params used to build the query for filtering
 * @param cb - callback
 */
function readAwAccuracyDataFromDB(design, view, params, cb) {
	var data = {};
	var process = {};

	process.currentValue = function(callback) {
		var qparams = {};
		// Add filtering based on date if query parameter provided.
		if(params && params.startDate) {
			qparams.startkey = params.startDate;
		}
		
		if(params && params.endDate) {
			qparams.endkey = params.endDate;
		}
		
		dbPmr.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				
				var count = 0; // keep a count of all tickets that contained a kmm field where there was at least one entry in that field that matched at least one of the entries updated by ageint watson for the same pmr.
				result.rows.forEach(function(row){
					if(isAwAccurate(row)) {
						count ++;
					}			
				});
				
				callback(null, count); 
				
			} catch(e) {
				callback(e);
			}
		});
	};
	
	process.totalTicketsClosed = function(callback) {
		var qparams = {};
		// Add filtering based on date if query parameter provided.
		if(params && params.startDate) {
			qparams.startkey = params.startDate;
		}
		
		if(params && params.endDate) {
			qparams.endkey = params.endDate;
		}
		
		dbPmr.view(design, "allClosedTicketsByTimestamp", qparams, function(err, result) {
			if (err) return cb(err);
			try {				
				if(result.rows.length === 1 && result.rows[0].value) {
					callback(null, result.rows[0].value);
				} else {
					callback(null, 0); // no results found
				}				
			} catch(e) {
				callback(e);
			}
		});
	};
	
	process.lastValue = function(callback) {
		var qparams = {};
		// Add filtering based on date if query parameter provided.
		if(params && params.startDate) {
			var lastPeriod = getLastPeriod(params.startDate, params.period);
			if(lastPeriod !== null) {
				//console.log("Current start date: " + params.startDate + " filter by period:" + params.period + " . last period date=" + lastPeriod );
				qparams.startkey = lastPeriod;
				qparams.endkey =  params.startDate;
				qparams.inclusive_end = false; // Do not include the end key results in the dataset since those are counted in the current period.
			}			
		}
		dbPmr.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var count = 0; // keep a count of all tickets that contained a kmm field where there was at least one entry in that field that matched at least one of the entries updated by ageint watson for the same pmr.
				result.rows.forEach(function(row){
					if(isAwAccurate(row)) {
						count ++;
					}			
				});
				
				callback(null, count); 		
			} catch(e) {
				callback(e);
			}
		});
	};		
	async.parallel(process,
	            // executes once all functions in the parallel array complete or as soon as one encounters an error.
	            function(error, results){
				   if (error) return cb(error);
		
				   //console.log("Current Value:" + results.currentValue + " , Last Period Value:" + results.lastValue);
				   data.value = (results.totalTicketsClosed > 0) ? (results.currentValue / results.totalTicketsClosed) * 100 : 0;
				   	               
	               data.trend = calculateTrend(results.currentValue, results.lastValue);
	               cb(null, data);
	            });
}

/**
 * Reads the data from the PMR database to pull all the PMRs that contained KMM data. If the ticket was updated by Agent Watson,
 * then check if the KMM data was present. Returns a percentage of which ticket written by Agent Watson have KMM data 
 * @param design - design to look at
 * @param view - view to execute
 * @param params - query params used to build the query for filtering
 * @param cb - callback
 */
function readKmmDataFromDB(design, view, params, cb) {
	var data = {};
	var process = {};
	
	
	var agentWatsonUpdateHeader = ticketsKpiConfig.agentWatsonUpdateHeader;
	// Reduce function which returns the total number of tickets that were updated by Agent Watson
	var reduceUpdatedByAw = function(count, row){
		var pmrBody = row.value.pmrText;
		if(pmrBody && pmrBody.indexOf(agentWatsonUpdateHeader) > -1) {
				count++;    
		}
		return count;
	};
	
	// Returns all closed tickets updated by Agent Watson Containing KMM data for this current period.
	process.currentValue = function(callback) {
		var qparams = {};
		// Add filtering based on date if query parameter provided.
		if(params && params.startDate) {
			qparams.startkey = params.startDate;
		}
		
		if(params && params.endDate) {
			qparams.endkey = params.endDate;
		}
		
		if(params && params.reduce) { // This is used to send to the cloudant db. 
			qparams.reduce = params.reduce;
		}
		
		dbPmr.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {							
				var reduceValue = result.rows.reduce(reduceUpdatedByAw, 0); // start the count at 0				
				callback(null, reduceValue); 				
			} catch(e) {
				callback(e);
			}
		});
	};
	
	// Returns all closed tickets updated by Agent Watson.
	process.totalTicketsClosed = function(callback) {
		var qparams = {};
		// Add filtering based on date if query parameter provided.
		if(params && params.startDate) {
			qparams.startkey = params.startDate;
		}
		
		if(params && params.endDate) {
			qparams.endkey = params.endDate;
		}

		if(params && params.reduce) { // This is used to send to the cloudant db. 
			qparams.reduce = params.reduce;
		}
		
		dbPmr.view(design, "allClosedTicketsByTimestamp", qparams, function(err, result) {
			if (err) return cb(err);
			try {				
				var reduceValue = result.rows.reduce(reduceUpdatedByAw, 0); // start the count at 0				
				callback(null, reduceValue); 			
			} catch(e) {
				callback(e);
			}
		});
	};
	
	// Returns all tickets updated by Agent Watson Containing KMM data for the last period.
	process.lastValue = function(callback) {
		var qparams = {};
		// Add filtering based on date if query parameter provided.
		if(params && params.startDate) {
			var lastPeriod = getLastPeriod(params.startDate, params.period);
			if(lastPeriod !== null) {
				//console.log("Current start date: " + params.startDate + " filter by period:" + params.period + " . last period date=" + lastPeriod );
				qparams.startkey = lastPeriod;
				qparams.endkey =  params.startDate;
				qparams.inclusive_end = false; // Do not include the end key results in the dataset since those are counted in the current period.
			}			
		}	
		
		if(params && params.reduce) {
			qparams.reudce = params.reduce;
		}
		
		dbPmr.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var reduceValue = result.rows.reduce(reduceUpdatedByAw, 0); // start the count at 0					
				callback(null, reduceValue); 	
			} catch(e) {
				callback(e);
			}
		});
	};		
	async.parallel(process,
	            // executes once all functions in the parallel array complete or as soon as one encounters an error.
	            function(error, results){
			       if (error) return cb(error);
			       
				   //console.log("Current Value:" + results.currentValue + " , Last Period Value:" + results.lastValue);
				    data.value = (results.totalTicketsClosed > 0) ? (results.currentValue / results.totalTicketsClosed) * 100 : 0;			   
	               
	               data.trend = calculateTrend(results.currentValue, results.lastValue);
	               cb(null, data);
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
	 * Get summary data for tickets processed based on the specified period
	 * Tickets that are processed have a log entry with messageId = "WFS00-NewTicketReceived"
	 * @param params - request object params e.g. req.params
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON summary of tickets processed
	 * {
	 *   title: "Report title",
	 *   value: 100,
	 *   target: 500,
	 *   trend: "increasing" 
	 * }
	 */
	getTicketsProcessedWithTargetAndTrend: function(params, cb) {
		// FIXME add validation
		var design = ticketsKpiConfig.ticketsKpi.design_doc;
		var view = "ticketsProcessed";
	
		try {		
			readDataFromDB(design, view, params, function(err, data){
				if (err) return cb(err);
				if(data && (data.value !== undefined || data.value !== null) && data.trend) {
					var ticketsProcessed = {};
					ticketsProcessed.title = ticketsKpiConfig.ticketsKpi.ticketsRead.reportName; //FIXME  nls?
					ticketsProcessed.value = data.value;
					ticketsProcessed.target = ticketsKpiConfig.ticketsKpi.ticketsRead.target;
					ticketsProcessed.trend = data.trend;
					cb(null, ticketsProcessed);
				} else {
					cb("Unable to retrieve tickets processed information from database.");
				}			
			});
		} catch(e) {
			cb(e);
		}
	},
	
	/**
	 * Returns the an array containing tickets emailed to client. Tickets for which email has been sent ccontain a message id=WFS00-EmailSent
	 * This function uses a view to get the tickets writtern.
	 */
	getTicketsEmailedWithTargetAndTrend: function(params, cb) {
		// FIXME add validation
		var design = ticketsKpiConfig.ticketsKpi.design_doc;
		var view = "ticketsEmailed";
		try {		
			readDataFromDB(design, view, params, function(err, data){
				if (err) return cb(err);
				if(data && (data.value !== undefined || data.value !== null) && data.trend) {
					var ticketsProcessed = {};
					ticketsProcessed.title = ticketsKpiConfig.ticketsKpi.ticketsEmailed.reportName; //FIXME nls?
					ticketsProcessed.value = data.value;
					ticketsProcessed.target =  ticketsKpiConfig.ticketsKpi.ticketsEmailed.target; 
					ticketsProcessed.trend = data.trend;
					cb(null, ticketsProcessed);
				} else {
					cb("Unable to retrieve tickets emailed information from database.");
				}			
			});
		} catch(e) {
			cb(e);
		}
		
	},
	
	/**
	 * Returns the an array containing tickets written to support by hub module. Tickets that are written to support contain a message id=WFS00-TicketWriterSent
	 * This function uses a view to get the tickets writtern.
	 */
	getTicketsWrittenWithTargetAndTrend: function(params, cb) {
		// FIXME add validation
		var design = ticketsKpiConfig.ticketsKpi.design_doc;
		var view = "ticketsUpdated";
		
		try {		
			readDataFromDB(design, view, params, function(err, data){
				if (err) return cb(err);
				if(data && (data.value !== undefined || data.value !== null) && data.trend) {
					var ticketsProcessed = {};
					ticketsProcessed.title = ticketsKpiConfig.ticketsKpi.ticketsWritten.reportName; //FIXME nls?
					ticketsProcessed.value = data.value;
					ticketsProcessed.target = ticketsKpiConfig.ticketsKpi.ticketsWritten.target;
					ticketsProcessed.trend = data.trend;
					// Add a detailed report url
					ticketsProcessed.url =  "report?reportName=kpiTicketsUpdated";
					cb(null, ticketsProcessed);
				} else {
					cb("Unable to retrieve tickets written information from database.");
				}			
			});
		} catch(e) {
			cb(e);
		}
	},
	
	/**
	 * Returns  an array containing tickets KPI which includes tickets read, written and emailed.
	 */
	getTicketsKpi: function(params, cb) {
		var self = this;
		async.parallel({
		                ticketsProcessed: function(callback){
			                self.getTicketsProcessedWithTargetAndTrend(params, callback);
		                },
		                ticketsProcessedWhitelist: function(callback){
			                self.getTicketsProcessedWhitelist(params.startDate, params.endDate, params.period, "targetandtrend", null, callback);
		                },
		                ticketsWritten: function(callback){
		                	self.getTicketsWrittenWithTargetAndTrend(params, callback);
		                },
		                ticketsEmailed: function(callback){
		                	self.getTicketsEmailedWithTargetAndTrend(params, callback);
		                }
					},
		            // executes once all functions in the parallel array complete or as soon as one encounters an error.
		            function(error, results){
					   if (error) return cb(error);
					   //console.log(JSON.stringify(results));
					   var items = [];
					   items.push(results.ticketsProcessed);
					   items.push(results.ticketsProcessedWhitelist);
 
					   // Calculate tickets written percentages based on total tickets processed
		               var ticketsWrittenPercent = (results.ticketsProcessedWhitelist.value > 0) ? ((results.ticketsWritten.value/results.ticketsProcessedWhitelist.value) * 100).toFixed(1) : 0;
		               results.ticketsWritten.value = results.ticketsWritten.value + "   (" + ticketsWrittenPercent + "%)";
		               items.push(results.ticketsWritten);
		               
		               // Calculate tickets emailed percentages based on total tickets processed
		               var ticketsEmailedPercent = (results.ticketsProcessedWhitelist.value > 0) ? ((results.ticketsEmailed.value/results.ticketsProcessedWhitelist.value) * 100).toFixed(1) : 0;
		               results.ticketsEmailed.value = results.ticketsEmailed.value +  "   (" + ticketsEmailedPercent + "%)";
		               items.push(results.ticketsEmailed);
		              
		               cb(null, {items: items});
		            });
	},
	
	/**
	 * Returns the kmm metrics of tickets written by Agent Watson. Of all tickets closed which tickets written by agent watson
	 * had kmm data.
	 * Sample expected results in Json object:
	 * {
	 * 	title: 'KMM Data Quality for Agent Watson Tickets',
	 *  value: '65%',
	 *  target: '80%',
	 *  trend: 'increasing' 
	 * }
	 */
	getKmmForAgentWatson: function(params, cb) {
		// FIXME add validation
		var design = ticketsKpiConfig.awSolutionConfig.design_doc;
		var view = "allTicketsWithKmmData";
			
		try {		
			
			readKmmDataFromDB(design, view, params, function(err, data){
				if (err) return cb(err);
				if(data && (data.value !== undefined || data.value !== null) && data.trend) {
					var ticketsProcessed = {};
					ticketsProcessed.title = ticketsKpiConfig.awSolutionConfig.kmmQuality.reportName; //FIXME  nls?
					ticketsProcessed.value = data.value + "%";
					ticketsProcessed.target = ticketsKpiConfig.awSolutionConfig.kmmQuality.target;
					ticketsProcessed.trend = data.trend;
					cb(null, ticketsProcessed);
				} else {
					cb("Unable to retrieve Agent Watson information from pmr database.");
				}			
			});
		} catch(e) {
			cb(e);
		}
	},
	
	/**
	 * Returns  an array containing metrics for the Agent Watson solution quality. It includes:
	 * Agent Watson Accuracy in ticket closure, KMM data quality on tickets updated by Agent Watson, and Tickets where Agent Watson did a direct close.
	 */
	getAWSolutionQuality: function(params, cb) {
		var self = this;
		async.parallel({
		                awAccuracy: function(callback){
			                self.getAgentWatsonAccuracy(params, callback);
		                },
		                kmmAwTickets: function(callback) {
		                	if(!params) {
		                		params = {};
		                	} 
		                	params.reduce = false; // Don't use the reduce function used by the kmm quality report.
		                	self.getKmmForAgentWatson(params, callback);
		                }
					},
		            // executes once all functions in the parallel array complete or as soon as one encounters an error.
		            function(error, results){
					   if (error) return cb(error);
					   //console.log(JSON.stringify(results));
					   var items = [];
					   items.push(results.awAccuracy);     
 
					   items.push(results.kmmAwTickets);
		               
		               // Calculate tickets emailed percentages based on total tickets processed
		               /*var ticketsEmailedPercent = ((results.ticketsEmailed.value/results.ticketsProcessed.value) * 100).toFixed(1);
		               results.ticketsEmailed.value = results.ticketsEmailed.value +  "   (" + ticketsEmailedPercent + "%)";
		               items.push(results.ticketsEmailed);*/
		              
		               cb(null, {items: items});
		            });
	},
	
	/**
	 * Returns the metrics of tickets where Agent Watson contributed to the closure of the ticket.
	 * Sample expected results in Json object:
	 * {
	 * 	title: 'Agent Watson Accuracy on Ticket Closure (via KMM)',
	 *  value: '60%',
	 *  target: '80%',
	 *  trend: 'increasing' 
	 * }
	 */
	getAgentWatsonAccuracy: function(params, cb) {
		// FIXME add validation
		var design = ticketsKpiConfig.awSolutionConfig.design_doc;
		var view = "allTicketsWithKmmData";
	
		try {		
			readAwAccuracyDataFromDB(design, view, params, function(err, data){
				if (err) return cb(err);
				if(data && (data.value !== undefined || data.value !== null) && data.trend) {
					var ticketsProcessed = {};
					ticketsProcessed.title = ticketsKpiConfig.awSolutionConfig.awAccuracy.reportName; //FIXME  nls?
					ticketsProcessed.value = data.value + "%";
					ticketsProcessed.target = ticketsKpiConfig.awSolutionConfig.awAccuracy.target;
					ticketsProcessed.trend = data.trend;
					cb(null, ticketsProcessed);
				} else {
					cb("Unable to retrieve Agent Watson information from pmr database.");
				}			
			});
		} catch(e) {
			cb(e);
		}
	},
	
	/**
	 * Get tickets processed stats based on the specified period
	 * Tickets that are processed have a log entry with messageId = "WFS00-NewTicketReceived"
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} output - determine output, either dashboard total or stats by day [dashboard|statsbyday]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketsProcessed: function(start, end, output, type, componentIds, cb) {
		var hasFilters = false;
		var compIdsMap = {};
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
		
		var qparams = {};
		if (start && start !== "") {
			qparams["startkey"] = start;
		}
		if (end && end !== "") {
			qparams["endkey"] = end;
		}
		//var reduce = true;
		var reduce = false;
		/*if ((output && output === "statsbyday") || hasFilters) {
			reduce = false;
		}*/
		qparams["reduce"] = reduce;
	
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			if (hasFilters) {
				try {
					var tickets = {};
					var ticketIds = [];
					result.rows.forEach(function(row) {
						ticketIds.push(row.value.ticketId);
						tickets[row.value.ticketId] = row.key.substring(0,10);
					});
					//cb(null, {count: tickets.length, tickets: tickets});
					
					dbTickets.fetch({keys: ticketIds}, function(err, result) {
						if (err) cb(err);
						try {
							var ticketsFiltered = [];
							var ticketsMap = {};
							result.rows.forEach(function(row) {
								if (row.doc) {
									var ticket = row.doc;
									var compIdMatch = true;
									if (!_.isEmpty(compIdsMap)) {
										compIdMatch = false;
										for (id in compIdsMap) {
											if (!compIdMatch && (id === ticket.component_id || id === ticket.machine_type)) {
												compIdMatch = true;
											}
										}
									}
									if (compIdMatch) {
										if (countDuplicates) {
											ticketsFiltered.push(tickets[ticket.ticket_id]);
										} else {
											ticketsMap[ticket.ticket_id] = tickets[ticket.ticket_id];
										}
									}
								}
							});
							if (!countDuplicates) {
								for (key in ticketsMap) {
									ticketsFiltered.push(ticketsMap[key]);
								}
							}
							//cb(null, {count: ticketsFiltered.length, tickets: ticketsFiltered});
							
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
				} catch(e) {
					cb(e);
				}
			} else {
				switch(output) {
					case "statsbyday":
						try {
							var tickets = [];
							if (countDuplicates) {
								result.rows.forEach(function(row) {
									tickets.push(row.key.substring(0,10));
								});
							} else {
								var ticketsMap = {};
								result.rows.forEach(function(row) {
									ticketsMap[row.value.ticketId] = row.key.substring(0,10);
								});
								for (key in ticketsMap) {
									tickets.push(ticketsMap[key]);
								}
							}
							tickets = tickets.sort();
							
							ticketsByDay = {};
							tickets.forEach(function(ts) {
								if (!ticketsByDay[ts]) {
									ticketsByDay[ts] = 1;
								} else {
									ticketsByDay[ts] = ticketsByDay[ts] + 1;
								}
							});
							cb(null, {count: tickets.length, tickets_processed_by_day: ticketsByDay});
						} catch(e) {
							cb(e);
						}
						break;
					case "dashboard":
					default:
						var count = 0;
						if (countDuplicates) {
							count = result.rows.length;
						} else {
							var ticketsMap = {};
							result.rows.forEach(function(row) {
								ticketsMap[row.value.ticketId] = 1;
							});
							count = Object.keys(ticketsMap).length;
						}
						cb(null, {count: count});
						break;
				}
			}
		});
	},
	
	/**
	 * Get tickets processed stats for tickets that passed the whitelist based on the specified period
	 * The whitelist for software tickets is defined by the configuration doc modules_00_hub_component_whitelist doc
	 * The whitelist for hardware tickets is defined by the configuration doc modules_00_hub_component_whitelist_hw doc
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} output - determine output, either dashboard total or stats by day [dashboard|statsbyday]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketsProcessedWhitelist: function(start, end, output, type, componentIds, cb) {
		var hasFilters = false;
		var compIdsMap = {};
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
		
		var qparams = {};
		if (start && start !== "") {
			qparams["startkey"] = start;
		}
		if (end && end !== "") {
			qparams["endkey"] = end;
		}
		
		var reduce = false;
		var includeDocs = false;
		if (hasFilters) {
			includeDocs = true;
		}
		qparams["reduce"] = reduce;
		qparams["include_docs"] = includeDocs;
		
		// Get list of whitelist tickets based on whitelist flags found in the answer docs
		dbAnswers.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			if (hasFilters) {
				try {
					var ticketsFiltered = [];
					var ticketsMap = {};
					result.rows.forEach(function(row) {
						if (row.doc) {
							var ticket = row.doc.pmr_complete;
							var compIdMatch = true;
							if (!_.isEmpty(compIdsMap)) {
								compIdMatch = false;
								for (id in compIdsMap) {
									if (!compIdMatch && (id === ticket.component_id || id === ticket.machine_type)) {
										compIdMatch = true;
									}
								}
							}
							if (compIdMatch) {
								if (countDuplicates) {
									ticketsFiltered.push(row.key.substring(0,10));
								} else {
									ticketsMap[ticket.ticket_id] = row.key.substring(0,10);
								}

							}
						}
					});
					if (!countDuplicates) {
						for (key in ticketsMap) {
							ticketsFiltered.push(ticketsMap[key]);
						}
					}
					//cb(null, {count: ticketsFiltered.length, tickets: ticketsFiltered});
					
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
			} else {
				switch(output) {
					case "statsbyday":
						try {
							var tickets = [];
							if (countDuplicates) {
								result.rows.forEach(function(row) {
									tickets.push(row.key.substring(0,10));
								});
							} else {
								var ticketsMap = {};
								result.rows.forEach(function(row) {
									ticketsMap[row.value[0]] = row.key.substring(0,10);
								});
								for (key in ticketsMap) {
									tickets.push(ticketsMap[key]);
								}
							}
							tickets = tickets.sort();

							ticketsByDay = {};
							tickets.forEach(function(ts) {
								if (!ticketsByDay[ts]) {
									ticketsByDay[ts] = 1;
								} else {
									ticketsByDay[ts] = ticketsByDay[ts] + 1;
								}
							});
							cb(null, {count: tickets.length, tickets_processed_whitelist_by_day: ticketsByDay});
						} catch(e) {
							cb(e);
						}
						break;
					case "dashboard":
					default:
						var count = 0;
						if (countDuplicates) {
							count = result.rows.length;
						} else {
							var ticketsMap = {};
							result.rows.forEach(function(row) {
								ticketsMap[row.value[0]] = 1;
							});
							count = Object.keys(ticketsMap).length;
						}
						cb(null, {count: count});
						break;
				}
			}
		});
	},
	
	/**
	 * Get tickets updated statistics based on the specified period
	 * Tickets that are updated for support have a log entry with messageId WFS00-TicketWriterSent
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} output - determine output, either dashboard total or stats by day [dashboard|statsbyday]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketsUpdated: function(start, end, output, type, componentIds, cb) {
		var hasFilters = false;
		var compIdsMap = {};
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
		
		var qparams = {};
		if (start && start !== "") {
			qparams["startkey"] = start;
		}
		if (end && end !== "") {
			qparams["endkey"] = end;
		}
		var reduce = false;
		qparams["reduce"] = reduce;
	
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			if (hasFilters) {
				try {
					var tickets = {};
					var ticketIds = [];
					result.rows.forEach(function(row) {
						ticketIds.push(row.value.ticketId);
						tickets[row.value.ticketId] = row.key.substring(0,10);
					});
					//cb(null, {count: tickets.length, tickets: tickets});
					
					dbTickets.fetch({keys: ticketIds}, function(err, result) {
						if (err) cb(err);
						try {
							var ticketsFiltered = [];
							var ticketsMap = {};
							result.rows.forEach(function(row) {
								if (row.doc) {
									var ticket = row.doc;
									var compIdMatch = true;
									if (!_.isEmpty(compIdsMap)) {
										compIdMatch = false;
										for (id in compIdsMap) {
											if (!compIdMatch && (id === ticket.component_id || id === ticket.machine_type)) {
												compIdMatch = true;
											}
										}
									}
									if (compIdMatch) {
										//ticketsFiltered.push(tickets[ticket.ticket_id]);
										if (countDuplicates) {
											ticketsFiltered.push(tickets[ticket.ticket_id]);
										} else {
											ticketsMap[ticket.ticket_id] = tickets[ticket.ticket_id];
										}
									}
								}
							});
							if (!countDuplicates) {
								for (key in ticketsMap) {
									ticketsFiltered.push(ticketsMap[key]);
								}
							}
							//cb(null, {count: ticketsFiltered.length, tickets: ticketsFiltered});
							
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
			} else {
				switch(output) {
					/*case "dashboard":
						var count = 0;
						if (result.rows.length > 0) {
							count = result.rows[0].value
						}
						cb(null, {count: count});
						break;*/
					case "statsbyday":
						try {
							var tickets = [];
							/*var totalCount = 0;
							result.rows.forEach(function(row) {
								tickets.push(row.key.substring(0,10));
								totalCount++;
							});*/
							if (countDuplicates) {
								result.rows.forEach(function(row) {
									tickets.push(row.key.substring(0,10));
								});
							} else {
								var ticketsMap = {};
								result.rows.forEach(function(row) {
									ticketsMap[row.value.ticketId] = row.key.substring(0,10);
								});
								for (key in ticketsMap) {
									tickets.push(ticketsMap[key]);
								}
							}
							tickets = tickets.sort();
							
							ticketsByDay = {};
							tickets.forEach(function(ts) {
								if (!ticketsByDay[ts]) {
									ticketsByDay[ts] = 1;
								} else {
									ticketsByDay[ts] = ticketsByDay[ts] + 1;
								}
							});
							cb(null, {count: tickets.length, tickets_updated_by_day: ticketsByDay});
						} catch(e) {
							cb(e);
						}
						break;
					case "dashboard":
					default:
						var count = 0;
						/*if (result.rows.length > 0) {
							count = result.rows[0].value
						}*/
						if (countDuplicates) {
							count = result.rows.length;
						} else {
							var ticketsMap = {};
							result.rows.forEach(function(row) {
								ticketsMap[row.value.ticketId] = 1;
							});
							count = Object.keys(ticketsMap).length;
						}
						cb(null, {count: count});
						break;
				}
			}
		});
	},
	
	/**
	 * Gets the solution stats for KPI and KMM
	 * @param period - time period for stats [day|week|month|year]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of dashboard entries to display
	 */
	getSolutionStats: function(period, cb) {
		dbAnalytics.get(solutionStatsDoc, function(err, result) {
			cb(null, {items: result.data[period]});
		});
	},
	
	/**
	 * First refreshes the solution stats for KPI and KMM and return the updated stats
	 * @param {string} timestamp - timestamp to use when refreshing the solution stats
	 * @param {string} period - time period for stats [day|week|month|year]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of dashboard entries to display
	 */
	refreshSolutionStats: function(timestamp, period, cb) {
		var self = this;
		var currentYear = timestamp.substring(0,4);
		self.saveTimeSeries(currentYear, null, true, "partial", function(err, result) {
			if (err) return cb(err);
			self.generateSolutionStats(timestamp, true, function(err, result) {
				if (err) return cb(err);
				dbAnalytics.get(solutionStatsDoc, function(err, result) {
					if (err) return cb(err);
					cb(null, {items: result.data[period]});
				});
			})
		});
	},
	
	/**
	 * Get refresh solution stats interval for display in dashboard
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {string} refresh interval value
	 */
	getRefreshSolutionStatsInterval: function(cb) {
		dbAnalytics.get(solutionStatsDoc, function(err, result) {
			if (err) return cb(err);
			return cb(null, {refresh_interval: result.refresh_interval});
		});
	},
	
	/**
	 * Get list of divisions
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {string} refresh interval value
	 */
	getDivisions: function(cb) {
		cb(null, {divisions: divisions});
	},
	
	/**
	 * Get ticket details for tickets processed
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
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
	getTicketsProcessedDetails: function(start, end, limit, type, details, answers, divisions, componentIds, products, customerDetails, cb) {
		var qparams = {reduce: false};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		} else {
			if (limit) {
				qparams.descending = true;
				qparams.limit = limit;
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
				var tickets = []
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
						if (includeAnswers) {
							var design = "ux";
							var view = "byTransaction";
							var qparams = {keys: txIds, include_docs: true};
							// Get answers for tickets
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
						} else {
							callback(null, {count: 0, details: {}})
						}
					}
				}, function(error, results) {
					if (error) cb(error);
					var ticketDetails = results.ticketDetails.details;
					var answerDetails = results.answerDetails.details;
					try {
						var count = 0;
						var ticketsProcessed = [];
						var ticketsProcessedMap = {};
						tickets.forEach(function(ticket) {
							var addTicket = true;
							if (hasFilters) {
								addTicket = false;
								if (ticketDetails[ticket.ticket_id]) {
									var compId = ticketDetails[ticket.ticket_id].component_id;
									if (ticketDetails[ticket.ticket_id].pmr_type.toLowerCase() === "hardware") {
										compId = ticketDetails[ticket.ticket_id].machine_type;
									}
									if (!_.isEmpty(compIdsMap)) {
										for (id in compIdsMap) {
											if (!addTicket && id === compId) {
												addTicket = true;
											}
										}
									}
								}
							}
							if (addTicket) {
								if (answerDetails[ticket.tx_id]) {
									ticket["pmr_type"] = answerDetails[ticket.tx_id].pmr_complete.pmr_type;
									ticket["pmr_number"] = answerDetails[ticket.tx_id].pmr_complete.pmr_number;
									ticket["build"] = answerDetails[ticket.tx_id].build;
									if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
										ticket["machine_type"] = answerDetails[ticket.tx_id].pmr_complete.machine_type;
									} else if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "software" || !answerDetails[ticket.tx_id].pmr_complete.pmr_type) {
										ticket["component_id"] = answerDetails[ticket.tx_id].pmr_complete.component_id;
										ticket["component_desc"] = answerDetails[ticket.tx_id].pmr_complete.component_desc;
									}
									
									if (componentIdsMap[ticket.component_id]) {
										ticket["product_name"] = componentIdsMap[ticket.component_id].short_name;
										ticket["division"] = componentIdsMap[ticket.component_id].division;
									} else {
										ticket["product_name"] = "";
										ticket["division"] = "";
									}
									ticket["country"] = answerDetails[ticket.tx_id].pmr_complete.country_code;
									
									if (includeDetails) {
										ticket["title"] = answerDetails[ticket.tx_id].pmr_complete.problem_title;
										ticket["description"] = answerDetails[ticket.tx_id].pmr_complete.problem_desc;
										
									}
									
									if (includeCustomerDetails) {
										ticket["company_name"] = answerDetails[ticket.tx_id].pmr_complete.company_name;
										ticket["customer_email"] = answerDetails[ticket.tx_id].pmr_complete.customer_email;
									}
									
									if (includeAnswers) {
										ticket["answers"] = answerDetails[ticket.tx_id].answers;
									}
								} else if (ticketDetails[ticket.ticket_id]) {
									ticket["pmr_type"] = ticketDetails[ticket.ticket_id].pmr_type;
									ticket["pmr_number"] = ticketDetails[ticket.ticket_id].pmr_number;
									if (ticketDetails[ticket.ticket_id].pmr_type.toLowerCase() === "hardware") {
										ticket["machine_type"] = ticketDetails[ticket.ticket_id].machine_type;
									} else if (ticketDetails[ticket.ticket_id].pmr_type.toLowerCase() === "software" || !ticketDetails[ticket.ticket_id].pmr_type) {
										ticket["component_id"] = ticketDetails[ticket.ticket_id].component_id;
										ticket["component_desc"] = ticketDetails[ticket.ticket_id].component_desc;
									}
									
									if (componentIdsMap[ticket.component_id]) {
										ticket["product_name"] = componentIdsMap[ticket.component_id].short_name;
										ticket["division"] = componentIdsMap[ticket.component_id].division;
									} else {
										ticket["product_name"] = "";
										ticket["division"] = "";
									}
									ticket["country"] = ticketDetails[ticket.ticket_id].country_code;
									
									if (includeDetails) {
										ticket["title"] = ticketDetails[ticket.ticket_id].problem_title;
										ticket["description"] = ticketDetails[ticket.ticket_id].problem_desc;
									}
									
									if (includeCustomerDetails) {
										ticket["company_name"] = ticketDetails[ticket.ticket_id].company_name;
										ticket["customer_email"] = ticketDetails[ticket.ticket_id].customer_email;
									}
								}
								//ticketsProcessed.push(ticket);
								if (countDuplicates) {
									ticketsProcessed.push(ticket);
								} else {
									ticketsProcessedMap[ticket.ticket_id] = ticket;
								}
								count++;
							}
						});

						if (!countDuplicates) {
							for (id in ticketsProcessedMap) {
								ticketsProcessed.push(ticketsProcessedMap[id]);
							}
						}
						cb(null, {count: count, tickets: ticketsProcessed});
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
	 * Get ticket details for tickets processed, output to delimited TXT
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
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
	getTicketsProcessedDetailsTxt: function(start, end, limit, type, details, answers, divisions, componentIds, products, customerDetails, delimiter, cb) {
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getTicketsProcessedDetails(start, end, limit, type, details, answers, divisions, componentIds, products, customerDetails, function(err, result) {
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
	 * Get ticket details for tickets processed with comp IDs in our whitelist
	 * The whitelist is defined by the modules_00_hub_component_whitelist doc in the configuration DB
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} answers - flag to include answers
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds - comma delimited list of component IDs to filter by
	 * @param {string} products = comma delimited list of products to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketsProcessedWhitelistDetails: function(start, end, limit, type, details, answers, divisions, componentIds, products, cb) {
		var qparams = {reduce: false, include_docs: true};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		} else {
			if (limit) {
				qparams.descending = true;
				qparams.limit = limit;
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
				//cb(null, {count: tickets.length, tickets: tickets});

				var ticketsProcessed = [];
				var ticketsMap = {};
				tickets.forEach(function(ticket) {
					var addTicket = true;
					if (hasFilters) {
						addTicket = false;
						if (answerDetails[ticket.tx_id]) {
							var compId = answerDetails[ticket.tx_id].pmr_complete.component_id;
							if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
								compId = answerDetails[ticket.tx_id].pmr_complete.machine_type;
							}
							var divisionMatch = true;
							if (!_.isEmpty(divisionsMap)) {
								divisionMatch = false
								for (division in divisionsMap) {
									if (!divisionMatch && componentIdsMap[compId] && (componentIdsMap[compId].division === division)) {
										divisionMatch = true;
									}
								}
							}
							var compIdMatch = true;
							if (!_.isEmpty(compIdsMap)) {
								compIdMatch = false;
								for (id in compIdsMap) {
									if (!compIdMatch && id === compId) {
										compIdMatch = true;
									}
								}
							}
							var productMatch = true;
							if (!_.isEmpty(productsMap)) {
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
							ticket["pmr_type"] = answerDetails[ticket.tx_id].pmr_complete.pmr_type;
							ticket["build"] = answerDetails[ticket.tx_id].build;
							if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
								ticket["machine_type"] = answerDetails[ticket.tx_id].pmr_complete.machine_type;
							} else if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "software" || !answerDetails[ticket.tx_id].pmr_complete.pmr_type) {
								ticket["component_id"] = answerDetails[ticket.tx_id].pmr_complete.component_id;
								ticket["component_desc"] = answerDetails[ticket.tx_id].pmr_complete.component_desc;
							}
							if (componentIdsMap[ticket.component_id]) {
								ticket["product_name"] = componentIdsMap[ticket.component_id].short_name;
								ticket["division"] = componentIdsMap[ticket.component_id].division;
							} else {
								ticket["product_name"] = "";
								ticket["division"] = "";
							}
							ticket["country"] = answerDetails[ticket.tx_id].pmr_complete.country_code;
							
							if (includeDetails) {
								ticket["title"] = answerDetails[ticket.tx_id].pmr_complete.problem_title;
								ticket["description"] = answerDetails[ticket.tx_id].pmr_complete.problem_desc;
							}

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
	 * Get ticket details for tickets processed with comp IDs in our whitelist, output to delimited TXT
	 * The whitelist is defined by the modules_00_hub_component_whitelist doc in the configuration DB
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} answers - flag to include answers
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds - comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} delimiter - delimiter to use for output
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketsProcessedWhitelistDetailsTxt: function(start, end, limit, type, details, answers, divisions, componentIds, products, delimiter, cb) {
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getTicketsProcessedWhitelistDetails(start, end, limit, type, details, answers, divisions, componentIds, products, function(err, result) {
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
	 * Get details for the tickets that were updated by our solution
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} answers - flag to include answers
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds - comma delimited list of component IDs to filter by
	 * @param {string} products = comma delimited list of products to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of tickets
	 */
	getTicketsUpdatedDetails: function(start, end, limit, type, details, answers, divisions, componentIds, products, cb) {
		var qparams = {reduce: false};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		} else {
			if (limit) {
				qparams.descending = true;
				qparams.limit = limit;
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
							var addTicket = true;
							if (hasFilters) {
								addTicket = false;
								if (answerDetails[ticket.tx_id]) {
									var compId = answerDetails[ticket.tx_id].pmr_complete.component_id;
									if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
										compId = answerDetails[ticket.tx_id].pmr_complete.machine_type;
									}
									var divisionMatch = true;
									if (!_.isEmpty(divisionsMap)) {
										divisionMatch = false
										for (division in divisionsMap) {
											if (!divisionMatch && componentIdsMap[compId] && (componentIdsMap[compId].division === division)) {
												divisionMatch = true;
											}
										}
									}
									var compIdMatch = true;
									if (!_.isEmpty(compIdsMap)) {
										compIdMatch = false;
										for (id in compIdsMap) {
											if (!compIdMatch && id === compId) {
												compIdMatch = true;
											}
										}
									}
									var productMatch = true;
									if (!_.isEmpty(productsMap)) {
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
									ticket["pmr_type"] = answerDetails[ticket.tx_id].pmr_complete.pmr_type;
									ticket["build"] = answerDetails[ticket.tx_id].build;
									
									if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
										ticket["machine_type"] = answerDetails[ticket.tx_id].pmr_complete.machine_type;
									} else if (answerDetails[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "software" || !answerDetails[ticket.tx_id].pmr_complete.pmr_type) {
										ticket["component_id"] = answerDetails[ticket.tx_id].pmr_complete.component_id;
										ticket["component_desc"] = answerDetails[ticket.tx_id].pmr_complete.component_desc;
									}
									
									if (componentIdsMap[ticket.component_id]) {
										ticket["product_name"] = componentIdsMap[ticket.component_id].short_name;
										ticket["division"] = componentIdsMap[ticket.component_id].division;
									} else {
										ticket["product_name"] = "";
										ticket["division"] = "";
									}
									ticket["country"] = answerDetails[ticket.tx_id].pmr_complete.country_code;
										
									if (includeDetails) {
										ticket["title"] = answerDetails[ticket.tx_id].pmr_complete.problem_title;
										ticket["description"] = answerDetails[ticket.tx_id].pmr_complete.problem_desc;
										
									}
									
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
	 * Get details for the tickets that were updated by our solution, output to delimited TXT
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} answers - flag to include answers
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds - comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} delimiter - delimiter to use for output
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketsUpdatedDetailsTxt: function(start, end, limit, type, details, answers, divisions, componentIds, products, delimiter, cb) {
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getTicketsUpdatedDetails(start, end, limit, type, details, answers, divisions, componentIds, products, function(err, result) {
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
	 * Get data on KMM responses for tickets updated
	 * Tickets that are updated by our solution have a log entry with messageId=WFS00-TicketWriterSent
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} output - determine output, either dashboard stats or raw data [dashboard|statsbyday|data]
	 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} spotlight - flag to include spotlight products in results, default is false
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketsUpdatedKMM: function(start, end, limit, output, response, type, details, divisions, componentIds, products, spotlight, cb) {
		var startDate = "";
		var endDate = "";
		var outputType = "dashboard";
		var responseType = "all"
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
		if ((typeof(details) === "string" && details === "true") || (typeof(details) === "boolean" && details)) {
			includeDetails = true;
		}
		
		var includeSpotlight = false;
		if ((typeof(spotlight) === "string" && spotlight === "true") || (typeof(spotlight) === "boolean" && spotlight)) {
			includeSpotlight = true;
		}
		
		var qparams = {reduce: false};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		} else {
			if (limit) {
				qparams.descending = true;
				qparams.limit = limit;
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
							dbPmrsMetrics.view(design, view, qparams, function (err, result) {
								if (err) return cb(err);
								try {
									var countKMM = 0;
									var kmmDetails = {};
									result.rows.forEach(function (row) {
										if (!kmmDetails[row.doc.ticket_id]) {
											kmmDetails[row.doc.ticket_id] = [row.doc];
										} else {
											kmmDetails[row.doc.ticket_id].push(row.doc);
										}
										countKMM++;
									});
									callback(null, {count: countKMM, kmm_details: kmmDetails});
								} catch (e) {
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
					}
					kmmByDay = {};
					var countTickets = 0;
					var countTicketsFiltered = 0;
					var ticketsFiltered = [];
					tickets.forEach(function(ticket) {
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
						countTickets++;
						
						var hasAnswers = false;
						var responseTypeMatch = false;
						var confidentAnswers = [];
						var compId = "";
						if (answerDetailsByTxID[ticket.tx_id]) {
							hasAnswers = true;
							if (answerDetailsByTxID[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "hardware") {
								ticket["machine_type"] = answerDetailsByTxID[ticket.tx_id].pmr_complete.machine_type;
								compId = answerDetailsByTxID[ticket.tx_id].pmr_complete.machine_type
							} else if (answerDetailsByTxID[ticket.tx_id].pmr_complete.pmr_type.toLowerCase() === "software" || !answerDetailsByTxID[ticket.tx_id].pmr_complete.pmr_type) {
								ticket["component_id"] = answerDetailsByTxID[ticket.tx_id].pmr_complete.component_id;
								ticket["component_desc"] = answerDetailsByTxID[ticket.tx_id].pmr_complete.component_desc;
								compId = answerDetailsByTxID[ticket.tx_id].pmr_complete.component_id;
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
						
						var isSpotlightProduct = false;
						if (!includeSpotlight) {
							if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (ticket.timestamp > spotlightProducts[compId].start_date)) {
								var endDateCheckPassed = false;
								if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (ticket.timestamp < spotlightProducts[compId].end_date)) {
									endDateCheckPassed = true;
								} else if (!spotlightProducts[compId].end_date) {
									endDateCheckPassed = true;
								}
								
								if (endDateCheckPassed) {
									isSpotlightProduct = true;
								}
							}
						}
						
						var passedFilters = false;
						if (!isSpotlightProduct && hasFilters) {
							var divisionMatch = true;
							if (!_.isEmpty(divisionsMap)) {
								divisionMatch = false
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
							// Only add the ticket to the results if there are confident answers
							// Defect 55032
							if (divisionMatch && compIdMatch && productMatch) {
								passedFilters = true;
							}
						}
						
						var addTicket = false;
						if (!isSpotlightProduct && (!hasFilters || passedFilters)) {
							if (hasAnswers) {
								if (confidentAnswers.length) {
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
											answerHasKMM = true;
										}*/
										
										if (responseType !== "all" && !responseTypeMatch) {
											if (responseType === "none") {
												if (!answer.contrib_ind && !answer.feedback) {
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
	 * Get KMM responses for tickets that were updated
	 * Tickets that are updated by our solution have a log entry with messageId=WFS00-TicketWriterSent
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} output - determine output, either dashboard stats or raw data [dashboard|statsbyday|data]
	 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} spotlight - flag to include spotlight products in results, default is false
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketsUpdatedKMMCache: function(start, end, output, response, type, divisions, componentIds, products, spotlight, cb) {
		var startDate = "";
		var endDate = "";
		var outputType = "dashboard";
		var responseType = "all"
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
		
		var includeSpotlight = false;
		if ((typeof(spotlight) === "string" && spotlight === "true") || (typeof(spotlight) === "boolean" && spotlight)) {
			includeSpotlight = true;
		}
		
		var design = "ux";
		var view = "dataTicketsUpdatedKMMTest"
		if (env.mode === "PROD") {
			view = "dataTicketsUpdatedKMM";
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
				}
				kmmByDay = {};
				
				var ticketIds = [];
				var tickets = [];
				result.rows.forEach(function(row) {
					if (row.doc) {
						var ticketsData = row.doc.tickets;
						ticketsData.forEach(function(ticket) {
							var isSpotlightProduct = false;
							var compId = "";
							if (ticket.pmr_type.toLowerCase() === "hardware") {
								compId = ticket.machine_type
							} else if (ticket.pmr_type.toLowerCase() === "software" || !ticket.pmr_type) {
								compId = ticket.component_id;
							}
							
							if (!includeSpotlight) {
								if (spotlightProducts[compId] && spotlightProducts[compId].start_date && (spotlightProducts[compId].start_date !== "") && (ticket.timestamp > spotlightProducts[compId].start_date)) {
									var endDateCheckPassed = false;
									if (spotlightProducts[compId].end_date && (spotlightProducts[compId].end_date !== "") && (ticket.timestamp < spotlightProducts[compId].end_date)) {
										endDateCheckPassed = true;
									} else if (!spotlightProducts[compId].end_date) {
										endDateCheckPassed = true;
									}
									
									if (endDateCheckPassed) {
										isSpotlightProduct = true;
									}
								}
							}
							
							if (!isSpotlightProduct) {
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
									divisionMatch = false
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
				cb(e)
			}
		});
	},
	
	/**
	 * Get data on KMM responses for tickets updated filtered by division, component IDs or products formatted in delimited text
	 * Tickets that are updated by our solution have a log entry with messageId=WFS00-TicketWriterSent
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} details - flag to include details
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} delimiter - delimiter to use for output
	 * @param {string} stream - flag to determine whether to send stream back as a response or just text
	 * @param {string} spotlight - flag to include spotlight products in results
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {string} - delmited text
	 */
	getTicketsUpdatedKMMTxt: function(start, end, limit, response, type, details, divisions, componentIds, products, delimiter, stream, spotlight, cb) {
		var streamResponse = true;
		if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
			streamResponse = false;
		}
		
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}

		var self = this;
		self.getTicketsUpdatedKMM(start, end, limit, "data", response, type, details, divisions, componentIds, products, spotlight, function(err, result) {
			if (err) return cb(err);
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
								title: ticket.title,
								description: ticket.description,
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
							title: ticket.title,
							description: ticket.description,
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
	 * Get data on KMM responses for tickets updated filtered by division, component IDs or products formatted in delimited text
	 * Tickets that are updated by our solution have a log entry with messageId=WFS00-TicketWriterSent
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} delimiter - delimiter to use for output
	 * @param {string} stream - flag to determine whether to send stream back as a response or just text
	 * @param {string} spotlight - flag to include spotlight products in results
	 * @param {string} format - type of output format [default|flat|min]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {string} - delmited text
	 */
	getTicketsUpdatedKMMCacheTxt: function(start, end, response, type, divisions, componentIds, products, delimiter, stream, spotlight, format, cb) {
		var streamResponse = true;
		if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
			streamResponse = false;
		}
		
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getTicketsUpdatedKMMCache(start, end, "data", response, type, divisions, componentIds, products, spotlight, function(err, result) {
			if (err) return cb(err);
			try {
				var tickets = result.tickets;
				var fields = reportTxtFieldsTicketsUpdatedKMMCache;
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
							}
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
	 * Get data closed tickets
	 * Include metrics for positive vote (at least 1 R or Y KMM vote), TTR (time to resolution) and HPP (hours per problem)
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} output - determine output, either dashboard stats or raw data [dashboard|statsbyday|data]
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getClosedTickets: function(start, end, limit, output, type, divisions, componentIds, products, cb) {
		var divisionsMap = {};
		var compIdsMap = {};
		var productsMap = {};
		
		var hasFilters = false;
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
		
		var qparams = {reduce: false};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		} else {
			if (limit) {
				qparams.descending = true;
				qparams.limit = limit;
			}
		}
		
		var design = "ux";
		var view = "closedTickets";
		dbTickets.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var txIds = [];
				var ticketDetails = {};
				result.rows.forEach(function(row) {
					var compId = row.value[2];
					var machineType = row.value[3];
					var productName = "";
					var division = "";
					if (componentIdsMap[compId]) {
						productName = componentIdsMap[compId].short_name;
						division = componentIdsMap[compId].division;
					}
					
					var passedFilters = false;
					if (hasFilters) {
						var divisionMatch = true;
						if (!_.isEmpty(divisionsMap)) {
							divisionMatch = false
							for (div in divisionsMap) {
								if (!divisionMatch && div === division) {
									divisionMatch = true;
								}
							}
						}
						var compIdMatch = true;
						if (!_.isEmpty(compIdsMap)) {
							compIdMatch = false;
							for (id in compIdsMap) {
								if (!compIdMatch && (id === compId || id === machineType)) {
									compIdMatch = true;
								}
							}
						}
						var productMatch = true;
						if (!_.isEmpty(productsMap)) {
							productMatch = false;
							for (product in productsMap) {
								if (!productMatch && productName.toLowerCase().indexOf(product.toLowerCase()) >= 0) {
									productMatch = true;
								}
							}
						}
						
						if (divisionMatch && compIdMatch && productMatch) {
							passedFilters = true;
						}
					}
					
					if (!hasFilters || passedFilters) {
						var ticket = {
							ticket_id: row.id,
							tx_id: row.value[0],
							close_date: row.key,
							pmr_type: row.value[1],
							component_id: compId,
							product_name: productName,
							division: division,
							machine_type: machineType,
							owner_id: row.value[4],
							owner_name: row.value[5],
							resolver_name: row.value[6],
							prob_l1_hrs_tot: row.value[7],
							prob_l2_hrs_tot: row.value[8],
							time_to_relief: row.value[9],
							pmr_open_days_tot: row.value[10],
							country_code: row.value[11]
						};
						ticketDetails[ticket.tx_id] = ticket;
						txIds.push(ticket.tx_id);
					}
				});
				//cb(null, {count: tickets.length, tickets: tickets});
				
				dbAnswers.fetch({keys: txIds}, function(err, result) {
					if (err) return cb(err);
					try {
						var ticketsWithKMM = [];
						result.rows.forEach(function(row) {
							if (row.doc) {
								if (row.doc.whitelistCompId && row.doc.whitelistCountryCodeAllowed && row.doc.confidence && row.doc.confidence !== "LOW") {
									ticketDetails[row.id]["watson_suggestion"] = 1;
									ticketsWithKMM.push(ticketDetails[row.id].ticket_id);
									var confidentAnswers = [];
									row.doc.answers.forEach(function(answer) {
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
									ticketDetails[row.id]["answers"] = confidentAnswers;
								} else {
									ticketDetails[row.id]["watson_suggestion"] = 0;
								}
							}
						});
						//cb(null, {tickets: ticketsWithKMM});
						
						var design = "ux";
						var view = "kmmResponsesByTicket";
						var qparams = {keys: ticketsWithKMM, include_docs: true};
						dbPmrsMetrics.view(design, view, qparams, function(err, result) {
							if (err) return cb(err);
							try {
								var kmmDetails = {};
								result.rows.forEach(function(row) {
									if (row.doc) {
										if (!kmmDetails[row.doc.ticket_id]) {
											kmmDetails[row.doc.ticket_id] = [row.doc];
										} else {
											kmmDetails[row.doc.ticket_id].push(row.doc);
										}
									}
								});
								//cb(null, {kmm_details: kmmDetails});
								
								var tickets = [];
								for (key in ticketDetails) {
									if (ticketDetails[key]["watson_suggestion"]) {
										if (kmmDetails[ticketDetails[key].ticket_id]) {
											var positiveVote = false;
											if (ticketDetails[key].answers) {
												ticketDetails[key].answers.forEach(function(answer) {
													kmmDetails[ticketDetails[key].ticket_id].forEach(function(kmm) {
														if (!positiveVote && kmm.content_id && kmm.content_id !== "") {
															var match = false;
															if (answer.id && answer.id.indexOf(kmm.content_id) >= 0) {
																match = true;
															} else if (answer.url && answer.url.indexOf(kmm.content_id) >=0) {
																match = true;
															}
															
															if (match) {
																if (kmm.contrib_ind && (kmm.contrib_ind === "R" || kmm.contrib_ind === "Y")) {
																	ticketDetails[key]["positive_vote"] = 1;
																	positiveVote = true;
																}
															}
														}
													});
												});
											}
											
											if (!positiveVote) {
												ticketDetails[key]["positive_vote"] = 0;
											}
										} else {
											ticketDetails[key]["positive_vote"] = 0;
										}
									} else {
										ticketDetails[key]["watson_suggestion"] = 0;
										ticketDetails[key]["positive_vote"] = 0;
									}
									tickets.push(ticketDetails[key]);
								}
								cb(null, {count: tickets.length, tickets: tickets});
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
	 * Get data closed tickets with output in delimited text
	 * Include metrics for positive vote (at least 1 R or Y KMM vote), TTR (time to resolution) and HPP (hours per problem)
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} delimiter - delimiter to use for output
	 * @param {string} stream - flag to determine whether to send stream back as a response or just text
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getClosedTicketsTxt: function(start, end, limit, type, divisions, componentIds, products, delimiter, stream, cb) {
		var streamResponse = true;
		if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
			streamResponse = false;
		}
		
		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getClosedTickets(start, end, limit, "data", type, divisions, componentIds, products, function(err, result) {
			if (err) return cb(err);
			try {
				var fields = [
					"ticket_id",
					"close_date",
					"pmr_type",
					"component_id",
					"product_name",
					"division",
					"country_code",
					"owner_id",
					"owner_name",
					"resolver_name",
					"prob_l1_hrs_tot",
					"prob_l2_hrs_tot",
					"time_to_relief",
					"pmr_open_days_tot",
					"watson_suggestion",
					"positive_vote"
				];
				var data = [];
				var tickets = result.tickets;
				//for (id in tickets) {
				tickets.forEach(function(ticket) {
					var compId = ticket.component_id;
					if (!compId || compId === "") {
						var compId = ticket.machine_type;
					}
					var row = {
						ticket_id: ticket.ticket_id,
						close_date: ticket.close_date,
						pmr_type: ticket.pmr_type,
						component_id: compId,
						product_name: ticket.product_name,
						division: ticket.division,
						country_code: ticket.country_code,
						owner_id: ticket.owner_id,
						owner_name: ticket.owner_name,
						resolver_name: ticket.resolver_name,
						prob_l1_hrs_tot: ticket.prob_l1_hrs_tot,
						prob_l2_hrs_tot: ticket.prob_l2_hrs_tot,
						time_to_relief: ticket.time_to_relief,
						pmr_open_days_tot: ticket.pmr_open_days_tot,
						watson_suggestion: ticket.watson_suggestion,
						positive_vote: ticket.positive_vote
					}
					data.push(row);
				});
				
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
	 * Get list of tickets and all the corresponding Watson answers and KMM responses
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} status - status value for filtering tickets [open|closed]
	 * @param {boolean} whitelist - flag to determine whether to show only tickets that passed whitelist filters
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketAnswersResponses: function(start, end, limit, type, status, whitelist, divisions, componentIds, products, cb) {
		var divisionsMap = {};
		var compIdsMap = {};
		var productsMap = {};
		
		var hasFilters = false;
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

		var onlyWhitelist = false;
		if ((typeof(whitelist) === "string" && whitelist === "true") || (typeof(whitelist) === "boolean" && whitelist)) {
			onlyWhitelist = true;
		}

		var qparams = {reduce: false};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		} else {
			if (limit) {
				qparams.descending = true;
				qparams.limit = limit;
			}
		}
		
		var design = "ux";
		var view = "byOpenDate";
		if (status && status === "closed") {
			view = "closedTickets";
		}
		
		dbTickets.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var txIds = [];
				var ticketIds = [];
				var ticketDetails = {};
				result.rows.forEach(function(row) {
					var compId = row.value[2];
					var machineType = row.value[3];
					var productName = "";
					var division = "";
					if (componentIdsMap[compId]) {
						productName = componentIdsMap[compId].short_name;
						division = componentIdsMap[compId].division;
					}
					
					var passedFilters = false;
					if (hasFilters) {
						var divisionMatch = true;
						if (!_.isEmpty(divisionsMap)) {
							divisionMatch = false
							for (div in divisionsMap) {
								if (!divisionMatch && div === division) {
									divisionMatch = true;
								}
							}
						}
						var compIdMatch = true;
						if (!_.isEmpty(compIdsMap)) {
							compIdMatch = false;
							for (id in compIdsMap) {
								if (!compIdMatch && (id === compId || id === machineType)) {
									compIdMatch = true;
								}
							}
						}
						var productMatch = true;
						if (!_.isEmpty(productsMap)) {
							productMatch = false;
							for (product in productsMap) {
								if (!productMatch && productName.toLowerCase().indexOf(product.toLowerCase()) >= 0) {
									productMatch = true;
								}
							}
						}
						
						if (divisionMatch && compIdMatch && productMatch) {
							passedFilters = true;
						}
					}

					var ticketStatus = "Open";
					if (row.value[4]) {
						ticketStatus = row.value[4];
					}

					if (!hasFilters || passedFilters) {
						var ticket = {
							ticket_id: row.id,
							tx_id: row.value[0],
							timestamp: row.key,
							pmr_type: row.value[1],
							component_id: compId,
							product_name: productName,
							division: division,
							machine_type: machineType,
							status: ticketStatus
						};
						//ticketDetails[ticket.tx_id] = ticket;
						ticketDetails[row.id] = ticket;
						txIds.push(ticket.tx_id);
						ticketIds.push(row.id);
					}
				});
				//cb(null, {count: Object.keys(ticketDetails).length, tickets: ticketDetails});
				
				dbAnswers.fetch({keys: txIds}, function(err, result) {
					if (err) return cb(err);
					try {
						//var ticketDetailsKMM = {};
						//var ticketsWithKMM = [];
						var ticketsWhitelist = {};
						result.rows.forEach(function(row) {
							if (row.doc) {
								if (row.doc.whitelistCompId && row.doc.whitelistCountryCodeAllowed) {
									ticketsWhitelist[row.doc.pmr_complete.ticket_id] = 1;
								}
								if (row.doc.whitelistCompId && row.doc.whitelistCountryCodeAllowed && row.doc.confidence && row.doc.confidence !== "LOW") {
									//ticketDetails[row.id]["watson_suggestion"] = 1;
									ticketDetails[row.doc.pmr_complete.ticket_id]["watson_suggestion"] = 1;
									var confidentAnswers = [];
									row.doc.answers.forEach(function(answer) {
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
									//ticketDetails[row.id]["answers"] = confidentAnswers;
									ticketDetails[row.doc.pmr_complete.ticket_id]["answers"] = confidentAnswers;
								}
							}
							//ticketDetailsById[ticketDetails[row.id].ticket_id] = ticketDetails[row.id];
						});
						//cb(null, {count: Object.keys(ticketDetails).length, tickets: ticketDetails});

						var design = "ux";
						var view = "kmmResponsesByTicket";
						var qparams = {keys: ticketIds, include_docs: true};
						dbPmrsMetrics.view(design, view, qparams, function(err, result) {
							if (err) return cb(err);
							try {
								result.rows.forEach(function(row) {
									if (row.doc) {
										if (ticketDetails[row.doc.ticket_id]) {
											if (!ticketDetails[row.doc.ticket_id]["kmm"]) {
												ticketDetails[row.doc.ticket_id]["kmm"] = [row.doc];
											} else {
												ticketDetails[row.doc.ticket_id]["kmm"].push(row.doc);
											}
										}
									}
								});

								var tickets = [];
								for(key in ticketDetails) {
									if (onlyWhitelist) {
										if (ticketsWhitelist[key]) {
											tickets.push(ticketDetails[key]);
										}
									} else {
										tickets.push(ticketDetails[key]);
									}
								}
								cb(null, {count: tickets.length, tickets: tickets});
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
	 * Get list of tickets and all the corresponding Watson answers and KMM responses with output in delimited text
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} status - status value for filtering tickets [open|closed]
	 * @param {boolean} whitelist - flag to determine whether to show only tickets that passed whitelist filters
	 * @param {string} divisions - semicolon delimited list of divisions to filter by
	 * @param {string} componentIds = comma delimited list of component IDs to filter by
	 * @param {string} products - comma delimited list of products to filter by
	 * @param {string} delimiter - delimiter to use for output
	 * @param {string} stream - flag to determine whether to send stream back as a response or just text
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketAnswersResponsesTxt: function(start, end, limit, type, status, whitelist, divisions, componentIds, products, delimiter, stream, cb) {
		var streamResponse = true;
		if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
			streamResponse = false;
		}

		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.getTicketAnswersResponses(start, end, limit, type, status, whitelist,  divisions, componentIds, products, function(err, result) {
			if (err) return cb(err);
			try {
				var fields = [
					"ticket_id",
					"component_id",
					"answers",
					"kmm",
					"status"
				];
				var data = [];
				var tickets = result.tickets;
				tickets.forEach(function(ticket) {
					var compId = ticket.component_id;
					var answers = "";
					var kmm = "";
					if (ticket.answers) {
						for (var i=0; i<ticket.answers.length; i++) {
							answers += ticket.answers[i].id;
							if ((i+1) < ticket.answers.length) {
								answers += ",";
							}
						}
					}
					if (ticket.kmm) {
						for (var i=0; i<ticket.kmm.length; i++) {
							kmm += ticket.kmm[i].content_id + ":" + ticket.kmm[i].contrib_ind;
							if ((i+1) < ticket.kmm.length) {
								kmm += ",";
							}
						}
					}
					var row = {
						ticket_id: ticket.ticket_id,
						component_id: ticket.component_id,
						answers: answers,
						kmm: kmm,
						status: ticket.status
					}
					data.push(row);
				});
				
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
	 * Get reports (list of reports available)
	 * @param {string} filter - recent or all
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {string} - list of reports available.
	 */
	getReports: function(filter, cb) {
		var design = "ux";
		var view = "reportsTest"
		if (env.mode === "PROD") {
			view = "reports";
		}
		var qparams = {};
		dbAnalytics.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var reports = {items: []};
				result.rows.forEach(function(row) {
					var report = row.value;
					if (filter === "recent") {
						if (report.reports.length > 0) {
							var entry = report.reports[report.reports.length-1];
							reports.items.push({
								title: report.title,
								file: entry.report,
								url: "reports/" + entry.directory + "/" + entry.report,
								data: [{
									index: 0,
									title: "Timestamp (GMT)",
									value: entry.timestamp
								}]
							});
						}
					} else if (filter === "all") {
						report.reports.forEach(function(entry) {
							reports.items.push({
								title: report.title,
								file: entry.report,
								url: "reports/" + entry.directory + "/" + entry.report,
								data: [{
									index: 0,
									title: "Timestamp (GMT)",
									value: entry.timestamp
								}]
							});
						});
					}

				});
				cb(null, reports);
			} catch(e) {
				cb(e);
			}
		});	
	},
	
	/**
	 * Get data grouped by day for tickets that had an error when being processed.
	 * @param params - request object params e.g. req.params
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON summary of tickets updated by day
	 * {
	 *   "count": 59,
	 *   "ticketsWithErrorByDay": {
	 *     "2015-06-29": 16,
	 *     "2015-06-30": 51
	 *   }
	 * }
	 */
	getTicketsWithErrorByDay: function(params, cb) {
		var design = ticketsKpiConfig.ticketsKpi.design_doc;
		var view = "ticketsWithError";
		var qparams = {reduce: false};
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var tickets = [];
				var totalCount = 0;
				result.rows.forEach(function(row) {
					tickets.push(row.key.substring(0,10));
					totalCount++;
				});
				tickets = tickets.sort();
				
				ticketsByDay = {};
				tickets.forEach(function(ts) {
					if (!ticketsByDay[ts]) {
						ticketsByDay[ts] = 1;
					} else {
						ticketsByDay[ts] = ticketsByDay[ts] + 1;
					}
				});
				cb(null, {count: totalCount, ticketsWithErrorByDay: ticketsByDay});
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Generate KPI data
	 * @param {string} timestamp - timestamp for when to generate the snapshot for, default is current date/time, format is ISO standard 2015-09-07T20:24:11.127Z
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON summary
	 */
	generateKPI: function(timestamp, type, cb) {
		var now = new Date();
		if (timestamp && timestamp !== "") {
			now = new Date(timestamp);
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
		
		var self = this;
		
		async.parallel({
			ticketsProcessedDay: function(callback){
				self.getTicketsProcessed(startDay, endDay, "dashboard", type, null, callback);
			},
			ticketsProcessedWhitelistDay: function(callback){
				self.getTicketsProcessedWhitelist(startDay, endDay, "dashboard", type, null, callback);
			},
			ticketsUpdatedDay: function(callback){
				self.getTicketsUpdated(startDay, endDay, "dashboard", type, null, callback);
			},
			ticketsProcessedWeek: function(callback){
				self.getTicketsProcessed(startWeekDate, endWeekDate, "dashboard", type, null, callback);
			},
			ticketsProcessedWhitelistWeek: function(callback){
				self.getTicketsProcessedWhitelist(startWeekDate, endWeekDate, "dashboard", type, null, callback);
			},
			ticketsUpdatedWeek: function(callback){
				self.getTicketsUpdated(startWeekDate, endWeekDate, "dashboard", type, null, callback);
			},
			ticketsProcessedMonth: function(callback){
				self.getTicketsProcessed(startMonth, endMonth, "dashboard", type, null, callback);
			},
			ticketsProcessedWhitelistMonth: function(callback){
				self.getTicketsProcessedWhitelist(startMonth, endMonth, "dashboard", type, null, callback);
			},
			ticketsUpdatedMonth: function(callback){
				self.getTicketsUpdated(startMonth, endMonth, "dashboard", type, null, callback);
			},
			ticketsProcessedYear: function(callback){
				self.getTicketsProcessed(startYear, endYear, "dashboard", type, null, callback);
			},
			ticketsProcessedWhitelistYear: function(callback){
				self.getTicketsProcessedWhitelist(startYear, endYear, "dashboard", type, null, callback);
			},
			ticketsUpdatedYear: function(callback){
				self.getTicketsUpdated(startYear, endYear, "dashboard", type, null, callback);
			}
		},
		// executes once all functions in the parallel array complete or as soon as one encounters an error.
		function(error, results){
			if (error) return cb(error);
			try {
				var data = {
					day: {},
					week: {},
					month: {},
					year: {}
				};
				
				data.day.tickets_processed = results.ticketsProcessedDay.count;
				data.day.tickets_processed_whitelist = results.ticketsProcessedWhitelistDay.count;
				data.day.tickets_updated = results.ticketsUpdatedDay.count;
				
				data.week.tickets_processed = results.ticketsProcessedWeek.count;
				data.week.tickets_processed_whitelist = results.ticketsProcessedWhitelistWeek.count;
				data.week.tickets_updated = results.ticketsUpdatedWeek.count;
				
				data.month.tickets_processed = results.ticketsProcessedMonth.count;
				data.month.tickets_processed_whitelist = results.ticketsProcessedWhitelistMonth.count;
				data.month.tickets_updated = results.ticketsUpdatedMonth.count;
				
				data.year.tickets_processed = results.ticketsProcessedYear.count;
				data.year.tickets_processed_whitelist = results.ticketsProcessedWhitelistYear.count;
				data.year.tickets_updated = results.ticketsUpdatedYear.count;
				
				var result = {
					timestamp: now.toISOString(),
					start_year: startYear,
					start_month: startMonth,
					start_day: startDay,
					start_week_date: startWeekDate,
					end_week_date: endWeekDate,
					data: data
				};
				cb(null, result);
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Generate KMM
	 * @param {string} timestamp - timestamp for when to generate the snapshot for, default is current date/time, format is ISO standard 2015-09-07T20:24:11.127Z
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON summary
	 */
	generateKMM: function(timestamp, type, cb) {
		var now = new Date();
		if (timestamp && timestamp !== "") {
			now = new Date(timestamp);
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
		
		var self = this;
		
		async.parallel({
			ticketsKMMDay: function(callback){
				//self.getTicketsUpdatedKMM(startDay, endDay, null, "dashboard", "all", type, false, null, null, null, null, callback);
				self.getTicketsUpdatedKMMCache(startDay, endDay, "dashboard", "all", type, null, null, null, true, callback);
			},
			ticketsKMMWeek: function(callback){
				//self.getTicketsUpdatedKMM(startWeekDate, endWeekDate, null, "dashboard", "all", type, false, null, null, null, null, callback);
				self.getTicketsUpdatedKMMCache(startWeekDate, endWeekDate, "dashboard", "all", type, null, null, null, true, callback);
			},
			ticketsKMMMonth: function(callback){
				//self.getTicketsUpdatedKMM(startMonth, endMonth, null, "dashboard", "all", type, false, null, null, null, null, callback);
				self.getTicketsUpdatedKMMCache(startMonth, endMonth, "dashboard", "all", type, null, null, null, true, callback);
			},
			ticketsKMMYear: function(callback){
				//self.getTicketsUpdatedKMM(startYear, endYear, null, "dashboard", "all", type, false, null, null, null, null, callback);
				self.getTicketsUpdatedKMMCache(startYear, endYear, "dashboard", "all", type, null, null, null, true, callback);
			}
		},
		// executes once all functions in the parallel array complete or as soon as one encounters an error.
		function(error, results){
			if (error) return cb(error);
			try {
				var data = {};
				
				data.day = results.ticketsKMMDay;
				data.week = results.ticketsKMMWeek;
				data.month = results.ticketsKMMMonth;
				data.year = results.ticketsKMMYear;
				
				var result = {
					timestamp: now.toISOString(),
					start_year: startYear,
					start_month: startMonth,
					start_day: startDay,
					start_week_date: startWeekDate,
					end_week_date: endWeekDate,
					data: data
				};
				cb(null, result);
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Generate time series data for KPI and KMM
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {string} cache - flag to determine whether to get data from cache (yes), partial cache (partial) which means current day KPI and live KMM or live data (no) [yes|partial|no]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON data
	 */
	generateTimeSeries: function(start, end, type, cache, cb) {
		var self = this;
		
		if (!type) {
			type = "all";
		}
		
		var fromCache = "yes";
		if (cache) {
			fromCache = cache;
		}
		
		if (fromCache === "yes") {
			dbAnalytics.get(dataTimeSeriesDoc, function(err, doc) {
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
			dbAnalytics.get(dataTimeSeriesDoc, function(err, doc) {
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
									self.getTicketsProcessed(startKPI, endKPI, "statsbyday", type, null, callback);
								} else {
									callback(null, {});
								}
							},
							timeSeriesTicketsProcessedWhitelist: function(callback){
								if (!end || end === "" || end >= today) {
									self.getTicketsProcessedWhitelist(startKPI, endKPI, "statsbyday", type, null, callback);
								} else {
									callback(null, {});
								}
							},
							timeSeriesTicketsUpdated: function(callback){
								if (!end || end === "" || end >= today) {
									self.getTicketsUpdated(startKPI, endKPI, "statsbyday", type, null, callback);
								} else {
									callback(null, {});
								}
							},
							timeSeriesTicketsUpdatedKMM: function(callback){
								self.getTicketsUpdatedKMMCache(start, end, "statsbyday", "all", type, null, null, null, true, callback);
							}
						}, function(error, results) {
							if (results.timeSeriesTicketsProcessed.tickets_processed_by_day) {
								var ticketsProcessedByDay = results.timeSeriesTicketsProcessed.tickets_processed_by_day
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
								var ticketsProcessedWhitelistByDay = results.timeSeriesTicketsProcessedWhitelist.tickets_processed_whitelist_by_day
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
								var ticketsUpdatedByDay = results.timeSeriesTicketsUpdated.tickets_updated_by_day
								for (key in ticketsUpdatedByDay) {
									if (!data[key]) {
										data[key] = {};
										data[key].tickets_updated = ticketsUpdatedByDay[key];
									} else {
										data[key].tickets_updated = ticketsUpdatedByDay[key];
									}
								}
							}

							var ticketsUpdatedKMMByDay = results.timeSeriesTicketsUpdatedKMM.tickets_updated_kmm_by_day
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
					self.getTicketsProcessed(start, end, "statsbyday", type, null, callback);
				},
				timeSeriesTicketsProcessedWhitelist: function(callback){
					self.getTicketsProcessedWhitelist(start, end, "statsbyday", type, null, callback);
				},
				timeSeriesTicketsUpdated: function(callback){
					self.getTicketsUpdated(start, end, "statsbyday", type, null, callback);
				},
				timeSeriesTicketsUpdatedKMM: function(callback){
					//self.getTicketsUpdatedKMM(start, end, null, "statsbyday", "all", type, false, null, null, null, null, callback);
					self.getTicketsUpdatedKMMCache(start, end, "statsbyday", "all", type, null, null, null, true, callback);
				}
			}, function(error, results) {
				if (error) return cb(error);
				try {
					var data = {};
					var ticketsProcessedByDay = results.timeSeriesTicketsProcessed.tickets_processed_by_day
					for (key in ticketsProcessedByDay) {
						if (!data[key]) {
							data[key] = {};
							data[key].tickets_processed = ticketsProcessedByDay[key];
						} else {
							data[key].tickets_processed = ticketsProcessedByDay[key];
						}
					}
					var ticketsProcessedWhitelistByDay = results.timeSeriesTicketsProcessedWhitelist.tickets_processed_whitelist_by_day
					for (key in ticketsProcessedWhitelistByDay) {
						if (!data[key]) {
							data[key] = {};
							data[key].tickets_processed_whitelist = ticketsProcessedWhitelistByDay[key];
						} else {
							data[key].tickets_processed_whitelist = ticketsProcessedWhitelistByDay[key];
						}
					}
					var ticketsUpdatedByDay = results.timeSeriesTicketsUpdated.tickets_updated_by_day
					for (key in ticketsUpdatedByDay) {
						if (!data[key]) {
							data[key] = {};
							data[key].tickets_updated = ticketsUpdatedByDay[key];
						} else {
							data[key].tickets_updated = ticketsUpdatedByDay[key];
						}
					}
					var ticketsUpdatedKMMByDay = results.timeSeriesTicketsUpdatedKMM.tickets_updated_kmm_by_day
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
	 * @param {string} stream - flag to determine whether to send stream back as a response or just text
	 * @param {string} cache - flag to determine whether to get data from cached doc or live data
	 * @param {string} spotlight - flag to include spotlight products in results, default is false
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {string} - delmited text
	 */
	generateTimeSeriesTxt: function(start, end, delimiter, type, stream, cache, spotlight, cb) {
		var streamResponse = true;
		if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
			streamResponse = false;
		}

		var includeSpotlight = false;
		if ((typeof(spotlight) === "string" && spotlight === "true") || (typeof(spotlight) === "boolean" && spotlight)) {
			includeSpotlight = true;
		}

		var txtDelimiter = "\t";
		if (delimiter && delimiter !== "") {
			txtDelimiter = delimiter;
		}
		
		var self = this;
		self.generateTimeSeries(start, end, type, cache, function(err, result) {
			try {
				if (includeSpotlight) {
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
				} else {
					var baselineData = result.data;
					dbAnalytics.get(dataSpotlightTimeSeriesDoc, function(err, result) {
						if (err) return cb(err);
						try {
							var spotlightData = result.data.all;
							if (type && result.data[type]) {
								spotlightData = result.data[type];
							}

							var data = [];
							for (day in baselineData) {
								var row = {};
								for (field in baselineData[day]) {
									row["date"] = day;
									if (spotlightData[day] && spotlightData[day][field]) {
										row[field] = baselineData[day][field] - spotlightData[day][field];
									} else {
										row[field] = baselineData[day][field];
									}
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
				}
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
	saveTimeSeries: function(start, end, save, cache, cb) {
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
				self.generateTimeSeries(start, end, "all", fromCache, callback);
			},
			timeSeriesSW: function(callback){
				self.generateTimeSeries(start, end, "sw", fromCache, callback);
			},
			timeSeriesHW: function(callback){
				self.generateTimeSeries(start, end, "hw", fromCache, callback);
			}
		}, function(error, results) {
			if (error) return cb(error);
			dbAnalytics.get(dataTimeSeriesDoc, function(err, doc) {
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
	 * Generate Solution Stats
	 * @param {string} timestamp - timestamp for when to generate the snapshot for, default is current date/time, format is ISO standard 2015-09-07T20:24:11.127Z
	 * @param {string} save - flag to determine whether to save updated solution stats back to analytics DB or just display results to user [true|false]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON summary
	 */
	generateSolutionStats: function(timestamp, save, cb) {
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
		
		dbAnalytics.get(dataTimeSeriesDoc, function(err, doc) {
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
	 * Save tickets updated KMM data to cache file
	 * @param {string} timestamp - year + month timestamp e.g. 2016-01
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON data
	 */
	saveTicketsUpdatedKMM: function(timestamp, cb) {
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
		self.getTicketsUpdatedKMM(start, end, null, "data", null, null, false, null, null, null, true, function(err, result) {
			if (err) return cb(err);
			var docId = dataTicketsUpdatedKMMDoc + start;
			var data = result;
			dbAnalytics.get(docId, function(err, result) {
				if (err) {
					if (err.statusCode === 404) {
						var doc = {
							_id: docId,
							timestamp: (new Date()).toISOString(),
							count: data.count,
							tickets: data.tickets
						}
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
	 * Save a new report log entry to the analytics DB doc
	 * @param {string} reportlog - analytics DB doc name
	 * @param {number} reportLogMaxEntries - limit of report log entries to store
	 * @param {string} reportdirectory - directory where the report was saved
	 * @param {string} report - name of the report
	 * @param {string} timestamp - timestamp of when the report was generated
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} - JSON data
	 */
	saveReportLog: function(reportLog, reportLogMaxEntries, reportDirectory, report, timestamp, cb) {
		dbAnalytics.get(reportLog, function(err, doc) {
			if (err) return cb(err);
			try {
				if (doc.reports && Array.isArray(doc.reports)) {
					var reports = doc.reports
					reports.push({
						directory: reportDirectory,
						report: report,
						timestamp: timestamp
					});
					
					if (reports.length > reportLogMaxEntries) {
						reports.splice(0, (reports.length - reportLogMaxEntries));
					}
					doc.reports = reports;
					//cb(null, {entries: reports.length, reports: reports});
					dbAnalytics.insert(doc, doc._id, function(err, result) {
						if (err) return cb(err);
						cb(null, result);
					});
				}
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Get tickets breakdown by buckets
	 * @param {string} start - starting timestamp for filtering tickets
	 * @param {string} end - ending timestamp for filtering tickets
	 * @param {number} limit - value passed to DB to limit number of results returned
	 * @param {string} type - type value for filtering tickets [all|hw|sw]
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON
	 */
	getTicketsBreakdown: function(start, end, limit, type, stream, cb) {
		var streamResponse = true;
		if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
			streamResponse = false;
		}
		
		var qparams = {reduce: false};
		if (start || end) {
			if (start && start !== "") {
				qparams.startkey = start;
			}
			if (end && end !== "") {
				qparams.endkey = end;
			}
		} else {
			if (limit) {
				qparams.descending = true;
				qparams.limit = limit;
			}
		}
		
		// Get the list of tickets processed from logs DB identified by WFS00-NewTicketReceived log entries
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
		dbLogs.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var ticketIds = [];
				var txIds = [];
				var tickets = []
				result.rows.forEach(function(row) {
					if (row.value.ticketId && row.value.ticketId !== "") {
						ticketIds.push(row.value.ticketId);
						txIds.push(row.value.trId);
						tickets.push({
							ticket_id: row.value.ticketId,
							timestamp: row.key,
						});
					}
				});
				//cb(null, {count: tickets.length, tickets: tickets});
				
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
					whitelistDetails: function(callback) {
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
						dbAnswers.view(design, view, qparams, function(err, result) {
							if (err) return cb(err);
							try {
								var count = 0;
								var whitelistDetails = {};
								result.rows.forEach(function(row) {
									if (row.value[0] && row.value[0] !== "") {
										if (!whitelistDetails[row.value[0]]) {
											whitelistDetails[row.value[0]] = 1;
											count++;
										}
									}
								});
								callback(null, {count: count, details: whitelistDetails});
							} catch(e) {
								callback(e);
							}
						});
					},
					ticketsUpdatedDetails: function(callback) {
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
								var count = 0;
								var ticketsUpdatedDetails = {};
								result.rows.forEach(function(row) {
									if (!ticketsUpdatedDetails[row.value.ticketId]) {
										ticketsUpdatedDetails[row.value.ticketId] = 1;
										count++;
									}
								});
								callback(null, {count: count, details: ticketsUpdatedDetails});
							} catch(e) {
								callback(e);
							}
						});
					}
				}, function(error, results) {
					if (error) cb(error);
					var ticketDetails = results.ticketDetails.details;
					var whitelistDetails = results.whitelistDetails.details;
					var ticketsUpdatedDetails = results.ticketsUpdatedDetails.details;
					//cb(null, {count: results.whitelistDetails.count, details: results.whitelistDetails.details});
					//cb(null, {count: results.ticketsUpdatedDetails.count, details: results.ticketsUpdatedDetails.details})
					
					try {
						tickets.forEach(function(ticket) {
							if (ticketDetails[ticket.ticket_id]) {
								ticket.component_id = ticketDetails[ticket.ticket_id].component_id;
								ticket.country_code = ticketDetails[ticket.ticket_id].country_code;
							}
							ticket.whitelist = 0;
							if (whitelistDetails[ticket.ticket_id]) {
								ticket.whitelist = 1;
							}
							ticket.updated = 0;
							if (ticketsUpdatedDetails[ticket.ticket_id]) {
								ticket.updated = 1;
							}
						});
						
						//cb(null, {count: tickets.length, tickets: tickets});
						
						var fields = [
							"ticket_id",
							"timestamp",
							"component_id",
							"country_code",
							"whitelist",
							"updated"
						];
						
						json2csv({ data: tickets, fields: fields, del: "\t" }, function(err, tsv) {
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
			} catch(e) {
				cb(e);
			}
		});
	}
	
}