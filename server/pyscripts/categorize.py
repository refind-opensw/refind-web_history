#-*- coding:utf-8 -*-
# 영문 자연어 처리 라이브러리
import nltk
# 영문 문장 분류 라이브러리
# https://wikidocs.net/21698
from nltk.tokenize import sent_tokenize
# 영어 자연어 처리시 구분점 추가 라이브러리
from nltk.corpus import stopwords
# 한글 형태소 분석 및 문장 분류기 라이브러리
from eunjeon import Mecab
# 한글 문장 분류 라이브러리
import kss
# url을 열어 볼 수 있게 도와주는 라이브러리
import urllib
from urllib import parse
# url bodytext의 태그 제거를 도와주는 라이브러리
from bs4 import BeautifulSoup
# numpy array 자료형을 사용하기 위함
import numpy as np
# TfidfVectorizer를 사용하여 분류를 하기 위한 라이브러리
#https://datascienceschool.net/view-notebook/3e7aadbf88ed4f0d87a76f9ddc925d69/
from sklearn.feature_extraction.text import TfidfVectorizer
# lda 라이브러리
import lda
# 딥러닝 관련(Word2Vec, model loading) 라이브러리
import gensim
#gensim KeyedVectorsmodel 불러오는 최신 라이브러리
from gensim.models.keyedvectors import KeyedVectors
#성능 측정용
import time

# lda시 행렬의 크기 전역 변수 선언
global n_top_words

# 지금은 안쓰는 라이브러리 추후 다양한 언어 지원 가능성을 위해서 남겨두었다.
# https://pypi.org/project/langdetect/ 문장에서 언어 감지
# from langdetect import detect_langs
# from langdetect import detect

# URL을 읽어서 BeacutifulSoup로 크롤링 가능하게 만들어주는 함수
def readURLandParse(URL):
    # User-Agent 헤더를 설정해 웹 크롤링 권한을 높여준다.
    hdr = {'User-Agent': 'Mozilla/5.0' }
    req = urllib.request.Request(url, headers = hdr)
    response = urllib.request.urlopen(req)
    html=response.read()
    #Beautifulsoup 함수로 뷰티플스프 처리된 html을 return
    return BeautifulSoup(html,'html.parser',from_encoding='utf-8')

# 영한 문서 구분 함수 한글이 30자 이상이면 한글문서로 구분하는 함수
# https://frhyme.github.io/python-basic/korean_or_english/
def isEnglishOrKorean(input_s):
    k_count = 0
    for c in input_s:
        if ord('가') <= ord(c) <= ord('힣'):
            k_count+=1
    return "k" if k_count>30 else "e"

# mecab, kss 이용 한글 형태소 분석하는 함수
#https://konlpy-ko.readthedocs.io/ko/v0.4.3/api/konlpy.tag/
def mecabFreqToDataFrame(text):
    # 리스트에 넣기전 자료형 초기화
    sentence_token = []
    allnoun = []
    # 문서를 문장 단위로 분리해 sentence_token 리스트에 저장
    sentence_token=kss.split_sentences(text)
    # 토큰화한 문장에서 명사만 뽑아 다시 join한 결과를 각각 리스트에 저장
    for i in range(0,len(sentence_token)):
        #명사 분류
        allnoun.append(" ".join(mecab.nouns(sentence_token[i])))
    return allnoun

# sent_tokenize, nltk 이용 한글 이외 자연어 분석하는 함수
def elseFreqToDataFrame(text, stop):
    #리스트에 넣기전 자료형 초기화
    sentence_token = []
    clean_tokens = []
    tagged = []
    allnoun = []
    tokens = []
    # 문서를 문장 단위로 분리해 sentence_token 리스트에 저장
    sentence_token = sent_tokenize(text)
    # 토큰화한 문장을 각각 토큰화한후 명사만 뽑아 join한 결과를 각각 리스트에 저장
    for i in range(0,len(sentence_token)):
        tokens.append([tok for tok in sentence_token[i].split()])
        clean_tokens.append([tok for tok in tokens[i] if len(tok.lower())>1 and (tok.lower() not in stop)])
        tagged.append(nltk.pos_tag(clean_tokens[i]))
        #명사 분류
        allnoun.append(" ".join([word for word,pos in tagged[i] if pos in ['NN','NNP']]))
    return allnoun

# lda 이용 단어들을 문서랑 비교해 어느 단어가 주제로 적합한지 선정해주는 함수
# https://pypi.org/project/lda/
def makeTopicword_with_LDA(tfidf_bow):
    model = lda.LDA(n_topics=n_top_words, n_iter=10, random_state=10)
    # lda 모델에 Tf-idf
    model.fit(tfidf_bow.astype(int))
    # model.components_ also works
    return model.topic_word_

