/**
 * Management UX Analytics Modified Tickets Library
 * @module lib/analyticsModified
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

var ticketsKpiConfig = {},
    solutionStatsDoc = "",
    dataModifiedTimeSeriesDoc = "",
    dataModifiedTicketsUpdatedKMMDoc = "";

var componentIdsMap = {};

var kmmFeedbackScale = {
    "R": 5,
    "Y": 4,
    "N": 3
};

var reportFieldsModifiedTickets = [
    "ticket_id",
    "timestamp",
    "tr_id",
    "log_id",
    "build",
    "component_id",
    "component_desc",
    "machine_type",
    "product_name",
    "division",
    "country",
    "title",
    "description",
    "answer1_id",
    "answer1_url",
    "answer1_title",
    "answer1_confidence",
    "answer1_score",
    "answer1_ranker_score",
    "answer1_ir_engine",
    "answer1_ir_engine_id",
    "answer2_id",
    "answer2_url",
    "answer2_title",
    "answer2_confidence",
    "answer2_score",
    "answer2_ranker_score",
    "answer2_ir_engine",
    "answer2_ir_engine_id",
    "answer3_id",
    "answer3_url",
    "answer3_title",
    "answer3_confidence",
    "answer3_score",
    "answer3_ranker_score",
    "answer3_ir_engine",
    "answer3_ir_engine_id",
    "answer4_id",
    "answer4_url",
    "answer4_title",
    "answer4_confidence",
    "answer4_score",
    "answer4_ranker_score",
    "answer4_ir_engine",
    "answer4_ir_engine_id",
    "answer5_id",
    "answer5_url",
    "answer5_title",
    "answer5_confidence",
    "answer5_score",
    "answer5_ranker_score",
    "answer5_ir_engine",
    "answer5_ir_engine_id"
];

var reportFieldsModifiedTicketsExtended = [
    "ticket_id",
    "timestamp",
    "tr_id",
    "log_id",
    "build",
    "component_id",
    "component_desc",
    "machine_type",
    "product_name",
    "division",
    "country",
    "title",
    "description",
    "status",
    "close_date",
    "owner_name",
    "owner_id",
    "resolver_name",
    "answer1_id",
    "answer1_url",
    "answer1_title",
    "answer1_confidence",
    "answer1_score",
    "answer1_ranker_score",
    "answer1_ir_engine",
    "answer1_ir_engine_id",
    "answer1_contrib_ind",
    "answer1_content_src",
    "answer1_action_dt",
    "answer1_action_tm",
    "answer2_id",
    "answer2_url",
    "answer2_title",
    "answer2_confidence",
    "answer2_score",
    "answer2_ranker_score",
    "answer2_ir_engine",
    "answer2_ir_engine_id",
    "answer2_contrib_ind",
    "answer2_content_src",
    "answer2_action_dt",
    "answer2_action_tm",
    "answer3_id",
    "answer3_url",
    "answer3_title",
    "answer3_confidence",
    "answer3_score",
    "answer3_ranker_score",
    "answer3_ir_engine",
    "answer3_ir_engine_id",
    "answer3_contrib_ind",
    "answer3_content_src",
    "answer3_action_dt",
    "answer3_action_tm",
    "answer4_id",
    "answer4_url",
    "answer4_title",
    "answer4_confidence",
    "answer4_score",
    "answer4_ranker_score",
    "answer4_ir_engine",
    "answer4_ir_engine_id",
    "answer4_contrib_ind",
    "answer4_content_src",
    "answer4_action_dt",
    "answer4_action_tm",
    "answer5_id",
    "answer5_url",
    "answer5_title",
    "answer5_confidence",
    "answer5_score",
    "answer5_ranker_score",
    "answer5_ir_engine",
    "answer5_ir_engine_id",
    "answer5_contrib_ind",
    "answer5_content_src",
    "answer5_action_dt",
    "answer5_action_tm"
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

        // Store the configuration for the tickets kpi report
        ticketsKpiConfig = result.analytics;

        // Initialize docs
        if (env.mode === "PROD") {
            solutionStatsDoc = result.analytics.modified_solution_stats_doc;
            dataModifiedTimeSeriesDoc = result.analytics.data_modified_time_series_doc;
        } else {
            solutionStatsDoc = result.analytics.modified_solution_stats_doc_test;
            dataModifiedTimeSeriesDoc = result.analytics.data_modified_time_series_doc_test;
        }

        // Initialize division component ID product map
        initComponentIds();
    });
}

/** Initialize Component ID Whitelist and Divisions */
function initComponentIds() {
    dbAnalytics.get("map_compids_divisions_products", function(err, result) {
        if (err) return console.error("Failed to get component ID map");
        componentIdsMap = result.component_ids;
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
 * Helper function to get list of modified tickets based on log entry action
 * @param {string} action - specific action to look for in the logs [processed|updated]
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} type - type value for filtering tickets [all|hw|sw]
 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
 * @param {string} divisions - semicolon delimited list of divisions to filter by
 * @param {string} componentIds - comma delimited list of component IDs to filter by
 * @param {string} products - comma delimited list of products to filter by
 * @returns {*|promise} list of modified tickets and filters
 */
function getModifiedTickets(action, start, end, limit, type, response, divisions, componentIds, products) {
    var logEntry = "WFS00-ModifiedTicketReceived";
    if (action === "updated") {
        logEntry = "WFS00-TicketWriterSubmittedUpdates";
    }

    var filters = {};
    if (divisions && divisions !== "" && divisions !== "all") {
        var divisionsMap = {};
        if (divisions.indexOf(";") >= 0) {
            divisions.split(";").forEach(function(division) {
                divisionsMap[division] = 1;
            });
        } else {
            divisionsMap[divisions] = 1;
        }
        filters.divisions = divisionsMap;
    }
    if (componentIds && componentIds !== "") {
        var compIdsMap = {};
        if (componentIds.indexOf(",") >= 0) {
            componentIds.split(",").forEach(function(compId) {
                compIdsMap[compId.trim()] = 1;
            });
        } else {
            compIdsMap[componentIds.trim()] = 1;
        }
        filters.component_ids = compIdsMap;
    }
    if (products && products !="") {
        var productsMap = {};
        if (products.indexOf(",") >= 0) {
            products.split(",").forEach(function(product) {
                productsMap[product] = 1;
            });
        } else {
            productsMap[products] = 1;
        }
        filters.products = productsMap;
    }
    if (response) {
        filters.response = response;
    }

    var design = "modified-tickets",
        view = "modified-tickets";
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
    if (type === "sw") {
        params.startkey = [logEntry, "sw",  startDate];
        params.endkey = [logEntry, "sw", endDate];
    } else if (type === "hw") {
        params.startkey = [logEntry, "hw",  startDate];
        params.endkey = [logEntry, "hw", endDate];
    } else {
        params.startkey = [logEntry, {}];
        params.endkey = [logEntry];
    }

    var deferred = q.defer();
    dbLogs.view(design, view, params, function(err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            var modifiedTickets = [];
            result.rows.forEach(function(row) {
                modifiedTickets.push({
                    ticket_id: row.value.ticketId,
                    tr_id: row.value.trId,
                    timestamp: row.key[2],
                    log_id: row.id
                });
            });
            deferred.resolve({tickets: modifiedTickets, filters: filters});
        }
    });
    return deferred.promise;
}

/**
 * Helper function to get transaction details for modified tickets
 * @param {Object} modifiedTickets - list of modified tickets and filters
 * @returns {*|promise} list of modified tickets with transaction details
 */
function getTransactionDetails(modifiedTickets) {
    var trIds = [];
    modifiedTickets.tickets.forEach(function(ticket) {
        trIds.push(ticket.tr_id);
    });

    var deferred = q.defer();
    dbAnswers.fetch({keys: trIds}, function(err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            try {
                //deferred.resolve(result);
                var transactionDetails = {};
                result.rows.forEach(function(row) {
                    if (!transactionDetails[row.id]) {
                        transactionDetails[row.id] = row.doc;
                    }
                });
                var filteredTickets = [];
                modifiedTickets.tickets.forEach(function(ticket) {
                    if (transactionDetails[ticket.tr_id]) {
                        ticket.build = transactionDetails[ticket.tr_id].build;
                        ticket.pmr_type = transactionDetails[ticket.tr_id].pmr_complete.pmr_type;
                        ticket.component_id = transactionDetails[ticket.tr_id].pmr_complete.component_id;
                        ticket.component_desc = transactionDetails[ticket.tr_id].pmr_complete.component_desc;
                        ticket.machine_type = transactionDetails[ticket.tr_id].pmr_complete.machine_type;
                        if (componentIdsMap[ticket.component_id]) {
                            ticket.product_name = componentIdsMap[ticket.component_id].short_name;
                            ticket.division = componentIdsMap[ticket.component_id].division;
                        } else {
                            ticket.product_name = "";
                            ticket.division = "";
                        }
                        ticket.country = transactionDetails[ticket.tr_id].pmr_complete.country_code;
                        ticket.title = transactionDetails[ticket.tr_id].pmr_complete.problem_title;
                        ticket.description = transactionDetails[ticket.tr_id].pmr_complete.problem_desc;
                        ticket.answers = transactionDetails[ticket.tr_id].answers;
                    }

                    var divisionMatch = true;
                    if (!_.isEmpty(modifiedTickets.filters.divisions)) {
                        passedFilters = false;
                        divisionMatch = false;
                        for (division in modifiedTickets.filters.divisions) {
                            if (!divisionMatch && componentIdsMap[ticket.component_id] && (componentIdsMap[ticket.component_id].division === division)) {
                                divisionMatch = true;
                            }
                        }
                    }
                    var compIdMatch = true;
                    if (!_.isEmpty(modifiedTickets.filters.component_ids)) {
                        passedFilters = false;
                        compIdMatch = false;
                        for (id in modifiedTickets.filters.component_ids) {
                            if (!compIdMatch && (id === ticket.component_id || id === ticket.machine_type)) {
                                compIdMatch = true;
                            }
                        }
                    }
                    var productMatch = true;
                    if (!_.isEmpty(modifiedTickets.filters.products)) {
                        passedFilters = false;
                        productMatch = false;
                        for (product in modifiedTickets.filters.products) {
                            if (!productMatch && componentIdsMap[ticket.component_id] && (componentIdsMap[ticket.component_id].product_name.toLowerCase().indexOf(product.toLowerCase()) >= 0)) {
                                productMatch = true;
                            }
                        }
                    }

                    if (divisionMatch && compIdMatch && productMatch) {
                        filteredTickets.push(ticket);
                    }
                });
                deferred.resolve({tickets: filteredTickets, filters: modifiedTickets.filters});
            } catch(e) {
                deferred.reject(e);
            }
        }
    });
    return deferred.promise;
}

