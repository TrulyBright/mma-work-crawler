import { useRouteError, isRouteErrorResponse } from "react-router-dom"

export default () => {
    const error = useRouteError()
    let errorMessage: string;
    if (isRouteErrorResponse(error)) {
        errorMessage = error.statusText
    } else if (error instanceof Error) {
        errorMessage = error.message
    } else if (typeof error === "string") {
        errorMessage = error
    } else {
        console.log(error)
        errorMessage = "알 수 없는 오류"
    }
    return (
        <div id="error-page">
            <h1>오류</h1>
            <p>예상치 못한 오류가 발생했습니다.</p>
            <p><i>{errorMessage}</i></p>
        </div>
    )
}