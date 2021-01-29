const blogRouter = require('express').Router();
const Blog = require('../models/blog');

blogRouter.get('/', async (req, res) => {
  const blogs = await Blog.find({});
  res.json(blogs);
});

blogRouter.post('/', async (req, res, next) => {
  if (!req.body.title && !req.body.url) {
    res.status(400).end();
    return;
  }

  const blog = new Blog(req.body);

  try {
    const savedBlog = await blog.save();
    res.json(savedBlog);
  } catch (e) {
    next(e);
  }
});

blogRouter.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const blog = await Blog.findById(id);
    if (blog) {
      res.json(blog);
    } else {
      res.status(404).end();
    }
  } catch (e) {
    next(e);
  }
});

blogRouter.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { title, author, url, likes } = req.body;
  const update = { title, author, url, likes };

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(id, update, { new: true });
    res.json(updatedBlog);
  } catch (e) {
    next(e);
  }
});

blogRouter.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    await Blog.findByIdAndRemove(id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

module.exports = blogRouter;
