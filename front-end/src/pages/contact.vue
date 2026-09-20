<!-- Preserve the captured site's semantic class order and native select markup. -->
<script setup lang="ts">
/* eslint-disable unocss/order, vue/singleline-html-element-content-newline */
type FormState = 'idle' | 'sending' | 'success' | 'error'

const formState = ref<FormState>('idle')

const statusMessage = computed(() => {
  if (formState.value === 'success')
    return '🎉 Thank you! Your request has been sent. We\'ll be in touch shortly about your free intro session.'

  if (formState.value === 'error')
    return '😔 Sorry, something went wrong. Please try again, or email us directly.'

  return ''
})

function clearCustomValidity(event: Event) {
  const field = event.currentTarget

  if (field instanceof HTMLInputElement)
    field.setCustomValidity('')
}

function readFormValue(data: FormData, key: string) {
  const value = data.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

async function submitLead(event: SubmitEvent) {
  if (formState.value === 'sending')
    return

  const form = event.currentTarget

  if (!(form instanceof HTMLFormElement))
    return

  for (const fieldName of ['parentName', 'email', 'phone']) {
    const field = form.elements.namedItem(fieldName)

    if (field instanceof HTMLInputElement)
      field.setCustomValidity(field.value.trim() ? '' : 'Please fill out this field.')
  }

  const phoneField = form.elements.namedItem('phone')

  if (phoneField instanceof HTMLInputElement && phoneField.value.replace(/\D/g, '').length < 7)
    phoneField.setCustomValidity('Please enter a phone number with at least 7 digits.')

  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  const data = new FormData(form)
  const payload = {
    parentName: readFormValue(data, 'parentName'),
    studentName: readFormValue(data, 'studentName'),
    email: readFormValue(data, 'email'),
    phone: readFormValue(data, 'phone'),
    grade: readFormValue(data, 'grade'),
    subject: readFormValue(data, 'subject'),
    preferred: readFormValue(data, 'preferred'),
    message: readFormValue(data, 'message'),
  }

  formState.value = 'sending'

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok)
      throw new Error('Lead request failed')

    form.reset()
    formState.value = 'success'
  }
  catch {
    formState.value = 'error'
  }
}

useSeoMeta({
  title: 'Book a Free Intro | The Tutor Lyfe',
  description: 'Book your free online math tutoring intro session with The Tutor Lyfe. Fill out the form and we\'ll be in touch. Grades 3–10.',
  ogTitle: 'Book a Free Intro | The Tutor Lyfe',
  ogDescription: 'Tell us about your student and book a free, no-pressure online math tutoring intro session.',
  ogImage: '/assets/logo.jpeg',
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
          </NuxtLink> / Contact
        </div>
        <h1>Book your free intro session</h1>
        <p>Fill out the quick form below and we'll reach out to set up your student's free, no-pressure intro session. Online, anytime.</p>
      </div>
    </section>

    <section class="section">
      <div class="container form-wrap">
        <div class="form-side reveal">
          <h2>Let's get started 🚀</h2>
          <p>Tell us a little about your student and what you're looking for. The more we know, the better we can help — and your first intro session is always free.</p>
          <ul class="contact-info">
            <li>
              <span class="ic">📍</span>
              <div><strong>Based in</strong><span>Lawrenceville, GA (near Atlanta)</span></div>
            </li>
            <li>
              <span class="ic">💻</span>
              <div><strong>Sessions</strong><span>100% online — open to students anywhere</span></div>
            </li>
            <li>
              <span class="ic">📐</span>
              <div><strong>What we teach</strong><span>Math · Grades 3 through 10</span></div>
            </li>
            <li>
              <span class="ic">⏱️</span>
              <div><strong>Response time</strong><span>We typically reply within 1–2 days</span></div>
            </li>
          </ul>
        </div>

        <form id="leadForm" class="lead-form reveal" novalidate :aria-busy="formState === 'sending'" @submit.prevent="submitLead">
          <div class="form-row">
            <div class="field">
              <label for="parentName">Parent / Guardian name <span class="req">*</span></label>
              <input id="parentName" name="parentName" type="text" placeholder="Jane Smith" autocomplete="name" maxlength="120" required @input="clearCustomValidity">
            </div>
            <div class="field">
              <label for="studentName">Student's name</label>
              <input id="studentName" name="studentName" type="text" placeholder="Alex" autocomplete="off" maxlength="120">
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="email">Email <span class="req">*</span></label>
              <input id="email" name="email" type="email" placeholder="you@example.com" autocomplete="email" maxlength="254" required @input="clearCustomValidity">
            </div>
            <div class="field">
              <label for="phone">Phone number <span class="req">*</span></label>
              <input id="phone" name="phone" type="tel" placeholder="(555) 123-4567" autocomplete="tel" maxlength="40" required @input="clearCustomValidity">
            </div>
          </div>

          <div class="form-row">
            <div class="field">
              <label for="grade">Student's grade <span class="req">*</span></label>
              <select id="grade" name="grade" required>
                <option value="" disabled selected>Select a grade</option>
                <option>3rd Grade</option>
                <option>4th Grade</option>
                <option>5th Grade</option>
                <option>6th Grade</option>
                <option>7th Grade</option>
                <option>8th Grade</option>
                <option>9th Grade</option>
                <option>10th Grade</option>
                <option>Other / Not sure</option>
              </select>
            </div>
            <div class="field">
              <label for="subject">Subject / focus area</label>
              <select id="subject" name="subject">
                <option value="" disabled selected>Select a focus</option>
                <option>General Math Help</option>
                <option>Fractions &amp; Decimals</option>
                <option>Pre-Algebra</option>
                <option>Algebra</option>
                <option>Geometry</option>
                <option>Test / Exam Prep</option>
                <option>Homework Support</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label for="preferred">Preferred days / times</label>
            <input id="preferred" name="preferred" type="text" placeholder="e.g. Weekday evenings, Saturday mornings" autocomplete="off" maxlength="240">
          </div>

          <div class="field">
            <label for="message">Anything else we should know?</label>
            <textarea id="message" name="message" maxlength="2000" placeholder="Tell us about your student's goals, what they're struggling with, or any questions you have..." />
          </div>

          <button id="submitBtn" type="submit" class="btn btn-primary btn-lg" :disabled="formState === 'sending'">
            {{ formState === 'sending' ? 'Sending…' : 'Send My Request →' }}
          </button>
          <p class="form-note">
            By submitting, you agree to be contacted about tutoring. We'll use your details only to respond about tutoring.
          </p>

          <div
            id="formStatus"
            class="form-status"
            :class="{
              show: formState === 'success' || formState === 'error',
              success: formState === 'success',
              error: formState === 'error',
            }"
            :role="formState === 'error' ? 'alert' : 'status'"
            aria-live="polite"
          >
            {{ statusMessage }}
          </div>
        </form>
      </div>
    </section>
  </div>
</template>
