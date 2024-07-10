import json
import logging
import colorlog
import requests
import xml.etree.ElementTree as ET

def fetch(endpoint: str, key: str):
    return requests.get(endpoint, {
        "numOfRows": 10000,
        "pageNo": 1,
        "ServiceKey": key
    }).content.decode()

def parse(data: str):
    parsed = ET.fromstring(data)
    resultcode = parsed.find("header").find("resultCode").text
    if resultcode != "00":
        raise Exception(f"API Error. resultCode: {resultcode}")
    return [{tag.tag: tag.text for tag in item} for item in parsed.iter("item")]

def translate(data: list[dict], filename: str):
    with open(filename) as f:
        translation = json.load(f)["국문명"]
    return [{translation[key]: value for key, value in item.items()} for item in data]

def setup_logging(logger: logging.Logger):
    handler = colorlog.StreamHandler()
    handler.setFormatter(colorlog.ColoredFormatter("%(log_color)s%(levelname)s:%(name)s:%(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)