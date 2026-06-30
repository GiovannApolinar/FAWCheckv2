import type { Translations } from '@/lib/locale';

const en: Translations = {
  // Settings — page header
  settings_label: 'Settings',
  settings_heading: 'App preferences',
  settings_description:
    'Manage the appearance of the app and install FAWCheck for faster access during field work.',

  // Settings — Appearance section
  settings_appearance_heading: 'Appearance',
  settings_appearance_description:
    'Enable dark mode for lower-glare viewing. Your choice is saved on this device and reused the next time you open the app.',
  settings_dark_mode_on: 'Dark mode is on',
  settings_dark_mode_off: 'Dark mode is off',
  settings_theme_light: 'Light',
  settings_theme_light_desc: 'Bright background for daytime use.',
  settings_theme_dark: 'Dark',
  settings_theme_dark_desc: 'Lower-glare interface for dimmer environments.',

  // Settings — Language section
  settings_language_heading: 'Language',
  settings_language_description:
    'Choose the language for the app. Your choice is saved on this device and reused the next time you open the app.',
  settings_language_en_on: 'English is on',
  settings_language_tl_on: 'Filipino is on',
  settings_language_en: 'English',
  settings_language_en_desc: 'Default application language.',
  settings_language_tl: 'Filipino',
  settings_language_tl_desc: 'All text displayed in Filipino.',

  // Navigation
  nav_home: 'Home',
  nav_assessment: 'Assessment',
  nav_records: 'Records',
  nav_validate: 'Validate',
  nav_profile: 'Profile',
  nav_about: 'About',
  nav_settings: 'Settings',
  nav_logout: 'Logout',
  nav_install: 'Install',
  nav_installing: 'Installing...',
  nav_how_to_add: 'How to add',
  nav_how_to_install: 'How to install',
  nav_ios_hint_pre: 'Use the browser share menu, then choose ',
  nav_ios_hint_action: 'Add to Home Screen',
  nav_android_hint_pre: 'Open the browser menu and choose ',
  nav_android_hint_action1: 'Install app',
  nav_android_hint_mid: '. If that option is missing, use ',
  nav_android_hint_action2: 'Add to Home screen',

  // Auth page
  auth_checking_session: 'Checking your session...',
  auth_login_heading: 'Log into FAWCheck',
  auth_signup_heading: 'Sign up for FAWCheck',
  auth_login_helper: 'Use your approved account credentials to continue.',
  auth_signup_helper:
    'Submit your account request here. Access is enabled after an administrator approves it.',
  auth_marketing_tagline: 'A Digital Tool for Faster and More Reliable Maize Damage Rating',
  auth_partner_message:
    'This project is in collaboration with the Institute of Plant Breeding - Entomology Laboratory.',
  auth_email_label: 'Email',
  auth_email_placeholder: 'Enter your email',
  auth_password_label: 'Password',
  auth_password_placeholder_login: 'Enter your password',
  auth_password_placeholder_signup: 'Create a password',
  auth_submit_submitting: 'Submitting...',
  auth_submit_login: 'Sign In',
  auth_submit_signup: 'Request Access',
  auth_forgot_password: 'Forgot password?',
  auth_signup_pending_note:
    'Account requests remain pending until an administrator approves access.',
  auth_toggle_to_signup: "Don't have an account?",
  auth_toggle_to_login: 'Already have an account?',
  auth_toggle_signup_label: 'Sign Up',
  auth_toggle_login_label: 'Sign In',
  toast_login_success: 'Logged in successfully!',
  toast_auth_failed: 'Authentication failed.',
  toast_forgot_password:
    'Password reset is not available yet. Please contact the project administrator.',

  // Home page
  home_checking_auth: 'Checking authentication...',
  home_heading: 'Welcome to FAWCheck.',
  home_description:
    'developed for Institute of Plant Breeding- Entomology Laboratory. Record observations on site and save them securely to your FAWCheck account.',
  home_btn_new_assessment: 'Start New Assessment',
  home_btn_saved_records: 'View Saved Records',
  home_btn_review_signups: 'Review Sign-Ups',

  // Assessment form
  assessment_heading_create: 'Start New Assessment',
  assessment_heading_edit: 'Edit Saved Record',
  assessment_loading_record: 'Loading the saved record...',
  assessment_edit_warning:
    'Update the assessment details below. Saving will overwrite this existing record.',
  assessment_back_to_saved: 'Back to Saved Records',
  assessment_dap_label: 'Days After Planting (DAP)',
  assessment_location_label: 'Location (optional)',
  assessment_photo_label_camera: 'Take Maize Photo',
  assessment_photo_label_upload: 'Upload Maize Image',
  assessment_photo_btn_camera: 'Take Photo',
  assessment_photo_btn_upload: 'Upload Image',
  assessment_photo_none_camera: 'No photo taken yet',
  assessment_photo_none_upload: 'No image selected',
  assessment_photo_replace_camera:
    'The current photo is already loaded. Take a new photo only if you want to replace it.',
  assessment_photo_replace_upload:
    'The current image is already loaded. Upload a new image only if you want to replace it.',
  assessment_photo_model_note:
    'Final scoring still follows the Prasanna foliar damage guide. The image is used only as supporting advice while the current model dataset is still limited.',
  assessment_observed_heading: 'What You Observed',
  assessment_observed_desc:
    'Use your best estimate for each question. The wording is simplified, but the answers still map to the Prasanna foliar damage scale.',
  assessment_q_leaf_feeding_label: 'Do you see any signs of leaf feeding damage?',
  assessment_q_leaf_feeding_hint:
    'Choose Yes if you notice chewing, pinholes, scars, or torn leaf tissue.',
  assessment_option_no: 'No',
  assessment_option_yes: 'Yes',
  assessment_q_pinholes_label: 'How many older leaves have tiny pinholes?',
  assessment_q_pinholes_hint:
    'Count only the older outer leaves, not the newest leaves in the center.',
  assessment_q_shot_hole_label: 'How many leaves are damaged by small feeding holes?',
  assessment_q_shot_hole_hint:
    'Think of this as the number of leaves with shot-hole type damage. If the damaged leaves are still rolled in the center, choose one of the rolled-center-leaf options.',
  assessment_q_elongated_label: 'How many long feeding scars or streaks do you see?',
  assessment_q_elongated_hint: 'These are stretched feeding marks rather than round holes.',
  assessment_q_holes_label: 'How much round or torn hole damage do you see?',
  assessment_q_holes_hint:
    'Choose the option that best matches the overall amount of visible holes or tearing.',
  assessment_q_whorl_label: 'How badly damaged is the whorl?',
  assessment_q_whorl_hint:
    'This refers to the whorl, or the tightly rolled young leaves in the middle of the plant.',
  assessment_q_larvae_label: 'How many FAW larvae can you see?',
  assessment_q_larvae_hint: 'Enter your best count of visible worms or larvae on the plant.',
  assessment_plant_dying: 'The plant is already dying because of severe leaf damage',
  assessment_btn_cancel: 'Cancel',
  assessment_btn_saving_changes: 'Saving Changes...',
  assessment_btn_save_changes: 'Save Changes',
  assessment_btn_saving_assessment: 'Saving Assessment...',
  assessment_btn_save_assessment: 'Save Assessment',
  toast_not_maize:
    'This photo may not show maize/corn. Please retake or upload a maize photo.',
  toast_record_loading: 'The saved record is still loading.',
  toast_invalid_dap: 'Enter a valid DAP value.',
  toast_photo_required_camera: 'Take a maize photo before submitting.',
  toast_photo_required_upload: 'Upload a maize image before submitting.',
  toast_photo_validating: 'Please wait while the photo is checked.',
  toast_record_updated: 'Record updated.',
  toast_assessment_saved: 'Assessment saved.',
  toast_assessment_failed: 'Assessment submission failed.',

  // Symptom content options
  symptom_none: 'None',
  symptom_pinhole_1: '1 older leaf has pinholes',
  symptom_pinhole_2: '2 older leaves have pinholes',
  symptom_shot_hole_few_lt5: 'Fewer than 5 leaves are damaged',
  symptom_shot_hole_several_6_8: 'About 6 to 8 leaves are damaged',
  symptom_shot_hole_many_8_10: 'About 8 to 10 leaves are damaged',
  symptom_shot_hole_several_whorl: 'Several rolled center leaves are damaged',
  symptom_shot_hole_most_whorl: 'Most rolled center leaves are damaged',
  symptom_elongated_few_small: 'A few short scars (up to 1.3 cm)',
  symptom_elongated_several_large: 'Several long scars (more than 2.5 cm)',
  symptom_elongated_many: 'Many scars of different lengths',
  symptom_hole_few_small_mid: 'A few small to medium holes',
  symptom_hole_several_large: 'Several large holes',
  symptom_hole_many_mid_large: 'Many medium to large holes',
  symptom_whorl_partial: 'Partly damaged',
  symptom_whorl_almost_total: 'Almost completely destroyed',

  // Result page
  result_heading: 'Assessment Result',
  result_loading: 'Loading assessment result...',
  result_failed: 'Failed to load result.',
  result_model_note:
    'The foliar score follows the field scoring guide. The image model is shown as supporting information only.',
  result_final_score: 'Final score:',
  result_rule_score: 'Rule score:',
  result_response_band: 'Response band:',
  result_confidence: 'Confidence:',
  result_dap: 'DAP:',
  result_captured_image: 'Captured image',
  result_btn_saved_records: 'View Saved Records',
  result_btn_new_assessment: 'Make New Assessment',
  result_suspense_loading: 'Loading...',

  // Saved records page
  saved_checking_auth: 'Checking authentication...',
  saved_label: 'Records',
  saved_heading: 'Saved Records',
  saved_search_placeholder: 'Search location/image/text',
  saved_min_score_placeholder: 'Min score',
  saved_max_score_placeholder: 'Max score',
  saved_export_csv: 'Export CSV',
  saved_loading: 'Loading records...',
  saved_error_offline: 'Saved records are available once you are back online.',
  saved_col_date: 'Date',
  saved_col_score: 'Score',
  saved_col_band: 'Band',
  saved_col_confidence: 'Confidence',
  saved_col_dap: 'DAP',
  saved_col_location: 'Location',
  saved_col_image: 'Image',
  saved_col_actions: 'Actions',
  saved_no_records: 'No records found.',
  saved_na: 'N/A',
  saved_btn_view: 'View',
  saved_btn_edit: 'Edit',
  saved_btn_delete: 'Delete',
  saved_pagination_page: 'Page',
  saved_pagination_of: 'of',
  saved_pagination_previous: 'Previous',
  saved_pagination_next: 'Next',
  toast_delete_offline: 'Delete is available once you are back online.',
  toast_delete_confirm: 'Delete this record?',
  toast_record_deleted: 'Record deleted.',
  toast_delete_failed: 'Delete failed.',
  toast_export_offline: 'CSV export is available once you are back online.',
  toast_export_failed: 'CSV export failed.',

  // Profile page
  profile_checking_access: 'Checking profile access...',
  profile_label: 'Profile',
  profile_heading: 'Manage your account',
  profile_description:
    'Update the name and section shown for your account and review whether this account can be deleted.',
  profile_loading: 'Loading your profile...',
  profile_error_online: 'Your profile could not be loaded right now.',
  profile_error_offline: 'Profile management is available once you are back online.',
  profile_email_label: 'Email',
  profile_role_label: 'Role',
  profile_details_heading: 'Profile details',
  profile_details_desc:
    'Keep your account name and section up to date so it is easier to identify who is using the app.',
  profile_name_label: 'Display name',
  profile_name_placeholder: 'Enter your name',
  profile_section_label: 'Section',
  profile_section_placeholder: 'Enter your section',
  profile_btn_saving: 'Saving...',
  profile_btn_save: 'Save profile',
  profile_delete_heading: 'Delete account',
  profile_delete_desc:
    'Deleting your account permanently removes your access and your saved assessment records.',
  profile_delete_admin_warning:
    'This account is protected because it has administrator access.',
  profile_btn_deleting: 'Deleting...',
  profile_btn_delete: 'Delete account',
  toast_profile_enter_name: 'Enter your name before saving.',
  toast_profile_updated: 'Profile updated.',
  toast_profile_update_failed: 'Failed to update your profile.',
  toast_profile_offline: 'Profile updates are available once you are back online.',
  toast_admin_no_delete: 'Admin accounts cannot be deleted.',
  toast_delete_account_confirm:
    'Delete your account permanently? This will remove your saved assessments and cannot be undone.',
  toast_account_deleted: 'Your account has been deleted.',
  toast_account_delete_failed: 'Failed to delete your account.',
  toast_account_delete_offline: 'Account deletion is available once you are back online.',

  // About page
  about_label: 'About the project',
  about_heading: 'FAWCheck',
  about_summary:
    'FAWCheck is a field tool for recording Fall Armyworm foliar damage assessments in maize. It supports guided symptom capture and record review for public pilot testing.',
  about_section_overview_title: 'Project overview',
  about_section_overview_body:
    'The application helps users score maize leaf damage using the field guide, attach a captured image, and store the assessment as a structured record for later review.',
  about_section_fieldwork_title: 'How it supports fieldwork',
  about_section_fieldwork_body:
    'FAWCheck is designed for fast field assessments. Users can capture observations on site and save structured records for later review.',
  about_section_collab_title: 'Collaboration',
  about_section_collab_body:
    'This project is being developed in collaboration with UPLB, the Institute of Plant Breeding, and the UPLB Institute of Computer Science to support faster and more reliable maize damage rating.',
  about_partners_heading: 'Project partners',
  about_partners_desc:
    'The current build highlights the collaborating institutions supporting the project and its field use.',
  about_partner_uplb_description:
    "University of the Philippines Los Banos, one of the project's academic partner institutions.",
  about_partner_ipb_description:
    'The Institute of Plant Breeding - Entomology Laboratory, the primary field-use partner for FAWCheck.',
  about_partner_ics_description:
    'The UPLB Institute of Computer Science, collaborating on the digital system and application workflow.',
  about_capabilities_heading: 'Key capabilities in this build',
  about_capability_scoring: 'Guided foliar damage scoring based on the field rating guide',
  about_capability_records:
    'Assessment record storage with search, filtering, and CSV export',
  about_capability_admin: 'Admin approval workflow for new sign-up requests',

  // PWA install prompt
  pwa_installed_heading: 'Install FAWCheck',
  pwa_installed_desc:
    'FAWCheck is already installed on this device. Open it from the home screen or app list whenever you need it in the field.',
  pwa_prompt_heading: 'Install FAWCheck',
  pwa_prompt_desc:
    'Save FAWCheck to this device so it is easier to launch during field visits and repeated assessments.',
  pwa_prompt_btn: 'Install App',
  pwa_prompt_btn_installing: 'Opening install prompt...',
  pwa_ios_heading: 'Add FAWCheck to Home Screen',
  pwa_ios_desc1:
    'iPhone and iPad installation happens through the browser share menu instead of a separate pop-up prompt.',
  pwa_ios_desc2_pre: 'Tap ',
  pwa_ios_desc2_action: 'Add to Home Screen',
  pwa_ios_desc2_post: ' to keep FAWCheck one tap away in the field.',
  pwa_android_heading: 'Install FAWCheck',
  pwa_android_desc1: 'This browser is not showing a direct install prompt yet.',
  pwa_android_desc2_pre: 'Open the browser menu and choose ',
  pwa_android_desc2_action1: 'Install app',
  pwa_android_desc2_mid: '. If the browser only offers ',
  pwa_android_desc2_action2: 'Add to Home screen',
  pwa_android_desc2_post: ', that option will still pin FAWCheck like an app launcher.',
  pwa_other_desc:
    'This browser is not exposing a supported install flow right now. If you need a mobile install prompt, open FAWCheck in a current Chromium-based browser on Android or use Add to Home Screen on iPhone or iPad.',
  pwa_generic_desc:
    'This browser is not showing an install prompt right now. If installation is supported, the browser will expose the option automatically when it becomes available.',

  // Photo validation notice
  photo_validating: 'Checking the photo for basic quality and content issues...',
  photo_warning_heading: 'Photo warning',

  // Photo validation warning strings
  validation_unusable_title: 'Photo may be unusable',
  validation_unusable_msg_prefix: 'This photo may be hard to assess because ',
  validation_unusable_msg_suffix: '. Retake it with the maize leaf in focus and well lit.',
  validation_reason_too_small: 'the image is too small',
  validation_reason_blurry: 'it looks blurry',
  validation_reason_too_dark: 'it is too dark',
  validation_reason_too_bright: 'it is too bright',
  validation_reason_low_contrast: 'leaf details are hard to see',
  validation_conjunction_and: 'and',
  validation_not_maize_title: 'Photo may not show maize/corn',
  validation_not_maize_label_pre: 'This image looks more like ',
  validation_not_maize_plant_post:
    ' than maize/corn. Retake it with the maize leaves centered in the frame.',
  validation_not_maize_nonplant_post:
    ' than a maize/corn plant. Retake it with the maize leaves centered in the frame.',
  validation_not_maize_no_vegetation:
    'This image does not clearly look like a maize/corn plant. Retake it with the maize leaves filling most of the frame.',
};

export default en;
