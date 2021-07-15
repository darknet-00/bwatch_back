/* eslint-disable arrow-body-style */
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      avatar: req.body.avatar,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    })

    const token = signToken(newUser._id)
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          avatar: newUser.avatar,
        },
      },
    })
  } catch (err) {
    res.status(401).json({
      status: 'failed',
      token: 'User with such email already exists',
    })
  }
}

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(401).json({
      status: 'failure',
      token: 'Incorrect email or password',
    })
  }

  const user = await User.findOne({ email }).select('+password')

  if (!user || !(await user.correctPassword(password, user.password))) {
    res.status(401).json({
      status: 'failure',
      token: 'Incorrect email or password',
    })
  }

  const token = signToken(user._id)
  res.status(200).json({
    status: 'success',
    firstName: user.firstName,
    lastName: user.lastName,
    avatar: user.avatar,
    token,
  })
})

exports.protect = catchAsync(async (req, res, next) => {
  // Check if token is present in the header
  let token
  let decoded
  let freshUser

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }
  // console.log(token)

  if (!token) {
    return res.status(404).json({
      status: "You're  not logged in! Please log in to gain access",
    })
  }

  // Check if token is valid
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // console.log(decoded)
  } catch (err) {
    return res.status(403).json({
      status: 'Invalid token',
    })
  }

  // Check if user still exists
  // eslint-disable-next-line prefer-const
  freshUser = await User.findById(decoded.id)
  if (!freshUser) {
    return next(
      res.status(404).json({
        status: 'User does not exist',
      })
    )
  }

  // Check if user has recently changed password
  if (freshUser.changedPasswordAfter(decoded.iat) === true) {
    return next(
      res.status(404).json({
        status: 'Password has been recently changed',
      })
    )
  }

  req.user = freshUser
  // Grant access
  next()
})

exports.getFavorites = catchAsync(async (req, res, next) => {
  const data = await req.user.FavoriteMovies()

  if (data !== undefined) {
    return res.status(200).json({
      status: 'success',
      data,
    })
  }

  return res.status(404).json({
    status: 'failed',
  })
})

exports.addFavoriteMovies = catchAsync(async (req, res, next) => {
  // console.log(req.user)
  const userEmail = req.user.email
  const movieId = parseInt(req.params.id, 10)
  // const status = await req.user.addFavoriteMovie(req.params.id)
  const ids = Array.from(req.user.favMovies)
  console.log(ids[0])

  if (!ids.find((elem) => elem === movieId)) {
    await User.findOneAndUpdate(
      {
        email: userEmail,
      },
      {
        $push: {
          favMovies: movieId,
        },
      }
    )

    const status = 'success'
    if (status === 'success') {
      return res.status(200).json({
        status: 'success',
      })
    }
  }

  return res.status(404).json({
    status: 'failed, movie already added as favorite',
  })
})

exports.removeFavoriteMovies = catchAsync(async (req, res, next) => {
  // console.log(req.user)
  const userEmail = req.user.email
  const movieId = parseInt(req.params.id, 10)
  // const status = await req.user.addFavoriteMovie(req.params.id)
  const ids = Array.from(req.user.favMovies)
  // console.log(ids[0])

  if (ids.find((elem) => elem === movieId)) {
    await User.findOneAndUpdate(
      {
        email: userEmail,
      },
      {
        $pullAll: {
          favMovies: [movieId],
        },
      }
    )

    const status = 'success'
    if (status === 'success') {
      return res.status(200).json({
        status: 'success',
      })
    }
  }

  return res.status(404).json({
    status: 'failed, movie is not added as favorite',
  })
})
