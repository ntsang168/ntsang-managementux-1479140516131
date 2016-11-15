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
        "dojo/string"], 
    function (declare, string) {
    /**
     * 
     */
    return  {
       /**
        * Helper method to check is a given string is null, undefined, has a zero length or only contains spaces.
        * 
        *  @param {String} the string to check if empty
        *  @return {Boolean} true if the string is null, undefined, has a zero length or only contains spaces, false otherwise. 
        */
    	isEmptyTrimmed: function(str){
    		if(str && null != str && str != undefined && string.trim(str).length>0){
    			return false;
    		}
    		return true;
    	},
    
	    /**
	     * Helper method to check is a given string is null, undefined or has a zero length. In this function, leading and trailing spaces
	     * count towards the strings length. 
	     * 
	     *  @param {String} the string to check if empty
	     *  @return {Boolean} true if the string is null, undefined or a zero length, false otherwise. 
	     */
	 	isEmptyAllowSpaces: function(str){
	 		if(str && null != str && str != undefined && str.length>0){
	 			return false;
	 		}
	 		return true;
	 	},
    	
    	/**
         * Helper method to check is a given string is not null, not undefined and has a length greater than 0 when leading and trailing spaces are removed
         * 
         *  @param {String} the string to check if not empty
         *  @return {Boolean} true if the string is not null, not undefined and has a length greater than zero, false otherwise. 
         */
     	isNonEmptyTrimmed: function(str){
     		if(str && null != str && str != undefined && string.trim(str).length>0){
     			return true;
     		}
     		return false;
     	},
     
     	/**
         * Helper method to check is a given string is not null, not undefined and has a length greater than 0 without leading and trailing spaces removed
         * 
         *  @param {String} the string to check if not empty
         *  @return {Boolean} true if the string is not null, not undefined and has a length greater than zero, false otherwise. 
         */
 	 	isNonEmptyAllowSpaces: function(str){
 	 		if(str && null != str && str != undefined && str.length>0){
 	 			return true;
 	 		}
 	 		return false;
 	 	},
    	
        /**
         * Helper function that takes in a string and makes the first character UpperCase and the rest LowerCase
         * 
         *  @param {String} The string to make proper case
         *  @return {String} The original string with the first character UpperCase and the rest LowerCase or null if no string was given
         */
        makeProperCase: function(str){
            if(!str){
                return null;
            }
            return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        },
        
        /**
		 * Make dojo string.trim function available through this Util class
		 * 
		 * @param {String} the string to trim
		 * @return {String} the trimmed string or null if it the argument was not a valid string. If the string contains only spaces, an empty string will be returned. 
		 */
		trim:function(/**String*/ str){
			if(this.isNonEmptyAllowSpaces(str)){
				return string.trim(str);
			}
			return null;
		},
		
		/**
		 * Check if two given strings, when trimmed are equal regardless of case
		 * 
		 * @param {String} the first string to compare
		 * @param {String} the second string to compare
		 * @return {Boolean} true if the two strings are equal, false otherwise 
		 */
		areEqualIgnoreCaseTrimmed:function(/**String*/ strA, /**String*/ strB){
			if(this.isNonEmptyAllowSpaces(strA) && this.isNonEmptyAllowSpaces(strB)){
				return this.trim(strA.toLowerCase()) === this.trim(strB.toLowerCase())
			}
			return false;
		},
		
		/**
		 * Check if two given strings, when trimmed are equal regardless of case
		 * 
		 * @param {String} the first string to compare
		 * @param {String} the second string to compare
		 * @return {Boolean} true if the two strings are equal, false otherwise 
		 */
		areEqualTrimmed:function(/**String*/ strA, /**String*/ strB){
			if(this.isNonEmptyAllowSpaces(strA) && this.isNonEmptyAllowSpaces(strB)){
				return this.trim(strA) === this.trim(strB)
			}
			return false;
		},
		
		/**
		 * Check if to see if a given string is a substring of another string
		 * 
		 * @param {String} the first string to compare
		 * @param {String} the string to look for inside the first string
		 * @return {Boolean} true if the first string contains the second, false otherwise 
		 */
		contains:function(/**String*/ strA, /**String*/ strB){
			if(this.isNonEmptyAllowSpaces(strA) && this.isNonEmptyAllowSpaces(strB)){
				return strA.indexOf(strB) != -1;
			}
			return false;
		},
		
		/**
		 * Check if to see if a given string is a substring of another string, ignoring case
		 * 
		 * @param {String} the first string to compare
		 * @param {String} the string to look for inside the first string
		 * @return {Boolean} true if the first string contains the second, false otherwise 
		 */
		containsIgnoreCase:function(/**String*/ strA, /**String*/ strB){
			if(this.isNonEmptyAllowSpaces(strA) && this.isNonEmptyAllowSpaces(strB)){
				return strA.toLowerCase().indexOf(strB.toLowerCase()) != -1;
			}
			return false;
		}
    };    
});