let Story = require('../models/stories');

exports.getAllStories = async function(req, res) {
    let stories = await Story.find({});
    return res.json(stories);
}


exports.saveStories = function(req, res) {
    const { photo, text, title, date } = req.body;
    let story = new Story({
        photo, text, title, date
    });

    story.save()
        .then((results) => {
            console.log("object created: " + JSON.stringify(results));
            return res.json(results)
        })
        .catch((error) => {
            console.log(JSON.stringify(error));
            return res.status(500).json(error)
        });
}

