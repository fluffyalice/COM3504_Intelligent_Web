var express = require('express');
var router = express.Router();

var story = require('../controllers/stories');
// var initDB = require('../controllers/init');
// initDB.init();

/* GET stories listing. */
router.get('/stories', story.getAllStories)
    .post('/stories', story.saveStories);

module.exports = router;
