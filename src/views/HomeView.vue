<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import ProjectCard from '@/components/ProjectCard.vue'
import { projects } from '@/data/projects'
</script>

<template>
  <main class="page">
    <nav class="top">
      <RouterLink class="btn tasks-link" to="/tasks">
        <AppIcon name="tasks" :size="16" />
        מעבר לאזור המשימות
      </RouterLink>
    </nav>
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

.top { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.tasks-link {
  box-sizing: border-box;
  min-height: 32px;
  padding-inline: 12px;
  border-color: rgba(18, 39, 54, 0.14);
  border-radius: 8px;
  font-size: 14px;
  text-decoration: none;
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
