<!-- Preserve the captured site's semantic class order. -->
<script setup lang="ts">
/* eslint-disable unocss/order */
useSeoMeta({
  title: 'About Maggie | The Tutor Lyfe',
  description: 'Meet Maggie — a licensed teacher with a Master\'s in Education based in Lawrenceville, GA, offering online math tutoring for grades 3–10.',
  ogTitle: 'About Maggie | The Tutor Lyfe',
  ogDescription: 'Meet Maggie, the licensed teacher behind The Tutor Lyfe and online math tutoring for grades 3–10.',
  ogImage: '/assets/maggie.jpeg',
  ogType: 'website',
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
          </NuxtLink> / About
        </div>
        <h1>Meet Maggie</h1>
      </div>
    </section>

    <section class="section">
      <div class="container split">
        <img class="split-photo reveal" src="/assets/maggie.jpeg" alt="Maggie, founder of The Tutor Lyfe">
        <div class="reveal">
          <p>I'm a <strong>licensed teacher with a Master's degree in Education</strong>, and I live in <strong>Lawrenceville, Georgia</strong>, just outside Atlanta. Teaching has always been my calling — there's nothing quite like the moment a student's face lights up because a tricky concept finally makes sense.</p>
          <p>I created The Tutor Lyfe to bring that same one-on-one, lightbulb-moment teaching to families everywhere through online tutoring. No matter where you are, your child can get patient, expert math help from the comfort of home.</p>
          <ul class="cred-list">
            <li><span class="tick">✓</span> Licensed &amp; certified classroom teacher</li>
            <li><span class="tick">✓</span> Master's degree in Education</li>
            <li><span class="tick">✓</span> Focused on grades 3–10 mathematics</li>
            <li><span class="tick">✓</span> Based in Lawrenceville, GA · teaching online</li>
          </ul>
          <NuxtLink class="btn btn-primary" to="/contact">
            Work with Maggie
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="section-head reveal">
          <h2>How I teach</h2>
        </div>
        <div class="grid-3">
          <div class="card reveal">
            <div class="icon">
              🧩
            </div>
            <h3>Meet them where they are</h3>
            <p>I start by understanding each student's strengths and gaps, then build a plan that fits their pace and their school's curriculum.</p>
          </div>
          <div class="card reveal">
            <div class="icon">
              💬
            </div>
            <h3>Patient &amp; encouraging</h3>
            <p>No question is too small. I create a calm, judgment-free space where students feel safe to try, make mistakes, and grow.</p>
          </div>
          <div class="card reveal">
            <div class="icon">
              📈
            </div>
            <h3>Confidence that lasts</h3>
            <p>My goal isn't just a better grade this week — it's a student who believes "I can do math" for years to come.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container split reverse">
        <div class="reveal">
          <h2>Learning that fits your life</h2>
          <ul class="cred-list">
            <li><span class="tick">✓</span> Learn from the comfort of home</li>
            <li><span class="tick">✓</span> Flexible scheduling around school &amp; activities</li>
            <li><span class="tick">✓</span> Interactive, screen-shared whiteboard lessons</li>
            <li><span class="tick">✓</span> Open to students anywhere</li>
          </ul>
          <NuxtLink class="btn btn-secondary" to="/programs">
            Explore programs
          </NuxtLink>
        </div>
        <img class="split-photo reveal" src="/assets/study-desk.jpeg" alt="Organized study setup">
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="cta-band reveal">
          <h2>Let's give your child a head start</h2>
          <NuxtLink class="btn btn-secondary btn-lg" to="/contact">
            Book Your Free Intro
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
