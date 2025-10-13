const router = require('express').Router();
const adminController = require('../controllers/adminController');
const { uploadSingle, handleMulterErrors } = require('../config/multer.config');

// ============================================
// HERO SLIDES ROUTES
// ============================================
router.put('/verify/:userId', a);

router.post('/hero-slides', uploadSingle, handleMulterErrors, adminController.createHeroSlide);
router.get('/hero-slides', adminController.getAllHeroSlides);
router.get('/hero-slides/:id', adminController.getHeroSlideById);
router.put('/hero-slides/:id', uploadSingle, handleMulterErrors, adminController.updateHeroSlide);
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
router.post('/persons', uploadSingle, handleMulterErrors, adminController.createPerson);
router.get('/persons', adminController.getAllPersons); // Query: ?role=Founder or ?role=Member
router.get('/persons/:id', adminController.getPersonById);
router.put('/persons/:id', uploadSingle, handleMulterErrors, adminController.updatePerson);
router.delete('/persons/:id', adminController.deletePerson);

// ============================================
// EVENTS ROUTES
// ============================================
router.post('/events', uploadSingle, handleMulterErrors, adminController.createEvent);
router.get('/events', adminController.getAllEvents);
router.get('/events/:id', adminController.getEventById);
router.put('/events/:id', uploadSingle, handleMulterErrors, adminController.updateEvent);
router.delete('/events/:id', adminController.deleteEvent);

// ============================================
// MEDIA BLOGS ROUTES
// ============================================
router.post('/media-blogs', uploadSingle, handleMulterErrors, adminController.createMediaBlog);
router.get('/media-blogs', adminController.getAllMediaBlogs);
router.get('/media-blogs/:id', adminController.getMediaBlogById);
router.put('/media-blogs/:id', uploadSingle, handleMulterErrors, adminController.updateMediaBlog);
router.delete('/media-blogs/:id', adminController.deleteMediaBlog);

// ============================================
// CONTACT MESSAGES ROUTES
// ============================================
router.post('/contact-messages', adminController.createContactMessage);
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
router.post('/about', uploadSingle, handleMulterErrors, adminController.createOrUpdateAbout);
router.put('/about', uploadSingle, handleMulterErrors, adminController.createOrUpdateAbout);
router.get('/about', adminController.getAbout);
router.delete('/about', adminController.deleteAbout);

// ============================================
// BENEFITS ROUTES (NEW)
// ============================================
router.post('/benefits', adminController.createBenefit);
router.get('/benefits', adminController.getAllBenefits);
router.get('/benefits/:id', adminController.getBenefitById);
router.put('/benefits/:id', adminController.updateBenefit);
router.delete('/benefits/:id', adminController.deleteBenefit);

// ============================================
// GALLERY ROUTES (NEW)
// ============================================
router.post('/gallery', uploadSingle, handleMulterErrors, adminController.createGalleryItem);
router.get('/gallery', adminController.getAllGalleryItems);
router.get('/gallery/:id', adminController.getGalleryItemById);
router.put('/gallery/:id', uploadSingle, handleMulterErrors, adminController.updateGalleryItem);
router.delete('/gallery/:id', adminController.deleteGalleryItem);

// ============================================
// NEWS ROUTES (NEW)
// ============================================
router.post('/news', uploadSingle, handleMulterErrors, adminController.createNews);
router.get('/news', adminController.getAllNews); // Query: ?category=crime or ?category=donation
router.get('/news/:id', adminController.getNewsById);
router.put('/news/:id', uploadSingle, handleMulterErrors, adminController.updateNews);
router.delete('/news/:id', adminController.deleteNews);

module.exports = router;