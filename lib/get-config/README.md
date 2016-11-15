# get-config

   A Node module to fetch configuration data and secure credentials
   for born-on-cloud applications such as First Response.
   
   Pass in the name of a configuration file - which is to say, 
   the  _id of a document in the configuration database, 
   and I'll fetch it (asynchronously, so you better wait for it) 
   from first-response.cloudant.com/configuration
   
   methods:  non, save the constructor
   
   returns: the content of the configuration file as an object

## Author

	mmccawley@us.ibm.com  2015-03-19

## Usage

   var get_config = require(get-config)("config_file_name", callback);

## Developing

   first-response / Maintainers / get-config

### Tools

