// 문서가 로드되었을 때
$(document).ready(e => {
    console.log("**** document loaded ****", "main.js");
});

// 방문기록 가져오는 기본 함수
const getHistory = () => {
    chrome.history.search({text: '', startTime: 0, endTime: 999999999999999, maxResults: 9999}, data => {
        console.log(data);
    });
}

// 방문기록 조회 시 날짜 및 시간을 밀리세컨드 단위로 환산해주는 함수 필요 (반대의 경우도 마찬가지!!)