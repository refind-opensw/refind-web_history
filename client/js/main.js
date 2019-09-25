// 문서가 로드되었을 때
$(document).ready(e => {
    console.log("**** document loaded ****", "main.js");

    chrome.storage.sync.get(data => {
        const {resultData, searchDate} = data;

        if(!resultData) {
            chrome.storage.sync.set({
                resultData: {}
            }, () => {
                chrome.storage.sync.get(data => {
                    checkResultData(initCard, data, 0);
                });   
            });
        }
        else {
            checkResultData(initCard, data, 0);
            window.resultData = resultData;
        }
        
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

    $('main > .ui.cards').empty();
    for (let i = 0; i < initCard.length; i++) {
        $('main > .ui.cards').append(`
        <div class="ui link card">
            <div class="content">
                <div class="header">${initCard[i].title}</div>
            </div>
            ${initCard[i].catno === 0 ? '' : `
                <div class="content">
                    <img src="${initCard[i].imgsrc}" alt="${initCard[i].title} 의 이미지" width="96px">
                </div>
            `}
            <div class="extra content" data-cat="${initCard[i].catno}">
                <p><span>NaN</span>건 검색됨</p>
            </div>
        </div>
        `);
    }

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

    console.log(startTime, endTime);
    categorize.do({text: '', startTime: startTime, endTime: endTime, maxResults: 99999});
    
    chrome.storage.sync.set({
        searchDate: {
            start: startTime,
            end: endTime
        }
    });
}

const checkResultData = (objs, {resultData}) => {
    let _o = {};
    objs.forEach(({catno, title}) => {
        resultData[catno] || (_o[catno] = {data: {}, name: title});
    });

    if(!!Object.keys(_o).length) chrome.storage.sync.set({resultData: _o}, () => {window.resultData = _o});

    return _o;
}

const sendUrlAndGet = url => {
    $.post("http://dev.chsain.com:3000/getbodytext", {
        url: url
    }, data => {
        console.log(data);
    })
        .fail(msg => {
            alert("error!");
        })
}

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