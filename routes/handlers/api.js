/**
 * Management UX API Route Handlers
 * @module routes/handers/api
 */

var analytics = require("../../lib/analytics");
var analyticsSpotlight = require("../../lib/analyticsSpotlight");
var analyticsHardware = require("../../lib/analyticsHardware");
var analyticsModified = require("../../lib/analyticsModified");
var analyticsSMEQAPairs = require("../../lib/analyticsSMEQAPairs");
var analyticsSMETrials = require("../../lib/analyticsSMETrials");
var analyticsAssignedSet = require("../../lib/analyticsAssignedSet");
var analyticsDynamicConfidence = require("../../lib/analyticsDynamicConfidence");
var logs = require("../../lib/logs");
var testing = require("../../lib/testing");
var testingBatchesTrials = require("../../lib/testingBatchesTrials");
var config = require("../../lib/config");
var administration = require("../../lib/administration");
var cleanup = require("../../lib/cleanup");
var watson = require("../../lib/watson");

/**
 * Analytics
 */
exports.getTicketsProcessedWithTargetAndTrend = function(req, content, cb) {
	analytics.getTicketsProcessedWithTargetAndTrend(req.params, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Processed data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsEmailedWithTargetAndTrend = function(req, content, cb) {
	analytics.getTicketsEmailedWithTargetAndTrend(req.params, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Emailed data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsWrittenWithTargetAndTrend = function(req, content, cb) {
	analytics.getTicketsWrittenWithTargetAndTrend(req.params, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Written data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsKpi = function(req, content, cb) {
	analytics.getTicketsKpi(req.params, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets KPI data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getAWSolutionQuality = function(req, content, cb) {
	analytics.getAWSolutionQuality(req.params, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Solution Quality data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsProcessed = function(req, content, cb) {
	analytics.getTicketsProcessed(req.params.start, req.params.end, req.params.output, req.params.type, req.params.componentids, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Processed data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsProcessedWhitelist = function(req, content, cb) {
	analytics.getTicketsProcessedWhitelist(req.params.start, req.params.end, req.params.output, req.params.type, req.params.componentids, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Processed Whitelist data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsUpdated = function(req, content, cb) {
	analytics.getTicketsUpdated(req.params.start, req.params.end, req.params.output, req.params.type, req.params.componentids, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Updated data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSolutionStats = function(req, content, cb) {
	analytics.getSolutionStats(req.params.period, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Solution Stats data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.refreshSolutionStats = function(req, content, cb) {
	analytics.refreshSolutionStats(req.params.timestamp, req.params.period, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to refresh Solution Stats data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getRefreshSolutionStatsInterval = function(req, content, cb) {
	analytics.getRefreshSolutionStatsInterval(function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Solution Stats refresh interval: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getDivisions = function(req, content, cb) {
	analytics.getDivisions(function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Divisions data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getReports = function(req, content, cb) {
	analytics.getReports(req.params.filter, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Reports: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsProcessedDetails = function(req, content, cb) {
	analytics.getTicketsProcessedDetails(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, req.params.customerdetails, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Processed Details data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsProcessedDetailsTxt = function(req, content, cb) {
	analytics.getTicketsProcessedDetailsTxt(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, req.params.customerdetails, req.params.delimiter, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Processed Details TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsProcessedWhitelistDetails = function(req, content, cb) {
	analytics.getTicketsProcessedWhitelistDetails(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Processed Whitelist Details data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsProcessedWhitelistDetailsTxt = function(req, content, cb) {
	analytics.getTicketsProcessedWhitelistDetailsTxt(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Processed Whitelist Details TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsUpdatedDetails = function(req, content, cb) {
	analytics.getTicketsUpdatedDetails(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Updated Details data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsUpdatedDetailsTxt = function(req, content, cb) {
	analytics.getTicketsUpdatedDetailsTxt(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Updated Details TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsUpdatedKMM = function(req, content, cb) {
	analytics.getTicketsUpdatedKMM(req.params.start, req.params.end, req.params.limit, req.params.output, req.params.response, req.params.type, req.params.details, req.params.divisions, req.params.componentids, req.params.products, req.params.spotlight, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Updated KMM Responses data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsUpdatedKMMCache = function(req, content, cb) {
	analytics.getTicketsUpdatedKMMCache(req.params.start, req.params.end, req.params.output, req.params.response, req.params.type, req.params.divisions, req.params.componentids, req.params.products, req.params.spotlight, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Updated KMM Responses data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsUpdatedKMMTxt = function(req, content, cb) {
	analytics.getTicketsUpdatedKMMTxt(req.params.start, req.params.end, req.params.limit, req.params.response, req.params.type, req.params.details, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, req.params.stream, req.params.spotlight, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Updated KMM Responses TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsUpdatedKMMCacheTxt = function(req, content, cb) {
	analytics.getTicketsUpdatedKMMCacheTxt(req.params.start, req.params.end, req.params.response, req.params.type, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, req.params.stream, req.params.spotlight, req.params.format, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Updated KMM Responses TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsWithErrorByDay = function(req, content, cb) {
	analytics.getTicketsWithErrorByDay(req.params, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets With Error By Day data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsBreakdown = function(req, content, cb) {
	analytics.getTicketsBreakdown(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Breakdown data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getClosedTickets = function(req, content, cb) {
	analytics.getClosedTickets(req.params.start, req.params.end, req.params.limit, req.params.output, req.params.type, req.params.divisions, req.params.componentids, req.params.products, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Closed Tickets data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getClosedTicketsTxt = function(req, content, cb) {
	analytics.getClosedTicketsTxt(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Closed Tickets data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketAnswersResponses = function(req, content, cb) {
	analytics.getTicketAnswersResponses(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.status, req.params.whitelist, req.params.divisions, req.params.componentids, req.params.products, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Ticket Answers Resposnes data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketAnswersResponsesTxt = function(req, content, cb) {
	analytics.getTicketAnswersResponsesTxt(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.status, req.params.whitelist, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Ticket Answers Resposnes data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.generateKPI = function(req, content, cb) {
	analytics.generateKPI(req.params.timestamp, req.params.type, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate KPI data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.generateKMM = function(req, content, cb) {
	analytics.generateKMM(req.params.timestamp, req.params.type, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate KMM data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.generateTimeSeries = function(req, content, cb) {
	analytics.generateTimeSeries(req.params.start, req.params.end, req.params.type, req.params.cache, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate Time Series data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.generateTimeSeriesTxt = function(req, content, cb) {
	analytics.generateTimeSeriesTxt(req.params.start, req.params.end, req.params.delimiter, req.params.type, req.params.stream, req.params.cache, req.params.spotlight, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate Time Series data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.saveTimeSeries = function(req, content, cb) {
	analytics.saveTimeSeries(req.body.start, req.body.end, req.body.save, req.body.cache, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to save Time Series data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.generateSolutionStats = function(req, content, cb) {
	analytics.generateSolutionStats(req.params.timestamp, req.params.save, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate Solution Stats data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.saveTicketsUpdatedKMM = function(req, content, cb) {
	analytics.saveTicketsUpdatedKMM(req.body.timestamp, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to save Tickets Updated KMM data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.saveReportLog = function(req, content, cb) {
	analytics.saveReportLog(req.body.reportlog, req.body.reportlogmaxentries, req.body.reportdirectory, req.body.report, req.body.timestamp, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to save report log: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

/**
 * Analytics SME QA Pairs
 */
exports.getL0PMRKMMFeedback = function(req, content, cb) {
	analyticsSMEQAPairs.getL0PMRKMMFeedback(req.params.start, req.params.end, req.params.limit, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get L0 PMR KMM Feedback data for QA Pairs: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.setL0PMRKMMFeedback = function(req, content, cb) {
	analyticsSMEQAPairs.setL0PMRKMMFeedback(req.body.start, req.body.end, req.body.limit, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to set L0 PMR KMM Feedback for QA Pairs: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

/**
 * Analytics SME Trials
 */
exports.getProductsComponentsMap = function(req, content, cb) {
	analyticsSMETrials.getProductsComponentsMap(function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Products Components Map data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getBatchProgress = function(req, content, cb) {
	analyticsSMETrials.getBatchProgress(function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Batch Progress data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsByIds = function(req, content, cb) {
	analyticsSMETrials.getTicketsByIds(req.body.ticketids, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsAnswerableByIds = function(req, content, cb) {
	analyticsSMETrials.getTicketsAnswerableByIds(req.body.ticketids, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Answerable data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketDetailsByIds = function(req, content, cb) {
	analyticsSMETrials.getTicketDetailsByIds(req.body.ticketids, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Ticket Details data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getTicketsBad = function(req, content, cb) {
	analyticsSMETrials.getTicketsBad(function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Tickets Bad data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getComponentAnswerableStats = function(req, content, cb) {
	analyticsSMETrials.getComponentAnswerableStats(req.body.ticketids, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Component Answerable Stats data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};


/**
 * Analytics Spotlight
 */
exports.getSpotlightProducts = function(req, content, cb) {
	analyticsSpotlight.getSpotlightProducts(function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Processed data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsProcessed = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsProcessed(req.params.start, req.params.end, req.params.output, req.params.type, req.params.componentids, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Processed data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsProcessedWhitelist = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsProcessedWhitelist(req.params.start, req.params.end, req.params.output, req.params.type, req.params.componentids, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Processed Whitelist data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsUpdated = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsUpdated(req.params.start, req.params.end, req.params.output, req.params.type, req.params.componentids, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Updated data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsProcessedDetails = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsProcessedDetails(req.params.start, req.params.end, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, req.params.customerdetails, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Processed Details data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsProcessedDetailsTxt = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsProcessedDetailsTxt(req.params.start, req.params.end, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, req.params.customerdetails, req.params.delimiter, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Processed Details TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsProcessedWhitelistDetails = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsProcessedWhitelistDetails(req.params.start, req.params.end, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Processed Whitelist Details data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsProcessedWhitelistDetailsTxt = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsProcessedWhitelistDetailsTxt(req.params.start, req.params.end, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Processed Whitelist Details TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsUpdatedDetails = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsUpdatedDetails(req.params.start, req.params.end, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Updated Details data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsUpdatedDetailsTxt = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsUpdatedDetailsTxt(req.params.start, req.params.end, req.params.type, req.params.details, req.params.answers, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Updated Details TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsUpdatedKMM = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsUpdatedKMM(req.params.start, req.params.end, req.params.output, req.params.response, req.params.type, req.params.details, req.params.divisions, req.params.componentids, req.params.products, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Updated KMM Responses data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsUpdatedKMMCache = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsUpdatedKMMCache(req.params.start, req.params.end, req.params.output, req.params.response, req.params.type, req.params.divisions, req.params.componentids, req.params.products, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Updated KMM Responses data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsUpdatedKMMTxt = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsUpdatedKMMTxt(req.params.start, req.params.end, req.params.response, req.params.type, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Updated KMM Responses TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightTicketsUpdatedKMMCacheTxt = function(req, content, cb) {
	analyticsSpotlight.getSpotlightTicketsUpdatedKMMCacheTxt(req.params.start, req.params.end, req.params.response, req.params.type, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, req.params.stream, req.params.format, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Tickets Updated KMM Responses TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.generateSpotlightTimeSeries = function(req, content, cb) {
	analyticsSpotlight.generateSpotlightTimeSeries(req.params.start, req.params.end, req.params.type, req.params.componentids, req.params.cache, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate Spotlight Time Series data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.generateSpotlightTimeSeriesTxt = function(req, content, cb) {
	analyticsSpotlight.generateSpotlightTimeSeriesTxt(req.params.start, req.params.end, req.params.delimiter, req.params.type, req.params.componentids, req.body.stream, req.params.cache, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate Spotlight Time Series data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.saveSpotlightTimeSeries = function(req, content, cb) {
	analyticsSpotlight.saveSpotlightTimeSeries(req.body.start, req.body.end, req.body.save, req.body.cache, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to save Spotlight Time Series data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.saveSpotlightTicketsUpdatedKMM = function(req, content, cb) {
	analyticsSpotlight.saveSpotlightTicketsUpdatedKMM(req.body.timestamp, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to save Spotlight Tickets Updated KMM data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.generateSpotlightSolutionStats = function(req, content, cb) {
	analyticsSpotlight.generateSpotlightSolutionStats(req.params.timestamp, req.params.save, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate Solution Stats data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightSolutionStats = function(req, content, cb) {
	analyticsSpotlight.getSpotlightSolutionStats(req.params.period, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Solution Stats data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.refreshSpotlightSolutionStats = function(req, content, cb) {
	analyticsSpotlight.refreshSpotlightSolutionStats(req.params.timestamp, req.params.period, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to refresh Spotlight Solution Stats data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getSpotlightRefreshSolutionStatsInterval = function(req, content, cb) {
	analyticsSpotlight.getSpotlightRefreshSolutionStatsInterval(function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Spotlight Solution Stats refresh interval data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

/**
 * Analytics: Hardware
 */
exports.getHardwareTicketsUpdatedKMM = function(req, content, cb) {
	analyticsHardware.getHardwareTicketsUpdatedKMM(req.params.start, req.params.end, req.params.output, req.params.response, req.params.machine_types, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Hardware Tickets Updated KMM Responses data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getHardwareTicketsUpdatedKMMTxt = function(req, content, cb) {
	analyticsHardware.getHardwareTicketsUpdatedKMMTxt(req.params.start, req.params.end, req.params.response, req.params.machine_types, req.params.delimiter, req.params.stream, req.params.format, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Hardware Tickets Updated KMM Responses TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

/**
 * Analytics: Modified Tickets
 */
exports.getModifiedTicketsProcessed = function(req, content, cb) {
	analyticsModified.getModifiedTicketsProcessed(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.output, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Modified Tickets Processed data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getModifiedTicketsUpdated = function(req, content, cb) {
	analyticsModified.getModifiedTicketsUpdated(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.output, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Modified Tickets Updated data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getModifiedTicketsUpdatedKMM = function(req, content, cb) {
	analyticsModified.getModifiedTicketsUpdatedKMM(req.params.start, req.params.end, req.params.limit, req.params.type, req.params.response, req.params.output, req.params.divisions, req.params.componentids, req.params.products, req.params.delimiter, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Modified Tickets Updated KMM data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getModifiedTimeSeries = function(req, content, cb) {
	analyticsModified.getModifiedTimeSeries(req.params.start, req.params.end, req.params.type, req.params.output, req.params.delimiter, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Modified Tickets Updated KMM data in delimited text output: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.saveModifiedTimeSeries = function(req, content, cb) {
	analyticsModified.saveModifiedTimeSeries(req.body.start, req.body.end, req.body.save, req.body.cache, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to save Modified Tickets Time Series data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.generateModifiedSolutionStats = function(req, content, cb) {
	analyticsModified.generateModifiedSolutionStats(req.params.timestamp, req.params.save, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate Modified Tickets Solution Stats data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getModifiedSolutionStats = function(req, content, cb) {
	analyticsModified.getModifiedSolutionStats(req.params.period, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Modified Tickets Solution Stats data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.refreshModifiedSolutionStats = function(req, content, cb) {
	analyticsModified.refreshModifiedSolutionStats(req.params.timestamp, req.params.period, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to refresh Modified Tickets Solution Stats data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getModifiedRefreshSolutionStatsInterval = function(req, content, cb) {
	analyticsModified.getModifiedRefreshSolutionStatsInterval(function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Modified Tickets Solution Stats refresh interval data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

/**
 * Analytics: Assigned Set Tickets
 */
exports.getAssignedSetTicketsWithKMM = function(req, content, cb) {
	analyticsAssignedSet.getAssignedSetTicketsWithKMM(req.params.limit, req.params.output, req.params.assignedset, req.params.componentids, req.params.delimiter, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Assigned Set Tickets With KMM data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

/**
 * Analytics: Dynamic Confidence
 */
exports.getDynamicConfidenceHistory = function(req, content, cb) {
	analyticsDynamicConfidence.getDynamicConfidenceHistory(req.params.collection, req.params.start, req.params.end, req.params.limit, req.params.output, req.params.delimiter, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Dynamic Confidence History data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getDynamicConfidenceBuzzIn = function(req, content, cb) {
	analyticsDynamicConfidence.getDynamicConfidenceBuzzIn(req.params.collection, req.params.position, req.params.start, req.params.end, req.params.limit, req.params.output, req.params.delimiter, req.params.stream, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Dynamic Confidence Buzz In data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

/**
 * Logging
 */
exports.getLogs = function(req, content, cb) {
	logs.get(req.body.module, req.body.limit, req.body.start, req.body.end, function(err, logs) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get logs");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, logs);
	});
};

exports.getLogsByTicket = function(req, content, cb) {
	logs.getLogsByTicket(req.params.ticketid, function(err, logs) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get logs by ticket");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, logs);
	});
};

/*
exports.getSearchLogs = function(req, content, cb) {
	logs.searchLogs(req.params.module, req.params.limit, decodeURI(req.params.searchText), function(err, logs) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get log search results");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, logs);
	});
};
*/

exports.searchLogs = function(req, content, cb) {
	logs.searchLogs(req.body.module, req.body.limit, req.body.searchText, req.body.start, req.body.end, function(err, result) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get log search results");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, result);
	});
};

exports.getLogsCSV = function(req, res) {
	logs.getCSV(req.body.module, req.body.limit, req.body.searchText, req.body.start, req.body.end, function(err, logs) {
		if (err) return res.send(500, err);
		res.csv(logs);
	});
}


/**For Orchestrator logging **/
exports.getOrchestratorLogs = function(req, content, cb) {
	logs.getOrchestratorLogs(req.body.limit, req.body.start, req.body.end, function(err, logs) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get logs");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, logs);
	});
};

exports.searchOrchestratorLogs = function(req, content, cb) {
	logs.searchOrchLogs(req.body.limit, req.body.searchText, req.body.start, req.body.end, function(err, result) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get log search results");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, result);
	});
};

exports.getOrcLogsCSV = function(req, res) {
	logs.getOrcLogCSV(req.body.limit, req.body.searchText, req.body.start, req.body.end, function(err, logs) {
		if (err) return res.send(500, err);
		res.csv(logs);
	});
};

exports.searchOrcByQueryId = function(req, content, cb) {
	logs.searchOrcByQueryId(req.body.limit, req.body.queryId, req.body.start, req.body.end, function(err, result) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get log search results");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, result);
	});
};

/**
 * Testing
 */

exports.getTestResults = function(req, content, cb) {
	testing.getTestResults(req.params.limit, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get test results");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getTestResultsById = function(req, content, cb) {
	testing.getTestResultsById(req.params.id, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get test results by ID");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getTestResultsCSV = function(req, res) {
	testing.getTestResultsCSV(req.params.limit, function(err, results) {
		if (err) return res.send(500, err);
		res.csv(results);
	});
}

exports.getTestCases = function(req, content, cb) {
	testing.getTestCases(function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get test cases");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.executeTestCases = function(req, content, cb) {
	testing.executeTestCases(req.body.server, req.body.port, req.body.url, req.body.tests, req.body.user, req.body.parameters, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to execute test cases");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.copyProdTicketsToTest = function(req, content, cb) {
	testing.copyProdTicketsToTest(req.params, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to copy Prod tickets to Test");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.copyProdTicketsToTestPost = function(req, content, cb) {
	var params = {
		startdate: req.body.startdate,
		enddate: req.body.enddate,
		limit: req.body.limit,
		state: req.body.state,
		type: req.body.type
	};
	testing.copyProdTicketsToTest(params, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to copy Prod tickets to Test");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.copyProdTicketsToTestByCompIdOpenDate = function(req, content, cb) {
	testing.copyProdTicketsToTestByCompIdOpenDate(req.body.start, req.body.end, req.body.limit, req.body.flag, req.body.save, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to copy Prod tickets to Test by Comp ID and Open Date");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.copyProdTicketsToTestByView = function(req, content, cb) {
	testing.copyProdTicketsToTestByView(req.body.design, req.body.view, req.body.keys, req.body.start, req.body.end, req.body.limit, req.body.skip, req.body.descending, req.body.flag, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to copy Prod tickets to Test based on list of ticket docs from a view");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.copyProdTicketsToTestByTicketIds = function(req, content, cb) {
	testing.copyProdTicketsToTestByTicketIds(req.body.ticketids, req.body.flag, req.body.save, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to copy Prod tickets to Test based on list of ticket IDs");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.clearUnprocessedTickets = function(req, content, cb) {
	testing.clearUnprocessedTickets(function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to clear unprocessed tickets");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.setTickestToUnprocessedByView = function(req, content, cb) {
	testing.setTickestToUnprocessedByView(req.body.design, req.body.view, req.body.start, req.body.end, req.body.limit, req.body.skip, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to update unprocessed tickets");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.setTickestToUnprocessedByTicketIds = function(req, content, cb) {
	testing.setTickestToUnprocessedByTicketIds(req.body.ticketids, req.body.flag, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to update unprocessed tickets");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};


/**
 * Testing: Batches and Trials
 */
exports.copyAnswersTestToTrial = function(req, content, cb) {
	testing.copyAnswersTestToTrial(req.body.start, req.body.end, req.body.ticketids, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to copy answers to trial DB");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.addAnswersTrialAnswersSet = function(req, content, cb) {
	testing.addAnswersTrialAnswersSet(req.body.ticketids, req.body.answersfile, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to add answers set data to trial tickets");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.removeLastAnswersTrialAnswersSet = function(req, content, cb) {
	testing.removeLastAnswersTrialAnswersSet(req.body.ticketids, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to remove last answers set data to trial tickets");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getTrialResultsByBatch = function(req, content, cb) {
	testingBatchesTrials.getTrialResultsByBatch(req.params.batchids, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate trial report by batch");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getLatestTrialResultsByBatch = function(req, content, cb) {
	testingBatchesTrials.getLatestTrialResultsByBatch(req.params.batchids, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate trial report by batch");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getBatchTransactions = function(req, content, cb) {
	testingBatchesTrials.getBatchTransactions(req.params.batchid, req.params.limit, req.params.start, req.params.end, req.params.answers, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Batch Transactions data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};

exports.getBatchTransactionsTxt = function(req, content, cb) {
	testingBatchesTrials.getBatchTransactionsTxt(req.params.batchid, req.params.limit, req.params.start, req.params.end, req.params.answers, req.params.delimiter, function(err, data) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get Batch Transactions TXT data: " + err);
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, data);
	});
};


/**
 * Configure
 */
exports.getConfigDoc = function(req, content, cb) {
	config.getConfigDoc(req.params.id, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get configuration doc");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getConfigDocList = function(req, content, cb) {
	config.getConfigDocList(function(err, ids) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get list of configuration docs");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, ids);
	});
};

exports.setConfigDoc = function(req, content, cb) {
	config.setConfigDoc(JSON.parse(req.body.doc), req.body.comments, req.body.user, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to update configuration doc");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getConfigDocHistory = function(req, content, cb) {
	config.getConfigDocHistory(req.params.id, req.params.limit, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get configuration doc history");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getHistoryDoc = function(req, content, cb) {
	config.getHistoryDoc(req.params.id, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get history doc");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.generateWhitelist = function(req, content, cb) {
	config.generateWhitelist(function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to generate whitelist");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};


/**
 * Administration
 */

exports.getUsers = function(req, content, cb) {
	administration.getUsers(function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get users");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getUser = function(req, content, cb) {
	administration.getUser(req.params.userid, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get users");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.saveUser = function(req, content, cb) {
	administration.saveUser(req.body.newUser, req.body.userId, req.body.permissions, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to save user");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};


/**
 * Cleanup
 */
exports.clearWhitelistFlags = function(req, content, cb) {
	cleanup.clearWhitelistFlags(req.body.parallelism, req.body.batch, req.body.skip, req.body.total, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to clear whitelist flags");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.setWhitelistFlags = function(req, content, cb) {
	cleanup.setWhitelistFlags(req.body.parallelism, req.body.batch, req.body.start, req.body.end, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to set whitelist flags");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.addMissingTicketDocs = function(req, content, cb) {
	cleanup.addMissingTicketDocs(req.body.start, req.body.end, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to add missing ticket docs");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.fixMissingTicketIdForNewTicketsReceived = function(req, content, cb) {
	cleanup.fixMissingTicketIdForNewTicketsReceived(req.body.start, req.body.end, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to fix missing ticket IDs for new tickets received log entries");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.fixMissingTrIdForNewTicketsReceived = function(req, content, cb) {
	cleanup.fixMissingTrIdForNewTicketsReceived(req.body.start, req.body.end, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to fix missing transaction IDs for new tickets received log entries");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.addOpenDateToWhitelistAnswerFromTicket = function(req, content, cb) {
	cleanup.addOpenDateToWhitelistAnswerFromTicket(req.body.limit, req.body.skip, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to add open date to whitelist answers");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.addOpenDateToWhitelistAnswerFromLog = function(req, content, cb) {
	cleanup.addOpenDateToWhitelistAnswerFromLog(req.body.limit, req.body.skip, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to add open date to whitelist answers");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.updateTicketSchemaFormatByTicketIds = function(req, content, cb) {
	cleanup.updateTicketSchemaFormatByTicketIds(req.body.ticketids, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to add open date to whitelist answers");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getTicketsUpdatedLowConfidence = function(req, content, cb) {
	cleanup.getTicketsUpdatedLowConfidence(req.params.start, req.params.end, req.params.type, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get list of tickets updated with low confidence");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.createMissingTicketWriterSubmitted = function(req, content, cb) {
	cleanup.createMissingTicketWriterSubmitted(req.body.ticketids, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get list of tickets updated with low confidence");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};

exports.getTicketsUpdatedDuplicateTicketWriterSubmitted = function(req, content, cb) {
	cleanup.getTicketsUpdatedDuplicateTicketWriterSubmitted(req.params.start, req.params.end, req.params.type, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to get list of tickets updated with duplicate ticket writer submitted entries");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};


/**
 * Generic
 */
exports.getUrlsPatterns = function(req, content, cb) {
	watson.getUrlsPatterns(req, function(err, doc) {
		if (err) {
			console.error(err);
			var error = new Error("Failed to retrieve url patterns");
			error.statusCode = 500;
			return cb(error);
		}
		cb(null, doc);
	});
};