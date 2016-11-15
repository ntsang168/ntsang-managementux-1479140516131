//Global NPM modules
var request = require('request');
var http = require('http');
var util = require('util');
var assert = require('chai').assert;


//Require modules for testing
var cloudant = require("../lib/cloudant/Cloudant.js");

var targetTestBaseURL= "http://localhost:5990/hub/api/watson";

/**
 * Helper method to return the regex associated with a content type.
 * @param type ie DCF, APAR
 * @returns JSON object containing the mappings.
 */
function getMapping(json, type) {
	
	 // First get the regex for dcf
	 var mapping = json.items.filter(function(item){
		 return item.type === type;
	 });
	 
	 return mapping.length > 0 ? mapping[0] : {};
}

/**
 * Helper method to return the lines for a test data  file given which is found under the testdata directory
 * @param fileName
 */
function getFileLines(fileName) {
    // Load test data file containing  APAR content ids with different formats.
    var currentDir =  __dirname;
	//expecting simple list with one column of info
	var fs = require("fs");	
	var file = fs.readFileSync(currentDir + "/testdata/" + fileName, 'utf8');  // returns a string.
	var lines = file.replace(/\r\n/g,'\n').split(/\n|[$]/);  // array of lines
	console.log(fileName + " " + lines.length);
	return lines;
}


var patternMapping = {};

