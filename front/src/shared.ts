export const API_URL = 'http://localhost:8000'
export class Job {
    id!: number;
    업체명!: string;
    업종!: string; // 선지
    전화번호!: string;
    주소!: string;
    홈페이지!: string;
    요원형태!: string; // 선지
    고용형태!: string; // 선지
    자격요원!: string; // 선지
    급여조건!: string;
    최종학력!: string; // 선지
    전공계열!: string; // 선지
    담당업무!: string;
    전직자채용가능!: string; // 선지
    근무형태!: string;
    출퇴근시간!: string;
    특근잔업!: string;
    교대근무!: string;
    수습기간!: string;
    군사훈련교육소집기간급여!: string;
    퇴직금지급!: string;
    식사비지급!: string;
    현역배정인원!: string;
    현역편입인원!: string;
    보충역배정인원!: string;
    보충역편입인원!: string;
    모집인원!: string;
    지원보험!: string;
    외국어!: string;
    자격증!: string;
    복리후생!: string;
    접수기간!: string;
    접수방법!: string;
    담당자!: string;
    참고!: string;
    담당자전화번호!: string;
    팩스번호!: string;
    비고!: string;

    visible = true;

    static keys_for_select_tag() {
        return [
            "업종",
            "요원형태",
            "고용형태",
            "자격요원",
            "최종학력",
            "전공계열",
            "전직자채용가능",
        ]
    }
}