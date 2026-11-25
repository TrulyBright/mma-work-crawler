// 화면은 문자열로 그린다. 빌드 때 정적 HTML을 만들 때와 브라우저에서 행을 새로 그릴 때 같은 함수를 쓴다.

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "\n": "&#10;" }

/** 글자와 속성값 모두에 쓸 수 있게 바꾼다. */
export const esc = (s: string) => s.replace(/[&<>"\n]/g, (c) => ESCAPES[c])

/** 글 안의 줄바꿈은 그대로 둔다(.pre가 줄을 나눈다). */
export const text = (s: string) => s.replace(/[&<>]/g, (c) => ESCAPES[c])
