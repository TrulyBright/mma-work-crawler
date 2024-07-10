import os
import traceback
from tqdm import tqdm
from tqdm.asyncio import tqdm_asyncio
import bs4
import httpx
import asyncio
import json
import logging
import re
from common import fetch, parse, setup_logging, translate

logger = logging.getLogger("fetch.py")

async def scrap_extra_info(data: list[dict]):
    """API로 조회되지 않는 정보는 사이트를 직접 스크랩해서 가져온다."""
    logger.info("Scraping extra info...")
    URI = "https://work.mma.go.kr/caisBYIS/search/cygonggogeomsaekView.do"
    async def scrap(공고번호: int, client: httpx.AsyncClient):
        while True:
            try:
                return await client.get(URI, params={"cygonggo_no": 공고번호}, timeout=None)
            except:
                logger.error(f"스크랩에 실패했습니다(공고번호: {공고번호}). 재시도합니다.")
                logger.error(traceback.format_exc())
    async with httpx.AsyncClient() as client:
        return await tqdm_asyncio.gather(*[scrap(item["공고번호"], client) for item in data])

def parse_extra_info(data: list[httpx.Response]):
    """스크랩한 데이터를 파싱한다."""
    logger.info("Parsing extra info...")
    def f(response: httpx.Response):
        soup = bs4.BeautifulSoup(response.text, "html.parser")
        속성 = {
            "주소",
            "전직자 채용가능",
            "출퇴근시간",
            "특근·잔업",
            "교대근무",
            "수습기간",
            "퇴직금지급",
            "식사(비)지급",
            "현역배정인원",
            "현역편입인원",
            "보충역배정인원",
            "보충역편입인원",
            "자격증",
        }
        try:
            값 = {entry: soup.find("th", string=entry).find_next_sibling().text.strip() for entry in 속성}
            값["비고"] = soup.find("table", attrs={"summary": "비고 사항"}).find("td").get_text("\n", True)
            return 값
        except:
            비고= soup.find("table", attrs={"summary": "비고 사항"}).find("td").get_text("\n", True)
            if 비고 == "이미 마감된 채용공고입니다.":
                return {}
            logger.error(f"추가 사항을 파싱하는데 실패했습니다. {response.url}")
            raise
    return [f(response) for response in tqdm(data)]

def seperate복리후생(data: list[dict]):
    logger.info("Seperating '복리후생'...")
    for item in data:
        if "복리후생" in item:
            item["복리후생"] = item["복리후생"].split(", ")
    return data

def seperate자격증(data: list[dict]):
    logger.info("Seperating '자격증'...")
    for item in data:
        if 자격증 := item.get("자격증"):
            item["자격증"] = list(map(lambda line: line.split(">")[-1], 자격증.split(",")))
    return data

def sepearte주소(data: list[dict]):
    logger.info("Seperating '주소'...")
    for item in data:
        if 주소 := item.get("주소"):
            item["주소"] = 주소.split(" ")
    return data

def seperate(data: list[dict]):
    return sepearte주소(seperate자격증(seperate복리후생(data)))

def fill_option_pool(data: list[dict]):
    """속성 풀을 채운다."""
    pools: dict[str, set] = dict()
    for item in data:
        for key, value in item.items():
            if key not in pools:
                pools[key] = set()
            if key == "주소":
                pools[key].add(tuple(value[:2]))
            elif isinstance(value, list):
                pools[key].update(value)
            else:
                pools[key].add(value)
            if "" in pools[key]:
                pools[key].remove("")
    pools = {
        key: sorted(value, key=lambda x: re.search(r'~.+만원$', x).group(0)[1:], reverse=True)
        if key == "급여"
        else sorted(value)
        for key, value in pools.items()
    }
    return {key:value for key, value in pools.items if value}

def update_gist(data: list[dict], token: str, gist_id: str):
    logging.info("Fetching Gist...")
    with httpx.Client() as client:
        client.headers["Accept"] = "application/vnd.github+json"
        client.headers["X-GitHub-Api-Version"] = "2022-11-28"
        res = client.get(f"https://api.github.com/gists/{gist_id}")
        res.raise_for_status()
        gist = res.json()
        채용공고목록raw_url = gist["files"]["채용공고목록.json"]["raw_url"]
        속성풀raw_url = gist["files"]["속성풀.json"]["raw_url"]
        채용공고목록 = client.get(채용공고목록raw_url).json()
        속성풀 = client.get(속성풀raw_url).json()
        if 채용공고목록 == data and 속성풀 == fill_option_pool(data):
            logging.info("No difference found.")
            return
        logger.info("Difference found. Updating...")
        client.headers["Authorization"] = f"Bearer {token}"
        res = client.patch(f"https://api.github.com/gists/{gist_id}", json={
            "files": {
                "채용공고목록.json": {
                    "content": json.dumps(data, ensure_ascii=False)
                },
                "속성풀.json": {
                    "content": json.dumps(fill_option_pool(data), ensure_ascii=False)
                }
            }
        })
        res.raise_for_status()

def run():
    setup_logging(logger)
    endpoint = os.environ["API_ENDPOINT_JOB"]
    key = os.environ["API_KEY"]
    token = os.environ["GITHUB_TOKEN"]
    gist_id = os.environ["GIST_ID"]
    logger.info("Fetching data...")
    data = fetch(endpoint, key)
    logger.info("Parsing data...")
    parsed = parse(data)
    translated = translate(parsed, "korean.job.json")
    extra_info = asyncio.run(scrap_extra_info(translated))
    parsed_extra_info = parse_extra_info(extra_info)
    for item, extra in zip(translated, parsed_extra_info, strict=True):
        if extra:
            item.update(extra)
        else:
            item.clear()
    excluding_closed = [item for item in translated if item]
    seperated = seperate(excluding_closed)
    sortedBySalary = sorted(seperated, key=lambda x: re.search(r'~.+만원', x["급여"]).group(0)[1:], reverse=True)
    # with open("data.json", "w", encoding="utf-8") as f:
    #     json.dump(sortedBySalary, f, ensure_ascii=False, indent=4)
    update_gist(sortedBySalary, token, gist_id)

if __name__ == "__main__":
    run()