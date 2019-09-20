// 문서가 로드되었을 때
$(document).ready(e => {
    console.log("**** document loaded ****", "main.js");
});

// 방문기록 가져오는 기본 함수
const getHistory = chrome.history.search;
/*
    getHistory({text: '', maxResults: 10}, function(data) {
        data.forEach(function(page) {
            console.log(page);
        });
    });
*/

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

// html 스트링으로부터 text만 추출
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
};

// 방문기록 조회 시 날짜 및 시간을 밀리세컨드 단위로 환산
const dateToMillis = dateTimeString => {
    const d = new Date(dateTimeString);
    return d.getTime();
}

// 밀리세컨드를 날짜 및 시간 스트링으로 변환
const millisToDate = millisecs => {
    const d = new Date(millisecs);
    const dtstring = `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)} ${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}:${pad(d.getSeconds(), 2)}`;
    return dtstring;
}

// 자리수 0 채우기 함수 (날짜 출력 시 필요)
const pad = (n, width) => {
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}