<script lang="ts">
import { Job } from "@/models/Job"
export default {
    props: {
        job: {
            type: Job,
            required: true
        }
    }
}
</script>
<template>
    <div class="modal fade" id="job-detail-modal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5">{{ job.data.get('업체명') }}</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div v-for="[entry, value] of job.data.entries()">
                        <label class=" fw-bold">{{ entry }}</label>
                        <template v-if="entry === '홈페이지'">
                            <p><a :href="job.linkToExternal()">{{ value }}</a></p>
                        </template>
                        <p v-else v-for="p in value.split('\n')" :key="p">{{ p }}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light">
                        <a :href="'https://www.jobplanet.co.kr/search?query=' + job.data.get('업체명')">
                            <img src="https://jpassets.jobplanet.co.kr/production/uploads/material/media/8456/jp_wordmark_green.svg"
                                class="jobplanet-link" />
                        </a>
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
.modal-footer {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
</style>