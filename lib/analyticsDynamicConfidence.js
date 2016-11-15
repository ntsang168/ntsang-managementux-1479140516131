/**
 * Management UX Analytics Dynamic Confidence Library
 * @module lib/analyticsDynamicConfidence
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
var q = require("q");

var dbConfig,
    dbTickets,
    dbLogs,
    dbAnswers,
    dbAnalytics,
    dbPmrsMetrics;

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

        var dbCredentialsTickets = {},
            dbCredentialsLogs = {},
            dbCredentialsAnswers = {},
            dbCredentialsAnalytics = {},
            dbCredentialsPmrsMetrics = {};

        var cloudantTickets,
            cloudantLogs,
            cloudantAnswers,
            cloudantAnalytics,
            cloudantPmrsMetrics;

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

        dbCredentialsAnalytics.host = result.cloudant.analytics_db_readwrite.host;
        dbCredentialsAnalytics.user = result.cloudant.analytics_db_readwrite.username;
        dbCredentialsAnalytics.password = result.cloudant.analytics_db_readwrite.password;
        dbCredentialsAnalytics.dbName = result.cloudant.analytics_db_readwrite.db;
        dbCredentialsAnalytics.url = "https://" + dbCredentialsAnalytics.user + ":" + dbCredentialsAnalytics.password + "@" + dbCredentialsAnalytics.host;
        cloudantAnalytics = require('cloudant')(dbCredentialsAnalytics.url);
        dbAnalytics = cloudantAnalytics.use(dbCredentialsAnalytics.dbName);

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

        // Initialize docs
        if (env.mode === "PROD") {
        } else {
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

function getSum(total, num) {
    return total + num;
}

/**
 * Helper function to get list of dynamic confidence values
 * @param {string} collection - type of collection (Baseline, Spotlight, Hardware) to filter by [BL|SL|HW]
 * @param {string} start - starting timestamp for filtering results
 * @param {string} end - ending timestamp for filtering results
 * @param {number} limit - value passed to DB to limit number of results returned
 * @returns {*|promise} list of dynamic confidence values and filters
 */
function getDynamicConfidenceValues(collection, position, start, end, limit) {
    var filters = {
        collection: collection,
        position: position
    };

    var design = "dynamic-confidence",
        view = "dynamic-confidence";
    var params = {
        descending: true,
        reduce: false
    };
    var startDate = {},
        endDate = null;
    // Since we're in descending order the start and end will be flipped
    if (start) {
        endDate = start;
    }
    if (end) {
        startDate = end;
    }
    if (limit) {
        params.limit = limit;
    }
    params.startkey = [collection, startDate];
    params.endkey = [collection, endDate];

    var deferred = q.defer();
    dbLogs.view(design, view, params, function(err, result) {
       if (err) {
           deferred.reject(err);
       } else {
           try {
               var confidenceValues = [];
               result.rows.forEach(function(row) {
                   confidenceValues.push({
                       log_id: row.id,
                       timestamp: row.key[1],
                       ticket_id: row.value.additional_information.ticketId,
                       tr_id: row.value.additional_information.trId,
                       confidence_values: row.value.additional_information.confidenceValues
                   });
               });
               deferred.resolve({data: confidenceValues, filters: filters});
           } catch(e) {
               deferred.reject(e);
           }

       }
    });
    return deferred.promise;
}

/**
 * Helper function to get answer transaction data
 * @param {Object} confidenceValues - list of confidence values and filters
 * @returns {*|promise} list of dynamic confidence values, answer scores and filters
 */
function getTransaction(confidenceValues) {
    var trIds = [];
    confidenceValues.data.forEach(function(row) {
        trIds.push(row.tr_id);
    });

    var design = "dynamic-confidence",
        view = "answers-confidence"
        params = {keys: trIds};

    var deferred = q.defer();
    dbAnswers.view(design, view, params, function(err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            try {
                var answers = {};
                result.rows.forEach(function(row) {
                    answers[row.key] = row.value.answers;
                });
                confidenceValues.data.forEach(function(row) {
                    if (answers[row.tr_id]) {
                        row.answers = answers[row.tr_id];
                    }
                });
                deferred.resolve({data: confidenceValues.data, filters: confidenceValues.filters});
            } catch(e) {
                deferred.reject(e);
            }
        }
    });
    return deferred.promise;
}

