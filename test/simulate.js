/*
  USAGE
  node test/simulate.js <ID> <TITLE> [<URL>]

  LOCAL

  open http://localhost:6001
  open http://localhost:6001/dashboard.html

  curl http://localhost:6001/api/1/clear.json?target=pricers
  curl http://localhost:6001/api/1/clear.json?target=monitor

  curl http://localhost:6001/api/1/monitor.json

  curl -H "Content-Type: application/json" -d '{name:"Fred", url:"http://fredl-nodered.mybluemix.net/pricing"}' POST http://localhost:6001/api/1/registerPricer.json


  BEFORE the excersise

  curl http://carpaccio-store.eu-gb.mybluemix.net/api/1/clear.json?target=pricers
  curl http://carpaccio-store.eu-gb.mybluemix.net/api/1/clear.json?target=monitor

  open http://carpaccio-store.eu-gb.mybluemix.net
  open http://carpaccio-store.eu-gb.mybluemix.net/dashboard.html

  DURING the excersise

  node test/simulate.js 1 Iteration-1 http://carpaccio-store.eu-gb.mybluemix.net
  node test/simulate.js 2 Iteration-2 http://carpaccio-store.eu-gb.mybluemix.net
  node test/simulate.js 3 Iteration-3 http://carpaccio-store.eu-gb.mybluemix.net
  node test/simulate.js 4 Iteration-4 http://carpaccio-store.eu-gb.mybluemix.net
  node test/simulate.js 5 Iteration-5 http://carpaccio-store.eu-gb.mybluemix.net

*/

var request = require("request");

var id = process.argv[2]
var title = process.argv[3]
var url = process.argv[4]

var base0 = "http://localhost:6001"
var base = url ? url : base0

var getScenarioUrl = function(id,title) {
  return base + "/api/1/scenario.json"
  + (id?"?id="+id+"&title="+title:"")
}

var getMonitorUrl = function() {
  return base + "/api/1/monitor.json"
}

console.log("Simulate scenario",id,title,base)
request(getScenarioUrl(id,title), function(error, response, body) {
  if ( error ) {
    var status = response ? response["statusCode"] : "no response"
    console.log("Scenario returns",status,"error: ",error)
    return
  }
  console.log("Scenarios",body)
  showMonitor()
})

var showMonitor = function() {
    request(getMonitorUrl(), function(error, response, body) {
        if ( error ) {
            var status = response ? response["statusCode"] : "no response"
            console.log("Monitor returns",status,"error: ",error)
            return
        }
        console.log("Monitor",body)
    })
}
