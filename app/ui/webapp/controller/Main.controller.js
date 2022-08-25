// @ts-nocheck
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",	    
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller,JSONModel,MessageToast,MessageBox,formatter) {
        "use strict";

        return Controller.extend("defcomp.vesting.ui.controller.Main", {
            formatter:formatter,
            _getRegisterdAppModule: function () {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                return appModulePath;
            },
            _getEmpRole: function(){
                var that = this;
                $.ajax({
                    url: "/defcompvestingui/SFSALES008130_SRV/RoleEntity",
                    method: "GET",
                    contentType: "application/json",
                    headers: { "Accept": "application/json" },
                    async: false, 
                    error: function (error, jQXHR) {
                        console.log(error);
                      },                    
                    success: function (odata, jQXHR, status) {
                        console.log(odata);
                        console.log(that);
                        var oModel = new JSONModel({"EmpRoles":odata.d.results});
                        that.getView().setModel(oModel, "sfEmpRole");
                    }                   
                })
            },
            _getPayGrade: function(){
                var that = this;
                $.ajax({
                    url: "/defcompvestingui/SFSALES008130_SRV/FOPayGrade",
                    method: "GET",
                    contentType: "application/json",
                    headers: { "Accept": "application/json" },
                    async: false, 
                    error: function (error, jQXHR) {
                        console.log(error);
                      },                    
                    success: function (odata, jQXHR, status) {
                        console.log(odata);
                        console.log(that);
                        var oPayGrade={}, aPayGrade=[];
                        for(let i=0; i<odata.d.results.length; i++){
                            oPayGrade.externalCode = odata.d.results[i].externalCode;
                            oPayGrade.name_localized = odata.d.results[i].name;
                            aPayGrade.push({...oPayGrade});                            
                        }
                        var oModel = new JSONModel({"EmpRoles":aPayGrade});
                        that.getView().setModel(oModel, "sfEmpRole");
                    }                   
                })
            },            
            onInit: function () {
                this.appModulePath = this._getRegisterdAppModule();
                // this._getEmpRole();
                this._getPayGrade();
                this.oDialog = this.getView().byId("idCreateMainDialog");
                this.sAction = "";    
            },
            fnSuccess:function(oData, oResponse){
                this.oDialog.close();
                MessageToast.show("Action-"+this.sAction+" was successful.");
            },
    
            fnError: function(oError){
                console.log(oError);
                MessageToast.show("Action-"+this.sAction+" was unsuccessful.");                
            },            
            onCreateEntry:function(){           
                this.sAction = "CREATE";
                this.getView().byId("idSelectRoleCode").setSelectedKey("").setEditable(true);
                this.getView().byId("idSelectRating").setSelectedKey("").setEditable(true);
                this.getView().byId("idInputPayPercent").setValue("").setEditable(true);
                this.getView().byId("idActionConfirm").setText("Create").setIcon("sap-icon://create");            
                this.oDialog.open();
            },
        onUpdateEntry:function(){
            this.sAction = "UPDATE";
            var oSelectedItem = this.getView().byId("idVLTable").getSelectedItem();
            if(!oSelectedItem){
                return;
            }
            var oContext = oSelectedItem.getBindingContext();
            // this.getView().byId("idInputID").setValue(oContext.getProperty("")).setEditable(false);
			
			this.getView().byId("idSelectRoleCode").setSelectedKey(oContext.getProperty("rolecode")).setEditable(false);
            this.getView().byId("idSelectRating").setSelectedKey(oContext.getProperty("perfrating")).setEditable(false);
            this.getView().byId("idInputPayPercent").setValue(oContext.getProperty("paypercent")).setEditable(true);
            this.getView().byId("idActionConfirm").setText("Update").setIcon("sap-icon://edit");
            this.getView().byId("idInputGUID").setValue(oContext.getProperty("ID"));
            this.oDialog.open();
        },
        onDeleteEntry:function(){
            this.sAction = "DELETE";
            var oSelectedItem = this.getView().byId("idVLTable").getSelectedItem();
            if(!oSelectedItem){
                return;
            }       
            var oContext = oSelectedItem.getBindingContext();
            this.getView().byId("idInputGUID").setValue(oContext.getProperty("ID"));
            MessageBox.confirm("Are you sure, You want to delete?",{
                onClose: this.onPopUpConfirm.bind(this)
            });
        },
        
        fnCreateEntry:function(){
            var oModel = this.getView().getModel(), oData={};
            oData.rolecode  	= this.getView().byId("idSelectRoleCode").getSelectedItem().getKey();
            oData.rolename      = this.getView().byId("idSelectRoleCode").getSelectedItem().getText();
            oData.perfrating    = this.getView().byId("idSelectRating").getSelectedItem().getKey();
			oData.paypercent	= this.getView().byId("idInputPayPercent").getValue();
            oModel.create("/VestingDetails",oData, 
            {
                success: this.fnSuccess.bind(this),
                error: this.fnError.bind(this)
            });      
        },

        fnUpdateEntry:function(){
            var oModel = this.getView().getModel(), oData={};
            oData.ID            = this.getView().byId("idInputGUID").getValue();
            oData.rolecode  	= this.getView().byId("idSelectRoleCode").getSelectedItem().getKey();
            oData.rolename      = this.getView().byId("idSelectRoleCode").getSelectedItem().getText();
            oData.perfrating    = this.getView().byId("idSelectRating").getSelectedItem().getKey();
			oData.paypercent	= this.getView().byId("idInputPayPercent").getValue();
            var sPath = "/VestingDetails(ID=guid'"+oData.ID+"')";
            oModel.update(sPath, oData,{
                success: this.fnSuccess.bind(this),
                error: this.fnError.bind(this)
            })            
        },

        fnDeleteEntry:function(){
            var oModel = this.getView().getModel(), sCode = this.getView().byId("idInputGUID").getValue();
            var sPath = "/VestingDetails(ID=guid'"+sCode+"')";
            oModel.remove(sPath,{
                success: this.fnSuccess.bind(this),
                error: this.fnError.bind(this) 
            })
        },
        
        onPopUpConfirm:function(oAction){
            switch (this.sAction) {
                case "CREATE":
                    this.fnCreateEntry();
                    break;
                case "UPDATE":
                    this.fnUpdateEntry();
                    break;
                case "DELETE":
                    if(oAction == "OK"){
                        this.fnDeleteEntry();
                    }                    
                    break;
                default:
                    break;
            }
        },
        
        onPopUpCancel:function(event){
            this.oDialog.close();
        }        

        });

    });
