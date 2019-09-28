// 서버 주소(각자의 개발 환경에 맞춰 세팅할 것)
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

// 방문기록 가져오는 기본 함수 매핑
const getHistory = chrome.history.search;

// 분류 데이터 검증 및 구성 함수
const checkResultData = (objs, { resultData }) => {
    let _o = {};
    objs.forEach(({ catno, title, imgsrc }) => {
        resultData[catno] || (_o[catno] = { data: {}, imgsrc: imgsrc, title: title, length: 0 });
    });

    if (!!Object.keys(_o).length) localStorage.setItem("resultData", JSON.stringify(_o));
    window.resultData = _o

    return _o;
}

// 검색 및 분류
const categorize = {
    _reqTimes: 0,
    _resTimes: 0,
    _succeedReqs: 0,
    _failedReqs: 0,
    do(obj) {
        // 방문기록을 가져와서 url을 카테고리 분석 함수에 바동기 방식으로 전달
        getHistory(obj, data => {
            this._reqTimes = data.length;
            this._resTimes = 0;
            this._succeedReqs = 0;
            this._failedReqs = 0;
            if (this._reqTimes > 0) {
                window.resultData = {};
                initCard.forEach(({ catno, title, imgsrc }) => {
                    window.resultData[catno] || (window.resultData[catno] = { data: {}, title: title, imgsrc: imgsrc, length: 0 });
                });
            }
            data.forEach(page => {
                console.log(`${page.url} ==> `);
                // 카테고리 분석 함수 호출
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
function CoreCategorize(obj, to) { // to 변수는 현재는 사용하지 않음
    this.obj = obj;
    this.to = to || '';

    // post로 카테고리 분석 서버로 url 전송
    $.post(`${serverUrl}do_categorize${this.to}`,
        {
            obj: JSON.stringify(this.obj)
        },
        ({ main, sub, obj }) => {
            // 결과를 받아옴... main 은 해당 페이지의 대주제(정수), sub 는 소주제(문자열), obj 는 방문기록 페이지 데이터(url, 마지막 방문 날짜 등등 포함)
            let r = window.resultData[main].data[sub];
            if (!r) window.resultData[main].data[sub] = new Array();
            window.resultData[main].data[sub].push(obj);
            window.resultData[main].length++;
            $(`.extra.content[data-cat="${main}"]>p>span`).html(window.resultData[main].length);
            categorize.resTimes++;
            categorize.succeedReqs++;

            // 페이지 요청 수랑 응답 수가 일치할 때(모든 요청에 대한 응답이 완료되었을 때)
            if (categorize.resTimes === categorize.reqTimes) {
                // 모두 성공하였으면
                if (categorize.reqTimes === categorize.succeedReqs) {
                    console.log('뷰 갱신 및 데이터 저장');
                }
                // 일부 실패하였으면
                else {
                    console.log('일부 작업이 실패했습니다. 성공한 작업만 반영됩니다.');
                }
                // 로컬 저장소에 분류 결과 데이터 저장
                localStorage.setItem("resultData", JSON.stringify(window.resultData));
                $('.ui.active.dimmer').detach();
            }
        })
        .fail(() => {
            categorize.resTimes++;
            categorize.failedReqs++;
            if (categorize.resTimes === categorize.reqTimes) {
                console.log('일부 작업이 실패했습니다. 성공한 작업만 반영됩니다.');
                localStorage.setItem("resultData", JSON.stringify(window.resultData));
                $('.ui.active.dimmer').detach();
            }
        });
}

// 조회 및 분류 함수
const actionSearch = () => {
    const s = $('#date_from').calendar('get date');
    const e = $('#date_to').calendar('get date');
    s.setHours(0);
    s.setMinutes(0);
    s.setSeconds(0);
    s.setMilliseconds(0);
    e.setHours(23);
    e.setMinutes(59);
    e.setSeconds(59);
    e.setMilliseconds(999);

    const startTime = s.getTime();
    const endTime = e.getTime();

    $('.search-date > .s').html(millisToDate(startTime, '.'));
    $('.search-date > .e').html(millisToDate(endTime, '.'));

    $(document.body).append(`<div class="ui active dimmer"><div class="ui loader"></div></div>`);

    console.log(startTime, endTime);
    // 카테고리 분류 함수 호출
    categorize.do({ text: '', startTime: startTime, endTime: endTime, maxResults: 99999 });

    // 크롬 스토리지에 검색 날짜 저장
    chrome.storage.sync.set({
        searchDate: {
            start: startTime,
            end: endTime
        }
    });
}

// 대주제 양 옆 스크롤 대용 화살표 아이콘
const drags = {
    _container: $('main'),
    _left: undefined,
    _right: undefined,
    _isLeft: false,
    _isRight: false,
    _easing: "swing",
    _delay: 250,
    showLeft() {
        if (this._isLeft) return;
        const to = 0;
        this._isLeft = true;
        if (this.scrollH > 16
            && this._container.find('.ui.card').attr('data-level') === "main")
            setTimeout(() => { this._left.animate({ "left": to }, 250, this._easing) }, this._delay);
    },
    showRight() {
        if (this._isRight) return;
        const to = 0;
        this._isRight = true;
        if (this.scrollH < 892
            && this._container.find('.ui.card').attr('data-level') === "main")
            setTimeout(() => { this._right.animate({ "right": to }, 250, this._easing) }, this._delay);
    },
    hideLeft() {
        if (!this._isLeft) return;
        const to = "-48px";
        this._isLeft = false;
        setTimeout(() => { this._left.animate({ "left": to }, 250, this._easing) }, this._delay);
    },
    hideRight() {
        if (!this._isRight) return;
        const to = "-48px";
        this._isRight = false;
        setTimeout(() => { this._right.animate({ "right": to }, 250, this._easing) }, this._delay);
    },
    set container(v) {
        this._container = v;
    },
    get container() {
        return this._container;
    },
    set left(v) {
        this._left = $(v);
    },
    get left() {
        return this._left;
    },
    set right(v) {
        this._right = $(v);
    },
    get right() {
        return this._right;
    },
    set isLeft(v) {
        this._isLeft = $(v);
    },
    get isLeft() {
        return this._isLeft;
    },
    set isRight(v) {
        this._isRight = $(v);
    },
    get isRight() {
        return this._isRight;
    },
    set easing(v) {
        this._easing = v;
    },
    get easing() {
        return this._easing;
    },
    set delay(v) {
        this._delay = v;
    },
    get delay() {
        return this._delay;
    },
    get scrollH() {
        return this._container.scrollLeft();
    },
    get scrollV() {
        return this._container.scrollTop();
    }
}

// 항목 클릭시 함수 호출
const cardClick = e => {
    const target = $(e.target)
    const selected = target.attr('data-cat');
    const level = target.attr('data-level');
    const title = $('header > div > h2 > span');
    const prevBtn = $('#go_prev');
    const container = $('.ui.cards');
    let rLevel = "main";
    let data = null;
    let titleText = "";
    console.log(selected);
    console.log(level);
    console.log(target);

    if (level === "main") {
        rLevel = "sub";
        data = window.resultData[selected].data;
        if (Object.keys(data).length < 1) return;
        window.catMain = selected;
        titleText = window.resultData[selected].title;
        prevBtn.css({ "display": "inline-flex" });
        drags.hideLeft();
        drags.hideRight();
    }
    else if (level === "sub") {
        rLevel = "entries";
        data = window.resultData[window.catMain].data[selected];
        if (data.length < 1) return;
        window.catSub = selected;
        titleText = selected;
        prevBtn.css({ "display": "inline-flex" });
    }
    else if (level === "entries" || target.parents('.item').attr('data-level') === "entries") {
        prevBtn.css({ "display": "inline-flex" });
        if (target.parent().parent().attr('class') === "description") {
            console.log("클립보드에 복사되었습니다.", target.html());
            copyToClipboard(target.html());
        }
        else {
            const url = target.attr('class') === "item"
                ? target.find('.description > a > b').html()
                : target.parents('.item').find('.description > a > b').html();
            console.log(url);
            chrome.tabs.create({ url: url, selected: false });
        }

        return;
    }
    else {
        console.error("Error occurred while rendering...level is not defined.");
    }

    prevBtn.attr('prev-level', level);

    console.log(data);
    title.html(titleText);
    container.animate({ opacity: 0 }, 250, () => {
        cardRender(data, rLevel);
        container.animate({ opacity: 1 }, 250);
    });
}

// 항목 렌더링 함수
const cardRender = (data, level) => {
    const container = $('main > div');
    const main = $('main');
    let tmp = null;
    container.empty();
    if (Array.isArray(data)) {
        if (level === "entries") {
            main.scrollLeft(0);
            container.attr('class', 'list-container');
            container.css({ "width": "inherit" });
            main.css({ "overflow-x": "hidden", "overflow-y": "auto" });
            container.append('<div class="ui middle aligned selection celled list"></div>');
            for (let i = 0; i < data.length; i++) {
                $('.ui.list').append(`
                <div class="item" data-level="${level}">
                    <i class="eye icon" title="미리보기" data-html='<iframe src="${data[i].url}" width="360" height="260" frameborder="0"></iframe>'></i>
                    <div class="content">
                        <div class="header">${data[i].title}</div>
                        <div class="desc-container">
                            <div class="description" title="복사하려면 클릭하세요."><a><b>${data[i].url}</b></a></div>
                            <div class="lst-date" title="${millisToDateTime(data[i].lastVisitTime)}">${dateTimePrintEngine(new Date(), new Date(data[i].lastVisitTime))}</div>
                        </div>
                    </div>
                </div>`);
            }
            $('.eye.icon').popup({
                position: 'right center',
                hoverable: true,
                transition: 'fade up',
                delay: {
                    show: 300,
                    hide: 800
                }
            });
        }
        else {
            main.scrollTop(0);
            container.attr('class', 'ui ten cards');
            container.css({ "width": "220%" });
            main.css({ "overflow-y": "hidden", "overflow-x": "auto" });
            for (let i = 0; i < data.length; i++) {
                container.append(`
                <div class="ui link card" data-level="${level}" data-cat="${data[i].catno}">
                    <div class="content">
                        <div class="header">${data[i].title}</div>
                    </div>
                    ${data[i].catno === 0 || level != "main" ? '' : `
                        <div class="content">
                            <img src="${data[i].imgsrc}" alt="${data[i].title} 의 이미지" width="96px">
                        </div>
                    `}
                    <div class="extra content" data-cat="${data[i].catno}">
                        <p><span>NaN</span>건 검색됨</p>
                    </div>
                </div>`);
            }
        }
    }
    else {
        Object.keys(data).forEach((val, idx) => {
            const { title, imgsrc, length } = data[val];
            if (level === "main") {
                main.scrollTop(0);
                container.attr('class', 'ui ten cards');
                container.css({ "width": "220%" });
                main.css({ "overflow-y": "hidden", "overflow-x": "auto" });

                if (val == 0) tmp = `
                <div class="ui link card" data-level="${level}" data-cat="${val}">
                    <div class="content">
                        <div class="header">${title}</div>
                    </div>
                    ${val == 0 || level != "main" ? '' : `
                        <div class="content">
                            <img src="${imgsrc}" alt="${title} 의 이미지" width="96px">
                        </div>
                    `}
                    <div class="extra content" data-cat="${val}">
                        <p><span>${length}</span>건 검색됨</p>
                    </div>
                </div>`;

                else {
                    container.append(`
                    <div class="ui link card" data-level="${level}" data-cat="${val}">
                        <div class="content">
                            <div class="header">${title}</div>
                        </div>
                        ${val == 0 || level != "main" ? '' : `
                            <div class="content">
                                <img src="${imgsrc}" alt="${title} 의 이미지" width="96px">
                            </div>
                        `}
                        <div class="extra content" data-cat="${val}">
                            <p><span>${length}</span>건 검색됨</p>
                        </div>
                    </div>`);

                    if (idx === initCard.length - 1) container.append(tmp);
                }
            }
            else if (level === "sub") {
                main.scrollLeft(0);
                container.attr('class', 'ui five cards');
                container.css({ "width": "inherit" });
                main.css({ "overflow-x": "hidden", "overflow-y": "auto" });

                container.append(`
                <div class="ui link card" data-level="${level}" data-cat="${val}">
                    <div class="content">
                        <h4>${val}</h4>
                    </div>
                    ${val == 0 || level != "main" ? '' : `
                        <div class="content">
                            <img src="${imgsrc}" alt="${data.val} 의 이미지" width="96px">
                        </div>
                    `}
                    <div class="extra content" data-cat="${val}">
                        <p><span>${data[val].length}</span>건 검색됨</p>
                    </div>
                </div>`);
            }
        });
    }
}

// 뒤로가기
const goPrev = e => {
    const container = $('main > div');
    const target = $(e.target);
    const title = $('header > div > h2 > span');
    const prevBtn = $('#go_prev');
    const prevLevel = target.attr('prev-level');
    let data = null;

    if (prevLevel === "sub") {
        data = window.resultData[window.catMain].data;
        titleText = window.resultData[window.catMain].title;
        prevBtn.css({ "display": "inline-flex" });
        prevBtn.attr('prev-level', 'main');
        console.log(data);
    }
    else if (prevLevel === "main") {
        data = window.resultData;
        titleText = "대주제";
        prevBtn.css({ "display": "none" });
        prevBtn.attr('prev-level', 'none');
        console.log(data);
    }

    title.html(titleText);
    container.animate({ opacity: 0 }, 250, () => {
        cardRender(data, prevLevel);
        container.animate({ opacity: 1 }, 250);
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

// 날짜 출력 함수
function dateTimePrintEngine(current, writed) {
    var elapsed = (current.getTime() - writed.getTime()) / 1000;
    console.log(elapsed);

    if (elapsed < 60.0)
        return '방금 전';
    else if (elapsed >= 60 && elapsed < 60 * 60)
        return Math.floor((elapsed / 60)) + '분 전';
    else if (elapsed >= 60 * 60 && elapsed < 60 * 60 * 24)
        return Math.floor((elapsed / (60 * 60))) + '시간 전';
    else if (elapsed >= 60 * 60 * 24 && elapsed < 60 * 60 * 24 * 7)
        return Math.floor((elapsed / (60 * 60 * 24))) + '일 전';
    else {
        if (current.getFullYear() == writed.getFullYear())
            return (writed.getMonth() + 1) + '월 ' + writed.getDate() + '일';
        else
            return writed.getFullYear() + '년 ' + (writed.getMonth() + 1) + '월 ' + writed.getDate() + '일';
    }
}

// 자리수 0 채우기 함수 (날짜 출력 시 필요)
const pad = (n, width) => {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

// https://zetawiki.com/wiki/JavaScript_클립보드로_복사하기
// 클립보드 복사 함수
function copyToClipboard(val) {
    let t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = val;
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
}