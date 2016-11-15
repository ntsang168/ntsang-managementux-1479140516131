/*****************************************************************************
 * 
 *  Test Harness for get-config.js
 * 
 ****************************************************************************/

console.log("INFO: get-config/test.js is starting.");

var doc_name = "get-config-test-doc";

/*****************************************************************************
 * 
 *  Functions 
 * 
 ****************************************************************************/

function evaluate_response(doc) {
    
    if (doc) {
	if (doc.happiness) {
	    console.log("Test passed.");
	} else {
	    console.log("Test failed - bad data");
	}
    } else {
	console.log("Test failed - no data");
    }
    
}


/*****************************************************************************
 * 
 *  M A I N
 * 
 ****************************************************************************/

var config = require("./get-config.js")(doc_name, function(doc){
    
    evaluate_response(doc);
    
});
