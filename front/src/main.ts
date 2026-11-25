// 화면은 빌드 때 HTML로 미리 그려져 있다. 여기서는 그 위에 검색 기능만 붙인다.
import { startRouter } from "./app/router.ts"
import { startShell } from "./app/shell.ts"

startShell()
startRouter()
