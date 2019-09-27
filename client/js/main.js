// 문서가 로드되었을 때
$(document).ready(e => {
    console.log("**** document loaded ****", "main.js");

    if(!localStorage.getItem("resultData")) {
        const tmp = {resultData: {}}; 
        console.log(checkResultData(initCard, tmp));
    }
    else {
        window.resultData = JSON.parse(localStorage.getItem("resultData"));
        console.log(checkResultData(initCard, window));
        window.resultData = JSON.parse(localStorage.getItem("resultData"));
    }
    
    chrome.storage.sync.get(data => {
        const {searchDate} = data;
        
        if(!searchDate) {
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
            }, () => {window.searchDate = searchDate});
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

    cardRender(window.resultData, "main");

    $(document).on('click', '.ui.link.card', cardClick);
    $(document).on('click', '.ui.list > .item', cardClick);
    $(document).on('click', '#go_prev', goPrev);

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

    $(document).on('click', "#action_search", actionSearch);
});

// url로 bodytext 가져오기
const getBodyTxtFromUrl = url => {
    // getHistory();
    $.get(url, {}, data => {
        console.log(extTextFromHtmls(data, true).trim());
    });
}

// 방문기록 가져와서 텍스트 추출 (테스트 함수)
const getTextTestFunc = obj => {
    getHistory(obj, data => {
        data.forEach(page => {
            console.log(`${page.url} ==> `)
            getBodyTxtFromUrl(page.url);
        });
    });
}