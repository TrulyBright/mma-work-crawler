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
                    <div v-for="[entry, value] of Array.from(job.data.entries()).filter(([e, v]) => e !== '공고번호')">
                        <label class=" fw-bold">{{ entry }}</label>
                        <template v-if="entry === '홈페이지'">
                            <p><a :href="job.linkToExternal()">{{ value }}</a></p>
                        </template>
                        <p v-else v-for="p in value.split('\n')" :key="p">{{ p }}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <a class="btn btn-light jobplanet-link"
                        :href="'https://www.jobplanet.co.kr/search?query=' + job.data.get('업체명')">
                        <img
                            src="https://jpassets.jobplanet.co.kr/production/uploads/material/media/8456/jp_wordmark_green.svg" />
                    </a>
                    <a class="btn btn-light mma-link"
                        :href="'https://work.mma.go.kr/caisBYIS/search/cygonggogeomsaekView.do?cygonggo_no=' + job.data.get('공고번호')!">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/3f/Emblem_of_the_Government_of_the_Republic_of_Korea.svg"
                            class="mma-logo" />
                        <small>병역일터에서 보기</small>
                    </a>
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

.mma-link {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
}

.mma-logo {
    display: inline;
    width: 2em;
    height: auto;
}
</style>