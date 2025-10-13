const HeroSlide = require('../models/HeroSlide');
const MissionCard = require('../models/MissionCard');
const Person = require('../models/Person');
const Event = require('../models/Event');
const MediaBlog = require('../models/MediaBlog');
const ContactMessage = require('../models/ContactMessage');
const FAQ = require('../models/FAQ');
const About = require('../models/About');
const Benefit = require('../models/Benefit');
const GalleryItem = require('../models/GalleryItem');
const News = require('../models/News');
const fs = require('fs');
const path = require('path');
const User = require('../models/user.model');


// Helper function to delete file safely

// VERIFY USER (by userId)
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check required param
    if (!userId) {
      return sendResponse(res, false, 'User ID is required', null, 400);
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(res, false, 'User not found. Please check and try again.', null, 404);
    }

    // Update verification fields
    user.isVerified = true;
    user.phoneVerified = true;  // optional — depends on your flow
    user.emailVerified = true;  // optional
    await user.save();

    return sendResponse(
      res,
      true,
      'User verified successfully',
      {
        userId: user._id,
        isVerified: user.isVerified,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified
      },
      200
    );

  } catch (err) {
    console.error('Verify User error:', err);
    return sendResponse(
      res,
      false,
      'Internal server error occurred while verifying user. Please try again.',
      null,
      500
    );
  }
};


