var uuid = require('uuid')

function InMemory() {
  var self = this
  
  console.log("Loading test pricers...")
  self.pricers = JSON.parse(require('fs').readFileSync('pricers.json', 'utf8'))
  self.idToPricers = {}
  self.nameToPricers = {}
  self.pricers.forEach(function (pricer) {
    self.idToPricers[pricer.id] = pricer
    self.nameToPricers[pricer.name] = pricer
  })

  self.getPricers = function (callback) {
    callback(null, self.pricers)
  }

  self.getPricerByName = function (name, callback) {
    callback(null, self.nameToPricers[name])
  }

  self.getPricerById = function (id, callback) {
    callback(null, self.idToPricers[id])
  }

  self.addPricer = function (pricer, callback) {
    pricer.id = uuid.v1();
    self.pricers.push(pricer)

    self.idToPricers[pricer.id] = pricer
    self.nameToPricers[pricer.name] = pricer    
    callback(null, pricer)
  }
  
  self.clearPricers = function (callback) {
    var cleared = self.pricers
    self.pricers = []
    self.idToPricers = {}
    self.nameToPricers = {}
    callback(null,cleared)
  }


  self.monitor
  
  self.restoreMonitor = function (callback) {
      callback(null, self.monitor)
  }
  
  self.saveMonitor = function(monitor, callback) {
      self.monitor = monitor
      callback(null)
  }
  
  self.clearMonitor = function(callback) {
    var cleared = self.monitor
    self.monitor = undefined
    callback(null, cleared)
  }
  
}

module.exports = function () {
  return new InMemory();
};
