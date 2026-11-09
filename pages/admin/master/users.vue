<script setup lang="ts">
import type { ConfirmationDialog } from "#components";
import { useMasterUsersStore } from "~/stores/master/userStore";
import type { usersM } from "~/types/master/usersModel";
import { ACCESS_OPTIONS } from "~/utils/access-control";
import { buildCompanyMaster } from "~/utils/customer-master";

definePageMeta({ layout: "admin" });
useHead({ title: "Master Users | DRM ERP" });

const currentUser = useUserStore();
const usersStore = useMasterUsersStore();
const customerStore = usecustomerStore();
const notification = useNotificationStore();
const confirmationDialog = ref<InstanceType<typeof ConfirmationDialog> | null>(
  null,
);
const dialog = ref(false);
const editing = ref(false);
const saving = ref(false);
const isLoading = ref(true);
const refreshing = ref(false);
const search = ref("");
const password = ref("");
const showPassword = ref(false);
const roleOptions = ["Administrator", "Client", "Viewer"];

const emptyUser = (): usersM => ({
  email: "",
  displayName: "",
  role: "Viewer",
  id_perusahaan: "",
  permissions: [],
  active: true,
});
const form = ref<usersM>(emptyUser());

type UserTableRow = usersM & { companyLabel: string };

const companies = computed(() =>
  buildCompanyMaster(customerStore.getDataCustomer),
);
const companyOptions = computed(() =>
  companies.value.map((company) => ({
    title: company.nama,
    value: company.id_customer,
  })),
);

function companyName(companyId?: string) {
  if (!companyId) return "Semua perusahaan";
  return (
    companies.value.find(
      (company) =>
        company.id_customer === companyId ||
        company.sourceIds.includes(companyId),
    )?.nama || "Perusahaan tidak ditemukan"
  );
}

const usersForTable = computed<UserTableRow[]>(() =>
  usersStore.getDataUsers.map((user) => ({
    ...user,
    companyLabel: companyName(user.id_perusahaan),
  })),
);

const headers = [
  { title: "Pengguna", value: "displayName", minWidth: "210px" },
  { title: "Email", value: "email", minWidth: "210px" },
  { title: "Perusahaan", value: "companyLabel", minWidth: "210px" },
  { title: "Role", value: "role", width: "135px" },
  {
    title: "Akses Menu",
    value: "permissions",
    sortable: false,
    minWidth: "220px",
  },
  { title: "Status", value: "active", width: "110px" },
  {
    title: "Aksi",
    value: "actions",
    sortable: false,
    align: "center" as const,
    width: "150px",
  },
];

const totalUsers = computed(() => usersStore.getDataUsers.length);
const activeUsers = computed(
  () => usersStore.getDataUsers.filter((user) => user.active !== false).length,
);
const administratorUsers = computed(
  () =>
    usersStore.getDataUsers.filter(
      (user) => user.role.toLocaleLowerCase("id-ID") === "administrator",
    ).length,
);
const filteredUserCount = computed(() => {
  const query = search.value.trim().toLocaleLowerCase("id-ID");
  if (!query) return totalUsers.value;
  return usersForTable.value.filter((user) =>
    [user.displayName, user.email, user.role, user.companyLabel].some((value) =>
      value.toLocaleLowerCase("id-ID").includes(query),
    ),
  ).length;
});

const selectAll = computed({
  get: () => form.value.permissions.length === ACCESS_OPTIONS.length,
  set: (value: boolean) => {
    form.value.permissions = value
      ? ACCESS_OPTIONS.map((item) => item.key)
      : [];
  },
});

onMounted(async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      usersStore.tarikDataUsersAct(),
      customerStore.tarikDataCustomerAct(),
    ]);
  } catch {
    notification.showError("Gagal mengambil data users");
  } finally {
    isLoading.value = false;
  }
});

function userInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "U";
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toLocaleUpperCase("id-ID");
}

function permissionLabel(permission: string) {
  return (
    ACCESS_OPTIONS.find((access) => access.key === permission)?.label ||
    permission
  );
}

function openAdd() {
  editing.value = false;
  showPassword.value = false;
  form.value = emptyUser();
  password.value = "";
  dialog.value = true;
}

function openEdit(user: UserTableRow) {
  editing.value = true;
  showPassword.value = false;
  const { companyLabel: _companyLabel, ...profile } = user;
  form.value = JSON.parse(JSON.stringify(profile));
  form.value.id_perusahaan ||= "";
  password.value = "";
  dialog.value = true;
}

function closeDialog() {
  if (!saving.value) dialog.value = false;
}

