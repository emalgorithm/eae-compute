const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const JobExecutorAbstract = require('./jobExecutorAbstract.js');
const { SwiftHelper, ErrorHelper } = require('eae-utils');

/**
 * @class JobExecutorPython
 * @desc Specialization of JobExecutorAbstract for python scripts
 * @param jobID {String} The job unique identifier in DB
 * @param jobCollection MongoDB collection to sync the job model against
 * @param jobModel {Object} Plain js Job model from the mongoDB, optional if fetchModel is called
 * @constructor
 */
function JobExecutorPython(jobID, jobCollection, jobModel) {
    JobExecutorAbstract.call(this, jobID, jobCollection, jobModel);

    // Init member attributes
    this._swift = new SwiftHelper({
        url: global.eae_compute_config.swiftURL,
        username: global.eae_compute_config.swiftUsername,
        password: global.eae_compute_config.swiftPassword
    });
    this._tmpDirectory = null;

    // Bind member functions
    this._preExecution = JobExecutorPython.prototype._preExecution.bind(this);
    this._postExecution = JobExecutorPython.prototype._postExecution.bind(this);
    this.startExecution = JobExecutorPython.prototype.startExecution.bind(this);
    this.stopExecution = JobExecutorPython.prototype.stopExecution.bind(this);

}
JobExecutorPython.prototype = Object.create(JobExecutorAbstract.prototype); //Inherit Js style
JobExecutorPython.prototype.constructor = JobExecutorPython;

/**
 * @fn _preExecution
 * @desc Prepare jobs inputs and params. In particular, it retrieves the source code and the data files needed
 * @return {Promise} Resolve to true on successful preparation
 * @private
 * @pure
 */
JobExecutorPython.prototype._preExecution = function() {
    let _this = this;

    return new Promise(function (resolve) {
        // Post request to DB to trigger data extraction
        _this.db.getData(_this._job_ID);

        // Get algorithm source code and write it to file
        fs.mkdirSync(path.join(_this._tmpDirectory, 'input'));
        _this.algoBank.getAlgoSourceCode(_this._job_ID).then(function(algoSourceCode) {
            let fileName = 'algo.py';
            let tmpDestination = path.join(_this._tmpDirectory, 'input', fileName);
            let stream = fs.createWriteStream(tmpDestination);
            stream.once('open', function() {
                stream.write(algoSourceCode);
                stream.end();
            });
            resolve(true);
        });
    });
};

/**
 * @fn _postExecution
 * @desc Saves jobs outputs and clean
 * @return {Promise} Resolve to true on successful cleanup
 * @private
 * @pure
 */
JobExecutorPython.prototype._postExecution = function() {
    let _this = this;
    return new Promise(function (resolve, reject) {
        let container_name = _this._jobID.toString() + '_output';
        let tmpSource = path.join(_this._tmpDirectory, 'input','output');
        let upload_file_promises = [];

        // Cleanup current output in model
        _this._model.output = [];

        // Create container
        _this._swift.createContainer(container_name).then(function(__unused__ok) {

            if (fs.existsSync(tmpSource) === false) {
                resolve(true); // No outputs
                return;
            }

            // List whats in the output directory
            fs.readdir(tmpSource, function(error, files) {
                if (error) {
                    reject(ErrorHelper('Listing output files failed', error));
                    return;
                }

                // Upload each file
                files.forEach(function(file) {
                    // Register file in output
                    _this._model.output.push(file);

                    let tmpFile = path.join(tmpSource, file);
                    let rs = fs.createReadStream(tmpFile);

                    // Upload file to swift container
                    let p = _this._swift.createFile(container_name, file, rs);
                    // Register uploading promise
                    upload_file_promises.push(p);
                });

                // Wait for all uploads to complete
                Promise.all(upload_file_promises).then(function(__unused__ok_array) {
                    resolve(true); // All good
                }, function(error) {
                    reject(ErrorHelper('Uploading output files failed', error));
                });
            });
        }, function(error) {
            reject(ErrorHelper('Creating output container failed', error));
        });
    });
};

/**
 * @fn startExecution
 * @desc Starts the execution of designated job.
 */
JobExecutorPython.prototype.startExecution = function() {
    let _this = this;

    fs.mkdir(path.join(_this._tmpDirectory, 'output'), function (error) {
        if (error) {
            return;
        }
        while(!stream._readableState.ended) {
            continue;
        }
        // Now the stream has ended and all data files are stored here
        let algoModuleName = 'algo.py';
        let algoClassName = 'some class';
        let dataDir = path.join(_this._tmpDirectory, 'input');
        let numOfThreads = 4;
        let outputDir = path.join(_this._tmpDirectory, 'output');
        let parameters = _this.db.getJob(_this._jobID).parameters;

        exec(`python script.py ${algoModuleName} ${algoClassName} ${dataDir} ${numOfThreads} ${outputDir} ${parameters}`, (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                return;
            }

            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        });
    });
};

/**
 * @fn stopExecution
 * @desc Interrupts the currently executed job.
 * @param callback {Function} Function called after execution. callback(error, status)
 */
JobExecutorPython.prototype.stopExecution = function(callback) {
    this._callback = callback;
    this._kill();
    // throw 'Should call _kill here';
};

module.exports = JobExecutorPython;
