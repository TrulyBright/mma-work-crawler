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
            <div class="card-title">
                {{ job.업체명 }}
            </div>
            <div class="card-text">
                <p>{{ job.주소 }}</p>
                <p>{{ job.급여조건 }}</p>
            </div>
        </div>
        <div class="detail">
        </div>
    </div>
</template>
<style scoped>
.card {
    cursor: pointer;
}
.card-header {
    display: flex;
    justify-content: space-between;
}
</style>