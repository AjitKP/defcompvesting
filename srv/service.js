/* eslint-disable use-isnan */
const cds = require("@sap/cds");
const axios = require('axios');

module.exports = cds.service.impl(async (service) => {
    const db = await cds.connect.to("db");
    let sPayGrade   ='', aRatingPercent=[];
    let aEmpYearRating = [
        { year: "2022", rating: 3 },
        { year: "2023", rating: 5 },
      ];

    const _convertJSONDateToString = (sInput)=>{
        if(sInput==null || sInput.length<5){ return; }
        let aDateParts = sInput.split('(')[1].split(')')[0].split('+');
        let dOutput = new Date(parseInt(aDateParts[0]));
        let sDate = ('0'+dOutput.getDate()+'.').slice(-3) + ('0'+(dOutput.getMonth()+1)+'.').slice(-3) + ('0'+dOutput.getFullYear()).slice(-4);
        return sDate
    }

    const _convertStringDateToJSON = (sInput)=>{
        if(sInput.length == 10){
            var sDate = new Date(sInput.substring(3,6)+sInput.substring(0,3)+sInput.substring(6,10));
            return "/Date("+sDate.getTime()+")/";
        }else{
            return null;
        }
    }

    const _getRatingByYear = (sYear)=>{
        var iRating = 0;
        for(let i=0; i<aEmpYearRating.length; i++){
            if(parseInt(sYear)==parseInt(aEmpYearRating[i].year)){
                iRating = aEmpYearRating[i].rating;
                break;
            }
        }
        return iRating;
    };    
    const _getPayPercentByRating = (sRating)=>{
        var iPayPercent = 0;
        for(let i=0; i<aRatingPercent.length; i++){
            if(parseInt(sRating)==parseInt(aRatingPercent[i].PERFRATING)){
                iPayPercent = aRatingPercent[i].PAYPERCENT; break;
            }
        }
        return iPayPercent;
    };
    const _addYearsToDate = (sDate, iCnt)=>{
        if(sDate==null || sDate==undefined || sDate.length<10){
            return 'NA';
        }else{
            return sDate.substring(0,6)+(parseInt(sDate.slice(-4))+iCnt) 
        }
    };

    service.on('updateLTIbyEmp', async (req) => {
        // debugger;
        const sUserId = req.data.empid, sHostUrl = process.env.SF_HOST_API || 'https://apisalesdemo2.successfactors.eu';
        // sHostUrl2= process.env.VEST_HOST_API || 'https://05cb0a18trial-trial2-16i6n8xl-dev-defcompvesting-srv.cfapps.us10.hana.ondemand.com';
        let sEmpJobUrl  = `/odata/v2/EmpJob?$format=json&$filter=userId eq '${sUserId}'`;       
        let sDefCompUrl = `/odata/v2/User('${sUserId}')/externalCodeOfcust_Demo_compNav?$format=json&$expand=cust_Comp_Worksheet`               

        let bAuthorization = new Buffer.from('sfadmin@SFSALES008130'+":"+'Cairo@2021');
        let sAuthorization = "Basic "+ bAuthorization.toString('base64'); 
        let objHeaders = {};
        objHeaders["Content-Type"] = "application/json";
        objHeaders["Accept"] = "application/json";
        objHeaders["authorization"] = sAuthorization;        
        // console.log(objHeaders);
        try {
            const oSfEJobResponse = await axios({ method:'GET', baseURL:sHostUrl, url:sEmpJobUrl, headers:objHeaders});
            sPayGrade = oSfEJobResponse.data.d.results[0].payGrade;
            console.log(sPayGrade);
            
            // let sPayRatingUrl = `/v2/DCVService/Odata/VestingDetails?$filter=rolecode eq '${sPayGrade}'`;              
            aRatingPercent = await db.run(`SELECT * FROM DEFCOMP_VESTING_VESTINGDETAILS where rolecode = '${sPayGrade}'`);
            console.log(JSON.stringify(aRatingPercent));
            
            const oSfCompResponse = await axios({ method:'GET', baseURL:sHostUrl, url:sDefCompUrl, headers:objHeaders});
            let odata = oSfCompResponse.data;
            delete odata.d.results[0].externalCodeNav;
            delete odata.d.results[0].createdByNav;
            delete odata.d.results[0].wfRequestNav;
            delete odata.d.results[0].lastModifiedByNav;
            delete odata.d.results[0].mdfSystemRecordStatusNav;
            delete odata.d.results[0].lastModifiedDateTime,delete odata.d.results[0].lastModifiedBy,
            delete odata.d.results[0].mdfSystemEffectiveEndDate, delete odata.d.results[0].createdDateTime,
            delete odata.d.results[0].mdfSystemRecordStatus, delete odata.d.results[0].createdBy;
            // console.log(JSON.stringify(odata));
            
            var aCompResult = odata.d.results[0].cust_Comp_Worksheet.results, aAllocatedData=[], oAllocatedEntry={}, aYears=[], oCalcData={}, aCalculatedData=[], aAssignedYears=[];
            for(let i=0; i<aCompResult.length; i++){
                oAllocatedEntry.assignedYear    = parseInt(aCompResult[i].cust_Financial_Year);
                oAllocatedEntry.assignedAmount  = parseInt(aCompResult[i].cust_Allocated_amount)
                oAllocatedEntry.grantedDate     = _convertJSONDateToString(aCompResult[i].cust_Demo_1);
                oAllocatedEntry.name            = 'LTI Year 1';
                oAllocatedEntry.year            = parseInt(aCompResult[i].cust_Financial_Year) + 0;
                oAllocatedEntry.amount          = parseInt(aCompResult[i].cust_LT_Y1);
                aAllocatedData.push({...oAllocatedEntry});
                oAllocatedEntry.name            = 'LTI Year 2';
                oAllocatedEntry.year            = parseInt(aCompResult[i].cust_Financial_Year) + 1;
                oAllocatedEntry.amount          = parseInt(aCompResult[i].cust_LT_Y2);  
                aAllocatedData.push({...oAllocatedEntry});                          
                oAllocatedEntry.name            = 'LTI Year 3';
                oAllocatedEntry.year            = parseInt(aCompResult[i].cust_Financial_Year) + 2;
                oAllocatedEntry.amount          = parseInt(aCompResult[i].cust_LT_Y3);  
                aAllocatedData.push({...oAllocatedEntry});                                                     
            }
            // var oModel = new JSONModel({ "Allocated": aAllocatedData});
            // that.getView().setModel(oModel, "sfLTI");  
            for(let i=0; i<aAllocatedData.length; i++){
                if(aAssignedYears.includes(parseInt(aAllocatedData[i].assignedYear)) == false){
                    aAssignedYears.push(parseInt(aAllocatedData[i].assignedYear));
                }
                if(oCalcData[aAllocatedData[i].year] == undefined){
                    oCalcData[aAllocatedData[i].year] = {year: aAllocatedData[i].year, GrantedAmount:0, GADetails:[]}
                }
                oCalcData[aAllocatedData[i].year].GrantedDate   = aAllocatedData[i].grantedDate;
                oCalcData[aAllocatedData[i].year].GrantedAmount = oCalcData[aAllocatedData[i].year].GrantedAmount +  aAllocatedData[i].amount;
                oCalcData[aAllocatedData[i].year].GADetails.push({...aAllocatedData[i]});
            }    
            aYears = Object.keys(oCalcData).map(sYear=>parseInt(sYear));  
            
            for(let i=0; i<aYears.length; i++){
                // sYear = aYears[i].toString();
                if(oCalcData[(aYears[i]-1).toString()] == undefined){
                    oCalcData[aYears[i]].VestedAmount   = 0;
                    oCalcData[aYears[i]].VestedDate     = 'NA';
                    oCalcData[aYears[i]].VADetails      = {};
                    oCalcData[aYears[i]].VADetails.LYTotalGrantedAmount = 0;
                    oCalcData[aYears[i]].VADetails.Rating = 0;
                    oCalcData[aYears[i]].VADetails.VestingPercent = 0;
                    oCalcData[aYears[i]].PaymentDtae    = 'NA';
                    oCalcData[aYears[i]].PaymentAmount  = 0;
                }else{
                    oCalcData[aYears[i]].VADetails = {};
                    oCalcData[aYears[i]].VADetails.LYTotalGrantedAmount = oCalcData[(aYears[i]-1).toString()].GrantedAmount;
                    oCalcData[aYears[i]].VADetails.Rating = _getRatingByYear(aYears[i]);
                    oCalcData[aYears[i]].VADetails.VestingPercent = _getPayPercentByRating(_getRatingByYear(aYears[i]));
                    oCalcData[aYears[i]].VestedAmount = oCalcData[aYears[i]].VADetails.LYTotalGrantedAmount * oCalcData[aYears[i]].VADetails.VestingPercent/ 100;
                    oCalcData[aYears[i]].VestedDate = _addYearsToDate(oCalcData[(aYears[i]-1).toString()].GrantedDate, 1)
                    oCalcData[aYears[i]].PaymentDtae    = _addYearsToDate(oCalcData[(aYears[i]-1).toString()].VestedDate, 1);
                    oCalcData[aYears[i]].PaymentAmount  = oCalcData[(aYears[i]-1).toString()].VestedAmount;                             
                }
            } 
            aAssignedYears = aAssignedYears.sort();
            for(let i=0; i<aAssignedYears.length; i++){
                aCalculatedData.push(JSON.parse(JSON.stringify(oCalcData[aAssignedYears[i]])));
            }
            // console.log(JSON.stringify(aCalculatedData));  
            let aWorkSheet = odata.d.results[0].cust_Comp_Worksheet.results, bUpdate=false;
            for(let i=0; i<aWorkSheet.length; i++){
                if(aWorkSheet[i].cust_Demo_Field==null || parseInt(aWorkSheet[i].cust_Demo_Field)==NaN || parseInt(aWorkSheet[i].cust_Demo_Field)==0){
                    bUpdate = true;
                    console.log('Data will be updated to Successfactors');
                }
                for(let j=0; j<aCalculatedData.length; j++){
                    if(parseInt(aWorkSheet[i].cust_Financial_Year)==parseInt(aCalculatedData[j].year)){
                        aWorkSheet[i].cust_Demo_Field       = aCalculatedData[j].GrantedAmount.toString();
                        aWorkSheet[i].cust_Issue_Amount     = aCalculatedData[j].VestedAmount.toString();
                        aWorkSheet[i].cust_Balance_Amount   = aCalculatedData[j].PaymentAmount.toString();
                        aWorkSheet[i].cust_Demo_2           = _convertStringDateToJSON(aCalculatedData[j].VestedDate);
                        aWorkSheet[i].cust_issuedate        = _convertStringDateToJSON(aCalculatedData[j].PaymentDtae);
                    }
                }
                delete aWorkSheet[i].createdByNav;
                delete aWorkSheet[i].cust_parentNav;
                delete aWorkSheet[i].lastModifiedByNav;
                delete aWorkSheet[i].mdfSystemRecordStatusNav;
                delete aWorkSheet[i].lastModifiedDateTime,delete aWorkSheet[i].lastModifiedBy,
                delete aWorkSheet[i].mdfSystemEffectiveEndDate, delete aWorkSheet[i].createdDateTime,
                delete aWorkSheet[i].mdfSystemRecordStatus, delete aWorkSheet[i].createdBy;                
            }
            odata.d.results[0].cust_Comp_Worksheet = odata.d.results[0].cust_Comp_Worksheet.results;
            console.log(JSON.stringify(odata.d.results[0]));
            // debugger;
            if(bUpdate == true){
                const oUpsertResponse = await axios({ method:'POST', baseURL: sHostUrl, url:'/odata/v2/upsert', headers:objHeaders, data:odata.d.results[0]})
                console.log(JSON.stringify(oUpsertResponse.data.d));
            }else{
                console.log('Data will NOT be updated to Successfactors');
            }

            // var oClacModel = new JSONModel({ "Calculated": aCalculatedData});
            // that.getView().setModel(oClacModel, "sfLTIC");  
            return aCalculatedData;

        } catch (error) {
            console.log(error);
        }  
    })
})