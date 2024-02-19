# MMA-WORK-CRAWLER

병무청 병역일터가 이용하기 불편해서 만든 공고 검색기입니다.

## 구조

병역일터 검색기는 다음과 같이 작동합니다.

1. `fetch.py`를 github action을 이용하여 하루에 두 번 실행합니다.
1. `fetch.py`는 병역일터 API와 웹사이트를 긁어와서 json을 만들고, `/front/data` 디렉터리에 `채용공고목록.json`으로 저장한 다음, 레포지토리에 푸쉬합니다.
1. 그 `채용공고목록.json`을 프론트엔드에서 통째로 읽어들이고, 써먹습니다.

백엔드 없이 DB를 통째로 프론트에 보내어 프론트에서 검색과 조회를 수행하는 구조입니다.

- Q. 왜 이렇게 만들었나요?

  - A. 백엔드를 두는 순간 관리 난도가 급상승해서요. 또, 댓글 기능 같은 게 없으면 백엔드를 둘 필요도 없다고 생각했습니다.