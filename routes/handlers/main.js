var administration = require("../../lib/administration");

var q = require("q");

var env = { mode: "DEV", debug: true, testUser: "" };
if (process.env.FR_ROLE) {
	env.mode = (process.env.FR_ROLE).toUpperCase();
}
if (process.env.FR_DEBUG_MODE) {
	env.debug = (process.env.FR_DEBUG_MODE == "true");
}
if (process.env.TESTUSER) {
//if (process.env.TESTUSER && process.env.FR_ROLE != "PROD") {
	env.testUser = process.env.TESTUSER;
}

var proxyPath = "";

if (process.env.PROXYPATH) {
	proxyPath = process.env.PROXYPATH;
}

var auth_user = ["None","None"];

/*function isAuthorized(req) {
	if (env.testUser) {
		auth_user[0] = env.testUser;
		return true;
	}
	if (!req.headers.authorization) {
		return false;	
	}
	var authorization = "None";
    authorization = req.headers.authorization.substring(6);
    var sb = new Buffer(authorization, 'base64');
    authorization = sb.toString();
    auth_user = authorization.split(':');
	return true;
}*/

function isAuthorized(req) {
	var deferred = q.defer();
	if (env.testUser) {
		deferred.resolve({user: env.testUser});
	} else if (!req.headers.authorization) {
		deferred.reject({error: "Authorization header not found", status: 407});
	} else {
		var authorization = req.headers.authorization.substring(6);
		var sb = new Buffer(authorization, 'base64');
		authorization = sb.toString();
		deferred.resolve({user: authorization.split(':')[0]});
	}
	return deferred.promise;
}

function getUser(user) {
	var deferred = q.defer();
	administration.getUser(user.user, function(err, doc) {
		if (err) {
			deferred.reject({error: "Failed to get user", status: 500});
		} else {
			deferred.resolve(doc);
		}
	});
	return deferred.promise;
}

function renderView(view, user, req, res) {
	var viewPath = [];
	if (view.indexOf("/") >= 0) {
		viewPath = view.split("/");
	} else {
		viewPath.push(view);
	}
	var params = { mode: env.mode, debug: env.debug, proxyPath: proxyPath, userid: user.userid, permissions: user.permissions };
	var hasPermissions = true;
	var viewArea = "";
	switch(viewPath[0]) {
		case "overview":
			viewArea = "overview";
			if (!user.permissions.analytics) {
				hasPermissions = false;
			}
			break;
		case "analytics":
			viewArea = "analytics";
			if (!user.permissions.analytics) {
				hasPermissions = false;
			}
			break;
		case "reports":
			viewArea = "analytics";
			if (!user.permissions.analytics) {
				hasPermissions = false;
			}
			break;
		case "logging":
			viewArea = "logging";
			if (!user.permissions.logging) {
				hasPermissions = false;
			}
			break;
		case "loggingByTicket":
			viewArea = "logging";
			if (!user.permissions.logging) {
				hasPermissions = false;
			}
			break;
		case "orchestratorLog":
			viewArea = "orchestratorLog";
			if (!user.permissions.logging) {
				hasPermissions = false;
			}
			break;
		case "testing":
			viewArea = "testing";
			if (req.query.id && req.query.id != "") {
				params.testId = req.query.id;
			}
			if (!user.permissions.testing) {
				hasPermissions = false;
			}
			break;
		case "testingExecute":
			viewArea = "testing";
			if (!user.permissions.testing) {
				hasPermissions = false;
			}
			break;
		case "configure":
			viewArea = "configure";
			if (req.query.historydocid && req.query.historydocid != "") {
				params.historydocid = req.query.historydocid;
			}
			if (!user.permissions.configure) {
				hasPermissions = false;
			}
			break;
		case "configHistory":
			viewArea = "configure";
			if (req.query.docid && req.query.docid != "") {
				params.docid = req.query.docid;
			}
			if (!user.permissions.configure) {
				hasPermissions = false;
			}
			break;
		case "administration":
			viewArea = "administration";
			if (!user.permissions.administration) {
				hasPermissions = false;
			}
			break;
		default:
			hasPermissions = false;
			break;
	}
	params.view = viewArea;
	if (hasPermissions) {
		var path = "";
		if (viewPath.length > 1) {
			path = viewPath.join("/");
		} else {
			path = viewPath[0];
		}
		//res.render(path, { mode: env.mode, debug: env.debug, proxyPath: proxyPath, userid: user.userid, view: viewArea, permissions: user.permissions });
		res.render(path, params);
	} else {
		res.render("nopermissions", params);
	}
}

