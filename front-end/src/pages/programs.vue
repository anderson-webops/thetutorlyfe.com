<!-- Preserve the captured site's semantic class order and compact repeated markup. -->
<script setup lang="ts">
/* eslint-disable unocss/order, vue/singleline-html-element-content-newline */
const openFaqs = ref(new Set<number>())

function isFaqOpen(index: number) {
  return openFaqs.value.has(index)
}

function toggleFaq(index: number) {
  const nextOpenFaqs = new Set(openFaqs.value)

  if (nextOpenFaqs.has(index))
    nextOpenFaqs.delete(index)
  else
    nextOpenFaqs.add(index)

  openFaqs.value = nextOpenFaqs
}

useSeoMeta({
  title: 'Math Programs (Grades 3–10) | The Tutor Lyfe',
  description: 'Online math tutoring programs for grades 3–10: elementary, middle school, and high school math. Personalized one-on-one lessons with a licensed teacher.',
  ogTitle: 'Math Programs (Grades 3–10) | The Tutor Lyfe',
  ogDescription: 'Personalized one-on-one online math tutoring for elementary, middle school, and early high-school students.',
  ogImage: '/assets/classroom.jpeg',
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
          </NuxtLink> / Programs
        </div>
        <h1>Math Programs, Grades 3–10</h1>
        <p>Personalized, one-on-one online math tutoring designed to give every student a strong, confident start.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="grid-3">
          <div class="card reveal">
            <div class="icon">
              🔢
            </div>
            <h3>Elementary Math</h3>
            <p class="program-grade">Grades 3–5</p>
            <p>Building the essentials with a love for learning:</p>
            <ul class="cred-list program-list">
              <li><span class="tick">✓</span> Multiplication &amp; division</li>
              <li><span class="tick">✓</span> Fractions &amp; decimals</li>
              <li><span class="tick">✓</span> Place value &amp; word problems</li>
              <li><span class="tick">✓</span> Number sense &amp; confidence</li>
            </ul>
          </div>
          <div class="card reveal">
            <div class="icon">
              📊
            </div>
            <h3>Middle School Math</h3>
            <p class="program-grade">Grades 6–8</p>
            <p>Bridging arithmetic to algebra:</p>
            <ul class="cred-list program-list">
              <li><span class="tick">✓</span> Ratios, rates &amp; percentages</li>
              <li><span class="tick">✓</span> Pre-algebra &amp; expressions</li>
              <li><span class="tick">✓</span> Integers &amp; equations</li>
              <li><span class="tick">✓</span> Intro to geometry &amp; data</li>
            </ul>
          </div>
          <div class="card reveal">
            <div class="icon">
              📐
            </div>
            <h3>High School Math</h3>
            <p class="program-grade">Grades 9–10</p>
            <p>Mastering the core high-school topics:</p>
            <ul class="cred-list program-list">
              <li><span class="tick">✓</span> Algebra I &amp; II foundations</li>
              <li><span class="tick">✓</span> Linear &amp; quadratic equations</li>
              <li><span class="tick">✓</span> Geometry &amp; proofs</li>
              <li><span class="tick">✓</span> Functions &amp; graphing</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="section-head reveal">
          <span class="kicker">What's included</span>
          <h2>Every program comes with</h2>
          <p>No matter the grade, your student gets the full Tutor Lyfe experience.</p>
        </div>
        <div class="grid-3">
          <div class="card reveal"><div class="icon">👤</div><h3>1-on-1 sessions</h3><p>Undivided attention, fully focused on your child's needs and pace.</p></div>
          <div class="card reveal"><div class="icon">🗓️</div><h3>Flexible scheduling</h3><p>Sessions that fit around school, sports, and family life. Online, anytime.</p></div>
          <div class="card reveal"><div class="icon">🧠</div><h3>Curriculum-aligned</h3><p>Lessons that match what your student is learning in their own classroom.</p></div>
          <div class="card reveal"><div class="icon">📝</div><h3>Homework help</h3><p>Support with tricky assignments, test prep, and building study habits.</p></div>
          <div class="card reveal"><div class="icon">💻</div><h3>Interactive whiteboard</h3><p>Engaging, screen-shared lessons that make online learning feel personal.</p></div>
          <div class="card reveal"><div class="icon">📨</div><h3>Progress updates</h3><p>Friendly check-ins so parents always know how their student is doing.</p></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <span class="kicker">Questions</span>
          <h2>Frequently asked</h2>
        </div>
        <div class="faq">
          <div class="faq-item reveal" :class="{ open: isFaqOpen(0) }">
            <button id="faq-question-0" class="faq-q" type="button" :aria-expanded="isFaqOpen(0)" aria-controls="faq-answer-0" @click="toggleFaq(0)">
              How do online sessions work? <span class="plus" aria-hidden="true">+</span>
            </button>
            <div id="faq-answer-0" class="faq-a" role="region" aria-labelledby="faq-question-0" :aria-hidden="!isFaqOpen(0)">
              <p>Sessions run over a video call with a shared interactive whiteboard. All your student needs is a laptop or tablet and an internet connection — we handle the rest.</p>
            </div>
          </div>
          <div class="faq-item reveal" :class="{ open: isFaqOpen(1) }">
            <button id="faq-question-1" class="faq-q" type="button" :aria-expanded="isFaqOpen(1)" aria-controls="faq-answer-1" @click="toggleFaq(1)">
              What grades and subjects do you cover? <span class="plus" aria-hidden="true">+</span>
            </button>
            <div id="faq-answer-1" class="faq-a" role="region" aria-labelledby="faq-question-1" :aria-hidden="!isFaqOpen(1)">
              <p>We specialize in math for grades 3 through 10 — from elementary arithmetic all the way to early high-school algebra and geometry.</p>
            </div>
          </div>
          <div class="faq-item reveal" :class="{ open: isFaqOpen(2) }">
            <button id="faq-question-2" class="faq-q" type="button" :aria-expanded="isFaqOpen(2)" aria-controls="faq-answer-2" @click="toggleFaq(2)">
              How long is each session? <span class="plus" aria-hidden="true">+</span>
            </button>
            <div id="faq-answer-2" class="faq-a" role="region" aria-labelledby="faq-question-2" :aria-hidden="!isFaqOpen(2)">
              <p>Most sessions run 45–60 minutes. We'll find the right length and frequency for your student during the free intro session.</p>
            </div>
          </div>
          <div class="faq-item reveal" :class="{ open: isFaqOpen(3) }">
            <button id="faq-question-3" class="faq-q" type="button" :aria-expanded="isFaqOpen(3)" aria-controls="faq-answer-3" @click="toggleFaq(3)">
              Is the first session really free? <span class="plus" aria-hidden="true">+</span>
            </button>
            <div id="faq-answer-3" class="faq-a" role="region" aria-labelledby="faq-question-3" :aria-hidden="!isFaqOpen(3)">
              <p>Yes! The intro session is a free, no-pressure chance to meet Maggie, understand your student's needs, and see if we're a great fit.</p>
            </div>
          </div>
          <div class="faq-item reveal" :class="{ open: isFaqOpen(4) }">
            <button id="faq-question-4" class="faq-q" type="button" :aria-expanded="isFaqOpen(4)" aria-controls="faq-answer-4" @click="toggleFaq(4)">
              How do I get started? <span class="plus" aria-hidden="true">+</span>
            </button>
            <div id="faq-answer-4" class="faq-a" role="region" aria-labelledby="faq-question-4" :aria-hidden="!isFaqOpen(4)">
              <p>Just fill out our <NuxtLink to="/contact" :tabindex="isFaqOpen(4) ? undefined : -1">quick contact form</NuxtLink> with your details and the grade you need help with. We'll reach out to schedule your free intro session.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="cta-band reveal">
          <h2>Find the right program for your child</h2>
          <p>Tell us the grade and what you're working on — we'll take it from there. Online, anytime.</p>
          <NuxtLink class="btn btn-secondary btn-lg" to="/contact">
            Book Your Free Intro
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
