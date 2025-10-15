<?php
/**
 * Plugin Name: BitSky Veto Popup
 * Description: Czarny popup.
 * Version: 1.0.0
 * Author: Daniel Haczyk BitSky.pl
 * Licencja: The Unlicense
 * Licencja URI: https://unlicense.org/
 */

if (!defined('ABSPATH')) exit;

define('BS_VETO_POPUP_FILE', __FILE__);
define('BS_VETO_POPUP_DIR', plugin_dir_path(__FILE__));
define('BS_VETO_POPUP_URL', plugin_dir_url(__FILE__));
define('BS_VETO_POPUP_CONF', BS_VETO_POPUP_DIR . 'config.json');

function bsvp_default_config() {
  return array(
    'enabled' => false, // włącz/wyłącz wyświetlanie na froncie
    'TEXT_HTML' => "Apel do Prezydenta<br/>Rzeczypospolitej Polskiej<br/>o zawetowanie Ustawy o<br/>rynku kryptoaktywów",
    'DETAILS_URL' => 'https://bitcoin.org.pl/apel-do-prezydenta-rzeczypospolitej-polskiej/',
    'OPEN_DETAILS_IN_NEW_WINDOW' => true,
    'SHOW_FREQUENCY' => 'minutes', // 'always' | 'minutes' | 'never'
    'COOKIE_MINUTES' => 1440,
    'COOKIE_NAME' => 'veto_black_popup_shown',
    'COOKIE_PATH' => '/',
    'STOP_AFTER_DATE' => array(
      'ENABLED' => true,
      'STOP_AT_ISO' => '2025-12-31T23:59:59+01:00',
    ),
    'FONT_FAMILY' => 'Arial, Helvetica, sans-serif',
    'FONT_WEIGHT' => 800,
    'FONT_SIZE_DESKTOP' => '42px',
    'FONT_SIZE_MOBILE' => '28px',
    'POPUP_WIDTH_DESKTOP' => 700,
    'POPUP_HEIGHT_DESKTOP' => 'auto',
    'MIN_WIDTH' => 320,
    'MIN_HEIGHT' => 220,
    'MOBILE_BREAKPOINT' => 768,
    'OVERLAY_OPACITY' => 0.55,
    'Z_INDEX' => 2147483647,
    'PADDING_DESKTOP' => 40,
    'PADDING_MOBILE' => 20,
    'BORDER_RADIUS' => 0,
    'LABEL_DETAILS' => 'Szczegóły',
    'LABEL_CLOSE' => 'Zamknij',
    'LABEL_X' => '×',
    'CLICK_OUTSIDE_TO_CLOSE' => true,
  );
}

function bsvp_read_config() {
  $defaults = bsvp_default_config();
  if (file_exists(BS_VETO_POPUP_CONF)) {
    $json = file_get_contents(BS_VETO_POPUP_CONF);
    $data = json_decode($json, true);
    if (is_array($data)) {
      return array_replace_recursive($defaults, $data);
    }
  }
  return $defaults;
}

