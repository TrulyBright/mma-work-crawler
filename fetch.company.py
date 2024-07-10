import asyncio
import json
import bs4
from tqdm.asyncio import tqdm_asyncio
import os
import logging
import traceback
import httpx
import requests
from common import fetch, parse, setup_logging, translate

logger = logging.getLogger("fetch.company.py")

def drop(data: list[dict], *args):
    for item in data:
        for arg in args:
            item.pop(arg, None)
    return data

def separate업체주소(data: list[dict]):
    logger.info("Separating '업체주소'...")
    for item in data:
        if 업체주소 := item.get("업체주소"):
            item["업체주소"] = 업체주소.split(" ")
    return data

def update_gist(data: list[dict], token: str, gist_id: str):
    logger.info("Updating gist...")
    with httpx.Client() as client:
        client.headers["Accept"] = "application/vnd.github+json"
        client.headers["X-GitHub-Api-Version"] = "2022-11-28"
        res = client.get(f"https://api.github.com/gists/{gist_id}")
        res.raise_for_status()
        gist = res.json()
        병역지정업체목록raw_url = gist["files"]["병역지정업체목록.json"]["raw_url"]
        병역지정업체속성풀raw_url = gist["files"]["병역지정업체속성풀.json"]["raw_url"]
        병역지정업체목록 = client.get(병역지정업체목록raw_url).json()
        병역지정업체속성풀 = client.get(병역지정업체속성풀raw_url).json()
        if 병역지정업체목록 == data and 병역지정업체속성풀 == fill_option_pool(data):
            logger.info("No update needed.")
            return
        logger.info("Difference found. Updating...")
        res = client.patch(f"https://api.github.com/gists/{gist_id}", json={
            "files": {
                "병역지정업체목록.json": {
                    "content": json.dumps(data, ensure_ascii=False)
                },
                "병역지정업체속성풀.json": {
                    "content": json.dumps(fill_option_pool(data), ensure_ascii=False)
                }
            }
        })
        res.raise_for_status()

def fill_option_pool(data: list[dict]):
    """속성 풀을 채운다."""
    pools: dict[str, set] = dict()
    for item in data:
        for key, value in item.items():
            if key not in pools:
                pools[key] = set()
            if key == "업체주소":
                pools[key].add(tuple(value[:2]))
            elif isinstance(value, list):
                pools[key].update(value)
            else:
                pools[key].add(value)
            if "" in pools[key]:
                pools[key].remove("")
    return {key: sorted(value) for key, value in pools.items() if value}

def run():
    setup_logging(logger)
    endpoint = os.environ["API_ENDPOINT_COMPANY"]
    key = os.environ["API_KEY"]
    token = os.environ["GITHUB_TOKEN"]
    gist_id = os.environ["GIST_ID"]
    logger.info("Fetching data...")
    data = fetch(endpoint, key)
    logger.info("Parsing data...")
    parsed = parse(data)
    logger.info("dropping meaningless values...")
    dropped = drop(parsed, "rnum")
    logger.info("Translating data...")
    translated = translate(dropped, "korean.company.json")
    # 지정업체 정보는 API에서 업체번호를 주지 않아,
    # 실제 병역일터 웹사이트로 이동이 불가하다.
    # 그러므로 바로 파일로 저장한다.
    separated = separate업체주소(translated)
    update_gist(separated, token, gist_id)

if __name__ == "__main__":
    run()