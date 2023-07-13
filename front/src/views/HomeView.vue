<script setup lang="ts">
import MainTitle from "@/components/MainTitle.vue"
import JobItem from "@/components/JobItem.vue"
</script>
<script lang="ts">
import mmaData from "../../data.json"
import timeData from "../../time.json"
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
                "자격요원",
                "최종학력",
                "전직자채용가능",
                "현역배정인원",
                "지역",
            ]
        }
    },
    mounted() {
        this.jobs.forEach((job: any) => {
            job.filteredBy = new Set<string>()
            job.visible = true
        })
        // @ts-ignore
        this.keysForSelectTag.forEach((key) => this.queried[key] = "")
        // @ts-ignore
        this.queried.업체명 = ""
    },
    methods: {
        search(key: string) {
            this.jobs.forEach((job: any) => {
                if (key === "업체명") {
                    // @ts-ignore
                    if (!this.queried.업체명 || job.업체명.includes(this.queried.업체명))
                        job.filteredBy.delete(key)
                    else job.filteredBy.add(key)
                } else {
                    // @ts-ignore
                    const queried_value = this.queried[key]
                    const job_value = job[key]
                    if (
                        !queried_value ||
                        queried_value === job_value ||
                        // @ts-ignore
                        (key === "지역" && job.주소.includes(this.queried[key]))
                    ) job.filteredBy.delete(key)
                    else job.filteredBy.add(key)
                }
                job.visible = job.filteredBy.size === 0
            })
        },
        searchName(e: Event) {
            // @ts-ignore
            this.queried.업체명 = e.target!.value
            // @ts-ignore
            this.search("업체명")
        },
        optionPool(optionName: string) {
            if (optionName === "지역") {
                return [
                    "서울특별시",
                    "부산광역시",
                    "대구광역시",
                    "인천광역시",
                    "광주광역시",
                    "대전광역시",
                    "울산광역시",
                    "세종특별자치시",
                    "경기도",
                    "강원특별자치도",
                    "충청북도",
                    "충청남도",
                    "전라북도",
                    "전라남도",
                    "경상북도",
                    "경상남도",
                    "제주특별자치도",
                ]
            }
            const pool = new Set<string | number | boolean>()
            this.jobs.forEach((job: any) => {
                pool.add(job[optionName])
            })
            return pool
        }
    },
}
</script>
<template>
    <MainTitle></MainTitle>
    <div id="filter-panel" class="p-1">
        <template v-for="entry in keysForSelectTag" :key="entry">
            <div>
                <label :for="entry">{{ entry }}</label>
                <!-- @vue-ignore -->
                <select class="form-select" name="key" v-model="queried[entry]" @change="search(entry)">
                    <option value="" selected>전체</option>
                    <option
                    v-for="option in optionPool(entry)"
                    :value="option"
                    :key="String(option)"
                    >{{ option }}</option>
                </select>
            </div>
        </template>
    </div>
    <!-- @vue-ignore -->
    <input type="text" class="form-control w-50 my-1" placeholder="삼성전자" @input="searchName">
    <div id="list" class="grid gap-3">
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
    grid-template-columns: 1fr 1fr 1fr 1fr;
}
#list {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
}
@media (min-width: 280px) {
    #filter-panel {
        grid-template-columns: 1fr 1fr;
    }
    #list {
        grid-template-columns: 1fr;
    }
}
@media (min-width: 480px) {
    #filter-panel {
        grid-template-columns: 1fr 1fr 1fr;
    }
    #list {
        grid-template-columns: 1fr 1fr;
    }
}
@media (min-width: 768px) {
    #filter-panel {
        grid-template-columns: 1fr 1fr 1fr 1fr;
    }
    #list {
        grid-template-columns: 1fr 1fr 1fr;
    }
}
@media (min-width: 1024px) {
    #list {
        grid-template-columns: 1fr 1fr 1fr 1fr;
    }
}
@media (min-width: 1280px) {
    #list {
        grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    }
}
</style>