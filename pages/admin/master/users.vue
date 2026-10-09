<template>
  <ConfirmationDialog ref="confirmationDialog" />

  <!-- Dialog Tambah Users -->
  <v-dialog
    v-model="data.dialogAdd"
    :width="$vuetify.display.mdAndUp ? '380px' : '90%'"
    max-width="480"
  >
    <v-card class="rounded-lg">
      <v-card-title
        class="px-4 text-subtitle-1 font-weight-bold bg-primary pa-3"
      >
        TAMBAH USERS
      </v-card-title>

      <v-card-text>
        <a-text-field-new
          v-model="newUsers.displayName"
          label="Nama"
          class="mb-3"
        />

        <a-text-field-new
          v-model="newUsers.email"
          placeholder="@gmail.com"
          label="Email"
          class="mb-3"
        />

        <a-select-new v-model="newUsers.role" :items="data.itemRole" label="Role" />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-3 bg-grey-lighten-4">
        <v-btn
          variant="flat"
          color="grey-darken-2"
          @click="closeDialogAdd"
          class="text-capitalize px-3"
          size="small"
        >
          Batal
        </v-btn>

        <v-btn
          color="primary"
          @click="saveUsers"
          variant="flat"
          class="text-capitalize px-3"
          size="small"
        >
          Simpan
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog Edit Users -->
  <v-dialog
    v-model="data.dialogEdit"
    :width="$vuetify.display.mdAndUp ? '380px' : '90%'"
    max-width="480"
  >
    <v-card class="rounded-lg">
      <v-card-title
        class="px-4 text-subtitle-1 font-weight-bold bg-primary pa-3"
      >
        EDIT USERS
      </v-card-title>

      <v-card-text>
        <a-text-field-new
          v-model="editUsers.displayName"
          label="Nama"
          class="mb-3"
        />

        <a-text-field-new
          v-model="editUsers.email"
          label="Email"
          placeholder="@gmail.com"
          disabled
          class="mb-3"
        />

        <a-select-new
          v-model="editUsers.role"
          :items="data.itemRole"
          label="Role"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-3 bg-grey-lighten-4">
        <v-btn
          variant="flat"
          color="grey-darken-2"
          @click="closeDialogEdit"
          class="text-capitalize px-3"
          size="small"
        >
          Batal
        </v-btn>

        <v-btn
          color="primary"
          @click="ubahUsers"
          variant="flat"
          class="text-capitalize px-3"
          size="small"
        >
          Edit
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Main Content -->
  <v-row align="center">
    <v-col cols="9">
      <v-breadcrumbs>
        <v-breadcrumbs-item active>
          <span class="font-weight-medium text-h5"> Master Users </span>
        </v-breadcrumbs-item>
      </v-breadcrumbs>
    </v-col>

    <v-col cols="3">
      <v-btn
        size="28"
        variant="outlined"
        color="grey-darken-1"
        class="border mr-3"
        @click="refreshData"
      >
        <v-icon size="18">mdi-refresh</v-icon>
        <v-tooltip activator="parent" location="top"> Refresh Data </v-tooltip>
      </v-btn>

      <v-btn
        color="primary"
        @click="openDialogAdd"
        variant="flat"
        size="small"
        class="text-capitalize px-3"
        prepend-icon="mdi-plus"
      >
        Tambah Users
      </v-btn>
    </v-col>
  </v-row>

  <!-- Table Card -->
  <v-card flat rounded="lg" class="border">
    <v-card-title class="pa-3">
      <v-row align="center">
        <v-col cols="12" sm="10">
          <a-text-field-new
            v-model="data.search"
            placeholder="Search"
            style="max-width: 280px"
          />
        </v-col>

        <v-col cols="12" sm="2" class="text-caption text-grey-darken-1">
          Total: {{ masterUserStore.getDataUsers.length }} users
        </v-col>
      </v-row>
    </v-card-title>

    <v-divider />

    <v-data-table
      :headers="data.headUser"
      :search="data.search"
      :items="masterUserStore.getDataUsers"
      density="compact"
      :hover="true"
    >
      <template v-slot:item.no="{ index }">
        <span class="text-caption font-weight-bold text-grey-darken-1">
          {{ (data.page - 1) * data.itemsPerPage + index + 1 }}
        </span>
      </template>

      <template v-slot:item.role="{ item }">
        <v-chip
          :color="getRoleColor(item.role)"
          size="small"
          variant="flat"
          class="text-capitalize"
        >
          {{ item.role }}
        </v-chip>
      </template>

      <template v-slot:item.email="{ item }">
        <div style="display: flex; align-items: center; gap: 6px">
          <svg
            width="20px"
            height="20px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g id="style=linear">
              <g id="email">
                <path
                  id="vector"
                  d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z"
                  stroke="#0074D9"
                  stroke-width="1.5"
                  stroke-miterlimit="10"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  id="vector_2"
                  d="M18.7698 7.7688L13.2228 12.0551C12.5025 12.6116 11.4973 12.6116 10.777 12.0551L5.22998 7.7688"
                  stroke="#0074D9"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </g>
            </g>
          </svg>
          {{ item.email }}
        </div>
      </template>

      <template v-slot:item.aksi="{ item }">
        <div class="d-flex justify-center">
          <v-btn
            size="27"
            variant="tonal"
            color="info"
            class="rounded-lg mr-1"
            @click="openDialogEdit(item)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip activator="parent" location="top">Edit</v-tooltip>
          </v-btn>

          <v-btn
            size="27"
            variant="tonal"
            color="error"
            class="rounded-lg"
            @click="hapusUsers(item.id!)"
          >
            <v-icon icon="mdi-trash-can-outline" />
            <v-tooltip activator="parent" location="top">Hapus</v-tooltip>
          </v-btn>
        </div>
      </template>

      <template v-slot:no-data>
        <div class="py-8 text-center text-grey-darken-1">
          <v-icon
            size="48"
            color="grey-lighten-1"
            class="mb-2"
            icon="mdi-account-multiple-outline"
          />

          <div class="text-body-1">Tidak ada data users</div>
        </div>
      </template>

      <template v-slot:bottom>
        <v-divider />

        <div class="bg-grey-lighten-5 px-4 py-2">
          <v-row no-gutters align="center">
            <v-col
              cols="12"
              md="8"
              class="d-flex align-center flex-wrap"
              style="gap: 8px"
            >
              <div
                class="d-flex align-center bg-white border rounded-lg px-3 py-1 shadow-sm mr-2"
              >
                <v-icon
                  size="16"
                  color="primary"
                  icon="mdi-database-outline"
                  class="mr-2"
                />
                <span class="text-caption font-weight-medium">
                  <span class="text-grey">Menampilkan</span>
                  <strong class="text-primary ml-1">
                    {{ (data.page - 1) * data.itemsPerPage + 1 }}-{{
                      Math.min(
                        data.page * data.itemsPerPage,
                        masterUserStore.getDataUsers.length,
                      )
                    }}
                  </strong>
                  <span class="text-grey mx-1">/</span>
                  <strong>{{ masterUserStore.getDataUsers.length }}</strong>
                  <span class="text-grey mx-1">Data</span>
                </span>
              </div>
            </v-col>

            <v-col
              cols="12"
              md="4"
              class="d-flex justify-md-end justify-center mt-2 mt-md-0"
            >
              <div
                class="d-flex align-center bg-white border rounded-lg px-3 py-0"
                style="min-width: 140px; height: 32px"
              >
                <v-icon
                  size="14"
                  color="grey"
                  icon="mdi-layers-outline"
                  class="mr-2"
                />
                <span
                  class="text-caption text-grey-darken-1 mr-2"
                  style="white-space: nowrap"
                  >Tampilkan:</span
                >

                <v-select
                  v-model="data.itemsPerPage"
                  :items="[
                    { title: '10', value: 10 },
                    { title: '25', value: 25 },
                    { title: '50', value: 50 },
                    { title: 'Semua', value: -1 },
                  ]"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="mt-n2"
                  @update:model-value="data.page = 1"
                >
                  <template v-slot:selection="{ item }">
                    <span class="text-caption font-weight-black text-primary">{{
                      item.title
                    }}</span>
                  </template>
                </v-select>
              </div>
            </v-col>
          </v-row>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import _ from "lodash";
