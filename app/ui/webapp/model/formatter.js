sap.ui.define([], function() {
	"use strict";

	return {
        getRatingText: function(sStatus){
            var sText = "";
            switch (sStatus) {
                case 1:
                    sText="Unacceptable"
                    break;
                case 2:
                    sText="Needs Improvement"
                    break;    
                case 3:
                    sText="Meets Expectations"
                    break;       
                case 4:
                    sText="Exceeds Expectations"
                    break;      
                case 5:
                    sText="Outstanding"
                    break;                                                                                                    
                default:
                    break;
            }
            return sText;
        }
    };
});