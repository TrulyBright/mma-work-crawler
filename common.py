import json
import logging
import colorlog
import xml.etree.ElementTree as ET
import httpx

RESPONSE_PREVIEW_LENGTH = 120

def fetch(endpoint: str, key: str):
    # TLS 1.2 is required for the API. requests does not support TLS 1.2.
    return httpx.get(endpoint, params={
        "numOfRows": 10000,
        "pageNo": 1,
        "ServiceKey": key
    }, timeout=None).content.decode()

def parse(data: str):
    data = data.lstrip("\ufeff\r\n\t ")
    if not data:
        raise Exception("API Error. Empty response body")
    try:
        parsed = ET.fromstring(data)
        resultcode = parsed.find("header").find("resultCode").text
        if resultcode != "00":
            raise Exception(f"API Error. resultCode: {resultcode}")
        return [{tag.tag: tag.text for tag in item} for item in parsed.iter("item")]
    except ET.ParseError:
        try:
            parsed = json.loads(data)
        except json.JSONDecodeError as error:
            raise Exception(
                f"API Error. Failed to parse response body. preview={data[:RESPONSE_PREVIEW_LENGTH]!r}"
            ) from error
        response = parsed.get("response", parsed)
        header = response.get("header", {})
        resultcode = header.get("resultCode")
        if resultcode and resultcode != "00":
            raise Exception(f"API Error. resultCode: {resultcode}")
        items = response.get("body", {}).get("items", [])
        if isinstance(items, dict):
            items = items.get("item", [])
        if isinstance(items, list):
            return items
        if isinstance(items, dict):
            return [items]
        raise Exception("API Error. Unexpected JSON response format")

def translate(data: list[dict], filename: str):
    with open(filename) as f:
        translation = json.load(f)["국문명"]
    return [{translation[key]: value for key, value in item.items()} for item in data]

def setup_logging(logger: logging.Logger):
    handler = colorlog.StreamHandler()
    handler.setFormatter(colorlog.ColoredFormatter("%(log_color)s%(levelname)s:%(name)s:%(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