function errorText(error: any) {
  const code = error?.code ?? "";
  if (code.includes("email-already-in-use")) return "Email sudah terdaftar.";
  if (code.includes("weak-password"))
    return "Password terlalu lemah (minimal 6 karakter).";
  if (code.includes("invalid-email")) return "Format email tidak valid.";
  return error?.message || "Operasi gagal.";
}

async function save() {
  const name = form.value.displayName.trim();
  const email = form.value.email.trim().toLowerCase();
  if (!name || !email)
    return notification.showError("Nama dan email wajib diisi");
  if (!editing.value && password.value.length < 6) {
    return notification.showError("Password awal minimal 6 karakter");
  }

  saving.value = true;
  try {
    form.value.displayName = name;
    form.value.email = email;
    form.value.id_perusahaan ||= "";
    form.value.nama_perusahaan = form.value.id_perusahaan
      ? companyName(form.value.id_perusahaan)
      : "";
    if (editing.value) {
      form.value.updated_at = tanggalunixskrg();
      form.value.updated_by = currentUser.getEmail;
      await usersStore.updateMasterUsersAct(form.value);
      notification.showSuccess("User berhasil diperbarui");
    } else {
      form.value.created_at = tanggalunixskrg();
      form.value.created_by = currentUser.getEmail;
      await usersStore.addMasterUsersAct(form.value, password.value);
      notification.showSuccess("Akun user berhasil dibuat");
    }
    dialog.value = false;
  } catch (error) {
    notification.showError(errorText(error));
  } finally {
    saving.value = false;
  }
}

async function toggleActive(user: usersM) {
  const action = user.active === false ? "mengaktifkan" : "menonaktifkan";
  const confirmed = await confirmationDialog.value?.show(
    "Konfirmasi Status",
    `Anda yakin ingin ${action} ${user.email}?`,
  );
  if (!confirmed) return;
  try {
    await usersStore.updateMasterUsersAct({
      ...user,
      active: user.active === false,
    });
    notification.showSuccess("Status user berhasil diubah");
  } catch (error) {
    notification.showError(errorText(error));
  }
}

async function sendReset(user: usersM) {
  const confirmed = await confirmationDialog.value?.show(
    "Reset Password",
    `Kirim link reset password ke ${user.email}?`,
  );
  if (!confirmed) return;
  try {
    await usersStore.sendResetPassword(user.email);
    notification.showSuccess("Email reset password berhasil dikirim");
  } catch (error) {
    notification.showError(errorText(error));
  }
}

async function refresh() {
  if (refreshing.value) return;
  refreshing.value = true;
  try {
    sessionStorage.removeItem("users");
    await Promise.all([
      usersStore.tarikDataUsersAct(),
      customerStore.tarikDataCustomerAct(),
    ]);
    notification.showSuccess("Data berhasil diperbarui");
  } catch (error) {
    notification.showError(errorText(error));
  } finally {
    refreshing.value = false;
  }
}
</script>

