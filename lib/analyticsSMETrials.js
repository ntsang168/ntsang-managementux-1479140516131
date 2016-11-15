/**
 * Management UX Analytics SME Trials Library
 * @module lib/analyticsSMETrials
 */

var env = { mode: "DEV", debug: true };
if (process.env.FR_ROLE) {
	env.mode = (process.env.FR_ROLE).toUpperCase();
}
if (process.env.FR_DEBUG_MODE) {
	env.debug = (process.env.FR_DEBUG_MODE == "true");
}

var async = require('async');

var dbConfig;
var dbTests;
var dbTickets;

var cloudantConfig;
var cloudantTests;
var cloudantTickets;

var dbCredentialsConfig = {};
var dbCredentialsTests = {};
var dbCredentialsTickets = {};

/** Initialize Cloudant DB connections */
function initDBConnection() {
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
		if (env.mode == "PROD") {
			dbCredentialsTickets.host = result.cloudant.tickets_db_readwrite.host;
			dbCredentialsTickets.user = result.cloudant.tickets_db_readwrite.username;
			dbCredentialsTickets.password = result.cloudant.tickets_db_readwrite.password;
			dbCredentialsTickets.dbName = result.cloudant.tickets_db_readwrite.db;
		}
		
		dbCredentialsTickets.url = "https://" + dbCredentialsTickets.user + ":" + dbCredentialsTickets.password + "@" + dbCredentialsTickets.host;
		
		cloudantTickets = require('cloudant')(dbCredentialsTickets.url);
		
		dbTickets = cloudantTickets.use(dbCredentialsTickets.dbName);
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
	 * Get products to component IDs Map
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} associative array of mappings[compID] = productName
	 */
	getProductsComponentsMap: function (cb) {
		var docId = "module_00_product_scope";
		dbConfig.get(docId, function(err, result) {
			if (err) return cb(err);
			try {
				var mappings = {};
				result.products.forEach(function(product) {
					if (product.compids) {
						product.compids.forEach(function(comp) {
							if (!mappings[comp]) {
								mappings[comp] = product.name;
							}
						});
					}
				});
				
				cb(null, mappings);
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Get SME profiling and validation batches 
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of batches
	 * {
	 *   id: "abc123",
	 *   owner: "ntsang@us.ibm.com",
	 *   name: "Datacap",
	 *   type: ["analytics"|"test"],
	 *   area: "Datacap",
	 *   assignedDate: "2015-04-16T02:00:18.897Z",
	 *   ticketIds: ["72766-999-616_O15-01-22", "10147-004-000_O15-01-19"]
	 * }
	 */
	getBatchProgress: function(cb) {
		var design = "analytics";
		var view = "batches";
		var qparams = {};
		dbTests.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var batches = [];
				result.rows.forEach(function(row) {
					var batch = {
						id: row.id,
						owner: row.key,
						name: row.value[0],
						type: row.value[1],
						area: row.value[2],
						assignedDate: row.value[3],
						ticketIds: row.value[4]
					}
					batches.push(batch);
				});
				cb(null, {batches: batches});
				//cb(null, result);
			} catch(e) {
				cb(e);
			}
		});
	},
	
	/**
	 * Get tickets by ID
	 * @param {string[]} ticketIds - array of ticket IDs
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of ticket docs
	 */
	getTicketsByIds: function(ticketIds, cb) {
		var keys = {
			keys: ticketIds
		}
		dbTickets.fetch(keys, function(err, result) {
			if (err) return cb(err);
			cb(null, result);
		});
	},
	
	/**
	 * Get tickets with answerable values by ID
	 * @param {string[]} ticketIds - array of ticket IDs
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of ticket answerable values
	 * {
	 *   id: "abc123",
	 *   answerable: ["yes" | "no" | "maybe"]
	 * }
	 */
	getTicketsAnswerableByIds: function(ticketIds, cb) {
		var design = "analytics";
		var view = "ticketAnswerable";
		var qparams = {keys: ticketIds};
		dbTickets.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var tickets = [];
				result.rows.forEach(function(row) {
					var ticket = {
						id: row.id,
						answerable: row.value
					}
					tickets.push(ticket);
				});
				cb(null, {tickets: tickets});
			} catch(e) {
				cb(e);
			}
		});
	},

	/**
	 * Get tickets with details by ID
	 * @param {string[]} ticketIds - array of ticket IDs
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of ticket details
	 * {
	 *   ticketId: "abc123",
	 *   title: "Ticket title",
	 *   createdDate: "2015-04-16T02:00:18.897Z",
	 *   compId: "5725C1500",
	 *   severity: ["1" | "2" | "3" | "4"],
	 *   answerable: ["yes" | "no" | "maybe"],
	 *   votedBy: "ntsang@us.ibm.com",
	 *   timeToRespond: 1234,
	 *   comments: "SME comments on whether the ticket was answerable"
	 * }
	 */
	getTicketDetailsByIds: function(ticketIds, cb) {
		var design = "analytics";
		var view = "ticketDetails";
		var qparams = {keys: ticketIds};
		dbTickets.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var ticketDetails = [];
				result.rows.forEach(function(row) {
					var ticketDetail = {
						ticketId: row.id,
						title: row.value[0],
						createdDate: row.value[1],
						compId: row.value[2],
						severity: row.value[3],
						answerable: row.value[4],
						votedBy: row.value[5],
						timeToRespond: row.value[6],
						comments: JSON.stringify(row.value[7])
					}
					ticketDetails.push(ticketDetail);
				});
				cb(null, {tickets: ticketDetails});
			} catch(e) {
				cb(e);
			}
		});
	},	
	
	/**
	 * Get component IDs with stats on answerable tickets
	 * @param {string[]} ticketIds - array of ticket IDs
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of component IDs with stats on answerable tickets
	 * {
	 *   id: "5725C1500",
	 *   yes: 15,
	 *   no: 20,
	 *   maybe: 10,
	 *   noResponse: 5,
	 *   total: 50
	 * }
	 */
	getComponentAnswerableStats: function(ticketIds, cb) {
		var design = "analytics";
		var view = "productAnswerableStats";
		var qparams = {keys: ticketIds};
		dbTickets.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var compStats = {};
				result.rows.forEach(function(row) {
					var compId = row.value[0];
					var answerable = row.value[1];
					if (!compStats[compId]) {
						compStats[compId] = {yes: 0, no: 0, maybe: 0, noResponse: 0, total: 0}
					}
					compStats[compId].total++;
					switch(answerable) {
						case "yes":
							compStats[compId].yes++;
							break;
						case "no":
							compStats[compId].no++;
							break;
						case "maybe":
							compStats[compId].maybe++;
							break;
						default:
							compStats[compId].noResponse++;
							break;
					}
				});
				var components = [];
				for (var key in compStats) {
					if (compStats.hasOwnProperty(key)) {
						var component = {
							id: key,
							yes: compStats[key].yes,
							no: compStats[key].no,
							maybe: compStats[key].maybe,
							noResponse: compStats[key].noResponse,
							total: compStats[key].total
						};
						components.push(component);
					}
				}
				cb(null, {components: components});
			} catch(e) {
				cb(e);
			}
		});
	},

	/**
	 * Get tickets that contained malformatted ticket body values, for example the format insert was shown and not the description
	 * @param {apiCallback} cb - callback that handles the response
	 * @returns {Object} JSON of ticket IDs
	 */
	getTicketsBad: function(cb) {
		var design = "analytics";
		var view = "ticketsBad";
		var qparams = {};
		dbTickets.view(design, view, qparams, function(err, result) {
			if (err) return cb(err);
			try {
				var ticketsBad = [];
				result.rows.forEach(function(row) {
					ticketsBad.push(row.id);
				});
				cb(null, {ticketsBad: ticketsBad});
			} catch(e) {
				cb(e);
			}
		});
	},
	
}