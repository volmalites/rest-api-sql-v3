var express = require('express');
var bcrypt = require('bcryptjs');
var router = express.Router();
var User = require('../models').User;
const { asyncHandler } = require('../middleware/async-handler');
const { authenticateUser } = require('../middleware/auth-user');

/* Returns all users */
router.get('/', authenticateUser, asyncHandler(async (req, res, next) => {
  const users = await User.findAll({
    where: { id: req.currentUser.id },
    attributes: {exclude: ['password', 'createdAt', 'updatedAt']},
  });
  if (users) {
    res.status(200).json(users);
  } else {
    res.status(404).json({message: "Quotes not found"});
  }
}));

/* Creates a new user encrypting password */
router.post('/', asyncHandler(async (req, res, next) => {
  try {
    if (req.body.password) req.body.password = bcrypt.hashSync(req.body.password, 10);
    const user = await User.create(req.body); 
    if (user) {
      res.setHeader('Location', '/');
      res.status(201).end();
    }
  } catch(err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const errors = err.errors.map(error => error.message);
      res.status(400).json({ errors });
    } else {
      throw err;
    }
  }
}));

module.exports = router;
