from tqdm.asyncio import tqdm_asyncio
from tqdm import tqdm
import asyncio
import itertools
import httpx
from bs4 import BeautifulSoup as Soup

URL = "https://work.mma.go.kr"


async def crawl_list() -> list[httpx.Response]:
    urls = {
        f"/caisBYIS/search/cygonggogeomsaek.do?pageIndex={i}" for i in range(100)
    }
    async with httpx.AsyncClient(verify=False) as client:
        return await tqdm_asyncio.gather(*[client.get(URL+u) for u in urls])


def parse_list(response: httpx.Response) -> list[str]:
    parsed = Soup(response.read(), "html.parser")
    class_ = "title t-alignLt pl10px"
    titles = parsed.find_all("td", class_=class_)
    return [t.find("a")["href"] for t in titles]


async def crawl_post(hrefs: list[str]):
    async with httpx.AsyncClient(verify=False) as client:
        return await tqdm_asyncio.gather(*[client.get(URL+h) for h in hrefs])


def parse_post(response: httpx.Response):
    parsed = Soup(response.read(), "html.parser")
    return parsed.find("div", id="content").text


async def run():
    lists = await crawl_list()
    hrefs = itertools.chain(*[parse_list(l) for l in lists])
    return tqdm([parse_post(p) for p in await crawl_post(hrefs)])


if __name__ == "__main__":
    result = asyncio.run(run())
    with open("result.txt", "w") as f:
        f.write("\n".join(result))