function bsvp_write_config($cfg) {
  // Bez bazy: zapis do pliku wtyczki.
  $json = wp_json_encode($cfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
  if (!is_writable(dirname(BS_VETO_POPUP_CONF))) {
    return new WP_Error('not_writable', 'Katalog wtyczki nie jest zapisywalny.');
  }
  $ok = file_put_contents(BS_VETO_POPUP_CONF, $json);
  if ($ok === false) {
    return new WP_Error('write_failed', 'Nie udało się zapisać pliku config.json.');
  }
  return true;
}

/* ====== PANEL ADMINA ====== */
add_action('admin_menu', function () {
  add_options_page(
    'BitSky Veto Popup',
    'BitSky Veto Popup',
    'manage_options',
    'bitsky-veto-popup',
    'bsvp_render_settings_page'
  );
});

function bsvp_render_settings_page() {
  if (!current_user_can('manage_options')) return;

  $cfg = bsvp_read_config();
  $notice = '';

  if ($_SERVER['REQUEST_METHOD'] === 'POST' && check_admin_referer('bsvp_save')) {
    $cfg['enabled'] = isset($_POST['enabled']);
    $cfg['TEXT_HTML'] = wp_kses_post(stripslashes($_POST['TEXT_HTML'] ?? $cfg['TEXT_HTML']));
    $cfg['DETAILS_URL'] = esc_url_raw($_POST['DETAILS_URL'] ?? $cfg['DETAILS_URL']);
    $cfg['OPEN_DETAILS_IN_NEW_WINDOW'] = isset($_POST['OPEN_DETAILS_IN_NEW_WINDOW']);

    $sf = $_POST['SHOW_FREQUENCY'] ?? 'minutes';
    $cfg['SHOW_FREQUENCY'] = in_array($sf, array('always','minutes','never'), true) ? $sf : 'minutes';
    $cfg['COOKIE_MINUTES'] = max(1, intval($_POST['COOKIE_MINUTES'] ?? 1440));
    $cfg['COOKIE_NAME'] = sanitize_text_field($_POST['COOKIE_NAME'] ?? 'veto_black_popup_shown');
    $cfg['COOKIE_PATH'] = sanitize_text_field($_POST['COOKIE_PATH'] ?? '/');

    $cfg['STOP_AFTER_DATE']['ENABLED'] = isset($_POST['STOP_AFTER_DATE_ENABLED']);
    $cfg['STOP_AFTER_DATE']['STOP_AT_ISO'] = sanitize_text_field($_POST['STOP_AFTER_DATE_STOP_AT_ISO'] ?? $cfg['STOP_AFTER_DATE']['STOP_AT_ISO']);

    $cfg['FONT_FAMILY'] = sanitize_text_field($_POST['FONT_FAMILY'] ?? $cfg['FONT_FAMILY']);
    $cfg['FONT_WEIGHT'] = intval($_POST['FONT_WEIGHT'] ?? 800);
    $cfg['FONT_SIZE_DESKTOP'] = sanitize_text_field($_POST['FONT_SIZE_DESKTOP'] ?? '42px');
    $cfg['FONT_SIZE_MOBILE'] = sanitize_text_field($_POST['FONT_SIZE_MOBILE'] ?? '28px');

    $cfg['POPUP_WIDTH_DESKTOP'] = is_numeric($_POST['POPUP_WIDTH_DESKTOP'] ?? '') ? intval($_POST['POPUP_WIDTH_DESKTOP']) : sanitize_text_field($_POST['POPUP_WIDTH_DESKTOP']);
    $cfg['POPUP_HEIGHT_DESKTOP'] = is_numeric($_POST['POPUP_HEIGHT_DESKTOP'] ?? '') ? intval($_POST['POPUP_HEIGHT_DESKTOP']) : sanitize_text_field($_POST['POPUP_HEIGHT_DESKTOP']);
    $cfg['MIN_WIDTH'] = intval($_POST['MIN_WIDTH'] ?? 320);
    $cfg['MIN_HEIGHT'] = intval($_POST['MIN_HEIGHT'] ?? 220);

    $cfg['MOBILE_BREAKPOINT'] = intval($_POST['MOBILE_BREAKPOINT'] ?? 768);
    $cfg['OVERLAY_OPACITY'] = floatval($_POST['OVERLAY_OPACITY'] ?? 0.55);
    $cfg['Z_INDEX'] = intval($_POST['Z_INDEX'] ?? 2147483647);

    $cfg['PADDING_DESKTOP'] = intval($_POST['PADDING_DESKTOP'] ?? 40);
    $cfg['PADDING_MOBILE'] = intval($_POST['PADDING_MOBILE'] ?? 20);
    $cfg['BORDER_RADIUS'] = intval($_POST['BORDER_RADIUS'] ?? 0);

    $cfg['LABEL_DETAILS'] = sanitize_text_field($_POST['LABEL_DETAILS'] ?? 'Szczegóły');
    $cfg['LABEL_CLOSE'] = sanitize_text_field($_POST['LABEL_CLOSE'] ?? 'Zamknij');
    $cfg['LABEL_X'] = sanitize_text_field($_POST['LABEL_X'] ?? '×');
    $cfg['CLICK_OUTSIDE_TO_CLOSE'] = isset($_POST['CLICK_OUTSIDE_TO_CLOSE']);

    $res = bsvp_write_config($cfg);
    if (is_wp_error($res)) {
      $notice = '<div class="notice notice-error"><p><strong>Błąd zapisu:</strong> '.esc_html($res->get_error_message()).'</p></div>';
    } else {
      $notice = '<div class="notice notice-success"><p>Ustawienia zapisane do pliku <code>config.json</code>.</p></div>';
    }
  }

  ?>
  <div class="wrap">
    <h1>Veto Popup – ustawienia</h1>
    <?php echo $notice; ?>
    <form method="post">
      <?php wp_nonce_field('bsvp_save'); ?>

      <table class="form-table" role="presentation">
        <tr>
          <th scope="row">Włącz wyświetlanie</th>
          <td><label><input type="checkbox" name="enabled" <?php checked($cfg['enabled']); ?>> Aktywne na froncie</label></td>
        </tr>

        <tr><th scope="row">Treść (HTML)</th>
          <td><textarea name="TEXT_HTML" rows="6" class="large-text code"><?php echo esc_textarea($cfg['TEXT_HTML']); ?></textarea></td>
        </tr>

        <tr><th scope="row">Link „Szczegóły”</th>
          <td>
            <input type="url" name="DETAILS_URL" class="regular-text" value="<?php echo esc_attr($cfg['DETAILS_URL']); ?>">
            <label style="margin-left:12px"><input type="checkbox" name="OPEN_DETAILS_IN_NEW_WINDOW" <?php checked($cfg['OPEN_DETAILS_IN_NEW_WINDOW']); ?>> Otwórz w nowym oknie</label>
          </td>
        </tr>

        <tr><th scope="row">Częstotliwość</th>
          <td>
            <select name="SHOW_FREQUENCY">
              <option value="always" <?php selected($cfg['SHOW_FREQUENCY'],'always'); ?>>Zawsze (bez ciasteczka)</option>
              <option value="minutes" <?php selected($cfg['SHOW_FREQUENCY'],'minutes'); ?>>Po X minutach</option>
              <option value="never" <?php selected($cfg['SHOW_FREQUENCY'],'never'); ?>>Nigdy więcej</option>
            </select>
            <span style="margin-left:12px">Minuty: <input type="number" name="COOKIE_MINUTES" value="<?php echo esc_attr($cfg['COOKIE_MINUTES']); ?>" min="1" step="1" style="width:100px"></span>
            <div style="margin-top:8px">
              Cookie name: <input type="text" name="COOKIE_NAME" value="<?php echo esc_attr($cfg['COOKIE_NAME']); ?>" style="width:220px">
              Cookie path: <input type="text" name="COOKIE_PATH" value="<?php echo esc_attr($cfg['COOKIE_PATH']); ?>" style="width:120px">
            </div>
          </td>
        </tr>

        <tr><th scope="row">Wyłącz po dacie</th>
          <td>
            <label><input type="checkbox" name="STOP_AFTER_DATE_ENABLED" <?php checked($cfg['STOP_AFTER_DATE']['ENABLED']); ?>> Aktywuj</label>
            <input type="text" name="STOP_AFTER_DATE_STOP_AT_ISO" value="<?php echo esc_attr($cfg['STOP_AFTER_DATE']['STOP_AT_ISO']); ?>" class="regular-text" style="margin-left:12px" placeholder="YYYY-MM-DDTHH:MM:SS+TZ">
          </td>
        </tr>

        <tr><th scope="row">Wygląd – czcionka</th>
          <td>
            Family: <input type="text" name="FONT_FAMILY" value="<?php echo esc_attr($cfg['FONT_FAMILY']); ?>" style="width:260px">
            Weight: <input type="number" name="FONT_WEIGHT" value="<?php echo esc_attr($cfg['FONT_WEIGHT']); ?>" min="100" max="900" step="100" style="width:100px; margin-left:12px">
            <div style="margin-top:8px">
              Rozmiar desktop: <input type="text" name="FONT_SIZE_DESKTOP" value="<?php echo esc_attr($cfg['FONT_SIZE_DESKTOP']); ?>" style="width:120px">
              Rozmiar mobile: <input type="text" name="FONT_SIZE_MOBILE" value="<?php echo esc_attr($cfg['FONT_SIZE_MOBILE']); ?>" style="width:120px; margin-left:12px">
            </div>
          </td>
        </tr>

        <tr><th scope="row">Wymiary</th>
          <td>
            Szer. desktop: <input type="text" name="POPUP_WIDTH_DESKTOP" value="<?php echo esc_attr($cfg['POPUP_WIDTH_DESKTOP']); ?>" style="width:120px">
            Wys. desktop: <input type="text" name="POPUP_HEIGHT_DESKTOP" value="<?php echo esc_attr($cfg['POPUP_HEIGHT_DESKTOP']); ?>" style="width:120px; margin-left:12px">
            <div style="margin-top:8px">
              Min width: <input type="number" name="MIN_WIDTH" value="<?php echo esc_attr($cfg['MIN_WIDTH']); ?>" style="width:120px">
              Min height: <input type="number" name="MIN_HEIGHT" value="<?php echo esc_attr($cfg['MIN_HEIGHT']); ?>" style="width:120px; margin-left:12px">
            </div>
          </td>
        </tr>

        <tr><th scope="row">Responsywność / overlay</th>
          <td>
            Breakpoint mobile: <input type="number" name="MOBILE_BREAKPOINT" value="<?php echo esc_attr($cfg['MOBILE_BREAKPOINT']); ?>" style="width:120px">
            Overlay opacity: <input type="number" step="0.01" min="0" max="1" name="OVERLAY_OPACITY" value="<?php echo esc_attr($cfg['OVERLAY_OPACITY']); ?>" style="width:120px; margin-left:12px">
            Z-index: <input type="number" name="Z_INDEX" value="<?php echo esc_attr($cfg['Z_INDEX']); ?>" style="width:160px; margin-left:12px">
          </td>
        </tr>

        <tr><th scope="row">Padding / radius</th>
          <td>
            Padding desktop: <input type="number" name="PADDING_DESKTOP" value="<?php echo esc_attr($cfg['PADDING_DESKTOP']); ?>" style="width:120px">
            Padding mobile: <input type="number" name="PADDING_MOBILE" value="<?php echo esc_attr($cfg['PADDING_MOBILE']); ?>" style="width:120px; margin-left:12px">
            Radius: <input type="number" name="BORDER_RADIUS" value="<?php echo esc_attr($cfg['BORDER_RADIUS']); ?>" style="width:120px; margin-left:12px">
          </td>
        </tr>

        <tr><th scope="row">Etykiety</th>
          <td>
            „Szczegóły”: <input type="text" name="LABEL_DETAILS" value="<?php echo esc_attr($cfg['LABEL_DETAILS']); ?>" style="width:160px">
            „Zamknij”: <input type="text" name="LABEL_CLOSE" value="<?php echo esc_attr($cfg['LABEL_CLOSE']); ?>" style="width:160px; margin-left:12px">
            „X”: <input type="text" name="LABEL_X" value="<?php echo esc_attr($cfg['LABEL_X']); ?>" style="width:80px; margin-left:12px">
            <div style="margin-top:8px">
              <label><input type="checkbox" name="CLICK_OUTSIDE_TO_CLOSE" <?php checked($cfg['CLICK_OUTSIDE_TO_CLOSE']); ?>> Klik w tło zamyka popup</label>
            </div>
          </td>
        </tr>
      </table>

      <?php submit_button('Zapisz ustawienia'); ?>
    </form>
  </div>
  <?php
}

/* ====== FRONT: ładowanie skryptu w stopce ====== */
add_action('wp_enqueue_scripts', function () {
  $cfg = bsvp_read_config();
  if (empty($cfg['enabled'])) return;

  // Opcjonalnie: jeśli stop date włączona i minęła – nie ładujemy.
  if (!empty($cfg['STOP_AFTER_DATE']['ENABLED'])) {
    $stop = strtotime($cfg['STOP_AFTER_DATE']['STOP_AT_ISO']);
    if ($stop && time() > $stop) return;
  }

  wp_enqueue_script(
    'bsvp-popup',
    BS_VETO_POPUP_URL . 'assets/black-veto-popup.js',
    array(),
    '1.0.0',
    true // footer
  );

  // Przekazanie configu do JS (global window.BSVetoPopupConfig)
  wp_add_inline_script(
    'bsvp-popup',
    'window.BSVetoPopupConfig = ' . wp_json_encode($cfg, JSON_UNESCAPED_UNICODE) . ';',
    'before'
  );
});


register_activation_hook(__FILE__, function () {
  if ( ! file_exists(BS_VETO_POPUP_CONF) ) {
    bsvp_write_config( bsvp_default_config() );
  }
});

if ( ! is_writable( dirname(BS_VETO_POPUP_CONF) ) ) {
  echo '<div class="notice notice-warning"><p>Katalog wtyczki nie jest zapisywalny. Zmień uprawnienia, aby zapisywać <code>config.json</code>.</p></div>';
}
