// Licensed under the Apache License. See footer for details.
var
  express = require('express'),
  app = express(),
  cfenv = require('cfenv'),
  request = require('request'),
  async = require('async')


var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// load local VCAP configuration
var vcapLocal = null
try {
  vcapLocal = require("./vcap-local.json");
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) {
  console.error(e);
}

// get the app environment from Cloud Foundry, defaulting to local VCAP
var appEnvOpts = vcapLocal ? {
  vcap: vcapLocal
} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);

// currently send a static list
app.get("/api/1/products.json", function (req, res) {
  res.sendFile(__dirname + "/products.json");
})

// currently send a static list
var pricers = JSON.parse(require('fs').readFileSync('pricers.json', 'utf8'))
var idToPricers = {}
pricers.forEach(function (pricer) {
  idToPricers[pricer.id] = pricer
})

/**
 * Returns the list of registered pricers
 */
app.get("/api/1/pricers.json", function (req, res) {
  res.send(pricers);
})

/**
 * Registers a new pricer.
 * Returns the list of registered pricers
 */
app.post("/api/1/registerPricer.json", function (req, res) {
  var pricer = req.body
  console.log("Register pricer",pricer)
  if ( idToPricers[pricer.id] ) {
    res.status(400).send({
      error: "engine already exists"
    })
    return
  }
  pricers.push(pricer)
  idToPricers[pricer.id] = pricer
  res.send(pricers);
})

/**
 * Computes pricing for the given pricer
 * /api/1/price.json?pricer=<ID>&price=<PRICE>&quantity=<QTY>&state=<LETTER_CODE>
 */
app.get("/api/1/price.json", function (req, res) {
  var pricerId = req.query.pricer
  var price = req.query.price
  var quantity = req.query.quantity
  var state = req.query.state
  console.log("Received pricing request", req.query);

  getPrice(pricerId,price,quantity,state, res)
});

var getPrice = function(pricerId,price,quantity,state, res) {
  // find the engine
  var engine = idToPricers[pricerId]
  if (!engine) {
    res.status(404).send({
      error: "No such engine"
    })
    return
  }

  var url = engine.url + "?price=" + encodeURIComponent(price) +
    "&quantity=" + encodeURIComponent(quantity) +
    "&state=" + encodeURIComponent(state)
  console.log("[", engine.id, "] Calling", url)
  request.get(url, {
      json: true
    },
    function (error, response, body) {

      if ( error ) {
        console.log("[", engine.id, "]","error:", error)
        monitoring.logPrice(engine.id,0)
        res.send(error)
        return
      }

      res.status(response.statusCode)
      console.log("[", engine.id, "] Got status", response.statusCode, "body:", body)

      if (body) {
        monitoring.logPrice(engine.id,Number(body))
        res.send(body)
      } else {
        monitoring.logPrice(engine.id,0)
        res.send("empty body")
      }
    })

}

var monitor = {
  current: {
	  count: 0,
	  value: 0,
	  prices: {}
  },
  history: []
}
//$http.get("/api/1/monitor.json
app.get("/api/1/monitor.json", function(req, res) {
  res.send(monitor)
});

var monitoring = {
  log: function(value,approvedValue) {
    monitor.current.count++
    monitor.current.value += Number(value)
    if ( approvedValue ) {
      monitor.current.approvedValue += Number(approvedValue)
    }
    console.log("Monitor log",value,monitor)
  },
  logPrice: function(id,price) {
    var name = idToPricers[id].name
    var current = monitor.current
    if ( !current.prices[name] ) {
  		current.prices[name] = 0;
  	}
    console.log("Monitor price",id,name,price)
    if ( price ) {
      current.prices[name] += price
    }
  },
  history: function(title) {
    monitor.current.title = title
    monitor.history.push(monitor.current)
    monitor.current = {
      count: 0,
      value: 0,
      approvedValue: 0,
      prices: {}
    }
    console.log("Monitor history",title,monitor)
  }
}

// TODO post complete cart
/**
 * Log a pricing transaction
 * /api/1/logTransaction.json?value=<PRICE BEFOER TAXES>
 */
app.get("/api/1/logTransaction.json", function(req, res) {
  monitoring.log(req.query.value)
  res.send(monitor)
});

/**
 * Push current log to history
 * /api/1/logHistory.json?title=<HISTORY TITLE>
 */
app.get("/api/1/logHistory.json", function(req, res) {
  monitoring.history(req.query.title)
  res.send(monitor)
});

/**
 * Simulate a given scenario.
 * Returns the list of scenarios
 * /api/1/scenario.json?id=<ID>&title=<TITLE>
 */
app.get("/api/1/scenario.json", function (req, res) {
  var scenarios = JSON.parse(require('fs').readFileSync('scenarios.json', 'utf8'))
  if ( req.query.id ) {
    scenarios.forEach(function (scenario) {
      if ( scenario.id==req.query.id ) {
        simulate(req.query.title,scenario)
      }
    })
  }
	res.send(scenarios);
})

app.post("/api/1/testScenario.json", function (req, res) {
  simulate(req.query.title,req.body)
  res.send(monitor.history[monitor.history.length-1]);
})

var simulate = function(title,scenario) {
  console.log("Simulating scenario:",title,scenario)

  scenario.prices.forEach(function(price) {
    scenario.quantities.forEach(function(quantity) {
      scenario.states.forEach(function(state) {
        logApprovedValue(scenario,price,quantity,state)
        getAllPrices(price,quantity,state)
      })
    })
  })

  var historyTitle = (title?title+": ":"")+scenario.name
  monitoring.history(historyTitle)
}

var logApprovedValue = function(scenario,price,quantity,state) {
  var value = price*quantity
  value = value>0 ? value : 0

  var approvedValue = value

  if ( scenario.discounts ) {
    var discount = 0
    for (var cap in scenario.discounts) {
      if ( value>=Number(cap) ) {
        discount = scenario.discounts[cap]
      }
    }
    approvedValue -= ( approvedValue * discount ) / 100.0
  }

  if ( scenario.taxes ) {
    var tax = scenario.taxes[state]
    if ( !tax ) {
      throw("Unknown state "+state)
    }
    approvedValue += ( approvedValue * tax ) / 100.0
  }

  monitoring.log(value,approvedValue)
}

var getAllPrices = function(price,quantity,state) {
  console.log("Get all prices",price,quantity,state);

  var myres = {
    send: function() {},
    status: function() {}
  }
  async.each(pricers, function(pricer, done) {
    getPrice(pricer.id,price,quantity,state,myres)
    done(null)
  })
}

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// start server on the specified port and binding host
app.listen(appEnv.port, "0.0.0.0", function () {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

module.exports = app

//------------------------------------------------------------------------------
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------
