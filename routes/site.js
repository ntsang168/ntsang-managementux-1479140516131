var main = require('./handlers/main');

module.exports = function(app) {

	app.get('/', main.overview);
	
	app.get('/overview', main.overview);
	
	app.get('/analytics', main.analytics);
	app.get('/report', main.report);
	
	app.get('/logging', main.logging);
	app.get('/loggingbyticket', main.loggingByTicket);
	app.get('/orchestratorLog',main.orchestratorLog)
	
	app.get('/testing', main.testing);
	app.get('/testingExecute', main.testingExecute);
	
	app.get('/configure', main.configure);
	app.get('/confighistory', main.configHistory);
	
	app.get('/administration', main.administration);

};




