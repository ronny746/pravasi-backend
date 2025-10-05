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
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// ============================================
// HERO SLIDE CRUD
// ============================================

// Create Hero Slide
exports.createHeroSlide = async (req, res) => {
  try {
    const { title, subtitle, order } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    
    const heroSlide = new HeroSlide({
      title,
      subtitle,
      image,
      order
    });
    
    await heroSlide.save();
    
    res.status(201).json({
      success: true,
      message: 'Hero slide created successfully',
      data: heroSlide
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error creating hero slide',
      error: error.message
    });
  }
};

// Get All Hero Slides
exports.getAllHeroSlides = async (req, res) => {
  try {
    const heroSlides = await HeroSlide.find().sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      count: heroSlides.length,
      data: heroSlides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hero slides',
      error: error.message
    });
  }
};

// Get Single Hero Slide
exports.getHeroSlideById = async (req, res) => {
  try {
    const heroSlide = await HeroSlide.findById(req.params.id);
    
    if (!heroSlide) {
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: heroSlide
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hero slide',
      error: error.message
    });
  }
};

// Update Hero Slide
exports.updateHeroSlide = async (req, res) => {
  try {
    const { title, subtitle, order } = req.body;
    const updateData = { title, subtitle, order };
    
    if (req.file) {
      const oldSlide = await HeroSlide.findById(req.params.id);
      if (oldSlide && oldSlide.image) {
        deleteFile(path.join('.', oldSlide.image));
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    const heroSlide = await HeroSlide.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!heroSlide) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Hero slide updated successfully',
      data: heroSlide
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error updating hero slide',
      error: error.message
    });
  }
};

// Delete Hero Slide
exports.deleteHeroSlide = async (req, res) => {
  try {
    const heroSlide = await HeroSlide.findByIdAndDelete(req.params.id);
    
    if (!heroSlide) {
      return res.status(404).json({
        success: false,
        message: 'Hero slide not found'
      });
    }
    
    if (heroSlide.image) {
      deleteFile(path.join('.', heroSlide.image));
    }
    
    res.status(200).json({
      success: true,
      message: 'Hero slide deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting hero slide',
      error: error.message
    });
  }
};

// ============================================
// MISSION CARD CRUD
// ============================================

// Create Mission Card
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
      data: missionCard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating mission card',
      error: error.message
    });
  }
};

// Get All Mission Cards
exports.getAllMissionCards = async (req, res) => {
  try {
    const missionCards = await MissionCard.find();
    
    res.status(200).json({
      success: true,
      count: missionCards.length,
      data: missionCards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching mission cards',
      error: error.message
    });
  }
};

// Get Single Mission Card
exports.getMissionCardById = async (req, res) => {
  try {
    const missionCard = await MissionCard.findById(req.params.id);
    
    if (!missionCard) {
      return res.status(404).json({
        success: false,
        message: 'Mission card not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: missionCard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching mission card',
      error: error.message
    });
  }
};

// Update Mission Card
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
        message: 'Mission card not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Mission card updated successfully',
      data: missionCard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating mission card',
      error: error.message
    });
  }
};

// Delete Mission Card
exports.deleteMissionCard = async (req, res) => {
  try {
    const missionCard = await MissionCard.findByIdAndDelete(req.params.id);
    
    if (!missionCard) {
      return res.status(404).json({
        success: false,
        message: 'Mission card not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Mission card deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting mission card',
      error: error.message
    });
  }
};

// ============================================
// PERSON (Founder & Members) CRUD
// ============================================

// Create Person
exports.createPerson = async (req, res) => {
  try {
    const { name, role, about, order } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (!name) {
      if (req.file) deleteFile(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }
    
    const person = new Person({
      name,
      role,
      image,
      about,
      order
    });
    
    await person.save();
    
    res.status(201).json({
      success: true,
      message: 'Person created successfully',
      data: person
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error creating person',
      error: error.message
    });
  }
};

// Get All Persons (with optional role filter)
exports.getAllPersons = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    
    const persons = await Person.find(filter).sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      count: persons.length,
      data: persons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching persons',
      error: error.message
    });
  }
};

// Get Single Person
exports.getPersonById = async (req, res) => {
  try {
    const person = await Person.findById(req.params.id);
    
    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: person
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching person',
      error: error.message
    });
  }
};

// Update Person
exports.updatePerson = async (req, res) => {
  try {
    const { name, role, about, order } = req.body;
    const updateData = { name, role, about, order };
    
    if (req.file) {
      const oldPerson = await Person.findById(req.params.id);
      if (oldPerson && oldPerson.image) {
        deleteFile(path.join('.', oldPerson.image));
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    const person = await Person.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!person) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Person updated successfully',
      data: person
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error updating person',
      error: error.message
    });
  }
};

// Delete Person
exports.deletePerson = async (req, res) => {
  try {
    const person = await Person.findByIdAndDelete(req.params.id);
    
    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }
    
    if (person.image) {
      deleteFile(path.join('.', person.image));
    }
    
    res.status(200).json({
      success: true,
      message: 'Person deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting person',
      error: error.message
    });
  }
};

// ============================================
// EVENT CRUD
// ============================================

// Create Event
exports.createEvent = async (req, res) => {
  try {
    const { title, subtitle, about, place, date } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    
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
      data: event
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
};

// Get All Events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};

// Get Single Event
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: error.message
    });
  }
};