/**
 * Helper function to get KMM details for modified tickets
 * @param {Object} modifiedTickets - list of modified tickets
 * @returns {*|promise} list of modified tickets with KMM details
 */
function getKMMDetails(modifiedTickets) {
    var ticketIds = [];
    modifiedTickets.tickets.forEach(function(ticket) {
        ticketIds.push(ticket.ticket_id);
    });

    var deferred = q.defer();
    var design = "analytics-modified";
    var view = "kmm-by-ticket";
    var params = {keys: ticketIds};
    dbPmrsMetrics.view(design, view, params, function(err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            try {
                var countKMM = 0;
                var kmmDetails = {};
                result.rows.forEach(function(row) {
                    if (!kmmDetails[row.key]) {
                        kmmDetails[row.key] = [row.value];
                    } else {
                        kmmDetails[row.key].push(row.value);
                    }
                    countKMM++;
                });

                var filteredTickets = [];
                modifiedTickets.tickets.forEach(function(ticket) {
                    var answers = ticket.answers;
                    var passedFilters = true;
                    if (modifiedTickets.filters.response && modifiedTickets.filters.response !== "all") {
                        passedFilters = false;
                    }
                    answers.forEach(function(answer) {
                        if (answer.confidence !== "LOW") {
                            if (kmmDetails[ticket.ticket_id]) {
                                kmmDetails[ticket.ticket_id].forEach(function(kmm) {
                                    var match = false;
                                    if (kmm.content_id) {
                                        if (answer.id && answer.id.indexOf(kmm.content_id) >= 0) {
                                            match = true;
                                        } else if (answer.url && answer.url.indexOf(kmm.content_id) >= 0) {
                                            match = true;
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
                                if (modifiedTickets.filters.response) {
                                    if (modifiedTickets.filters.response === "all" || answer.contrib_ind === modifiedTickets.filters.response) {
                                        passedFilters = true;
                                    } else if (modifiedTickets.filters.response === "none" && !answer.contrib_ind) {
                                        passedFilters = true;
                                    }
                                } else {
                                    passedFilters = true;
                                }
                            } else {
                                if (modifiedTickets.filters.response && (modifiedTickets.filters.response === "all" || modifiedTickets.filters.response === "none")) {
                                    passedFilters = true;
                                }
                            }
                        }
                    });
                    if (passedFilters) {
                        filteredTickets.push(ticket);
                    }
                });
                deferred.resolve({tickets: filteredTickets, filters: modifiedTickets.filters});
            } catch(e) {
                deferred.reject(e);
            }
        }
    });
    return deferred.promise;
}

/**
 * Helper function to get ticket details for modified tickets
 * @param {Object} modifiedTickets - list of modified tickets
 * @returns {*|promise} list of modified tickets with ticket details
 */
function getTicketDetails(modifiedTickets) {
    var ticketIds = [];
    modifiedTickets.tickets.forEach(function(ticket) {
        ticketIds.push(ticket.ticket_id);
    });

    var deferred = q.defer();
    dbTickets.fetch({keys: ticketIds}, function(err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            try {
                var ticketDetails = {};
                result.rows.forEach(function(row) {
                    if (row.doc) {
                        if (!ticketDetails[row.doc._id]) {
                            ticketDetails[row.doc._id] = row.doc;
                        }
                    }
                });

                modifiedTickets.tickets.forEach(function(ticket) {
                    if (ticketDetails[ticket.ticket_id]) {
                        var status = "Open";
                        if(ticketDetails[ticket.ticket_id].status) {
                            status = ticketDetails[ticket.ticket_id].status;
                        }
                        ticket.status = status;

                        var closeDate = "";
                        if(ticketDetails[ticket.ticket_id].close_date) {
                            closeDate = ticketDetails[ticket.ticket_id].close_date;
                        }
                        ticket.close_date = closeDate;

                        var ownerName = "";
                        if(ticketDetails[ticket.ticket_id].owner_name) {
                            ownerName = ticketDetails[ticket.ticket_id].owner_name;
                        }
                        ticket.owner_name = ownerName;

                        var resolverName = "";
                        if(ticketDetails[ticket.ticket_id].resolver_name) {
                            resolverName = ticketDetails[ticket.ticket_id].resolver_name;
                        }
                        ticket.resolver_name = resolverName;

                        var ownerId = "";
                        if(ticketDetails[ticket.ticket_id].owner_id) {
                            ownerId = ticketDetails[ticket.ticket_id].owner_id;
                        }
                        ticket.owner_id = ownerId;
                    }
                });

                deferred.resolve(modifiedTickets);
            } catch(e) {
                deferred.reject(e);
            }
        }
    });
    return deferred.promise;
}

/**
 * Helper function to convert JSON output to delimited text
 * @param {Object} modifiedTickets - list of modified tickets
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @returns {*|promise} list of modified tickets in delimited text output
 */
function convertToDelimitedText(modifiedTickets, delimiter, stream) {
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
        var fields = reportFieldsModifiedTickets;
        modifiedTickets.tickets.forEach(function(ticket) {
            var row = {
                ticket_id: ticket.ticket_id,
                timestamp: ticket.timestamp,
                tr_id: ticket.tr_id,
                log_id: ticket.log_id,
                build: ticket.build,
                component_id: ticket.component_id,
                component_desc: ticket.component_desc,
                machine_type: ticket.machine_type,
                product_name: ticket.product_name,
                division: ticket.division,
                country: ticket.country,
                title: ticket.title,
                description: ticket.description
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
                    row[answerLabel + "_confidence"] = answer.confidence;
                    row[answerLabel + "_score"] = answer.score;
                    row[answerLabel + "_ranker_score"] = answer.ranker_score;
                    row[answerLabel + "_ir_engine"] = answer.ir_engine;
                    row[answerLabel + "_ir_engine_id"] = answer.ir_engine_id;
                    answerPos++;
                });
            }
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
 * Helper function to convert JSON output to delimited text with extended set of fields
 * @param {Object} modifiedTickets - list of modified tickets
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @returns {*|promise} list of modified tickets in delimited text output
 */
function convertToDelimitedTextExtended(modifiedTickets, delimiter, stream) {
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
        var fields = reportFieldsModifiedTicketsExtended;
        modifiedTickets.tickets.forEach(function(ticket) {
            var row = {
                ticket_id: ticket.ticket_id,
                timestamp: ticket.timestamp,
                tr_id: ticket.tr_id,
                log_id: ticket.log_id,
                build: ticket.build,
                component_id: ticket.component_id,
                component_desc: ticket.component_desc,
                machine_type: ticket.machine_type,
                product_name: ticket.product_name,
                division: ticket.division,
                country: ticket.country,
                title: ticket.title,
                description: ticket.description,
                status: ticket.status,
                close_date: ticket.close_date,
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
                    row[answerLabel + "_confidence"] = answer.confidence;
                    row[answerLabel + "_score"] = answer.score;
                    row[answerLabel + "_ranker_score"] = answer.ranker_score;
                    row[answerLabel + "_ir_engine"] = answer.ir_engine;
                    row[answerLabel + "_ir_engine_id"] = answer.ir_engine_id;
                    row[answerLabel + "_contrib_ind"] = answer.contrib_ind;
                    row[answerLabel + "_content_src"] = answer.content_src;
                    row[answerLabel + "_action_dt"] = answer.action_dt;
                    row[answerLabel + "_action_tm"] = answer.action_tm;
                    answerPos++;
                });
            }
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
 * Helper function to convert JSON formatted time series data to delimited text
 * @param {Object} timeSeries - time series data for modified tickets
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @returns {*|promise} list of modified tickets in delimited text output
 */
function convertTimeSeriesToDelimitedText(timeSeries, delimiter, stream) {
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
        var fields = ["date", "tickets_processed", "tickets_updated", "kmm_r", "kmm_y", "kmm_n", "kmm_u", "kmm_x", "kmm_none"];
        var data = [];
        for (day in timeSeries) {
            var row = {};
            for (field in timeSeries[day]) {
                row.date = day;
                row[field] = timeSeries[day][field];
            }
            data.push(row);
        }

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
 * Gets the Modified Tickets solution stats
 * @param period - time period for stats [day|week|month|year]
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON of dashboard entries to display
 */
exports.getModifiedSolutionStats = function(period, callback) {
    dbAnalytics.get(solutionStatsDoc, function(err, result) {
        cb(null, {items: result.data[period]});
    });
};

/**
 * Get list of modified tickets processed
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} type - type value for filtering tickets [all|hw|sw]
 * @param {string} output - output format to return {json|txt}
 * @param {string} divisions - semicolon delimited list of divisions to filter by
 * @param {string} componentIds - comma delimited list of component IDs to filter by
 * @param {string} products - comma delimited list of products to filter by
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object|string} list of modified tickets in JSON or delimited text
 */
exports.getModifiedTicketsProcessed = function(start, end, limit, type, output, divisions, componentIds, products, delimiter, stream, callback) {
    getModifiedTickets("processed", start, end, limit, type, null, divisions, componentIds, products)
        .then(getTransactionDetails)
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
                callback(null, {count: result.tickets.length, tickets: result.tickets});
            }
        })
        .catch(function(error) {
            callback(error);
        });
};

/**
 * Get list of modified tickets updated
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} type - type value for filtering tickets [all|hw|sw]
 * @param {string} output - output format to return {json|txt}
 * @param {string} divisions - semicolon delimited list of divisions to filter by
 * @param {string} componentIds - comma delimited list of component IDs to filter by
 * @param {string} products - comma delimited list of products to filter by
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} list of modified tickets in JSON or delimited text
 */
exports.getModifiedTicketsUpdated = function(start, end, limit, type, output, divisions, componentIds, products, delimiter, stream, callback) {
    getModifiedTickets("updated", start, end, limit, type, null, divisions, componentIds, products)
        .then(getTransactionDetails)
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
                callback(null, {count: result.tickets.length, tickets: result.tickets});
            }
        })
        .catch(function(error) {
            callback(error);
        });
};

