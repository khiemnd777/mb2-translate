const express = require('express');
const router = express.Router();
const homeController = require('./home-controller');
const uploadController = require('./upload-controller');

let routes = (app) => {
  router.get('/', homeController.getHome);
  router.post('/multiple-upload', uploadController.multipleUpload);
  return app.use('/', router);
};

module.exports = routes;