/**
 * Helper function to calculate buzz in rate to go along with the confidence and answer score
 * @param {Object} confidenceAnswerValues - list of confidence values, answer scores and filters
 * @returns {*|promise} list of dynamic confidence values, answer scores, buzz in rates and filters
 */
function getBuzzIn(confidenceAnswerValues) {
    var pos = 1;
    if (confidenceAnswerValues.filters.position) {
        pos = confidenceAnswerValues.filters.position;
    }
    var deferred = q.defer();
    try {
        var half = Math.trunc(confidenceAnswerValues.data.length / 2);
        console.log(half);
        var buzzIn = [];
        var confidenceAnswerBuzzIn = [];
        for (var i=0; i<confidenceAnswerValues.data.length; i++) {
            var confidenceValues = confidenceAnswerValues.data[i].confidence_values;
            var answers = confidenceAnswerValues.data[i].answers;
            if (answers && answers[pos-1]) {
                buzzIn.push(answers[pos-1].ticket_updated);
            }
            if (i < half) {
                var confidenceHigh = 1;
                var confidenceMed = 0;
                var answerScore = 0;
                var ticketUpdated = 0;
                if (answers && answers[pos-1]) {
                    answerScore = answers[pos-1].ranker_score;
                    ticketUpdated = answers[pos-1].ticket_updated
                }
                if (confidenceValues && confidenceValues[pos-1]) {
                    confidenceHigh = confidenceValues[pos-1].high;
                    confidenceMed = confidenceValues[pos-1].medium;
                }
                confidenceAnswerBuzzIn.push({
                    timestamp: confidenceAnswerValues.data[i].timestamp,
                    ticket_id: confidenceAnswerValues.data[i].ticket_id,
                    tr_id: confidenceAnswerValues.data[i].tr_id,
                    log_id: confidenceAnswerValues.data[i].log_id,
                    confidence_high: confidenceHigh,
                    confidence_med: confidenceMed,
                    answer_score: answerScore,
                    ticket_updated: ticketUpdated
                });
            }
        }
        for (var i=0; i<half; i++) {
            var last = buzzIn.slice(i, i+half);
            if (confidenceAnswerBuzzIn[i]) {
                confidenceAnswerBuzzIn[i].buzzin_rate = (last.reduce(getSum) / half);
            }
        }
        deferred.resolve({data: confidenceAnswerBuzzIn, filters: confidenceAnswerValues.filters});
    } catch(e) {
        deferred.reject(e);
    }
    return deferred.promise;
}

function getTargetRate(confidenceAnswerBuzzIn) {
    var deferred = q.defer();
    dbConfig.get("Modules_00_Hub", function(err, doc) {
        if (err) {
            deferred.reject(err);
        } else {
            if (doc.confidenceParams) {
                var targetRate = 0.5;
                switch(confidenceAnswerBuzzIn.filters.collection) {
                    case "SL":
                        targetRate = doc.confidenceParams.targetSL;
                        break;
                    case "BL":
                        targetRate = doc.confidenceParams.targetBL;
                        break;
                    case "HW":
                        targetRate = doc.confidenceParams.targetHW;
                        break;
                    default:
                        break;
                }
                confidenceAnswerBuzzIn.target_rate = targetRate;
                deferred.resolve(confidenceAnswerBuzzIn);
            } else {
                deferred.reject("Confidence params are missing");
            }
        }
    });
    return deferred.promise;
}

/**
 * Helper function to convert JSON list of dynamic confidence values to delimited text
 * @param {Object} confidence - list of dynamic confidence values
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @returns {*|promise} list of modified tickets in delimited text output
 */
function confidenceValuesToDelimitedText(confidence, delimiter, stream) {
    var streamResponse = true;
    if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
        streamResponse = false;
    }

    var txtDelimiter = "\t";
    if (delimiter && delimiter !== "") {
        txtDelimiter = delimiter;
    }

    var deferred = q.defer();
    try {
        var fields = ["timestamp", "ticket_id", "log_id", "confidence1", "confidence2", "confidence3", "confidence4", "confidence5"];
        var data = [];
        confidence.data.forEach(function(values) {
            var row = {
                timestamp: values.timestamp,
                ticket_id: values.ticket_id,
                log_id: values.log_id
            };
            var pos = 1;
            values.confidence_values.forEach(function(value) {
                row["confidence" + pos] = value.medium;
                pos++;
            });
            data.push(row);
        });

        json2csv({ data: data, fields: fields, del: txtDelimiter }, function(err, tsv) {
            if (err) {
                deferred.reject(err);
            } else {
                if (streamResponse) {
                    var s = new Readable;
                    s.push(tsv);
                    s.push(null);
                    deferred.resolve(s);
                } else {
                    deferred.resolve(tsv);
                }
            }
        });
    } catch(e) {
        deferred.reject(e);
    }
    return deferred.promise;
}

