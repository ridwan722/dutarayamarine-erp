<template>
  <v-layout>
    <v-app>
      <AppNotification />
      <LoadingApp />
      <v-main>
        <slot />
      </v-main>
    </v-app>
  </v-layout>
</template>
