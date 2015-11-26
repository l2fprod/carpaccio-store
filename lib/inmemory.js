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

  self.monitor = {
      current: {
        count: 0,
        value: 0,
        prices: {}
      },
      history: []
  }
  
  self.restoreMonitor = function (callback) {
      callback(null, self.monitor)
  }
  
  self.saveMonitor = function(monitor, callback) {
      self.monitor = monitor
      callback(null)
  }
}

module.exports = function () {
  return new InMemory();
};
