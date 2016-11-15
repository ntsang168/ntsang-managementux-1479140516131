/**
 * Management UX API Routes
 * @module routes/api
 */
var rest = require('connect-rest');
var apihub = require('./handlers/api');

module.exports = function(app) {

	var apiOptions = {
		context: '/hub/api',
		domain: require('domain').create()
	};
	app.use(rest.rester(apiOptions));
	
	/**
	 * Analytics API
	 */
	
	/** Analytics: Dashboard */
	rest.get('/analytics/ticketsprocessedwithtargetandtrend', apihub.getTicketsProcessedWithTargetAndTrend);
	rest.get('/analytics/ticketsemailedwithtargetandtrend', apihub.getTicketsEmailedWithTargetAndTrend);
	rest.get('/analytics/ticketswrittenwithtargetandtrend', apihub.getTicketsWrittenWithTargetAndTrend);
	rest.get('/analytics/ticketskpi', apihub.getTicketsKpi);
	rest.get('/analytics/solutionquality', apihub.getAWSolutionQuality);
	
	rest.get('/analytics/ticketsprocessed', apihub.getTicketsProcessed);
	rest.get('/analytics/ticketsprocessedwhitelist', apihub.getTicketsProcessedWhitelist);
	rest.get('/analytics/ticketsupdated', apihub.getTicketsUpdated);
	
	rest.get('/analytics/solutionstats', apihub.getSolutionStats);
	rest.get('/analytics/refreshsolutionstats', apihub.refreshSolutionStats);
	rest.get('/analytics/refreshsolutionstatsinterval', apihub.getRefreshSolutionStatsInterval);
	rest.get('/analytics/divisions', apihub.getDivisions);
	
	rest.get('/analytics/reports', apihub.getReports);
	
	/** Analytics: Reports */
	rest.get('/analytics/ticketsprocesseddetails', apihub.getTicketsProcessedDetails);
	rest.get('/analytics/ticketsprocesseddetails/txt', apihub.getTicketsProcessedDetailsTxt);
	rest.get('/analytics/ticketsprocessedwhitelistdetails', apihub.getTicketsProcessedWhitelistDetails);
	rest.get('/analytics/ticketsprocessedwhitelistdetails/txt', apihub.getTicketsProcessedWhitelistDetailsTxt);
	rest.get('/analytics/ticketsupdateddetails', apihub.getTicketsUpdatedDetails);
	rest.get('/analytics/ticketsupdateddetails/txt', apihub.getTicketsUpdatedDetailsTxt);
	rest.get('/analytics/ticketsupdatedkmm', apihub.getTicketsUpdatedKMM);
	rest.get('/analytics/ticketsupdatedkmmcache', apihub.getTicketsUpdatedKMMCache);
	rest.get('/analytics/ticketsupdatedkmm/txt', apihub.getTicketsUpdatedKMMTxt);
	rest.get('/analytics/ticketsupdatedkmmcache/txt', apihub.getTicketsUpdatedKMMCacheTxt);
	rest.get('/analytics/ticketswitherrorbyday', apihub.getTicketsWithErrorByDay);
	rest.get('/analytics/ticketsbreakdown', apihub.getTicketsBreakdown);
	rest.get('/analytics/closedtickets', apihub.getClosedTickets);
	rest.get('/analytics/closedtickets/txt', apihub.getClosedTicketsTxt);
	rest.get('/analytics/ticketanswersresponses', apihub.getTicketAnswersResponses);
	rest.get('/analytics/ticketanswersresponses/txt', apihub.getTicketAnswersResponsesTxt);
	rest.get('/analytics/generatekpi', apihub.generateKPI);
	rest.get('/analytics/generatekmm', apihub.generateKMM);
	rest.get('/analytics/generatetimeseries', apihub.generateTimeSeries);
	rest.get('/analytics/generatetimeseries/txt', apihub.generateTimeSeriesTxt);
	rest.put('/analytics/savetimeseries', apihub.saveTimeSeries);
	rest.get('/analytics/generatesolutionstats', apihub.generateSolutionStats);
	rest.put('/analytics/saveticketsupdatedkmm', apihub.saveTicketsUpdatedKMM);
	rest.post('/analytics/savereportlog', apihub.saveReportLog);

	/** Analytics: SME QA Pairs */
	rest.get('/analytics/qapairs/l0pmrkmmfeedback', apihub.getL0PMRKMMFeedback);
	rest.put('/analytics/qapairs/l0pmrkmmfeedback', apihub.setL0PMRKMMFeedback);

	/** Analytics: SME Trials */
	rest.get('/analytics/productscomponentsmap', apihub.getProductsComponentsMap);
	rest.get('/analytics/batchprogress', apihub.getBatchProgress);
	rest.post('/analytics/tickets', apihub.getTicketsByIds);
	rest.post('/analytics/ticketsanswerable', apihub.getTicketsAnswerableByIds);
	rest.post('/analytics/ticketdetails', apihub.getTicketDetailsByIds);
	rest.get('/analytics/ticketsbad', apihub.getTicketsBad);
	rest.post('/analytics/componentanswerablestats', apihub.getComponentAnswerableStats);

	/** Analytics: Spotlight */
	rest.get('/analytics/spotlight/spotlightproducts', apihub.getSpotlightProducts);
	rest.get('/analytics/spotlight/ticketsprocessed', apihub.getSpotlightTicketsProcessed);
	rest.get('/analytics/spotlight/ticketsprocessedwhitelist', apihub.getSpotlightTicketsProcessedWhitelist);
	rest.get('/analytics/spotlight/ticketsupdated', apihub.getSpotlightTicketsUpdated);
	rest.get('/analytics/spotlight/ticketsprocesseddetails', apihub.getSpotlightTicketsProcessedDetails);
	rest.get('/analytics/spotlight/ticketsprocesseddetails/txt', apihub.getSpotlightTicketsProcessedDetailsTxt);
	rest.get('/analytics/spotlight/ticketsprocessedwhitelistdetails', apihub.getSpotlightTicketsProcessedWhitelistDetails);
	rest.get('/analytics/spotlight/ticketsprocessedwhitelistdetails/txt', apihub.getSpotlightTicketsProcessedWhitelistDetailsTxt);
	rest.get('/analytics/spotlight/ticketsupdateddetails', apihub.getSpotlightTicketsUpdatedDetails);
	rest.get('/analytics/spotlight/ticketsupdateddetails/txt', apihub.getSpotlightTicketsUpdatedDetailsTxt);
	rest.get('/analytics/spotlight/ticketsupdatedkmm', apihub.getSpotlightTicketsUpdatedKMM);
	rest.get('/analytics/spotlight/ticketsupdatedkmmcache', apihub.getSpotlightTicketsUpdatedKMMCache);
	rest.get('/analytics/spotlight/ticketsupdatedkmm/txt', apihub.getSpotlightTicketsUpdatedKMMTxt);
	rest.get('/analytics/spotlight/ticketsupdatedkmmcache/txt', apihub.getSpotlightTicketsUpdatedKMMCacheTxt);
	rest.get('/analytics/spotlight/generatetimeseries', apihub.generateSpotlightTimeSeries);
	rest.get('/analytics/spotlight/generatetimeseries/txt', apihub.generateSpotlightTimeSeriesTxt);
	rest.put('/analytics/spotlight/savetimeseries', apihub.saveSpotlightTimeSeries);
	rest.put('/analytics/spotlight/saveticketsupdatedkmm', apihub.saveSpotlightTicketsUpdatedKMM);
	rest.get('/analytics/spotlight/generatesolutionstats', apihub.generateSpotlightSolutionStats);
	rest.get('/analytics/spotlight/solutionstats', apihub.getSpotlightSolutionStats);
	rest.get('/analytics/spotlight/refreshsolutionstats', apihub.refreshSpotlightSolutionStats);
	rest.get('/analytics/spotlight/refreshsolutionstatsinterval', apihub.getSpotlightRefreshSolutionStatsInterval);

	/** Analytics: Hardware */
	rest.get('/analytics/hardware/ticketsupdatedkmm', apihub.getHardwareTicketsUpdatedKMM);
	rest.get('/analytics/hardware/ticketsupdatedkmm/txt', apihub.getHardwareTicketsUpdatedKMMTxt);

	/** Analytics: Modified Tickets */
	rest.get('/analytics/modified/solutionstats', apihub.getModifiedSolutionStats);
	rest.get('/analytics/modified/ticketsprocessed', apihub.getModifiedTicketsProcessed);
	rest.get('/analytics/modified/ticketsupdated', apihub.getModifiedTicketsUpdated);
	rest.get('/analytics/modified/ticketsupdatedkmm', apihub.getModifiedTicketsUpdatedKMM);
	rest.get('/analytics/modified/timeseries', apihub.getModifiedTimeSeries);
	rest.put('/analytics/modified/savetimeseries', apihub.saveModifiedTimeSeries);
	rest.get('/analytics/modified/generatesolutionstats', apihub.generateModifiedSolutionStats);
	rest.get('/analytics/modified/solutionstats', apihub.getModifiedSolutionStats);
	rest.get('/analytics/modified/refreshsolutionstats', apihub.refreshModifiedSolutionStats);
	rest.get('/analytics/modified/refreshsolutionstatsinterval', apihub.getModifiedRefreshSolutionStatsInterval);

	/** Analytics: Assigned Set Tickets */
	rest.get('/analytics/assignedset/ticketswithkmm', apihub.getAssignedSetTicketsWithKMM);

	/** Analytics: Dynamic Confidence */
	rest.get('/analytics/dynamicconfidence/history', apihub.getDynamicConfidenceHistory);
	rest.get('/analytics/dynamicconfidence/buzzin', apihub.getDynamicConfidenceBuzzIn);

	/**
	 * Logging API
	 */
	rest.post('/logs', apihub.getLogs);
	rest.get('/logsbyticket/:ticketid', apihub.getLogsByTicket);
	//rest.get('/logsbyticket', apihub.getLogsByTicket);
	rest.post('/logs/search', apihub.searchLogs);
	app.post('/hub/api/logs/csv', apihub.getLogsCSV);
	/** 
	 * Orchestrator logging API
	 **/
	rest.post('/orchestratorLog',apihub.getOrchestratorLogs);
	rest.post('/orchestratorLogs/search',apihub.searchOrchestratorLogs);
	app.post('/hub/api/orcLogs/csv', apihub.getOrcLogsCSV);
	rest.post('/orchestratorLogs/searchByQueryId',apihub.searchOrcByQueryId);
	
	/**
	 * Testing API
	 */
	rest.get('/testing/results/:limit', apihub.getTestResults);
	rest.get('/testing/resultsbyid/:id', apihub.getTestResultsById);
	app.get('/hub/api/testing/results/csv/:limit', apihub.getTestResultsCSV);
	rest.get('/testing/testcases', apihub.getTestCases);
	rest.post('/testing/execute', apihub.executeTestCases);
	rest.get('/testing/copyprodticketstotest', apihub.copyProdTicketsToTest);
	rest.post('/testing/copyprodticketstotest', apihub.copyProdTicketsToTestPost);
	rest.post('/testing/copyprodticketstotest/bycompidopendate', apihub.copyProdTicketsToTestByCompIdOpenDate);
	rest.post('/testing/clearunprocessedtickets', apihub.clearUnprocessedTickets);
	rest.post('/testing/copyprodticketstotest/byview', apihub.copyProdTicketsToTestByView);
	rest.post('/testing/copyprodticketstotest/byticketids', apihub.copyProdTicketsToTestByTicketIds);
	rest.post('/testing/setticketstounprocessed/byview', apihub.setTickestToUnprocessedByView);
	rest.post('/testing/setticketstounprocessed/byticketids', apihub.setTickestToUnprocessedByTicketIds);

	/** Testing: Batches and Trials */
	rest.post('/testing/copyanswerstesttotrial', apihub.copyAnswersTestToTrial);
	rest.post('/testing/addanswerstrialanswersset', apihub.addAnswersTrialAnswersSet);
	rest.post('/testing/removelastanswerstrialanswersset', apihub.removeLastAnswersTrialAnswersSet);
	rest.get('/testing/trialresultsbybatch', apihub.getTrialResultsByBatch);
	rest.get('/testing/latesttrialresultsbybatch', apihub.getLatestTrialResultsByBatch);
	rest.get('/testing/batches/batchtransactions', apihub.getBatchTransactions);
	rest.get('/testing/batches/batchtransactions/txt', apihub.getBatchTransactionsTxt);
	
	/**
	 * Configure API
	 */
	rest.get('/config/doc/:id', apihub.getConfigDoc);
	rest.get('/config/list', apihub.getConfigDocList);
	rest.put('/config/doc', apihub.setConfigDoc);
	rest.get('/config/history', apihub.getConfigDocHistory);
	rest.get('/config/history/doc/:id', apihub.getHistoryDoc);
	rest.get('/config/generatewhitelist', apihub.generateWhitelist);
	
	/**
	 * Administration API
	 */
	rest.get('/administration/users', apihub.getUsers);
	rest.get('/administration/user/:userid', apihub.getUser);
	rest.post('/administration/user', apihub.saveUser);
	
	/**
	 * Cleanup API
	 */
	rest.put('/cleanup/clearwhitelistflags', apihub.clearWhitelistFlags);
	rest.put('/cleanup/setwhitelistflags', apihub.setWhitelistFlags);
	rest.post('/cleanup/addmissingticketdocs', apihub.addMissingTicketDocs);
	rest.put('/cleanup/fixmissingticketidsfornewticketsreceived', apihub.fixMissingTicketIdForNewTicketsReceived);
	rest.put('/cleanup/fixmissingtridsfornewticketsreceived', apihub.fixMissingTrIdForNewTicketsReceived);
	rest.put('/cleanup/addopendatetowhitelistanswerfromticket', apihub.addOpenDateToWhitelistAnswerFromTicket);
	rest.put('/cleanup/addopendatetowhitelistanswerfromlog', apihub.addOpenDateToWhitelistAnswerFromLog);
	rest.put('/cleanup/updateticketschemaformatbyticketids', apihub.updateTicketSchemaFormatByTicketIds);
	rest.get('/cleanup/ticketsupdatedlowconfidence', apihub.getTicketsUpdatedLowConfidence);
	rest.post('/cleanup/createmissingticketwritersubmitted', apihub.createMissingTicketWriterSubmitted);
	rest.get('/cleanup/ticketsupdatedduplicateticketwritersubmitted', apihub.getTicketsUpdatedDuplicateTicketWriterSubmitted);
	
	/**
	 * Generic API used by other Clients like ICSW
	 */
	rest.get('/watson/urls/patterns', apihub.getUrlsPatterns);
};