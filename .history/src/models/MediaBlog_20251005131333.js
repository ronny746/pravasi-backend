const mongoose = require('mongoose');
const MediaBlogSchema = new mongoose.Schema({
title: String,
subtitle: String,
about: String,
image: String,
link: String
}, { timestamps: true });
module.exports = mongoose.model('MediaBlog', MediaBlogSchema);