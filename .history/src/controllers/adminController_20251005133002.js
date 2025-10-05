const HeroSlide = require('../models/HeroSlide');
const MissionCard = require('../models/MissionCard');
const Person = require('../models/Person');
const Event = require('../models/Event');
const MediaBlog = require('../models/MediaBlog');
const ContactMessage = require('../models/ContactMessage');
const FAQ = require('../models/FAQ');
const About = require('../models/About');
const fs = require('fs');
const path = require('path');

// Helper function to delete file
const deleteFile = (filePath) => {
  if (filePath) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
};

// Helper to get image path
const getImagePath = (file) => {
  return file ? `/images/${file.filename}` : null;
};

// ============================================
// HERO SLIDE CRUD
// ============================================

exports.createHeroSlide = async (req, res) => {
  try {
    const { title, subtitle, order } = req.body;
    const image = getImagePath(req.file);
    
    const heroSlide = new HeroSlide({
      title,
      subtitle,
      image,
      order: order || 0
    });
    
    await heroSlide.save();
    
    res.status(201).json({
      success: true,
      message: 'Hero slide created successfully',
      data: heroSlide,
      statusCode: 201
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating about page',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAbout = async (req, res) => {
  try {
    const about = await About.findOne();
    
    if (!about) {
      return res.status(404).json({
        success: false,
        message: 'About page not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      data: about,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching about page',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deleteAbout = async (req, res) => {
  try {
    const about = await About.findOneAndDelete();
    
    if (!about) {
      return res.status(404).json({
        success: false,
        message: 'About page not found',
        statusCode: 404
      });
    }
    
    if (about.image) {
      deleteFile(about.image);
    }
    
    res.status(200).json({
      success: true,
      message: 'About page deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting about page',
      error: error.message,
      statusCode: 500
    });
  }
}; {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: 'Error creating hero slide',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAllHeroSlides = async (req, res) => {
  try {
    const heroSlides = await HeroSlide.find().sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      count: heroSlides.length,
      data: heroSlides,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hero slides',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getHeroSlideById = async (req, res) => {
  try {
    const heroSlide = await HeroSlide.findById(req.params.id);
    
    if (!heroSlide) {
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      data: heroSlide,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hero slide',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.updateHeroSlide = async (req, res) => {
  try {
    const { title, subtitle, order } = req.body;
    const updateData = { title, subtitle, order };
    
    if (req.file) {
      const oldSlide = await HeroSlide.findById(req.params.id);
      if (oldSlide && oldSlide.image) {
        deleteFile(oldSlide.image);
      }
      updateData.image = getImagePath(req.file);
    }
    
    const heroSlide = await HeroSlide.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!heroSlide) {
      if (req.file) deleteFile(`/images/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Hero slide updated successfully',
      data: heroSlide,
      statusCode: 200
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: 'Error updating hero slide',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deleteHeroSlide = async (req, res) => {
  try {
    const heroSlide = await HeroSlide.findByIdAndDelete(req.params.id);
    
    if (!heroSlide) {
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found',
        statusCode: 404
      });
    }
    
    if (heroSlide.image) {
      deleteFile(heroSlide.image);
    }
    
    res.status(200).json({
      success: true,
      message: 'Hero slide deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting hero slide',
      error: error.message,
      statusCode: 500
    });
  }
};

// ============================================
// MISSION CARD CRUD
// ============================================

exports.createMissionCard = async (req, res) => {
  try {
    const { title, subtitle, icon } = req.body;
    
    const missionCard = new MissionCard({
      title,
      subtitle,
      icon
    });
    
    await missionCard.save();
    
    res.status(201).json({
      success: true,
      message: 'Mission card created successfully',
      data: missionCard,
      statusCode: 201
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating mission card',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAllMissionCards = async (req, res) => {
  try {
    const missionCards = await MissionCard.find();
    
    res.status(200).json({
      success: true,
      count: missionCards.length,
      data: missionCards,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching mission cards',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getMissionCardById = async (req, res) => {
  try {
    const missionCard = await MissionCard.findById(req.params.id);
    
    if (!missionCard) {
      return res.status(404).json({
        success: false,
        message: 'Mission card not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      data: missionCard,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching mission card',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.updateMissionCard = async (req, res) => {
  try {
    const { title, subtitle, icon } = req.body;
    
    const missionCard = await MissionCard.findByIdAndUpdate(
      req.params.id,
      { title, subtitle, icon },
      { new: true, runValidators: true }
    );
    
    if (!missionCard) {
      return res.status(404).json({
        success: false,
        message: 'Mission card not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Mission card updated successfully',
      data: missionCard,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating mission card',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deleteMissionCard = async (req, res) => {
  try {
    const missionCard = await MissionCard.findByIdAndDelete(req.params.id);
    
    if (!missionCard) {
      return res.status(404).json({
        success: false,
        message: 'Mission card not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Mission card deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting mission card',
      error: error.message,
      statusCode: 500
    });
  }
};

// ============================================
// PERSON (Founder & Members) CRUD
// ============================================

exports.createPerson = async (req, res) => {
  try {
    const { name, role, about, order } = req.body;
    const image = getImagePath(req.file);
    
    if (!name) {
      if (req.file) deleteFile(`/images/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: 'Name is required',
        statusCode: 400
      });
    }
    
    const person = new Person({
      name,
      role,
      image,
      about,
      order: order || 0
    });
    
    await person.save();
    
    res.status(201).json({
      success: true,
      message: 'Person created successfully',
      data: person,
      statusCode: 201
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: 'Error creating person',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAllPersons = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    
    const persons = await Person.find(filter).sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      count: persons.length,
      data: persons,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching persons',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getPersonById = async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    
    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      data: person,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching person',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.updatePerson = async (req, res) => {
  try {
    const { name, role, about, order } = req.body;
    const updateData = { name, role, about, order };
    
    if (req.file) {
      const oldPerson = await Person.findById(req.params.id);
      if (oldPerson && oldPerson.image) {
        deleteFile(oldPerson.image);
      }
      updateData.image = getImagePath(req.file);
    }
    
    const person = await Person.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!person) {
      if (req.file) deleteFile(`/images/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: 'Person not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Person updated successfully',
      data: person,
      statusCode: 200
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: 'Error updating person',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deletePerson = async (req, res) => {
  try {
    const person = await Person.findByIdAndDelete(req.params.id);
    
    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found',
        statusCode: 404
      });
    }
    
    if (person.image) {
      deleteFile(person.image);
    }
    
    res.status(200).json({
      success: true,
      message: 'Person deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting person',
      error: error.message,
      statusCode: 500
    });
  }
};

// ============================================
// EVENT CRUD
// ============================================

exports.createEvent = async (req, res) => {
  try {
    const { title, subtitle, about, place, date } = req.body;
    const image = getImagePath(req.file);
    
    const event = new Event({
      title,
      subtitle,
      about,
      place,
      image,
      date
    });
    
    await event.save();
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
      statusCode: 201
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      data: event,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { title, subtitle, about, place, date } = req.body;
    const updateData = { title, subtitle, about, place, date };
    
    if (req.file) {
      const oldEvent = await Event.findById(req.params.id);
      if (oldEvent && oldEvent.image) {
        deleteFile(oldEvent.image);
      }
      updateData.image = getImagePath(req.file);
    }
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      if (req.file) deleteFile(`/images/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
      statusCode: 200
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
        statusCode: 404
      });
    }
    
    if (event.image) {
      deleteFile(event.image);
    }
    
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message,
      statusCode: 500
    });
  }
};

// ============================================
// MEDIA BLOG CRUD
// ============================================

exports.createMediaBlog = async (req, res) => {
  try {
    const { title, subtitle, about, link } = req.body;
    const image = getImagePath(req.file);
    
    const mediaBlog = new MediaBlog({
      title,
      subtitle,
      about,
      image,
      link
    });
    
    await mediaBlog.save();
    
    res.status(201).json({
      success: true,
      message: 'Media blog created successfully',
      data: mediaBlog,
      statusCode: 201
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: 'Error creating media blog',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAllMediaBlogs = async (req, res) => {
  try {
    const mediaBlogs = await MediaBlog.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: mediaBlogs.length,
      data: mediaBlogs,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching media blogs',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getMediaBlogById = async (req, res) => {
  try {
    const mediaBlog = await MediaBlog.findById(req.params.id);
    
    if (!mediaBlog) {
      return res.status(404).json({
        success: false,
        message: 'Media blog not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      data: mediaBlog,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching media blog',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.updateMediaBlog = async (req, res) => {
  try {
    const { title, subtitle, about, link } = req.body;
    const updateData = { title, subtitle, about, link };
    
    if (req.file) {
      const oldBlog = await MediaBlog.findById(req.params.id);
      if (oldBlog && oldBlog.image) {
        deleteFile(oldBlog.image);
      }
      updateData.image = getImagePath(req.file);
    }
    
    const mediaBlog = await MediaBlog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!mediaBlog) {
      if (req.file) deleteFile(`/images/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: 'Media blog not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Media blog updated successfully',
      data: mediaBlog,
      statusCode: 200
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    res.status(500).json({
      success: false,
      message: 'Error updating media blog',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deleteMediaBlog = async (req, res) => {
  try {
    const mediaBlog = await MediaBlog.findByIdAndDelete(req.params.id);
    
    if (!mediaBlog) {
      return res.status(404).json({
        success: false,
        message: 'Media blog not found',
        statusCode: 404
      });
    }
    
    if (mediaBlog.image) {
      deleteFile(mediaBlog.image);
    }
    
    res.status(200).json({
      success: true,
      message: 'Media blog deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting media blog',
      error: error.message,
      statusCode: 500
    });
  }
};

// ============================================
// CONTACT MESSAGE CRUD
// ============================================

exports.createContactMessage = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required',
        statusCode: 400
      });
    }
    
    const contactMessage = new ContactMessage({
      name,
      email,
      phone,
      message
    });
    
    await contactMessage.save();
    
    res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will contact you soon!',
      data: contactMessage,
      statusCode: 201
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAllContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contact messages',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getContactMessageById = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      data: message,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contact message',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deleteContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting contact message',
      error: error.message,
      statusCode: 500
    });
  }
};

// ============================================
// FAQ CRUD
// ============================================

exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, order } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required',
        statusCode: 400
      });
    }
    
    const faq = new FAQ({
      question,
      answer,
      order: order || 0
    });
    
    await faq.save();
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq,
      statusCode: 201
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating FAQ',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching FAQs',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getFAQById = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      data: faq,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching FAQ',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    const { question, answer, order } = req.body;
    
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      { question, answer, order },
      { new: true, runValidators: true }
    );
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq,
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating FAQ',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
        statusCode: 404
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting FAQ',
      error: error.message,
      statusCode: 500
    });
  }
};

// ============================================
// ABOUT PAGE CRUD
// ============================================

exports.createOrUpdateAbout = async (req, res) => {
  try {
    const { title, subtitle, content, contactDetails } = req.body;
    const updateData = { title, subtitle, content };
    
    // Parse contactDetails if it's a string
    if (contactDetails) {
      updateData.contactDetails = typeof contactDetails === 'string' 
        ? JSON.parse(contactDetails) 
        : contactDetails;
    }
    
    if (req.file) {
      updateData.image = getImagePath(req.file);
    }
    
    let about = await About.findOne();
    
    if (about) {
      if (req.file && about.image) {
        deleteFile(about.image);
      }
      
      about = await About.findByIdAndUpdate(
        about._id,
        updateData,
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({
        success: true,
        message: 'About page updated successfully',
        data: about,
        statusCode: 200
      });
    } else {
      about = new About(updateData);
      await about.save();
      
      return res.status(201).json({
        success: true,
        message: 'About page created successfully',
        data: about,
        statusCode: 201
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting media blog',
      error: error.message,
      statusCode: 500
    });
  }
}
};