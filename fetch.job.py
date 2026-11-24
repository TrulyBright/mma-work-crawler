import os
import asyncio
import logging
import traceback
import bs4
import httpx
from tqdm import tqdm
from tqdm.asyncio import tqdm_asyncio
from common import fetch, parse, save, setup_logging, translate

logger = logging.getLogger("fetch.job.py")

CONCURRENCY = 16
MAX_ATTEMPTS = 8

async def scrap_extra_info(data: list[dict]):
    """API로 조회되지 않는 정보는 사이트를 직접 스크랩해서 가져온다."""
    logger.info("Scraping extra info...")
    URI = "https://work.mma.go.kr/caisBYIS/search/cygonggogeomsaekView.do"
    semaphore = asyncio.Semaphore(CONCURRENCY)
    async def scrap(공고번호: str, client: httpx.AsyncClient):
        async with semaphore:
            for attempt in range(1, MAX_ATTEMPTS + 1):
                try:
                    res = await client.get(URI, params={"cygonggo_no": 공고번호})
                    res.raise_for_status()
                    return res
                except Exception:
                    logger.error(f"스크랩에 실패했습니다(공고번호: {공고번호}, {attempt}회).")
                    logger.error(traceback.format_exc())
                    if attempt == MAX_ATTEMPTS:
                        raise
                    await asyncio.sleep(min(2 ** attempt, 30))
    async with httpx.AsyncClient(timeout=60) as client:
        return await tqdm_asyncio.gather(*[scrap(item["공고번호"], client) for item in data])

def parse_extra_info(data: list[httpx.Response]):
    """스크랩한 데이터를 파싱한다."""
    logger.info("Parsing extra info...")
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
    def f(response: httpx.Response):
        soup = bs4.BeautifulSoup(response.text, "html.parser")
        비고 = soup.find("table", attrs={"summary": "비고 사항"}).find("td").get_text("\n", True)
        try:
            값 = {entry: soup.find("th", string=entry).find_next_sibling().text.strip() for entry in 속성}
        except AttributeError:
            if 비고 == "이미 마감된 채용공고입니다.":
                return {}
            logger.error(f"추가 사항을 파싱하는데 실패했습니다. {response.url}")
            raise
        값["비고"] = 비고
        return 값
    return [f(response) for response in tqdm(data)]

def separate복리후생(data: list[dict]):
    logger.info("separating '복리후생'...")
    for item in data:
        if "복리후생" in item:
            item["복리후생"] = item["복리후생"].split(", ")
    return data

def separate자격증(data: list[dict]):
    logger.info("separating '자격증'...")
    for item in data:
        if 자격증 := item.get("자격증"):
            item["자격증"] = list(map(lambda line: line.split(">")[-1], 자격증.split(",")))
    return data

def separate주소(data: list[dict]):
    logger.info("separating '주소'...")
    for item in data:
        if 주소 := item.get("주소"):
            item["주소"] = 주소.split(" ")
    return data

def separate(data: list[dict]):
    return separate주소(separate자격증(separate복리후생(data)))

def run():
    setup_logging(logger)
    endpoint = os.environ["API_ENDPOINT_JOB"]
    key = os.environ["API_KEY"]
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
    # 정렬과 검색 색인은 프론트엔드 빌드에서 만든다.
    save({"채용공고목록.json": separate(excluding_closed)}, logger)

if __name__ == "__main__":
    run()
