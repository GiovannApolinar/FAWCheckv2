export const LOCALE_STORAGE_KEY = 'fawcheck-locale';

export type Locale = 'en' | 'tl';

export type Translations = {
  // Settings — page header
  settings_label: string;
  settings_heading: string;
  settings_description: string;

  // Settings — Appearance section
  settings_appearance_heading: string;
  settings_appearance_description: string;
  settings_dark_mode_on: string;
  settings_dark_mode_off: string;
  settings_theme_light: string;
  settings_theme_light_desc: string;
  settings_theme_dark: string;
  settings_theme_dark_desc: string;

  // Settings — Language section
  settings_language_heading: string;
  settings_language_description: string;
  settings_language_en_on: string;
  settings_language_tl_on: string;
  settings_language_en: string;
  settings_language_en_desc: string;
  settings_language_tl: string;
  settings_language_tl_desc: string;

  // Navigation
  nav_home: string;
  nav_assessment: string;
  nav_records: string;
  nav_validate: string;
  nav_profile: string;
  nav_about: string;
  nav_settings: string;
  nav_logout: string;
  nav_install: string;
  nav_installing: string;
  nav_how_to_add: string;
  nav_how_to_install: string;
  nav_ios_hint_pre: string;
  nav_ios_hint_action: string;
  nav_android_hint_pre: string;
  nav_android_hint_action1: string;
  nav_android_hint_mid: string;
  nav_android_hint_action2: string;

  // Auth page
  auth_checking_session: string;
  auth_login_heading: string;
  auth_signup_heading: string;
  auth_login_helper: string;
  auth_signup_helper: string;
  auth_marketing_tagline: string;
  auth_partner_message: string;
  auth_email_label: string;
  auth_email_placeholder: string;
  auth_password_label: string;
  auth_password_placeholder_login: string;
  auth_password_placeholder_signup: string;
  auth_submit_submitting: string;
  auth_submit_login: string;
  auth_submit_signup: string;
  auth_forgot_password: string;
  auth_toggle_to_signup: string;
  auth_toggle_to_login: string;
  auth_toggle_signup_label: string;
  auth_toggle_login_label: string;
  toast_login_success: string;
  toast_auth_failed: string;
  toast_forgot_password: string;

  // Home page
  home_checking_auth: string;
  home_heading: string;
  home_description: string;
  home_btn_new_assessment: string;
  home_btn_saved_records: string;
  home_btn_review_signups: string;

  // Assessment form
  assessment_heading_create: string;
  assessment_heading_edit: string;
  assessment_loading_record: string;
  assessment_edit_warning: string;
  assessment_back_to_saved: string;
  assessment_dap_label: string;
  assessment_location_label: string;
  assessment_photo_label_camera: string;
  assessment_photo_label_upload: string;
  assessment_photo_btn_camera: string;
  assessment_photo_btn_upload: string;
  assessment_photo_none_camera: string;
  assessment_photo_none_upload: string;
  assessment_photo_replace_camera: string;
  assessment_photo_replace_upload: string;
  assessment_photo_model_note: string;
  assessment_observed_heading: string;
  assessment_observed_desc: string;
  assessment_q_leaf_feeding_label: string;
  assessment_q_leaf_feeding_hint: string;
  assessment_option_no: string;
  assessment_option_yes: string;
  assessment_q_pinholes_label: string;
  assessment_q_pinholes_hint: string;
  assessment_q_shot_hole_label: string;
  assessment_q_shot_hole_hint: string;
  assessment_q_elongated_label: string;
  assessment_q_elongated_hint: string;
  assessment_q_holes_label: string;
  assessment_q_holes_hint: string;
  assessment_q_whorl_label: string;
  assessment_q_whorl_hint: string;
  assessment_q_larvae_label: string;
  assessment_q_larvae_hint: string;
  assessment_plant_dying: string;
  assessment_btn_cancel: string;
  assessment_btn_saving_changes: string;
  assessment_btn_save_changes: string;
  assessment_btn_saving_assessment: string;
  assessment_btn_save_assessment: string;
  toast_not_maize: string;
  toast_record_loading: string;
  toast_invalid_dap: string;
  toast_photo_required_camera: string;
  toast_photo_required_upload: string;
  toast_photo_validating: string;
  toast_record_updated: string;
  toast_assessment_saved: string;
  toast_assessment_failed: string;

  // Symptom content options
  symptom_none: string;
  symptom_pinhole_1: string;
  symptom_pinhole_2: string;
  symptom_shot_hole_few_lt5: string;
  symptom_shot_hole_several_6_8: string;
  symptom_shot_hole_many_8_10: string;
  symptom_shot_hole_several_whorl: string;
  symptom_shot_hole_most_whorl: string;
  symptom_elongated_few_small: string;
  symptom_elongated_several_large: string;
  symptom_elongated_many: string;
  symptom_hole_few_small_mid: string;
  symptom_hole_several_large: string;
  symptom_hole_many_mid_large: string;
  symptom_whorl_partial: string;
  symptom_whorl_almost_total: string;

  // Result page
  result_heading: string;
  result_loading: string;
  result_failed: string;
  result_model_note: string;
  result_final_score: string;
  result_rule_score: string;
  result_response_band: string;
  result_confidence: string;
  result_dap: string;
  result_captured_image: string;
  result_btn_saved_records: string;
  result_btn_new_assessment: string;
  result_suspense_loading: string;

  // Saved records page
  saved_checking_auth: string;
  saved_label: string;
  saved_heading: string;
  saved_search_placeholder: string;
  saved_min_score_placeholder: string;
  saved_max_score_placeholder: string;
  saved_export_csv: string;
  saved_loading: string;
  saved_error_offline: string;
  saved_col_date: string;
  saved_col_score: string;
  saved_col_band: string;
  saved_col_confidence: string;
  saved_col_dap: string;
  saved_col_location: string;
  saved_col_image: string;
  saved_col_actions: string;
  saved_no_records: string;
  saved_na: string;
  saved_btn_view: string;
  saved_btn_edit: string;
  saved_btn_delete: string;
  saved_pagination_page: string;
  saved_pagination_of: string;
  saved_pagination_previous: string;
  saved_pagination_next: string;
  toast_delete_offline: string;
  toast_delete_confirm: string;
  toast_record_deleted: string;
  toast_delete_failed: string;
  toast_export_offline: string;
  toast_export_failed: string;

  // Profile page
  profile_checking_access: string;
  profile_label: string;
  profile_heading: string;
  profile_description: string;
  profile_loading: string;
  profile_error_online: string;
  profile_error_offline: string;
  profile_email_label: string;
  profile_role_label: string;
  profile_details_heading: string;
  profile_details_desc: string;
  profile_name_label: string;
  profile_name_placeholder: string;
  profile_section_label: string;
  profile_section_placeholder: string;
  profile_btn_saving: string;
  profile_btn_save: string;
  profile_delete_heading: string;
  profile_delete_desc: string;
  profile_delete_admin_warning: string;
  profile_btn_deleting: string;
  profile_btn_delete: string;
  toast_profile_enter_name: string;
  toast_profile_updated: string;
  toast_profile_update_failed: string;
  toast_profile_offline: string;
  toast_admin_no_delete: string;
  toast_delete_account_confirm: string;
  toast_account_deleted: string;
  toast_account_delete_failed: string;
  toast_account_delete_offline: string;

  // About page
  about_label: string;
  about_heading: string;
  about_summary: string;
  about_section_overview_title: string;
  about_section_overview_body: string;
  about_section_fieldwork_title: string;
  about_section_fieldwork_body: string;
  about_section_collab_title: string;
  about_section_collab_body: string;
  about_partners_heading: string;
  about_partners_desc: string;
  about_partner_uplb_description: string;
  about_partner_ipb_description: string;
  about_partner_ics_description: string;
  about_capabilities_heading: string;
  about_capability_scoring: string;
  about_capability_records: string;
  about_capability_admin: string;

  // PWA install prompt
  pwa_installed_heading: string;
  pwa_installed_desc: string;
  pwa_prompt_heading: string;
  pwa_prompt_desc: string;
  pwa_prompt_btn: string;
  pwa_prompt_btn_installing: string;
  pwa_ios_heading: string;
  pwa_ios_desc1: string;
  pwa_ios_desc2_pre: string;
  pwa_ios_desc2_action: string;
  pwa_ios_desc2_post: string;
  pwa_android_heading: string;
  pwa_android_desc1: string;
  pwa_android_desc2_pre: string;
  pwa_android_desc2_action1: string;
  pwa_android_desc2_mid: string;
  pwa_android_desc2_action2: string;
  pwa_android_desc2_post: string;
  pwa_other_desc: string;
  pwa_generic_desc: string;

  // Photo validation notice
  photo_validating: string;
  photo_warning_heading: string;

  // Photo validation warning strings
  validation_unusable_title: string;
  validation_unusable_msg_prefix: string;
  validation_unusable_msg_suffix: string;
  validation_reason_too_small: string;
  validation_reason_blurry: string;
  validation_reason_too_dark: string;
  validation_reason_too_bright: string;
  validation_reason_low_contrast: string;
  validation_conjunction_and: string;
  validation_not_maize_title: string;
  validation_not_maize_label_pre: string;
  validation_not_maize_plant_post: string;
  validation_not_maize_nonplant_post: string;
  validation_not_maize_no_vegetation: string;
};

export type TranslationFn = (key: keyof Translations) => string;

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'tl';
}

export function getStoredLocale(): Locale | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : null;
}

export function resolveLocale(): Locale {
  return getStoredLocale() ?? 'en';
}

export function applyLocale(locale: Locale): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.locale = locale;
  root.lang = locale;
}

export const LOCALE_CHANGE_EVENT = 'fawcheck-locale-change';

export function persistLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: locale }));
  }

  applyLocale(locale);
}

export const localeInitScript = `(() => {
  try {
    const stored = window.localStorage.getItem('${LOCALE_STORAGE_KEY}');
    const locale = stored === 'en' || stored === 'tl' ? stored : 'en';
    const root = document.documentElement;
    root.dataset.locale = locale;
    root.lang = locale;
  } catch (e) {
    // Ignore locale boot errors and keep the default locale.
  }
})();`;
