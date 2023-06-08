import json
from datetime import date
from tqdm.asyncio import tqdm_asyncio
from tqdm import tqdm
import pydantic
import itertools
import httpx
from bs4 import BeautifulSoup as Soup

URL = "https://work.mma.go.kr"


def crawl_list() -> list[httpx.Response]:
    urls = {
        f"/caisBYIS/search/cygonggogeomsaek.do?pageIndex={i}" for i in range(100)
    }
    with httpx.Client(verify=False) as client:
        urls = tqdm(urls)
        urls.set_description("Crawling lists")
        return [client.get(URL+u) for u in urls]


def parse_list(response: httpx.Response) -> list[str]:
    parsed = Soup(response.read(), "html.parser")
    class_ = "title t-alignLt pl10px"
    titles = parsed.find_all("td", class_=class_)
    return [t.find("a")["href"] for t in titles]


def crawl_posts(hrefs: list[str]):
    with httpx.Client(verify=False) as client:
        posts = tqdm(hrefs)
        posts.set_description("Crawling posts")
        return [client.get(URL+h) for h in posts]


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


def run():
    lists = tqdm(crawl_list())
    lists.set_description("Parsing lists")
    hrefs = list(itertools.chain(*[parse_list(l) for l in lists]))
    posts = tqdm(crawl_posts(hrefs))
    posts.set_description("Parsing posts")
    return [parse_post(p) for p in posts]


if __name__ == "__main__":
    result = run()
    with open("result.json", "w", encoding="UTF-8") as f:
        f.write(json.dumps(result, ensure_ascii=False))
