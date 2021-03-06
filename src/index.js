let express = require('express');
let os = require('os');
let app = express();

let config = require('../config/eae.compute.config.js');
let EaeCompute = require('./eaeCompute.js');

//Remove unwanted express headers
app.set('x-powered-by', false);

let options = Object.assign({}, config);
let compute = new EaeCompute(options);

compute.start().then(function(compute_router) {
    app.use(compute_router);
    app.listen(config.port, function (error) {
        if (error) {
            console.error(error); // eslint-disable-line no-console
            return;
        }
        console.log(`Listening at http://${os.hostname()}:${config.port}/`); // eslint-disable-line no-console
    });
}, function(error) {
    console.error(error); // eslint-disable-line no-console
});

