#-*- coding:utf-8 -*-
# 영문 형태소 분석 라이브러리
import nltk
# 영어 형태소 분석시 구분점이 되는 단어 라이브러리
from nltk.corpus import stopwords
# 한글 형태소 분석 라이브러리
from konlpy.tag import Twitter
from konlpy.tag import Kkma
from eunjeon import Mecab
# 문자열 분리를 위한 정규 표현식 라이브러리
import re

# https://pypi.org/project/langdetect/ 문장에서 언어 감지
from langdetect import detect_langs
from langdetect import detect

# url을 열어 볼 수 있게 도와줌
import urllib
# url bodytext의 태그 제거를 도와주는 라이브러리
from bs4 import BeautifulSoup

# pandas dataframe 자료형을 사용하기 위함
import pandas as pd
# matplotlib pandas dataframe 자료형을 표로 시각화
import matplotlib
import matplotlib.pyplot as plt

# 랜덤 함수 
import random

# 한글 형태소 명사 빈도수 확인을 위한 라이브러리
from collections import Counter

#성능 측정용
import time
start = time.time()  # 시작 시간 저장

# https://frhyme.github.io/python-basic/korean_or_english/ 영한 문서 구분 함수
def isEnglishOrKorean(input_s):
    
    k_count = 0
    e_count = 0
    for c in input_s:
        if ord('가') <= ord(c) <= ord('힣'):
            k_count+=1
        elif ord('a') <= ord(c.lower()) <= ord('z'):
            e_count+=1
    return "k" if k_count>30 else "e"

# https://dalulu.tistory.com/108 참고함
def twitterFreqToDataFrame(text):
    twitter = Twitter()
    
    #문서에서 명사 분류
    nouns = twitter.nouns(text)
    #각 명사의 숫자 세기
    count = Counter(nouns)
    
    tag_count = []
    tags = []
    
    #가장 많이 카운팅된 명사를 차례로 tags와 tag_count리스트에 추가
    for n, c in count.most_common(100):
        dics = {'tag': n, 'count': c}
        #글자 수 조건 2~49자
        if len(dics['tag']) >= 2 and len(tags) <= 49:
            tag_count.append(dics['count'])
            tags.append(dics['tag'])
    
    #어떤 텍스트가 형태소 분리됬는지 디버깅
    joined_text = " ".join(tags)
    print ("형태소 : ", joined_text)
    print ("언어 감지됨 : ", detect_langs(joined_text))
    
    #본문 토큰화 시킨 것을 데이터프레임으로 변환
    return pd.DataFrame({"Word": list(tags), "Frequency": list(tag_count)})

#꼬꼬마 이용 형태소 분석 https://ssoonidev.tistory.com/88 참고함 (nply보다 느림)
def kkmaFreqToDataFrame(text):
    kkma = Kkma()
    
    #문서에서 명사 분류
    nouns = list()
    #kkma.nouns(text)라는 함수가 있지만 결과가 좋지 못하므로 연산조건을 달리함
    pos = kkma.pos(text)
    for keyword, type in pos:
        if type =="NNG" or type =="NNP":
            nouns.append(keyword)
            
    #각 명사의 숫자 세기
    count = Counter(nouns)
    tag_count = []
    tags = []
    
    #가장 많이 카운팅된 명사를 차례로 tags와 tag_count리스트에 추가
    for n, c in count.most_common(100):
        dics = {'tag': n, 'count': c}
        #글자 수 조건 2~49자
        if len(dics['tag']) >= 2 and len(tags) <= 49:
            tag_count.append(dics['count'])
            tags.append(dics['tag'])
    
    #어떤 텍스트가 형태소 분리됬는지 디버깅
    joined_text = " ".join(tags)
    print ("형태소 : ", joined_text)
    print ("언어 감지됨 : ", detect_langs(joined_text))
    
    #본문 토큰화 시킨 것을 데이터프레임으로 변환
    return pd.DataFrame({"Word": list(tags), "Frequency": list(tag_count)})

