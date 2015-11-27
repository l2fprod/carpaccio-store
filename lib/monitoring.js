function Monitoring(database) {
  var self = this
  
  self._getEmptyMonitor = function() {
    return {
      current: {
        count: 0,
        value: 0,
        prices: {}
      },
      history: []
    }
  }
  
  self.monitor
  
  self._useCurrent = function(mycurrent,callback) {
        if ( mycurrent ) {
            callback(mycurrent)
            return
        }
        if ( self.monitor ) {
            callback(self.monitor.current)
            return
        }
        database.restoreMonitor(function(err, restored) {
            self.monitor = restored || self._getEmptyMonitor()
            callback(self.monitor.current)
        })
  }

  self._log = function(value, approvedValue) {
        return function(current) {
            current.count++
            current.value += Number(value)
            if (approvedValue) {
                current.approvedValue += Number(approvedValue)
            }
        }
    }
  
  self._logPrice = function(engine, price) {
        var name = engine.name
        return function(current) {
            if (!current.prices[name]) {
                current.prices[name] = 0;
            }
            if (price) {
                current.prices[name] += price
            }
        }
    }
    
  self.log = function (value, approvedValue, mycurrent) {
        self._useCurrent(mycurrent,self._log(value, approvedValue))
    }
  
  self.logPrice = function (engine, price, mycurrent) {
        self._useCurrent(mycurrent,self._logPrice(engine, price))
    }
  
  self.logHistory = function (mycurrent,next) {
      self._useCurrent(null,function(current) {
        current.count += mycurrent.count
        current.value += mycurrent.value
        current.approvedValue = 0 
        for (var name in current.prices) {
            current.prices[name] += mycurrent.prices[name]
        }
        self.monitor.history.push(mycurrent)
        database.saveMonitor(self.monitor, next)
      })
  }
  
  self.latestHistory = function() {
      return self.monitor.history[self.monitor.history.length - 1]
  }
  
  self.clear = function(next) {
    self.monitor = self._emptyMonitor
    database.clearMonitor(function(err,monitor) {
        next(err,monitor)
    })
  }
}

module.exports = function (database) {
  return new Monitoring(database)
}