<template>
  <main class="users-page">
    <ConfirmationDialog ref="confirmationDialog" />

    <v-btn
      variant="text"
      color="grey-darken-3"
      prepend-icon="mdi-arrow-left"
      class="back-button text-none"
      @click="$router.go(-1)"
    >
      Kembali
    </v-btn>

    <section class="users-hero">
      <div class="hero-copy">
        <h1>Kelola User & Visibility</h1>
        <!-- <p>
          Atur akun login, role, dan visibilitas menu setiap pengguna ERP dalam
          satu ruang kerja yang terpusat.
        </p> -->
        <div class="hero-status">
          <span><i class="status-dot" />{{ activeUsers }} akun aktif</span>
          <span
            ><v-icon icon="mdi-shield-lock-outline" size="14" />Akses
            internal</span
          >
        </div>
      </div>

      <div class="hero-illustration" aria-hidden="true">
        <span class="orbit orbit--large" />
        <span class="orbit orbit--small" />
        <div class="profile-card profile-card--left">
          <span><v-icon icon="mdi-eye" size="17" /></span>
        </div>
        <div class="profile-card profile-card--right">
          <span><v-icon icon="mdi-cog" size="17" /></span>
        </div>
        <div class="access-shield">
          <v-icon icon="mdi-shield-account" size="38" />
          <i />
          <small>ACCESS</small>
        </div>
      </div>
    </section>

    <section class="user-library">
      <header class="library-header">
        <div>
          <div class="library-title-row">
            <h2>Daftar Pengguna</h2>
            <span>{{ filteredUserCount }} user</span>
          </div>
          <!-- <p>Cari pengguna, perbarui role, atau kelola status akunnya.</p> -->
        </div>

        <div class="library-actions">
          <label class="user-search">
            <v-icon icon="mdi-magnify" size="19" />
            <input
              v-model="search"
              type="search"
              placeholder="Cari nama, email, perusahaan, atau role..."
              aria-label="Cari pengguna"
            />
            <button
              v-if="search"
              type="button"
              aria-label="Hapus pencarian"
              @click="search = ''"
            >
              <v-icon icon="mdi-close" size="16" />
            </button>
          </label>
          <v-btn
            icon
            variant="outlined"
            class="refresh-button"
            :loading="refreshing"
            aria-label="Perbarui data pengguna"
            @click="refresh"
          >
            <v-icon icon="mdi-refresh" size="18" />
            <v-tooltip activator="parent" location="top"
              >Perbarui data</v-tooltip
            >
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-account-plus-outline"
            class="add-user-button text-none"
            @click="openAdd"
          >
            Tambah User
          </v-btn>
        </div>
      </header>

      <div class="table-wrapper">
        <v-data-table
          :headers="headers"
          :items="usersForTable"
          :search="search"
          :loading="isLoading"
          density="comfortable"
          class="users-table"
          loading-text="Memuat data pengguna..."
          no-data-text="Belum ada pengguna terdaftar"
        >
          <template #item.displayName="{ item }">
            <div class="user-identity">
              <span class="user-avatar">{{
                userInitials(item.displayName)
              }}</span>
              <div>
                <strong>{{ item.displayName }}</strong>
                <small>{{
                  item.active === false ? "Akun nonaktif" : "Pengguna ERP"
                }}</small>
              </div>
            </div>
          </template>

          <template #item.email="{ item }">
            <span class="email-cell">{{ item.email }}</span>
          </template>

          <template #item.companyLabel="{ item }">
            <span
              class="company-access"
              :class="{ 'company-access--all': !item.id_perusahaan }"
            >
              <v-icon
                :icon="item.id_perusahaan ? 'mdi-domain' : 'mdi-earth'"
                size="13"
              />
              {{ item.companyLabel }}
            </span>
          </template>

          <template #item.role="{ item }">
            <span
              class="role-badge"
              :class="{
                'role-badge--admin': item.role === 'Administrator',
                'role-badge--accounting': item.role === 'Akuntan',
              }"
            >
              {{ item.role }}
            </span>
          </template>

          <template #item.permissions="{ item }">
            <span v-if="item.role === 'Administrator'" class="all-access">
              <v-icon icon="mdi-check-decagram-outline" size="14" />Semua menu
            </span>
            <div v-else class="permission-list">
              <span
                v-for="permission in item.permissions.slice(0, 2)"
                :key="permission"
              >
                {{ permissionLabel(permission) }}
              </span>
              <span v-if="item.permissions.length > 2" class="permission-more">
                +{{ item.permissions.length - 2 }}
              </span>
              <span v-if="!item.permissions.length" class="no-access"
                >Belum ada akses</span
              >
            </div>
          </template>

          <template #item.active="{ item }">
            <span
              class="status-badge"
              :class="item.active === false ? 'status-badge--inactive' : ''"
            >
              <i />{{ item.active === false ? "Nonaktif" : "Aktif" }}
            </span>
          </template>

          <template #item.actions="{ item }">
            <div class="row-actions">
              <v-btn
                icon
                variant="text"
                size="small"
                class="row-action"
                aria-label="Edit pengguna"
                @click="openEdit(item)"
              >
                <v-icon icon="mdi-pencil-outline" size="17" />
                <v-tooltip activator="parent" location="top"
                  >Edit user</v-tooltip
                >
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                class="row-action row-action--warning"
                aria-label="Kirim reset password"
                @click="sendReset(item)"
              >
                <v-icon icon="mdi-lock-reset" size="18" />
                <v-tooltip activator="parent" location="top"
                  >Reset password</v-tooltip
                >
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                class="row-action"
                :class="
                  item.active === false
                    ? 'row-action--success'
                    : 'row-action--danger'
                "
                :aria-label="
                  item.active === false
                    ? 'Aktifkan pengguna'
                    : 'Nonaktifkan pengguna'
                "
                @click="toggleActive(item)"
              >
                <v-icon
                  :icon="
                    item.active === false
                      ? 'mdi-account-check-outline'
                      : 'mdi-account-cancel-outline'
                  "
                  size="18"
                />
                <v-tooltip activator="parent" location="top">
                  {{
                    item.active === false ? "Aktifkan user" : "Nonaktifkan user"
                  }}
                </v-tooltip>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </div>
    </section>

    <v-dialog
      v-model="dialog"
      max-width="820"
      :fullscreen="$vuetify.display.smAndDown"
      :persistent="saving"
    >
      <form class="user-dialog" @submit.prevent="save">
        <header class="dialog-header">
          <div class="dialog-heading">
            <span class="dialog-heading-icon">
              <v-icon
                :icon="
                  editing
                    ? 'mdi-account-edit-outline'
                    : 'mdi-account-plus-outline'
                "
                size="21"
              />
            </span>
            <div>
              <h2>{{ editing ? "Edit Pengguna" : "Tambah Pengguna" }}</h2>
              <p>
                {{
                  editing
                    ? "Perbarui identitas, role, dan hak akses pengguna."
                    : "Buat akun login dan tentukan menu yang dapat diakses."
                }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="dialog-close"
            :disabled="saving"
            aria-label="Tutup dialog"
            @click="closeDialog"
          >
            <v-icon icon="mdi-close" size="20" />
          </button>
        </header>

        <div class="dialog-body">
          <section class="form-section">
            <div class="section-heading">
              <span>01</span>
              <div>
                <h3>Informasi Akun</h3>
                <p>Isi data utama yang digunakan pengguna untuk masuk.</p>
              </div>
            </div>

            <div class="form-grid">
              <v-text-field
                v-model="form.displayName"
                label="Nama lengkap *"
                placeholder="Contoh: Budi Santoso"
                prepend-inner-icon="mdi-account-outline"
                variant="outlined"
                density="compact"
                hide-details="auto"
                :disabled="saving"
                class="form-field"
              />
              <v-text-field
                v-model="form.email"
                label="Alamat email *"
                placeholder="nama@dutarayamarine.com"
                type="email"
                prepend-inner-icon="mdi-email-outline"
                variant="outlined"
                density="compact"
                hide-details="auto"
                :disabled="editing || saving"
                class="form-field"
              />
              <v-text-field
                v-if="!editing"
                v-model="password"
                label="Password awal *"
                placeholder="Minimal 6 karakter"
                :type="showPassword ? 'text' : 'password'"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="
                  showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
                "
                variant="outlined"
                density="compact"
                hide-details="auto"
                :disabled="saving"
                class="form-field"
                @click:append-inner="showPassword = !showPassword"
              />
              <v-select
                v-model="form.role"
                :items="roleOptions"
                label="Role pengguna *"
                prepend-inner-icon="mdi-badge-account-outline"
                variant="outlined"
                density="compact"
                hide-details="auto"
                :disabled="saving"
                class="form-field"
              />
              <v-select
                v-model="form.id_perusahaan"
                :items="companyOptions"
                item-title="title"
                item-value="value"
                label="Perusahaan (opsional)"
                placeholder="Semua perusahaan"
                prepend-inner-icon="mdi-domain"
                variant="outlined"
                density="compact"
                clearable
                hide-details="auto"
                :disabled="saving"
                class="form-field"
              />
            </div>

            <div class="company-access-note">
              <v-icon icon="mdi-information-outline" size="16" />
              <span>
                Jika perusahaan dipilih, pengguna hanya dapat mengakses
                quotation dan invoice milik perusahaan tersebut. Kosongkan untuk
                memberikan akses ke seluruh perusahaan.
              </span>
            </div>

            <div class="account-status">
              <div>
                <strong>Akun aktif</strong
                ><span
                  >Pengguna dapat masuk dan mengakses menu yang diberikan.</span
                >
              </div>
              <v-switch
                v-model="form.active"
                color="success"
                hide-details
                inset
                :disabled="saving"
              />
            </div>
          </section>

          <section class="form-section">
            <div class="section-heading section-heading--access">
              <span>02</span>
              <div>
                <h3>Hak Akses Menu</h3>
                <p>Pilih fitur yang boleh dilihat dan dibuka pengguna.</p>
              </div>
              <v-checkbox
                v-model="selectAll"
                label="Pilih semua"
                color="primary"
                density="compact"
                hide-details
                :disabled="saving"
                class="select-all"
              />
            </div>

            <div class="permission-grid">
              <label
                v-for="access in ACCESS_OPTIONS"
                :key="access.key"
                class="permission-option"
                :class="{
                  'permission-option--selected': form.permissions.includes(
                    access.key,
                  ),
                }"
              >
                <v-checkbox
                  v-model="form.permissions"
                  :value="access.key"
                  color="primary"
                  density="compact"
                  hide-details
                  :disabled="saving"
                />
                <span
                  ><strong>{{ access.label }}</strong
                  ><small>{{ access.path }}</small></span
                >
              </label>
            </div>

            <div v-if="form.role === 'Administrator'" class="admin-note">
              <v-icon icon="mdi-information-outline" size="17" />
              <span
                >Role Administrator selalu memperoleh akses ke seluruh
                menu.</span
              >
            </div>
          </section>
        </div>

        <footer class="dialog-footer">
          <p>
            {{
              editing
                ? "Perubahan akan diterapkan pada profil pengguna."
                : "Password dikelola secara aman oleh Firebase Authentication."
            }}
          </p>
          <div>
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none"
              :disabled="saving"
              @click="closeDialog"
              >Batal</v-btn
            >
            <v-btn
              type="submit"
              color="primary"
              variant="flat"
              prepend-icon="mdi-content-save-outline"
              class="text-none"
              :loading="saving"
              :disabled="
                saving ||
                !form.displayName.trim() ||
                !form.email.trim() ||
                (!editing && password.length < 6)
              "
            >
              {{ editing ? "Simpan Perubahan" : "Buat Akun" }}
            </v-btn>
          </div>
        </footer>
      </form>
    </v-dialog>
  </main>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
