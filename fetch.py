import os
import pathlib
import logging
import requests

def get_api_endpoint():
    return os.environ["API_ENDPOINT"]

def get_api_key():
    return os.environ["API_KEY"]

def fetch(endpoint: str, key: str):
    logging.info("Fetching data...")
    return requests.get(endpoint, {
        "numOfRows": 10000,
        "pageNo": 1,
        "ServiceKey": key
    }).content.decode()

def save(data: str):
    with open("data/openings.xml", "w") as f:
        f.write(data)

def mkdir():
    pathlib.Path("data").mkdir(exist_ok=True)

def run():
    mkdir()
    save(fetch(get_api_endpoint(), get_api_key()))

if __name__ == "__main__":
    run()