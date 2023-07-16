<script lang="ts">
export default {
    props: {
        job: {
            type: Map<string, string>,
            required: true
        },
    },
    methods: {
        emboss() {
            this.$el.classList.remove("shadow-sm")
            this.$el.classList.add("shadow")
        },
        engrave() {
            this.$el.classList.add("shadow-sm")
            this.$el.classList.remove("shadow")
        },
        showDetail() {
            this.$el.querySelector(".detail").classList.remove("d-none");
            this.$el.classList.add("expanded");
        },
        hideDetail() {
            this.$el.querySelector(".detail").classList.add("d-none");
            this.$el.scrollIntoView();
            this.$el.classList.remove("expanded");
        }
    }
}
</script>
<template>
    <div class="card g-col-6 shadow-sm" @mouseover="emboss" @mouseout="engrave" @click="showDetail">
        <div class="card-header">
            <div>{{ job?.get("업종") }}</div>
            <div>{{ job?.get("고용형태") }}</div>
        </div>
        <div class="card-body">
            <div class="card-title fw-bold">
                {{ job.get("업체명") }}
                <a :href="'https://www.jobplanet.co.kr/search?query='+job!.get('업체명')">
                    <img src="https://jpassets.jobplanet.co.kr/production/uploads/material/media/8456/jp_wordmark_green.svg" class="jobplanet-link"/>
                </a>
            </div>
            <div class="card-text">
                <p>{{ job.get("주소") }}</p>
                <p>{{ job.get("급여조건") }}</p>
                <p>{{ job.get("모집인원") }} 모집</p>
                <div class="detail d-none">
                    <div
                        v-for="[entry, value] of Array.from(job.entries())
                            .filter(([entry, value]) => typeof value==='string'
                                && !['업종', '고용형태', '업체명', '주소', '급여조건', '모집인원'].includes(entry))"
                        :key="entry"
                        :class="entry === '비고' ? 'description' : ''">
                        <label class="fw-bold">{{ entry }}</label>
                        <!-- @vue-ignore -->
                        <p v-for="p in value.split('\n')" :key="p">{{ p }}</p>
                    </div>
                </div>
            </div>
            <div class="hide-detail">
                <small @click.stop="hideDetail">접기</small>
            </div>
        </div>
    </div>
</template>
<style scoped>
.card:not(.expanded) {
    cursor: pointer;
}
.card-header {
    display: flex;
    justify-content: space-between;
}
.jobplanet-link {
    height: 15px;
}
.detail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    word-break: break-all;
}
.description {
    grid-column: 1 / 3;
}
.hide-detail {
    cursor: pointer;
    text-align: right;
    color: grey;
}
.card:not(.expanded) .hide-detail {
    display: none;
}
</style>