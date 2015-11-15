// Licensed under the Apache License. See footer for details.
var
  express = require('express'),
  app = express(),
  cfenv = require('cfenv'),
  request = require('request')


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
    res.send({
      error: "engine already exists"
    }, 400)
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

  // find the engine
  var engine = idToPricers[pricerId]
  if (!engine) {
    res.send({
      error: "No such engine"
    }, 404)
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
      res.status(response.statusCode)
      console.log("[", engine.id, "] Got status", response.statusCode, "error:", error, "body:", body)
      if (body) {
        monitoring.logPrice(engine.id,Number(body))
        res.send(body)
      } else {
        monitoring.logPrice(engine.id,0)
        res.send(error)
      }
    })
});

var monitor = {
	count: 0,
	value: 0,
	prices: {}
}
//$http.get("/api/1/monitor.json
app.get("/api/1/monitor.json", function(req, res) {
  res.send(monitor)
});

var monitoring = {
  log: function(value) {
    monitor.count++
    monitor.value += Number(value)
    console.log("Monitor log",value)
  },
  logPrice: function(id,price) {
    var name = idToPricers[id].name
    if ( !monitor.prices[name] ) {
  		monitor.prices[name] = 0;
  	}
    console.log("Monitor price",id,name,price)
    if ( price ) {
      monitor.prices[name] += price
    }
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

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// start server on the specified port and binding host
app.listen(appEnv.port, "0.0.0.0", function () {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

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
