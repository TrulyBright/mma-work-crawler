<script setup lang="ts">
import MainTitle from "@/components/MainTitle.vue"
import JobItem from "@/components/JobItem.vue"
</script>
<script lang="ts">
import mmaData from "../../data.json"
import timeData from "../../time.json"
import * as Hangul from "hangul-js"

class Job {
    data!: Map<string, string>
    filteredOutBy = new Set<string>()
    constructor(data: Map<string, string>) {
        this.data = data
    }
    get visible() { return this.filteredOutBy.size === 0 }
}

class Addr {
    시도!: string
    시군구!: string
    constructor(시도: string, 시군구: string) {
        this.시도 = 시도
        this.시군구 = 시군구
    }
}
export default {
    name: "HomeView",
    components: {
        MainTitle,
    },
    data() {
        const entries = [
            "업종",
            "요원형태",
            "고용형태",
            "교대근무",
            "특근잔업",
            "전직자채용가능",
            "현역배정인원",
        ]
        const _data = {
            jobs: mmaData
                .filter((job) => job.업체명) // 업체명이 없으면 마감된 공고다.
                .map((job) => {
                    const _job = new Job(new Map(Object.entries(job)))
                    _job.filteredOutBy = new Set<string>()
                    return _job
                }),
            queried: new Map(
                entries.map((entry) => [entry, new Set<string>()])
            ),
            lastUpdate: new Date(timeData.time * 1000),
            entries: entries,
            regionPool: new Map<string, Set<string>>(),
            optionPool: new Map<string, Set<string>>(),
        }
        mmaData.forEach((job) => {
            entries.forEach((entry: string) => {
                const value = job[entry as keyof typeof job]
                if (!_data.optionPool.get(entry))
                    _data.optionPool.set(entry, new Set<string>())
                _data.optionPool.get(entry)!.add(value)
            })
        })
        mmaData.forEach((job) => {
            const region = job.주소.split(" ", 2)
            if (!_data.regionPool.get(region[0]))
                _data.regionPool.set(region[0], new Set<string>())
            _data.regionPool.get(region[0])!.add(region[1])
        })
        _data.queried.set("시/도", new Set<string>())
        _data.queried.set("시군구", new Set<string>())
        return _data
    },
    mounted() {
        const filterPanel = document.getElementById("filter-panel")!
        const observer = new IntersectionObserver(
            ([e]) => e.target.classList.toggle("sticky", e.intersectionRatio < 1),
            { threshold: [1] }
        )
        observer.observe(filterPanel)
        const params = new URLSearchParams(window.location.search)
        for (const [key, valueArr] of params.entries()) {
            if (this.queried.has(key)) { // A filter has that key.
                for (const value of valueArr.split(",")) {
                    this.toggleOption(key, value)
                }
                this.searchByFilter(key)
            }
        }
        this.searchByName(params.get("업체명") || "")
        this.searchByRegion()
    },
    methods: {
        searchByFilter(key: string) {
            this.jobs.forEach((job) => {
                const queried_value = this.queried.get(key)!
                const job_value = job.data.get(key)!
                if (queried_value.size === 0 || queried_value.has(job_value))
                    job.filteredOutBy.delete(key)
                else job.filteredOutBy.add(key)
            })
        },
        searchByName(name: string) {
            const searcher = new Hangul.Searcher(name)
            this.jobs.forEach((job) => {
                const index = searcher.search(job.data.get("업체명")!)
                job.filteredOutBy.delete("업체명")
                if (index === -1) job.filteredOutBy.add("업체명")
            })
        },
        searchByRegion() {
            const sidoQueried = this.queried.get("시/도")!
            const sigunguQueried = this.queried.get("시군구")!
            this.jobs.forEach((job) => {
                const region = job.data.get("주소")!.split(" ", 2)
                job.filteredOutBy.delete("시/도")
                if (sidoQueried.size === 0 || sidoQueried.has(region[0]))
                    job.filteredOutBy.delete("시/도")
                else job.filteredOutBy.add("시/도")
                job.filteredOutBy.delete("시군구")
                if (sigunguQueried.size === 0 || sigunguQueried.has(region[1]))
                    job.filteredOutBy.delete("시군구")
                else job.filteredOutBy.add("시군구")
            })
        },
        toggleOption(entry: string, value: string) {
            const queried_values = this.queried.get(entry)!
            if (queried_values.has(value)) queried_values.delete(value)
            else queried_values.add(value)
            this.updateParams(entry, Array.from(queried_values))
        },
        updateParams(key: string, values: string[]) {
            const params = new URLSearchParams(window.location.search)
            if (values.length === 0) params.delete(key)
            else params.set(key, values.join(","))
            window.history.replaceState(
                {},
                "",
                `${window.location.pathname}?${params.toString()}`
            )
        },
    },
    computed: {
        sigunguPool() {
            const pool = Array<Addr>()
            const sidoQueried = this.queried.get("시/도")!
            if (sidoQueried.size === 0) return pool
            this.regionPool.forEach((value, key) => {
                if (sidoQueried!.has(key)) {
                    value.forEach((sigungu) => {
                        pool.push(new Addr(key, sigungu))
                    })
                }
            })
            return pool
        },
    }
}
</script>
<template>
    <MainTitle></MainTitle>
    <div>현재 공고가 총 {{ jobs.length }}개 있습니다.</div>
    <div id="filter-panel" class="p-1">
        <div class="dropdown" v-for="entry in entries" :key="entry">
            <button class="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" type="button">{{ entry }}</button>
            <ul class="dropdown-menu">
                <li v-for="option in optionPool.get(entry)" :key="String(option)" class="p-1">
                    <label for="option" class="px-1">{{ option }}</label>
                    <input type="checkbox" :checked="queried.get(entry)!.has(option)" @change="toggleOption(entry, option); searchByFilter(entry)">
                </li>
            </ul>
        </div>
        <div class="dropdown">
            <button class="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" type="button">시/도</button>
            <ul class="dropdown-menu">
                <li v-for="sido in Array.from(regionPool.keys()).sort()" :key="String(sido)" class="p-1">
                    <label for="option" class="px-1">{{ sido }}</label>
                    <input type="checkbox" :checked="queried.get('시/도')!.has(sido)" @change="toggleOption('시/도', sido); searchByRegion()">
                </li>
            </ul>
        </div>
        <div class="dropdown">
            <button class="btn btn-sm dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" type="button">시군구</button>
            <ul class="dropdown-menu">
                <li v-for="addr in sigunguPool" :key="String(addr)" class="p-1">
                    <label for="option" class="px-1">{{ addr.시도}} {{ addr.시군구 }}</label>
                    <input type="checkbox" :checked="queried.get('시군구')!.has(addr.시군구)" @change="toggleOption('시군구', addr.시군구); searchByRegion()">
                </li>
            </ul>
        </div>
        <input type="text" class="form-control w-25 my-1" placeholder="삼성전자" @input="searchByName(($event.target! as HTMLInputElement).value); updateParams('업체명', [($event.target! as HTMLInputElement).value])">
    </div>
    <div id="list" class="grid gap-3 m-3">
        <template v-for="job in jobs" :key="job">
            <JobItem v-show="job.visible" :job="job.data"></JobItem>
        </template>
    </div>
    <div id="last-update">
        최근 갱신: {{ lastUpdate.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "short",
            day: "numeric",
            weekday: "long",
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
        }) }}
    </div>
    <div id="github-icon" class="p-1">
        <a href="https://github.com/TrulyBright/mma-work-crawler" id="github-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-github"
                viewBox="0 0 16 16">
                <path
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
        </a>
    </div>
</template>
<style>
#filter-panel {
    position: sticky;
    top: -1px;
    z-index: 999;
    background: white;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    padding: 0.5rem;
}

#filter-panel.sticky {
    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.1);
}

.dropdown-menu {
    max-height: 20rem;
    overflow-y: auto;
    min-width: max-content;
}

#list {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
}

@media (min-width: 280px) {
    #list {
        grid-template-columns: 1fr;
    }
}

@media (min-width: 480px) {
    #list {
        grid-template-columns: 1fr 1fr;
    }
}

@media (min-width: 768px) {
    #list {
        grid-template-columns: 1fr 1fr 1fr;
    }
}

@media (min-width: 1024px) {
    #list {
        grid-template-columns: 1fr 1fr 1fr 1fr;
    }
}

#github-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    color: black;
}

#fields-button {
    display: flex;
    flex-direction: row;
    justify-content: left;
}
</style>