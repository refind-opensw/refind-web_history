var express = require('express');
const cheerio = require('cheerio');
const request = require('request');
const socket_io = require('socket.io')
const {PythonShell} = require('python-shell');
var router = express.Router();

var io = socket_io()
router.io = io

let defaultCats = {
  1: ["뉴스", "News"],
  2: ["스포츠", "Sport", "Sports"],
  3: ["게임", "Game", "Games"],
  4: ["음악", "Music", "Musics"],
  5: ["연예", "Actor", "Actors", "Movie", "Movies", "TV"],
  6: ["생활", "노하우", "리빙", "Living", "Know-how"],
  7: ["건강", "헬스", "Health", "Well-bing"],
  8: ["자동차", "Car", "Cars", "Auto", "Autos", "Automobils", "Vehicles", "Motorbikes"],
  9: ["기술", "IT", "컴퓨터", "스마트폰", "핸드폰", "Tech", "IT", "Computers", "Smartphone", "Cellphone"]
}

const getMainCatNum = (dStr, cats) => {
  let result = "0" // 초기 값은 기타 카테고리 
  Object.keys(cats).forEach(e => {
    if(cats[e].includes(dStr)) result = e;
  });
  return result;
}

// let options = {
//   mode: 'text',
//   pythonOptions: ['-u'],
//   scriptPath: 'pyscripts/',
//   args: ['www.google.com', '값1', '값2']
// }

// PythonShell.run('url_wordfreq_seeker.py', options, function(err, results) {
//   if(err) throw err;
//   console.log("실행 결과", results);
// });

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
    // // 정규표현식으로 태그 제거
    // var re = body.replace(/(<([^>]+)>)/ig, "");
    // res.send(re);
  });
});

router.post('/do_categorize', function(req, res, next) {
  const obj = JSON.parse(req.body.obj);
  console.log(obj)

  let options = {
    mode: 'text',
    pythonOptions: ['-u'],
    scriptPath: 'pyscripts/',
    args: [obj.url, '값1', '값2']
  }
  
  PythonShell.run('url_wordfreq_seeker.py', options, function(err, results) {
    if(err) {
      console.log("ERROR");
    }
    else {
      console.log("실행 결과", results);
      res.send({main: getMainCatNum(results[0], defaultCats), sub: `subcat_${getRandom(0, 15)}`, obj: obj});
    }
  });
});

router.io.on('connection', socket => { 
    console.log('connected');
    socket.on('categorized', data => {
      // Send to python!!
      console.log('received...', data);

    });
    socket.on('disconnect', () => {
      console.log('disconnected!!');
    });
});

pyshell.on('message', res => {
  // Send to client!!!
  router.io.emit('categorized', {"test": "testmsg"});
});

let pyshell = new PythonShell('pyscripts/test.py');
let init = false;

/* GET home page. */
router.get('/', function (req, res, next) {
  router.io.emit('categorized', {"test": "testmsg"});
  res.render('index', { title: 'Express' });
});

router.post('/ttt', function (req, res, next) {
  const url = req.body.url;

  pyshell.send(url);

  pyshell.on('message', function (message) {
    // received a message sent from the Python script (a simple "print" statement)
    console.log(message);
    //res.send({"요청url": url, "받은url": message});
    res.send("asfds");
  });

  pyshell.end(function (err) {
    if (err) throw err;
  });
});


module.exports = router;

function getRandom(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //최댓값도 포함, 최솟값도 포함
}