#mecab 이용 형태소 분석 https://konlpy-ko.readthedocs.io/ko/v0.4.3/api/konlpy.tag/
def mecabFreqToDataFrame(text):
    mecab = Mecab("/usr/local/lib/mecab/dic/mecab-ko-dic/")
    
    #kkma.nouns(text)라는 함수가 있지만 결과가 좋지 못하므로 조건을 달리함
    nouns = mecab.nouns(text)

    #각 명사의 숫자 세기
    count = Counter(nouns)
    tag_count = []
    tags = []
    
    #가장 많이 카운팅된 명사를 차례로 tags와 tag_count리스트에 추가
    for n, c in count.most_common(100):
        dics = {'tag': n, 'count': c}
        #글자 수 조건 2~49자
        if len(dics['tag']) >= 2 and len(tags) <= 49:
            tag_count.append(dics['count'])
            tags.append(dics['tag'])
    
    #어떤 텍스트가 형태소 분리됬는지 디버깅
    joined_text = " ".join(tags)
    print ("형태소 : ", joined_text)
    print ("언어 감지됨 : ", detect_langs(joined_text))
    
    #본문 토큰화 시킨 것을 데이터프레임으로 변환
    return pd.DataFrame({"Word": list(tags), "Frequency": list(tag_count)})


# 한글 이외 언어 형태소분석
def elseFreqToDataFrame(text):
    # 토큰화
    tokens=[tok for tok in text.split()]

    #불용어 설정
    stop=set(stopwords.words('english','korean'))
    
    #불용어를 제외하여 clean_tokens에 저장 (영어는 불용어 제외하면 거의 명사)
    clean_tokens= [tok for tok in tokens if len(tok.lower())>1 and (tok.lower() not in stop)]
    
    #어떤 텍스트가 형태소 분리됬는지 디버깅
    joined_text = " ".join(clean_tokens)
    print ("형태소 : ", joined_text)
    print ("언어 감지됨 : ", detect_langs(joined_text))

    #불용어 제거된 단어 태깅
    tagged=nltk.pos_tag(clean_tokens)

    #명사 분류
    allnoun=[word for word,pos in tagged if pos in ['NN','NNP']]

    #명사 빈도수 세는 nltk함수 이용
    Freq_dist_nltk = nltk.FreqDist(allnoun)

    return pd.DataFrame(list(Freq_dist_nltk.items()), columns = ["Word","Frequency"])


# url을 열기 위함
url = 'https://datascienceschool.net/view-notebook/a49bde24674a46699639c1fa9bb7e213/'
response=urllib.request.urlopen(url)
html=response.read()

# re 라이브러리를 통한 바디 텍스트를 띄어쓰기를 구분자로 토큰화
tokens=re.split('\W+',html.decode('utf-8'))

#Beautifulsoup 함수로 뷰티플스프 처리된 html파일을 clean에 저장
clean=BeautifulSoup(html,'html.parser')

# 제목만 뽑아서 title_text에 저장
title_text = clean.find('title').string
# 본문만 뽑아서 maintext변수에 저장
main_text = clean.get_text()

# 한글 음절 빈도수로 한글문서 여부 체크
# 한글 문서 형태소 변환
if isEnglishOrKorean(main_text)=="k":
    print ("한글문서입니다.")
    #제목 토큰화 시킨 것을 데이터프레임으로 변환
    title_data = mecabFreqToDataFrame(title_text)
    #본문 토큰화 시킨 것을 데이터프레임으로 변환
    data = mecabFreqToDataFrame(main_text)

#한글 이외의 문서 형태소 변환
else:
    print("그 밖입니다.")
    #제목 토큰화 시킨 것을 데이터프레임으로 변환
    title_data = elseFreqToDataFrame(title_text)
    #본문 토큰화 시킨 것을 데이터프레임으로 변환
    data = elseFreqToDataFrame(main_text)

#각 데이터를 빈도수에 따라 정렬 head는 검색 범위 제한
data = data.sort_values(["Frequency"], ascending=[False]).head(30)
data = data.reset_index(drop=True)
title_data = title_data.sort_values(["Frequency"], ascending=[False]).head(30)
title_data = title_data.reset_index(drop=True)

# 성능 측정 코드
print("time :", time.time() - start)  # 현재시각 - 시작시간 = 실행 시간
data