suite('KMM Patterns TestSuite', function() {
		
	/** Call the regex pattern service and cache it to be used by every test**/
	suiteSetup(function(done){
		 request.get({
			  url: targetTestBaseURL + "/urls/patterns",
			  headers: {
			    'Content-Type': 'application/json',
			    json : true
			  }},function(err, resp, body) {
				  if(!err) {
					  patternMapping= JSON.parse(body);
					 
				  } 
				  done();
			  });
	});
	
	
  /** Tests that service returning content type to regex pattern is not completely broken.**/
	test("testServiceResponse", function() {
		 assert.isTrue( patternMapping._id.indexOf("watson-url-type-regex-mapping") > -1, "Json file did not return the expected id");
		 assert.ok(patternMapping.items.length > 0, "Watson service returning 0 patterns is not expected. Something is wrong with the service");
	});
  
  /** Loads test data containing all valid DCF content ids but in different formats. Tests that all are matches.**/
  test('testValidDCFContent', function(done) {
    var type = "DCF";

    var lines = getFileLines("valid_dcf_content.txt");
		
	// Start tests     
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 for (var i=0; i<lines.length; i++) {
		 var contentId=lines[i];
		
		 if(contentId.trim().length === 0) {
			 continue;
		 }
		 var isDcf = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return contentId.match(regexp);
		 });
		
		 assert.ok(isDcf, "All lines should be valid " +  type + " matches. However, the following line did not match [" + contentId + "]. Total lines to process:" + lines.length);
	}
	
    done();	
	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations .**/
  test('testNormalizeDCFUrl', function(done) {
	var inputUrl = "http://www.ibm.com/support/docview.wss?rs=899&uid=swg21234567";
	//var expectedIdPattern = /[147]\d{6}/;
	
    var type = "DCF";	
	
    
    
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputUrl.match(regexp)) {
			 break;
		 }
	}
	
	if(matches.length > 0) {
		assert.equal("1234567", matches[1], "Expected id not extracted correctly. Expected [1234567]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputUrl);
		
	}
	
    done();	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations .**/
  test('testNormalizeDCFDoc', function(done) {
	 var inputContent = "Doc: 1205991";
	 var expectedId = "1205991";
     var type = "DCF";
    
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 break;
		 }
	}
	
	if(matches.length > 0) {
		assert.equal(expectedId, matches[1], "Expected id not extracted correctly. Expected [" + expectedId + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations .**/
  test('testNormalizeDCFNas8', function(done) {
	var inputContent = "http://www-01.ibm.com/support/docview.wss?uid=nas8N1234567";
	var expectedId = "nas8N1234567";
    var type = "DCF";
    // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedId, matches[1], "Expected id not extracted correctly. Expected [" + expectedId + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations .**/
  test('testNormalizeWellspringTechnoteToExternalURL', function(done) {
	var inputContent = "http://eclient.lenexa.ibm.com:9082/search/?fetch=source/TechNote/1570802";
	var expectedId = "http://www.ibm.com/support/docview.wss?uid=swg21570802";
    var type = "DCF";
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedId, baseURL+matches[1], "Expected id not extracted correctly. Expected [" + expectedId + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations .**/
  test('testNormalizeDCFNas8IntoUrl', function(done) {
	var inputContent = "http://www-01.ibm.com/support/docview.wss?uid=nas8N1234567";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=nas8N1234567";
    var type = "DCF";
    
	
	// First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeDCFUidNas8IntoUrl', function(done) {
	var inputContent = "uid=nas8N1234567";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=nas8N1234567";
    var type = "DCF";
   
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeDCFIDNas8IntoUrl', function(done) {
	var inputContent = "N1234567";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=nas8N1234567";
    var type = "DCF";
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
	
  });
  
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeDCFUidSwg2IntoUrl', function(done) {
	var inputContent = "swg21234567";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=swg21234567";
    var type = "DCF";
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
	
  });
  
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeDCFIdIntoUrl', function(done) {
	var inputContent = "1234567";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=swg21234567";
    var type = "DCF";
    
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	

  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeDCFTNIntoUrl', function(done) {
	var inputContent = "TechNote# 1234567";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=swg21234567";
    var type = "DCF";
   // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
	
  });
  
  /** Loads test data containing all invalid DCF content ids but in different formats. Tests that none match.**/
  test('testInValidDCFContent', function(done) {
    var type = "DCF";
    // Load test data file containing  DCF content ids with different formats.
    var lines = getFileLines("invalid_dcf_content.txt");
	
    // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 for (var i=0; i<lines.length; i++) {
		 var contentId=lines[i];
		 
		 if(contentId.trim().length === 0) {
			 continue;
		 }
		 var isDcf = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return contentId.match(regexp);
		 });
		
		 assert.ok(!isDcf, "All lines should be invalid " +  type +" matches. However, the following line did  match [" + contentId + "]");
	}
	
    done();	
  });
  
  /** Loads test data containing all valid APAR content ids but in different formats. Tests that all are matches.**/
  test('testValidAPARContent', function(done) {
    var type = "APAR";
    // Load test data file containing  APAR content ids with different formats.
	var lines = getFileLines("valid_apar_kmm_content.txt");
	
	 // First get the regex for apar
	 var aparEntry = getMapping(patternMapping, type);
	 
	 assert.ok(aparEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 for (var i=0; i<lines.length; i++) {
		 var contentId=lines[i];
		 
		 if(contentId.trim().length === 0) {
			 continue;
		 }
		 var isApar = aparEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return contentId.match(regexp);
		 });
		
		 assert.ok(isApar, "All lines should be valid " +  type +" matches. However, the following line did not match [" + contentId + "]");
	}
	
    done();	
  });
  
  /** Loads test data containing all invalid APAR content ids but in different formats. Tests none match.**/
  test('testInValidAPARContent', function(done) {
    var type = "APAR";
    // Load test data file containing  invalid APAR content ids with different formats.
	var lines = getFileLines("invalid_apar_kmm_content.txt");
	
	 // First get the regex for apar
	 var aparEntry = getMapping(patternMapping, type);
	 
	 assert.ok(aparEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 for (var i=0; i<lines.length; i++) {
		 var contentId=lines[i];
		 
		 if(contentId.trim().length === 0) {
			 continue;
		 }
		 var isApar = aparEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return contentId.match(regexp);
		 });
		
		 assert.ok(!isApar, "All lines should be invalid " +  type +" content ids. However, the following line got a  match [" + contentId + "]");
	}
	
    done();	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeAPARIdIntoUrl', function(done) {
	var inputContent = "PM12345";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=swg1PM12345";
    var type = "APAR";
 
	 // First get the regex for apar
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeAPARUidIntoUrl', function(done) {
	var inputContent = "uid=swg1PM12345";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=swg1PM12345";
    var type = "APAR";
    
	
    // First get the regex for apar
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeAPARUrlIntoUrl', function(done) {
	var inputContent = "http://www-304.ibm.com/support/docview.wss?uid=swg1PM12345";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=swg1PM12345";
    var type = "APAR";
    
	
	 // First get the regex for apar
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
	
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeAPARIsg1UrlIntoUrl', function(done) {
	var inputContent = "http://www-304.ibm.com/support/docview.wss?uid=isg1PM12345";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=isg1PM12345";
    var type = "APAR";
    
	
	 // First get the regex for apar
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
	
  });
  
 
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeAPARNas32UrlIntoUrl', function(done) {
	var inputContent = "http://www-01.ibm.com/support/docview.wss?uid=nas2bddbb075c1913f38625778900632b999";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=nas2bddbb075c1913f38625778900632b999";
    var type = "APAR";
    
	
	 // First get the regex for apar
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();		
  });
  
  /** Tests the normalizing patterns extract the correct id out of different content id variations and generates the right canonical url .**/
  test('testNormalizeAPARAndAIdIntoUrl', function(done) {
	var inputContent = "APAR PM12345";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=swg1PM12345";
    var type = "APAR";
 
				 
		 // First get the regex for dcf
		 var typeEntry = getMapping(patternMapping, type);
		 
		 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
		 
		var matches = [];
		
		
		var baseURL = "";
		for(var i = 0; i < typeEntry.patterns.length; i++) {
			var regexp  = new RegExp(typeEntry.patterns[i].pattern);
			
			 if(matches=inputContent.match(regexp)) {
				 baseURL = typeEntry.patterns[i].baseURL;
				 break;
			 }
		}
		
		if(matches != null && matches.length > 0) {
			assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
		} else {
			assert.fail(true,true,"Expected match not found for input content:" + inputContent);
			
		}
		
	    done();	
	
  });
  
  /** Tests if a valid pub content gets matched **/
  test('testIsPub', function(done) {
	var inputContent = "GI11-6304-00";
	var expectedUrl = "http://www.ibm.com/support/docview.wss?uid=pub" + inputContent.replace(/-/g, "");
    var type = "PUB";
    
	 // First get the regex for pub
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1].replace(/-/g,''), "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
			 
  });
  
  /** Tests if a valid pub content gets matched **/
  test('testIsPub', function(done) {
	var inputContent = "http://www-01.ibm.com/support/docview.wss?uid=pub1gi10868706";
	var expectedId = "GI10-8687-06";
    var type = "PUB";
	 // First get the regex for pub
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing patterns for " + type + " content");
	 
	var matches = [];
	
	
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=inputContent.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		var match = matches[1].toUpperCase();
		match = match.substring(0, 4) + "-" + match.substring(4,8) + "-" + match.substring(8);
		assert.equal(expectedId, match , "Expected id not extracted correctly. Expected [" + expectedId + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + inputContent);
		
	}
	
    done();	
  });
  
  /** Loads test data containing all valid IC content ids but in different formats. Tests that all are matches.**/
  test('testValidICContent', function(done) {
    var type = "IC";
    // Load test data file containing  IC content ids with different formats.
    var lines = getFileLines("valid_ic_content.txt");
	
	 // First get the regex for ic
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 for (var i=0; i<lines.length; i++) {
		 var contentId=lines[i];
		 
		 if(contentId.trim().length === 0) {
			 continue;
		 }
		 var isIC = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return contentId.match(regexp);
		 });
		
		 assert.ok(isIC, "All lines should be valid " +  type +" matches. However, the following line did not match [" + contentId + "]");
	}
	
    done();	
	
  });
  
  /** Tests that an invalid entry is not recognized as IC**/
  test('testInvalidICContent', function(done) {
    var type = "IC";
    var badcontent = "this is bad content";
	 // First get the regex for ic
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 
	 var isIC = typeEntry.patterns.some(function(element, index, array) {
		 var regexp  = new RegExp(element.pattern);
		 return badcontent.match(regexp);
	 });
	
	 assert.ok(!isIC, "Type " +  type +" incorrectly matched [" + badcontent + "]");

	
    done();	
	
  });
  
  
  /** Loads test data containing all valid IC content ids but in different formats. Tests that all are matches.**/
  test('testValidICContent', function(done) {
    var type = "IC";
    // Load test data file containing  IC content ids with different formats.
    var lines = getFileLines("valid_ic_content.txt");
	 // First get the regex for IC
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 for (var i=0; i<lines.length; i++) {
		 var contentId=lines[i];
		 
		 if(contentId.trim().length === 0) {
			 continue;
		 }
		 var isIC = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return contentId.match(regexp);
		 });
		
		 assert.ok(isIC, "All lines should be valid " +  type +" matches. However, the following line did not match [" + contentId + "]");
	}
	
    done();	
	
  });
  
  /** Loads test data containing all valid Developer content ids but in different formats. Tests that all are matches.**/
  test('testValidDeveloperWorksContent', function(done) {
   var type = "DVW";
   var url = "https://www.ibm.com/developerworks/community/blogs/nfrsblog/entry/license_borrow_and_early_return_of_borrowed_licenses?lang=en";
	

	 // First get the regex for DVW
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 var isDVW = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return url.match(regexp);
		 });
		
		 assert.ok(isDVW, "Given url should be valid " +  type +" matches. However, the following line did not match [" + url + "]");
	
	
    done();	
	
  });
  /** tests valid dwAnswer link.**/
  test('testValidDWAnswersContent', function(done) {
    var type = "DWA";
    var url = "https://developer.ibm.com/answers/questions/195885/where-do-i-put-the-license-file-when-upgrading-to.html";
		 
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 var isDWA= typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return url.match(regexp);
		 });
		
		 assert.ok(isDWA, "Given url should be valid " +  type +" matches. However, the following line did not match [" + url + "]");
	
	
	done();	
  });
  
  /** Test matches for redbooks.**/
  test('testValidRedbookContent', function(done) {
    var type = "RDBK";
    var url = "http://www.redbooks.ibm.com/redbooks/pdfs/sg247722.pdf";
	
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 var isRDBK = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return url.match(regexp);
		 });
		
		 assert.ok(isRDBK, "Given url should be valid " +  type +" matches. However, the following line did not match [" + url + "]");
	
	
    done();	
  });
  
	/** Test matches for jazz net.**/
	test('testValidJazzNet', function(done) {
	  var type = "JZNT";
	  var url = "https://jazz.net/library/article/479";
		
		
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 var isJZNT = typeEntry.patterns.some(function(element, index, array) {
		 var regexp  = new RegExp(element.pattern);
		 return url.match(regexp);
	 });
	
	 assert.ok(isJZNT, "Given url should be valid " +  type +" matches. However, the following line did not match [" + url + "]");

     done();	
		
	});
	
	/** Test matches for redbooks.**/
	test('testValidRedbookContent', function(done) {
	  var type = "RDBK";
	 var url = "http://www.redbooks.ibm.com/redbooks/pdfs/sg247722.pdf";
		
						 
	 // First get the regex for Redbook
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 var isRDBK = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return url.match(regexp);
		 });
		
		 assert.ok(isRDBK, "Given url should be valid " +  type +" matches. However, the following line did not match [" + url + "]");
	
	
    done();	
		
	});
	
	/** Test matches for wiki.**/
	test('testValidWikiContent', function(done) {
	  var type = "WIKI";
	 var url = "http://www-10.lotus.com/ldd/lcwiki.nsf/dx/Customizing_IBM_Connections_4.0_Profiles";
		
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 var isWiki = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return url.match(regexp);
	 });
		
	assert.ok(isWiki, "Given url should be valid " +  type +" matches. However, the following line did not match [" + url + "]");
	
	
    done();	
		
	});
	
	/** Test matches for RFE.**/
	test('testValidRFEContent', function(done) {
	  var type = "RFE";
	  var content = "RATLC12345678";
		
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 var isRFE = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return content.match(regexp);
	});
		
	assert.ok(isRFE, "Given content should be valid " +  type +" matches. However, the following line did not match [" + content + "]");
	
    done();	
		
	});
	
	/** Test matches for ESC.**/
	test('testValidESCContent', function(done) {
	  var type = "ESC";
	  var content = "ROCR11858";		
	 
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 var isESC = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return content.match(regexp);
	 });
		
	 assert.ok(isESC, "Given content should be valid " +  type +" matches. However, the following line did not match [" + content + "]");
	
     done();	
		
	});
	
	
	
		
	/** Test matches for ESC for Rational jazz.**/
	/** Test matches for ESC for Rational jazz that should not be changed.**/
	test('testValidESCNormalizeContentDontChange', function(done) {
	  var type = "ESC";
	  var content = "https://ccm-q1labs.canlab.ibm.com:9449/ccm/web/projects/Security%20Intelligence#action=com.ibm.team.workitem.viewWorkItem&id=96205";
	  var expectedUrl = "https://ccm-q1labs.canlab.ibm.com:9449/ccm/web/projects/Security%20Intelligence#action=com.ibm.team.workitem.viewWorkItem&id=96205";
		
		 // First get the regex for esc
		 var typeEntry = getMapping(patternMapping, type);
		 
		 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
		  
		 var matches = [];
			
			
		var baseURL = "";
		for(var i = 0; i < typeEntry.patterns.length; i++) {
			var regexp  = new RegExp(typeEntry.patterns[i].pattern);
			
			 if(matches=content.match(regexp)) {
				// dont check for baseURL this is not going to be supported going forward..if a match is found call it success.
				 //baseURL = typeEntry.patterns[i].baseURL; 
				
				 break;
			 }
		}
		
		if(matches != null && matches.length > 0) {
			// just check if match is found
			//assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
			assert.ok("Match found for content" + content);
		} else {
			assert.fail(true,true,"Expected match not found for input content:" + content);
			
		}
			 
	    done();	
	});
	
	/** Test matches for ESC for Rational jazz.**/
	test('testValidESCRationalJazzContent', function(done) {
	  var type = "ESC";
	  var content = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
	
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	 
	 var isESC = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return content.match(regexp);
		 });
		
	assert.ok(isESC, "Given content should be valid " +  type +" matches. However, the following line did not match [" + content + "]");
	
    done();	
		
	});
	
	
	/** Test matches for ESC for Rational jazz.**/
	test('testValidESCNormalizeContent', function(done) {
	  var type = "ESC";
	  var content = "ROCR12345";
	  var expectedUrl = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
		
		 // First get the regex for esc
		 var typeEntry = getMapping(patternMapping, type);
		 
		 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
		  
		 var matches = [];
			
			
		var baseURL = "";
		for(var i = 0; i < typeEntry.patterns.length; i++) {
			var regexp  = new RegExp(typeEntry.patterns[i].pattern);
			
			 if(matches=content.match(regexp)) {
				 baseURL = typeEntry.patterns[i].baseURL;
				 break;
			 }
		}
		
		if(matches != null && matches.length > 0) {
			assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
		} else {
			assert.fail(true,true,"Expected match not found for input content:" + content);
			
		}
			 
	    done();	
	});
	
	/** Test matches for ESC for Rational jazz. Going forward we wont allow users to enter just the id. they must provide full URL**/
	test('testInvalidESCIdNormalizeContent', function(done) {
	  var type = "ESC";
	  var content = "id=12345";
	  var expectedUrl = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
		
		 // First get the regex for dcf
		 var typeEntry = getMapping(patternMapping, type);
		 
		 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
		  
		 var matches = [];
			
			
		var baseURL = "";
		for(var i = 0; i < typeEntry.patterns.length; i++) {
			var regexp  = new RegExp(typeEntry.patterns[i].pattern);
			
			 if(matches=content.match(regexp)) {
				 baseURL = typeEntry.patterns[i].baseURL;
				 break;
			 }
		}
		
		if(matches != null && matches.length > 0) {
			assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
		} else {
			//assert.fail(true,true,"Expected match not found for input content:" + content);
			assert.ok("Ids are not allowed. should only support full urls containing ccm/web");
			
		}
			 
	    done();	
	});
	
	/** Test matches for ESC for Rational jazz.**/
	test('testValidESCIdNumberNormalizeContent', function(done) {
	  var type = "ESC";
	  var content = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
	  var expectedUrl = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
		 // First get the regex for ESC
		 var typeEntry = getMapping(patternMapping, type);
		 
		 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
		  
		 var matches = [];
			
			
		var baseURL = "";
		for(var i = 0; i < typeEntry.patterns.length; i++) {
			var regexp  = new RegExp(typeEntry.patterns[i].pattern);
			
			 if(matches=content.match(regexp)) {
				 baseURL = typeEntry.patterns[i].baseURL;
				 break;
			 }
		}
		
		if(matches != null && matches.length > 0) {
			assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
		} else {
			assert.fail("Expected match not found for input content:" + content);
			
		}
			 
	    done();	
	});
	
	/** Test matches for ESC for Rational jazz.**/
	test('testValidESCNormalizeJazzContent', function(done) {
	  var type = "ESC";
	  var content = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
	  var expectedUrl = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
		
	
		 // First get the regex for dcf
		 var typeEntry = getMapping(patternMapping, type);
		 
		 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
		  
		 var matches = [];
			
			
		var baseURL = "";
		for(var i = 0; i < typeEntry.patterns.length; i++) {
			var regexp  = new RegExp(typeEntry.patterns[i].pattern);
			
			 if(matches=content.match(regexp)) {
				 baseURL = typeEntry.patterns[i].baseURL;
				 break;
			 }
		}
		
		if(matches != null && matches.length > 0) {
			assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
		} else {
			assert.fail(true,true,"Expected match not found for input content:" + content);
			
		}
			 
	    done();	
		
	});
	
	/** Test matches for ESC for Rational jazz.**/
	test('testIBMURL', function(done) {
	  var type = "IBM";
	  var content = "https://exchange.xforce.ibmcloud.com/vulnerabilities/103294";
	 	
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	  
	 var isIBM = typeEntry.patterns.some(function(element, index, array) {
		 var regexp  = new RegExp(element.pattern);
		 return content.match(regexp);
	 });
	
	 assert.ok(isIBM, "Given content should be valid " +  type +" matches. However, the following line did not match [" + content + "]");

    done();	
	});
	
	/** Test matches for ESC for Rational jazz.**/
	test('testValidESCNormalizeJazzContent', function(done) {
	  var type = "ESC";
	  var content = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
	  var expectedUrl = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
		
	
		 // First get the regex for ESC
		 var typeEntry = getMapping(patternMapping, type);
		 
		 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
		  
		 var matches = [];
			
			
		var baseURL = "";
		for(var i = 0; i < typeEntry.patterns.length; i++) {
			var regexp  = new RegExp(typeEntry.patterns[i].pattern);
			
			 if(matches=content.match(regexp)) {
				 baseURL = typeEntry.patterns[i].baseURL;
				 break;
			 }
		}
		
		if(matches != null && matches.length > 0) {
			assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
		} else {
			assert.fail(true,true,"Expected match not found for input content:" + content);
			
		}
			 
	    done();	
	});
	
	/** Test matches for IBM URLS.**/
	test('testIBMURL', function(done) {
	  var type = "IBM";
	  var content = "https://exchange.xforce.ibmcloud.com/vulnerabilities/103294";
	 	
		
		 // First get the regex for IBM
		 var typeEntry = getMapping(patternMapping, type);
		 
		 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
		  
		 var isIBM = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return content.match(regexp);
		 });
		
		 assert.ok(isIBM, "Given content should be valid " +  type +" matches. However, the following line did not match [" + content + "]");
	
			 
	    done();	
		
	});
	
	/** Test matches for ESC for Rational jazz.**/
	test('testValidESCNormalizeJazzContent', function(done) {
	  var type = "ESC";
	  var content = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
	  var expectedUrl = "https://l2l3-cmn-rtc.ratl.swg.usma.ibm.com:9443/ccm/web/projects/Rational%20Escalation#action=com.ibm.team.workitem.viewWorkItem&id=12345";
		
	 // First get the regex for dcf
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	  
	 var matches = [];
		
		
	var baseURL = "";
	for(var i = 0; i < typeEntry.patterns.length; i++) {
		var regexp  = new RegExp(typeEntry.patterns[i].pattern);
		
		 if(matches=content.match(regexp)) {
			 baseURL = typeEntry.patterns[i].baseURL;
			 break;
		 }
	}
	
	if(matches != null && matches.length > 0) {
		assert.equal(expectedUrl, baseURL + matches[1], "Expected id not extracted correctly. Expected [" + expectedUrl + "]" + " but instead saw [" + matches[1] + " ]");
	} else {
		assert.fail(true,true,"Expected match not found for input content:" + content);
		
	}
		 
    done();			
	});
	
	/** Test matches Videos.**/
	test('testVIDURL', function(done) {
	  var type = "VID";
	  var content = "https://www.youtube.com/watch?v=bpOrfUgaI2I";
	 	
	 // First get the regex for VID
	 var typeEntry = getMapping(patternMapping, type);
	 
	 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
	  
	 var isVID= typeEntry.patterns.some(function(element, index, array) {
		 var regexp  = new RegExp(element.pattern);
		 return content.match(regexp);
	 });
	
	 assert.ok(isVID, "Given content should be valid " +  type +" matches. However, the following line did not match [" + content + "]");

		 
    done();	
	});
	
	/** Test all valid ftp content**/

	  test('testValidIBMContent', function(done) {
	    var type = "IBM";
	    // Load test data file containing  IBM content ids with different formats.
	    var lines = getFileLines("valid_ibm_content.txt");
	
	
		 // First get the regex for IBM
		 var aparEntry = getMapping(patternMapping, type);
		 
		 assert.ok(aparEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
		 
		 for (var i=0; i<lines.length; i++) {
			 var contentId=lines[i];
			 
			 if(contentId.trim().length === 0) {
				 continue;
			 }
			 var isIBM = aparEntry.patterns.some(function(element, index, array) {
				 var regexp  = new RegExp(element.pattern);
				 return contentId.match(regexp);
			 });
			
			 assert.ok(isIBM, "All lines should be valid " +  type +" matches. However, the following line did not match [" + contentId + "]");
		}
		
	    done();			
	  });
	  
	  
	   /** Test valid ibm content with ftp protocol**/
	  test('testValidIBMContentFtp', function(done) {
	    var type = "IBM";
	    var content = "ftp://ftp.software.ibm.com/software/iea/content/com.ibm.iea.wcs/wcs/6.0/Administration/wcs60_PaymentsTechnicalOverview.pdf";
	   
	
	    // First get the regex for IBM
		 var typeEntry = getMapping(patternMapping, type);
		 
		 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
		  
		 var isIBM = typeEntry.patterns.some(function(element, index, array) {
			 var regexp  = new RegExp(element.pattern);
			 return content.match(regexp);
		 });
		
		 assert.ok(isIBM, "Given content should be valid " +  type +" matches. However, the following line did not match [" + content + "]");
	
			 
	    done();	
	    
	  });
	  
		/** Test matches NIBM content which means that there was no other match.**/
		test('testNIBMURL', function(done) {
		  var type = "NIBM";
		  var content = "http://support.microsoft.com/kb/123456";
		 	
		  var isNIBM = false; 
		  var lastEntryType = null;
		  patternMapping.items.forEach(function(entry){
			
		 	lastEntryType = entry.type;
			 isNIBM= entry.patterns.some(function(element, index, array) {
			  	 var regexp  = new RegExp(element.pattern);
				 return content.match(regexp);
			  });
			
			 if(isNIBM === true) {
				return;
			 }
		  });
		  assert.ok(!isNIBM, "Given content should not be matched by any type. However, the following type [" + lastEntryType + "] did  match [" + content + "]");
		 
	      done();	
		});
		
		/** Test matches NIBM content which means that there was no other match. Should also allow ftp protocol.**/
		test('testNIBMURLFtp', function(done) {
		  var type = "NIBM";
		  var content = "ftp://abc.def.com/document";
		 	
		  
		  var isNIBM = false; 
		  var lastEntryType = null;
		  patternMapping.items.forEach(function(entry){
			
		 	lastEntryType = entry.type;
			 isNIBM= entry.patterns.some(function(element, index, array) {
			  	 var regexp  = new RegExp(element.pattern);
				 return content.match(regexp);
			  });
			 
			 if(isNIBM === true) {
				return;
			 }
		  });
		  assert.ok(!isNIBM, "Given content should not be matched by any type. However, the following type [" + lastEntryType + "] did  match [" + content + "]");
		 
	      done();	
		});
			
		
		/** Loads test data containing all valid jazz content ids but in different formats. Tests that all are matches.**/
		  test('testValidJZNTContent', function(done) {
		    var type = "JZNT";

		    var lines = getFileLines("valid_jazznet_content.txt");
				
			// Start tests     
			 var typeEntry = getMapping(patternMapping, type);
			 
			 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
			 var lastEntryType = null;
			 patternMapping.items.forEach(function(entry){
					
				 	lastEntryType = entry.type;
				 	
				 	 
					 for (var i=0; i<lines.length; i++) {
						 var contentId=lines[i];
						
						 if(contentId.trim().length === 0) {
							 continue;
						 }
						 var isMatched = entry.patterns.some(function(element, index, array) {
							 var regexp  = new RegExp(element.pattern);
							 return contentId.match(regexp);
						 });
						
						 // jazznet must match all the urls. otherwise error
						 if(type === entry.type) {
							 assert.ok(isMatched);			
						 }
						 		
						
					}
				 	
					
				  });
				
			
		    done();	
			
		  });
		  
		  
			/** Loads test data containing all valid sid content ids but in different formats. Tests that all are matches.**/
		  test('testValidSIDContent', function(done) {
		    var type = "SID";

		    var lines = getFileLines("valid_sid_content.txt");
				
			// Start tests     
			 var typeEntry = getMapping(patternMapping, type);
			 
			 assert.ok(typeEntry.patterns.length > 0, "No " + type + " entry found containing regexs for " + type + " content");
			 var lastEntryType = null;
			 var matchFound = false;
			 patternMapping.items.forEach(function(entry){
					
				 	lastEntryType = entry.type;
				 	
				 	 
					 for (var i=0; i<lines.length; i++) {
						 var contentId=lines[i];
						
						 if(contentId.trim().length === 0) {
							 continue;
						 }
						 var isMatched = entry.patterns.some(function(element, index, array) {
							 var regexp  = new RegExp(element.pattern);
							 return contentId.match(regexp);
						 });
						
						 // sid must match all the urls. otherwise error
						 if(type === entry.type) {
							 matchFound = true;
							 assert.ok(isMatched);			
						 }
						 		
						
					}
				 	
					
				  });
				
			 assert.ok(matchFound);	
		    done();	
			
		  });
});
