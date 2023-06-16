import itertools
import json
from tqdm import tqdm
from tqdm.asyncio import tqdm_asyncio
from datetime import date
import asyncio
import pydantic
import itertools
import httpx
from bs4 import BeautifulSoup as Soup

URL = "https://work.mma.go.kr"


async def crawl_list() -> list[httpx.Response]:
    pages = 100
    urls = {
        f"/caisBYIS/search/cygonggogeomsaek.do?pageIndex={i}" for i in range(pages)
    }
    async with httpx.AsyncClient(verify=False, timeout=None) as client:
        return await tqdm_asyncio.gather(*[client.get(URL+u) for u in urls])


def parse_list(response: httpx.Response) -> list[str]:
    parsed = Soup(response.read(), "html.parser")
    class_ = "title t-alignLt pl10px"
    titles = parsed.find_all("td", class_=class_)
    return [t.find("a")["href"] for t in titles]


async def crawl_posts(hrefs: list[str]):
    async with httpx.AsyncClient(verify=False, timeout=None) as client:
        return await tqdm_asyncio.gather(*[client.get(URL+h) for h in hrefs])


def parse_post(response: httpx.Response):
    parsed = Soup(response.read(), "html.parser")
    result = dict()
    for div in parsed.find_all("div", class_="step1"):
        table = dict()
        for i, tr in enumerate(div.find_all("tr")):
            th = tr.find_all("th")
            td = tr.find_all("td")
            if th == []:
                if i == 0:
                    table = td[0].text.strip()
                break
            for head, data in zip(th, td):
                table[head.text.strip()] = data.text.strip()
        result[div.find("h3").text] = table
    return result


async def run():
    lists = await crawl_list()
    hrefs = list(itertools.chain(*[parse_list(l) for l in lists]))
    posts = await crawl_posts(hrefs)
    return [parse_post(p) for p in tqdm(posts)]


if __name__ == "__main__":
    result = asyncio.run(run())
    with open("result.json", "w", encoding="UTF-8") as f:
        f.write(json.dumps(result, ensure_ascii=False))
