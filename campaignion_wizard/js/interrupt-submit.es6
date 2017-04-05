// Wait for a vue app’s XHR requests finishing before submitting the form.
//
// The app’s container has to have a data-interrupt-submit attribute. When the
// form is submitted, a request-submit-page event is fired on an app’s container.
// If the Back button was clicked, a request-leave-page event is fired instead.
// The app has to respond with a resume-leave-page event to say "saved everything,
// submitting is fine for me" or a cancel-leave-page event ("don’t submit for now,
// I have to interact with the user").
//
// This script also listens to beforeunload and warns if there is a
// data-has-unsaved-changes attribute somewhere on the page.

(function ($) {

  const dispatch = function (element, type) {
    var e = document.createEvent('HTMLEvents')
    e.initEvent(type, true, true)
    element.dispatchEvent(e)
  }

  Drupal.behaviors.wizardInterruptSubmit = {

    attach(context) {
      const $appsInContext = $('[data-interrupt-submit]', context)
      const $forms = $appsInContext.closest('form')

      if (!$forms.length) return

      $forms.find('input[type=submit]')
        .off('click.interrupt-submit')
        .on('click.interrupt-submit', function () {
          // Attach a 'clicked' attribute to the specific button
          $('input[type=submit]', $(this).parents('form')).removeAttr('clicked')
          $(this).attr('clicked', 'true')
        })

      $forms.off('submit.interrupt-submit')
        .on('submit.interrupt-submit', function (submitEvent) {
          const $apps = $('[data-interrupt-submit]')
          const $submitButtons = $('input[type=submit]', this)
          const leavingPageWithoutSaving = ($submitButtons.filter('[clicked=true]').val().toLowerCase() === 'back')

          $submitButtons.prop('disabled', true)
          submitEvent.preventDefault()

          $apps
            .attr('data-interrupt-submit', 'waiting')
            .one('resume-leave-page.interrupt-submit cancel-leave-page.interrupt-submit', function (appEvent) {
              $(this).attr('data-interrupt-submit', 'ready')
              if (appEvent.type === 'resume-leave-page') {
                // App says: I don’t mind, you can leave the page.
                if (!$('[data-interrupt-submit=waiting]').length) {
                  Drupal.behaviors.wizardInterruptSubmit.forceSubmit(submitEvent.originalEvent.target)
                }
              } else {
                // App responds: Don’t leave tha page! I still have to interact with the user.
                $submitButtons.prop('disabled', false)
                $apps.off('.interrupt-submit')
                $apps.attr('data-interrupt-submit', 'ready')
              }
            })
            .each(function () {
              dispatch(this, leavingPageWithoutSaving ? 'request-leave-page' : 'request-submit-page')
            })
        })

      $(window).off('beforeunload.interrupt-submit')
        .on('beforeunload.interrupt-submit', (e) => {
          if ($('[data-has-unsaved-changes]').length) {
            const confirmationMessage = 'Careful! You have unsaved changes!'
            e.returnValue = confirmationMessage // Gecko, Trident, Chrome 34+
            return confirmationMessage          // Gecko, WebKit, Chrome <34
          }
        })
    },

    forceSubmit(form) {
      const $clickedButton = $('input[type=submit][clicked=true]', form)
      $(window).off('beforeunload.interrupt-submit')
      $(form).off('submit.interrupt-submit')
      $clickedButton.prop('disabled', false).off('click.interrupt-submit')
      // let firefox catch up with rendering the button
      setTimeout(() => {
        $clickedButton.click()
      }, 0)
    }
  }

})(jQuery)