const deleteFile = (filePath) => {
  if (!filePath) return;
  const relative = filePath.replace(/^\/+/, '');
  const fullPath = path.join(process.cwd(), relative);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.error('Failed to delete file:', fullPath, err.message);
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

    return res.status(201).json({
      success: true,
      message: 'Hero slide created successfully',
      data: heroSlide,
      statusCode: 201
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      count: heroSlides.length,
      data: heroSlides,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: heroSlide,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    const updateData = {};
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof subtitle !== 'undefined') updateData.subtitle = subtitle;
    if (typeof order !== 'undefined') updateData.order = order;

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

    return res.status(200).json({
      success: true,
      message: 'Hero slide updated successfully',
      data: heroSlide,
      statusCode: 200
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: 'Hero slide deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(201).json({
      success: true,
      message: 'Mission card created successfully',
      data: missionCard,
      statusCode: 201
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      count: missionCards.length,
      data: missionCards,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: missionCard,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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
    const updateData = {};
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof subtitle !== 'undefined') updateData.subtitle = subtitle;
    if (typeof icon !== 'undefined') updateData.icon = icon;

    const missionCard = await MissionCard.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!missionCard) {
      return res.status(404).json({
        success: false,
        message: 'Mission card not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Mission card updated successfully',
      data: missionCard,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: 'Mission card deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(201).json({
      success: true,
      message: 'Person created successfully',
      data: person,
      statusCode: 201
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      count: persons.length,
      data: persons,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: person,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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
    const updateData = {};
    if (typeof name !== 'undefined') updateData.name = name;
    if (typeof role !== 'undefined') updateData.role = role;
    if (typeof about !== 'undefined') updateData.about = about;
    if (typeof order !== 'undefined') updateData.order = order;

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

    return res.status(200).json({
      success: true,
      message: 'Person updated successfully',
      data: person,
      statusCode: 200
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: 'Person deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event,
      statusCode: 201
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: event,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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
    const updateData = {};
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof subtitle !== 'undefined') updateData.subtitle = subtitle;
    if (typeof about !== 'undefined') updateData.about = about;
    if (typeof place !== 'undefined') updateData.place = place;
    if (typeof date !== 'undefined') updateData.date = date;

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

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event,
      statusCode: 200
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(201).json({
      success: true,
      message: 'Media blog created successfully',
      data: mediaBlog,
      statusCode: 201
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      count: mediaBlogs.length,
      data: mediaBlogs,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: mediaBlog,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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
    const updateData = {};
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof subtitle !== 'undefined') updateData.subtitle = subtitle;
    if (typeof about !== 'undefined') updateData.about = about;
    if (typeof link !== 'undefined') updateData.link = link;

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

    return res.status(200).json({
      success: true,
      message: 'Media blog updated successfully',
      data: mediaBlog,
      statusCode: 200
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: 'Media blog deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(201).json({
      success: true,
      message: 'Your message has been sent successfully. We will contact you soon!',
      data: contactMessage,
      statusCode: 201
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: message,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq,
      statusCode: 201
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: faq,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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
    const updateData = {};
    if (typeof question !== 'undefined') updateData.question = question;
    if (typeof answer !== 'undefined') updateData.answer = answer;
    if (typeof order !== 'undefined') updateData.order = order;

    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      data: about,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
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

    return res.status(200).json({
      success: true,
      message: 'About page deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting about page',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.createOrUpdateAbout = async (req, res) => {
  try {
    const { title, subtitle, content, contactDetails } = req.body;
    const updateData = {};

    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof subtitle !== 'undefined') updateData.subtitle = subtitle;
    if (typeof content !== 'undefined') updateData.content = content;

    if (typeof contactDetails !== 'undefined') {
      if (typeof contactDetails === 'string') {
        try {
          updateData.contactDetails = JSON.parse(contactDetails);
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: 'Invalid contactDetails JSON',
            error: err.message,
            statusCode: 400
          });
        }
      } else {
        updateData.contactDetails = contactDetails;
      }
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
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
      success: false,
      message: 'Error creating/updating about page',
      error: error.message,
      statusCode: 500
    });
  }
};

// ============================================
// BENEFIT CRUD (NEW)
// ============================================

exports.createBenefit = async (req, res) => {
  try {
    const { title, subtitle } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required',
        statusCode: 400
      });
    }

    const benefit = new Benefit({
      title,
      subtitle
    });

    await benefit.save();

    return res.status(201).json({
      success: true,
      message: 'Benefit created successfully',
      data: benefit,
      statusCode: 201
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating benefit',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAllBenefits = async (req, res) => {
  try {
    const benefits = await Benefit.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: benefits.length,
      data: benefits,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching benefits',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getBenefitById = async (req, res) => {
  try {
    const benefit = await Benefit.findById(req.params.id);

    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: 'Benefit not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      data: benefit,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching benefit',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.updateBenefit = async (req, res) => {
  try {
    const { title, subtitle } = req.body;
    const updateData = {};
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof subtitle !== 'undefined') updateData.subtitle = subtitle;

    const benefit = await Benefit.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: 'Benefit not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Benefit updated successfully',
      data: benefit,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating benefit',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deleteBenefit = async (req, res) => {
  try {
    const benefit = await Benefit.findByIdAndDelete(req.params.id);

    if (!benefit) {
      return res.status(404).json({
        success: false,
        message: 'Benefit not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Benefit deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting benefit',
      error: error.message,
      statusCode: 500
    });
  }
};

// ============================================
// GALLERY CRUD (NEW)
// ============================================

exports.createGalleryItem = async (req, res) => {
  try {
    const { title } = req.body;
    const image = getImagePath(req.file);

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Image is required',
        statusCode: 400
      });
    }

    const galleryItem = new GalleryItem({
      title,
      image
    });

    await galleryItem.save();

    return res.status(201).json({
      success: true,
      message: 'Gallery item created successfully',
      data: galleryItem,
      statusCode: 201
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
      success: false,
      message: 'Error creating gallery item',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAllGalleryItems = async (req, res) => {
  try {
    const galleryItems = await GalleryItem.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: galleryItems.length,
      data: galleryItems,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching gallery items',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getGalleryItemById = async (req, res) => {
  try {
    const galleryItem = await GalleryItem.findById(req.params.id);

    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      data: galleryItem,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching gallery item',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.updateGalleryItem = async (req, res) => {
  try {
    const { title } = req.body;
    const updateData = {};
    if (typeof title !== 'undefined') updateData.title = title;

    if (req.file) {
      const oldItem = await GalleryItem.findById(req.params.id);
      if (oldItem && oldItem.image) {
        deleteFile(oldItem.image);
      }
      updateData.image = getImagePath(req.file);
    }

    const galleryItem = await GalleryItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!galleryItem) {
      if (req.file) deleteFile(`/images/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Gallery item updated successfully',
      data: galleryItem,
      statusCode: 200
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
      success: false,
      message: 'Error updating gallery item',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deleteGalleryItem = async (req, res) => {
  try {
    const galleryItem = await GalleryItem.findByIdAndDelete(req.params.id);

    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: 'Gallery item not found',
        statusCode: 404
      });
    }

    if (galleryItem.image) {
      deleteFile(galleryItem.image);
    }

    return res.status(200).json({
      success: true,
      message: 'Gallery item deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting gallery item',
      error: error.message,
      statusCode: 500
    });
  }
};

// ============================================
// NEWS CRUD (NEW)
// ============================================

exports.createNews = async (req, res) => {
  try {
    const { title, about, date, category } = req.body;
    const image = getImagePath(req.file);

    if (!title) {
      if (req.file) deleteFile(`/images/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: 'Title is required',
        statusCode: 400
      });
    }

    const news = new News({
      title,
      about,
      image,
      date,
      category: category || 'general'
    });

    await news.save();

    return res.status(201).json({
      success: true,
      message: 'News created successfully',
      data: news,
      statusCode: 201
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
      success: false,
      message: 'Error creating news',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getAllNews = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};

    const news = await News.find(filter).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: news.length,
      data: news,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching news',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      data: news,
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching news',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.updateNews = async (req, res) => {
  try {
    const { title, about, date, category } = req.body;
    const updateData = {};
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof about !== 'undefined') updateData.about = about;
    if (typeof date !== 'undefined') updateData.date = date;
    if (typeof category !== 'undefined') updateData.category = category;

    if (req.file) {
      const oldNews = await News.findById(req.params.id);
      if (oldNews && oldNews.image) {
        deleteFile(oldNews.image);
      }
      updateData.image = getImagePath(req.file);
    }

    const news = await News.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!news) {
      if (req.file) deleteFile(`/images/${req.file.filename}`);
      return res.status(404).json({
        success: false,
        message: 'News not found',
        statusCode: 404
      });
    }

    return res.status(200).json({
      success: true,
      message: 'News updated successfully',
      data: news,
      statusCode: 200
    });
  } catch (error) {
    if (req.file) deleteFile(`/images/${req.file.filename}`);
    return res.status(500).json({
      success: false,
      message: 'Error updating news',
      error: error.message,
      statusCode: 500
    });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News not found',
        statusCode: 404
      });
    }

    if (news.image) {
      deleteFile(news.image);
    }

    return res.status(200).json({
      success: true,
      message: 'News deleted successfully',
      statusCode: 200
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting news',
      error: error.message,
      statusCode: 500
    });
  }
};