import { Octokit } from "octokit"
import fs from "fs"

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
})

const res = await octokit.request(`GET /gists/${process.env.GIST_ID}`, {
    gist_id: process.env.GIST_ID,
    headers: {
        'X-GitHub-Api-Version': '2022-11-28'
    }
})

const 채용공고목록raw = res.data.files['채용공고목록.json']["raw_url"]
const 속성풀raw = res.data.files['속성풀.json']["raw_url"]
const 채용공고목록 = await fetch(채용공고목록raw).then(res => res.text())
const 속성풀 = await fetch(속성풀raw).then(res => res.text())

fs.writeFileSync('data/채용공고목록.json', 채용공고목록)
fs.writeFileSync('data/속성풀.json', 속성풀)
fs.writeFileSync('data/최종갱신.json', JSON.stringify(res.data.updated_at))