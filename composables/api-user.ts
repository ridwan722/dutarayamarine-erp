// composables/api-user.ts

import type { CreateUserResponse } from "~/types/akutansi";


const v = useRuntimeConfig()
const url = v.public.apiBaseUrl
export const createUserApiMaster = async (email: string, nama: string, roleReq: string) => {
  const userstore: any = useUserStore()
  const token: any = userstore.user.accessToken
  // console.logtoken)
  const userCredential = $fetch(url + '/setUserModule/users', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: {
      email,
      nama,
      roleReq,
    }
  })

  return userCredential
}

export const updateUserApiMaster = async (email: string, nama: string, roleReq: string, uid: string) => {
  const userstore: any = useUserStore()
  const token: any = userstore.user.accessToken
  // console.logtoken)
  const userCredential = $fetch(url + '/updateUserModule/users', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: {
      email,
      nama,
      roleReq,
      uid
    }
  })

  return userCredential
}

// composables/api-user.ts
export const createUserApi = async (
  nama_perusahaan: string,
  nama_admin: string,
  email_admin: string,
  uid: string
) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl + "/userModule";
  const endpoint = `${baseUrl}/api/users`;

  try {
    const response = await $fetch<CreateUserResponse>(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { nama_perusahaan, nama_admin, email_admin, uid },
    });

    console.log("✅ createUserApi response:", response);
    return { error: 0, message: response.message, data: response };
  } catch (err: any) {
    console.error("❌ createUserApi error:", err);
    return {
      error: 1,
      message: err?.data?.error || "Gagal menyimpan data pendaftaran",
      details: err,
    };
  }
};


export const activateCompanyApi = async (uid: string) => {
  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl + "/userModule";
  const endpoint = `${baseUrl}/api/users/activate`;

  try {
    const response = await $fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: { uid },
    });

    console.log("✅ activateCompanyApi:", response);

    return {
      error: 0,
      message: "Perusahaan berhasil diaktifkan.",
      data: response,
    };
  } catch (err: any) {
    console.error("❌ activateCompanyApi error:", err);
    return {
      error: 1,
      message: err?.data?.error || "Gagal mengaktifkan perusahaan",
      details: err,
    };
  }
};
