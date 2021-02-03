const blogRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Blog = require('../models/blog');
const User = require('../models/user');

blogRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
  res.json(blogs);
});

blogRouter.post('/', async (req, res) => {
  const decodedToken = jwt.verify(req.token, process.env.SECRET);
  if (!req.token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' });
  }
  const user = await User.findById(decodedToken.id);

  if (!req.body.title && !req.body.url) {
    return res.status(400).end();
  }

  const blog = new Blog({ ...req.body, user: user.id });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog.id);
  await user.save();

  res.json(savedBlog);
});

blogRouter.get('/:id', async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);
  if (blog) {
    res.json(blog);
  } else {
    res.status(404).end();
  }
});

blogRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, author, url, likes } = req.body;
  const update = { title, author, url, likes };

  const updatedBlog = await Blog.findByIdAndUpdate(id, update, { new: true });
  res.json(updatedBlog);
});

blogRouter.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const decodedToken = jwt.verify(req.token, process.env.SECRET);
  if (!req.token || !decodedToken.id) {
    return res.status(401).json({ error: 'token missing or invalid' });
  }

  const blog = await Blog.findById(id);

  if (blog.user.toString() === decodedToken.id) {
    await Blog.findByIdAndRemove(id);
    res.status(204).end();
  } else {
    res.status(401).json({ error: 'post can be removed only by its creator' });
  }
});

module.exports = blogRouter;
