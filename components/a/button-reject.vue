<!-- Clean Red Reject Button with Back Icon (Animated on Hover) -->
<template>
  <button class="buttonReject">
    <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path
        d="M2.61422,5.42597 C2.8464,4.86546 3.39335,4.5 4.00004,4.5 L13.9999979,4.5 C18.1422,4.5 21.4999979,7.85786 21.4999979,12 C21.4999979,16.1421 18.1422,19.5 13.9999979,19.5 L5.00004,19.5 C4.17162,19.5 3.50004,18.8284 3.50004,18 C3.50004,17.1716 4.17162,16.5 5.00004,16.5 L13.9999979,16.5 C16.4853,16.5 18.4999979,14.4853 18.4999979,12 C18.4999979,9.51472 16.4853,7.5 13.9999979,7.5 L7.62136,7.5 L8.5607,8.43934 C9.14649,9.02513 9.14649,9.97487 8.5607,10.5607 C7.97492,11.1464 7.02517,11.1464 6.43938,10.5607 L2.93938,7.06066 C2.51039,6.63166 2.38205,5.98649 2.61422,5.42597 Z"
        fill="currentColor"
      />
    </svg>
    <span class="text-caption font-weight-bold">Reject Step</span>
  </button>
</template>

<style scoped>
.buttonReject {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  background-color: #ffffff;
  color: #d43636;
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 0.9em;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(255, 2, 2, 0.1);
  transition: all 0.25s ease;
}

.buttonReject:hover {
  background-color: #f01313;
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 5px 12px rgba(206, 10, 10, 0.3);
}

.icon {
  width: 15px;
  height: 15px;
  transition: transform 0.25s ease;
}

.buttonReject:hover .icon {
  transform: translateX(-3px);
}
</style>
