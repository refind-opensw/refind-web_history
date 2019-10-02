var express = require('express');
const socket_io = require('socket.io')
const { PythonShell } = require('python-shell');
var router = express.Router();

var io = socket_io()
router.io = io

let defaultCats = {
  1: ["뉴스", "소식", "발표", "시사", "국제", "국내", "News"],
  2: ["스포츠", "경기", "운동", "시합", "Sport", "Sports"],
  3: ["오락", "놀이", "엔터테인먼트", "게임", "Game", "Games"],
  4: ["음악", "노래", "작곡", "Music", "Musics"],
  5: ["방송", "연예", "Actor", "Actors", "Movie", "Movies", "TV"],
  6: ["생활", "노하우", "리빙", "Living", "Know-how"],
  7: ["건강", "웰빙", "피트니스", "라이프", "헬스", "Health", "Well-bing"],
  8: ["자동차", "오토바이", "탈것", "Car", "Cars", "Auto", "Autos", "Automobils", "Vehicles", "Motorbikes"],
  9: ["테크", "기술", "IT", "컴퓨터", "스마트폰", "핸드폰", "Tech", "technic", "IT", "Computers", "Smartphone", "Cellphone"]
}

const getMainCatNum = (dStr, cats) => {
  let result = "0" // 초기 값은 기타 카테고리 
  Object.keys(cats).forEach(e => {
    if (cats[e].includes(dStr)) result = e;
  });
  return result;
}

let pyshell = [
  new PythonShell('pyscripts/categorize.py'),
  new PythonShell('pyscripts/categorize.py')
];

const splter = "<!toArr@comd%^&splt^&%>";
this.uid = undefined;
this.tRequests = [{}];

router.io.on('connection', socket => {
  console.log('connected!');
  console.log("socket.....")
  console.log(socket.id);
  this.uid = socket.id;

  socket.on('categorize', ({ hId, url, obj, thread, tmout }) => {
    // Send to python!!
    console.log('received...', url, obj, thread);
    pyshell[thread].send(hId + splter + tmout + splter + url + splter + obj);
  });

  socket.on('disconnect', () => {
    console.log('disconnected!!');
  });
});

// Send to client!!!
for (let i = 0; i < pyshell.length; i++) {
  pyshell[i].on('message', res => {
    const f_tag = res.substring(0, 6);
    let comp = res.split(f_tag);
    comp.shift();
    comp = comp.join(f_tag);
    let results = comp.split(splter);

    if (f_tag === "data: ") {
      console.log(results);
      // 타임아웃 제어
      const articleId = JSON.parse(results[2])["id"];
      const currIdx = this.tRequests.findIndex(e => e.id === articleId);
      clearTimeout(this.tRequests[currIdx].tmout);
      this.tRequests.splice(currIdx, 1);

      router.io.to(this.uid).emit('categorized', {
        main: getMainCatNum(results[0], defaultCats),
        sub: results[1],
        obj: results[2]
      });
    }
    else if (f_tag === "tmrg: ") {
      console.log(results);
      const hId = results[0] + "";
      const tmout = parseInt(results[1]);
      // 타임아웃 추가
      this.tRequests.push({
        tmout: setTimeout(() => {
          console.log('ERR_TIMEOUT::' + hId);
          router.io.to(this.uid).emit('categorized', {
            main: "failed",
            sub: "failed",
            obj: `{"err": "ERR_TIMEOUT::${hId}"}`
          });
        }, tmout),

        id: hId
      });
    }
    else {
      console.log(res);
    }
  });
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;