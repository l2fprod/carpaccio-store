var expect  = require("chai").expect;
var request = require("request");

describe("Carpaccio Store API", function() {

  describe("Productes", function() {
    var url = "http://localhost:6001/api/1/products.json"

    it("returns status 200", function(done) {
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        done()
      })
    })

    it("returns products", function(done) {
        request(url, function(error, response, body) {
          var info = JSON.parse(body);
          expect(info.length).to.be.above(3)
          expect(info[0]).to.have.property("price")
          done()
        })
    })

  })

  describe("Pricers", function() {
    var url = "http://localhost:6001/api/1/pricers.json"

    it("returns status 200", function(done) {
      request(url, function(error, response, body) {
        expect(response.statusCode).to.equal(200)
        done()
      })
    })

    it("returns pricers", function(done) {
        request(url, function(error, response, body) {
          var info = JSON.parse(body);
          expect(info.length).to.be.above(2)
          expect(info[0]).to.have.property("id")
          expect(info[0]).to.have.property("name")
          done()
        })
    })

  });

});
