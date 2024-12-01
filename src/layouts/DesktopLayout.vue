<template>
  <div class="desktop-layout">
    <div class="content">
      <liuren-pan class="main-panel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import LiurenPan from '../components/LiurenPan.vue'
</script>

<style scoped>
.desktop-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.main-panel {
  flex: 1;
}
</style>
