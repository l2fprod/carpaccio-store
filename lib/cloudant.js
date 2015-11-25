var uuid = require('uuid'),
  async = require('async'),
  CloudantFactory = require('cloudant')

function Database(username, password) {
  var self = this

  var cloudant,
    targetDbName = "carpaccio-store"

  CloudantFactory({
    account: username,
    password: password
  }, function (err, dbInstance) {
    if (err) {
      return console.error(err)
    }

    cloudant = dbInstance
    console.log("Connected to cloudant")

    var dbCreated = false
    cloudant.db.list(function (err, allDatabases) {
      console.log('Existing databases: %s', allDatabases.join(', '));
      allDatabases.forEach(function (dbName) {
        if (targetDbName == dbName) {
          dbCreated = true
        }
      })

      if (dbCreated) {
        self.targetDb = cloudant.db.use(targetDbName)
      } else {
        cloudant.db.create(targetDbName, seedDB)
      }
    })
  })

  function seedDB(callback) {
    self.targetDb = cloudant.use(targetDbName);
    var dbEntries = [];

    async.waterfall([
      function (next) {
        var designDocs = [
          {
            _id: '_design/pricerById',
            views: {
              all: {
                map: function (doc) {
                  if (doc.type === 'pricer') {
                    emit(doc.id, doc);
                  }
                }
              }
            }
          },
          {
            _id: '_design/pricerByName',
            views: {
              all: {
                map: function (doc) {
                  if (doc.type === 'pricer') {
                    emit(doc.name, doc);
                  }
                }
              }
            }
          }
        ];
        async.each(designDocs, targetDb.insert, next);
      },
      function (next) {
        async.each(dbEntries, targetDb.insert, next);
      },
      function (next) {
        console.log("Created DB", targetDbName, "and populated it with initial data");
        next();
      }
    ], callback)
  }

  self.getPricers = function (callback) {
    self.targetDb.view("pricerByName", "all", {
      include_docs: true
    }, function (err, body) {
      if (err) {
        callback(err)
      } else {
        var pricers = [];
        body.rows.forEach(function (doc) {
          pricers.push(doc.doc);
        });
        callback(err, pricers)
      }
    })
  }

  self.addPricer = function (pricer, callback) {
    pricer.id = uuid.v1();
    pricer.type = "pricer"
    self.targetDb.insert(pricer, {}, function (err, body) {
      if (err) {
        callback(err)
      } else {
        callback(null, pricer)
      }
    })
  }

  self.getPricerByName = function (name, callback) {
    self.targetDb.view("pricerByName", "all", {
      key: name,
      include_docs: true,
      limit: 1
    }, function (err, body) {
      if (err) {
        callback(err)
      } else {
        callback(null, body.rows[0].doc)
      }
    })
  }

  self.getPricerById = function (id, callback) {
    self.targetDb.view("pricerById", "all", {
      key: id,
      include_docs: true,
      limit: 1
    }, function (err, body) {
      if (err) {
        callback(err)
      } else {
        callback(null, body.rows[0].doc)
      }
    })
  }

}

module.exports = function (username, password) {
  return new Database(username, password);
};