/**
 * Get list of modified tickets updated with KMM
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {number} limit - value passed to DB to limit number of results returned
 * @param {string} type - type value for filtering tickets [all|hw|sw]
 * @param {string} response - type of response to look for [all|Y|R|N|X|U|none]
 * @param {string} output - output format to return {json|txt}
 * @param {string} divisions - semicolon delimited list of divisions to filter by
 * @param {string} componentIds - comma delimited list of component IDs to filter by
 * @param {string} products - comma delimited list of products to filter by
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} list of modified tickets in JSON or delimited text
 */
exports.getModifiedTicketsUpdatedKMM = function(start, end, limit, type, response, output, divisions, componentIds, products, delimiter, stream, callback) {
    getModifiedTickets("updated", start, end, limit, type, response, divisions, componentIds, products)
        .then(getTransactionDetails)
        .then(getKMMDetails)
        .then(getTicketDetails)
        .then(function(result) {
            if (output === "txt") {
                convertToDelimitedTextExtended(result, delimiter, stream)
                    .then(function(result) {
                        callback(null, result);
                    })
                    .catch(function(error) {
                        callback(error);
                    });
            } else {
                callback(null, {count: result.tickets.length, tickets: result.tickets});
            }
        })
        .catch(function(error) {
            callback(error);
        });
};

