const _ = require('lodash');

const dummy = (blogs) => 1;

const totalLikes = (blogs) => blogs.reduce((acc, value) => acc + value.likes, 0);

const favoriteBlog = (blogs) => blogs.reduce((acc, value) => {
  if (value.likes >= acc.likes) {
    const {
      title,
      author,
      likes,
    } = value;
    acc = {
      title,
      author,
      likes,
    };
  }
  return acc;
}, { likes: 0 });

const mostBlogs = (blogs) => {
  const groupedByAuthor = _.groupBy(blogs, 'author');
  const authorsAndBlogs = _.mapValues(groupedByAuthor, (authorBlogs) => authorBlogs.length);
  const name = _.maxBy(Object.keys(authorsAndBlogs), (o) => authorsAndBlogs[o]);

  return {
    author: name,
    blogs: authorsAndBlogs[name],
  };
};

const mostLikes = (blogs) => {
  const groupedByAuthor = _.groupBy(blogs, 'author');
  const authorsAndBlogs = _.mapValues(groupedByAuthor, (authorBlogs) =>
    authorBlogs.reduce((acc, item) => acc + item.likes, 0));
  const name = _.maxBy(Object.keys(authorsAndBlogs), (o) => authorsAndBlogs[o]);

  return {
    author: name,
    likes: authorsAndBlogs[name],
  };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
