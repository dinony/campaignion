<?php

namespace Drupal\campaignion_newsletters_mailchimp_interests;

class FormBuilderElement extends \FormBuilderWebformElement {

  /**
   * Avoid empty elements as this doesn't play well with form_builder atm.
   */
  public function render() {
    $element = parent::render();
    if (empty($element['#options'])) {
      $element['#options'] = ['<none>' => t('- No group -')];
      $element['#disabled'] = TRUE;
      unset($element['#access']);
    }
    return $element;
  }

}