/**
 * Get time series of modified tickets
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {string} type - type value for filtering tickets [all|hw|sw]
 * @param {string} output - output format to return {json|txt}
 * @param {string} delimiter - delimiter to use for output
 * @param {string} stream - flag to determine whether to send stream back as a response or just text
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} time series of modified tickets
 */
exports.getModifiedTimeSeries = function(start, end, type, output, delimiter, stream, callback) {
    var allPromises = q.all([
        getModifiedTickets("processed", start, end, null, type, null, null, null, null),
        getModifiedTickets("updated", start, end, null, type, null, null, null, null)
    ]);
    allPromises.then(function(result) {
        var processed = result[0].tickets.reverse();
        var updated = result[1].tickets.reverse();
        getTransactionDetails({tickets: updated, filters: {}})
            .then(getKMMDetails)
            .then(function(result) {
                var kmm = result.tickets;
                var statsByDay = {};
                processed.forEach(function(ticket) {
                    if (!statsByDay[ticket.timestamp.substring(0,10)]) {
                        statsByDay[ticket.timestamp.substring(0,10)] = {tickets_processed: 1};
                    } else {
                        statsByDay[ticket.timestamp.substring(0,10)].tickets_processed++;
                    }
                });
                updated.forEach(function(ticket) {
                    if (statsByDay[ticket.timestamp.substring(0,10)]) {
                        if (!statsByDay[ticket.timestamp.substring(0,10)].tickets_updated) {
                            statsByDay[ticket.timestamp.substring(0,10)].tickets_updated = 1;
                            statsByDay[ticket.timestamp.substring(0,10)].kmm_r = 0;
                            statsByDay[ticket.timestamp.substring(0,10)].kmm_r = 0;
                            statsByDay[ticket.timestamp.substring(0,10)].kmm_y = 0;
                            statsByDay[ticket.timestamp.substring(0,10)].kmm_n = 0;
                            statsByDay[ticket.timestamp.substring(0,10)].kmm_u = 0;
                            statsByDay[ticket.timestamp.substring(0,10)].kmm_x = 0;
                            statsByDay[ticket.timestamp.substring(0,10)].kmm_none = 0;
                        } else {
                            statsByDay[ticket.timestamp.substring(0,10)].tickets_updated++;
                        }
                    }
                });
                kmm.forEach(function(ticket) {
                    if (statsByDay[ticket.timestamp.substring(0,10)]) {
                        var bestAnswer = "";
                        ticket.answers.forEach(function(answer) {
                            if (answer.confidence !== "LOW") {
                                if (answer.contrib_ind) {
                                    switch(answer.contrib_ind) {
                                        case "R":
                                        case "Y":
                                        case "N":
                                            if (bestAnswer) {
                                                if (kmmFeedbackScale[answer.contrib_ind] > kmmFeedbackScale[bestAnswer]) {
                                                    bestAnswer = answer.contrib_ind;
                                                }
                                            } else {
                                                bestAnswer = answer.contrib_ind;
                                            }
                                            break;
                                        case "U":
                                            statsByDay[ticket.timestamp.substring(0,10)].kmm_u++;
                                            break;
                                        case "X":
                                            statsByDay[ticket.timestamp.substring(0,10)].kmm_x++;
                                            break;
                                        default:
                                            statsByDay[ticket.timestamp.substring(0,10)].kmm_none++;
                                            break;
                                    }
                                } else {
                                    statsByDay[ticket.timestamp.substring(0,10)].kmm_none++;
                                }

                            }
                        });
                        if (bestAnswer) {
                            statsByDay[ticket.timestamp.substring(0,10)]["kmm_"+bestAnswer.toLowerCase()]++;
                        }
                    }
                });
                if (output === "txt") {
                    convertTimeSeriesToDelimitedText(statsByDay, delimiter, stream)
                        .then(function(result) {
                            callback(null, result);
                        })
                        .catch(function(error) {
                            callback(error);
                        });
                } else {
                    callback(null, statsByDay);
                }
            })
            .catch(function(error) {
                callback(error);
            });
    })
    .catch(function(error) {
        callback(error);
    });
};

