from tqdm.asyncio import tqdm_asyncio
from tqdm import tqdm
import asyncio
import itertools
import httpx
from bs4 import BeautifulSoup as Soup

URL = "https://work.mma.go.kr"


def crawl_list() -> list[httpx.Response]:
    urls = {
        f"/caisBYIS/search/cygonggogeomsaek.do?pageIndex={i}" for i in range(100)
    }
    with httpx.Client(verify=False) as client:
        return [client.get(URL+u) for u in tqdm(urls)]


def parse_list(response: httpx.Response) -> list[str]:
    parsed = Soup(response.read(), "html.parser")
    class_ = "title t-alignLt pl10px"
    titles = parsed.find_all("td", class_=class_)
    return [t.find("a")["href"] for t in titles]


def crawl_posts(hrefs: list[str]):
    with httpx.Client(verify=False) as client:
        return [client.get(URL+h) for h in tqdm(hrefs)]


def parse_post(response: httpx.Response):
    parsed = Soup(response.read(), "html.parser")
    return parsed.find("div", id="content").text


def run():
    lists = crawl_list()
    hrefs = list(itertools.chain(*[parse_list(l) for l in tqdm(lists)]))
    return [parse_post(p) for p in tqdm(crawl_posts(hrefs))]


if __name__ == "__main__":
    result = run()
    with open("result.txt", "w") as f:
        f.write("\n".join(result))
