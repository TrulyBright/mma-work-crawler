<script lang="ts">
import { Job } from "@/models/Job"
export default {
    props: {
        job: {
            type: Job,
            required: true
        },
    },
    data() {
        return {
            favorite: this.job.isFavorite
        }
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
            this.$el.querySelector(".card-body").classList.add("expanded");
        },
        hideDetail() {
            this.$el.querySelector(".detail").classList.add("d-none");
            this.$el.scrollIntoView();
            this.$el.querySelector(".card-body").classList.remove("expanded");
        },
    },
}
</script>
<template>
    <div class="card g-col-6 shadow-sm" @mouseover="emboss" @mouseout="engrave">
        <div class="card-header">
            <div class="card-header-info">
                <div>{{ job.data.get("업종") }}</div>
                <div><small>{{ job.data.get("고용형태") }}</small></div>
            </div>
            <div>
                <svg v-if="favorite" class="card-header-star" @click="job.toggleFavorite(); favorite = !favorite"
                    xmlns="http://www.w3.org/2000/svg" height="1em"
                    viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
                    <path
                        d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z" />
                </svg>
                <svg v-else class="card-header-star" @click="job.toggleFavorite(); favorite = !favorite"
                    xmlns="http://www.w3.org/2000/svg" height="1em"
                    viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
                    <path
                        d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.6 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z" />
                </svg>
            </div>
        </div>
        <div class="card-body" @click="showDetail">
            <div class="card-title fw-bold">
                {{ job.data.get("업체명") }}
                <a :href="'https://www.jobplanet.co.kr/search?query=' + job.data.get('업체명')">
                    <img src="https://jpassets.jobplanet.co.kr/production/uploads/material/media/8456/jp_wordmark_green.svg"
                        class="jobplanet-link" />
                </a>
            </div>
            <div class="card-text">
                <p>{{ job.data.get("주소") }}</p>
                <p>{{ job.data.get("급여조건") }}</p>
                <p>{{ job.data.get("모집인원") }} 모집</p>
                <div class="detail d-none">
                    <div v-for="[entry, value] of Array.from(job.data.entries())
                        .filter(([entry, value]) => typeof value === 'string'
                            && !['업종', '고용형태', '업체명', '주소', '급여조건', '모집인원'].includes(entry))" :key="entry"
                        :class="entry === '비고' ? 'description' : ''">
                        <label class="fw-bold">{{ entry }}</label>
                        <template v-if="entry === '홈페이지'">
                            <p><a :href="job.linkToExternal()">{{ value }}</a></p>
                        </template>
                        <p v-else v-for="p in value.split('\n')" :key="p">{{ p }}</p>
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
.card-body:not(.expanded) {
    cursor: pointer;
}

.card-header {
    display: flex;
    justify-content: space-between;
}

.card-header-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.card-header-star {
    cursor: pointer;
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

.card-body:not(.expanded) .hide-detail {
    display: none;
}
</style>