/**
 * Save Spotlight time series data for KPI and KMM
 * @param {string} start - starting timestamp for filtering tickets
 * @param {string} end - ending timestamp for filtering tickets
 * @param {boolean} save - flag to determine whether to save the data or return results for viewing, default is false or view data
 * @param {string} cache - flag to determine whether to get data from partial cache (partial) which means current day KPI and live KMM or live data (no) [partial|no]
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} JSON data
 */
exports.saveModifiedTimeSeries = function(start, end, save, cache, callback) {
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
        timeSeriesSW: function(callback){
            self.getModifiedTimeSeries(start, end, "sw", null, null, null, callback);
        },
        timeSeriesHW: function(callback){
            self.getModifiedTimeSeries(start, end, "hw", null, null, null, callback);
        }
    }, function(error, results) {
        if (error) return callback(error);

        dbAnalytics.get(dataModifiedTimeSeriesDoc, function(err, doc) {
            if (err) return callback(err);
            try {
                var timestamp = (new Date()).toISOString();
                doc.timestamp = timestamp;

                var timeSeriesAll = {};
                for (key in results.timeSeriesSW) {
                    timeSeriesAll[key] = {};
                    for (bucket in results.timeSeriesSW[key]) {
                        timeSeriesAll[key][bucket] = results.timeSeriesSW[key][bucket];
                    }
                }
                for (key in results.timeSeriesHW) {
                    if (timeSeriesAll[key]) {
                        for (bucket in results.timeSeriesHW[key]) {
                            if (timeSeriesAll[key][bucket]) {
                                timeSeriesAll[key][bucket] += results.timeSeriesHW[key][bucket];
                            } else {
                                timeSeriesAll[key][bucket] = results.timeSeriesHW[key][bucket];
                            }
                        }
                    } else {
                        timeSeriesAll[key] = results.timeSeriesHW[key];
                    }
                }

                if (doc.data.all) {
                    Object.keys(timeSeriesAll).sort().forEach(function(key) {
                        doc.data.all[key] = timeSeriesAll[key];
                    });
                }
                if (doc.data.sw) {
                    Object.keys(results.timeSeriesSW).sort().forEach(function(key) {
                        doc.data.sw[key] = results.timeSeriesSW[key];
                    });
                }
                if (doc.data.hw) {
                    Object.keys(results.timeSeriesHW).sort().forEach(function(key) {
                        doc.data.hw[key] = results.timeSeriesHW[key];
                    });
                }
                if (saveData) {
                    dbAnalytics.insert(doc, doc._id, function(err, result) {
                        if (err) return callback(err);
                        callback(null, result);
                    });
                } else {
                    callback(null, doc);
                }
            } catch(e) {
                callback(e);
            }
        });
    });
};

