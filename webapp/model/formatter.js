sap.ui.define([], function () {
	"use strict";
	return {

		formatterColor: function (Estado) {
			var state;
			switch (Estado) {
			case "Creado":
				state = "Success";				
				break;
			case "No Creado":
				state = "Error";				
				break;
			default:
				break;
			}
			return state;
		},
		formatterColorTk: function(Estado){
			var state;
			switch (Estado) {
			case "Ticket Confirmado":
				state = "Success";				
				break;
			case "Ticket NO confirmado":
				state = "Error";				
				break;
			default:
				break;
			}
			return state;




		}		

	};
});