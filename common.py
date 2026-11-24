import json
import logging
import os
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
    data = data.removeprefix("﻿").lstrip("\r\n\t ")
    if not data:
        raise Exception("API Error. Empty response body")
    try:
        parsed = ET.fromstring(data)
        header = parsed.find("header")
        result_code_node = header.find("resultCode") if header is not None else None
        if result_code_node is None:
            raise Exception("API Error. XML response missing header.resultCode")
        resultcode = result_code_node.text
        if resultcode != "00":
            raise Exception(f"API Error. resultCode: {resultcode}")
        return [{tag.tag: tag.text for tag in item} for item in parsed.iter("item")]
    except ET.ParseError:
        try:
            parsed = json.loads(data)
        except json.JSONDecodeError as error:
            raise Exception(
                f"API Error. Response is neither valid XML nor JSON. Check API endpoint health or network connectivity. preview={data[:RESPONSE_PREVIEW_LENGTH]!r}"
            ) from error
        response = parsed.get("response", parsed)
        header = response.get("header", {})
        resultcode = header.get("resultCode")
        if resultcode is None:
            raise Exception("API Error. JSON response missing header.resultCode")
        if resultcode != "00":
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

def dump(data) -> str:
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"))

def save(files: dict[str, object], logger: logging.Logger):
    """OUTPUT_DIR이 있으면 그 폴더에 쓰고, 없으면 Gist에서 바뀐 파일만 갱신한다."""
    out_dir = os.environ.get("OUTPUT_DIR")
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
        for name, data in files.items():
            with open(os.path.join(out_dir, name), "w", encoding="utf-8") as f:
                f.write(dump(data))
        logger.info(f"Saved to {out_dir}.")
        return
    gist_url = f"https://api.github.com/gists/{os.environ['GIST_ID']}"
    # 읽을 때도 토큰을 쓴다. 인증 없는 요청은 IP당 시간당 60회까지인데 Actions 러너는 IP를 나눠 쓴다.
    api_headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
    }
    with httpx.Client(timeout=60) as client:
        res = client.get(gist_url, headers=api_headers)
        res.raise_for_status()
        existing = res.json()["files"]
        changed = {}
        for name, data in files.items():
            if name in existing:
                current = client.get(existing[name]["raw_url"])
                if current.is_success and current.json() == data:
                    continue
            changed[name] = {"content": dump(data)}
        if not changed:
            logger.info("No difference found.")
            return
        logger.info(f"Updating {', '.join(changed)}...")
        res = client.patch(gist_url, headers=api_headers, json={"files": changed})
        res.raise_for_status()
