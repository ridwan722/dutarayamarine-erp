
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T


export const AdminHeader: typeof import("../components/Admin/Header.vue")['default']
export const AdminPenawaranDialogBuatInvoice: typeof import("../components/Admin/Penawaran/dialog-buat-invoice.vue")['default']
export const AdminPenawaranDialogBuatPengeluaran: typeof import("../components/Admin/Penawaran/dialog-buat-pengeluaran.vue")['default']
export const AdminPenawaranDialogPurchaseorder: typeof import("../components/Admin/Penawaran/dialog-purchaseorder.vue")['default']
export const AdminSideMenu: typeof import("../components/Admin/SideMenu.vue")['default']
export const AppNotification: typeof import("../components/AppNotification.vue")['default']
export const ConfirmationDialog: typeof import("../components/ConfirmationDialog.vue")['default']
export const DatePickerAuto: typeof import("../components/DatePickerAuto.vue")['default']
export const AAutocompleteNew: typeof import("../components/a/autocomplete-new.vue")['default']
export const AAutocomplete: typeof import("../components/a/autocomplete.vue")['default']
export const ABtn: typeof import("../components/a/btn.vue")['default']
export const AButtonReject: typeof import("../components/a/button-reject.vue")['default']
export const AButtonToggle: typeof import("../components/a/button-toggle.vue")['default']
export const AButton: typeof import("../components/a/button.vue")['default']
export const ACheckbox: typeof import("../components/a/checkbox.vue")['default']
export const ADatePickerNew: typeof import("../components/a/date-picker-new.vue")['default']
export const ADatePicker: typeof import("../components/a/date-picker.vue")['default']
export const AFieldNumberNew: typeof import("../components/a/field-number-new.vue")['default']
export const AFieldNumber: typeof import("../components/a/field-number.vue")['default']
export const AIconSuccess: typeof import("../components/a/icon-success.vue")['default']
export const AInputDoc: typeof import("../components/a/input-doc.vue")['default']
export const ASelectNew: typeof import("../components/a/select-new.vue")['default']
export const ASelect: typeof import("../components/a/select.vue")['default']
export const ATextFieldNew: typeof import("../components/a/text-field-new.vue")['default']
export const ATextField: typeof import("../components/a/text-field.vue")['default']
export const ATextareaNew: typeof import("../components/a/textarea-new.vue")['default']
export const ATextarea: typeof import("../components/a/textarea.vue")['default']
export const ATimePicker: typeof import("../components/a/time-picker.vue")['default']
export const CanvasPenawaranPt: typeof import("../components/canvas-penawaran-pt.vue")['default']
export const CanvasPenawaran: typeof import("../components/canvas-penawaran.vue")['default']
export const CanvasPurchaseorder: typeof import("../components/canvas-purchaseorder.vue")['default']
export const DeliveryOrder: typeof import("../components/delivery-order.vue")['default']
export const DialogTambahBeritaAcara: typeof import("../components/dialog-tambah-berita-acara.vue")['default']
export const LoadingApp: typeof import("../components/loadingApp.vue")['default']
export const Print: typeof import("../components/print.vue")['default']
export const UploadImage: typeof import("../components/uploadImage.vue")['default']
export const UploadImage2: typeof import("../components/uploadImage2.vue")['default']
export const NuxtWelcome: typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']
export const NuxtLayout: typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
export const NuxtErrorBoundary: typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
export const ClientOnly: typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']
export const DevOnly: typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']
export const ServerPlaceholder: typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']
export const NuxtLink: typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']
export const NuxtLoadingIndicator: typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
export const NuxtTime: typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
export const NuxtRouteAnnouncer: typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
export const NuxtImg: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
export const NuxtPicture: typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
export const NuxtPage: typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']
export const NoScript: typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']
export const Link: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']
export const Base: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']
export const Title: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']
export const Meta: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']
export const Style: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']
export const Head: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']
export const Html: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']
export const Body: typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']
export const NuxtIsland: typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']
export const LazyAdminHeader: LazyComponent<typeof import("../components/Admin/Header.vue")['default']>
export const LazyAdminPenawaranDialogBuatInvoice: LazyComponent<typeof import("../components/Admin/Penawaran/dialog-buat-invoice.vue")['default']>
export const LazyAdminPenawaranDialogBuatPengeluaran: LazyComponent<typeof import("../components/Admin/Penawaran/dialog-buat-pengeluaran.vue")['default']>
export const LazyAdminPenawaranDialogPurchaseorder: LazyComponent<typeof import("../components/Admin/Penawaran/dialog-purchaseorder.vue")['default']>
export const LazyAdminSideMenu: LazyComponent<typeof import("../components/Admin/SideMenu.vue")['default']>
export const LazyAppNotification: LazyComponent<typeof import("../components/AppNotification.vue")['default']>
export const LazyConfirmationDialog: LazyComponent<typeof import("../components/ConfirmationDialog.vue")['default']>
export const LazyDatePickerAuto: LazyComponent<typeof import("../components/DatePickerAuto.vue")['default']>
export const LazyAAutocompleteNew: LazyComponent<typeof import("../components/a/autocomplete-new.vue")['default']>
export const LazyAAutocomplete: LazyComponent<typeof import("../components/a/autocomplete.vue")['default']>
export const LazyABtn: LazyComponent<typeof import("../components/a/btn.vue")['default']>
export const LazyAButtonReject: LazyComponent<typeof import("../components/a/button-reject.vue")['default']>
export const LazyAButtonToggle: LazyComponent<typeof import("../components/a/button-toggle.vue")['default']>
export const LazyAButton: LazyComponent<typeof import("../components/a/button.vue")['default']>
export const LazyACheckbox: LazyComponent<typeof import("../components/a/checkbox.vue")['default']>
export const LazyADatePickerNew: LazyComponent<typeof import("../components/a/date-picker-new.vue")['default']>
export const LazyADatePicker: LazyComponent<typeof import("../components/a/date-picker.vue")['default']>
export const LazyAFieldNumberNew: LazyComponent<typeof import("../components/a/field-number-new.vue")['default']>
export const LazyAFieldNumber: LazyComponent<typeof import("../components/a/field-number.vue")['default']>
export const LazyAIconSuccess: LazyComponent<typeof import("../components/a/icon-success.vue")['default']>
export const LazyAInputDoc: LazyComponent<typeof import("../components/a/input-doc.vue")['default']>
export const LazyASelectNew: LazyComponent<typeof import("../components/a/select-new.vue")['default']>
export const LazyASelect: LazyComponent<typeof import("../components/a/select.vue")['default']>
export const LazyATextFieldNew: LazyComponent<typeof import("../components/a/text-field-new.vue")['default']>
export const LazyATextField: LazyComponent<typeof import("../components/a/text-field.vue")['default']>
export const LazyATextareaNew: LazyComponent<typeof import("../components/a/textarea-new.vue")['default']>
export const LazyATextarea: LazyComponent<typeof import("../components/a/textarea.vue")['default']>
export const LazyATimePicker: LazyComponent<typeof import("../components/a/time-picker.vue")['default']>
export const LazyCanvasPenawaranPt: LazyComponent<typeof import("../components/canvas-penawaran-pt.vue")['default']>
export const LazyCanvasPenawaran: LazyComponent<typeof import("../components/canvas-penawaran.vue")['default']>
export const LazyCanvasPurchaseorder: LazyComponent<typeof import("../components/canvas-purchaseorder.vue")['default']>
export const LazyDeliveryOrder: LazyComponent<typeof import("../components/delivery-order.vue")['default']>
export const LazyDialogTambahBeritaAcara: LazyComponent<typeof import("../components/dialog-tambah-berita-acara.vue")['default']>
export const LazyLoadingApp: LazyComponent<typeof import("../components/loadingApp.vue")['default']>
export const LazyPrint: LazyComponent<typeof import("../components/print.vue")['default']>
export const LazyUploadImage: LazyComponent<typeof import("../components/uploadImage.vue")['default']>
export const LazyUploadImage2: LazyComponent<typeof import("../components/uploadImage2.vue")['default']>
export const LazyNuxtWelcome: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
export const LazyNuxtLayout: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
export const LazyNuxtErrorBoundary: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
export const LazyClientOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/client-only")['default']>
export const LazyDevOnly: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/dev-only")['default']>
export const LazyServerPlaceholder: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
export const LazyNuxtLink: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
export const LazyNuxtLoadingIndicator: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
export const LazyNuxtTime: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
export const LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
export const LazyNuxtImg: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
export const LazyNuxtPicture: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
export const LazyNuxtPage: LazyComponent<typeof import("../node_modules/nuxt/dist/pages/runtime/page")['default']>
export const LazyNoScript: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
export const LazyLink: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Link']>
export const LazyBase: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Base']>
export const LazyTitle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Title']>
export const LazyMeta: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Meta']>
export const LazyStyle: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Style']>
export const LazyHead: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Head']>
export const LazyHtml: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Html']>
export const LazyBody: LazyComponent<typeof import("../node_modules/nuxt/dist/head/runtime/components")['Body']>
export const LazyNuxtIsland: LazyComponent<typeof import("../node_modules/nuxt/dist/app/components/nuxt-island")['default']>

export const componentNames: string[]
