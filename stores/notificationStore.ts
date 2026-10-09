import { defineStore } from "pinia";

interface Notification {
  message: string;
  type: "success" | "error" | "info";
}

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    snackbar: false,
    message: "",
    type: "success" as Notification["type"],
  }),

  actions: {
    showNotification(message: string, type: Notification["type"]) {
      this.snackbar = true;
      this.message = message;
      this.type = type;
    },

    hideNotification() {
      this.snackbar = false;
      this.message = "";
    },

    showSuccess(message: string) {
      this.showNotification(message, "success");
    },

    showError(message: string) {
      this.showNotification(message, "error");
    },

    showInfo(message: string) {
      this.showNotification(message, "info");
    },
  },
});
