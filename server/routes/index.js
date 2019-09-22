var express = require('express');
const cheerio = require('cheerio');
const request = require('request');
var router = express.Router();

// https://stackoverflow.com/questions/48347439/how-to-get-innertext-from-body-of-a-url

const getDOMFromURI = uri => {
  return new Promise((resolve, reject) => {
    request(uri, (err, res, body) => {
      if(err) {
        return reject(err);
      }
      return resolve(cheerio.load(body));
    });
   });
}

router.post('/getbodytext', function(req, res, next) {
  const url = req.body.url;
  request(url, function (error, response, body) {
    console.log('body:', body); // Print the HTML for the Google homepage.
    res.send(body);
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
