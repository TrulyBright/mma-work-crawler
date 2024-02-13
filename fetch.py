import os
import json
import xml.etree.ElementTree as ET
import logging
import requests

def get_api_endpoint():
    logging.info("Getting API endpoint...")
    return os.environ["API_ENDPOINT"]

def get_api_key():
    logging.info("Getting API key...")
    return os.environ["API_KEY"]

def fetch(endpoint: str, key: str):
    logging.info("Fetching data...")
    return requests.get(endpoint, {
        "numOfRows": 10000,
        "pageNo": 1,
        "ServiceKey": key
    }).content.decode()

def parse(data: str):
    logging.info("Parsing data...")
    parsed = ET.fromstring(data)
    resultcode = parsed.find("header").find("resultCode").text
    if resultcode != "00":
        raise Exception(f"API Error. resultCode: {resultcode}")
    return [{tag.tag: tag.text for tag in item} for item in parsed.iter("item")]

def translate(data: list[dict]):
    logging.info("Translating data...")
    with open("postprocessdata.json") as f:
        translation = json.load(f)["국문명"]
    return [{translation[key]: value for key, value in item.items()} for item in data]

def numberize(data: list[dict]):
    logging.info("Numberizing data...")
    with open("postprocessdata.json") as f:
        convertable = json.load(f)["int변환가능항목"]
    for item in data:
        for key, value in item.items():
            if key in convertable:
                item[key] = int(value)
    return data

def seperate복리후생(data: list[dict]):
    logging.info("Seperating '복리후생'...")
    for item in data:
        if "복리후생" in item:
            item["복리후생"] = item["복리후생"].split(", ")
    return data

def build_entry_pool(data: list[dict]):
    logging.info("Building entry pool...")
    pool = dict()
    with open("postprocessdata.json") as f:
        loaded = json.load(f)
        mapping생성항목: dict = loaded["mapping생성항목"]
        다중선택항목: dict = loaded["다중선택항목"]
    for item in data:
        for key, value in item.items():
            if 대응되는국문명 := mapping생성항목.get(key):
                if pool.get(대응되는국문명) is None:
                    pool[대응되는국문명] = dict()
                pool[대응되는국문명][value] = item[대응되는국문명]
            elif key in 다중선택항목:
                pool[key] = pool.get(key, set())
                pool[key].update(value)
    return {key: sorted(value) if isinstance(value, set) else dict(sorted(value.items())) for key, value in pool.items()}

def save_with_pool(data: list[dict]):
    logging.info("Saving data with its entry pool...")
    os.makedirs("front/data", exist_ok=True)
    with open("front/data/채용공고목록.json", "w") as f, open("front/data/속성풀.json", "w") as p:
        json.dump(data, f, ensure_ascii=False)
        json.dump(build_entry_pool(data), p, ensure_ascii=False)

def run():
    logging.basicConfig(level=logging.INFO)
    endpoint = get_api_endpoint()
    key = get_api_key()
    data = fetch(endpoint, key)
    # with open("front/openings.xml") as f:
    #     data = f.read()
    parsed = parse(data)
    translated = translate(parsed)
    numberized = numberize(translated)
    seperated = seperate복리후생(numberized)
    save_with_pool(seperated)

if __name__ == "__main__":
    run()