.users-page {
  width: 100%;
  max-width: 1500px;
  min-height: calc(100vh - 72px);
  margin: 0 auto;
  padding: 8px 14px 34px;
  color: #243447;
}
.back-button {
  min-height: 32px;
  margin-bottom: 8px;
  padding-inline: 7px !important;
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0;
}
.users-hero,
.summary-card,
.user-library {
  background: #fff;
  border: 1px solid #dfe5eb;
  box-shadow: 0 8px 24px rgba(23, 43, 65, 0.045);
}
.users-hero {
  position: relative;
  display: flex;
  min-height: 230px;
  padding: 34px 40px;
  align-items: center;
  justify-content: space-between;
  gap: 48px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 88% 20%,
      rgba(66, 125, 184, 0.11),
      transparent 27%
    ),
    linear-gradient(115deg, #fff 0%, #f8fbfd 100%);
  border-radius: 12px;
}
.users-hero::after {
  position: absolute;
  right: -70px;
  bottom: -115px;
  width: 330px;
  height: 330px;
  background: rgba(52, 102, 151, 0.035);
  border: 1px solid rgba(52, 102, 151, 0.06);
  border-radius: 50%;
  content: "";
}
.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 780px;
}
.eyebrow {
  display: inline-flex;
  padding: 5px 9px;
  align-items: center;
  gap: 6px;
  color: #315f8c;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: #edf4fa;
  border: 1px solid #d8e7f3;
  border-radius: 20px;
}
.hero-copy h1 {
  margin: 12px 0 8px;
  color: #172638;
  font-size: clamp(27px, 3vw, 38px);
  font-weight: 760;
  letter-spacing: -0.035em;
  line-height: 1.12;
}
.hero-copy > p {
  max-width: 690px;
  margin: 0;
  color: #6f7e8d;
  font-size: 12px;
  line-height: 1.7;
}
.hero-status {
  display: flex;
  margin-top: 19px;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
}
.hero-status span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #657586;
  font-size: 10px;
  font-weight: 600;
}
.status-dot {
  width: 7px;
  height: 7px;
  background: #3d9a70;
  border: 2px solid #dff2e9;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #3d9a70;
}
.hero-illustration {
  position: relative;
  z-index: 1;
  flex: 0 0 220px;
  width: 220px;
  height: 165px;
}
.orbit {
  position: absolute;
  border: 1px dashed #bdd0df;
  border-radius: 50%;
}
.orbit--large {
  inset: 7px 27px 0;
}
.orbit--small {
  inset: 34px 55px 27px;
}
.access-shield {
  position: absolute;
  z-index: 2;
  top: 25px;
  left: 70px;
  display: flex;
  width: 82px;
  height: 106px;
  padding: 17px 10px 12px;
  align-items: center;
  flex-direction: column;
  color: #315f8c;
  background: #fff;
  border: 1px solid #cad7e2;
  border-radius: 41px 41px 30px 30px;
  box-shadow: 0 18px 38px rgba(32, 58, 83, 0.13);
}
.access-shield i {
  width: 35px;
  height: 3px;
  margin: 8px 0 5px;
  background: #d7e1e9;
  border-radius: 10px;
}
.access-shield small {
  color: #8a98a5;
  font-size: 6px;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.profile-card {
  position: absolute;
  z-index: 1;
  display: grid;
  width: 58px;
  height: 70px;
  place-items: center;
  background: #f8fbfd;
  border: 1px solid #d5e0e9;
  border-radius: 9px;
  box-shadow: 0 12px 25px rgba(32, 58, 83, 0.08);
}
.profile-card span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  color: #597b9a;
  background: #e7f0f7;
  border-radius: 50%;
}
.profile-card--left {
  top: 66px;
  left: 15px;
  transform: rotate(-9deg);
}
.profile-card--right {
  top: 35px;
  right: 9px;
  transform: rotate(8deg);
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.summary-card {
  display: flex;
  min-height: 96px;
  padding: 16px 18px;
  align-items: center;
  gap: 13px;
  border-radius: 9px;
}
.summary-icon {
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 8px;
}
.summary-icon--blue {
  color: #315f8c;
  background: #eaf2f8;
}
.summary-icon--green {
  color: #2c7957;
  background: #e9f5ef;
}
.summary-icon--amber {
  color: #a05d2f;
  background: #fbf0e7;
}
.summary-card > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.summary-card small {
  color: #7a8794;
  font-size: 8px;
  font-weight: 750;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}
.summary-card strong {
  margin: 2px 0 1px;
  color: #253444;
  font-size: 21px;
  font-weight: 760;
  line-height: 1.1;
}
.summary-card > div > span {
  color: #9099a3;
  font-size: 9px;
}
.user-library {
  margin-top: 10px;
  overflow: hidden;
  border-radius: 11px;
}
.library-header {
  display: flex;
  min-height: fit-content;
  padding: 10px 22px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid #e5eaee;
}
.library-title-row {
  display: flex;
  align-items: center;
  gap: 9px;
}
.library-title-row h2 {
  margin: 0;
  color: #263442;
  font-size: 18px;
  font-weight: 730;
  letter-spacing: -0.02em;
}
.library-title-row > span {
  padding: 3px 8px;
  color: #617181;
  font-size: 8px;
  font-weight: 700;
  background: #eef2f5;
  border-radius: 12px;
}
.library-header p {
  margin: 4px 0 0;
  color: #8a959f;
  font-size: 9px;
}
.library-actions {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}
.user-search {
  display: flex;
  width: min(370px, 38vw);
  height: 38px;
  padding: 0 10px;
  align-items: center;
  gap: 8px;
  color: #8793a0;
  background: #f8fafb;
  border: 1px solid #d7dee5;
  border-radius: 7px;
  transition: 0.2s ease;
}
.user-search:focus-within {
  background: #fff;
  border-color: #7899b8;
  box-shadow: 0 0 0 3px rgba(49, 95, 140, 0.08);
}
.user-search input {
  min-width: 0;
  flex: 1;
  color: #354454;
  font: inherit;
  font-size: 10px;
  background: transparent;
  border: 0;
  outline: 0;
}
.user-search input::placeholder {
  color: #9aa4ae;
}
.user-search button {
  display: grid;
  width: 24px;
  height: 24px;
  padding: 0;
  place-items: center;
  color: #7f8994;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
}
.user-search button:hover {
  background: #ebf0f4;
}
.refresh-button {
  width: 38px !important;
  height: 38px !important;
  color: #647789 !important;
  border-color: #d7dee5 !important;
  border-radius: 6px !important;
}
.add-user-button {
  flex: 0 0 auto;
  height: 38px !important;
  padding-inline: 14px !important;
  font-size: 9px !important;
  font-weight: 680 !important;
  letter-spacing: 0 !important;
  border-radius: 6px !important;
}
.table-wrapper {
  overflow-x: auto;
}
.users-table {
  min-width: 1180px;
  color: #384858;
}
.users-table :deep(.v-data-table-header__content) {
  color: #70808e;
  font-size: 8px;
  font-weight: 760;
  letter-spacing: 0.065em;
  text-transform: uppercase;
}
.users-table :deep(thead th) {
  height: 42px !important;
  background: #f8fafb !important;
  border-bottom: 1px solid #e3e8ed !important;
}
.users-table :deep(tbody td) {
  height: 64px !important;
  font-size: 10px;
  border-bottom-color: #edf0f3 !important;
}
.users-table :deep(tbody tr:hover td) {
  background: #fbfcfd !important;
}
.users-table :deep(.v-data-table-footer) {
  color: #71808e;
  font-size: 9px;
  border-top: 1px solid #edf0f3;
}
.user-identity {
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #315f8c;
  font-size: 10px;
  font-weight: 750;
  background: #eaf2f8;
  border: 1px solid #d7e5f0;
  border-radius: 9px;
}
.user-identity > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.user-identity strong {
  overflow: hidden;
  color: #2e3d4c;
  font-size: 10px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-identity small {
  margin-top: 2px;
  color: #909ba5;
  font-size: 8px;
}
.email-cell {
  color: #566777;
  font-size: 10px;
}
.company-access {
  display: inline-flex;
  max-width: 205px;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  color: #3f617d;
  font-size: 9px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.company-access .v-icon {
  flex: 0 0 auto;
  color: #66849d;
}
.company-access--all {
  color: #7b8792;
  font-weight: 550;
}
.company-access--all .v-icon {
  color: #929ca5;
}
.role-badge {
  display: inline-flex;
  padding: 4px 8px;
  color: #5d6d7c;
  font-size: 8px;
  font-weight: 680;
  background: #f0f3f5;
  border: 1px solid #e1e6ea;
  border-radius: 20px;
}
.role-badge--admin {
  color: #825a25;
  background: #fbf2e6;
  border-color: #f1dfc5;
}
.role-badge--accounting {
  color: #315f8c;
  background: #eaf2f8;
  border-color: #d6e5f0;
}
.permission-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.permission-list > span {
  display: inline-flex;
  padding: 3px 7px;
  color: #617181;
  font-size: 7px;
  font-weight: 650;
  background: #f2f5f7;
  border-radius: 12px;
}
.permission-list .permission-more {
  color: #315f8c;
  background: #eaf2f8;
}
.permission-list .no-access {
  color: #a9515d;
  background: #fbebee;
}
.all-access {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #317252;
  font-size: 9px;
  font-weight: 650;
}
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #317252;
  font-size: 8px;
  font-weight: 700;
}
.status-badge i {
  width: 6px;
  height: 6px;
  background: #3d9a70;
  border-radius: 50%;
  box-shadow: 0 0 0 3px #e4f3eb;
}
.status-badge--inactive {
  color: #a9515d;
}
.status-badge--inactive i {
  background: #c5626d;
  box-shadow: 0 0 0 3px #f8e8ea;
}
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}
.row-action {
  width: 31px !important;
  height: 31px !important;
  color: #537392 !important;
  border-radius: 6px !important;
}
.row-action:hover {
  background: #edf4f9 !important;
}
.row-action--warning {
  color: #aa6d2c !important;
}
.row-action--warning:hover {
  background: #fbf1e7 !important;
}
.row-action--danger {
  color: #b35661 !important;
}
.row-action--danger:hover {
  background: #faebed !important;
}
.row-action--success {
  color: #37805d !important;
}
.row-action--success:hover {
  background: #eaf5ef !important;
}
.user-dialog {
  display: flex;
  max-height: min(860px, 92vh);
  overflow: hidden;
  flex-direction: column;
  background: #f5f7f9;
  border: 1px solid #dbe2e8;
  border-radius: 11px;
  box-shadow: 0 24px 70px rgba(23, 43, 65, 0.22);
}
.dialog-header {
  display: flex;
  flex: 0 0 auto;
  min-height: 72px;
  padding: 12px 16px;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #dce3e8;
}
.dialog-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}
.dialog-heading-icon {
  display: grid;
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  place-items: center;
  color: #315f8c;
  background: #eaf2f8;
  border-radius: 8px;
}
.dialog-heading h2 {
  margin: 0;
  color: #253443;
  font-size: 15px;
  font-weight: 740;
}
.dialog-heading p {
  margin: 2px 0 0;
  color: #87939e;
  font-size: 9px;
}
.dialog-close {
  display: grid;
  width: 34px;
  height: 34px;
  padding: 0;
  place-items: center;
  color: #6f7c88;
  background: transparent;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}
