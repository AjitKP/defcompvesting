const proxy = require('@sap/cds-odata-v2-adapter-proxy')
const cds = require('@sap/cds')
cds.on('bootstrap', (app) => {console.log('server.js');return app.use(proxy())})
module.exports = cds.server;