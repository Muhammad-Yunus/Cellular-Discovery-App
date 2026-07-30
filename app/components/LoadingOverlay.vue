<script setup lang="ts">
withDefaults(defineProps<{
  loading?: boolean
  message?: string
}>(), {
  loading: false,
  message: 'Loading...'
})
</script>

<template>
  <Teleport to="body">
    <Transition name="loading-overlay-fade">
      <div
        v-if="loading"
        class="loading-overlay"
        role="status"
        aria-live="polite"
        aria-label="Scanning in progress, please wait until the scanning process is complete"
      >
        <div class="loading-overlay__card">
          <!-- Animated radar / radio-wave scanning icon -->
          <div class="loading-overlay__icon" aria-hidden="true">
            <div class="loading-overlay__ring loading-overlay__ring--1" />
            <div class="loading-overlay__ring loading-overlay__ring--2" />
            <div class="loading-overlay__ring loading-overlay__ring--3" />
            <div class="loading-overlay__ring loading-overlay__ring--4" />
            <div class="loading-overlay__core">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12Z" />
                <path d="M12 12l3-3" />
                <path d="M12 7v5" />
              </svg>
            </div>
          </div>

          <p class="loading-overlay__title">
            Scanning Signal<span class="loading-overlay__ellipsis"><span>.</span><span>.</span><span>.</span></span>
          </p>
          <p class="loading-overlay__subtitle">
            Please wait until the scanning process is complete…
          </p>

          <div class="loading-overlay__progress" aria-hidden="true">
            <span class="loading-overlay__dot" />
            <span class="loading-overlay__dot" />
            <span class="loading-overlay__dot" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Fade transition */
.loading-overlay-fade-enter-active,
.loading-overlay-fade-leave-active {
  transition: opacity 0.2s ease;
}
.loading-overlay-fade-enter-from,
.loading-overlay-fade-leave-to {
  opacity: 0;
}

/* Full-screen backdrop */
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* Centered card */
.loading-overlay__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
  min-width: 280px;
  max-width: 360px;
  padding: 1.6rem 1.8rem 1.4rem;

  background: linear-gradient(135deg, rgba(8, 47, 73, 0.96), rgba(12, 74, 110, 0.94));
  color: #fafafa;

  border: 1px solid rgba(125, 211, 252, 0.35);
  border-radius: 16px;
  box-shadow:
    0 22px 50px -10px rgba(0, 0, 0, 0.55),
    0 6px 16px -2px rgba(8, 47, 73, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;

  animation: loading-overlay-card-in 0.3s ease-out;
}

@keyframes loading-overlay-card-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Icon container with expanding rings + pulsing core */
.loading-overlay__icon {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay__core {
  position: relative;
  z-index: 2;
  width: 52px;
  height: 52px;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgb(14, 165, 233), rgb(56, 189, 248));
  color: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 22px rgba(56, 189, 248, 0.75);
  animation: loading-overlay-core-pulse 1.6s ease-in-out infinite;
}

@keyframes loading-overlay-core-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.6);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 28px rgba(56, 189, 248, 0.95);
  }
}

.loading-overlay__ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  border: 2px solid rgba(125, 211, 252, 0.55);
  pointer-events: none;
  animation: loading-overlay-ring 2s ease-out infinite;
  opacity: 0;
}

.loading-overlay__ring--1 { animation-delay: 0s;   }
.loading-overlay__ring--2 { animation-delay: 0.5s; }
.loading-overlay__ring--3 { animation-delay: 1s;   }
.loading-overlay__ring--4 { animation-delay: 1.5s; }

@keyframes loading-overlay-ring {
  0% {
    transform: scale(0.5);
    opacity: 0.85;
    border-width: 2px;
  }
  70% {
    opacity: 0.25;
    border-width: 1px;
  }
  100% {
    transform: scale(1.4);
    opacity: 0;
    border-width: 1px;
  }
}

/* Title */
.loading-overlay__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #fafafa;
  line-height: 1.25;
  letter-spacing: 0.01em;
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  text-align: center;
}

.loading-overlay__ellipsis {
  display: inline-flex;
  gap: 1px;
  margin-left: 2px;
}

.loading-overlay__ellipsis span {
  display: inline-block;
  animation: loading-overlay-blink 1.2s infinite;
  opacity: 0.4;
}

.loading-overlay__ellipsis span:nth-child(2) { animation-delay: 0.2s; }
.loading-overlay__ellipsis span:nth-child(3) { animation-delay: 0.4s; }

@keyframes loading-overlay-blink {
  0%, 60%, 100% { opacity: 0.4; transform: translateY(0); }
  30%           { opacity: 1;   transform: translateY(-1px); }
}

/* Subtitle */
.loading-overlay__subtitle {
  margin: 0;
  font-size: 0.825rem;
  font-weight: 400;
  color: rgba(186, 230, 253, 0.85);
  line-height: 1.4;
  text-align: center;
}

/* Progress dots */
.loading-overlay__progress {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 0.25rem;
}

.loading-overlay__dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: rgba(125, 211, 252, 0.4);
  animation: loading-overlay-dot 1.2s ease-in-out infinite;
}

.loading-overlay__dot:nth-child(2) { animation-delay: 0.15s; }
.loading-overlay__dot:nth-child(3) { animation-delay: 0.3s;  }

@keyframes loading-overlay-dot {
  0%, 100% {
    opacity: 0.35;
    transform: scale(0.85);
    background: rgba(125, 211, 252, 0.4);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
    background: rgb(125, 211, 252);
  }
}
</style>
