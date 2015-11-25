var expect  = require("chai").expect;
var request = require("supertest");
var sinon = require("sinon");
var requestInServer = require("request");

describe("Carpaccio Store API", function() {

  var server;
  before(function () {
    server = require('../app.js');
  })

  after(function () {
    //server.close();
  })

  // helpers for API

  var getProductsPath = function() {
    return "/api/1/products.json"
  }

  var getPricersPath = function() {
    return "/api/1/pricers.json"
  }

  var getRegisterPricerPath = function() {
    return "/api/1/registerPricer.json"
  }

  var getPricePath = function(pricer,price,quantity,state) {
    return "/api/1/price.json"
      +"?pricer="+pricer
      +"&price="+price
      +"&quantity="+quantity
      +"&state="+state
  }

  var getMonitorPath = function() {
    return "/api/1/monitor.json"
  }

  var getLogPath = function(value) {
    return "/api/1/logTransaction.json?value="+value
  }

  var getHistoryPath = function(title) {
    return "/api/1/logHistory.json?title="+title
  }

  var getScenarioPath = function(id,title) {
    return "/api/1/scenario.json"
      + (id?"?id="+id+"&title="+title:"")
  }

  var getTestScenarioPath = function(title) {
    return "/api/1/testScenario.json"
      + "?title="+title
  }

  it('responds to /', function(done) {
    request(server)
      .get('/')
      .expect(200, done);
  })

  describe("Products", function() {

    it("returns status 200", function(done) {
      request(server)
        .get(getProductsPath())
        .expect(200,done)
    })

    it("returns products", function(done) {
      request(server)
        .get(getProductsPath())
        .expect(function(res) {
          var info = res.body
          expect(info.length).to.be.above(3)
          expect(info[0]).to.have.property("price")
        })
        .expect(200,done)
    })

  })

  describe("Pricers", function() {

    it("returns status 200", function(done) {
      request(server)
        .get(getPricersPath())
        .expect(200,done)
    })

    it("returns pricers", function(done) {
      request(server)
        .get(getPricersPath())
        .expect(function(res) {
          var info = res.body
          expect(info.length).to.be.above(2)
          expect(info[0]).to.have.property("id")
          expect(info[0]).to.have.property("name")
        })
        .expect(200,done)
    })

  });

  describe("RegisterPricer", function() {

    var testPricer = {
      "name": "Testing Pricer",
      "url": "http://testing/pricing"
    }

    it("returns new pricer", function(done) {
      request(server)
        .post(getRegisterPricerPath())
        .send(testPricer)
        .expect(function(res) {
          expect(res.body.name).to.equal(testPricer.name)
          expect(res.body.url).to.equal(testPricer.url)
          expect(res.body).to.have.property("id")
        })
        .expect(200,done)
    })

    it("returns error on duplicate pricer", function(done) {
      request(server)
        .post(getRegisterPricerPath())
        .send(testPricer)
        .expect(400,done)
    })

  })

  describe("Price", function() {

    it("returns status 404 on missing engine", function(done) {
      var path = getPricePath("NO-engine",0,0,"")
      request(server)
        .get(path)
        .expect(404,done)
    })

    it("CURRENTLY returns status 501", function(done) {
      var path = getPricePath("engine-1",1,1,"")
      request(server)
        .get(path)
        .expect(501,done)
    })

  })

  describe("Price, stubbed", function() {

    var testPricer = {
      "name": "Stubbed Testing Pricer",
      "url": "http://testing/pricing"
    }

    before(function(done){
        sinon
          .stub(requestInServer, 'get')
          .yields(null, {
            statusCode: 200
          }, {
            totalPrice: 1313.13
          })
        done()
    })

    after(function(done){
      requestInServer.get.restore()
      done()
    })

    var pricerId

    it("register test pricer", function(done) {
      request(server)
        .post(getRegisterPricerPath())
        .send(testPricer)
        .expect(function(res) {
          expect(res.body.name).to.equal(testPricer.name)
          expect(res.body.url).to.equal(testPricer.url)
          expect(res.body).to.have.property("id")
          pricerId = res.body.id
        })
        .expect(200,done)
    })

    it("returns a price", function(done) {
      var path = getPricePath(pricerId,13,1313,"UT")
      request(server)
        .get(path)
        .expect(function(res) {
          expect(res.body.totalPrice).to.equal(1313.13)
        })
        .expect(200,done)
    })

    it("monitors the price", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          expect(res.body.current.prices).to.have.property(testPricer.name,1313.13)
          expect(res.body.current).to.have.property("count",0)
          expect(res.body.current).to.have.property("value",0)
        })
        .expect(200,done)
    })

  })

  describe("Monitor", function() {

    var monitor0

    it("returns status 200", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info).to.have.property("current")
          expect(info).to.have.property("history")
          expect(info.current).to.have.property("count")
          expect(info.current).to.have.property("value")
          expect(info.current).to.have.property("prices")

          monitor0 = info
        })
        .expect(200,done)
    })

    it("calculates a price", function(done) {
      var path = getPricePath("engine-1",13,13,"")
      request(server)
        .get(path)
        .expect(501,done)
    })

    it("has logged pricing", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info.current.count).to.equal(monitor0.current.count)
          expect(info.current.value).to.equal(monitor0.current.value)
          expect(info.current.prices).to.have.property("Team 1",0)
        })
        .expect(200,done)
    })

    it("has logged transaction", function(done) {
      var path = getLogPath(13)
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          var current = info.current
          expect(current.count).to.equal(monitor0.current.count+1)
          expect(current.value).to.equal(monitor0.current.value+13)
        })
        .expect(200,done)
    })

    it("has pushes history", function(done) {
      var path = getHistoryPath("Test History")
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info.current.count).to.equal(0)
          expect(info.current.value).to.equal(0)
          expect(info.history).to.have.length(monitor0.history.length+1)
          expect(info.history[info.history.length-1]).to.have.property("title","Test History")
        })
        .expect(200,done)
    })

  })

  describe("Scenario", function() {

    var monitor0

    it("snapshot monitor", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          monitor0 = res.body
        })
        .expect(200,done)
    })

    it("shows available scenarios", function(done) {
      var path = getScenarioPath()
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info).to.have.length.above(3)
          info.forEach(function(scenario) {
            expect(scenario).to.have.deep.all.keys("id", "name", "description", "prices", "quantities", "states", "taxes", "discounts")
          })
        })
        .expect(200,done)
    })

    it("unchanged monitor", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info).to.eql(monitor0)
        })
        .expect(200,done)
    })

    it("execute a scenario", function(done) {
      var path = getScenarioPath(1,"Test Scenario")
      request(server)
        .get(path)
        .expect(200,done)
    })

    it("changed monitor", function(done) {
      var path = getMonitorPath()
      request(server)
        .get(path)
        .expect(function(res) {
          var info = res.body
          expect(info.history).to.have.length(monitor0.history.length+1)
          expect(info.history[info.history.length-1]).to.have.property("title","Test Scenario: First")
          expect(info.history[info.history.length-1]).to.have.property("value",1313*13)
          expect(info.history[info.history.length-1]).to.have.property("approvedValue",1313*13*1.03)
        })
        .expect(200,done)
    })

  })

  describe("Approved values", function() {

    it("with tax", function(done) {
      var path = getTestScenarioPath("Test with tax")
      request(server)
        .post(path)
        .send({
            id: 1013,
            prices: [100],
            states: ["FW"],
            quantities: [1],
            taxes: {"FW":13},
            discounts: null
          })
        .expect(function(res) {
          var info = res.body
          console.log(info)
          expect(info).to.have.property("approvedValue",113)
        })
        .expect(200,done)
    })

    it("with discount", function(done) {
      var path = getTestScenarioPath("Test with discount")
      request(server)
        .post(path)
        .send({
            id: 1014,
            prices: [100],
            states: ["FW"],
            quantities: [1],
            taxes: null,
            discounts: {"50":13}
          })
        .expect(function(res) {
          var info = res.body
          console.log(info)
          expect(info).to.have.property("approvedValue",87)
        })
        .expect(200,done)
    })

    it("with tax and discount", function(done) {
      var path = getTestScenarioPath("Test with tax and discount")
      request(server)
        .post(path)
        .send({
            id: 1014,
            prices: [100],
            states: ["FW"],
            quantities: [1],
            taxes: {"FW":13},
            discounts: {"50":13}
          })
        .expect(function(res) {
          var info = res.body
          console.log(info)
          expect(info).to.have.property("approvedValue",Number(Number((100-13)*1.13).toFixed(2)))
        })
        .expect(200,done)
    })

    it("with tax on missing state", function(done) {
      var path = getTestScenarioPath("with tax on missing state")
      request(server)
        .post(path)
        .send({
            id: 1015,
            prices: [100],
            states: ["FW"],
            quantities: [1],
            taxes: {},
            discounts: null
          })
        .expect(function(res) {
          expect(res.error.text).to.contain("Unknown state FW")
        })
        .expect(500,done)
    })

    it("with negative value", function(done) {
      var path = getTestScenarioPath("Test negative value")
      request(server)
        .post(path)
        .send({
            id: 1015,
            prices: [100],
            states: ["FW"],
            quantities: [-1],
            taxes: null,
            discounts: null
          })
        .expect(function(res) {
          expect(res.body).to.have.property("approvedValue",0)
        })
        .expect(200,done)
    })

    it("under discount", function(done) {
      var path = getTestScenarioPath("Test under")
      request(server)
        .post(path)
        .send({
            id: 1015,
            prices: [100],
            states: ["FW"],
            quantities: [-1],
            taxes: null,
            discounts: {"999":13}
          })
        .expect(function(res) {
          expect(res.body).to.have.property("approvedValue",0)
        })
        .expect(200,done)
    })

  })

})
