import $ from '../../../shared/dom7.js';
import { getSupport } from '../../../shared/get-support.js';
/** @jsx $jsx */
import $jsx from '../../../shared/$jsx.js';

export default {
  render() {
    return (
      <div class="color-picker-module color-picker-module-sb-spectrum">
        <div class="color-picker-sb-spectrum" style="background-color: hsl(0, 100%, 50%)">
          <div class="color-picker-sb-spectrum-handle"></div>
        </div>
      </div>
    );
  },
  init(self) {
    const { app } = self;

    let isTouched;
    let isMoved;
    let touchStartX;
    let touchStartY;
    let touchCurrentX;
    let touchCurrentY;

    let specterRect;
    let specterIsTouched;
    let specterHandleIsTouched;

    const { $el } = self;

    function setSBFromSpecterCoords(x, y) {
      let s = (x - specterRect.left) / specterRect.width;
      let b = (y - specterRect.top) / specterRect.height;
      s = Math.max(0, Math.min(1, s));
      b = 1 - Math.max(0, Math.min(1, b));

      self.setValue({ hsb: [self.value.hue, s, b] });
    }

    function handleTouchStart(e) {
      if (isMoved || isTouched) return;
      touchStartX = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      touchCurrentX = touchStartX;
      touchStartY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      touchCurrentY = touchStartY;
      const $targetEl = $(e.target);
      specterHandleIsTouched = $targetEl.closest('.color-picker-sb-spectrum-handle').length > 0;
      if (!specterHandleIsTouched) {
        specterIsTouched = $targetEl.closest('.color-picker-sb-spectrum').length > 0;
      }
      if (specterIsTouched) {
        specterRect = $el.find('.color-picker-sb-spectrum')[0].getBoundingClientRect();
        setSBFromSpecterCoords(touchStartX, touchStartY);
      }
      if (specterHandleIsTouched || specterIsTouched) {
        $el
          .find('.color-picker-sb-spectrum-handle')
          .addClass('color-picker-sb-spectrum-handle-pressed');
      }
    }
    function handleTouchMove(e) {
      if (!(specterIsTouched || specterHandleIsTouched)) return;
      touchCurrentX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
      touchCurrentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      e.preventDefault();
      if (!isMoved) {
        // First move
        isMoved = true;
        if (specterHandleIsTouched) {
          specterRect = $el.find('.color-picker-sb-spectrum')[0].getBoundingClientRect();
        }
      }
      if (specterIsTouched || specterHandleIsTouched) {
        setSBFromSpecterCoords(touchCurrentX, touchCurrentY);
      }
    }
    function handleTouchEnd() {
      isMoved = false;
      if (specterIsTouched || specterHandleIsTouched) {
        $el
          .find('.color-picker-sb-spectrum-handle')
          .removeClass('color-picker-sb-spectrum-handle-pressed');
      }
      specterIsTouched = false;
      specterHandleIsTouched = false;
    }

    function handleResize() {
      self.modules['sb-spectrum'].update(self);
    }

    const passiveListener =
      app.touchEvents.start === 'touchstart' && getSupport().passiveListener
        ? { passive: true, capture: false }
        : false;

    self.$el.on(app.touchEvents.start, handleTouchStart, passiveListener);
    app.on('touchmove:active', handleTouchMove);
    app.on('touchend:passive', handleTouchEnd);
    app.on('resize', handleResize);

    self.destroySpectrumEvents = function destroySpectrumEvents() {
      self.$el.off(app.touchEvents.start, handleTouchStart, passiveListener);
      app.off('touchmove:active', handleTouchMove);
      app.off('touchend:passive', handleTouchEnd);
      app.off('resize', handleResize);
    };
  },
  update(self) {
    const { value } = self;

    const { hsl, hsb } = value;

    const specterWidth = self.$el.find('.color-picker-sb-spectrum')[0].offsetWidth;
    const specterHeight = self.$el.find('.color-picker-sb-spectrum')[0].offsetHeight;

    self.$el.find('.color-picker-sb-spectrum').css('background-color', `hsl(${hsl[0]}, 100%, 50%)`);

    self.$el
      .find('.color-picker-sb-spectrum-handle')
      .css('background-color', `hsl(${hsl[0]}, ${hsl[1] * 100}%, ${hsl[2] * 100}%)`)
      .transform(`translate(${specterWidth * hsb[1]}px, ${specterHeight * (1 - hsb[2])}px)`);
  },
  destroy(self) {
    if (self.destroySpectrumEvents) self.destroySpectrumEvents();
    delete self.destroySpectrumEvents;
  },
};
