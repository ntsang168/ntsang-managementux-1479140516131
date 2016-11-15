/**
 * Management UX Analytics SME QA Pairs
 * @module lib/analyticsSMEQAPairs
 */

var env = { mode: "DEV", debug: true };
if (process.env.FR_ROLE) {
	env.mode = (process.env.FR_ROLE).toUpperCase();
}
if (process.env.FR_DEBUG_MODE) {
	env.debug = (process.env.FR_DEBUG_MODE == "true");
}

var async = require("async");
var q = require("q");

var dbConfig;
var dbQAPairs;
var dbCQDBKCS;

var qaPairsConfig = {};

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
		var dbCredentialsQAPairs = {};
		var cloudantQAPairs;
		dbCredentialsQAPairs.host = result.cloudant.questionanswerpairs_db_readwrite.host;
		dbCredentialsQAPairs.user = result.cloudant.questionanswerpairs_db_readwrite.username;
		dbCredentialsQAPairs.password = result.cloudant.questionanswerpairs_db_readwrite.password;
		dbCredentialsQAPairs.dbName = result.cloudant.questionanswerpairs_db_readwrite.db;
		dbCredentialsQAPairs.url = "https://" + dbCredentialsQAPairs.user + ":" + dbCredentialsQAPairs.password + "@" + dbCredentialsQAPairs.host;
		cloudantQAPairs = require('cloudant')(dbCredentialsQAPairs.url);
		dbQAPairs = cloudantQAPairs.use(dbCredentialsQAPairs.dbName);

		// Initialize Question and Answer Pairs configuration
		qaPairsConfig = result.question_answer_pairs;

		var dbCredentialsCQDBKCS = {};
		var cloudantCQDBKCS;
		dbCredentialsCQDBKCS.host = result.cloudant.cqdbkcs_db_read.host;
		dbCredentialsCQDBKCS.user = result.cloudant.cqdbkcs_db_read.username;
		dbCredentialsCQDBKCS.password = result.cloudant.cqdbkcs_db_read.password;
		dbCredentialsCQDBKCS.dbName = result.cloudant.cqdbkcs_db_read.db;
		dbCredentialsCQDBKCS.url = "https://" + dbCredentialsCQDBKCS.user + ":" + dbCredentialsCQDBKCS.password + "@" + dbCredentialsCQDBKCS.host;
		cloudantCQDBKCS = require('cloudant')(dbCredentialsCQDBKCS.url);
		dbCQDBKCS = cloudantCQDBKCS.use(dbCredentialsCQDBKCS.dbName);
	});
}

initDBConnection();

/**
 * Get the QA Pairs
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {number} limit - value passed to DB to limit number of results returned
 * @returns {*|promise} - list of PMRs from QA Pairs
 */
function getQAPairs(start, end, limit) {
	var design = "analytics";
	var view = "l0-qa-pairs";
	var params = {reduce: false};

	if (start || end) {
		if (start) {
			params.startkey = start;
		}
		if (end) {
			params.endkey = end;
		}
	} else {
		if (limit) {
			params.descending = true;
			params.limit = limit;
		}
	}

	var deferred = q.defer();
	dbQAPairs.view(design, view, params, function(err, result) {
		if (err) {
			deferred.reject(err);
		} else {
			var ticketIds = [];
			result.rows.forEach(function(row) {
				var ticketId = row.value
				//var ticketId = row.value.replace(/,/g, "-") + "_O" + row.key.substring(2, 10);
				//if (!ticketIds[ticketId]) ticketIds[ticketId] = 1;
				ticketIds.push(ticketId);
			});
			deferred.resolve(ticketIds);
		}
	});
	return deferred.promise;
}

/*
 * Get the KMM data based on PMR numbers from QA Pairs
 * @param {Array} ticketIds - list of ticket IDs
 * @returns {*|promise} - KMM details for PMRs
 */
