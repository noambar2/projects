<script setup lang="ts">
import type { LinkType, Project } from '@/data/projects'

defineProps<{ project: Project }>()

const LINK_LABELS: Record<Exclude<LinkType, 'env'>, string> = {
  mockup: 'מוקאפ',
  figma: 'פיגמה',
  git: 'גיט',
}

const DEVICE_LABELS = {
  mobile: 'מוקאפ מותאם למובייל',
  desktop: 'מוקאפ למחשב בלבד',
}
</script>

<template>
  <li class="project">
    <div class="info">
      <div v-if="project.area || project.mockupDevice" class="chips">
        <span v-if="project.area" class="area">{{ project.area }}</span>
        <span v-if="project.mockupDevice" class="chip" :class="project.mockupDevice">
          {{ DEVICE_LABELS[project.mockupDevice] }}
        </span>
      </div>
      <h2>{{ project.title }}<span class="dot">.</span></h2>
      <p v-if="project.note" class="note">{{ project.note }}</p>
    </div>
    <div class="links">
      <a
        v-for="link in project.links"
        :key="link.url"
        :class="link.type"
        :href="link.url"
        target="_blank"
        rel="noopener"
      >{{ link.type === 'env' ? link.label : LINK_LABELS[link.type] }}</a>
    </div>
    <section v-for="section in project.sections" :key="section.title" class="section">
      <div class="section-head">
        <h3>{{ section.title }}</h3>
        <span v-if="section.mockupDevice" class="chip" :class="section.mockupDevice">
          {{ DEVICE_LABELS[section.mockupDevice] }}
        </span>
      </div>
      <div class="links">
        <a
          v-for="link in section.links"
          :key="link.url"
          :class="link.type"
          :href="link.url"
          target="_blank"
          rel="noopener"
        >{{ link.type === 'env' ? link.label : LINK_LABELS[link.type] }}</a>
      </div>
    </section>
  </li>
</template>

<style scoped>
.project {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  background: var(--card);
  border-radius: 10px;
  box-shadow: var(--shadow);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.project:hover { box-shadow: var(--shadow-hover); transform: translateY(-2px); }

.info {
  flex: 1;
  min-width: 0;
  padding: 24px 24px 0;
}

.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.area, .chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
}
.area { background: var(--blue-tint); color: var(--blue-text); }
.chip::before {
  content: "";
  flex: none;
  width: 14px;
  height: 14px;
  background: currentColor;
  -webkit-mask: var(--icon) center / contain no-repeat;
  mask: var(--icon) center / contain no-repeat;
}
.chip.mobile {
  background: var(--green-tint);
  color: var(--green-text);
  --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='6' y='2' width='12' height='20' rx='2'/%3E%3Cpath d='M11 18h2'/%3E%3C/svg%3E");
}
.chip.desktop {
  background: rgba(18, 39, 54, 0.08);
  color: var(--muted);
  --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='2' y='4' width='20' height='13' rx='2'/%3E%3Cpath d='M8 21h8M12 17v4'/%3E%3C/svg%3E");
}

h2 {
  margin: 0;
  color: var(--navy);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
  text-wrap: balance;
}
.dot { color: var(--green); }
.note { margin: 6px 0 0; color: var(--muted); font-size: 15px; }

.links { display: flex; flex-wrap: wrap; gap: 8px; padding: 20px 24px 24px; }
.links a {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  padding-inline: 16px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  transition: border-color 0.15s ease, filter 0.15s ease;
}
.links a:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }

.mockup, .figma, .git { white-space: nowrap; }
.mockup::before, .figma::before, .git::before {
  content: "";
  flex: none;
  width: 18px;
  height: 18px;
  background: currentColor;
  -webkit-mask: var(--icon) center / contain no-repeat;
  mask: var(--icon) center / contain no-repeat;
}

.links .mockup {
  background: var(--cta);
  color: #ffffff;
  font-weight: 700;
  --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='16' rx='2'/%3E%3Cpath d='M3 9h18M7 6.5h.01M10 6.5h.01'/%3E%3C/svg%3E");
}
.links .mockup:hover { filter: brightness(1.1); }

.links .figma {
  background: #f1e9ff;
  color: #5b21b6;
  --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='black'%3E%3Cpath d='M8.33 2H12v6.67H8.33a3.33 3.33 0 0 1 0-6.67zM12 2h3.67a3.33 3.33 0 0 1 0 6.67H12zM8.33 8.67H12v6.66H8.33a3.33 3.33 0 0 1 0-6.66zM8.67 15.33H12v3.34a3.33 3.33 0 1 1-3.33-3.34z'/%3E%3Ccircle cx='15.33' cy='12' r='3.33'/%3E%3C/svg%3E");
}
.links .figma:hover { border-color: #5b21b6; }

.links .git {
  background: #fff0e3;
  color: #9a3f06;
  --icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 7l-5 5 5 5M16 7l5 5-5 5M14 5l-4 14'/%3E%3C/svg%3E");
}
.links .git:hover { border-color: #9a3f06; }

.links .env { background: var(--green-tint); color: var(--green-text); }
.links .env:hover { border-color: var(--green-text); }

.section { margin-inline: 24px; border-top: 1px solid rgba(18, 39, 54, 0.1); }
.section .links { padding-inline: 0; padding-top: 12px; }
.section-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding-top: 16px; }
h3 { margin: 0; color: var(--navy); font-size: 17px; font-weight: 700; }

@media (max-width: 720px) {
  .info { padding: 20px 20px 0; }
  .links { padding: 16px 20px 20px; }
  .section { margin-inline: 20px; }
  h2 { font-size: 22px; }
}
@media (max-width: 360px) {
  .info { padding: 16px 16px 0; }
  .links { gap: 6px; padding: 14px 16px 16px; }
  .section { margin-inline: 16px; }
  .links a { gap: 6px; padding-inline: 8px; }
}
@media (prefers-reduced-motion: reduce) {
  .project, .links a { transition: none; }
  .project:hover { transform: none; }
}
</style>
