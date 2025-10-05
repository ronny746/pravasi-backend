const mongoose = require('mongoose');
// TODO: confirm what fields you want in About page. This is a flexible starting point.
const AboutSchema = new mongoose.Schema({
title: String,
subtitle: String,
content: String, // rich html or markdown
image: String,
contactDetails: {
address: String,
phone: String,
email: String
}
}, { timestamps: true });
module.exports = mongoose.model('About', AboutSchema);