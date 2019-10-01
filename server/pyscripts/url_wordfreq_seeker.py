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
# 문장 분류 라이브러리
import kss
# 지금은 안쓰는 코드 추후 다양한 언어 지원 가능성을 위해서 남겨둠
# https://pypi.org/project/langdetect/ 문장에서 언어 감지
from langdetect import detect_langs
from langdetect import detect
# url을 열어 볼 수 있게 도와주는 라이브러리
import urllib
from urllib import parse
# url bodytext의 태그 제거를 도와주는 라이브러리
from bs4 import BeautifulSoup
# pandas dataframe, numpy nparray 자료형을 사용하기 위함
import pandas as pd
import numpy as np
# TfidfVectorizer를 사용하여 분류를 하기 위한 라이브러리
#https://datascienceschool.net/view-notebook/3e7aadbf88ed4f0d87a76f9ddc925d69/
from sklearn.feature_extraction.text import TfidfVectorizer
# numpy,lda 라이브러리
import lda
# 딥러닝 관련(Word2Vec, model loading) 라이브러리
import gensim
#gensim KeyedVectorsmodel 불러오는 최신 라이브러리
from gensim.models.keyedvectors import KeyedVectors
#성능 측정용
import time

#URL을 읽어서 BeacutifulSoup로 크롤링 가능하게 만들어놓음
def readURLandParse(URL):
    hdr = {'User-Agent': 'Mozilla/5.0' }
    req = urllib.request.Request(url, headers = hdr)
    response = urllib.request.urlopen(req)
    html=response.read()
    #Beautifulsoup 함수로 뷰티플스프 처리된 html을 return
    return BeautifulSoup(html,'html.parser',from_encoding='utf-8')

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
    allnoun = []
    #문장 분류
    sentence_token=kss.split_sentences(text)
    for i in range(0,len(sentence_token)):
        #명사 분류
        allnoun.append(" ".join(mecab.nouns(sentence_token[i])))
    return allnoun

# 한글 이외 언어 형태소분석
def elseFreqToDataFrame(text, stop):
    #리스트에 넣기전 자료형 초기화
    sentence_token = []
    clean_tokens = []
    tagged = []
    allnoun = []
    tokens = []
    #문장 분류
    sentence_token = sent_tokenize(text)
    # 토큰화한 문장을 각각 토큰화한후 명사만 뽑아 join한 결과를 각각 리스트에 저장

    for i in range(0,len(sentence_token)):
        tokens.append([tok for tok in sentence_token[i].split()])
        clean_tokens.append([tok for tok in tokens[i] if len(tok.lower())>1 and (tok.lower() not in stop)])
        tagged.append(nltk.pos_tag(clean_tokens[i]))
        #명사 분류
        allnoun.append(" ".join([word for word,pos in tagged[i] if pos in ['NN','NNP']]))
    return allnoun


# LDA 튜토리얼 https://pypi.org/project/lda/
def makeTopicword_with_LDA(X):
    model = lda.LDA(n_topics=10, n_iter=10, random_state=10)
    # model.fit_transform(X) is also available
    model.fit(X.astype(int))
    # model.components_ also works
    return model.topic_word_

#Start

