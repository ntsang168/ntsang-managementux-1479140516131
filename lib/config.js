var fs = require("fs"),
	q = require("q");

var env = { mode: "DEV", debug: true };
if (process.env.FR_ROLE) {
	env.mode = (process.env.FR_ROLE).toUpperCase();
}
if (process.env.FR_DEBUG_MODE) {
	env.debug = (process.env.FR_DEBUG_MODE == "true");
}

var dbConfig;
var db;
var dbConfigHistory;

function initDBConnection() {
	var cloudantConfig;
	var cloudant;
	var cloudantConfigHistory;

	var dbCredentialsConfig = {};
	var dbCredentials = {};
	var dbCredentialsConfigHistory = {};

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
		
		dbCredentials.host = result.cloudant.configuration_db_readwrite.host;
		dbCredentials.user = result.cloudant.configuration_db_readwrite.username;
		dbCredentials.password = result.cloudant.configuration_db_readwrite.password;
		dbCredentials.dbName = result.cloudant.configuration_db_readwrite.db;
		dbCredentials.url = "https://" + dbCredentials.user + ":" + dbCredentials.password + "@" + dbCredentials.host;
		cloudant = require('cloudant')(dbCredentials.url);
		db = cloudant.use(dbCredentials.dbName);

		dbCredentialsConfigHistory.host = result.cloudant.configurationhistory_db_readwrite.host;
		dbCredentialsConfigHistory.user = result.cloudant.configurationhistory_db_readwrite.username;
		dbCredentialsConfigHistory.password = result.cloudant.configurationhistory_db_readwrite.password;
		dbCredentialsConfigHistory.dbName = result.cloudant.configurationhistory_db_readwrite.db;
		dbCredentialsConfigHistory.url = "https://" + dbCredentialsConfigHistory.user + ":" + dbCredentialsConfigHistory.password + "@" + dbCredentialsConfigHistory.host;
		cloudantConfigHistory = require('cloudant')(dbCredentialsConfigHistory.url);
		dbConfigHistory = cloudantConfigHistory.use(dbCredentialsConfigHistory.dbName);
	});
}

initDBConnection();

exports.getConfigDoc = function(id, cb) {
	db.get(id, { revs_info: false }, function(err, doc) {
		if (err) return cb(err);
		cb(null, doc);
	});
};

exports.getConfigDocList = function(cb) {
	var design = 'ux';
	var view = 'modules';
	var qparams = {};
	
	db.view(design, view, qparams, function(err, result) {
		if (err) return cb(err);
		moduleIds = [];
		result.rows.forEach(function(row) {
			moduleIds.push(row.id);
		});
		return cb(null, {moduleIds: moduleIds});
	});
};

/**
 * Set the config doc based on the updated data
 * @param {Object} docUpdate - the updated config doc data
 * @param {string} comments - audit trail comments to add to history
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} results of doc update
 */
exports.setConfigDoc = function(docUpdate, comments, user, callback) {
	function getConfigDocCurrent(docUpdate, comments) {
		var deferred = q.defer();
		db.get(docUpdate._id, { revs_info: false }, function(err, doc) {
			if (err) {
				deferred.reject(err);
			} else {
				if (docUpdate._rev != doc._rev) {
					deferred.reject("Rev doesn't match, refresh first and try again");
				} else {
					docUpdate.history_modified_by = user;
					docUpdate.history_comments = comments;
					docUpdate.history_timestamp = (new Date()).toISOString();
					deferred.resolve({docCurrent: doc, docNew: docUpdate});
				}
			}
		});
		return deferred.promise;
	}

	function saveConfigDocHistory(doc) {
		var deferred = q.defer();
		var docCurrent = doc.docCurrent;
		docCurrent.history_revision = docCurrent._rev;
		docCurrent.history_version = (docCurrent._rev.split("-"))[0];
		delete docCurrent._rev;
		docCurrent._id = docCurrent.history_version + "-" + docCurrent._id;
		dbConfigHistory.insert(docCurrent, docCurrent._id, function(err, result) {
			if (err) {
				deferred.reject(err);
			} else {
				deferred.resolve(doc);
			}
		});
		return deferred.promise;
	}

	function saveConfigDoc(doc) {
		var deferred = q.defer();
		db.insert(doc.docNew, doc.docNew._id, function(err, result) {
			if (err) {
				deferred.reject(err);
			} else {
				deferred.resolve(result);
			}
		});
		return deferred.promise;
	}

	getConfigDocCurrent(docUpdate, comments, user)
		.then(saveConfigDocHistory)
		.then(saveConfigDoc)
		.then(function(result) {
			callback(null, result);
		})
		.catch(function(error) {
			callback(error);
		});
};

/**
 * Get a list of previous versions of a config doc
 * @param {Object} docId - the config doc ID
 * @param {number} limit - the limit for how previous versions of the doc to return
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} list of previous versions of the config doc
 */
exports.getConfigDocHistory = function(docId, limit, callback) {
	var design = "ux",
		view = "doc-history";
	var params = {
		startkey: [docId, {}],
		endkey: [docId],
		descending: true,
		limit: limit
	};
	dbConfigHistory.view(design, view, params, function(err, result) {
		if (err) {
			return callback(err);
		} else {
			return callback(null, result);
		}
	});
};

/**
 * Get a the config history doc
 * @param {Object} docId - the config history doc ID
 * @param {apiCallback} callback - callback that handles the response
 * @returns {Object} config history doc contents
 */
exports.getHistoryDoc = function(docId, callback) {
	dbConfigHistory.get(docId, function(err, result) {
		if (err) {
			return callback(err);
		} else {
			return callback(null, result);
		}
	});
};

exports.generateWhitelist = function(cb) {
	var answerKey = {};
	fs.readFile("./public/whitelist/whitelist.csv", function (err, data) {
		if (err) {
			console.error("Failed to load whitelist.csv", err);
			return cb(err);
		}
		try {
			var bufferedString = data.toString();
			var bufferedStringSplit = bufferedString.split("\n");
			var compIds = [];
			var count = 0;
			for (var i=1; i<bufferedStringSplit.length; i++) {
				var compId = bufferedStringSplit[i].trim().split(",");
				compIds.push({
					component_id: compId[0],
					name: compId[1],
					start_date: compId[2],
					end_date: ""
				});
				count++;
			}
			cb(null, {count: count, compIds: compIds});
		} catch (e) {
			return cb(e);
		}
	});
};
