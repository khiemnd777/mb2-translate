const util = require('util');
const path = require('path');
const multer = require('multer');

var storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, path.join(`${__dirname}/../dist`));
  },
  filename: (req, file, callback) => {
    const match = ['text/xml', 'application/xml'];

    if (match.indexOf(file.mimetype) === -1) {
      var message = `${file.originalname} is invalid. Only accept xml files.`;
      return callback(message, null);
    }
    var filename = `${file.originalname}`;
    callback(null, filename);
  },
});

var uploadFiles = multer({ storage: storage }).array('multi-files', 10);
var uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;
