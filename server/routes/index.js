var express = require('express');
const cheerio = require('cheerio');
const request = require('request');
const {PythonShell} = require('python-shell');
var router = express.Router();

let options = {
  mode: 'text',
  pythonOptions: ['-u'],
  scriptPath: 'pyscripts/',
  args: ['www.google.com', '값1', '값2']
}

PythonShell.run('test.py', options, function(err, results) {
  if(err) throw err;
  console.log("실행 결과", results);
});

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

//https://webisfree.com/2015-12-22/[%EC%9E%90%EB%B0%94%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8]-%EC%A0%95%EA%B7%9C%ED%91%9C%ED%98%84%EC%8B%9D%EC%9D%84-%EC%82%AC%EC%9A%A9%ED%95%98%EC%97%AC-%ED%83%9C%EA%B7%B8%EB%A7%8C-%EC%A0%9C%EA%B1%B0%ED%95%98%EA%B8%B0
router.post('/getbodytext', function(req, res, next) {
  const url = req.body.url;
  request(url, function (error, response, body) {
    console.log('body:', body); // Print the HTML for the Google homepage.
    // 정규표현식으로 태그 제거
    var re = body.replace(/(<([^>]+)>)/ig, "");
    res.send(re);
  });
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
