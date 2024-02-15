import os
import colorlog
from tqdm import tqdm
from tqdm.asyncio import tqdm_asyncio
import bs4
import httpx
import asyncio
import json
import xml.etree.ElementTree as ET
import logging
import requests

logger = logging.getLogger("fetch.py")

def get_api_endpoint():
    logger.info("Getting API endpoint...")
    return os.environ["API_ENDPOINT"]

def get_api_key():
    logger.info("Getting API key...")
    return os.environ["API_KEY"]

def fetch(endpoint: str, key: str):
    logger.info("Fetching data...")
    return requests.get(endpoint, {
        "numOfRows": 10000,
        "pageNo": 1,
        "ServiceKey": key
    }).content.decode()

def parse(data: str):
    logger.info("Parsing data...")
    parsed = ET.fromstring(data)
    resultcode = parsed.find("header").find("resultCode").text
    if resultcode != "00":
        raise Exception(f"API Error. resultCode: {resultcode}")
    return [{tag.tag: tag.text for tag in item} for item in parsed.iter("item")]

def translate(data: list[dict]):
    logger.info("Translating data...")
    with open("postprocessdata.json") as f:
        translation = json.load(f)["국문명"]
    return [{translation[key]: value for key, value in item.items()} for item in data]

def numberize(data: list[dict]):
    logger.info("Numberizing data...")
    with open("postprocessdata.json") as f:
        convertable = json.load(f)["int변환가능항목"]
    for item in data:
        for key, value in item.items():
            if key in convertable:
                item[key] = int(value)
    return data

def seperate복리후생(data: list[dict]):
    logger.info("Seperating '복리후생'...")
    for item in data:
        if "복리후생" in item:
            item["복리후생"] = item["복리후생"].split(", ")
    return data

async def scrap_extra_info(data: list[dict]):
    """API로 조회되지 않는 정보는 사이트를 직접 스크랩해서 가져온다."""
    logger.info("Scraping extra info...")
    URI = "https://work.mma.go.kr/caisBYIS/search/cygonggogeomsaekView.do"
    async def scrap(공고번호: int, client: httpx.AsyncClient):
        return await client.get(URI, params={"cygonggo_no": 공고번호}, timeout=None)
    async with httpx.AsyncClient() as client:
        return await tqdm_asyncio.gather(*[scrap(item["공고번호"], client) for item in data])

def parse_extra_info(data: list[httpx.Response]):
    """스크랩한 데이터를 파싱한다."""
    logger.info("Parsing extra info...")
    def f(response: httpx.Response):
        soup = bs4.BeautifulSoup(response.text, "html.parser")
        속성 = {
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
        except: # 공고가 마감됐는데 API에는 남아 있는 경우 예외가 난다. 그냥 냅둔다.
            logger.warning(f"추가 사항을 파싱하는데 실패했습니다. {response.url}")
            return {}
    return [f(response) for response in tqdm(data)]

def save(data: list[dict]):
    logger.info("Saving data...")
    os.makedirs("front/data", exist_ok=True)
    with open("front/data/채용공고목록.json", "w") as f:
        json.dump(data, f, ensure_ascii=False)

def setup_logging():
    handler = colorlog.StreamHandler()
    handler.setFormatter(colorlog.ColoredFormatter("%(log_color)s%(levelname)s:%(name)s:%(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

def run():
    setup_logging()
    endpoint = get_api_endpoint()
    key = get_api_key()
    data = fetch(endpoint, key)
    parsed = parse(data)
    translated = translate(parsed)
    numberized = numberize(translated)
    seperated = seperate복리후생(numberized)
    extra_info = asyncio.run(scrap_extra_info(seperated))
    parsed_extra_info = parse_extra_info(extra_info)
    for item, extra in zip(seperated, parsed_extra_info, strict=True):
        item.update(extra)
    save(seperated)

if __name__ == "__main__":
    run()