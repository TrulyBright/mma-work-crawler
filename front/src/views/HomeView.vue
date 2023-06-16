<script setup lang="ts">
import MainTitle from "@/components/MainTitle.vue";
</script>
<template>
    <MainTitle></MainTitle>
    <div id="panel">
        <select name="복무형태">
            <option value="산업기능요원">산업기능요원</option>
            <option value="전문연구요원">전문연구요원</option>
        </select>
        <select name="지역">
            <option value="전체">전체</option>
            <option value="서울">서울</option>
            <option value="경기">경기</option>
            <option value="인천">인천</option>
            <option value="강원">강원</option>
            <option value="충북">충북</option>
            <option value="충남">충남</option>
            <option value="대전">대전</option>
            <option value="경북">경북</option>
            <option value="경남">경남</option>
            <option value="대구">대구</option>
            <option value="울산">울산</option>
            <option value="부산">부산</option>
            <option value="전북">전북</option>
            <option value="전남">전남</option>
            <option value="광주">광주</option>
            <option value="제주">제주</option>
        </select>
        <select name="역종">
            <option value="보충역">보충역</option>
            <option value="현역">현역</option>
            <option value="전체">전체</option>
        </select>
        <div>
            <label for="전직자채용가능">전직자 채용가능</label><input type="checkbox" name="전직자채용가능">
        </div>
        <div>
            <input type="text" inputmode="text" name="업체명" placeholder="업체명">
        </div>
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
</style>