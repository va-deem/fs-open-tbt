const bcrypt = require('bcrypt');
const userRouter = require('express').Router();
const User = require('../models/user');

userRouter.get('/', async (req, res) => {
  const users = await User.find({}).populate('blogs', { url: 1, title: 1, author: 1 });
  res.json(users);
});

userRouter.post('/', async (req, res) => {
  const { username, name, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'username of password is missing' });
    return;
  }

  if (password.length < 3) {
    res.status(400).json({ error: 'password should contain at least 3 symbols' });
    return;
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
  });

  const savedUser = await user.save();
  res.json(savedUser);
});

module.exports = userRouter;