function renderError(error, res) {
	res.status(error.status);
	res.render('error', {
		layout: 'error',
		status: error.status,
		message: error.error
	});
}

exports.overview = function(req, res) {
	isAuthorized(req)
		.then(getUser)
		.then(function(user) {
			renderView("overview", user, req, res);
		})
		.catch(function(error) {
			renderError(error, res);
		});
};

exports.configure = function(req, res) {
	isAuthorized(req)
		.then(getUser)
		.then(function(user) {
			renderView("configure", user, req, res);
		})
		.catch(function(error) {
			renderError(error, res);
		});
};

exports.configHistory = function(req, res) {
	isAuthorized(req)
		.then(getUser)
		.then(function(user) {
			renderView("configHistory", user, req, res);
		})
		.catch(function(error) {
			renderError(error, res);
		});
};

exports.analytics = function(req, res) {
	isAuthorized(req)
		.then(getUser)
		.then(function(user) {
			renderView("analytics", user, req, res);
		})
		.catch(function(error) {
			renderError(error, res);
		});
};

exports.report = function(req, res){
	isAuthorized(req)
		.then(getUser)
		.then(function(user) {
			renderView("reports/" + req.query.reportName, user, req, res);
		})
		.catch(function(error) {
			renderError(error, res);
		});
	/*if (!isAuthorized(req)) {
		var err = new Error('Not Authorized');
		err.status = 407;
		res.status(err.status);
		res.render('error', {
			layout: 'error',
			status: err.status,
			message: err.message
		});
		return;
	}
	administration.getUser(auth_user[0], function(err, doc) {
		if (err) {
			var err = new Error('Failed to get user');
			err.status = 500;
			res.status(err.status);
			res.render('error', {
				layout: 'error',
				status: err.status,
				message: err.message
			});
			return;
		}
		if (doc.permissions.analytics) {
			res.render('reports/' + req.query.reportName, { mode: env.mode, debug: env.debug, proxyPath: proxyPath, userid: auth_user[0], view: "analytics", permissions: doc.permissions });
		} else {
			res.render('nopermissions', { mode: env.mode, debug: env.debug, proxyPath: proxyPath, userid: auth_user[0], view: "analytics", permissions: doc.permissions });
		}
	});*/
};

exports.logging = function(req, res){
	isAuthorized(req)
		.then(getUser)
		.then(function(user) {
			renderView("logging", user, req, res);
		})
		.catch(function(error) {
			renderError(error, res);
		});
};

exports.loggingByTicket = function(req, res){
	isAuthorized(req)
		.then(getUser)
		.then(function(user) {
			renderView("loggingByTicket", user, req, res);
		})
		.catch(function(error) {
			renderError(error, res);
		});
};

exports.orchestratorLog = function(req, res){
	isAuthorized(req)
	.then(getUser)
	.then(function(user) {
		renderView("orchestratorLog", user, req, res);
	})
	.catch(function(error) {
		renderError(error, res);
	});
};

exports.testing = function(req, res){
	isAuthorized(req)
		.then(getUser)
		.then(function(user) {
			renderView("testing", user, req, res);
			/*if (user.permissions.testing) {
				var params = { mode: env.mode, debug: env.debug, proxyPath: proxyPath, userid: user.userid, view: "testing", permissions: user.permissions };
				if (req.query.id && req.query.id != "") {
					params.testId = req.query.id;

				}
				res.render("testing", params);
			} else {
				res.render("nopermissions", { mode: env.mode, debug: env.debug, proxyPath: proxyPath, userid: user.userid, view: "testing", permissions: user.permissions });
			}*/
		})
		.catch(function(error) {
			renderError(error, res);
		});
};

exports.testingExecute = function(req, res){
	isAuthorized(req)
		.then(getUser)
		.then(function(user) {
			renderView("testingExecute", user, req, res);
		})
		.catch(function(error) {
			renderError(error, res);
		});
};

exports.administration = function(req, res) {
	isAuthorized(req)
		.then(getUser)
		.then(function(user) {
			renderView("administration", user, req, res);
		})
		.catch(function(error) {
			renderError(error, res);
		});
};

/*exports.agentwatson = function(req, res){
	if (!isAuthorized(req)) {
		var err = new Error('Not Authorized');
		err.status = 407;
		res.status(err.status);
		res.render('error', {
			layout: 'error',
			status: err.status,
			message: err.message
		});
		return;
	}
	res.render('agentwatson', { mode: env.mode, debug: env.debug, proxyPath: proxyPath, userid: auth_user[0] });
};*/

