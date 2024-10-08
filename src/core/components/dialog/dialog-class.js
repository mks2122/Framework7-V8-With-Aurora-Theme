import { getDocument } from 'ssr-window';
import $ from '../../shared/dom7.js';
import { extend } from '../../shared/utils.js';
import { getDevice } from '../../shared/get-device.js';
import Modal from '../modal/modal-class.js';
/** @jsx $jsx */
import $jsx from '../../shared/$jsx.js';

class Dialog extends Modal {
  constructor(app, params) {
    const extendedParams = extend(
      {
        title: app.params.dialog.title,
        text: undefined,
        content: '',
        buttons: [],
        verticalButtons: false,
        onClick: undefined,
        cssClass: undefined,
        destroyOnClose: false,
        on: {},
      },
      params,
    );
    if (typeof extendedParams.closeByBackdropClick === 'undefined') {
      extendedParams.closeByBackdropClick = app.params.dialog.closeByBackdropClick;
    }
    if (typeof extendedParams.backdrop === 'undefined') {
      extendedParams.backdrop = app.params.dialog.backdrop;
    }

    // Extends with open/close Modal methods;
    super(app, extendedParams);

    const dialog = this;

    const device = getDevice();
    const document = getDocument();

    const { title, text, content, buttons, verticalButtons, cssClass, backdrop } = extendedParams;

    dialog.params = extendedParams;

    // Find Element
    let $el;
    if (!dialog.params.el) {
      const dialogClasses = ['dialog'];
      if (buttons.length === 0) dialogClasses.push('dialog-no-buttons');
      if (buttons.length > 0) dialogClasses.push(`dialog-buttons-${buttons.length}`);
      if (verticalButtons) dialogClasses.push('dialog-buttons-vertical');
      if (cssClass) dialogClasses.push(cssClass);

      let buttonsHTML = '';
      if (buttons.length > 0) {
        buttonsHTML = (
          <div class="dialog-buttons">
            {buttons.map((button) => (
              <span
                class={`dialog-button${button.strong ? ' dialog-button-strong' : ''}${
                  button.color ? ` color-${button.color}` : ''
                }${button.cssClass ? ` ${button.cssClass}` : ''}`}
              >
                {button.text}
              </span>
            ))}
          </div>
        );
      }

      const dialogHtml = (
        <div class={dialogClasses.join(' ')}>
          <div class="dialog-inner">
            {title && <div class="dialog-title">{title}</div>}
            {text && <div class="dialog-text">{text}</div>}
            {content}
          </div>
          {buttonsHTML}
        </div>
      );
      $el = $(dialogHtml);
    } else {
      $el = $(dialog.params.el);
    }

    if ($el && $el.length > 0 && $el[0].f7Modal) {
      return $el[0].f7Modal;
    }

    if ($el.length === 0) {
      return dialog.destroy();
    }

    let $backdropEl;
    if (backdrop) {
      $backdropEl = app.$el.children('.dialog-backdrop');
      if ($backdropEl.length === 0) {
        $backdropEl = $('<div class="dialog-backdrop"></div>');
        app.$el.append($backdropEl);
      }
    }

    // Assign events
    function buttonOnClick(e) {
      const buttonEl = this;
      const index = $(buttonEl).index();
      const button = buttons[index];
      if (button.onClick) button.onClick(dialog, e);
      if (dialog.params.onClick) dialog.params.onClick(dialog, index);
      if (button.close !== false) dialog.close();
    }
    let addKeyboardHander;
    function onKeyDown(e) {
      const keyCode = e.keyCode;
      buttons.forEach((button, index) => {
        if (button.keyCodes && button.keyCodes.indexOf(keyCode) >= 0) {
          if (document.activeElement) document.activeElement.blur();
          if (button.onClick) button.onClick(dialog, e);
          if (dialog.params.onClick) dialog.params.onClick(dialog, index);
          if (button.close !== false) dialog.close();
        }
      });
    }
    if (buttons && buttons.length > 0) {
      dialog.on('open', () => {
        $el.find('.dialog-button').each((buttonEl, index) => {
          const button = buttons[index];
          if (button.keyCodes) addKeyboardHander = true;
          $(buttonEl).on('click', buttonOnClick);
        });
        if (
          addKeyboardHander &&
          !device.ios &&
          !device.android &&
          !device.cordova &&
          !device.capacitor
        ) {
          $(document).on('keydown', onKeyDown);
        }
      });
      dialog.on('close', () => {
        $el.find('.dialog-button').each((buttonEl) => {
          $(buttonEl).off('click', buttonOnClick);
        });
        if (
          addKeyboardHander &&
          !device.ios &&
          !device.android &&
          !device.cordova &&
          !device.capacitor
        ) {
          $(document).off('keydown', onKeyDown);
        }
        addKeyboardHander = false;
      });
    }
    extend(dialog, {
      app,
      $el,
      el: $el[0],
      $backdropEl,
      backdropEl: $backdropEl && $backdropEl[0],
      type: 'dialog',
      setProgress(progress, duration) {
        app.progressbar.set($el.find('.progressbar'), progress, duration);
        return dialog;
      },
      setText(newText) {
        let $textEl = $el.find('.dialog-text');
        if ($textEl.length === 0) {
          $textEl = $('<div class="dialog-text"></div>');
          if (typeof title !== 'undefined') {
            $textEl.insertAfter($el.find('.dialog-title'));
          } else {
            $el.find('.dialog-inner').prepend($textEl);
          }
        }
        $textEl.html(newText);
        dialog.params.text = newText;
        return dialog;
      },
      setTitle(newTitle) {
        let $titleEl = $el.find('.dialog-title');
        if ($titleEl.length === 0) {
          $titleEl = $('<div class="dialog-title"></div>');
          $el.find('.dialog-inner').prepend($titleEl);
        }
        $titleEl.html(newTitle);
        dialog.params.title = newTitle;
        return dialog;
      },
    });

    function handleClick(e) {
      const target = e.target;
      const $target = $(target);
      if ($target.closest(dialog.el).length === 0) {
        if (
          dialog.params.closeByBackdropClick &&
          dialog.backdropEl &&
          dialog.backdropEl === target
        ) {
          dialog.close();
        }
      }
    }

    dialog.on('opened', () => {
      if (dialog.params.closeByBackdropClick) {
        app.on('click', handleClick);
      }
    });
    dialog.on('close', () => {
      if (dialog.params.closeByBackdropClick) {
        app.off('click', handleClick);
      }
    });

    $el[0].f7Modal = dialog;

    if (dialog.params.destroyOnClose) {
      dialog.once('closed', () => {
        setTimeout(() => {
          dialog.destroy();
        }, 0);
      });
    }

    return dialog;
  }
}
export default Dialog;
