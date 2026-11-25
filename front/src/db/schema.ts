// 데이터셋마다 어떤 필드를 어떤 형태로 저장할지. 빌드 스크립트와 화면이 함께 쓴다.
// facet: 검색조건이 되는 필드. 값마다 해당 레코드의 비트셋을 저장한다(역색인).
// cat: 검색조건은 아니지만 값 종류가 적은 필드. 사전 + 번호로 저장한다.
// text/num: 레코드마다 값이 다른 필드. core는 첫 화면에, detail은 상세정보를 펼칠 때 쓴다.
// sorts: 첫 번째가 저장 순서이고, 나머지는 빌드 때 순열을 미리 만들어 둔다.

export type DatasetName = "openings" | "companies"

export type Schema = {
    main: readonly string[]
    more: readonly string[]
    matchAll: readonly string[]
    cats: readonly string[]
    coreText: readonly string[]
    coreNum: readonly string[]
    detailText: readonly string[]
    detailNum: readonly string[]
    sorts: readonly string[]
}

export const 채용공고: Schema = {
    main: ["역종", "요원", "업종", "급여", "전직자 채용가능", "주소"],
    more: [
        "최종학력",
        "전공",
        "경력구분",
        "경력년수",
        "외국어",
        "외국어구사능력",
        "자격증",
        "수습기간",
        "근무형태",
        "출퇴근시간",
        "교대근무",
        "특근·잔업",
        "복리후생",
        "식사(비)지급",
        "퇴직금지급",
    ],
    matchAll: ["자격증", "복리후생"],
    cats: ["공고등록일", "최종변동일", "마감일", "모집인원", "현역배정인원", "현역편입인원", "보충역배정인원", "보충역편입인원", "접수방법"],
    coreText: ["공고번호", "공고제목", "업체명", "담당업무"],
    coreNum: [],
    detailText: ["주소", "담당자연락처", "대표연락처", "비고", "홈페이지주소", "사업자등록번호"],
    detailNum: [],
    sorts: ["최신순", "연봉순", "마감일순"],
}

/** 아직 채우지 않은 현역 자리. 검색조건과 정렬(`${현역잔여}순`)의 이름이고, 값은 빌드 때 계산한다(encode.ts). */
export const 현역잔여 = "현역배정인원−현역편입인원"

export const 병역지정업체: Schema = {
    main: ["요원", "업종", "기업규모", "주소", "채용유무", 현역잔여],
    more: ["지방청", "선정년도", "연구분야"],
    matchAll: [],
    cats: [],
    coreText: ["업체명"],
    coreNum: ["업체코드"],
    detailText: ["주소", "전화번호", "팩스번호", "주생산품목"],
    detailNum: ["현역배정인원", "현역편입인원", "현역복무인원", "보충역배정인원", "보충역편입인원", "보충역복무인원"],
    sorts: ["업체명순", "최신순", "복무인원순", `${현역잔여}순`],
}
