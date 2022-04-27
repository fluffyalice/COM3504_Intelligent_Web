var express = require('express');
var router = express.Router();

var story = require('../controllers/stories');

/* GET stories listing. */
router.get('/stories', story.getAllStories)
    /*POST store */
    .post('/stories', story.saveStories);
    

module.exports = router;