// Update Event
exports.updateEvent = async (req, res) => {
  try {
    const { title, subtitle, about, place, date } = req.body;
    const updateData = { title, subtitle, about, place, date };
    
    if (req.file) {
      const oldEvent = await Event.findById(req.params.id);
      if (oldEvent && oldEvent.image) {
        deleteFile(path.join('.', oldEvent.image));
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
};

// Delete Event
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    if (event.image) {
      deleteFile(path.join('.', event.image));
    }
    
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
};

// ============================================
// MEDIA BLOG CRUD
// ============================================

// Create Media Blog
exports.createMediaBlog = async (req, res) => {
  try {
    const { title, subtitle, about, link } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    
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
      data: mediaBlog
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error creating media blog',
      error: error.message
    });
  }
};

// Get All Media Blogs
exports.getAllMediaBlogs = async (req, res) => {
  try {
    const mediaBlogs = await MediaBlog.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: mediaBlogs.length,
      data: mediaBlogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching media blogs',
      error: error.message
    });
  }
};

// Get Single Media Blog
exports.getMediaBlogById = async (req, res) => {
  try {
    const mediaBlog = await MediaBlog.findById(req.params.id);
    
    if (!mediaBlog) {
      return res.status(404).json({
        success: false,
        message: 'Media blog not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: mediaBlog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching media blog',
      error: error.message
    });
  }
};

// Update Media Blog
exports.updateMediaBlog = async (req, res) => {
  try {
    const { title, subtitle, about, link } = req.body;
    const updateData = { title, subtitle, about, link };
    
    if (req.file) {
      const oldBlog = await MediaBlog.findById(req.params.id);
      if (oldBlog && oldBlog.image) {
        deleteFile(path.join('.', oldBlog.image));
      }
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    const mediaBlog = await MediaBlog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!mediaBlog) {
      if (req.file) deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Media blog not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Media blog updated successfully',
      data: mediaBlog
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error updating media blog',
      error: error.message
    });
  }
};

// Delete Media Blog
exports.deleteMediaBlog = async (req, res) => {
  try {
    const mediaBlog = await MediaBlog.findByIdAndDelete(req.params.id);
    
    if (!mediaBlog) {
      return res.status(404).json({
        success: false,
        message: 'Media blog not found'
      });
    }
    
    if (mediaBlog.image) {
      deleteFile(path.join('.', mediaBlog.image));
    }
    
    res.status(200).json({
      success: true,
      message: 'Media blog deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting media blog',
      error: error.message
    });
  }
};

// ============================================
// CONTACT MESSAGE CRUD
// ============================================

// Create Contact Message (Public endpoint)
exports.createContactMessage = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required'
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
      data: contactMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Get All Contact Messages (Admin only)
exports.getAllContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contact messages',
      error: error.message
    });
  }
};

// Get Single Contact Message
exports.getContactMessageById = async (req, res) => {
  try {
    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching contact message',
      error: error.message
    });
  }
};

// Delete Contact Message
exports.deleteContactMessage = async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Contact message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting contact message',
      error: error.message
    });
  }
};

// ============================================
// FAQ CRUD
// ============================================

// Create FAQ
exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, order } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }
    
    const faq = new FAQ({
      question,
      answer,
      order
    });
    
    await faq.save();
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating FAQ',
      error: error.message
    });
  }
};

// Get All FAQs
exports.getAllFAQs = async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ order: 1 });
    
    res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching FAQs',
      error: error.message
    });
  }
};

// Get Single FAQ
exports.getFAQById = async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching FAQ',
      error: error.message
    });
  }
};

// Update FAQ
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
        message: 'FAQ not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating FAQ',
      error: error.message
    });
  }
};

// Delete FAQ
exports.deleteFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndDelete(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting FAQ',
      error: error.message
    });
  }
};

// ============================================
// ABOUT PAGE CRUD
// ============================================

// Create or Update About Page (Single document)
exports.createOrUpdateAbout = async (req, res) => {
  try {
    const { title, subtitle, content, contactDetails } = req.body;
    const updateData = { title, subtitle, content, contactDetails };
    
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }
    
    // Check if About document exists
    let about = await About.findOne();
    
    if (about) {
      // Delete old image if new one is uploaded
      if (req.file && about.image) {
        deleteFile(path.join('.', about.image));
      }
      
      // Update existing
      about = await About.findByIdAndUpdate(
        about._id,
        updateData,
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({
        success: true,
        message: 'About page updated successfully',
        data: about
      });
    } else {
      // Create new
      about = new About(updateData);
      await about.save();
      
      return res.status(201).json({
        success: true,
        message: 'About page created successfully',
        data: about
      });
    }
  } catch (error) {
    if (req.file) deleteFile(req.file.path);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating about page',
      error: error.message
    });
  }
};

// Get About Page
exports.getAbout = async (req, res) => {
  try {
    const about = await About.findOne();
    
    if (!about) {
      return res.status(404).json({
        success: false,
        message: 'About page not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: about
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching about page',
      error: error.message
    });
  }
};

// Delete About Page
exports.deleteAbout = async (req, res) => {
  try {
    const about = await About.findOneAndDelete();
    
    if (!about) {
      return res.status(404).json({
        success: false,
        message: 'About page not found'
      });
    }
    
    if (about.image) {
      deleteFile(path.join('.', about.image));
    }
    
    res.status(200).json({
      success: true,
      message: 'About page deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting about page',
      error: error.message
    });
  }
};