.dialog-close:hover {
  background: #edf1f4;
}
.dialog-close:disabled {
  cursor: default;
  opacity: 0.45;
}
.dialog-body {
  min-height: 0;
  padding: 11px;
  overflow-y: auto;
}
.form-section {
  padding: 16px;
  background: #fff;
  border: 1px solid #dfe5ea;
  border-radius: 8px;
}
.form-section + .form-section {
  margin-top: 10px;
}
.section-heading {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
  gap: 9px;
}
.section-heading > span {
  display: grid;
  flex: 0 0 27px;
  width: 27px;
  height: 27px;
  place-items: center;
  color: #315f8c;
  font-size: 8px;
  font-weight: 780;
  background: #edf4f9;
  border-radius: 7px;
}
.section-heading h3 {
  margin: 0;
  color: #31404f;
  font-size: 11px;
  font-weight: 720;
}
.section-heading p {
  margin: 2px 0 0;
  color: #929ca5;
  font-size: 8px;
}
.section-heading--access .select-all {
  margin-left: auto;
  color: #586978;
  font-size: 9px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.form-field :deep(.v-field) {
  min-height: 43px;
  color: #425466;
  font-size: 10px;
  border-radius: 6px;
}
.form-field :deep(.v-label),
.form-field :deep(input) {
  font-size: 10px;
}
.company-access-note {
  display: flex;
  margin-top: 12px;
  padding: 9px 11px;
  align-items: flex-start;
  gap: 7px;
  color: #566b7e;
  font-size: 8px;
  line-height: 1.45;
  background: #f4f7f9;
  border: 1px solid #dde5eb;
  border-radius: 7px;
}
.company-access-note .v-icon {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #527695;
}
.account-status {
  display: flex;
  min-height: 56px;
  margin-top: 12px;
  padding: 8px 12px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: #f8fafb;
  border: 1px solid #e3e8ec;
  border-radius: 7px;
}
.account-status > div {
  display: flex;
  flex-direction: column;
}
.account-status strong {
  color: #3c4c5b;
  font-size: 9px;
  font-weight: 700;
}
.account-status span {
  margin-top: 2px;
  color: #8a96a1;
  font-size: 8px;
}
.permission-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}
.permission-option {
  display: flex;
  min-width: 0;
  min-height: 53px;
  padding: 6px 8px 6px 2px;
  align-items: center;
  color: #536473;
  background: #fafbfc;
  border: 1px solid #e2e7eb;
  border-radius: 7px;
  cursor: pointer;
  transition: 0.18s ease;
}
.permission-option:hover {
  background: #f6f9fb;
  border-color: #cbd9e5;
}
.permission-option--selected {
  background: #f1f6fa;
  border-color: #bbd0e1;
}
.permission-option :deep(.v-selection-control) {
  min-height: 32px;
}
.permission-option > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
}
.permission-option strong {
  overflow: hidden;
  color: #445565;
  font-size: 8px;
  font-weight: 680;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.permission-option small {
  overflow: hidden;
  margin-top: 2px;
  color: #98a2ab;
  font-size: 7px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.admin-note {
  display: flex;
  margin-top: 10px;
  padding: 9px 11px;
  align-items: center;
  gap: 7px;
  color: #315f8c;
  font-size: 8px;
  background: #edf4f9;
  border: 1px solid #d7e5ef;
  border-radius: 7px;
}
.dialog-footer {
  display: flex;
  flex: 0 0 auto;
  min-height: 62px;
  padding: 10px 16px;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: #fff;
  border-top: 1px solid #dce3e8;
}
.dialog-footer p {
  margin: 0;
  color: #8b97a2;
  font-size: 8px;
}
.dialog-footer > div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dialog-footer .v-btn {
  height: 34px !important;
  font-size: 9px !important;
  font-weight: 650 !important;
  letter-spacing: 0 !important;
  border-radius: 5px !important;
}

@media (max-width: 1050px) {
  .hero-illustration {
    flex-basis: 190px;
    transform: scale(0.9);
    transform-origin: right center;
  }
  .permission-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 767px) {
  .users-page {
    padding: 6px 8px 24px;
  }
  .users-hero {
    min-height: 0;
    padding: 25px 20px;
  }
  .hero-copy h1 {
    font-size: 27px;
  }
  .hero-illustration {
    display: none;
  }
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
    margin-top: 7px;
  }
  .summary-card {
    min-height: 88px;
    padding: 13px;
  }
  .summary-card:last-child {
    grid-column: 1 / -1;
  }
  .summary-icon {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
  }
  .user-library {
    margin-top: 7px;
  }
  .library-header {
    min-height: 0;
    padding: 16px;
    align-items: stretch;
    flex-direction: column;
    gap: 13px;
  }
  .library-actions {
    display: grid;
    grid-template-columns: 1fr 38px;
  }
  .user-search {
    width: 100%;
  }
  .add-user-button {
    width: 100%;
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .user-dialog {
    height: 100%;
    max-height: 100%;
    border: 0;
    border-radius: 0;
  }
  .dialog-header {
    min-height: 64px;
    padding: 10px 12px;
  }
  .dialog-heading p {
    display: none;
  }
  .dialog-body {
    padding: 9px;
  }
  .form-section {
    padding: 12px;
  }
  .form-grid,
  .permission-grid {
    grid-template-columns: 1fr;
  }
  .section-heading--access {
    align-items: flex-start;
  }
  .section-heading--access .select-all {
    margin-top: -7px;
  }
  .dialog-footer {
    padding: 9px 10px;
  }
  .dialog-footer p {
    display: none;
  }
  .dialog-footer > div {
    display: grid;
    width: 100%;
    grid-template-columns: 1fr 1.3fr;
  }
  .dialog-footer .v-btn {
    width: 100%;
    min-width: 0;
  }
}

@media (max-width: 420px) {
  .hero-copy h1 {
    font-size: 24px;
  }
  .hero-status {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .summary-card:last-child {
    grid-column: auto;
  }
  .section-heading--access {
    flex-wrap: wrap;
  }
  .section-heading--access .select-all {
    width: 100%;
    margin: 2px 0 0 25px;
  }
}
</style>