import type { ConfirmationDialog } from "#components";
import { useMasterUsersStore } from "~/stores/master/userStore";
import type { usersM } from "~/types/master/usersModel";

definePageMeta({
  layout: "admin",
});

const userStore = useUserStore();
const masterUserStore = useMasterUsersStore();
const notificationStore = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);

onMounted(async () => {
  await masterUserStore.tarikDataUsersAct();
});

const newUsers = ref<usersM>({
  email: "",
  displayName: "",
  role: "",
  id_perusahaan: "",
});

const editUsers = ref<usersM>({
  email: "",
  displayName: "",
  role: "",
  id_perusahaan: "",
});

const data = reactive({
  search: "",
  dialogAdd: false,
  dialogEdit: false,
  page: 1,
  itemsPerPage: 10,
  itemRole: ["Administrator", "Akuntan", "Viewer"],

  headUser: [
    { title: "No", align: "center" as const, value: "no", width: "50px" },
    { title: "Nama User", value: "displayName", sortable: true },
    { title: "Email", value: "email", sortable: true },
    { title: "Role", value: "role", sortable: true },
    {
      title: "Aksi",
      value: "aksi",
      align: "center" as const,
      width: "100px",
    },
  ],
});

const getRoleColor = (role: string) => {
  const colors: Record<string, string> = {
    Administrator: "primary",
    Akuntan: "green",
    Viewer: "orange",
  };
  return colors[role] || "grey";
};

