/**
 * Management UX Analytics Assigned Set Library
 * @module lib/analyticsAssignedSet
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

function getAssignedSetTickets(limit, assignedSet, componentIds) {

    var compIdsMap = {};
    if (componentIds && componentIds !== "") {
        if (componentIds.indexOf(",") >= 0) {
            componentIds.split(",").forEach(function(compId) {
                compIdsMap[compId.trim()] = 1;
            });
        } else {
            compIdsMap[componentIds.trim()] = 1;
        }
    }

    var deferred = q.defer();
    var design = "analytics-assigned-set",
        view = "assigned-set-comp-id";
    var params = {
        reduce: false,
        startkey: [assignedSet],
        endkey: [assignedSet, {}]
    };
    if (limit) {
        params.limit = limit;
    }
    dbTickets.view(design, view, params, function(err, result) {
       if (err) {
           deferred.reject(err);
       } else {
           var tickets = {};
           result.rows.forEach(function(row) {
              if (compIdsMap[row.key[1]]) {
                  tickets[row.id] = {
                      component_id: row.key[1]
                  };
              }
           });
           deferred.resolve(tickets);
       }
    });
    return deferred.promise;
}

function getKMMDetails(tickets) {
    var deferred = q.defer();
    var ticketIds = [];
    Object.keys(tickets).forEach(function(ticket) {
        ticketIds.push(ticket);
    });
    var design = "ux",
        view = "kmmResponsesByTicket";
    var params = {keys: ticketIds};
    dbPmrsMetrics.view(design, view, params, function(err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            result.rows.forEach(function(row) {
                if (tickets[row.key]) {
                    if (tickets[row.key].kmm) {
                        tickets[row.key].kmm.push({
                            content_id: row.value[2],
                            content_src: row.value[1],
                            contrib_ind: row.value[0]
                        });
                    } else {
                        tickets[row.key].kmm = [{
                            content_id: row.value[2],
                            content_src: row.value[1],
                            contrib_ind: row.value[0]
                        }];
                    }
                }
            });
            deferred.resolve(tickets);
        }
    });
    return deferred.promise;
}

function convertToDelimitedText(tickets, delimiter, stream) {
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
        var data = [];
        var fields = ["ticket_id", "component_id", "content_id", "content_src", "contrib_ind"];
        Object.keys(tickets).forEach(function(ticket) {
            var kmm = tickets[ticket].kmm;
            if (kmm) {
                kmm.forEach(function(entry) {
                    var row = {
                        ticket_id: ticket,
                        component_id: tickets[ticket].component_id,
                        content_id: entry.content_id,
                        content_src: entry.content_src,
                        contrib_ind: entry.contrib_ind
                    };
                    data.push(row);
                });
            } else {
                data.push({
                    ticket_id: ticket,
                    component_id: tickets[ticket].component_id
                });
            }
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
 * Get list of tickets from an assigned set with KMM
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} assignedSet - assigned set value to filter by
 * @param {string} componentIds - comma delimited list of component IDs to filter by
 * @param {string} output - output format to return {json|txt}
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} list of modified tickets in JSON or delimited text
 */
exports.getAssignedSetTicketsWithKMM = function(limit, output, assignedSet, componentIds, delimiter, stream, callback) {
    getAssignedSetTickets(limit, assignedSet, componentIds)
        .then(getKMMDetails)
        .then(function(result) {
            if (output === "txt") {
                convertToDelimitedText(result, delimiter, stream)
                    .then(function(result) {
                        callback(null, result);
                    })
                    .catch(function(error) {
                        callback(error);
                    });
            } else {
                callback(null, {count: result.length, tickets: result});
            }
        })
        .catch(function(error) {
            callback(error);
        });
};