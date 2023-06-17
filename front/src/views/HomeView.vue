<script setup lang="ts">
import MainTitle from "@/components/MainTitle.vue"
</script>
<script lang="ts">
import {API_URL, Job} from "@/shared"
export default {
    name: "HomeView",
    components: {
        MainTitle,
    },
    data() {
        return {
            jobs: Array<Job>(),
            queried: new Job()
        }
    },
    async mounted() {
        await this.fetch()
    },
    methods: {
        async fetch() {
            const response = await fetch(API_URL)
            const parsed: [Object] = await response.json()
            parsed.forEach((obj: Object) => {
                const job = new Job()
                Object.assign(job, obj)
                this.jobs.push(job)
            })
        },
        async search() {
            this.jobs.forEach((job) => {
                job.visible = true
                Job.keys_for_select_tag().forEach((key) => {
                    const queried_value = this.queried[key as keyof Job]
                    const job_value = job[key as keyof Job]
                    job.visible &&= (!queried_value || queried_value === job_value)
                })
            })
        },
        optionPool(optionName: string) {
            const pool = new Set<string | number | boolean>()
            this.jobs.forEach((job) => {
                pool.add(job[optionName as keyof typeof job])
            })
            return pool
        }
    },
}
</script>
<template>
    <MainTitle></MainTitle>
    <div id="filter-panel">
        <template v-for="entry in Job.keys_for_select_tag()" :key="entry">
            <label :for="entry">{{ entry }}</label>
            <select name="key" v-model="queried[entry as keyof typeof queried]" @change="search">
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
        <template v-for="job in jobs" :key="job.id">
        <li v-if="job.visible">{{ job }}</li>
        </template>
    </ul>
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