/* ***************************************************************** */
/*                                                                   */
/* Licensed Materials - Property of IBM                              */
/*                                                                   */
/* (C) Copyright IBM Corp. 2001, 2014. All Rights Reserved.          */
/*                                                                   */
/* US Government Users Restricted Rights - Use, duplication or       */
/* disclosure restricted by GSA ADP Schedule Contract with IBM Corp. */
/*                                                                   */
/* ***************************************************************** */

define(["dojo/_base/declare",
        "scripts/utils/StringUtil"], 
    function (declare, StringUtil) {
    /**
     * 
     */
    return  {
       /**
        * Helper method to check that a given object exists, is not null and not undefined
        * 
        *  @param {Object} the object to check if not null and not undefined
        *  @return {Boolean} true if the object exists, is not null and not undefined, false otherwise. 
        */
    	isNotNullOrUndefined: function(object){
    		if((typeof object) != undefined){
    			if(null != object && object != undefined){
    				return true;
    			}
    		}
    		return false;
    	},
    	
    	/**
         * Helper method to check that a given object is null, undefined or doesn't exists
         * 
         *  @param {Object} the object to check if not null and not undefined
         *  @return {Boolean} true if the object doesn't exist, is null or not undefined, false otherwise. 
         */
     	isNullOrUndefined: function(object){
     		return !this.isNotNullOrUndefined(object);
     	},
     	
        /**
         * Helper method to check that a given object is either the boolean value true, or the string value "true"
         * 
         *  @param {Object} the object to check if true
         *  @return {Boolean} true if the object is boolean true or is the string "true", false otherwise. 
         */
     	isTrue:function(object){
     		if(this.isNotNullOrUndefined(object) && (object === true || StringUtil.areEqualIgnoreCaseTrimmed(object,"true"))){
     			return true;
     		}
     		return false;
     	},
     	
     	/**
         * Helper method to check that a given object is either the boolean value false, or the string value "false"
         * 
         *  @param {Object} the object to check if false
         *  @return {Boolean} true if the object is boolean false or is the string "false", false otherwise. 
         */
     	isFalse:function(object){
     		if(object != null && object != undefined && (object === false || StringUtil.areEqualIgnoreCaseTrimmed(object,"false"))){
     			return true;
     		}
     		return false;
     	},
		
		JSONToCSVConvertor:function (JSONData, showLabel) {
			//If JSONData is not an object then JSON.parse will parse the JSON string in an Object
			var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
			var CSV = '';    
			//This condition will generate the Label/Header
			if (showLabel) {
				var row = "";
			
				//This loop will extract the label from 1st index of on array
				for (var index in arrData[0]) {
					//Now convert each value to string and comma-seprated
					row += index + ',';
				}
				row = row.slice(0, -1);
				//append Label row with line break
				CSV += row + '\r\n';
			}
			
			//1st loop is to extract each row
			for (var i = 0; i < arrData.length; i++) {
				var row = "";
				//2nd loop will extract each column and convert it in string comma-seprated
				for (var index in arrData[i]) {
					row += '"' + arrData[i][index] + '",';
				}
				row.slice(0, row.length - 1);
				//add a line break after each row
				CSV += row + '\r\n';
			}
			
			return CSV;
		},
		
		tryParseJSON:function (jsonString) {
			try {
				var o = JSON.parse(jsonString);
				console.log("tryParseJSON()", o);
		
				// Handle non-exception-throwing cases:
				// Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
				// but... JSON.parse(null) returns 'null', and typeof null === "object", 
				// so we must check for that, too.
				if (o && typeof o == "object") {
					return o;
				}
			}
			catch (e) { }
		
			return false;
		}
    };    
});