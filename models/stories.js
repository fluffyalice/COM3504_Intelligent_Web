const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Story = new Schema(
    {
        image: { type: String, required: true },
        description: { type: String, required: true },
        title: { type: String, required: true, },
        author: { type: String, required: true, },
        date: { type: Date, required: true, }
    }
);


Story.set('toObject', { getters: true, virtuals: true });

module.exports = mongoose.model('Story', Story);
