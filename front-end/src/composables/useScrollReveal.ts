export function useScrollReveal() {
  let observer: IntersectionObserver | undefined
  let motionQuery: MediaQueryList | undefined
  const revealTimers = new Set<number>()

  const clearRevealTimers = () => {
    revealTimers.forEach(timer => window.clearTimeout(timer))
    revealTimers.clear()
  }

  const handleMotionChange = (event: MediaQueryListEvent) => {
    if (!event.matches)
      return

    observer?.disconnect()
    clearRevealTimers()
    document.querySelectorAll<HTMLElement>('.reveal').forEach(element => element.classList.add('in'))
  }

  onMounted(async () => {
    await nextTick()

    const revealElements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))

    const revealAll = () => {
      revealElements.forEach(element => element.classList.add('in'))
    }

    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (motionQuery.matches || !('IntersectionObserver' in window)) {
      revealAll()
      return
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting)
          return

        const element = entry.target as HTMLElement
        const timer = window.setTimeout(() => {
          element.classList.add('in')
          revealTimers.delete(timer)
        }, (index % 3) * 90)

        revealTimers.add(timer)
        observer?.unobserve(element)
      })
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    })

    revealElements.forEach(element => observer?.observe(element))

    motionQuery.addEventListener('change', handleMotionChange, { once: true })
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    motionQuery?.removeEventListener('change', handleMotionChange)
    clearRevealTimers()
  })
}
