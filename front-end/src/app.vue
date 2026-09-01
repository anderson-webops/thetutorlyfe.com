<script setup lang="ts">
import { appDescription, appName } from '~/constants'

useHead({
  title: appName,
  htmlAttrs: {
    lang: 'en',
  },
})

useSeoMeta({
  description: appDescription,
  ogDescription: appDescription,
  ogImage: '/assets/logo.jpeg',
  ogSiteName: appName,
  ogTitle: appName,
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
