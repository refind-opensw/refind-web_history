#-*- coding:utf-8 -*-
# 영문 형태소 분석 라이브러리
import nltk
# 영문 문장 분류기 라이브러리
# https://wikidocs.net/21698
from nltk.tokenize import sent_tokenize
# 영어 형태소 분석시 구분점 라이브러리
from nltk.corpus import stopwords

# 한글 형태소 분석 및 문장 분류기 라이브러리
from eunjeon import Mecab
from konlpy.tag import Kkma

# 문자열 분리를 위한 정규 표현식 라이브러리
import re

# 지금은 안쓰는 코드 추후 다양한 언어 지원 가능성을 위해서 남겨둠
# https://pypi.org/project/langdetect/ 문장에서 언어 감지
from langdetect import detect_langs
from langdetect import detect

# url을 열어 볼 수 있게 도와주는 라이브러리
import urllib

# url bodytext의 태그 제거를 도와주는 라이브러리
from bs4 import BeautifulSoup

# pandas dataframe 자료형을 사용하기 위함
import pandas as pd

# TfidfVectorizer를 사용하여 분류를 하기 위한 라이브러리
#https://datascienceschool.net/view-notebook/3e7aadbf88ed4f0d87a76f9ddc925d69/
from sklearn.feature_extraction.text import TfidfVectorizer

#성능 측정용
import time

# 영한 문서 구분 함수 한글이 30자 이상이면 한글문서로 구분
# https://frhyme.github.io/python-basic/korean_or_english/ 
def isEnglishOrKorean(input_s):
    
    k_count = 0
    e_count = 0
    for c in input_s:
        if ord('가') <= ord(c) <= ord('힣'):
            k_count+=1
        elif ord('a') <= ord(c.lower()) <= ord('z'):
            e_count+=1
    return "k" if k_count>30 else "e"

# mecab, kkma 이용 형태소 분석
#https://konlpy-ko.readthedocs.io/ko/v0.4.3/api/konlpy.tag/
def mecabFreqToDataFrame(text):
    #리스트에 넣기전 자료형 초기화
    sentence_token = []
    clean_tokens = []
    tagged = []
    allnoun = []
    #문장 분류
    kkma = Kkma()
    sentence_token=kkma.sentences(text)
    #형태소 분류
    mecab = Mecab()
    
    for i in range(0,len(sentence_token)):
        #명사 분류
        allnoun.append(" ".join(mecab.nouns(sentence_token[i])))
    
    return allnoun

# 한글 이외 언어 형태소분석
def elseFreqToDataFrame(text):
    #리스트에 넣기전 자료형 초기화
    sentence_token = []
    clean_tokens = []
    tagged = []
    allnoun = []
    #문장 분류
    sentence_token = sent_tokenize(text)
    #불용어 설정
    stop=set(stopwords.words('english'))
    # 토큰화한 문장을 각각 토큰화한후 명사만 뽑아 join한 결과를 각각 리스트에 저장
    for i in range(0,len(sentence_token)):
        tokens[i]=[tok for tok in sentence_token[i].split()]
        clean_tokens.append([tok for tok in tokens[i] if len(tok.lower())>1 and (tok.lower() not in stop)])
        tagged.append(nltk.pos_tag(clean_tokens[i]))
        #명사 분류
        allnoun.append(" ".join([word for word,pos in tagged[i] if pos in ['NN','NNP']]))
    
    return allnoun

# 시작 시간 저장
start = time.time()  

# url을 열기 위함
url = 'https://koalanlp.github.io/koalanlp/usage/PlatformInstall.html'
response=urllib.request.urlopen(url)
html=response.read()

# re 라이브러리를 통한 바디 텍스트를 띄어쓰기를 구분자로 토큰화
tokens=re.split('\W+',html.decode('utf-8'))

#Beautifulsoup 함수로 뷰티플스프 처리된 html파일을 clean에 저장
clean=BeautifulSoup(html,'html.parser',from_encoding='utf-8')
# 제목만 뽑아서 title_text에 저장
title_text = clean.find('title').get_text()
# 본문만 뽑아서 maintext변수에 저장
main_text = clean.find('body').get_text()

sentences=[]

# 한글 문서 형태소 변환
if isEnglishOrKorean(main_text)=="k":
    print ("한글문서입니다.")
    #제목 토큰화 시킨 것을 데이터프레임으로 변환
    title_data = mecabFreqToDataFrame(title_text)
    #문장단위로 형태소 분석
    sentences = mecabFreqToDataFrame(main_text)

# 한글 이외의 문서 형태소 변환
else:
    print("그 밖입니다.")
    #제목 토큰화 시킨 것을 데이터프레임으로 변환
    title_data = elseFreqToDataFrame(title_text)
    #문장단위로 형태소 분석
    sentences = elseFreqToDataFrame(main_text)

# TfidVectorizer기본값으로 설정
cv = TfidfVectorizer()

# URL문서에 맞게 학습
X = cv.fit_transform(sentences)

# 단어 이름을 배열에 저장
terms = cv.get_feature_names()

# 학습데이터를 돌아보며 같은 단어가 나오면 빈도율을 가산하여 sums배열에 저장
sums = X.sum(axis=0)

# 단어,빈도율 리스트 초기화
data = []

# terms와 매칭되는 sums를 리스트화 하여 data에 append하는 반복문
for col, term in enumerate(terms):
    data.append( (term, sums[0,col] ))

#data를 pd.DataFrame화 한후 빈도율 내림차순으로 정렬하고 1위의 값으로 빈도수 나누어줌
ranking = pd.DataFrame(data, columns=['term','rank'])
ranking = ranking.sort_values(["rank"], ascending=[False])
ranking = ranking.reset_index(drop=True)
ranking["rank"] = ranking["rank"]/ ranking.loc[0]['rank']

# 현재시각 - 시작시간 = 실행 시간
print("time :", time.time() - start)
# 랭킹 출력
ranking
