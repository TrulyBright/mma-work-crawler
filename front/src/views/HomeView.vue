<script setup lang="ts">
import MainTitle from "@/components/MainTitle.vue"
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
                "전공계열",
                "전직자채용가능",
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
                    job.visible &&= (!queried_value || queried_value === job_value)
                })
            })
        },
        optionPool(optionName: string) {
            const pool = new Set<string | number | boolean>()
            this.jobs.forEach((job: any) => {
                const value = job[optionName]
                if (value) {
                    pool.add(value)
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
            <label :for="entry">{{ entry }}</label>
            <!-- @vue-ignore -->
            <select name="key" v-model="queried[entry]" @change="search">
                <option value="" selected>전체</option>
                <option
                v-for="option in optionPool(entry)"
                :value="option"
                :key="String(option)"
                >{{ option }}</option>
            </select>
        </template>
    </div>
    <ul id="result">
        <template v-for="job in jobs" :key="job">
            <!-- @vue-ignore -->
            <li v-if="job.visible">{{ job }}</li>
        </template>
    </ul>
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
#app {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
}
#result {
    overflow: auto;
}
</style>