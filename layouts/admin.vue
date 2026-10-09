<template>
  <v-layout>
    <AppNotification />
    <LoadingApp />
    <AdminHeader />
    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>
  </v-layout>
</template>
