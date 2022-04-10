const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Story = new Schema(
    {
        photo: { type: String, required: true },
        text: { type: String, required: true },
        title: { type: String, required: true, },
        date: { type: Date, required: true, }
    }
);


Story.set('toObject', { getters: true, virtuals: true });

module.exports = mongoose.model('Story', Story);
