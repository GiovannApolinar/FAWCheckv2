import type { Translations } from '@/lib/locale';

const tl: Translations = {
  // Settings — page header
  settings_label: 'Mga Setting',
  settings_heading: 'Mga Gustong Baguhin',
  settings_description:
    'Dito maaaring palitan ang itsura ng app at i-install ang FAWCheck para sa mas mabilis na access tuwing gagamitin ito.',

  // Settings — Appearance section
  settings_appearance_heading: 'Itsura',
  settings_appearance_description:
    'I-enable ang dark mode para sa mas komportableng paggamit ng app. Ang iyong pinili ay naka-save sa device na ito at gagamitin sa susunod na pagbukas ng app.',
  settings_dark_mode_on: 'Naka-on ang dark mode',
  settings_dark_mode_off: 'Naka-off ang dark mode',
  settings_theme_light: 'Maliwanag',
  settings_theme_light_desc: 'Maliwanag na disenyo; mainam gamitin tuwing tag-araw at nasa bukirin o taniman.',
  settings_theme_dark: 'Madilim',
  settings_theme_dark_desc: 'Disenyo na may mababang liwanag; mainam gamitin sa gabi o sa madilim na lugar.',

  // Settings — Language section
  settings_language_heading: 'Wika',
  settings_language_description:
    'Piliin ang wika na iyong nais. Ang iyong pinili ay naka-save sa device na ito at gagamitin sa susunod na pagbukas ng app.',
  settings_language_en_on: 'Naka-on ang English',
  settings_language_tl_on: 'Naka-on ang Filipino',
  settings_language_en: 'Ingles',
  settings_language_en_desc: 'Mga salitang isinalin sa Ingles.',
  settings_language_tl: 'Filipino',
  settings_language_tl_desc: 'Mga salitang isinalin sa Filipino.',

  // Pre generated, for testing.
  // Navigation
  nav_home: 'Home',
  nav_assessment: 'Pagtatasa',
  nav_records: 'Mga Talaan',
  nav_validate: 'Pag-apruba',
  nav_profile: 'Profile',
  nav_about: 'Tungkol',
  nav_settings: 'Mga Setting',
  nav_logout: 'Mag-logout',
  nav_install: 'I-install',
  nav_installing: 'Ina-install...',
  nav_how_to_add: 'Paano magdagdag',
  nav_how_to_install: 'Paano mag-install',
  nav_ios_hint_pre: 'Gamitin ang browser share menu, pagkatapos piliin ang ',
  nav_ios_hint_action: 'Add to Home Screen',
  nav_android_hint_pre: 'Buksan ang browser menu at piliin ang ',
  nav_android_hint_action1: 'Install app',
  nav_android_hint_mid: '. Kung wala ang opsyong ito, gamitin ang ',
  nav_android_hint_action2: 'Add to Home screen',

  // Auth page
  auth_checking_session: 'Sinusuri ang iyong session...',
  auth_login_heading: 'Mag-login sa FAWCheck',
  auth_signup_heading: 'Mag-sign up sa FAWCheck',
  auth_login_helper: 'Gamitin ang iyong aprubadong account credentials para magpatuloy.',
  auth_signup_helper:
    'Isumite ang iyong kahilingang account dito. Maaaring mag-access pagkatapos na aprubahan ng administrator.',
  auth_marketing_tagline:
    'Isang Digital na Kasangkapan para sa Mas Mabilis at Mas Maaasahang Pagtatasa ng Pinsala sa Mais',
  auth_partner_message:
    'Ang proyektong ito ay pakikipagtulungan sa Institute of Plant Breeding - Entomology Laboratory.',
  auth_email_label: 'Email',
  auth_email_placeholder: 'Ilagay ang iyong email',
  auth_password_label: 'Password',
  auth_password_placeholder_login: 'Ilagay ang iyong password',
  auth_password_placeholder_signup: 'Gumawa ng password',
  auth_submit_submitting: 'Isinusumite...',
  auth_submit_login: 'Mag-sign In',
  auth_submit_signup: 'Humiling ng Access',
  auth_forgot_password: 'Nakalimutan ang password?',
  auth_signup_pending_note:
    'Ang mga kahilingang account ay nananatiling nakabinbin hanggang sa aprubahan ng administrator.',
  auth_toggle_to_signup: 'Wala pang account?',
  auth_toggle_to_login: 'Mayroon nang account?',
  auth_toggle_signup_label: 'Mag-sign Up',
  auth_toggle_login_label: 'Mag-sign In',
  toast_signup_sent:
    'Ang iyong kahilingang mag-sign up ay naipadala na para sa pag-apruba ng admin.',
  toast_login_success: 'Matagumpay na naka-login!',
  toast_auth_failed: 'Nabigo ang pagpapatunay.',
  toast_forgot_password:
    'Hindi pa available ang pag-reset ng password. Makipag-ugnayan sa administrator ng proyekto.',

  // Home page
  home_checking_auth: 'Sinusuri ang pagpapatunay...',
  home_heading: 'Maligayang pagdating sa FAWCheck.',
  home_description:
    'binuo para sa Institute of Plant Breeding- Entomology Laboratory. Itala ang mga obserbasyon sa lugar at i-save ang mga ito nang ligtas sa iyong FAWCheck account.',
  home_btn_new_assessment: 'Magsimula ng Bagong Pagtatasa',
  home_btn_saved_records: 'Tingnan ang Mga Naka-save na Talaan',
  home_btn_review_signups: 'Suriin ang Mga Sign-Up',

  // Assessment form
  assessment_heading_create: 'Magsimula ng Bagong Pagtatasa',
  assessment_heading_edit: 'I-edit ang Naka-save na Talaan',
  assessment_loading_record: 'Nino-load ang naka-save na talaan...',
  assessment_edit_warning:
    'I-update ang mga detalye ng pagtatasa sa ibaba. Ang pag-save ay magpapalit sa kasalukuyang talaan.',
  assessment_back_to_saved: 'Bumalik sa Mga Naka-save na Talaan',
  assessment_dap_label: 'Araw Pagkatapos ng Pagtatanim (DAP)',
  assessment_location_label: 'Lokasyon (opsyonal)',
  assessment_photo_label_camera: 'Kumuha ng Larawan ng Mais',
  assessment_photo_label_upload: 'Mag-upload ng Larawan ng Mais',
  assessment_photo_btn_camera: 'Kumuha ng Larawan',
  assessment_photo_btn_upload: 'Mag-upload ng Larawan',
  assessment_photo_none_camera: 'Wala pang larawang kinuha',
  assessment_photo_none_upload: 'Walang larawang napili',
  assessment_photo_replace_camera:
    'Ang kasalukuyang larawan ay na-load na. Kumuha ng bagong larawan lamang kung nais mong palitan ito.',
  assessment_photo_replace_upload:
    'Ang kasalukuyang larawan ay na-load na. Mag-upload ng bagong larawan lamang kung nais mong palitan ito.',
  assessment_photo_model_note:
    'Ang panghuling marka ay sumusunod pa rin sa gabay ng Prasanna foliar damage. Ang larawan ay ginagamit lamang bilang karagdagang impormasyon habang limitado pa ang dataset ng modelo.',
  assessment_observed_heading: 'Ang Iyong Napansin',
  assessment_observed_desc:
    'Gamitin ang iyong pinakamalapit na pagtatantya para sa bawat tanong. Pinasimple ang mga salita, ngunit ang mga sagot ay naka-mapa pa rin sa Prasanna foliar damage scale.',
  assessment_q_leaf_feeding_label:
    'Nakakita ka ba ng anumang palatandaan ng pinsala mula sa pagkain ng dahon?',
  assessment_q_leaf_feeding_hint:
    'Pumili ng Oo kung napansin mo ang pagngangata, maliliit na butas, peklat, o naging punit ang dahon.',
  assessment_option_no: 'Hindi',
  assessment_option_yes: 'Oo',
  assessment_q_pinholes_label: 'Ilang mas matandang dahon ang may maliliit na butas?',
  assessment_q_pinholes_hint:
    'Bilangin lamang ang mga mas matandang panlabas na dahon, hindi ang pinakabagong mga dahon sa gitna.',
  assessment_q_shot_hole_label: 'Ilang dahon ang nasira ng maliliit na butas mula sa pagkain?',
  assessment_q_shot_hole_hint:
    'Isipin ito bilang bilang ng mga dahon na may shot-hole na pinsala. Kung ang mga nasiraing dahon ay nakarolyo pa sa gitna, pumili ng isa sa mga opsyon ng nakarolyo na dahon.',
  assessment_q_elongated_label: 'Ilang mahabang peklat o guhit ng pagkain ang nakikita mo?',
  assessment_q_elongated_hint:
    'Ito ang mga peklat na pina-haba kaysa sa bilog na butas.',
  assessment_q_holes_label: 'Gaano karaming bilog o may punit na butas ang nakikita mo?',
  assessment_q_holes_hint:
    'Piliin ang opsyong pinakakatugma sa kabuuang dami ng nakikitang mga butas o punit.',
  assessment_q_whorl_label: 'Gaano kasama ang pinsala sa whorl?',
  assessment_q_whorl_hint:
    'Ito ay tumutukoy sa whorl, o ang maigting na nakarolyo na mga batang dahon sa gitna ng halaman.',
  assessment_q_larvae_label: 'Ilang FAW larvae ang nakikita mo?',
  assessment_q_larvae_hint:
    'Ilagay ang iyong pinakamalapit na bilang ng mga nakikitang uod o larvae sa halaman.',
  assessment_plant_dying: 'Namamatay na ang halaman dahil sa matinding pinsala sa dahon',
  assessment_btn_cancel: 'Kanselahin',
  assessment_btn_saving_changes: 'Nini-save ang mga Pagbabago...',
  assessment_btn_save_changes: 'I-save ang mga Pagbabago',
  assessment_btn_saving_assessment: 'Nini-save ang Pagtatasa...',
  assessment_btn_save_assessment: 'I-save ang Pagtatasa',
  toast_not_maize:
    'Maaaring hindi nagpapakita ng mais ang larawang ito. Mangyaring kumuha muli o mag-upload ng larawan ng mais.',
  toast_record_loading: 'Nilo-load pa ang naka-save na talaan.',
  toast_invalid_dap: 'Maglagay ng tamang DAP na halaga.',
  toast_photo_required_camera: 'Kumuha ng larawan ng mais bago magsumite.',
  toast_photo_required_upload: 'Mag-upload ng larawan ng mais bago magsumite.',
  toast_photo_validating: 'Mangyaring maghintay habang sinusuri ang larawan.',
  toast_record_updated: 'Nai-update na ang talaan.',
  toast_assessment_saved: 'Nai-save na ang pagtatasa.',
  toast_assessment_failed: 'Nabigo ang pagsumite ng pagtatasa.',

  // Symptom content options
  symptom_none: 'Wala',
  symptom_pinhole_1: '1 mas matandang dahon ang may maliliit na butas',
  symptom_pinhole_2: '2 mas matandang dahon ang may maliliit na butas',
  symptom_shot_hole_few_lt5: 'Wala pang 5 dahon ang nasira',
  symptom_shot_hole_several_6_8: 'Mga 6 hanggang 8 dahon ang nasira',
  symptom_shot_hole_many_8_10: 'Mga 8 hanggang 10 dahon ang nasira',
  symptom_shot_hole_several_whorl: 'Ilang nakarolyo na sentral na dahon ang nasira',
  symptom_shot_hole_most_whorl: 'Karamihan sa nakarolyo na sentral na dahon ang nasira',
  symptom_elongated_few_small: 'Ilang maikling peklat (hanggang 1.3 cm)',
  symptom_elongated_several_large: 'Ilang mahabang peklat (higit sa 2.5 cm)',
  symptom_elongated_many: "Maraming peklat ng iba't ibang haba",
  symptom_hole_few_small_mid: 'Ilang maliliit hanggang katamtamang butas',
  symptom_hole_several_large: 'Ilang malalaking butas',
  symptom_hole_many_mid_large: 'Maraming katamtaman hanggang malalaking butas',
  symptom_whorl_partial: 'Bahagyang nasira',
  symptom_whorl_almost_total: 'Halos ganap na nasira',

  // Result page
  result_heading: 'Resulta ng Pagtatasa',
  result_loading: 'Nilo-load ang resulta ng pagtatasa...',
  result_failed: 'Nabigo ang pag-load ng resulta.',
  result_model_note:
    'Ang marka ng dahon ay sumusunod sa gabay ng field scoring. Ang modelo ng larawan ay ipinapakita bilang karagdagang impormasyon lamang.',
  result_final_score: 'Panghuling marka:',
  result_rule_score: 'Marka ng panuntunan:',
  result_response_band: 'Banda ng tugon:',
  result_confidence: 'Kumpiyansa:',
  result_dap: 'DAP:',
  result_captured_image: 'Nakuhang larawan',
  result_btn_saved_records: 'Tingnan ang Mga Naka-save na Talaan',
  result_btn_new_assessment: 'Gumawa ng Bagong Pagtatasa',
  result_suspense_loading: 'Nilo-load...',

  // Saved records page
  saved_checking_auth: 'Sinusuri ang pagpapatunay...',
  saved_label: 'Mga Talaan',
  saved_heading: 'Mga Naka-save na Talaan',
  saved_search_placeholder: 'Maghanap ng lokasyon/larawan/teksto',
  saved_min_score_placeholder: 'Min na marka',
  saved_max_score_placeholder: 'Max na marka',
  saved_export_csv: 'I-export ang CSV',
  saved_loading: 'Nilo-load ang mga talaan...',
  saved_error_offline: 'Ang mga naka-save na talaan ay makukuha kapag nakabalik ka sa online.',
  saved_col_date: 'Petsa',
  saved_col_score: 'Marka',
  saved_col_band: 'Banda',
  saved_col_confidence: 'Kumpiyansa',
  saved_col_dap: 'DAP',
  saved_col_location: 'Lokasyon',
  saved_col_image: 'Larawan',
  saved_col_actions: 'Mga Aksyon',
  saved_no_records: 'Walang nahanap na talaan.',
  saved_na: 'N/A',
  saved_btn_view: 'Tingnan',
  saved_btn_edit: 'I-edit',
  saved_btn_delete: 'Tanggalin',
  saved_pagination_page: 'Pahina',
  saved_pagination_of: 'ng',
  saved_pagination_previous: 'Nakaraan',
  saved_pagination_next: 'Susunod',
  toast_delete_offline: 'Ang pagtanggal ay makukuha kapag nakabalik ka sa online.',
  toast_delete_confirm: 'Tanggalin ang talaan na ito?',
  toast_record_deleted: 'Natanggal na ang talaan.',
  toast_delete_failed: 'Nabigo ang pagtanggal.',
  toast_export_offline: 'Ang pag-export ng CSV ay makukuha kapag nakabalik ka sa online.',
  toast_export_failed: 'Nabigo ang pag-export ng CSV.',

  // Profile page
  profile_checking_access: 'Sinusuri ang access sa profile...',
  profile_label: 'Profile',
  profile_heading: 'Pamahalaan ang iyong account',
  profile_description:
    'I-update ang pangalan at seksyon na ipinapakita para sa iyong account at suriin kung maaaring tanggalin ang account na ito.',
  profile_loading: 'Nilo-load ang iyong profile...',
  profile_error_online: 'Hindi ma-load ang iyong profile sa ngayon.',
  profile_error_offline: 'Ang pamamahala ng profile ay makukuha kapag nakabalik ka sa online.',
  profile_email_label: 'Email',
  profile_role_label: 'Papel',
  profile_details_heading: 'Mga detalye ng profile',
  profile_details_desc:
    'Panatilihing updated ang pangalan at seksyon ng iyong account para mas madaling makilala kung sino ang gumagamit ng app.',
  profile_name_label: 'Display na pangalan',
  profile_name_placeholder: 'Ilagay ang iyong pangalan',
  profile_section_label: 'Seksyon',
  profile_section_placeholder: 'Ilagay ang iyong seksyon',
  profile_btn_saving: 'Nini-save...',
  profile_btn_save: 'I-save ang profile',
  profile_delete_heading: 'Tanggalin ang account',
  profile_delete_desc:
    'Ang pagtanggal ng iyong account ay permanenteng aalisin ang iyong access at ang iyong mga naka-save na talaan ng pagtatasa.',
  profile_delete_admin_warning:
    'Ang account na ito ay protektado dahil ito ay may access bilang administrator.',
  profile_btn_deleting: 'Tinatanggal...',
  profile_btn_delete: 'Tanggalin ang account',
  toast_profile_enter_name: 'Ilagay ang iyong pangalan bago mag-save.',
  toast_profile_updated: 'Na-update na ang profile.',
  toast_profile_update_failed: 'Nabigo ang pag-update ng iyong profile.',
  toast_profile_offline: 'Ang mga update sa profile ay makukuha kapag nakabalik ka sa online.',
  toast_admin_no_delete: 'Hindi maaaring tanggalin ang mga admin account.',
  toast_delete_account_confirm:
    'Permanenteng tanggalin ang iyong account? Aalisin nito ang iyong mga naka-save na pagtatasa at hindi ito maaaring bawiin.',
  toast_account_deleted: 'Natanggal na ang iyong account.',
  toast_account_delete_failed: 'Nabigo ang pagtanggal ng iyong account.',
  toast_account_delete_offline:
    'Ang pagtanggal ng account ay makukuha kapag nakabalik ka sa online.',

  // About page
  about_label: 'Tungkol sa proyekto',
  about_heading: 'FAWCheck',
  about_summary:
    'Ang FAWCheck ay isang field tool para sa pagtatala ng mga pagtatasa ng pinsala ng Fall Armyworm foliar sa mais. Sinusuportahan nito ang guided na pagkuha ng mga sintomas at pagsusuri ng mga talaan para sa pampublikong pilot testing.',
  about_section_overview_title: 'Pangkalahatang-ideya ng proyekto',
  about_section_overview_body:
    'Tinutulungan ng application ang mga gumagamit na markahan ang pinsala sa dahon ng mais gamit ang gabay sa field, maglakip ng kinuhang larawan, at itago ang pagtatasa bilang isang nakastrukturang talaan para sa susunod na pagsusuri.',
  about_section_fieldwork_title: 'Kung paano nito sinusuportahan ang gawaing pang-bukid',
  about_section_fieldwork_body:
    'Ang FAWCheck ay dinisenyo para sa mabilis na mga pagtatasa sa bukid. Maaaring makuha ng mga gumagamit ang mga obserbasyon sa lugar at mag-save ng mga nakastrukturang talaan para sa susunod na pagsusuri.',
  about_section_collab_title: 'Pakikipagtulungan',
  about_section_collab_body:
    'Ang proyektong ito ay binubuo sa pakikipagtulungan ng UPLB, Institute of Plant Breeding, at UPLB Institute of Computer Science para suportahan ang mas mabilis at mas maaasahang marka ng pinsala ng mais.',
  about_partners_heading: 'Mga katuwang ng proyekto',
  about_partners_desc:
    'Ipinapakita ng kasalukuyang build ang mga nakikipagtulungang institusyon na sumusuporta sa proyekto at sa paggamit nito sa bukid.',
  about_partner_uplb_description:
    'University of the Philippines Los Banos, isa sa mga akademikong kasosyo ng proyekto.',
  about_partner_ipb_description:
    'Ang Institute of Plant Breeding - Entomology Laboratory, ang pangunahing kasosyo para sa paggamit ng FAWCheck sa bukid.',
  about_partner_ics_description:
    'Ang UPLB Institute of Computer Science, nakikipagtulungan sa digital na sistema at workflow ng application.',
  about_capabilities_heading: 'Mga pangunahing kakayahan sa build na ito',
  about_capability_scoring: 'Guided na pagmamarka ng pinsala ng dahon batay sa gabay sa field rating',
  about_capability_records:
    'Imbakan ng talaan ng pagtatasa na may paghahanap, pag-filter, at pag-export ng CSV',
  about_capability_admin: 'Workflow ng pag-apruba ng admin para sa mga bagong kahilingang mag-sign up',

  // PWA install prompt
  pwa_installed_heading: 'I-install ang FAWCheck',
  pwa_installed_desc:
    'Naka-install na ang FAWCheck sa device na ito. Buksan ito mula sa home screen o app list tuwing kailangan mo ito sa bukid.',
  pwa_prompt_heading: 'I-install ang FAWCheck',
  pwa_prompt_desc:
    'I-save ang FAWCheck sa device na ito para mas madaling ilunsad sa panahon ng mga pagbisita sa bukid at paulit-ulit na mga pagtatasa.',
  pwa_prompt_btn: 'I-install ang App',
  pwa_prompt_btn_installing: 'Binubuksan ang prompt ng pag-install...',
  pwa_ios_heading: 'Idagdag ang FAWCheck sa Home Screen',
  pwa_ios_desc1:
    'Ang pag-install sa iPhone at iPad ay ginagawa sa pamamagitan ng browser share menu sa halip na isang hiwalay na pop-up prompt.',
  pwa_ios_desc2_pre: 'I-tap ang ',
  pwa_ios_desc2_action: 'Add to Home Screen',
  pwa_ios_desc2_post: ' para mapanatili ang FAWCheck ng isang tap lang sa bukid.',
  pwa_android_heading: 'I-install ang FAWCheck',
  pwa_android_desc1: 'Hindi pa nagpapakita ng direktang prompt ng pag-install ang browser na ito.',
  pwa_android_desc2_pre: 'Buksan ang browser menu at piliin ang ',
  pwa_android_desc2_action1: 'Install app',
  pwa_android_desc2_mid: '. Kung ang browser ay nag-aalok lamang ng ',
  pwa_android_desc2_action2: 'Add to Home screen',
  pwa_android_desc2_post:
    ', ang opsyong iyon ay mag-pi-pin pa rin ng FAWCheck bilang launcher ng app.',
  pwa_other_desc:
    'Hindi nagpapakita ng sinusuportahang flow ng pag-install ang browser na ito sa ngayon. Kung kailangan mo ng mobile install prompt, buksan ang FAWCheck sa kasalukuyang Chromium-based browser sa Android o gamitin ang Add to Home Screen sa iPhone o iPad.',
  pwa_generic_desc:
    'Hindi nagpapakita ng install prompt ang browser na ito sa ngayon. Kung sinusuportahan ang pag-install, awtomatikong ilalabas ng browser ang opsyon kapag naging available na ito.',

  // Photo validation notice
  photo_validating: 'Sinusuri ang larawan para sa mga pangunahing isyu sa kalidad at nilalaman...',
  photo_warning_heading: 'Babala sa larawan',

  // Photo validation warning strings
  validation_unusable_title: 'Maaaring hindi magamit ang larawan',
  validation_unusable_msg_prefix: 'Maaaring mahirap suriin ang larawang ito dahil ',
  validation_unusable_msg_suffix: '. Muling kumuha ng larawang nakatuon ang dahon ng mais at maliwanag.',
  validation_reason_too_small: 'masyadong maliit ang larawan',
  validation_reason_blurry: 'mukhang malabo ito',
  validation_reason_too_dark: 'masyadong madilim ito',
  validation_reason_too_bright: 'masyadong maliwanag ito',
  validation_reason_low_contrast: 'mahirap makita ang mga detalye ng dahon',
  validation_conjunction_and: 'at',
  validation_not_maize_title: 'Maaaring hindi nagpapakita ng mais ang larawan',
  validation_not_maize_label_pre: 'Mukhang mas katulad ng ',
  validation_not_maize_plant_post:
    ' ang larawang ito kaysa mais. Muling kumuha ng larawang nakasentro ang mga dahon ng mais sa frame.',
  validation_not_maize_nonplant_post:
    ' ang larawang ito kaysa halaman ng mais. Muling kumuha ng larawang nakasentro ang mga dahon ng mais sa frame.',
  validation_not_maize_no_vegetation:
    'Hindi malinaw na mukhang halaman ng mais ang larawang ito. Muling kumuha ng larawang puno ng mga dahon ng mais ang frame.',
};

export default tl;
