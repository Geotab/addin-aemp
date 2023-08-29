/**
 * @returns {{initialize: Function, focus: Function, blur: Function}}
 */
geotab.addin.aEMPFormat = function () {
  'use strict';

  // the root container
  var api;
  var elAddin;
  var elAempSubmit;
  var eldateInput;
  var vehicleSelect;
  var dateValue;
  var xmlDoc
  var vin = [];
  var xmlString;
  var parser = new DOMParser();
  var s = new XMLSerializer();
  var eqpCount,
    elInd,
    elCount,
    selected,
    all;

  var selectAll = document.getElementById('selectAll');
  var allSelected = false;

  elAempSubmit = document.getElementById('aemp-submit');
  eldateInput = document.getElementById('datetime');
  selected = [];

  function filter() { //filter vehicles by search
    var input, filter, a, i, div, txtValue;
    input = document.getElementById('vehicleSearch');
    filter = input.value.toUpperCase();
    div = document.getElementById('vehicleList');
    a = div.getElementsByTagName('li');
    for (i = 0; i < a.length; i++) {
      txtValue = a[i].textContent || a[i].innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        a[i].style.display = '';
      } else {
        a[i].style.display = 'none';
      }
    }
  }

  function createDoc() { //create and download xml doc
    xmlString = s.serializeToString(xmlDoc);

    //created download link
    var fileName = 'AEMP_' + dateValue;
    var uri = URL.createObjectURL(new Blob([xmlString], { type: 'text/xml' })); //'data:text/xml;charset=utf-8' + ;
    var link = document.createElement('a');
    link.href = uri;

    link.style = 'visibility:hidden';
    link.download = fileName + '.xml';

    //append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    //re-enable submit button
    elAempSubmit.disabled = !elAempSubmit.disabled;
  }

  function xmlNode(doc, name, value, parent, ind) {
    return new Promise(function (resolve) {
      var newEle
      var newVal;
      if (value == null) {
        resolve()
      } else {
        newEle = doc.createElement(name);
        newVal = doc.createTextNode(value);
        newEle.appendChild(newVal);
        doc.getElementsByTagName(parent)[ind].appendChild(newEle);
        resolve();
      }

    })
  }

  function startXML() {
    var eqpXML = '<Fleet></Fleet>';
    xmlDoc = parser.parseFromString(eqpXML, 'text/xml');
    xmlDoc.getElementsByTagName('Fleet')[0].setAttribute('snapshotTime', dateValue);
    xmlDoc.getElementsByTagName('Fleet')[0].setAttribute('version', '2');
    xmlDoc.getElementsByTagName('Fleet')[0].setAttribute('xmlns', 'https://standards.iso.org/iso/15143/-3');
    elCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    eqpCount = 0
  }

  async function buildXML(vehicleInfo, vinResults, headerInfo) { //add data for device to XML doc
    var ind,
      pin,
      installDate,
      installInd,
      vehName,
      make,
      model,
      serialNumber,
      indList = [1, 2, 3, 14, 4, 5],
      labels = ['CumulativeActiveRegenerationHours', 'CumulativeIdleHours', 'CumulativeIdleNonOperatingHours', 'CumulativeLoadCount', 'CumulativeOperatingHours', 'CumulativePowerTakeOffHours'];

    if (headerInfo[0].length <= 1) {
      installDate = headerInfo[1][0].activeFrom;
    } else {
      installInd = headerInfo[0].length - 1;
      installDate = headerInfo[0][installInd].deviceInstallResult.request.requestDateUtc;
    }

    if ('make' in vinResults[0]) {
      make = vinResults[0].make;
      model = vinResults[0].model;
    } else {
      make = null;
      model = null;
    }

    vehName = headerInfo[1][0].name;
    serialNumber = headerInfo[1][0].serialNumber;
    if (vinResults[0].vin == '') {
      pin = null
    } else {
      pin = vinResults[0].vin;
    }

    xmlNode(xmlDoc, 'Equipment', '', 'Fleet', 0);
    xmlNode(xmlDoc, 'EquipmentHeader', '', 'Equipment', eqpCount);
    xmlNode(xmlDoc, 'UnitInstallDateTime', installDate, 'EquipmentHeader', eqpCount);
    xmlNode(xmlDoc, 'Make', make, 'EquipmentHeader', eqpCount);
    xmlNode(xmlDoc, 'Model', model, 'EquipmentHeader', eqpCount);
    xmlNode(xmlDoc, 'EquipmentID', vehName, 'EquipmentHeader', eqpCount);
    xmlNode(xmlDoc, 'SerialNumber', serialNumber, 'EquipmentHeader', eqpCount);
    xmlNode(xmlDoc, 'PIN', pin, 'EquipmentHeader', eqpCount);

    if (headerInfo[1][0].deviceType == 'CustomVehicleDevice') {
      if (vehicleInfo[0].length != 0) {
        var lFDateTime = vehicleInfo[0][0].dateTime;
        var loadFactor = vehicleInfo[0][0].data.toFixed(2);
        xmlNode(xmlDoc, 'AverageLoadFactorLast24', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('AverageLoadFactorLast24')[elCount[0]].setAttribute('datetime', lFDateTime);
        xmlNode(xmlDoc, 'Percent', loadFactor, 'AverageLoadFactorLast24', elCount[0]);
        elCount[0] = elCount[0] + 1;
      }


      if (headerInfo[2].length != 0) {
        var locDateTime = headerInfo[2][0].dateTime;
        var lat = headerInfo[2][0].latitude;
        var long = headerInfo[2][0].longitude;
        xmlNode(xmlDoc, 'Location', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('Location')[elCount[1]].setAttribute('datetime', locDateTime);
        xmlNode(xmlDoc, 'Latitude', lat, 'Location', elCount[1]);
        xmlNode(xmlDoc, 'Longitude', long, 'Location', elCount[1]);
        elCount[1] = elCount[1] + 1;
      }

      for (var id in indList) {
        ind = indList[id];
        elInd = parseInt(id) + 2;
        if (vehicleInfo[ind].length != 0) {
          var dt = vehicleInfo[ind][0].dateTime;
          xmlNode(xmlDoc, labels[id], '', 'Equipment', eqpCount);
          xmlDoc.getElementsByTagName(labels[id])[elCount[elInd]].setAttribute('datetime', dt);

          if (parseInt(id) == 3) {
            var lcInd = vehicleInfo[ind].length - 1;
            var data = vehicleInfo[ind][lcInd].data;
            xmlNode(xmlDoc, 'Count', data, labels[id], elCount[elInd]);
          } else {
            var data = vehicleInfo[ind][0].data;
            data = (data / 3600).toFixed(2);
            xmlNode(xmlDoc, 'Hour', data, labels[id], elCount[elInd]);
          }
          elCount[elInd] = elCount[elInd] + 1;
        }
      }

      if (vehicleInfo[6].length != 0) {
        var cptDateTime = vehicleInfo[6][0].dateTime;
        var CumulativePayloadTotals = vehicleInfo[6][0].data / 1000;
        xmlNode(xmlDoc, 'CumulativePayloadTotals', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('CumulativePayloadTotals')[elCount[8]].setAttribute('datetime', cptDateTime);
        xmlNode(xmlDoc, 'PayloadUnits', 'kilogram', 'CumulativePayloadTotals', elCount[8]);
        xmlNode(xmlDoc, 'Payload', CumulativePayloadTotals, 'CumulativePayloadTotals', elCount[8]);
        elCount[8] = elCount[8] + 1;
      }

      if (!(vehicleInfo[7].length == 0 || vehicleInfo[8].length == 0)) {
        var defDateTime = vehicleInfo[7][0].dateTime;
        var DEFRemaining = vehicleInfo[7][0].data.toFixed(2);
        var DEFCapacity = vehicleInfo[8][0].data.toFixed(2);
        xmlNode(xmlDoc, 'DEFRemaining', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('DEFRemaining')[elCount[9]].setAttribute('datetime', defDateTime);
        xmlNode(xmlDoc, 'Percent', DEFRemaining, 'DEFRemaining', elCount[9]);
        xmlNode(xmlDoc, 'DEFTankCapacityUnits', 'litre', 'DEFRemaining', elCount[9]);
        xmlNode(xmlDoc, 'DEFTankCapacity', DEFCapacity, 'DEFRemaining', elCount[9]);
        elCount[9] = elCount[9] + 1;
      }

      if (vehicleInfo[9].length != 0) {
        var distDateTime = vehicleInfo[9][0].dateTime;
        var odoUnit = 'kilometers';
        var odo = (vehicleInfo[9][0].data / 1000).toFixed(2);
        xmlNode(xmlDoc, 'Distance', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('Distance')[elCount[10]].setAttribute('datetime', distDateTime);
        xmlNode(xmlDoc, 'OdometerUnits', odoUnit, 'Distance', elCount[10]);
        xmlNode(xmlDoc, 'Odometer', odo, 'Distance', elCount[10]);
        elCount[10] = elCount[10] + 1;
      }

      if (!(vehicleInfo[15].length == 0 || vehicleInfo[18] == 0)) {
        var esInd = vehicleInfo[15].length - 1;
        var enInd = vehicleInfo[18].length - 1;
        var engineStatusDateTime = vehicleInfo[15][esInd].dateTime;
        var engineStatus = vehicleInfo[15][esInd].data;
        var engineNumber = vehicleInfo[18][enInd].data;
        xmlNode(xmlDoc, 'EngineStatus', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('EngineStatus')[elCount[11]].setAttribute('datetime', engineStatusDateTime);
        xmlNode(xmlDoc, 'EngineNumber', engineNumber, 'EngineStatus', elCount[11]);
        xmlNode(xmlDoc, 'Running', engineStatus, 'EngineStatus', elCount[11]);
        elCount[11] = elCount[11] + 1;
      }

      if (vehicleInfo[10].length != 0) {
        var fuelDateTime = vehicleInfo[10][0].dateTime;
        var totalFuel = vehicleInfo[10][0].data.toFixed(2);
        var fuelUnits = 'litres';
        xmlNode(xmlDoc, 'FuelUsed', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('FuelUsed')[elCount[12]].setAttribute('datetime', fuelDateTime);
        xmlNode(xmlDoc, 'FuelUnits', fuelUnits, 'FuelUsed', elCount[12]);
        xmlNode(xmlDoc, 'FuelConsumed', totalFuel, 'FuelUsed', elCount[12]);
        elCount[12] = elCount[12] + 1;
      }

      if (vehicleInfo[11].length != 0) {
        var fuelUnits = 'litres';
        var fuel24DateTime = vehicleInfo[11][0].dateTime;
        var fuel24 = vehicleInfo[11][0].data.toFixed(2);
        xmlNode(xmlDoc, 'FuelUsedLast24', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('FuelUsedLast24')[elCount[13]].setAttribute('datetime', fuel24DateTime);
        xmlNode(xmlDoc, 'FuelUnits', fuelUnits, 'FuelUsedLast24', elCount[13]);
        xmlNode(xmlDoc, 'FuelConsumed', fuel24, 'FuelUsedLast24', elCount[13]);
        elCount[13] = elCount[13] + 1;
      }

      if (!(vehicleInfo[12].length == 0 || vehicleInfo[13] == 0)) {
        var fuelRemainingDateTime = vehicleInfo[12][0].dateTime;
        var fuelRemaining = vehicleInfo[12][0].data.toFixed(2);
        var fuelTankCapacity = vehicleInfo[13][0].data.toFixed(2);
        xmlNode(xmlDoc, 'FuelRemaining', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('FuelRemaining')[elCount[14]].setAttribute('datetime', fuelRemainingDateTime);
        xmlNode(xmlDoc, 'Percent', fuelRemaining, 'FuelRemaining', elCount[14]);
        xmlNode(xmlDoc, 'FuelTankCapacityUnits', fuelUnits, 'FuelRemaining', elCount[14]);
        xmlNode(xmlDoc, 'FuelTankCapacity', fuelTankCapacity, 'FuelRemaining', elCount[14]);
        elCount[14] = elCount[14] + 1;
      }

      if (vehicleInfo[16].length != 0) {
        var msInd = vehicleInfo[16].length - 1;
        var maxSpeedDateTime = vehicleInfo[16][msInd].dateTime;
        var maxSpeed = vehicleInfo[16][msInd].data.toFixed(2);
        var speedUnits = 'kilometers per hour';
        xmlNode(xmlDoc, 'MaximumSpeedLast24', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('MaximumSpeedLast24')[elCount[15]].setAttribute('datetime', maxSpeedDateTime);
        xmlNode(xmlDoc, 'SpeedUnits', speedUnits, 'MaximumSpeedLast24', elCount[15]);
        xmlNode(xmlDoc, 'Speed', maxSpeed, 'MaximumSpeedLast24', elCount[15]);
        elCount[15] = elCount[15] + 1;
      }
    } else { //device is a go device

      if (headerInfo[2].length != 0) {
        var locDateTime = headerInfo[2][0].dateTime;
        var lat = headerInfo[2][0].latitude;
        var long = headerInfo[2][0].longitude;
        xmlNode(xmlDoc, 'Location', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('Location')[elCount[1]].setAttribute('datetime', locDateTime);
        xmlNode(xmlDoc, 'Latitude', lat, 'Location', elCount[1]);
        xmlNode(xmlDoc, 'Longitude', long, 'Location', elCount[1]);
        elCount[1] = elCount[1] + 1;
      }

      if (vehicleInfo[0].length != 0) {
        var distDateTime = vehicleInfo[0][0].dateTime;
        var odoUnit = 'kilometers';
        var odo = (vehicleInfo[0][0].data / 1000).toFixed(2);
        xmlNode(xmlDoc, 'Distance', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('Distance')[elCount[10]].setAttribute('datetime', distDateTime);
        xmlNode(xmlDoc, 'OdometerUnits', odoUnit, 'Distance', elCount[10]);
        xmlNode(xmlDoc, 'Odometer', odo, 'Distance', elCount[10]);
        elCount[10] = elCount[10] + 1;
      }

      if (vehicleInfo[4] != 0) {
        var idleHours = (vehicleInfo[4][0] / 3600).toFixed(2);
        var dt = vehicleInfo[4][0].dateTime;
        xmlNode(xmlDoc, 'CumulativeIdleHours', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('CumulativeIdleHours')[elCount[2]].setAttribute('datetime', dt);
        xmlNode(xmlDoc, 'Hour', idleHours, 'CumulativeIdleHours', elCount[2]);
        elCount[2] = elCount[2] + 1;
      }

      if (vehicleInfo[1].length != 0) {
        var engineHours = (vehicleInfo[1][0].data / 3600).toFixed(2);
        var dt = vehicleInfo[1][0].dateTime;
        xmlNode(xmlDoc, 'CumulativeOperatingHours', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('CumulativeOperatingHours')[elCount[6]].setAttribute('datetime', dt);
        xmlNode(xmlDoc, 'Hour', engineHours, 'CumulativeOperatingHours', elCount[6]);
        elCount[6] = elCount[6] + 1;
      }

      if (vehicleInfo[2].length != 0) {
        var fuelDateTime = vehicleInfo[2][0].dateTime;
        var totalFuel = vehicleInfo[2][0].data.toFixed(2);
        var fuelUnits = 'litres';
        xmlNode(xmlDoc, 'FuelUsed', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('FuelUsed')[elCount[12]].setAttribute('datetime', fuelDateTime);
        xmlNode(xmlDoc, 'FuelUnits', fuelUnits, 'FuelUsed', elCount[12]);
        xmlNode(xmlDoc, 'FuelConsumed', totalFuel, 'FuelUsed', elCount[12]);
        elCount[12] = elCount[12] + 1;
      }

      if (!(vehicleInfo[3].length == 0 || vehicleInfo[7].length == 0)) {
        var fuel24DateTime = vehicleInfo[3][0].dateTime;
        var fuelUnits = 'litres';
        var fuel24 = (vehicleInfo[3][0].data - vehicleInfo[7][0].data).toFixed(2);
        xmlNode(xmlDoc, 'FuelUsedLast24', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('FuelUsedLast24')[elCount[13]].setAttribute('datetime', fuel24DateTime);
        xmlNode(xmlDoc, 'FuelUnits', fuelUnits, 'FuelUsedLast24', elCount[13]);
        xmlNode(xmlDoc, 'FuelConsumed', fuel24, 'FuelUsedLast24', elCount[13]);
        elCount[13] = elCount[13] + 1;
      }

      if (!(vehicleInfo[6].length == 0 || vehicleInfo[5] == 0)) {
        var fuelRemainingDateTime = vehicleInfo[6][0].dateTime;
        var fuelRemaining = vehicleInfo[6][0].data.toFixed(2);
        var fuelTankCapacity = vehicleInfo[5][0].data.toFixed(2);
        xmlNode(xmlDoc, 'FuelRemaining', '', 'Equipment', eqpCount);
        xmlDoc.getElementsByTagName('FuelRemaining')[elCount[14]].setAttribute('datetime', fuelRemainingDateTime);
        xmlNode(xmlDoc, 'Percent', fuelRemaining, 'FuelRemaining', elCount[14]);
        xmlNode(xmlDoc, 'FuelTankCapacityUnits', fuelUnits, 'FuelRemaining', elCount[14]);
        xmlNode(xmlDoc, 'FuelTankCapacity', fuelTankCapacity, 'FuelRemaining', elCount[14]);
        elCount[14] = elCount[14] + 1;
      }
    }
    eqpCount = eqpCount + 1; //increase equipment count
  }

  function mCall(callList) {
    return new Promise(function (resolve, reject) {
      api.multiCall(callList, function (result) {
        resolve(result);
      }, function (e) {
        console.log('Error:', e);
        reject(e);
      }
      );
    });
  }

  function decode(vin) {
    return new Promise(function (resolve, reject) {
      api.call('DecodeVins', { vins: vin }, function (vinResult) {
        resolve(vinResult);
      }, function (e) {
        console.log('Error:', e);
        reject(e);
      });
    });
  }

  async function getInfo(vehicleList) {
    startXML(); //initialize xml doc
    var calls = [],
      thirdPartyCalls = [],
      goCalls = [],
      cDiags,
      dDiags,
      goDiags,
      devId,
      deviceType,
      devHeaderInfo;

    var prevWeek = new Date(dateValue);
    prevWeek.setDate(prevWeek.getDate() - 7);
    var prevDay = new Date(dateValue);
    prevDay.setDate(prevDay.getDate() - 1);

    //list continuous thirdparty diagnostics
    cDiags = ['arXACWvER3k-vbMyqr5VKLg',  //AverageLoadFactorLast24
      'aTiOe_dNBdkCXdSVharGLAQ', //CumulativeActiveRegeneration
      'a8KsT2kfUBUOQiLxYoa6INw', //CumulativeIdleHours
      'a8gLux9yQQEaFOuZq-4R6yA', //CumulativeIdleNonoperatingHours
      'aiPGdlV4r-UaImTK73TTdCg', //CumulativeOperatingHours
      'a8nvRJwF8AEmucjsD3M1VCg', //CumulativePowerTakeOffHours
      'aepkVWAtCj0mFDaL7fGp-0A', //CumulativePayloadTotals
      'ayr0mbn8nxkWnUyWVeqCmYg', //DEFRemaining
      'a38jW-bCw3E-N4sEioOMsfQ', //DEFTankCapacity
      'DiagnosticThirdPartyOdometerId', //Odometer
      'aYUF8OpWs4UuPaaWmT4ilWA', //FuelUsed
      'apz4xNtwMJEmJBsq_nZYFHg', //FuelUsedLast24
      'aTjGzenyEs0eN478IdG4VNA', //FuelRemaining
      'az2uLMT9ndUC_5SFHpHIsKg']; //FuelTankCapacity 

    // list discrete third party diagnostics
    dDiags = ['aAzL-0aXYrUmG6iZuck8ErQ', //CumulativeLoadCount
      'amWCU6yLsq0-r9C04KfyjOw', //EngineStatus
      'acw_T27BBokmmGLDrAKg7ow', //MaxSpeedLast24
      'aSX--bvvc2Ey4Axpp8LV-hw']; //VIN

    // go device diagnostics
    goDiags = ['DiagnosticOdometerAdjustmentId',
      'DiagnosticEngineHoursAdjustmentId',
      'DiagnosticTotalFuelUsedId',
      'DiagnosticDeviceTotalFuelId', //total fuel used since telematics device install
      'DiagnosticTotalIdleHoursId',
      'DiagnosticFuelTankCapacityId',
      'DiagnosticFuelLevelId'];


    for (var j in vehicleList) {
      devId = vehicleList[j].id;
      calls.push(['GetReportData', {
        'argument': {
          'devices': [{ 'id': devId }],
          'includeAllHistory': false,
          'reportArgumentType': 'DeviceInstallHistory'
        }
      }], ['Get', {
        typeName: 'Device',  //Device
        search: {
          id: devId
        }
      }], ['Get', {
        typeName: 'LogRecord',  // Location info
        search: {
          deviceSearch: {
            id: devId
          },
          'fromDate': dateValue,
          'toDate': dateValue
        }
      }]
      );
    }

    var devInfo = await mCall(calls);

    for (var j in vehicleList) {
      devId = vehicleList[j].id;
      devHeaderInfo = [devInfo[(j * 3)], devInfo[(j * 3) + 1], devInfo[(j * 3) + 2]];
      deviceType = devInfo[(j * 3) + 1][0].deviceType;

      if (deviceType == 'CustomVehicleDevice') { // if device is third party, add calls
        thirdPartyCalls = [];

        for (var d in cDiags) {
          thirdPartyCalls.push(['Get', {
            typeName: 'StatusData',
            search: {
              deviceSearch: {
                id: devId
              },
              diagnosticSearch: {
                id: cDiags[d]
              },
              fromDate: dateValue,
              toDate: dateValue
            }
          }
          ]);
        }

        for (var dd in dDiags) {
          thirdPartyCalls.push(['Get', {
            typeName: 'StatusData',
            search: {
              deviceSearch: {
                id: devId
              },
              diagnosticSearch: {
                id: dDiags[dd]
              },
              fromDate: prevWeek,
              toDate: dateValue
            }
          }
          ]);
        }

        thirdPartyCalls.push(['Get', {
          typeName: 'BinaryData',
          search: {
            binaryDataType: 'EngineSerialNumber',
            deviceSearch: { id: devId }
          }
        }]);

        var tpResult = await mCall(thirdPartyCalls); // multicall for all diagnostics
        vin = [];
        if (tpResult[17].length > 0) {
          var len = tpResult[17][0].length;
          vin.push(devHeaderInfo[17][len - 1].vehicleIdentificationNumber);
        } else {
          vin.push(devHeaderInfo[1][0].vehicleIdentificationNumber);
        }
        var vinResult = await decode(vin); // devode vin
        await buildXML(tpResult, vinResult, devHeaderInfo); // add results to xmlDoc
      } else { // if go device, add calls

        goCalls = [];
        for (var gd in goDiags) {
          goCalls.push(['Get', {
            typeName: 'StatusData',
            search: {
              deviceSearch: {
                id: devId
              },
              diagnosticSearch: {
                id: goDiags[gd]
              },
              fromDate: dateValue,
              toDate: dateValue
            }
          }]);
        }

        goCalls.push(['Get', {
          typeName: 'StatusData',
          search: {
            deviceSearch: {
              id: devId
            },
            diagnosticSearch: {
              id: goDiags[3]
            },
            fromDate: prevDay,
            toDate: prevDay
          }
        }]);

        var goResult = await mCall(goCalls); //multicall for all diagnostics
        vin = [];
        if (devHeaderInfo[1][0].engineVehicleIdentificationNumber == '' || devHeaderInfo[1][0].engineVehicleIdentificationNumber.includes('?') || devHeaderInfo[1][0].engineVehicleIdentificationNumber.includes('@')) {
          vin.push(devHeaderInfo[1][0].vehicleIdentificationNumber);
        } else {
          vin.push(devHeaderInfo[1][0].engineVehicleIdentificationNumber);
        }

        var vinResult = await decode(vin); //decode vin
        await buildXML(goResult, vinResult, devHeaderInfo); //add results to XML
      }
    }
    createDoc(); //create and download xml doc
  }

  function vehicleOnSelect(vehicleSelected) {
    if (selected.includes(vehicleSelected)) {
      vehicleSelected.setAttribute('class', 'active');
      var m = selected.indexOf(vehicleSelected);
      selected.splice(m, 1);
    } else {
      vehicleSelected.setAttribute('class', 'notActive');
      selected.push(vehicleSelected);

    }
  }

  // events

  //select all button
  selectAll.addEventListener('click', event => {
    selected = [];
    if (allSelected == false) {
      for (var ele in all) {
        all[ele].setAttribute('class', 'notActive');
        selected.push(all[ele]);
      }
      allSelected = true;
    } else {
      for (var ele in all) {
        all[ele].setAttribute('class', 'active');
      }
      allSelected = false;
    }

  });

  //Submit Button
  elAempSubmit.addEventListener('click', event => {
    event.preventDefault();
    vehicleSelect = selected;
    dateValue = document.getElementById('datetime').value; //$('#datetime').val();
    dateValue = new Date(dateValue).toISOString();
    if (vehicleSelect.length > 0) {
      getInfo(vehicleSelect); //getVehicleInfo
      elAempSubmit.setAttribute('disabled', true);
    }
  })

  //date time input
  document.getElementById('datetime').addEventListener('change', event => {
    event.preventDefault();
  })

  // vehicle search
  document.getElementById('vehicleSearch').onkeyup = function () {
    filter(); //filter results based on search
  }

  document.getElementById('vehicleSearch').onsearch = function () {
    filter(); //filter results based on search
  }


  return {
    /**
     * initialize() is called only once when the Add-In is first loaded. Use this function to initialize the
     * Add-In's state such as default values or make API requests (MyGeotab or external) to ensure interface
     * is ready for the user.
     * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     * @param {function} initializeCallback - Call this when your initialize route is complete. Since your initialize routine
     *        might be doing asynchronous operations, you must call this method when the Add-In is ready
     *        for display to the user.
     */
    initialize: function (freshApi, freshState, initializeCallback) {
      elAddin = document.querySelector('#aEMPFormat');
      api = freshApi;

      // set up dates

      let now = new Date();
      let dd = now.getDate();
      let mm = now.getMonth() + 1;
      let yy = now.getFullYear();
      let hh = now.getHours();
      let mn = now.getMinutes();

      if (dd < 10) {
        dd = '0' + dd;
      }

      if (mm < 10) {
        mm = '0' + mm;
      }

      if (hh < 10) {
        hh = '0' + hh;
      }

      if (mn < 10) {
        mn = '0' + mn;
      }

      eldateInput.value = yy + '-' + mm + '-' + dd + 'T' + hh + ':' + mn;

      // MUST call initializeCallback when done any setup
      initializeCallback();
    },

    /**
     * focus() is called whenever the Add-In receives focus.
     *
     * The first time the user clicks on the Add-In menu, initialize() will be called and when completed, focus().
     * focus() will be called again when the Add-In is revisited. Note that focus() will also be called whenever
     * the global state of the MyGeotab application changes, for example, if the user changes the global group
     * filter in the UI.
     *
     * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     */
    focus: function (freshApi, freshState) {
      api = freshApi;
      document.getElementById('vehicleList').innerHTML = '';
      all = [];

      api.call('Get', {
        typeName: 'Device',
        resultsLimit: 500,
        search: {
          fromDate: new Date().toISOString(),
          groups: freshState.getGroupFilter()
        }
      }, vehicles => {
        if (!vehicles || vehicles.length < 0) {
          return;
        }

        vehicles.forEach(vehicle => {

          var element = document.createElement('li');
          element.id = vehicle.id;
          element.setAttribute('class', 'selectButton');

          var nameTextnode = document.createTextNode(vehicle.name);
          var serialTextNode = document.createTextNode(' (' + vehicle.serialNumber + ')');
          var divClass = document.createElement('div');
          divClass.className = 'g-row checkmateListBuilderRow';
          var aClass = document.createElement('a');
          aClass.className = 'g-main g-main-col';
          var divClass2 = document.createElement('div');
          divClass2.className = 'g-name';
          var spanClass = document.createElement('span');
          spanClass.className = 'ellipsis';
          spanClass.id = 'span-id';
          var spanClass2 = document.createElement('span');
          spanClass2.className = 'secondaryData email';
          spanClass2.appendChild(serialTextNode);
          spanClass.appendChild(nameTextnode);
          spanClass.appendChild(spanClass2);
          divClass2.appendChild(spanClass);

          aClass.appendChild(divClass2);
          divClass.appendChild(aClass);
          element.appendChild(divClass);
          document.getElementById('vehicleList').appendChild(element);
          all.push(element);
          element.onclick = function () { vehicleOnSelect(this) };
        });
      });

      // show main content
      elAddin.className = '';
    },

    /**
     * blur() is called whenever the user navigates away from the Add-In.
     *
     * Use this function to save the page state or commit changes to a data store or release memory.
     *
     * @param {object} freshApi - The GeotabApi object for making calls to MyGeotab.
     * @param {object} freshState - The page state object allows access to URL, page navigation and global group filter.
     */
    blur: function () {
      // hide main content
      elAddin.className = 'hidden';
    }
  };
};
