// Licensed under the Apache License. See footer for details.
var
  cfenv = require('cfenv')

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

// if cloudant exists, use it otherwise uses an inmemory database
var cloudantCreds = appEnv.getServiceCreds("carpaccio-store-db")
var database
if (cloudantCreds) {
  console.info("Using cloudant database")
  database = require('./lib/cloudant.js')(cloudantCreds.username, cloudantCreds.password)
} else {
  console.info("Using in-memory database")
  database = require('./lib/inmemory.js')()
}

// start the server
require('./lib/server.js')(appEnv.url, appEnv.port, database)

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
