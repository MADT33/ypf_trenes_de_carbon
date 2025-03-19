sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "ypf/tkcargatrenescarbon/utils/jszip",
    "ypf/tkcargatrenescarbon/utils/xlsx",
    "ypf/tkcargatrenescarbon/services/Services",
    "ypf/tkcargatrenescarbon/model/AppJsonModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "../model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, jszip, xlsx, Services, AppJsonModel, MessageBox, MessageToast, formatter) {
        "use strict";
        var dialog;
        return Controller.extend("ypf.tkcargatrenescarbon.controller.View", {
            formatter: formatter,
            onInit: function () {

                AppJsonModel.initializeModel()
                var oView = this.getView();

                dialog = new sap.m.BusyDialog({
                    text: "Enviando Exel..."
                });

            },
            fnReplaceAjusteBS: function (oTable) {
                for (var i in oTable) {
                    var columns = {};
                    columns['NumExtFich'] = oTable[i]['NumExtFich'];
                    columns['NumDocPlanif'] = oTable[i]['Nº doc.planif'];
                    columns['PosClvDocPl'] = oTable[i]['PosClvDocPl'];
                    columns['CantidadNeta'] = oTable[i]['Cantidad Neta'];
                    columns['FechaFinal'] = oTable[i]['Fecha Final'];
                    columns['PatenteVagon'] = oTable[i]['Patente del Vagon'];
                    oTable[i] = columns;
                }
                return oTable;
            },
            onEnviar: function (excelArray) {
                var oView = this.getView();
                var that = this;
                var oTable = this.getView().byId("idTable");

                Services.postData({
                    Key: "",
                    ToUploadExel: excelArray

                }).then(oData => {
                    console.log(oData);
                    dialog.close();
                    var oModel = oData.ToUploadExel.results;
                    
                     oModel.forEach((function (elem, i, array) {
                           elem.Ticket = elem.Ticket.substr(13, 7);
                         return oModel  
                    }))                    
                    var Log = AppJsonModel.getProperty("/Log");
                    Log = Log.concat(oModel);
                    AppJsonModel.setProperty("/Log", Log);

                    if (oModel) {
                        that.oView.byId("BTN2").setEnabled(true);
                        that.oView.byId("fileUploader").setEnabled(false);
                    }
                }).catch(oErr => {
                    console.log(oErr)
                })

            },

            fileReader: function (oFile) {
                var that = this;
                var excelajusteBS = {};

                var reader = new FileReader();
                reader.onload = function (oEvent) {
                    var data = oEvent.target.result;

                    var workbook = XLSX.read(data, {
                        type: 'binary'
                    });

                    workbook.SheetNames.forEach(function (sheetName) {
                        switch (sheetName) {
                            case workbook.SheetNames[0]:
                                excelajusteBS = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                                break;
                            default:
                            // code block
                        }
                    });

                    if (excelajusteBS) {
                        var excelArray = that.fnReplaceAjusteBS(excelajusteBS);

                        MessageBox.information("El archivo se cargo correntamente, desea enviarlo?", {
                            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                            emphasizedAction: MessageBox.Action.OK,
                            onClose: function (sAction) {
                                if (sAction == "OK") {
                                    dialog.open();
                                    that.onEnviar(excelArray);
                                }
                            }
                        });

                    }
                    reader.onerror = function (ex) {
                        console.log(ex);
                    };
                };

                reader.readAsBinaryString(oFile);
            },
            onConfirmar: function (evt) {
                var that = this;
                var oTreeTable = this.byId("TreeTableBasic");
                var aSelectedIndices = oTreeTable.getSelectedIndices();
                var oModel = oTreeTable.getBinding().getModel();
                var array = [];
               
                if (aSelectedIndices.length === 0) {
                    MessageToast.show("Para confirmar necesita seleccionar al menos un vagon");
                    return;
                }
                for (var i = 0; i < aSelectedIndices.length; i++) {
                    var objet = {};

                    var oNewParentContext = oTreeTable.getContextByIndex(aSelectedIndices[i]);
                    objet = oNewParentContext.getProperty();
                    array.push(objet);
                }
                sap.m.MessageBox.warning("Desea confirmar estos Tickets?", {
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    emphasizedAction: sap.m.MessageBox.Action.OK,
                    onClose: function (sAction) {

                        if (sAction == "OK") {

                            that.onConfirmarTK(array);
                            AppJsonModel.initializeModel();
                        } else {
                            that.getView().setBusy(false);
                        }
                    }
                });

            },
            onConfirmarTK: function (array) {
                var oView = this.getView();
                var that = this;      
                
                array.forEach((function (elem, i, array) {
                    elem.Ticket = "0000000000000" + elem.Ticket;
                  return array 
             }))             
               
                Services.postData({
                    Key: "X",
                    ToUploadExel: array

                }).then(oData => {
                    dialog.close();
                    var oModel = oData.ToUploadExel.results;
                    var array = [];

                    oModel.forEach((item, i) => {
                        var messageObjet = {};
                        messageObjet.Ticket   = item.Ticket                      
                        messageObjet.Status  = item.Status                       
                        messageObjet.NumExtFich  = item.NumExtFich
                        messageObjet.PatenteVagon  = item.PatenteVagon                      

                        array.push(messageObjet)

                    })

                  
                    var jsonModel = new sap.ui.model.json.JSONModel(array);
                    that.getView().setModel(jsonModel, "LogModel");


                    this.fragmentoCrear = sap.ui.xmlfragment("ypf.tkcargatrenescarbon.Fragments.mensajes", this);
                    this.getView().addDependent(this.fragmentoCrear);
                    this.fragmentoCrear.open();



                }).catch(oErr => {
                    console.log(oErr)
                })
          

            },
            onCloseDialog : function(oEvent){
                var oView = this.getView();
                this.fragmentoCrear.close();
                this.fragmentoCrear.destroy();
                this.oView.byId("BTN2").setEnabled(false);
                this.oView.byId("fileUploader").setEnabled(true);


            },
            onUploadFile: function (oEvent) {
                this.fileReader(oEvent.getParameter("files") && oEvent.getParameter("files")[0]);
            }
        });
    });
