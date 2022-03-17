var express = require('express');
var router = express.Router();
var Course = require('../models').Course;
var User = require('../models').User;
const { asyncHandler } = require('../middleware/async-handler');
const { authenticateUser } = require('../middleware/auth-user');

/* Get all courses in relation to the Users table */
router.get('/', asyncHandler(async (req, res, next) => {
  const courses = await Course.findAll({
    attributes: {exclude: ['createdAt', 'updatedAt']},
    include: [
      {
        model: User,
        attributes: {exclude: ['createdAt', 'updatedAt']},
      },
    ],
  });
  if (courses) {
    res.status(200).json(courses);
  } else {
    res.status(404).json({message: "Courses not found"});
  }
}));

/* Get a specific course in relation to the user */
router.get('/:id', asyncHandler(async (req, res, next) => {
  const course = await Course.findOne({
    where: { id: req.params.id },
    attributes: {exclude: ['createdAt', 'updatedAt']},
    include: [
      {
        model: User,
        attributes: {exclude: ['createdAt', 'updatedAt']},
      },
    ],
  });
  if (course) {
    res.status(200).json(course);
  } else {
    res.status(404).json({message: "Course not found"});
  }
}));

/* Create a new course */
router.post('/', authenticateUser, asyncHandler(async (req, res, next) => {
  const course = await Course.create(req.body); 
  if (course) {
    res.setHeader('Location', '/courses/' + course.id);
    res.status(201).end();
  }
}));

/* Update an existing course if it is owned by the authenticated user */
router.put('/:id', authenticateUser, asyncHandler(async (req, res, next) => {
  var message = [];
  if (!req.body.title){
    var error = new Error();
    error.status = 400;
    message.push('A title is required');
  }
  if (!req.body.description){
    var error = new Error({status: 404, message: 'A description is required'});
    error.status = 400;
    message.push('A description is required');
  }
  if (error) {
    error.message = message;
    throw error;
  }
  const course = await Course.findByPk(req.params.id);
  if (course) {
    if (req.currentUser.id !== course.userId) {
      res.status(403).json({ message: 'You are not the owner of this course' });
    } else {
      await course.update(req.body);
      res.status(204).end();
    }
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
}));

/* Delete an existing course */
router.delete('/:id', authenticateUser, asyncHandler(async (req, res, next) => {
  const course = await Course.findByPk(req.params.id);
  if (course) {
    if (req.currentUser.id !== course.userId) {
      res.status(403).json({ message: 'You are not the owner of this course' });
    } else {
      await course.destroy();
      res.status(204).end();
    }
  } else {
    res.status(404).json({message: "Course not found"});
  }
}));

module.exports = router;