/**
 * Generate Solution Stats for Modified Tickets products
 * @param {string} timestamp - timestamp for when to generate the snapshot for, default is current date/time, format is ISO standard 2015-09-07T20:24:11.127Z
 * @param {string} save - flag to determine whether to save updated solution stats back to analytics DB or just display results to user [true|false]
 * @param {apiCallback} cb - callback that handles the response
 * @returns {Object} JSON summary
 */
exports.generateModifiedSolutionStats = function(timestamp, save, cb) {
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

    dbAnalytics.get(dataModifiedTimeSeriesDoc, function(err, doc) {
        if (err) return cb(err);
        try {
            var data = {
                all: {
                    day: {
                        tickets_processed: 0,
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
};

/**
 * Get the Modified Tickets solution stats
 * @param period - time period for stats [day|week|month|year]
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} JSON of dashboard entries to display
 */
exports.getModifiedSolutionStats = function(period, callback) {
    dbAnalytics.get(solutionStatsDoc, function(err, result) {
        callback(null, {items: result.data[period]});
    });
};

/**
 * Refresh the Modified Tickets solution stats
 * @param {string} timestamp - timestamp to use when refreshing the solution stats
 * @param {string} period - time period for stats [day|week|month|year]
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} JSON of dashboard entries to display
 */
exports.refreshModifiedSolutionStats = function(timestamp, period, callback) {
    var self = this;
    var currentYear = timestamp.substring(0,4);
    self.saveModifiedTimeSeries(currentYear, null, true, "partial", function(err, result) {
        if (err) return callback(err);
        self.generateModifiedSolutionStats(timestamp, true, function(err, result) {
            if (err) return callback(err);
            dbAnalytics.get(solutionStatsDoc, function(err, result) {
                if (err) return callback(err);
                callback(null, {items: result.data[period]});
            });
        })
    });
};

/**
 * Get Modified Tickets refresh solution stats interval for display in dashboard
 * @param {apiCallback} callback - callback that handles the response
 * @returns {string} refresh interval value
 */
exports.getModifiedRefreshSolutionStatsInterval = function(callback) {
    dbAnalytics.get(solutionStatsDoc, function(err, result) {
        if (err) return callback(err);
        return callback(null, {refresh_interval: result.refresh_interval});
    });
};
