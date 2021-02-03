const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../app');

const api = supertest(app);

const User = require('../models/user');
const helper = require('./test_helper');

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('somePass', 10);
    const user = new User({
      username: 'user1',
      passwordHash,
    });

    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'testUser',
      name: 'John Doe',
      password: 'hello',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd)
      .toHaveLength(usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    expect(usernames)
      .toContain(newUser.username);
  });
});

describe('when trying to create invalid user', () => {
  test('creation without a username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: '',
      name: 'John Doe',
      password: 'hello',
    };

    const user = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(user.body.error).toEqual('username of password is missing');
    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test('creation without a password', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'john',
      name: 'John Doe',
      password: '',
    };

    const user = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(user.body.error).toEqual('username of password is missing');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test('creation with a password containing less than 3 digits', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'john',
      name: 'John Doe',
      password: 'he',
    };

    const user = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(user.body.error).toEqual('password should contain at least 3 symbols');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test('creation with a username containing less than 3 digits', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'jo',
      name: 'John Doe',
      password: 'hello',
    };

    const user = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(user.body.error).toContain('User validation failed');

    const usersAtEnd = await helper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
