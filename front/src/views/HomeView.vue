<script setup lang="ts">
import MainTitle from "@/components/MainTitle.vue"
import JobItem from "@/components/JobItem.vue"
</script>
<script lang="ts">
import mmaData from "../../data.json"
import timeData from "../../time.json"
import * as Hangul from "hangul-js"
export default {
    name: "HomeView",
    components: {
        MainTitle,
    },
    data() {
        return {
            jobs: mmaData,
            queried: new Object(),
            lastUpdate: new Date(timeData.time * 1000),
            keysForSelectTag: [
                "업종",
                "요원형태",
                "고용형태",
                "교대근무",
                "특근잔업",
                "전직자채용가능",
                "현역배정인원",
            ],
            regionPool: new Object()
        }
    },
    mounted() {
        this.jobs = this.jobs.filter(job=>job.업체명) // 마감된 공고는 제외함.
        this.jobs.forEach((job: any) => {
            job.filteredOutBy = new Set<string>()
            job.visible = true
        })
        // @ts-ignore
        this.keysForSelectTag.forEach((key) => this.queried[key] = "")
        // @ts-ignore
        this.queried.업체명 = ""
        // @ts-ignore
        this.queried["시/도"] = ""
        // @ts-ignore
        this.queried["시군구"] = ""
        this.updateRegionPool()
    },
    methods: {
        updateVisible(job: any) {
            job.visible = job.filteredOutBy.size === 0
        },
        searchByFilter(key: string) {
            this.jobs.forEach((job: any) => {
                // @ts-ignore
                const queried_value = this.queried[key]
                const job_value = job[key]
                if (!queried_value || queried_value === job_value)
                    job.filteredOutBy.delete(key)
                else job.filteredOutBy.add(key)
                this.updateVisible(job)
            })
        },
        searchName(e: Event) {
            // @ts-ignore
            const input: string = e.target!.value
            const searcher = new Hangul.Searcher(input)
            this.jobs.forEach((job: any) => {
                const index = searcher.search(job.업체명)
                job.filteredOutBy.delete("업체명")
                if (index === -1) job.filteredOutBy.add("업체명")
                this.updateVisible(job)
            })
        },
        searchByRegion() {
            // @ts-ignore
            if (this.queried["시/도"] === "")
                // @ts-ignore
                this.queried["시군구"] = ""
            this.jobs.forEach((job: any) => {
                // @ts-ignore
                if (job["주소"].includes(this.queried["시/도"]) && job["주소"].includes(this.queried["시군구"]))
                    job.filteredOutBy.delete("주소")
                else job.filteredOutBy.add("주소")
                this.updateVisible(job)
            })
        },
        optionPool(optionName: string) {
            const pool = new Set<string | number | boolean>()
            this.jobs.forEach((job: any) => {
                pool.add(job[optionName])
            })
            return pool
        },
        updateRegionPool() {
            this.jobs.forEach((job: any) => {
                const region = job["주소"].split(" ", 2)
                // @ts-ignore
                if (!this.regionPool[region[0]])
                    // @ts-ignore
                    this.regionPool[region[0]] = new Set<string>()
                // @ts-ignore
                this.regionPool[region[0]].add(region[1])
            })
        }
    },
}
</script>
<template>
    <MainTitle></MainTitle>
    <div>현재 공고가 총 {{ jobs.length }}개 있습니다.</div>
    <div id="filter-panel" class="p-1">
        <template v-for="entry in keysForSelectTag" :key="entry">
            <div>
                <label :for="entry">{{ entry }}</label>
                <!-- @vue-ignore -->
                <select class="form-select" :name="entry" v-model="queried[entry]" @change="searchByFilter(entry)">
                    <option value="" selected>전체</option>
                    <option
                    v-for="option in optionPool(entry)"
                    :value="option"
                    :key="String(option)"
                    >{{ option }}</option>
                </select>
            </div>
        </template>
        <div>
            <label for="시/도">시/도</label>
            <!-- @vue-ignore -->
            <select class="form-select" name="시/도" v-model="queried['시/도']" @change="searchByRegion">
                <option value="" selected>전체</option>
                <option v-for="sido in Object.keys(regionPool).sort()" :key="String(sido)">{{ sido }}</option>
            </select>
        </div>
        <div>
            <label for="시군구">시군구</label>
            <!-- @vue-ignore -->
            <select class="form-select" name="시군구" v-model="queried['시군구']" @change="searchByRegion">
                <option value="" selected>전체</option>
                <!-- @vue-ignore -->
                <option v-for="r in regionPool[queried['시/도']]" :value="r" :key="String(r)">{{ r }}</option>
            </select>
        </div>
    </div>
    <!-- @vue-ignore -->
    <input type="text" class="form-control w-50 my-1" placeholder="삼성전자" @input="searchName">
    <div id="list" class="grid gap-3 m-3">
        <template v-for="job in jobs" :key="job">
            <!-- @vue-ignore -->
            <JobItem v-if="job.visible" :job="job"></JobItem>
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
</template>
<style>
#filter-panel {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
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
</style>