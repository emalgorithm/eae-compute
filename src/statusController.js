/**
 * @fn StatusController
 * @desc Controller to manage the service status
 * @param statusHelper Helper class to interact with status
 * @constructor
 */
function StatusController(statusHelper) {
    this._helper = statusHelper;

    // Bind member functions
    this.getStatus = StatusController.prototype.getStatus.bind(this);
	this.getFullStatus = StatusController.prototype.getFullStatus.bind(this);
}

/**
 * @fn getStatus
 * @desc HTTP method GET handler on this service status
 * @param __unused__req Express.js request object
 * @param res Express.js response object
 */
StatusController.prototype.getStatus = function(__unused__req, res) {
	res.status(200);
	res.json({ status: this._helper.getStatus() });
};

/**
 * @fn getFullStatus
 * @desc HTTP method GET handler on this service status & specifications
 * @param __unused__req Express.js request object
 * @param res Express.js response object
 */
StatusController.prototype.getFullStatus = function(__unused__req, res) {
	res.status(200);
	res.json(this._helper.getDataModel());
};

module.exports = StatusController;
