import scrapy
from scrapy.http import Response


class MMAWorkSpider(scrapy.Spider):
    name = 'MMAWorkSpider'

    def start_requests(self):
        urls = [
            "https://work.mma.go.kr/caisBYIS/search/cygonggogeomsaek.do"
        ]
        for url in urls:
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response: Response):
        print(response)
