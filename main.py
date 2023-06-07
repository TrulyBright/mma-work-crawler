import asyncio
import scrap
from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return

if __name__ == "__main__":
    returned = asyncio.run(scrap.crawl())
    print(returned)
    print(len(returned))
