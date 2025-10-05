const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { upload, handleMulterError } = require('../config/multer.config');

const { uploadSingle, handleMulterErrors } = require('../config/multer.config');


// ============================================
// HERO SLIDES ROUTES
// ============================================
router.post('/hero-slides', upload.single('image'), handleMulterError, adminController.createHeroSlide);
router.get('/hero-slides', adminController.getAllHeroSlides);
router.get('/hero-slides/:id', adminController.getHeroSlideById);
router.put('/hero-slides/:id', upload.single('image'), handleMulterError, adminController.updateHeroSlide);
router.delete('/hero-slides/:id', adminController.deleteHeroSlide);

// ============================================
// MISSION CARDS ROUTES
// ============================================
router.post('/mission-cards', adminController.createMissionCard);
router.get('/mission-cards', adminController.getAllMissionCards);
router.get('/mission-cards/:id', adminController.getMissionCardById);
router.put('/mission-cards/:id', adminController.updateMissionCard);
router.delete('/mission-cards/:id', adminController.deleteMissionCard);

// ============================================
// PERSONS ROUTES (Founders & Members)
// ============================================
router.post('/persons', upload.single('image'), handleMulterError, adminController.createPerson);
router.get('/persons', adminController.getAllPersons); // Query: ?role=Founder or ?role=Member
router.get('/persons/:id', adminController.getPersonById);
router.put('/persons/:id', upload.single('image'), handleMulterError, adminController.updatePerson);
router.delete('/persons/:id', adminController.deletePerson);

// ============================================
// EVENTS ROUTES
// ============================================
router.post('/events', upload.single('image'), handleMulterError, adminController.createEvent);
router.get('/events', adminController.getAllEvents);
router.get('/events/:id', adminController.getEventById);
router.put('/events/:id', upload.single('image'), handleMulterError, adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);

// ============================================
// MEDIA BLOGS ROUTES
// ============================================
router.post('/media-blogs', upload.single('image'), handleMulterError, adminController.createMediaBlog);
router.get('/media-blogs', adminController.getAllMediaBlogs);
router.get('/media-blogs/:id', adminController.getMediaBlogById);
router.put('/media-blogs/:id', upload.single('image'), handleMulterError, adminController.updateMediaBlog);
router.delete('/media-blogs/:id', adminController.deleteMediaBlog);

// ============================================
// CONTACT MESSAGES ROUTES
// ============================================
router.get('/contact-messages', adminController.getAllContactMessages);
router.get('/contact-messages/:id', adminController.getContactMessageById);
router.delete('/contact-messages/:id', adminController.deleteContactMessage);

// ============================================
// FAQ ROUTES
// ============================================
router.post('/faqs', adminController.createFAQ);
router.get('/faqs', adminController.getAllFAQs);
router.get('/faqs/:id', adminController.getFAQById);
router.put('/faqs/:id', adminController.updateFAQ);
router.delete('/faqs/:id', adminController.deleteFAQ);

// ============================================
// ABOUT PAGE ROUTES
// ============================================
router.post('/about', upload.single('image'), handleMulterError, adminController.createOrUpdateAbout);
router.put('/about', upload.single('image'), handleMulterError, adminController.createOrUpdateAbout);
router.get('/about', adminController.getAbout);
router.delete('/about', adminController.deleteAbout);

module.exports = router;