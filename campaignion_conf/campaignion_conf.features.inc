<?php
/**
 * @file
 * campaignion_conf.features.inc
 */

/**
 * Implements hook_ctools_plugin_api().
 */
function campaignion_conf_ctools_plugin_api() {
  list($module, $api) = func_get_args();
  if ($module == "file_entity" && $api == "file_default_displays") {
    return array("version" => "1");
  }
  list($module, $api) = func_get_args();
  if ($module == "strongarm" && $api == "strongarm") {
    return array("version" => "1");
  }
}