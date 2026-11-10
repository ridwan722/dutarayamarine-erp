<template>
  <header class="letterhead">
    <div class="header-section">
      <div class="logo-wrapper">
        <img src="/logokopsurat.png" alt="Logo PT. Duta Raya Marine" />
      </div>
      <div class="letterhead-info">
        <h2 class="company-name">PT. DUTA RAYA MARINE</h2>
        <p class="address-line">
          Ruko Dreamland H3 No. 05, Tanjung Riau,<br />
          Sekupang, Kota Batam, Kepulauan Riau.<br />
          <span class="address-rule" />
          Jl. Raya Pasar Minggu No. 15A, Jakarta Selatan.
          <span class="address-rule" />
        </p>
        <p class="phone-line">
          E-mail: sales@dutarayamarine.com, Phone/WhatsApp :
          +62823-8450-3953<br />
          Website: www.dutarayamarine.com
        </p>
      </div>
      <div class="header-spacer" aria-hidden="true" />
    </div>
    <div class="header-divider">
      <div class="accent-bar" />
      <div class="secondary-bar" />
    </div>
  </header>
</template>

<style scoped>
.letterhead {
  margin-bottom: 20px;
}

.header-section {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) 120px;
  min-height: 76px;
  padding-bottom: 8px;
  align-items: center;
}

.logo-wrapper img {
  display: block;
  width: 154px;
  height: 65px;
  object-fit: contain;
}

.letterhead-info {
  font-family: Georgia, "Times New Roman", serif;
  text-align: center;
}

.company-name {
  margin: 0;
  color: #000000;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.15;
}

.address-line,
.phone-line {
  margin: 2px 0 0;
  color: #000000;
  font-size: 10.5px;
  line-height: 1.3;
}

.address-rule {
  display: block;
  width: 34%;
  height: 1px;
  margin: 2px auto;
  background: #c6c6c6;
}

.header-divider {
  display: flex;
  margin-top: 4px;
  flex-direction: column;
  gap: 2px;
}

.accent-bar {
  width: 100%;
  height: 4px;
  background: #858585;
}

.secondary-bar {
  width: 100%;
  height: 1px;
  background: #b0b0b0;
}
</style>