# 모델 프리 로딩
print("로오딩중!")
w2vmodelko = gensim.models.Word2Vec.load('ko.bin')
w2vmodelen = KeyedVectors.load_word2vec_format('en.bin', binary=True)
#형태소 분류
mecab = Mecab("/usr/local/lib/mecab/dic/mecab-ko-dic/")
# TfidVectorizer기본값으로 설정
cv = TfidfVectorizer()
print("로오딩완료!")
while 1:

    # url 정보 저장
    url = input()
    if url == "exit":
        break
    # 시작 시간 저장
    start = time.time()
    cnt = 0
    while (cnt < 10):
        try:
            cnt=cnt+1
            #URL을 읽어서 BeacutifulSoup로 크롤링 가능하게 만들어놓음
            clean = readURLandParse(url)
            # 제목만 뽑아서 title_text에 저장
            title_text = clean.find('title').get_text()
            # 본문만 뽑아서 main_text변수에 저장
            main_text = clean.find('body').get_text()
            break
        except Exception as e:
             print("에러가 발생했어요 : ",cnt, e)
             pass
    if cnt == 10:
        print("URL 크롤링 불가")
        top_topic = "기타"
        semi_topic = "미분류"
        continue
    if len(main_text) == 1:
        print ("보안이 철저한 문서군요.")
        print (main_text)
        top_topic = "기타"
        semi_topic = "미분류"
        continue
    # 한/영 문서 구분 함수
    whatlang = isEnglishOrKorean(main_text)
    # 형태소를 문장단위 리스트로 변환해서 담을 변수
    sentences=[]
    title = []
    # 한글 문서 형태소 변환
    if whatlang=="k":
        print ("한글문서입니다.")
        #문장단위로 형태소 분석
        sentences = mecabFreqToDataFrame(main_text)
        #한글 타이틀 텍스트 분석
        title=mecab.nouns(title_text)

    # 한글 이외의 문서 형태소 변환
    else:
        print("그 밖입니다.")
        #불용어 설정
        stop=set(stopwords.words('english'))
        #문장단위로 구절 분석
        sentences = elseFreqToDataFrame(main_text,stop)
        #영문 타이틀 텍스트 분석
        title_tokens = [tok for tok in title_text.split()]
        title_clean_tokens = [tok for tok in title_tokens if len(tok.lower())>1 and (tok.lower() not in stop)]
        title_tagged = nltk.pos_tag(title_clean_tokens)
        title = [word for word,pos in title_tagged if pos in ['NN','NNP']]

    #X의 배열엔 float값의 가중치가 들어가있으므로 정수값으로 변환해주기위해 100을 곱한다.
    X = cv.fit_transform(sentences).toarray()*100

    #TF-IDF에서 특장점이 가중치 높은 단어를 저장
    vocab = cv.get_feature_names()

    # LDA 튜토리얼 https://pypi.org/project/lda/
    topic_word = makeTopicword_with_LDA(X)

    # 토픽 열 개수 설정
    n_top_words = 10

    # 토픽 체크용 디버그 출력
    for i, topic_dist in enumerate(topic_word):
        topic_words = np.array(vocab)[np.argsort(topic_dist)][:-(n_top_words+1):-1]
        print('Topic {}: {}'.format(i, ' '.join(topic_words)))

    if whatlang == "k":
        our_topics = ["뉴스","헬스","생활","리빙","노하우","컴퓨터","스마트폰","자동차","역사","여행"
                      "핸드폰","건강","정보","스포츠","음악","연예","게임","방송","음식","동물","지역"]
        usingmodel = w2vmodelko
    else:
        our_topics = ["sports","game","music","broadcasting","health","vehicle","technic","history","trip","travel"
                      ,"car","animal","food","computer","automobile","news","life","geological","area"]
        usingmodel = w2vmodelen

    # 변수 초기화
    max_similarity = 0.0
    sum_similarity = np.zeros((1, len(our_topics)), dtype="f")

    #토픽과 대주제 대조 후 유사도 합연산
    for topic_dist in topic_word:
        topic_words = np.array(vocab)[np.argsort(topic_dist)][:-(n_top_words+1):-1]
        for i in range(len(our_topics)):
            for j in topic_words:
                try:
                    sum_similarity[0,i] += usingmodel.wv.similarity(j, our_topics[i])
                except KeyError:
                    sum_similarity[0,i] += 0.1
                    pass
    semi_topic = ""
    top_topic = ""
    semi_topic_similarity = 0

    # 합연산 결과 가장 유사도가 높은 주제 저장
    for l in range(len(our_topics)):
        if sum_similarity[0,l] > max_similarity:
            max_similarity = sum_similarity[0,l]
            top_topic = our_topics[l]
    if len(cv.vocabulary_) / max_similarity > 150:
        top_topic = "기타"
        semi_topic = "미분류"
    else:
        for i in range(len(our_topics)):
            for j in range(len(title)):
                try:
                    if semi_topic_similarity < usingmodel.wv.similarity(title[j], our_topics[i]):
                        semi_topic_similarity = usingmodel.wv.similarity(title[j], our_topics[i])
                        semi_topic = title[j]
                except KeyError:
                    semi_topic_similarity = 0.1
                    pass
    if semi_topic == "":
        semi_topic="미분류"
    print(len(cv.vocabulary_))
    print(max_similarity)
    print(top_topic)
    print(semi_topic)
    # 현재시각 - 시작시간 = 실행 시간
    end = time.time()
    print("time :", end - start)
