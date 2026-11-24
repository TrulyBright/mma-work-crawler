import logging
import re
import bs4
import httpx
import xlrd
from common import save, setup_logging

logger = logging.getLogger("fetch.company.py")

URI = "https://work.mma.go.kr/caisBYIS/search"
복무형태 = {"1": "산업기능요원", "2": "전문연구요원", "3": "승선근무예비역"}
엑셀열 = {
    "업체명": "업체명",
    "선정년도": "선정년도",
    "지방청": "지방청",
    "주소": "주소",
    "전화번호": "전화번호",
    "팩스번호": "팩스번호",
    "업종": "업종",
    "기업규모": "기업규모",
    "주생산품목": "주생산품목",
    "연구분야": "연구분야",
    "보충역 배정인원": "보충역배정인원",
    "보충역 편입인원": "보충역편입인원",
    "보충역 복무인원": "보충역복무인원",
    "현역 배정인원": "현역배정인원",
    "현역 편입인원": "현역편입인원",
    "현역 복무인원": "현역복무인원",
}

def 공백제거(s: str):
    return re.sub(r"\s+", "", s)

def fetch_list(client: httpx.Client, 코드: str):
    """검색 결과 화면에서 업체코드와 채용유무를 가져온다. 엑셀에는 이 둘이 없다."""
    res = client.post(f"{URI}/byjjecgeomsaek.do", data={"eopjong_gbcd": 코드, "pageUnit": 100000, "pageIndex": 1})
    res.raise_for_status()
    soup = bs4.BeautifulSoup(res.text, "html.parser")
    rows = []
    for tr in soup.find("table", class_="brd_list_n").find("tbody").find_all("tr"):
        a = tr.find("a")
        if a is None:
            continue
        tds = [td.get_text(strip=True) for td in tr.find_all("td")]
        업체코드 = re.search(r"byjjeopche_cd=(\d*)", a["href"]).group(1)
        rows.append({"업체명": a.get_text(strip=True), "업체코드": 업체코드, "채용유무": tds[2] if len(tds) > 2 else ""})
    total = int(re.search(r"총 게시물 : ([\d,]+)건", res.text).group(1).replace(",", ""))
    if total != len(rows):
        raise Exception(f"목록 개수가 맞지 않습니다. 총 {total}건, 파싱 {len(rows)}건")
    return rows

def fetch_excel(client: httpx.Client, 코드: str):
    """엑셀 저장 기능으로 업체 상세정보를 한 번에 받는다."""
    res = client.post(f"{URI}/downloadBYJJEopCheExcel.do", data={"eopjong_gbcd": 코드})
    res.raise_for_status()
    sheet = xlrd.open_workbook(file_contents=res.content).sheet_by_index(0)
    header = sheet.row_values(0)
    if header[1:] != list(엑셀열):
        raise Exception(f"엑셀 열 구성이 바뀌었습니다. {header}")
    return [dict(zip(header, sheet.row_values(r))) for r in range(1, sheet.nrows)]

def merge(목록: list[dict], 엑셀: list[dict], 요원: str):
    if len(목록) != len(엑셀):
        raise Exception(f"목록({len(목록)}건)과 엑셀({len(엑셀)}건)의 개수가 다릅니다.")
    merged = []
    for row, detail in zip(목록, 엑셀, strict=True):
        if 공백제거(row["업체명"]) != 공백제거(str(detail["업체명"])):
            raise Exception(f"목록과 엑셀의 순서가 다릅니다. {row['업체명']} / {detail['업체명']}")
        item = {"요원": 요원}
        for 열, key in 엑셀열.items():
            value = detail[열]
            if isinstance(value, float):
                item[key] = int(value)
            elif value := str(value).strip():
                item[key] = value
        if re.fullmatch(r"\d{9}", row["업체코드"]):
            item["업체코드"] = row["업체코드"]
        if row["채용유무"]:
            item["채용유무"] = row["채용유무"]
        merged.append(item)
    return merged

def run():
    setup_logging(logger)
    data = []
    with httpx.Client(timeout=300, headers={"User-Agent": "Mozilla/5.0"}) as client:
        for 코드, 요원 in 복무형태.items():
            logger.info(f"Fetching {요원}...")
            data += merge(fetch_list(client, 코드), fetch_excel(client, 코드), 요원)
    logger.info(f"{len(data)} companies.")
    save({"병역지정업체목록.json": data}, logger)

if __name__ == "__main__":
    run()
