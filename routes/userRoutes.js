const express = require('express')
const authController = require('../controllers/authController')

const router = express.Router()

router.route('/sign-up').post(authController.signup)
router.route('/login').post(authController.login)
router.route('/favorites').get(authController.getFavorites)
router
  .route('/favorites/add/:id')
  .get(authController.protect, authController.addFavoriteMovies)
router
  .route('/favorites/remove/:id')
  .get(authController.protect, authController.removeFavoriteMovies)

router.route('/watch-list').get(authController.getWatchList)

router
  .route('/watch-list/add/:id')
  .get(authController.protect, authController.addToWatchList)

router
  .route('/watch-list/remove/:id')
  .get(authController.protect, authController.removeFromWatchList)

router
  .route('/upload/profile-img')
  .post(authController.protect, authController.uploadProfileImg)

router.route('/profile-img').get(authController.getProfileImg)
router.route('/search').post(authController.getUsers)

module.exports = router
