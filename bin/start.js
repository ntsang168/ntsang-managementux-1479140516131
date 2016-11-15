#!/usr/bin/env node

/**
 * Module dependencies.
 */
var app = require('../app');
var debug = require('debug')('express4:server');
var http = require('http');
var killable = require('killable');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

/**
 * Environment configuration
 */
var port = normalizePort(appEnv.port || "5990");
app.set("port", port);
app.set("mode", "DEV");
if (process.env.FR_ROLE) {
	app.set("mode", process.env.FR_ROLE);
}
app.set("debug", false);
if (process.env.FR_DEBUG_MODE) {
	app.set("debug", process.env.FR_DEBUG_MODE);
}
console.log("--------------------------------------------------");
console.log("PORT is ", app.get("port"))
console.log("FR_ROLE is " + app.get("mode"));
console.log("FR_DEBUG_MODE is " + app.get("debug"));
console.log("--------------------------------------------------");

/**
 * Create HTTP server.
 */
var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
// Set timeout
server.timeout = (5*60*1000);
// enhance with a 'destroy' function
killable(server);

/**
 * Shutdown routine
 */
var shutdownServer = function() {
	var msg = "Received kill signal, shutting down server...";
	console.log(msg);
	
	server.kill(function() {
		msg = "Closed out remaining connections";
		console.log(msg);
		process.exit();
	});

	// if after 10 seconds, force shutdown
	setTimeout(function() {
		console.error("Could not close connections in time, forcefully shutting down");
		process.exit();
	}, 10*1000);
};

//listen for TERM signal .e.g. kill 
process.on ('SIGTERM', shutdownServer);
//listen for INT signal e.g. Ctrl-C
process.on ('SIGINT', shutdownServer);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