function getKMM(ticketIds) {
	var design = "analytics-support-agent";
	var view = "sme-feedback";
	var params = {reduce: false, keys: ticketIds};
	var deferred = q.defer();
	dbCQDBKCS.view(design, view, params, function(err, result) {
		if (err) {
			deferred.reject(err);
		} else {
			try {
				var kmmDetails = {};
				result.rows.forEach(function (row) {
					if (!kmmDetails[row.key]) {
						kmmDetails[row.key] = {};
						kmmDetails[row.key][row.value[2]] = {
							rating: row.value[0],
							content_src: row.value[1],
							content_id: row.value[2],
							action_dt: row.value[3],
							action_tm: row.value[4],
							retain_id: row.value[5]
						};
					} else {
						kmmDetails[row.key][row.value[2]] = {
							rating: row.value[0],
							content_src: row.value[1],
							content_id: row.value[2],
							action_dt: row.value[3],
							action_tm: row.value[4],
							retain_id: row.value[5]
						};
					}
				});
				deferred.resolve(kmmDetails);
			} catch (e) {
				deferred.reject(err);
			}
		}
	});
	return deferred.promise;
}

/*
 * Match the QA Pairs with the KMM data
 * @param {Object} - map of tickets to KMM details
 * @returns {*|promise} - list of QA Pairs with associated KMM data
 */
function getQAPairsWithKMM(kmmDetails) {
	var design = "analytics";
	var view = "by-pmr";
	var params = {include_docs: true, keys: Object.keys(kmmDetails)};
	var deferred = q.defer();
	dbQAPairs.view(design, view, params, function(err, result) {
		if (err) {
			deferred.reject(err);
		} else {
			try {
				var qaPairs = [];
				result.rows.forEach(function(row) {
					if (row.doc) {
						var doc = row.doc;
						var kmm = [];
						var timestampLatest = "";
						var answers = doc.answer;
						if (kmmDetails[doc.pmrnumber]) {
							kmmAll = kmmDetails[doc.pmrnumber];
							answers.forEach(function(answer) {
								if (kmmAll[answer]) {
									var timestamp = kmmAll[answer].action_dt + "T" + kmmAll[answer].action_tm + ".000Z";
									if (!timestampLatest) timestampLatest = timestamp;
									else if (timestamp > timestampLatest) timestampLatest = timestamp;
									kmm.push(kmmAll[answer]);
								} else {
									kmm.push({});
								}
							});
							var feedback = {
								user: doc.answeredBy,
								ratings: kmm,
								timestamp: timestampLatest
							};
							doc.sme_feedback = [feedback];
						}
						qaPairs.push(doc);
					}
				});
				deferred.resolve(qaPairs);
			} catch(e) {
				deferred.reject(err);
			}
		}
	});
	return deferred.promise;
}

/*
 * Set the KMM data for QA Pairs
 * @param {Object} - map of tickets to KMM details
 * @returns {*|promise} - results from bulk insert
 */
function setQAPairsWithKMM(qaPairs) {
	var deferred = q.defer();
	dbQAPairs.bulk({docs: qaPairs}, function(err, result) {
		if (err) {
			deferred.reject(err);
		} else {
			deferred.resolve({
				count: qaPairs.length,
				qapairs: qaPairs,
				result: result
			});
		}
	});
	return deferred.promise;
}

/**
 * REST API callback
 * @callback apiCallback
 * @param {Object} err - error
 * @param {Object} data - JSON data result
 */

/**
 * Get L0 PMR KMM feedback for QA Pairs
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} JSON
 */
exports.getL0PMRKMMFeedback = function(start, end, limit, callback) {
	getQAPairs(start, end, limit)
		.then(getKMM)
		.then(getQAPairsWithKMM)
		.then(function(result) {
			callback(null, {count: result.length, qapairs: result});
		})
		.catch(function(error) {
			callback(error);
		});
};

/**
 * Set L0 PMR KMM feedback for QA Pairs
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} JSON
 */
exports.setL0PMRKMMFeedback = function(start, end, limit, callback) {
	getQAPairs(start, end, limit)
		.then(getKMM)
		.then(getQAPairsWithKMM)
		.then(setQAPairsWithKMM)
		.then(function(result) {
			callback(null, {count: result.count, qapairs: result.qapairs, result: result.result});
		})
		.catch(function(error) {
			callback(error);
		});
};