<?php

namespace Drupal\campaignion_email_to_target\Wizard;

use \Drupal\campaignion\Forms\EntityFieldForm;
use \Drupal\campaignion_email_to_target\MessageEndpoint;
use \Drupal\campaignion_email_to_target\Api\Client;


class MessageStep extends \Drupal\campaignion_wizard\WizardStep {
  protected $step  = 'message';
  protected $title = 'Message';

  public function stepForm($form, &$form_state) {
    $node = $this->wizard->node;

    $form = parent::stepForm($form, $form_state);
    $form['messages'] = [
      '#type' => 'container',
      '#title' => t('Message that will be sent to target(s)'),
      '#id' => drupal_html_id('email-to-target-messages-widget'),
      '#attributes' => [
        'class' => ['email-to-target-messages-widget', 'e2tmw'],
        'data-interrupt-submit' => '',
      ],
      'app-tag' => [
        '#markup' => '<app></app>'
      ],
    ];

    $info = token_get_info();
    $tokens = [];
    foreach(['email-to-target', 'webform-tokens', 'submission'] as $type) {
      if (!isset($info['types'][$type])) {
        continue;
      }
      $type_info = $info['types'][$type];
      $group = [
        'title' => $type_info['name'],
        'description' => $type_info['description'],
        'tokens' => [],
      ];
      foreach ($info['tokens'][$type] as $key => $token) {
        $group['tokens'][] = [
          'token' => "[$type:$key]",
          'title' => $token['name'],
          'description' => $token['description'],
        ];
      }
      $tokens[] = $group;
    }
    $settings['tokens'] = $tokens;

    $endpoint = new MessageEndpoint($node);
    $settings += $endpoint->get();
    $settings['targetAttributes'] = [];
    $dataset = $node->action->dataset();
    foreach ($dataset->attributes as $attribute) {
      $settings['targetAttributes'][] = [
        'name' => $attribute->key,
        'label' => $attribute->title,
        'description' => $attribute->description,
      ];
    }
    $settings['hardValidation'] = !$node->status;
    $settings['endpoints']['messages'] = url("node/{$node->nid}/email-to-target-messages");

    $client = Client::fromConfig();
    $token = $client->getAccessToken();
    $settings['endpoints']['e2t-api'] = [
      'url' => $client->getEndpoint(),
      'token' => $token,
      'dataset' => $dataset->key,
    ];

    $settings = ['campaignion_email_to_target' => $settings];
    $form['#attached']['js'][] = ['data' => $settings, 'type' => 'setting'];
    $form['#attached']['js'][] = ['data' => drupal_get_path('module', 'campaignion_email_to_target') . '/js/messages_widget.js', 'scope' => 'footer'];
    $form['#attached']['js'][] = ['data' => drupal_get_path('module', 'campaignion_wizard') . '/js/interrupt-submit.js', 'scope' => 'footer'];
    $form['#attached']['css'][] = ['data' => drupal_get_path('module', 'campaignion_email_to_target') . '/css/messages_widget.min.css', 'group' => 'CSS_DEFAULT', 'preprocess' => FALSE];
    return $form;
  }

  public function checkDependencies() {
    return isset($this->wizard->node->nid);
  }
}
