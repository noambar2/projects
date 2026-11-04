<script setup lang="ts">
import ProjectCard from '@/components/ProjectCard.vue'
import { projects } from '@/data/projects'
</script>

<template>
  <main class="page">
    <ul class="index">
      <ProjectCard v-for="project in projects" :key="project.title" :project="project" />
    </ul>
  </main>
</template>

<style scoped>
.page {
  max-width: 1040px;
  margin-inline: auto;
  padding-block: 48px 64px;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}

.index {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

@media (max-width: 720px) {
  .page { padding-block: 24px 40px; }
  .index { grid-template-columns: minmax(0, 1fr); gap: 16px; }
}
</style>
