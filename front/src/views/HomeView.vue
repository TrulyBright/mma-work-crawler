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
            job.visible = true
        })
        // @ts-ignore
        this.keysForSelectTag.forEach((key) => this.queried[key] = "");
    },
    methods: {
        search() {
            console.log(this.queried)
            this.jobs.forEach((job: any) => {
                job.visible = true
                this.keysForSelectTag.forEach((key) => {
                    // @ts-ignore
                    const queried_value = this.queried[key]
                    const job_value = job[key]
                    job.visible &&= (
                        !queried_value ||
                        queried_value === job_value ||
                        // @ts-ignore
                        (key === "지역" && job.주소.includes(this.queried[key]))
                    )
                })
            })
        },
        optionPool(optionName: string) {
            const pool = new Set<string | number | boolean>()
            this.jobs.forEach((job: any) => {
                if (optionName === "지역") {
                    const value = job.주소;
                    pool.add(value.split(" ", 1)[0])
                } else {
                    const value = job[optionName]
                    if (value) {
                        pool.add(value)
                    }
                }
            })
            return pool
        }
    },
}
</script>
<template>
    <MainTitle></MainTitle>
    <div id="filter-panel">
        <template v-for="entry in keysForSelectTag" :key="entry">
            <div>
                <label :for="entry">{{ entry }}</label>
                <!-- @vue-ignore -->
                <select class="form-select" name="key" v-model="queried[entry]" @change="search">
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
    <input type="text" class="form-control w-50 my-1" placeholder="삼성전자">
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
</style>