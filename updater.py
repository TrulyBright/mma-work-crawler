import itertools
from contextlib import suppress
import re
import asyncio
import itertools
import httpx
import database
import model
from bs4 import BeautifulSoup as Soup

URL = "https://work.mma.go.kr"


def to_underbar(s: str):
    return re.sub("[^가-힇]", "_", s)


async def crawl_list() -> list[httpx.Response]:
    pages = 200
    urls = {
        f"/caisBYIS/search/cygonggogeomsaek.do?pageIndex={i}" for i in range(pages)
    }
    async with httpx.AsyncClient(verify=False, timeout=None) as client:
        return await asyncio.gather(*[client.get(URL+u) for u in urls])


def parse_list(response: httpx.Response) -> list[str]:
    parsed = Soup(response.read(), "html.parser")
    class_ = "title t-alignLt pl10px"
    titles = parsed.find_all("td", class_=class_)
    return [t.find("a")["href"] for t in titles]


async def crawl_posts(hrefs: list[str]):
    async with httpx.AsyncClient(verify=False, timeout=None) as client:
        return await asyncio.gather(*[client.get(URL+h) for h in hrefs])


def parse_post(response: httpx.Response) -> dict[str, dict[str, str]]:
    parsed = Soup(response.read(), "html.parser")
    result = dict()
    for div in parsed.find_all("div", class_="step1"):
        table = dict()
        div_title = to_underbar(div.find("h3").text.strip())
        for i, tr in enumerate(div.find_all("tr")):
            th = tr.find_all("th")
            td = tr.find_all("td")
            if th == []:
                if i == 0:
                    table = {div_title: td[0].text.strip()}
                break
            for head, data in zip(th, td):
                table[to_underbar(head.text.strip())] = data.text.strip()
        result[div_title] = table
    return result


async def run():
    while True:
        with suppress(httpx.RemoteProtocolError):
            lists = await crawl_list()
            break
    hrefs = list(itertools.chain(*[parse_list(l) for l in lists]))
    while True:
        with suppress(httpx.RemoteProtocolError):
            posts = await crawl_posts(hrefs)
            break
    return [parse_post(p) for p in posts]


if __name__ == "__main__":
    posts = asyncio.run(run())
    with database.get_session() as session:
        added = []
        for i, post in enumerate(posts):
            for table_name, table_columns in post.items():
                table_name = to_underbar(table_name)
                schema = model.Base.pool()[table_name]
                table_columns["id"] = i
                added.append(schema(**table_columns))
        session.add_all(added)
        session.commit()
