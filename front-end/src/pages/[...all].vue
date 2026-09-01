<!-- Preserve the Tutor Lyfe semantic class order. -->
<script setup lang="ts">
/* eslint-disable unocss/order */
const router = useRouter()

useSeoMeta({
  title: 'Page Not Found | The Tutor Lyfe',
  description: 'The page you requested could not be found.',
  robots: 'noindex, nofollow',
})

useScrollReveal()
</script>

<template>
  <div>
    <section class="page-hero">
      <div class="container">
        <div class="breadcrumb">
          <NuxtLink to="/">
            Home
          </NuxtLink> / Not Found
        </div>
        <h1>Page not found</h1>
        <p>We couldn't find the page you're looking for.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="card not-found-card reveal">
          <div class="icon">
            🔎
          </div>
          <h2>Let's get you back on track</h2>
          <p>The page may have moved, or the address may have been typed incorrectly.</p>
          <div class="hero-actions not-found-actions">
            <NuxtLink class="btn btn-primary" to="/">
              Return Home
            </NuxtLink>
            <button type="button" class="btn btn-ghost" @click="router.back()">
              Go Back
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
