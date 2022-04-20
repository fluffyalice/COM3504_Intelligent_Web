var Story = require('../models/stories');
var fs = require('fs');
var path = require('path');

exports.getAllStories = async function(req, res) {
    // get all the stories from the database
    let stories = await Story.find({}, { '__v': 0 });
    // return the stories
    return res.json(stories);
}

// save the storu to the database
exports.saveStories = async function(req, res) {
    const { image, title, description, author, date } = req.body;
    // return error if any of the fields are empty
    if (!image || !title || !description || !author || !date) {
        let params = [];
        if (!image) params.push('image');
        if (!title) params.push('title');
        if (!description) params.push('description');
        if (!author) params.push('author');
        if (!date) params.push('date');
        return res.status(400).json({
            "message": `${params.join(',')} not provided`,
            "code": "missing_parameters"
        });
    }
    // return error if image is not a valid base64 format
    // validate base64
    if (!image.match(/^data:image\/(png|jpeg|jpg);base64,/)) {
        return res.status(400).json({
            "message": "invlaid image format or wrong image type(png jpeg jpg only)",
            "code": "wrong_parameters"
        });
    }
    // return error if date is not a valid YYYY-MM-DD format
    // validate date
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return res.status(400).json({
            "message": "invlaid date format",
            "code": "wrong_parameters"
        });
    }

    // extract the base64 data
    const base64Data = image.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    //    generate a fileanem
    const filename = `${Date.now()}.png`;
    // save the file to the static folder
    try {
        fs.writeFileSync(path.join(__basedir, 'public/images', filename), base64Data, 'base64');
    }
    catch (error) {
        console.log(error)
        return res.status(500).json(error)
    }
    // create a new story and save it to the database
    try {
        let story = new Story({
            title, description, author, date, image: 'images/' + filename
        });
        await story.save()
        // return the saved story
        return res.json(story)
    } catch (error) {
        console.log(error);
        return res.status(500).json(error)
    }
}
