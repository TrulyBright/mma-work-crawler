<script lang="ts">
export default {
    props: ['job'],
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
            this.$el.querySelector(".detail").classList.toggle("d-none");
        }
    }
}
</script>
<template>
    <div class="card g-col-6 shadow-sm" @mouseover="emboss" @mouseout="engrave" @click="showDetail">
        <div class="card-header">
            <div>{{ job.업종 }}</div>
            <div>{{ job.고용형태 }}</div>
        </div>
        <div class="card-body">
            <div class="card-title fw-bold">
                {{ job.업체명 }}
            </div>
            <div class="card-text">
                <p>{{ job.주소 }}</p>
                <p>{{ job.급여조건 }}</p>
                <p>{{ job.모집인원 }} 모집</p>
                <div class="detail d-none">
                    <div v-for="[entry, value] of Object.entries(job)" :key="entry">
                        <template v-if="typeof value === 'string' &&
                        !['업종', '고용형태', '업체명', '주소', '급여조건', '모집인원'].includes(entry)">
                            <label class="fw-bold">{{ entry }}</label>
                            <p v-for="p in value.split('\n')">{{ p }}</p>
                        </template>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
.card {
    cursor: pointer;
    transition: all 1s;
}
.card-header {
    display: flex;
    justify-content: space-between;
}
</style>