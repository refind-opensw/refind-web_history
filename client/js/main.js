// 문서가 로드되었을 때
$(document).ready(e => {
    console.log("**** document loaded ****", "main.js");

    // 초기 분류 데이터 값 세팅
    if (!localStorage.getItem("resultData")) {
        const tmp = { resultData: {} };
        console.log(checkResultData(initCard, tmp));
    }
    else {
        window.resultData = JSON.parse(localStorage.getItem("resultData"));
        console.log(checkResultData(initCard, window));
        window.resultData = JSON.parse(localStorage.getItem("resultData"));
    }

    // 크롬 스토리지에 사용자 고유 아이디, 검색 날짜 저장 및 불러오기
    chrome.storage.sync.get(data => {
        const { searchDate, refindGUID } = data;
        
        // if (!refindGUID) {
        //     const id = uuidv4();
        //     chrome.storage.sync.set({refindGUID: id});
        //     socket.emit('joinUser', id);
        // }
        // else {
        //     socket.emit('joinUser', refindGUID);
        // }

        if (!searchDate) {
            let s = new Date();
            let e = new Date();
            s.setHours(0);
            s.setMinutes(0);
            s.setSeconds(0);
            s.setMilliseconds(0);
            e.setHours(23);
            e.setMinutes(59);
            e.setSeconds(59);
            e.setMilliseconds(999);

            $('.search-date > .s').html(millisToDate(s.getTime(), '.'));
            $('.search-date > .e').html(millisToDate(e.getTime(), '.'));

            chrome.storage.sync.set({
                searchDate: {
                    start: s.getMilliseconds(),
                    end: s.getMilliseconds()
                }
            }, () => { window.searchDate = searchDate });
        }
        else {
            let s = new Date(searchDate.start);
            let e = new Date(searchDate.end);
            window.searchDate = searchDate;
            console.log(s, e);
            $('.search-date > .s').html(millisToDate(s.getTime(), '.'));
            $('.search-date > .e').html(millisToDate(e.getTime(), '.'));
            $('#date_from').calendar('set date', s);
            $('#date_to').calendar('set date', e);
        }
    });

    // 초기 저장된 분류 데이터 렌더링
    cardRender(window.resultData, "main");

    // 항목에 클릭 이벤트 등록
    $(document).on('click', '.ui.link.card', cardClick);
    $(document).on('click', '.ui.list > .item', cardClick);
    $(document).on('click', '#go_prev', goPrev);

    // 대주제 스크롤 화살표 아이콘 이벤트 등록
    drags.container = $('main');
    drags.left = '#drag_left';
    drags.right = '#drag_right';
    drags.container.mouseenter(() => { drags.showLeft(); drags.showRight(); });
    drags.container.mouseleave(() => { drags.hideLeft(); drags.hideRight(); });
    drags.container.scroll(() => {
        if (drags.container.scrollLeft() <= 16) drags.hideLeft();
        else drags.showLeft();
        if (drags.container.scrollLeft() >= 892) drags.hideRight();
        else drags.showRight();
    });

    // 세로 스크롤 시 가로 스크롤로 바인딩
    // https://cdnjs.cloudflare.com/ajax/libs/jquery-mousewheel/3.1.13/jquery.mousewheel.min.js
    // https://css-tricks.com/snippets/jquery/horz-scroll-with-mouse-wheel/
    drags.container.mousewheel(function (event, delta) {
        this.scrollLeft -= (delta * 1);
        event.preventDefault();
    });
    drags.left.mousedown(() => {
        const loop = setInterval(() => {
            drags.container.animate({
                scrollLeft: '-=25'
            }, 0, 'linear');
            if (drags.container.scrollLeft() <= 16) clearInterval(loop);
            else drags.left.mouseup(() => clearInterval(loop));
        }, 50);
    });
    drags.right.mousedown(() => {
        const loop = setInterval(() => {
            drags.container.animate({
                scrollLeft: '+=25'
            }, 0, 'linear');
            if (drags.container.scrollLeft() >= 892) clearInterval(loop);
            else drags.right.mouseup(() => clearInterval(loop));
        }, 50);
    })

    // 검색 날짜 선택기 초기화 표시 형식 지정
    $('#date_from').calendar({
        type: 'date',
        monthFirst: false,
        formatter: {
            date: function (date, settings) {
                if (!date) return '';
                const day = date.getDate();
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                return `${year}년 ${month}월 ${day}일`;
            }
        }
    });
    $('#date_to').calendar({
        type: 'date',
        monthFirst: false,
        formatter: {
            date: function (date, settings) {
                if (!date) return '';
                const day = date.getDate();
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                return `${year}년 ${month}월 ${day}일`;
            }
        }
    });

    // 검색 및 분류 버튼 클릭 이벤트 지정
    $(document).on('click', "#action_search", actionSearch);
});