/*
  USAGE
  node test/simulate.js <ID> <TITLE> [<URL>]
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

console.log("Simulate scenario",id,title)
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