/**
 * Helper function to convert JSON list of dynamic confidence values, answer scores and buzz in rates to delimited text
 * @param {Object} confidenceAnswerBuzzIn - list of dynamic confidence values, answer scores and buzz in rates
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @returns {*|promise} list of modified tickets in delimited text output
 */
function confidenceAnswerBuzzInToDelimitedText(confidenceAnswerBuzzIn, delimiter, stream) {
    var streamResponse = true;
    if ((typeof(stream) === "string" && stream === "false") || (typeof(stream) === "boolean" && !stream)) {
        streamResponse = false;
    }

    var txtDelimiter = "\t";
    if (delimiter && delimiter !== "") {
        txtDelimiter = delimiter;
    }

    var deferred = q.defer();
    try {
        var fields = ["timestamp", "ticket_id", "tr_id", "log_id", "confidence", "answer_score", "ticket_updated", "buzzin_rate", "target_rate"];
        var data = [];
        confidenceAnswerBuzzIn.data.forEach(function(values) {
            var row = {
                timestamp: values.timestamp,
                ticket_id: values.ticket_id,
                tr_id: values.tr_id,
                log_id: values.log_id,
                confidence: values.confidence_med,
                answer_score: values.answer_score,
                ticket_updated: values.ticket_updated,
                buzzin_rate: values.buzzin_rate,
                target_rate: confidenceAnswerBuzzIn.target_rate
            };
            data.push(row);
        });

        json2csv({ data: data, fields: fields, del: txtDelimiter }, function(err, tsv) {
            if (err) {
                deferred.reject(err);
            } else {
                if (streamResponse) {
                    var s = new Readable;
                    s.push(tsv);
                    s.push(null);
                    deferred.resolve(s);
                } else {
                    deferred.resolve(tsv);
                }
            }
        });
    } catch(e) {
        deferred.reject(e);
    }
    return deferred.promise;
}

/**
 * Get list of dynamic confidence values
 * @param {string} collection - type of collection (Baseline, Spotlight, Hardware) to filter by [BL|SL|HW]
 * @param {string} start - starting timestamp for filtering results
 * @param {string} end - ending timestamp for filtering results
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} output - output format to return {json|txt}
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} JSON summary
 */
exports.getDynamicConfidenceHistory = function(collection, start, end, limit, output, delimiter, stream, callback) {
    getDynamicConfidenceValues(collection, null, start, end, limit)
        .then(function(result) {
            if (output === "txt") {
                confidenceValuesToDelimitedText(result, delimiter, stream)
                    .then(function(result) {
                        callback(null, result);
                    })
                    .catch(function(error) {
                        callback(error);
                    });
            } else {
                callback(null, {count: result.data.length, confidence_values: result.data});
            }
        })
        .catch(function(error) {
            callback(error);
        });
};

/**
 * Get dynamic confidence buzz in
 * @param {string} collection - type of collection (Baseline, Spotlight, Hardware) to filter by [BL|SL|HW]
 * @param {number} position - answer position to filter by [1|2|3|4|5]
 * @param {string} start - starting timestamp for filtering results
 * @param {string} end - ending timestamp for filtering results
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} output - output format to return {json|txt}
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} JSON summary
 */
exports.getDynamicConfidenceBuzzIn = function(collection, position, start, end, limit, output, delimiter, stream, callback) {
    var newLimit = limit;
    if (limit) {
        newLimit = Number(limit) + Number(limit);
    }
    getDynamicConfidenceValues(collection, position, start, end, newLimit)
        .then(getTransaction)
        .then(getBuzzIn)
        .then(getTargetRate)
        .then(function(result) {
            if (output === "txt") {
                confidenceAnswerBuzzInToDelimitedText(result, delimiter, stream)
                    .then(function(result) {
                        callback(null, result);
                    })
                    .catch(function(error) {
                        callback(error);
                    });
            } else {
                callback(null, {count: result.data.length, target_rate: result.target_rate, data: result.data});
            }
        })
        .catch(function(error) {
            callback(error);
        });
};