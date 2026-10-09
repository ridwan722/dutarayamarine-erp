import _ from "lodash";
import { defineStore } from "pinia";
import { useloadingStore } from "./loadingStore";
import type { unmanageM } from "~/types/unmanageModel";

export const useunmanageStore = defineStore("unmanageAresa", {
    state: () => {
        return {
            dataunmanage: [] as unmanageM[],
            detailunmanage: {} as unmanageM,
            tgl_awal: "",
            tgl_akhir: "",
        };
    },

    getters: {
        getDataunmanage(state) {
            return state.dataunmanage;
        },
        getDetailunmanage(state) {
            return state.detailunmanage;
        },
    },

    actions: {
        async addunmanageAct(lemparunmanage: unmanageM) {
            const notificationStore = useNotificationStore();
            try {
                useloadingStore().setLoading(true);
                // await tambahdatabase("unmanage_item_kategori", lemparunmanage);
                const idunmanage = makeSlug(lemparunmanage.id_kategori_item + "-" + lemparunmanage.alasan_unmanage)
                const databatch = [
                    {
                        type: "delete",
                        id: lemparunmanage.id_kategori_item,
                        collection: `m_cabang/${lemparunmanage.id_cabang}/m_item_kategori`,
                        data: lemparunmanage,
                    },
                    {
                        type: "delete",
                        id: lemparunmanage.id_kategori_item,
                        collection: `m_perusahaan_erp/${lemparunmanage.id_perusahaan}/m_item_kategori`,
                        data: lemparunmanage,
                    },
                    {
                        type: "delete",
                        id: lemparunmanage.id_kategori_item,
                        collection: "m_item_kategori",
                        data: lemparunmanage,
                    },
                    {
                        type: "set",
                        id: idunmanage,
                        collection: "unmanage_item_kategori",
                        data: lemparunmanage,
                    },
                ]

                await batching(databatch)
                this.tarikDataunmanageAct();
                notificationStore.showSuccess("Data berhasil ditambahkan");
                useloadingStore().setLoading(false);
            } catch (error) {
                notificationStore.showError("Gagal menyimpan data");
                useloadingStore().setLoading(false);
            }
        },

        async backtoitemkategoriAct(lemparunmanage: unmanageM, idunmasage: string) {
            const notificationStore = useNotificationStore();

            try {
                useloadingStore().setLoading(true);

                if (!idunmasage) {
                    throw new Error("ID dokumen unmanage tidak ada");
                }

                const databatch = [
                    {
                        type: "set",
                        id: lemparunmanage.id_kategori_item,
                        collection: `m_cabang/${lemparunmanage.id_cabang}/m_item_kategori`,
                        data: lemparunmanage,
                    },
                    {
                        type: "set",
                        id: lemparunmanage.id_kategori_item,
                        collection: `m_perusahaan_erp/${lemparunmanage.id_perusahaan}/m_item_kategori`,
                        data: lemparunmanage,
                    },
                    {
                        type: "set",
                        id: lemparunmanage.id_kategori_item,
                        collection: "m_item_kategori",
                        data: lemparunmanage,
                    },
                    {
                        type: "delete",
                        id: idunmasage,
                        collection: "unmanage_item_kategori",
                        data: lemparunmanage,
                    },
                ];

                await batching(databatch);
                await this.tarikDataunmanageAct();

                notificationStore.showSuccess("Data berhasil dikembalikan");
            } catch (error) {
                console.error(error);
                notificationStore.showError("Gagal menyimpan data");
            } finally {
                useloadingStore().setLoading(false);
            }
        },


        async tarikDataunmanageAct() {
            const datatarik = await queryambilid("unmanage_item_kategori");
            this.dataunmanage = datatarik as unknown as unmanageM[];
        },

        async tarikDetailunmanageAct(id: string) {
            const datatarik = await tarikdetaildatabase("unmanage_item_kategori", id);
            this.detailunmanage = datatarik as unknown as unmanageM;
        },

        async queryrekapanunmanageitemkategori(
            tgl_awal: string,
            tgl_akhir: string,
            nama_perusahaan: string,
            nama_cabang: string,
            status: string,
        ) {
            try {
                useloadingStore().setLoading(true);

                this.tgl_awal = tgl_awal;
                this.tgl_akhir = tgl_akhir;
                const datatarik = await queryRekapanunmanageByStatusCabangPerusahaanPeriode
                    (
                        tgl_awal,
                        tgl_akhir,
                        nama_perusahaan,
                        nama_cabang,
                        status
                    );
                this.dataunmanage = datatarik as unknown as unmanageM[];
                useloadingStore().setLoading(false);
            } catch (error) {
                useloadingStore().setLoading(false);
            }
        },
    },
});
