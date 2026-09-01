<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="/assets/logo.jpeg" alt="The Tutor Lyfe">
          <p>Expert, encouraging online math tutoring for grades 3–10. Online, anytime.</p>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            <li>
              <NuxtLink to="/">
                Home
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/about">
                About Maggie
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/programs">
                Programs
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/contact">
                Book a Session
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h4>Programs</h4>
          <ul>
            <li>
              <NuxtLink to="/programs">
                Elementary Math (3–5)
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/programs">
                Middle School (6–8)
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/programs">
                High School (9–10)
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <h4>Get in touch</h4>
          <ul>
            <li>
              <NuxtLink to="/contact">
                Contact form
              </NuxtLink>
            </li>
            <li><span class="footer-muted">Lawrenceville, GA (Atlanta)</span></li>
            <li><span class="footer-muted">Serving students online</span></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© {{ currentYear }} The Tutor Lyfe. All rights reserved.</span>
        <span>Made with 💚 for curious learners.</span>
      </div>
    </div>
  </footer>
</template>
