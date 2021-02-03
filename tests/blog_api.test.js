const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');

const api = supertest(app);
const Blog = require('../models/blog');
const User = require('../models/user');
const helper = require('./test_helper');

let token;
let userId;

beforeAll(async () => {
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('somePass', 10);
  const user = new User({
    username: 'user1',
    passwordHash,
  });

  const newUser = await user.save();
  userId = newUser._id;

  const response = await api
    .post('/api/login')
    .send({ username: 'user1', password: 'somePass' })
    .expect(200);

  token = response.body.token;
});

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogObjects = helper.initialBlogs
    .map((blog) => new Blog({ ...blog, user: userId }));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

describe('when there is initially some blogs saved', () => {
  test('all blogs are returned and format is JSON', async () => {
    const response = await api.get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body)
      .toHaveLength(helper.initialBlogs.length);
  });

  test('unique identifier property of the blog posts is named id', async () => {
    const response = await api.get('/api/blogs');

    expect(response.body[0].id)
      .toBeDefined();
  });
});

describe('addition of a new blog', () => {
  test('a valid blog post can be added', async () => {
    const newBlog = {
      title: 'Mock blog post',
      author: 'John Doe',
      url: 'https://jestjs.io/',
      likes: 0,
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogs = await helper.blogsInDb();

    const titles = blogs.map((r) => r.title);

    expect(blogs)
      .toHaveLength(helper.initialBlogs.length + 1);
    expect(titles)
      .toContain('Mock blog post');
  });

  test('likes === 0 if not present in newBlog', async () => {
    const newBlog = {
      title: 'Mock blog post',
      author: 'John Doe',
      url: 'https://jestjs.io/',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog);

    const response = await api.get('/api/blogs');
    const createdBlog = response.body.find((r) => r.title === newBlog.title);

    expect(createdBlog.likes)
      .toEqual(0);
  });

  test('should return 400 if title and URL are missing', async () => {
    const newBlog = {
      author: 'John Doe',
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(400);

    const blogs = await helper.blogsInDb();

    expect(blogs)
      .toHaveLength(helper.initialBlogs.length);
  });

  test('should return 401 if token is not provided', async () => {
    const newBlog = {
      title: 'Mock blog post',
      author: 'John Doe',
      url: 'https://jestjs.io/',
      likes: 0,
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401);
  });
});

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd)
      .toHaveLength(helper.initialBlogs.length - 1);

    const titles = blogsAtEnd.map((r) => r.title);

    expect(titles)
      .not
      .toContain(blogToDelete.title);
  });
});

describe('updating a blog', () => {
  test('update likes', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];
    const update = { ...blogToUpdate, likes: 42 };

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(update)
      .expect(200);

    const blogsAtEnd = await helper.blogsInDb();

    const updatedBlog = blogsAtEnd.find((blog) => blog.id === blogToUpdate.id);

    expect(updatedBlog).not.toEqual(blogToUpdate);
    expect(updatedBlog).toEqual(update);
  });
});

// additional tests same as in material's examples
describe('viewing a specific blog', () => {
  test('succeeds with a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb();

    const blogToView = blogsAtStart[0];

    const blog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const processedBlogToView = JSON.parse(JSON.stringify(blogToView));

    expect(blog.body).toEqual(processedBlogToView);
  });

  test('fails with statuscode 404 if blog does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId();

    await api
      .get(`/api/blogs/${validNonexistingId}`)
      .expect(404);
  });

  test('fails with statuscode 400 id is invalid', async () => {
    const invalidId = '5a3d5da59070081a82a3445';

    await api
      .get(`/api/blogs/${invalidId}`)
      .expect(400);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
