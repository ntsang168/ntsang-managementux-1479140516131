# logger

   A Node module to write application logs into cloudant database
   for born-on-cloud applications such as First Response.
   
   Use test.js for checking the functionality. 
   logger.log() can be called with specifying the severity and the log message.
   logger.logDetails() can be called with specifying the full JSON object of the log message.
   

## Author

	First-Response  2015-04-02

## Usage

	var logger = require('./Logger.js');
	logger.setComponentId("07-pipeline");

## Developing

   first-response / Pipeline / loc-logger

### Tools

