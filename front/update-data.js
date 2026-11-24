import fs from "fs"

const headers = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

const res = await fetch(`https://api.github.com/gists/${process.env.GIST_ID}`, { headers })
if (!res.ok) throw new Error(`Gist를 불러오지 못했습니다. (${res.status})`)
const gist = await res.json()

fs.mkdirSync("data", { recursive: true })
for (const name of ["채용공고목록.json", "병역지정업체목록.json"]) {
    const file = gist.files[name]
    if (!file) {
        console.warn(`Gist에 ${name}이 없습니다.`)
        continue
    }
    const raw = await fetch(file.raw_url)
    if (!raw.ok) throw new Error(`${name}을 불러오지 못했습니다. (${raw.status})`)
    fs.writeFileSync(`data/${name}`, await raw.text())
}
fs.writeFileSync("data/최종갱신.json", JSON.stringify(gist.updated_at))