#Start
# 노드에 넘겨주기 위한 변수 선언 및 초기화
splter = "<!toArr@comd%^&splt^&%>"

# 모델 프리 로딩
print("로오딩중!")
w2vmodelko = gensim.models.Word2Vec.load('ko.bin')
w2vmodelen = KeyedVectors.load_word2vec_format('en.bin', binary=True)
# 한글 형태소 분류함수 초기화
mecab = Mecab("/usr/local/lib/mecab/dic/mecab-ko-dic/")
# TfidVectorizer에 최소 가중치 빈도수인 min_df 설정 및 초기화
tfidf = TfidfVectorizer(min_df=0.025)
# lda시 행렬의 크기 전역 변수 조정
n_top_words = 10
print("로오딩완료!")

# 모델 로딩이 끝난 후 방문기록들을 대량으로 불러오기위해 반복하는 반복문
while 1:
    # url, obj 정보 저장
    data = input()
    datas = data.split(splter, maxsplit=4)
    hId = datas[0]
    tmout = datas[1]
    url = datas[2]
    obj = datas[3]

    # 타임아웃 등록
    print("tmrg: " + hId + splter + tmout)
    print("현재 분석 중..." + url + " && " + obj)
    
    if url == "exit":
        break
    # 성능 측정용 시작 시간 저장
    start = time.time()

    # url 탐색 재시도 횟수 측정용 변수 초기화
    cnt = 0
    while (cnt < 10):
        try:
            cnt=cnt+1
            # URL을 읽어서 BeacutifulSoup 객체로 변환 후 반환
            clean = readURLandParse(url)
            # 제목만 뽑아서 title_text에 저장
            title_text = clean.find('title').get_text()
            # 본문만 뽑아서 main_text변수에 저장
            main_text = clean.find('body').get_text()
            break
        except Exception as e:
             print("에러가 발생했어요 : ",cnt, e)
             pass
    # url 탐색 10번 재시도 할때까지 URL을 읽지 못했을때 에러 처리
    if cnt == 10:
        print("URL 크롤링 불가")
        top_topic = "기타"
        semi_topic = "미분류"
        print("data: " + top_topic + splter + semi_topic + splter + obj)
        continue
    
    # 한/영 문서 구분 함수의 결과를 whatlang 변수에 저장
    whatlang = isEnglishOrKorean(main_text)

    # 형태소를 문장단위 리스트로 변환해서 본문과 제목을 담을 리스트 선언
    sentences=[]
    title = []

    # 한글 문서 형태소 변환
    if whatlang=="k":
        print ("한글문서입니다.")
        # 문장 단위로 본문 형태소 분석
        sentences = mecabFreqToDataFrame(main_text)
        # 한글 제목 텍스트 분석
        title=mecab.nouns(title_text)
    # 한글 이외의 문서 형태소 변환
    else:
        print("그 밖입니다.")
        # 불용어 설정
        stop=set(stopwords.words('english'))
        # 문장 단위로 본문 분석
        sentences = elseFreqToDataFrame(main_text,stop)
        # 영문 제목 텍스트 분석
        title_tokens = [tok for tok in title_text.split()]
        title_clean_tokens = [tok for tok in title_tokens if len(tok.lower())>1 and (tok.lower() not in stop)]
        title_tagged = nltk.pos_tag(title_clean_tokens)
        title = [word for word,pos in title_tagged if pos in ['NN','NNP']]

    # X의 배열엔 float값의 가중치가 들어가있으므로 정수값으로 변환해주기위해 100을 곱한다.
    try :
        tfidf_bow = tfidf.fit_transform(sentences).toarray()*100
    except :
        print ("보안이 철저한 문서군요.")
        top_topic = "기타"
        semi_topic = "미분류"
        print("data: " + top_topic + splter + semi_topic + splter + obj)
        continue

    #TF-IDF에서 특장점이 가중치 높은 단어를 저장
    vocab = tfidf.get_feature_names()

    # LDA 튜토리얼 https://pypi.org/project/lda/
    topic_word = makeTopicword_with_LDA(tfidf_bow)

    # 관리자가 직접 선정한 한/영 선정주제군 2차원 리스트 초기화
    if whatlang == "k":
        our_topics = [["뉴스","소식","발표","시사","보도","방송"]
        ,["건강","라이프"]
        ,["노하우","리빙"]
        ,["게임","오락","놀이","엔터테인먼트"]
        ,["교육","학습"]
        ,["금융","경제"]
        ,["스포츠","경기"]
        ,["음식","식사","요리"]
        ,["지리","지역","현장","영역","영토"]
        ,["패션","옷","스타일"]
        ,["집","주거","부동산"]
        ,["자동차","오토바이","탈것","이동수단"]
        ,["동물","짐승","생물"]
        ,["음악","노래","뮤직"]]
        usingmodel = w2vmodelko
    else:
        our_topics = [["News","Announcement","Report","Broadcasting"]
        ,["Health","Life"]
        ,["knowhow","living"]
        ,["Game","Play","Entertainment"]
        ,["Education","Learning"]
        ,["Finance","Economy"]
        ,["sports","athletic"]
        ,["food","dinner","cooking"]
        ,["geography","region","field","area","territory"]
        ,["Fashion","Cloth","Style"]
        ,["House","Housing","Freety"]
        ,["car","autobi","move","automobile"]
        ,["Animal","beast","creature"]
        ,["music","sing","playing","instrument"]]
        usingmodel = w2vmodelen

    # 선정주제와 선별주제의 유사도의 합을 저장할 리스트 선언
    sum_similarity= []
    # 모든 주제의 합을 유사한 종류로 분류할 리스트 초기화
    sum_sum_similarity= [0]*len(our_topics)

    # 선정주제와 선별주제의 유사도의 합을 저장할 리스트 초기화
    for i in range(len(our_topics)):
        mylist = [0]*len(our_topics[i])
        sum_similarity.append(mylist)

    # 선정주제와 선별주제 대조 후 유사도 합연산
    for topic_dist in topic_word:
        topic_words = np.array(vocab)[np.argsort(topic_dist)][:-(n_top_words+1):-1]
        for i in range(len(our_topics)):
            for j in range(len(our_topics[i])):
                for k in topic_words:
                    try:
                        sum_similarity[i][j] += usingmodel.wv.similarity(k, our_topics[i][j])
                        sum_sum_similarity[i] += sum_similarity[i][j]
                    except KeyError:
                        # 선별주제가
                        sum_similarity[i][j] += 0.1
                        sum_sum_similarity[i] += 0.1
                        pass

    # 유사한 주제군으로 분류한 리스트 합의 평균값과 그 최대값 저장변수 초기화
    avg_sum_similarity = [0] *len(our_topics)
    max_sum_similarity = 0.0

    # 대주제 들어갈 변수 초기화
    top_topic = ""

    # 유사한 주제군으로 분류한 리스트 합의 평균값과 그 최대값 구하기
    for i in range(len(our_topics)):
        avg_sum_similarity[i] = sum_sum_similarity[i] / len(our_topics[i])
        if avg_sum_similarity[i] > max_sum_similarity:
            max_sum_similarity = avg_sum_similarity[i]
            # 유사한 주제군중 미리 선정한 리스트 0번째 자리의 주제로 대주제 선정
            top_topic = our_topics[i][0]

    # max_sum_similarity 변수 크기 조절
    max_sum_similarity /= n_top_words

    # 소주제 들어갈 변수 초기화
    semi_topic = ""

    # 소주제 유사도 변수 초기화
    semi_topic_similarity = 0

    # 문장 전체 (단어종류 / 유사도)가 가장 높은 주제군의 값이 일정 값을 넘어가지않으면
    # 분류가 충분하지 않다고 생각되므로 기타-미분류로 분류
    if len(tfidf.vocabulary_) / max_sum_similarity > 6:
        top_topic = "기타"
        semi_topic = "미분류"
    # 그렇지 않으면 정상적으로 분류
    else:
        for i in range(len(title)):
            try:                
                if semi_topic_similarity < usingmodel.wv.similarity(title[i], top_topic):
                    semi_topic_similarity = usingmodel.wv.similarity(title[i], top_topic)
                    semi_topic = title[i]
            # 제목에 있는 단어를 대조할 수 없을때 무시하는 예외처리
            except KeyError:
                if i!=0:
                    semi_topic = title[i-1]
                pass
    # 간혹 정상적으로 분류가 되지 않았을때 아래 미분류로 처리
    if semi_topic == "":
        semi_topic="미분류"
    # 노드에 대주제, 소주제, 오브젝트를 전달
    print("data: " + top_topic + splter + semi_topic + splter + obj)
    # 현재시각 - 시작시간 = 실행 시간
    end = time.time()
    print("time :", end - start)

