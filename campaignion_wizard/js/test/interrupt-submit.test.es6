describe('interrupt-submit.js', function () {
  it('registers a behavior', function () {
    expect(Drupal.behaviors.hasOwnProperty('wizardInterruptSubmit')).toBe(true)
  })

  it('provides an attach method', function () {
    expect($.isFunction(Drupal.behaviors.wizardInterruptSubmit.attach)).toBe(true)
  })

  it('provides a forceSubmit method', function () {
    expect($.isFunction(Drupal.behaviors.wizardInterruptSubmit.forceSubmit)).toBe(true)
  })
})

describe('Wizard form without apps', function () {
  beforeEach(function () {
    fixture.load('/fixtures/interrupt-submit-no-apps')
    this.form = document.getElementById('no-apps')
    Drupal.behaviors.wizardInterruptSubmit.attach(fixture.el)
  })

  afterEach(function () {
    fixture.cleanup()
  })

  it('doesn’t cancel the submit event', function (done) {
    $(this.form).on('submit', function (e) {
      expect(e.originalEvent.defaultPrevented).toBe(false)
      // Don’t reload the page.
      e.preventDefault()
      done()
    })
    testHelpers.click('#edit-next')
  })
})

describe('Wizard form with apps', function () {
  beforeEach(function () {
    fixture.load('/fixtures/interrupt-submit-has-apps')
    this.form = document.getElementById('has-apps')
    spyOn(Drupal.behaviors.wizardInterruptSubmit, 'forceSubmit')
    Drupal.behaviors.wizardInterruptSubmit.attach(fixture.el)
  })

  afterEach(function () {
    fixture.cleanup()
  })

  it('cancels the submit event', function (done) {
    $(this.form).on('submit', function (e) {
      expect(e.originalEvent.defaultPrevented).toBe(true)
      done()
    })
    testHelpers.click('#edit-next')
  })

  it('adds a clicked attribute to the clicked submit button', function (done) {
    $('#edit-next', this.form).on('click', function () {
      expect($(this)).toHaveAttr('clicked', 'true')
      expect($('input[type=submit]').not(this)).not.toHaveAttr('clicked')
    })
    $(this.form).on('submit', function () {
      done()
    })
    testHelpers.click('#edit-next')
  })

  it('fires request-submit-page on each app', function (done) {
    var fired = []
    $('[data-interrupt-submit]', this.form).on('request-submit-page', function (e) {
      // We need a native event here, not $.trigger().
      expect(e.originalEvent instanceof Event).toBe(true)
      fired.push($(this).attr('id'))
    })
    testHelpers.click('#edit-next')
    setTimeout(() => {
      expect(fired.length).toBe(3)
      for (var i = 1; i <= 3; i++) {
        expect(fired).toContain('app-' + i)
      }
      done()
    }, 0)
  })

  it('fires request-leave-page if the back button was hit', function (done) {
    var fired = []
    $('[data-interrupt-submit]', this.form).on('request-leave-page', function (e) {
      // We need a native event here, not $.trigger().
      expect(e.originalEvent instanceof Event).toBe(true)
      fired.push($(this).attr('id'))
    })
    testHelpers.click('#edit-previous')
    setTimeout(() => {
      expect(fired.length).toBe(3)
      for (var i = 1; i <= 3; i++) {
        expect(fired).toContain('app-' + i)
      }
      done()
    }, 0)
  })

  it('sets the apps’ data-interrupt-submit attributes to "waiting"', function (done) {
    $(this.form).on('submit', () => {
      expect($('#app-1', this.form)).toHaveAttr('data-interrupt-submit', 'waiting')
      expect($('#app-2', this.form)).toHaveAttr('data-interrupt-submit', 'waiting')
      expect($('#app-3', this.form)).toHaveAttr('data-interrupt-submit', 'waiting')
      done()
    })
    testHelpers.click('#edit-next')
  })

  it('calls forceSubmit after all apps responded', function (done) {
    const $apps = $('[data-interrupt-submit]', this.form)
    testHelpers.click('#edit-next')
    // Wait for submit handler to register resume-leave-page handler.
    setTimeout(() => {
      $apps.each(function () {
        $(this).trigger('resume-leave-page')
        // Wait for resume-leave-page handler to set attribute.
        setTimeout(() => {
          expect($(this).attr('data-interrupt-submit')).toBe('ready')
        }, 0)
      })
    }, 0)
    setTimeout(() => {
      expect(Drupal.behaviors.wizardInterruptSubmit.forceSubmit).toHaveBeenCalled()
      expect(Drupal.behaviors.wizardInterruptSubmit.forceSubmit.calls.count()).toEqual(1)
      done()
    }, 0)
  })

  it('doesn’t call forceSubmit if one app responds with cancel-leave-page', function (done) {
    testHelpers.click('#edit-next')
    setTimeout(() => {
      $('#app-2').trigger('resume-leave-page')
      setTimeout(() => {
        $('#app-1').trigger('cancel-leave-page')
      }, 100)
    }, 0)
    setTimeout(() => {
      expect($('#app-1').attr('data-interrupt-submit')).toBe('ready')
      expect($('#app-2').attr('data-interrupt-submit')).toBe('ready')
      expect($('#app-3').attr('data-interrupt-submit')).toBe('ready')
      expect(Drupal.behaviors.wizardInterruptSubmit.forceSubmit).not.toHaveBeenCalled()
      done()
    }, 200)
  })
})
