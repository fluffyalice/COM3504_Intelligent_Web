const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Comment = new Schema(
    {
        text: { type: String, required: true },
        name: { type: String, required: true, },
        date: { type: String },
        storyId: { type: mongoose.Schema.Types.ObjectId }
    }
);


Comment.set('toObject', { getters: true, virtuals: true });

module.exports = mongoose.model('Comment', Comment);
