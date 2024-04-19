const headers = {
  accept: 'application/json',
  Authorization: `Bearer ${process.env.MOVIE_API_KEY}`,
};

module.exports = function (app) {
  app.post('/movies/search', function (req, res) {
    const { title } = req.body;
    console.log('title: ', title);
    const url = `https://api.themoviedb.org/3/search/movie?include_adult&language=en-US&query=${title}`;
    console.log('url: ', url);
    fetch(url, { headers })
      .then((response) => response.json())
      .then((data) => {
        console.log('data: ', data);
        res.send(data);
      })
      .catch((error) => {
        console.log('error: ', error);
        res.send(error);
      });
  });
};