const openDialogAdd = () => {
  newUsers.value = {
    email: "sales@dutarayamarine.com",
    displayName: "Super Admin",
    role: "Administrator",
    id_perusahaan: "",
  };
  data.dialogAdd = true;
};

const closeDialogAdd = () => {
  newUsers.value = { email: "", displayName: "", role: "", id_perusahaan: "" };
  data.dialogAdd = false;
};

const saveUsers = async () => {
  const usersSave = newUsers.value;

  if (usersSave.displayName.trim() === "") {
    return notificationStore.showError("Nama user tidak boleh kosong");
  }

  if (usersSave.email.trim() === "") {
    return notificationStore.showError("Email user tidak boleh kosong");
  }

  usersSave.created_at = tanggalunixskrg();
  usersSave.created_by = userStore.getEmail;
  masterUserStore.addMasterUsersAct(usersSave);
  closeDialogAdd();
};

const openDialogEdit = (item: usersM) => {
  editUsers.value = _.assign({}, item);
  data.dialogEdit = true;
};

const closeDialogEdit = async () => {
  newUsers.value = { email: "", displayName: "", role: "", id_perusahaan: "" };
  data.dialogEdit = false;
};

const ubahUsers = async () => {
  const usersEdit = editUsers.value;

  if (usersEdit.displayName.trim() === "") {
    return notificationStore.showError("Nama user tidak boleh kosong");
  }

  if (usersEdit.email.trim() === "") {
    return notificationStore.showError("Email user tidak boleh kosong");
  }

  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Edit",
    "Anda yakin ingin mengedit user ini?",
  );

  if (!confirmed) {
    return notificationStore.showError("Penghapusan dibatalkan");
  }

  usersEdit.updated_at = tanggalunixskrg();
  usersEdit.updated_by = userStore.getEmail;

  masterUserStore.updateMasterUsersAct(usersEdit);
  closeDialogEdit();
};

const hapusUsers = async (id: string) => {
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Hapus",
    "Anda yakin ingin menghapus user ini?",
  );

  if (!confirmed) {
    return notificationStore.showError("Penghapusan dibatalkan");
  }

  masterUserStore.deleteMasterUsersAct(id);
};

async function refreshData() {
  useloadingStore().setLoading(true);
  sessionStorage.removeItem("users");
  await masterUserStore.tarikDataUsersAct();
  useloadingStore().setLoading(false);
  notificationStore.showSuccess("Data berhasil diperbarui");
}
</script>

<style scoped>
:deep() thead th {
  font-weight: bold !important;
  border: 1px solid #cbcbcb !important;
  background-color: #dddddd !important;
}

:deep() tbody td {
  border-right: 1px solid #e0e0e0 !important;
}
</style>
