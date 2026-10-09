```vue
<template>
  <div class="success-container">
    <div class="modern-success-message">
      <div class="icon-wrapper">
        <svg
          stroke-linejoin="round"
          stroke-linecap="round"
          stroke-width="2"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          class="success-icon"
        >
          <path d="M9 12l2 2 4-4"></path>
          <circle r="10" cy="12" cx="12"></circle>
        </svg>
      </div>

      <div class="text-wrapper">
        <div class="title">INVOICE SUCCESS</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.success-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 100%;
  padding: 8px 0;
  box-sizing: border-box;
}

.modern-success-message {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 14px;

  width: 100%;
  max-width: 850px;

  padding: 14px 24px;
  box-sizing: border-box;
  margin-bottom: 10px;

  background: linear-gradient(135deg, #00c853, #009624);
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 150, 36, 0.18);

  color: white;
  font-family: "Poppins", sans-serif;

  position: relative;
  overflow: hidden;

  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.modern-success-message:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 150, 36, 0.25);
}

.icon-wrapper {
  width: 42px;
  height: 42px;
  min-width: 42px;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(255, 255, 255, 0.18);
  border: 1.5px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;

  flex-shrink: 0;

  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);

  animation:
    successPop 0.5s ease-out,
    successPulse 2s infinite ease-in-out 0.5s;
}

.success-icon {
  width: 24px;
  height: 24px;
}

.text-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.text-wrapper .title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1.2px;
  line-height: 1.3;
  white-space: nowrap;
}

.modern-success-message::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;

  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.12),
    transparent 70%
  );

  transform: rotate(45deg);
  pointer-events: none;
}

@keyframes successPop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }

  70% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes successPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  }

  50% {
    transform: scale(1.08);
    box-shadow: 0 5px 18px rgba(255, 255, 255, 0.3);
  }
}

@media (max-width: 480px) {
  .modern-success-message {
    gap: 10px;
    padding: 12px 18px;
  }

  .icon-wrapper {
    width: 36px;
    height: 36px;
    min-width: 36px;
  }

  .success-icon {
    width: 21px;
    height: 21px;
  }

  .text-wrapper .title {
    font-size: 14px;
    letter-spacing: 0.8px;
  }
}
</style>
```
