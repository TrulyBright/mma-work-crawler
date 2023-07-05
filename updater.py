import itertools
import json
import re
import logging
import asyncio
import itertools
import httpx
import time
from bs4 import BeautifulSoup as Soup

URL = "https://work.mma.go.kr"


def hangul_only(s: str):
    return re.sub("[^가-힇]", "", s)

async def __get(client: httpx.AsyncClient, url: str):
    while True:
        try:
            return await client.get(url)
        except httpx.RemoteProtocolError:
            logging.warning(f"Crawling {url} failed. Retrying...")

async def crawl_list() -> list[httpx.Response]:
    pages = 200
    urls = {
        f"/caisBYIS/search/cygonggogeomsaek.do?pageIndex={i}" for i in range(pages)
    }
    async with httpx.AsyncClient(verify=False, timeout=None) as client:
        return await asyncio.gather(*[__get(client, URL+u) for u in urls])


def parse_list(response: httpx.Response) -> list[str]:
    parsed = Soup(response.read(), "html.parser")
    class_ = "title t-alignLt pl10px"
    titles = parsed.find_all("td", class_=class_)
    return [t.find("a")["href"] for t in titles]


async def crawl_posts(hrefs: list[str]):
    async with httpx.AsyncClient(verify=False, timeout=None) as client:
        return await asyncio.gather(*[__get(client, URL+h) for h in hrefs])


def parse_post(response: httpx.Response) -> dict[str, dict[str, str]]:
    parsed = Soup(response.read(), "html.parser")
    result = dict()
    for div in parsed.find_all("div", class_="step1"):
        div_title = hangul_only(div.find("h3").text.strip())
        for i, tr in enumerate(div.find_all("tr")):
            th = tr.find_all("th")
            td = tr.find_all("td")
            if th == []:
                if i == 0:
                    result[hangul_only(div_title)] = td[0].text.strip()
                break
            for head, data in zip(th, td):
                head = hangul_only(head.text)
                data = data.text.strip()
                if head == "전화번호" and head in result:
                    head = "담당자전화번호"
                result[head] = data
    return result


async def run():
    logging.info("Crawling lists")
    lists = await crawl_list()
    hrefs = list(itertools.chain(*[parse_list(l) for l in lists]))
    logging.info("Crawling posts")
    posts = await crawl_posts(hrefs)
    logging.info("Parsing posts")
    return [parse_post(p) for p in posts]


if __name__ == "__main__":
    posts = asyncio.run(run())
    with open("front/data.json", "w", encoding="utf-8") as data_json:
        json.dump(posts, data_json, ensure_ascii=False)
    with open("front/time.json", "w", encoding="utf-8") as time_json:
        json.dump({"time": int(time.time())}, time_json)