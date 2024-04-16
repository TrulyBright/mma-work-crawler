# MMA-WORK-CRAWLER

_English README is at the bottom._

병무청 병역일터가 간편하지 않아 직접 만든 공고 검색기입니다.

## 구조

병역일터 검색기는 다음과 같이 작동합니다.

1. `fetch.py`를 github action을 이용하여 시간당 1회 실행합니다.
1. `fetch.py`는 병역일터 API와 웹사이트를 긁어와서 json을 만들고, Github Gist에 `채용공고목록.json`으로 저장합니다.
1. 그 `채용공고목록.json`을 프론트엔드에서 통째로 읽어들이고, 써먹습니다.

백엔드 없이 DB를 통째로 프론트에 보내어 프론트에서 검색과 조회를 수행하는 구조입니다.

- Q. 왜 이렇게 만들었나요?
  - A. 백엔드를 두는 순간 관리 난도가 급상승해서요. 또, 댓글 기능 같은 게 없으면 백엔드를 둘 필요도 없다고 생각했습니다.

- Q. 프론트엔드는 어디에 호스팅하나요?
    - A. [Azure SWA](https://azure.microsoft.com/en-us/products/app-service/static)를 쓰고 있습니다. `채용공고목록.json`이 변경될 마다 CD를 합니다.

- Q. 커밋이 왜 이리 많은가요?
    - A. 과거에 Github Gist를 쓰지 않고 레포지토리를 데이터 저장소로 겸용했던 시절의 흔적입니다. 그때는 `채용공고목록.json`을 1시간에 1회 커밋하고 푸쉬한 다음 on:push 이벤트로 CD를 실행, 프론트단을 업데이트했습니다. 1) 로직단과 데이터단이 분리되어 있지 않은 문제 2) Github 프로필 커밋 수가 무의미하게 늘어나는 문제 3) 채용담당자가 이를 반기지 않을 것 같다는 문제가 있어, 방법을 모색하다가 Github Gist를 응용하여 로직은 레포지토리에서, 데이터는 Gist에서 관리하게 되었습니다.

# English description of MMA-WORK-CRAWLER

This is a job posting search website to replace the Military Manpower Administration's job search engine, which is inconvenient.

#### FYI
The Military Manpower Administration or MMA is a government agency in South Korea that manages military service and related matters. Its job search engine is called "병역일터" ("military service job site"), a website where companies post job openings specifically for those who must complete their military service. You can work for a job there for around 23 months to fulfill your military service obligation alternatively.

## Structure

The search works as follows:

1. `fetch.py` is executed once an hour using github action.
1. `fetch.py` fetches the Military Manpower Administration API and website, creates a json, and saves it to Github Gist as `채용공고목록.json` (lit. "job posting list").
1. The frontend reads and uses the `채용공고목록.json` in its entirety.

So it sends the entire DB to the frontend. The client performs search and retrieval on the frontend oneself.

- Q. Why did you make it like this?
  - A. In my past experience, it was cumbersome to manage a server kept alive 24/7. Also, I thought that if there is no feature like comments, there is no need for a backend.

- Q. Where is the frontend hosted?
    - A. [Azure SWA](https://azure.microsoft.com/en-us/products/app-service/static) hosts it. It deploys whenever `채용공고목록.json` changes.

- Q. Why are there so many commits?
    - A. Long ago, the repository triggered a github action to commit and push `채용공고목록.json` once an hour, then ran CD on the on:push event to update the frontend. It had three problems: logic and data are not separated; my Github profile commit count increases meaninglessly; the hiring manager won't like it. I ended up using github Gist, managing the logic in the repository and the data in the Gist.