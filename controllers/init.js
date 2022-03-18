const mongoose = require('mongoose');
const Story = require('../models/stories');


exports.init = function() {
    // uncomment if you need to drop the database

    // Character.remove({}, function(err) {
    //    console.log('collection removed')
    // });

    const date = new Date(1908, 12, 1).getFullYear();
    let story = new Story({
        photo: 'tst',
        text: 'something',
        name: 'test',
        date
    });
    // console.log('dob: '+character.dob);

    story.save()
        .then((results) => {
            console.log("object created in init: " + JSON.stringify(results));
        })
        .catch((error) => {
            console.log(JSON.stringify(error));
        });
}

