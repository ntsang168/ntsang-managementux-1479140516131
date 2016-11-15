var env = { mode: "DEV", debug: true };
if (process.env.FR_ROLE) {
	env.mode = (process.env.FR_ROLE).toUpperCase();
}
if (process.env.FR_DEBUG_MODE) {
	env.debug = (process.env.FR_DEBUG_MODE == "true");
}

var dbConfig;
var db;

var cloudantConfig;
var cloudant;

var dbCredentialsConfig = {};
var dbCredentials = {};

function initDBConnection() {
	if (process.env.CLOUDANT_R) {
		//console.log("Using env CLOUDANT_R");
		var cloudantR = JSON.parse(process.env.CLOUDANT_R);
		if(cloudantR) {
			dbCredentialsConfig.host = cloudantR.cloudant.host;
			dbCredentialsConfig.user = cloudantR.cloudant.username;
			dbCredentialsConfig.password = cloudantR.cloudant.password;
			dbCredentialsConfig.dbName = cloudantR.cloudant.db;
			dbCredentialsConfig.url = "https://" + dbCredentialsConfig.user + ":" + dbCredentialsConfig.password + "@" + dbCredentialsConfig.host;
			dbCredentialsConfig.propFile = cloudantR.cloudant.prop_file;
			//console.log(dbCredentialsConfig.url);
		}
	} else {
		console.error("CLOUDANT_R environment var is not set. It needs to have credentials to the configuration DB.");
		console.error("export CLOUDANT_R=\"{\"db\":\"databasename\",\"username\":\"username\",\"password\":\"password\",\"host\":\"hostname\"}\"");
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
		//console.log(dbCredentials.url);
		
		cloudant = require('cloudant')(dbCredentials.url);
		
		db = cloudant.use(dbCredentials.dbName);
	});
}

initDBConnection();

exports.getUsers = function(cb) {	
	var id = "users_permissions";
	var qparams = {revs_info: false};
	db.get(id, qparams, function(err, doc) {
		if (err) return cb(err);
		cb(null, doc);
	});
}

exports.getUser = function(userId, cb) {	
	var id = "users_permissions";
	var qparams = {revs_info: false};
	db.get(id, qparams, function(err, doc) {
		if (err) return cb(err);
		var found = false;
		doc.users.forEach(function(user) {
			if (user.userid == userId) {
				found = true;
				cb(null, user);
			}
		});
		if (!found) {
			var emptyUser = {
				userid: "",
				permissions: {}
			}
			cb(null, emptyUser);
		}
	});
}

exports.saveUser = function(newUser, userId, permissions, cb) {
	var addUser = (newUser == "true");
	console.log(addUser, userId, JSON.parse(permissions));
	var id = "users_permissions";
	var qparams = {revs_info: false};
	db.get(id, qparams, function(err, doc) {
		if (err) return cb(err);
		
		var perm = JSON.parse(permissions);
		if (addUser) {
			console.log("new user");
			doc.users.push({userid: userId, permissions: {
				configure: perm.configure,
				analytics: perm.analytics,
				logging: perm.logging,
				testing: perm.testing,
				administration: perm.administration
			}});
			db.insert(doc, doc._id, function(err, doc) {
				if (err) return cb(err);
				cb(null, doc);
			});
		} else {
			var updated = false;
			console.log("edit user before", doc);
			doc.users.forEach(function(user) {
				if (user.userid == userId) {
					updated = true;
					user.permissions.configure = perm.configure;
					user.permissions.analytics = perm.analytics,
					user.permissions.logging = perm.logging,
					user.permissions.testing = perm.testing,
					user.permissions.administration = perm.administration,
					db.insert(doc, doc._id, function(err, doc) {
						if (err) return cb(err);
						cb(null, doc);
					});
				}
			});
			if (!updated) {
				doc.users.push({userid: userId, permissions: {
					configure: perm.configure,
					analytics: perm.analytics,
					logging: perm.logging,
					testing: perm.testing,
					administration: perm.administration
				}});
				db.insert(doc, doc._id, function(err, doc) {
					if (err) return cb(err);
					cb(null, doc);
				});
			}
		}
	});
}
