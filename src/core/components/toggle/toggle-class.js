import $ from '../../shared/dom7.js';
import { extend, now, nextTick, deleteProps } from '../../shared/utils.js';
import Framework7Class from '../../shared/class.js';
import { getSupport } from '../../shared/get-support.js';

class Toggle extends Framework7Class {
  constructor(app, params = {}) {
    super(params, [app]);
    const toggle = this;
    const support = getSupport();

    const defaults = {};

    // Extend defaults with modules params
    toggle.useModulesParams(defaults);

    toggle.params = extend(defaults, params);

    const el = toggle.params.el;
    if (!el) return toggle;

    const $el = $(el);
    if ($el.length === 0) return toggle;

    if ($el[0].f7Toggle) return $el[0].f7Toggle;

    const $inputEl = $el.children('input[type="checkbox"]');

    extend(toggle, {
      app,
      $el,
      el: $el[0],
      $inputEl,
      inputEl: $inputEl[0],
      disabled:
        $el.hasClass('disabled') ||
        $inputEl.hasClass('disabled') ||
        $inputEl.attr('disabled') ||
        $inputEl[0].disabled,
    });

    Object.defineProperty(toggle, 'checked', {
      enumerable: true,
      configurable: true,
      set(checked) {
        if (!toggle || typeof toggle.$inputEl === 'undefined') return;
        if (toggle.checked === checked) return;
        $inputEl[0].checked = checked;
        toggle.$inputEl.trigger('change');
      },
      get() {
        return $inputEl[0].checked;
      },
    });

    $el[0].f7Toggle = toggle;

    let isTouched;
    const touchesStart = {};
    let isScrolling;
    let touchesDiff;
    let toggleWidth;
    let touchStartTime;
    let touchStartChecked;
    function handleTouchStart(e) {
      if (isTouched || toggle.disabled) return;
      touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      touchesDiff = 0;

      isTouched = true;
      isScrolling = undefined;
      touchStartTime = now();
      touchStartChecked = toggle.checked;

      toggleWidth = $el[0].offsetWidth;
      nextTick(() => {
        if (isTouched) {
          $el.addClass('toggle-active-state');
        }
      });
    }
    function handleTouchMove(e) {
      if (!isTouched || toggle.disabled) return;
      const pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
      const pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      const inverter = app.rtl ? -1 : 1;

      if (typeof isScrolling === 'undefined') {
        isScrolling = !!(
          isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x)
        );
      }
      if (isScrolling) {
        isTouched = false;
        return;
      }
      e.preventDefault();

      touchesDiff = pageX - touchesStart.x;

      let changed;
      if (
        touchesDiff * inverter < 0 &&
        Math.abs(touchesDiff) > toggleWidth / 3 &&
        touchStartChecked
      ) {
        changed = true;
      }
      if (
        touchesDiff * inverter > 0 &&
        Math.abs(touchesDiff) > toggleWidth / 3 &&
        !touchStartChecked
      ) {
        changed = true;
      }
      if (changed) {
        touchesStart.x = pageX;
        toggle.checked = !touchStartChecked;
        touchStartChecked = !touchStartChecked;
      }
    }
    function handleTouchEnd() {
      if (!isTouched || toggle.disabled) {
        if (isScrolling) $el.removeClass('toggle-active-state');
        isTouched = false;
        return;
      }
      const inverter = app.rtl ? -1 : 1;
      isTouched = false;

      $el.removeClass('toggle-active-state');

      let changed;
      if (now() - touchStartTime < 300) {
        if (touchesDiff * inverter < 0 && touchStartChecked) {
          changed = true;
        }
        if (touchesDiff * inverter > 0 && !touchStartChecked) {
          changed = true;
        }
        if (changed) {
          toggle.checked = !touchStartChecked;
        }
      }
    }
    function handleInputChange() {
      toggle.$el.trigger('toggle:change');
      toggle.emit('local::change toggleChange', toggle);
    }
    toggle.attachEvents = function attachEvents() {
      const passive = support.passiveListener ? { passive: true } : false;
      $el.on(app.touchEvents.start, handleTouchStart, passive);
      app.on('touchmove', handleTouchMove);
      app.on('touchend:passive', handleTouchEnd);
      toggle.$inputEl.on('change', handleInputChange);
    };
    toggle.detachEvents = function detachEvents() {
      const passive = support.passiveListener ? { passive: true } : false;
      $el.off(app.touchEvents.start, handleTouchStart, passive);
      app.off('touchmove', handleTouchMove);
      app.off('touchend:passive', handleTouchEnd);
      toggle.$inputEl.off('change', handleInputChange);
    };

    // Install Modules
    toggle.useModules();

    // Init
    toggle.init();
  }

  toggle() {
    const toggle = this;
    toggle.checked = !toggle.checked;
  }

  init() {
    const toggle = this;
    toggle.attachEvents();
  }

  destroy() {
    let toggle = this;
    toggle.$el.trigger('toggle:beforedestroy');
    toggle.emit('local::beforeDestroy toggleBeforeDestroy', toggle);
    delete toggle.$el[0].f7Toggle;
    toggle.detachEvents();
    deleteProps(toggle);
    toggle = null;
  }
}

export default Toggle;
