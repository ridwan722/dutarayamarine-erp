
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

interface _GlobalComponents {
  AdminHeader: typeof import("../../components/Admin/Header.vue")['default']
  AdminPenawaranDialogBuatInvoice: typeof import("../../components/Admin/Penawaran/dialog-buat-invoice.vue")['default']
  AdminPenawaranDialogBuatPengeluaran: typeof import("../../components/Admin/Penawaran/dialog-buat-pengeluaran.vue")['default']
  AdminPenawaranDialogPurchaseorder: typeof import("../../components/Admin/Penawaran/dialog-purchaseorder.vue")['default']
  AdminSideMenu: typeof import("../../components/Admin/SideMenu.vue")['default']
  AppNotification: typeof import("../../components/AppNotification.vue")['default']
  ConfirmationDialog: typeof import("../../components/ConfirmationDialog.vue")['default']
  DatePickerAuto: typeof import("../../components/DatePickerAuto.vue")['default']
  AAutocompleteNew: typeof import("../../components/a/autocomplete-new.vue")['default']
  AAutocomplete: typeof import("../../components/a/autocomplete.vue")['default']
  ABtn: typeof import("../../components/a/btn.vue")['default']
  AButtonReject: typeof import("../../components/a/button-reject.vue")['default']
  AButtonToggle: typeof import("../../components/a/button-toggle.vue")['default']
  AButton: typeof import("../../components/a/button.vue")['default']
  ACheckbox: typeof import("../../components/a/checkbox.vue")['default']
  ADatePickerNew: typeof import("../../components/a/date-picker-new.vue")['default']
  ADatePicker: typeof import("../../components/a/date-picker.vue")['default']
  AFieldNumberNew: typeof import("../../components/a/field-number-new.vue")['default']
  AFieldNumber: typeof import("../../components/a/field-number.vue")['default']
  AIconSuccess: typeof import("../../components/a/icon-success.vue")['default']
  AInputDoc: typeof import("../../components/a/input-doc.vue")['default']
  ASelectNew: typeof import("../../components/a/select-new.vue")['default']
  ASelect: typeof import("../../components/a/select.vue")['default']
  ATextFieldNew: typeof import("../../components/a/text-field-new.vue")['default']
  ATextField: typeof import("../../components/a/text-field.vue")['default']
  ATextareaNew: typeof import("../../components/a/textarea-new.vue")['default']
  ATextarea: typeof import("../../components/a/textarea.vue")['default']
  ATimePicker: typeof import("../../components/a/time-picker.vue")['default']
  CanvasPenawaranPt: typeof import("../../components/canvas-penawaran-pt.vue")['default']
  CanvasPenawaran: typeof import("../../components/canvas-penawaran.vue")['default']
  CanvasPurchaseorder: typeof import("../../components/canvas-purchaseorder.vue")['default']
  DeliveryOrder: typeof import("../../components/delivery-order.vue")['default']
  DialogTambahBeritaAcara: typeof import("../../components/dialog-tambah-berita-acara.vue")['default']
  LoadingApp: typeof import("../../components/loadingApp.vue")['default']
  Print: typeof import("../../components/print.vue")['default']
  UploadImage: typeof import("../../components/uploadImage.vue")['default']
  UploadImage2: typeof import("../../components/uploadImage2.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtImg: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  NuxtPage: typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyAdminHeader: LazyComponent<typeof import("../../components/Admin/Header.vue")['default']>
  LazyAdminPenawaranDialogBuatInvoice: LazyComponent<typeof import("../../components/Admin/Penawaran/dialog-buat-invoice.vue")['default']>
  LazyAdminPenawaranDialogBuatPengeluaran: LazyComponent<typeof import("../../components/Admin/Penawaran/dialog-buat-pengeluaran.vue")['default']>
  LazyAdminPenawaranDialogPurchaseorder: LazyComponent<typeof import("../../components/Admin/Penawaran/dialog-purchaseorder.vue")['default']>
  LazyAdminSideMenu: LazyComponent<typeof import("../../components/Admin/SideMenu.vue")['default']>
  LazyAppNotification: LazyComponent<typeof import("../../components/AppNotification.vue")['default']>
  LazyConfirmationDialog: LazyComponent<typeof import("../../components/ConfirmationDialog.vue")['default']>
  LazyDatePickerAuto: LazyComponent<typeof import("../../components/DatePickerAuto.vue")['default']>
  LazyAAutocompleteNew: LazyComponent<typeof import("../../components/a/autocomplete-new.vue")['default']>
  LazyAAutocomplete: LazyComponent<typeof import("../../components/a/autocomplete.vue")['default']>
  LazyABtn: LazyComponent<typeof import("../../components/a/btn.vue")['default']>
  LazyAButtonReject: LazyComponent<typeof import("../../components/a/button-reject.vue")['default']>
  LazyAButtonToggle: LazyComponent<typeof import("../../components/a/button-toggle.vue")['default']>
  LazyAButton: LazyComponent<typeof import("../../components/a/button.vue")['default']>
  LazyACheckbox: LazyComponent<typeof import("../../components/a/checkbox.vue")['default']>
  LazyADatePickerNew: LazyComponent<typeof import("../../components/a/date-picker-new.vue")['default']>
  LazyADatePicker: LazyComponent<typeof import("../../components/a/date-picker.vue")['default']>
  LazyAFieldNumberNew: LazyComponent<typeof import("../../components/a/field-number-new.vue")['default']>
  LazyAFieldNumber: LazyComponent<typeof import("../../components/a/field-number.vue")['default']>
  LazyAIconSuccess: LazyComponent<typeof import("../../components/a/icon-success.vue")['default']>
  LazyAInputDoc: LazyComponent<typeof import("../../components/a/input-doc.vue")['default']>
  LazyASelectNew: LazyComponent<typeof import("../../components/a/select-new.vue")['default']>
  LazyASelect: LazyComponent<typeof import("../../components/a/select.vue")['default']>
  LazyATextFieldNew: LazyComponent<typeof import("../../components/a/text-field-new.vue")['default']>
  LazyATextField: LazyComponent<typeof import("../../components/a/text-field.vue")['default']>
  LazyATextareaNew: LazyComponent<typeof import("../../components/a/textarea-new.vue")['default']>
  LazyATextarea: LazyComponent<typeof import("../../components/a/textarea.vue")['default']>
  LazyATimePicker: LazyComponent<typeof import("../../components/a/time-picker.vue")['default']>
  LazyCanvasPenawaranPt: LazyComponent<typeof import("../../components/canvas-penawaran-pt.vue")['default']>
  LazyCanvasPenawaran: LazyComponent<typeof import("../../components/canvas-penawaran.vue")['default']>
  LazyCanvasPurchaseorder: LazyComponent<typeof import("../../components/canvas-purchaseorder.vue")['default']>
  LazyDeliveryOrder: LazyComponent<typeof import("../../components/delivery-order.vue")['default']>
  LazyDialogTambahBeritaAcara: LazyComponent<typeof import("../../components/dialog-tambah-berita-acara.vue")['default']>
  LazyLoadingApp: LazyComponent<typeof import("../../components/loadingApp.vue")['default']>
  LazyPrint: LazyComponent<typeof import("../../components/print.vue")['default']>
  LazyUploadImage: LazyComponent<typeof import("../../components/uploadImage.vue")['default']>
  LazyUploadImage2: LazyComponent<typeof import("../../components/uploadImage2.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
