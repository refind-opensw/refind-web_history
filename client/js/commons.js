const serverUrl = "http://dev.chsain.com:3000/";

// 초기 대주제 데이터 구성
// 뉴스, 스포츠, 게임, 음악, 연예, 생활/노하우, 건강, 자동차, IT/기술, 기타
const initCard = [
    {
        title: "뉴스",
        catno: 1,
        imgsrc: "img/ic_cat_news.png"
    },
    {
        title: "스포츠",
        catno: 2,
        imgsrc: "img/ic_cat_sports.png"
    },
    {
        title: "게임",
        catno: 3,
        imgsrc: "img/ic_cat_game.png"
    },
    {
        title: "음악",
        catno: 4,
        imgsrc: "img/ic_cat_music.png"
    },
    {
        title: "연예",
        catno: 5,
        imgsrc: "img/ic_cat_tv.png"
    },
    {
        title: "생활/노하우",
        catno: 6,
        imgsrc: "img/ic_cat_knowhow.png"
    },
    {
        title: "건강",
        catno: 7,
        imgsrc: "img/ic_cat_health.png"
    },
    {
        title: "자동차",
        catno: 8,
        imgsrc: "img/ic_cat_car.png"
    },
    {
        title: "IT/기술",
        catno: 9,
        imgsrc: "img/ic_cat_tech.png"
    },
    {
        title: "기타",
        catno: 0,
        imgsrc: ""
    },
];

// chrome.storage.sync.set({
//     userWords: user
// });

// 방문기록 가져오는 기본 함수
const getHistory = chrome.history.search;
/*
    getHistory({text: '', maxResults: 10}, function(data) {
        data.forEach(function(page) {
            console.log(page);
        });
    });
*/

// 검색 및 분류
const categorize = {
    _reqTimes: 0,
    _resTimes: 0,
    _succeedReqs: 0,
    _failedReqs: 0,
    do(obj) {
        getHistory(obj, data => {
            this._reqTimes = data.length;
            this._resTimes = 0;
            this._succeedReqs = 0;
            this. _failedReqs = 0;
            if(this._reqTimes > 0) {
                window.resultData = {};
                initCard.forEach(({catno, title, imgsrc}) => {
                    window.resultData[catno] || (window.resultData[catno] = {data: {}, title: title, imgsrc: imgsrc, length: 0});
                });
            }
            data.forEach(page => {
                console.log(`${page.url} ==> `)
                new CoreCategorize(page);
            });
        });
    },
    set reqTimes(v) {
        this._reqTimes = v;
    },
    get reqTimes() {
        return this._reqTimes;
    },
    set resTimes(v) {
        this._resTimes = v;
    },
    get resTimes() {
        return this._resTimes;
    },
    set succeedReqs(v) {
        this._succeedReqs = v;
    },
    get succeedReqs() {
        return this._succeedReqs;
    },
    set failedReqs(v) {
        this._failedReqs = v;
    },
    get failedReqs() {
        return this._failedReqs;
    }
}

// 서버로 url을 분석하여 카테고리 분류 및 데이터 저장
function CoreCategorize(obj, to) {
    this.obj = obj;
    this.to = to || '';

    $.post(`${serverUrl}do_categorize${this.to}`,
    {
        obj: JSON.stringify(this.obj)
    }, 
    ({main, sub, obj}) => {
        // console.log({main, sub});
        let r = window.resultData[main].data[sub];
        if(!r) window.resultData[main].data[sub] = new Array();
        window.resultData[main].data[sub].push(obj);
        window.resultData[main].length++;
        $(`.extra.content[data-cat="${main}"]>p>span`).html(window.resultData[main].length);
        categorize.resTimes++;
        categorize.succeedReqs++;

        if(categorize.resTimes === categorize.reqTimes) {
            if(categorize.reqTimes === categorize.succeedReqs) {
                console.log('뷰 갱신 및 데이터 저장');
                chrome.storage.sync.set({resultData: window.resultData});
            }
            else {
                console.log('일부 작업이 실패했습니다. 성공한 작업만 반영됩니다.');
                chrome.storage.sync.set({resultData: window.resultData});
            }
        }
    })
    .fail(() => {
        categorize.resTimes++;
        categorize.failedReqs++;
        if(categorize.resTimes === categorize.reqTimes) {
            console.log('일부 작업이 실패했습니다. 성공한 작업만 반영됩니다.');
            chrome.storage.sync.set({resultData: window.resultData});
        }
    });
}

// html 스트링으로부터 text만 추출
// https://stackoverflow.com/questions/28899298/extract-the-text-out-of-html-string-using-javascript
const extTextFromHtmls = (s, space) => {
    let span = document.createElement('span');
    span.innerHTML = s;
    if (space) {
        let children = span.querySelectorAll('*');
        for (let i = 0; i < children.length; i++) {
            if (children[i].textContent)
                children[i].textContent += ' ';
            else
                children[i].innerText += ' ';
        }
    }
    return [span.textContent || span.innerText].toString().replace(/ +/g, ' ');
}

// 방문기록 조회 시 날짜 및 시간을 밀리세컨드 단위로 환산
const dateToMillis = dateTimeString => {
    const d = new Date(dateTimeString);
    return d.getTime();
}

// 밀리세컨드를 날짜 및 시간 스트링으로 변환
const millisToDateTime = millisecs => {
    const d = new Date(millisecs);
    const dtstring = `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)} ${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}:${pad(d.getSeconds(), 2)}`;
    return dtstring;
}

const millisToDate = (millisecs, separator) => {
    const d = new Date(millisecs);
    const _s = !separator ? '-' : separator;
    const dtstring = `${d.getFullYear()}${_s}${pad(d.getMonth() + 1, 2)}${_s}${pad(d.getDate(), 2)}`;
    return dtstring;
}

// 자리수 0 채우기 함수 (날짜 출력 시 필요)
const pad = (n, width) => {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}