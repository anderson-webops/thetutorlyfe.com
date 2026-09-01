<script setup lang="ts">
const route = useRoute()
const menuOpen = ref(false)
const toggleButton = useTemplateRef<HTMLButtonElement>('toggleButton')

const navigation = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Programs', to: '/programs' },
  { label: 'How It Works', to: '/#how' },
]

function isActive(path: string) {
  return route.path === path
}

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function handleEscape() {
  if (!menuOpen.value)
    return

  closeMenu()
  toggleButton.value?.focus()
}

watch(() => route.fullPath, closeMenu)
</script>

<template>
  <header class="site-header" @keydown.esc="handleEscape">
    <div class="nav container">
      <NuxtLink class="nav-brand" to="/" aria-label="The Tutor Lyfe home" @click="closeMenu">
        <img src="/assets/logo.jpeg" alt="The Tutor Lyfe logo">
        <span class="brand-text">The Tutor <span class="lyfe">Lyfe</span></span>
      </NuxtLink>

      <nav aria-label="Primary navigation">
        <ul id="primary-navigation" class="nav-links" :class="{ open: menuOpen }">
          <li v-for="item in navigation" :key="item.label">
            <NuxtLink
              :to="item.to"
              :class="{ active: item.to !== '/#how' && isActive(item.to) }"
              :aria-current="item.to !== '/#how' && isActive(item.to) ? 'page' : undefined"
              @click="closeMenu"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink
              class="btn-primary nav-cta btn"
              :class="{ active: isActive('/contact') }"
              to="/contact"
              :aria-current="isActive('/contact') ? 'page' : undefined"
              @click="closeMenu"
            >
              Book Free Intro
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <button
        ref="toggleButton"
        class="nav-toggle"
        type="button"
        aria-controls="primary-navigation"
        :aria-expanded="menuOpen"
        :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
        @click="toggleMenu"
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
    </div>
  </header>
</template>
