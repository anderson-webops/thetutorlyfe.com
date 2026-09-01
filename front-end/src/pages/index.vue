<!-- Preserve the captured site's semantic class order and compact repeated markup. -->
<script setup lang="ts">
/* eslint-disable unocss/order, vue/singleline-html-element-content-newline */
definePageMeta({
  layout: 'home',
})

useSeoMeta({
  title: 'The Tutor Lyfe | Online Math Tutoring for Grades 3–10',
  description: 'The Tutor Lyfe offers expert online math tutoring for grades 3–10. Taught by Maggie, a licensed teacher with a Master\'s in Education. Online, anytime. Book your free intro session today.',
  ogTitle: 'The Tutor Lyfe | Online Math Tutoring, Grades 3–10',
  ogDescription: 'Friendly, expert online math help for grades 3–10. Online, anytime.',
  ogImage: '/assets/logo.jpeg',
  ogType: 'website',
})

useScrollReveal()
</script>

<template>
  <div>
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy reveal">
          <span class="hero-eyebrow">📐 Math Tutoring · Grades 3–10</span>
          <h1>Confident math starts <span class="accent">here.</span></h1>
          <span class="hand">Online, anytime.</span>
          <p class="lead">
            One-on-one online math tutoring that gives students a strong, joyful start to their math education — taught by a licensed teacher who actually makes it click.
          </p>
          <div class="hero-actions">
            <NuxtLink class="btn btn-primary btn-lg" to="/contact">
              Book a Free Intro Session
            </NuxtLink>
            <NuxtLink class="btn btn-ghost btn-lg" to="/programs">
              See Programs
            </NuxtLink>
          </div>
          <div class="hero-trust">
            <div><span class="dot" /> Licensed teacher</div>
            <div><span class="dot" /> Master's in Education</div>
            <div><span class="dot" /> 100% online</div>
          </div>
        </div>
        <div class="hero-visual reveal">
          <img class="photo" src="/assets/classroom.jpeg" alt="Maggie with her students">
          <div class="hero-badge b1">
            <span class="emoji">🎓</span>
            <div><strong>M.Ed. Educator</strong><span>Licensed &amp; certified</span></div>
          </div>
          <div class="hero-badge b2">
            <span class="emoji">💻</span>
            <div><strong>Learn from home</strong><span>Flexible scheduling</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <span class="kicker">Why The Tutor Lyfe</span>
          <h2>Math help that actually sticks</h2>
          <p>We focus on the early-to-middle years — grades 3 to 10 — because that's when the right support builds confidence that lasts a lifetime.</p>
        </div>
        <div class="grid-3">
          <div class="card reveal">
            <div class="icon">
              👩‍🏫
            </div>
            <h3>Taught by a real teacher</h3>
            <p>Every session is led by Maggie, a licensed teacher with a Master's in Education — not a side-gig tutor. Real classroom expertise, one-on-one.</p>
          </div>
          <div class="card reveal">
            <div class="icon">
              🎯
            </div>
            <h3>Personalized to your child</h3>
            <p>Lessons are built around exactly where your student is — filling gaps, building skills, and matching their school curriculum.</p>
          </div>
          <div class="card reveal">
            <div class="icon">
              🌱
            </div>
            <h3>A strong start that lasts</h3>
            <p>Grades 3–10 are the foundation years. We turn "I'm bad at math" into "I've got this" — one concept at a time.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container split">
        <img class="split-photo reveal" src="/assets/maggie.jpeg" alt="Maggie, founder and tutor">
        <div class="reveal">
          <span class="kicker split-kicker">Meet your tutor</span>
          <h2>Hi, I'm Maggie 👋</h2>
          <p>I'm a licensed teacher with a Master's degree in Education, based in Lawrenceville, Georgia, just outside Atlanta. I started The Tutor Lyfe because every student deserves math support that's patient, personal, and genuinely encouraging.</p>
          <ul class="cred-list">
            <li><span class="tick">✓</span> Licensed, certified classroom teacher</li>
            <li><span class="tick">✓</span> Master's degree in Education</li>
            <li><span class="tick">✓</span> Specializing in grades 3–10 math</li>
            <li><span class="tick">✓</span> Based in Lawrenceville, GA · teaching students everywhere online</li>
          </ul>
          <NuxtLink class="btn btn-secondary" to="/about">
            More about Maggie
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="section cream">
      <div class="container">
        <div class="section-head reveal">
          <span class="kicker">Grades we cover</span>
          <h2>From multiplication to high-school math</h2>
          <p>Whether it's times tables, fractions, pre-algebra, or geometry — we meet your student right where they are.</p>
        </div>
        <div class="grades reveal">
          <div class="grade-pill"><div class="g">3rd</div><div class="lbl">Grade</div></div>
          <div class="grade-pill"><div class="g">4th</div><div class="lbl">Grade</div></div>
          <div class="grade-pill"><div class="g">5th</div><div class="lbl">Grade</div></div>
          <div class="grade-pill"><div class="g">6th</div><div class="lbl">Grade</div></div>
          <div class="grade-pill"><div class="g">7th</div><div class="lbl">Grade</div></div>
          <div class="grade-pill"><div class="g">8th</div><div class="lbl">Grade</div></div>
          <div class="grade-pill"><div class="g">9th</div><div class="lbl">Grade</div></div>
          <div class="grade-pill"><div class="g">10th</div><div class="lbl">Grade</div></div>
        </div>
      </div>
    </section>

    <section id="how" class="section">
      <div class="container">
        <div class="section-head reveal">
          <span class="kicker">How it works</span>
          <h2>Getting started is easy</h2>
          <p>Three simple steps from "we need help" to "math makes sense now."</p>
        </div>
        <div class="steps">
          <div class="step reveal">
            <div class="num">1</div>
            <h3>Reach out</h3>
            <p>Fill in our quick form with your details and the grade or topic you need help with.</p>
          </div>
          <div class="step reveal">
            <div class="num">2</div>
            <h3>Free intro session</h3>
            <p>We hop on a friendly intro call to understand your student's needs and set goals together.</p>
          </div>
          <div class="step reveal">
            <div class="num">3</div>
            <h3>Learn &amp; grow</h3>
            <p>Start regular online sessions, scheduled around your life — and watch confidence climb.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container stats reveal">
        <div class="stat"><div class="num">3–10</div><div class="lbl">Grades supported</div></div>
        <div class="stat"><div class="num">M.Ed.</div><div class="lbl">Qualified educator</div></div>
        <div class="stat"><div class="num">1:1</div><div class="lbl">Personal attention</div></div>
        <div class="stat"><div class="num">100%</div><div class="lbl">Online &amp; flexible</div></div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <span class="kicker">Kind words</span>
          <h2>Loved by students &amp; parents</h2>
          <p>Real testimonials coming soon — here's the kind of progress we love to see.</p>
        </div>
        <div class="grid-3">
          <div class="quote-card reveal">
            <div class="stars">★★★★★</div>
            <p>"Maggie made fractions finally make sense for my daughter. She actually looks forward to math now!"</p>
            <div class="who">Parent of a 5th grader<span>Online sessions</span></div>
          </div>
          <div class="quote-card reveal">
            <div class="stars">★★★★★</div>
            <p>"Patient, encouraging, and so organized. My son's grades went up and so did his confidence."</p>
            <div class="who">Parent of an 8th grader<span>Online sessions</span></div>
          </div>
          <div class="quote-card reveal">
            <div class="stars">★★★★★</div>
            <p>"The flexible online scheduling was perfect for our busy week. Highly recommend The Tutor Lyfe."</p>
            <div class="who">Parent of a 9th grader<span>Online sessions</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="cta-band reveal">
          <h2>Ready to give your child a head start?</h2>
          <p>Book a free, no-pressure intro session today. Online, anytime — let's make math click.</p>
          <NuxtLink class="btn btn-secondary btn-lg" to="/contact">
            Book Your Free Intro
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
