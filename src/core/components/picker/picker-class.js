import { getWindow } from 'ssr-window';
import $ from '../../shared/dom7.js';
import { extend, nextTick, deleteProps } from '../../shared/utils.js';
import Framework7Class from '../../shared/class.js';
import { getDevice } from '../../shared/get-device.js';

import pickerColumn from './picker-column.js';

/** @jsx $jsx */
import $jsx from '../../shared/$jsx.js';

class Picker extends Framework7Class {
  constructor(app, params = {}) {
    super(params, [app]);
    const picker = this;
    const device = getDevice();
    const window = getWindow();
    picker.params = extend({}, app.params.picker, params);

    let $containerEl;
    if (picker.params.containerEl) {
      $containerEl = $(picker.params.containerEl);
      if ($containerEl.length === 0) return picker;
    }

    let $inputEl;
    if (picker.params.inputEl) {
      $inputEl = $(picker.params.inputEl);
    }

    let $scrollToEl = picker.params.scrollToInput ? $inputEl : undefined;
    if (picker.params.scrollToEl) {
      const scrollToEl = $(picker.params.scrollToEl);
      if (scrollToEl.length > 0) {
        $scrollToEl = scrollToEl;
      }
    }

    extend(picker, {
      app,
      $containerEl,
      containerEl: $containerEl && $containerEl[0],
      inline: $containerEl && $containerEl.length > 0,
      needsOriginFix:
        device.ios ||
        (window.navigator.userAgent.toLowerCase().indexOf('safari') >= 0 &&
          window.navigator.userAgent.toLowerCase().indexOf('chrome') < 0 &&
          !device.android),
      cols: [],
      $inputEl,
      inputEl: $inputEl && $inputEl[0],
      $scrollToEl,
      initialized: false,
      opened: false,
      url: picker.params.url,
    });

    function onResize() {
      picker.resizeCols();
    }
    function onInputClick() {
      picker.open();
    }
    function onInputFocus(e) {
      e.preventDefault();
    }
    let htmlTouchStartTarget = null;
    function onHtmlTouchStart(e) {
      htmlTouchStartTarget = e.target;
    }
    function onHtmlClick(e) {
      if (picker.destroyed || !picker.params) return;
      const $targetEl = $(e.target);
      if (picker.isPopover()) return;
      if (!picker.opened || picker.closing) return;
      if ($targetEl.closest('[class*="backdrop"]').length) return;
      if ($inputEl && $inputEl.length > 0) {
        if (
          htmlTouchStartTarget === e.target &&
          $targetEl[0] !== $inputEl[0] &&
          $targetEl.closest('.sheet-modal').length === 0
        ) {
          picker.close();
        }
      } else if ($(e.target).closest('.sheet-modal').length === 0) {
        picker.close();
      }
    }

    // Events
    extend(picker, {
      attachResizeEvent() {
        app.on('resize', onResize);
      },
      detachResizeEvent() {
        app.off('resize', onResize);
      },
      attachInputEvents() {
        picker.$inputEl.on('click', onInputClick);
        if (picker.params.inputReadOnly) {
          picker.$inputEl.on('focus mousedown', onInputFocus);
          if (picker.$inputEl[0]) {
            picker.$inputEl[0].f7ValidateReadonly = true;
          }
        }
      },
      detachInputEvents() {
        picker.$inputEl.off('click', onInputClick);
        if (picker.params.inputReadOnly) {
          picker.$inputEl.off('focus mousedown', onInputFocus);
          if (picker.$inputEl[0]) {
            delete picker.$inputEl[0].f7ValidateReadonly;
          }
        }
      },
      attachHtmlEvents() {
        app.on('click', onHtmlClick);
        app.on('touchstart', onHtmlTouchStart);
      },
      detachHtmlEvents() {
        app.off('click', onHtmlClick);
        app.off('touchstart', onHtmlTouchStart);
      },
    });

    picker.init();

    return picker;
  }

  get view() {
    const { app, params, $inputEl } = this;
    let view;
    if (params.view) {
      view = params.view;
    } else if ($inputEl) {
      view = $inputEl.parents('.view').length && $inputEl.parents('.view')[0].f7View;
    }
    if (!view) view = app.views.main;
    return view;
  }

  initInput() {
    const picker = this;
    if (!picker.$inputEl) return;
    if (picker.params.inputReadOnly) picker.$inputEl.prop('readOnly', true);
  }

  resizeCols() {
    const picker = this;
    if (!picker.opened) return;
    for (let i = 0; i < picker.cols.length; i += 1) {
      if (!picker.cols[i].divider) {
        picker.cols[i].calcSize();
        picker.cols[i].setValue(picker.cols[i].value, false);
      }
    }
  }

  isPopover() {
    const picker = this;
    const { app, modal, params } = picker;
    const device = getDevice();
    if (params.openIn === 'sheet') return false;
    if (modal && modal.type !== 'popover') return false;

    if (!picker.inline && picker.inputEl) {
      if (params.openIn === 'popover') return true;
      if (device.ios) {
        return !!device.ipad;
      }
      if (app.width >= 768) {
        return true;
      }
      if (device.desktop && app.theme === 'aurora') {
        return true;
      }
    }
    return false;
  }

  formatValue() {
    const picker = this;
    const { value, displayValue } = picker;
    if (picker.params.formatValue) {
      return picker.params.formatValue.call(picker, value, displayValue);
    }
    return value.join(' ');
  }

  setValue(values) {
    const picker = this;
    let valueIndex = 0;
    if (picker.cols.length === 0) {
      picker.value = values;
      picker.updateValue(values);
      return;
    }
    for (let i = 0; i < picker.cols.length; i += 1) {
      if (picker.cols[i] && !picker.cols[i].divider) {
        picker.cols[i].setValue(values[valueIndex]);
        valueIndex += 1;
      }
    }
  }

  getValue() {
    const picker = this;
    return picker.value;
  }

  updateValue(forceValues) {
    const picker = this;
    const newValue = forceValues || [];
    const newDisplayValue = [];
    let column;
    if (picker.cols.length === 0) {
      const noDividerColumns = picker.params.cols.filter((c) => !c.divider);
      for (let i = 0; i < noDividerColumns.length; i += 1) {
        column = noDividerColumns[i];
        if (
          column.displayValues !== undefined &&
          column.values !== undefined &&
          column.values.indexOf(newValue[i]) !== -1
        ) {
          newDisplayValue.push(column.displayValues[column.values.indexOf(newValue[i])]);
        } else {
          newDisplayValue.push(newValue[i]);
        }
      }
    } else {
      for (let i = 0; i < picker.cols.length; i += 1) {
        if (!picker.cols[i].divider) {
          newValue.push(picker.cols[i].value);
          newDisplayValue.push(picker.cols[i].displayValue);
        }
      }
    }

    if (newValue.indexOf(undefined) >= 0) {
      return;
    }
    picker.value = newValue;
    picker.displayValue = newDisplayValue;
    picker.emit('local::change pickerChange', picker, picker.value, picker.displayValue);
    if (picker.inputEl) {
      picker.$inputEl.val(picker.formatValue());
      picker.$inputEl.trigger('change');
    }
  }

  initColumn(colEl, updateItems) {
    const picker = this;
    pickerColumn.call(picker, colEl, updateItems);
  }
  // eslint-disable-next-line
  destroyColumn(colEl) {
    const picker = this;
    const $colEl = $(colEl);
    const index = $colEl.index();
    if (picker.cols[index] && picker.cols[index].destroy) {
      picker.cols[index].destroy();
    }
  }

  renderToolbar() {
    const picker = this;
    if (picker.params.renderToolbar) return picker.params.renderToolbar.call(picker, picker);
    return (
      <div class="toolbar toolbar-top">
        <div class="toolbar-inner">
          <div class="left"></div>
          <div class="right">
            <a class="link sheet-close popover-close">{picker.params.toolbarCloseText}</a>
          </div>
        </div>
      </div>
    );
  }
  // eslint-disable-next-line
  renderColumn(col, onlyItems) {
    const colClasses = `picker-column ${col.textAlign ? `picker-column-${col.textAlign}` : ''} ${
      col.cssClass || ''
    }`;
    let columnHtml;
    let columnItemsHtml;

    if (col.divider) {
      // prettier-ignore
      columnHtml = `
        <div class="${colClasses} picker-column-divider">${col.content}</div>
      `;
    } else {
      // prettier-ignore
      columnItemsHtml = col.values.map((value, index) => `
        <div class="picker-item" data-picker-value="${value}">
          <span>${col.displayValues ? col.displayValues[index] : value}</span>
        </div>
      `).join('');
      // prettier-ignore
      columnHtml = `
        <div class="${colClasses}">
          <div class="picker-items">${columnItemsHtml}</div>
        </div>
      `;
    }

    return onlyItems ? columnItemsHtml.trim() : columnHtml.trim();
  }

  renderInline() {
    const picker = this;
    const { rotateEffect, cssClass, toolbar } = picker.params;
    const inlineHtml = (
      <div class={`picker picker-inline ${rotateEffect ? 'picker-3d' : ''} ${cssClass || ''}`}>
        {toolbar && picker.renderToolbar()}
        <div class="picker-columns">
          {picker.cols.map((col) => picker.renderColumn(col))}
          <div class="picker-center-highlight"></div>
        </div>
      </div>
    );

    return inlineHtml;
  }

  renderSheet() {
    const picker = this;
    const { rotateEffect, cssClass, toolbar } = picker.params;
    const sheetHtml = (
      <div
        class={`sheet-modal picker picker-sheet ${rotateEffect ? 'picker-3d' : ''} ${
          cssClass || ''
        }`}
      >
        {toolbar && picker.renderToolbar()}
        <div class="sheet-modal-inner picker-columns">
          {picker.cols.map((col) => picker.renderColumn(col))}
          <div class="picker-center-highlight"></div>
        </div>
      </div>
    );

    return sheetHtml;
  }

  renderPopover() {
    const picker = this;
    const { rotateEffect, cssClass, toolbar } = picker.params;
    const popoverHtml = (
      <div class="popover picker-popover">
        <div class="popover-inner">
          <div class={`picker ${rotateEffect ? 'picker-3d' : ''} ${cssClass || ''}`}>
            {toolbar && picker.renderToolbar()}
            <div class="picker-columns">
              {picker.cols.map((col) => picker.renderColumn(col))}
              <div class="picker-center-highlight"></div>
            </div>
          </div>
        </div>
      </div>
    );

    return popoverHtml;
  }

  render() {
    const picker = this;
    if (picker.params.render) return picker.params.render.call(picker);
    if (!picker.inline) {
      if (picker.isPopover()) return picker.renderPopover();
      return picker.renderSheet();
    }
    return picker.renderInline();
  }

  onOpen() {
    const picker = this;
    const { initialized, $el, app, $inputEl, inline, value, params } = picker;
    picker.opened = true;
    picker.closing = false;
    picker.opening = true;

    // Init main events
    picker.attachResizeEvent();

    // Init cols
    $el.find('.picker-column').each((colEl) => {
      let updateItems = true;
      if ((!initialized && params.value) || (initialized && value)) {
        updateItems = false;
      }
      picker.initColumn(colEl, updateItems);
    });

    // Set value
    if (!initialized) {
      if (value) picker.setValue(value);
      else if (params.value) {
        picker.setValue(params.value);
      }
    } else if (value) {
      picker.setValue(value);
    }

    // Extra focus
    if (!inline && $inputEl && $inputEl.length && app.theme === 'md') {
      $inputEl.trigger('focus');
    }

    picker.initialized = true;

    // Trigger events
    if ($el) {
      $el.trigger('picker:open');
    }
    if ($inputEl) {
      $inputEl.trigger('picker:open');
    }
    picker.emit('local::open pickerOpen', picker);
  }

  onOpened() {
    const picker = this;
    picker.opening = false;

    if (picker.$el) {
      picker.$el.trigger('picker:opened');
    }
    if (picker.$inputEl) {
      picker.$inputEl.trigger('picker:opened');
    }
    picker.emit('local::opened pickerOpened', picker);
  }

  onClose() {
    const picker = this;
    const app = picker.app;
    picker.opening = false;
    picker.closing = true;

    // Detach events
    picker.detachResizeEvent();

    picker.cols.forEach((col) => {
      if (col.destroy) col.destroy();
    });

    if (picker.$inputEl) {
      if (app.theme === 'md') {
        picker.$inputEl.trigger('blur');
      } else {
        const validate = picker.$inputEl.attr('validate');
        const required = picker.$inputEl.attr('required');
        if (validate && required) {
          app.input.validate(picker.$inputEl);
        }
      }
    }

    if (picker.$el) {
      picker.$el.trigger('picker:close');
    }
    if (picker.$inputEl) {
      picker.$inputEl.trigger('picker:close');
    }
    picker.emit('local::close pickerClose', picker);
  }

  onClosed() {
    const picker = this;
    picker.opened = false;
    picker.closing = false;

    if (!picker.inline) {
      nextTick(() => {
        if (picker.modal && picker.modal.el && picker.modal.destroy) {
          if (!picker.params.routableModals) {
            picker.modal.destroy();
          }
        }
        delete picker.modal;
      });
    }

    if (picker.$el) {
      picker.$el.trigger('picker:closed');
    }
    if (picker.$inputEl) {
      picker.$inputEl.trigger('picker:closed');
    }
    picker.emit('local::closed pickerClosed', picker);
  }

  open() {
    const picker = this;
    const { app, opened, inline, $inputEl, $scrollToEl, params } = picker;
    if (opened) return;
    if (picker.cols.length === 0 && params.cols.length) {
      params.cols.forEach((col) => {
        picker.cols.push(col);
      });
    }
    if (inline) {
      picker.$el = $(picker.render());
      picker.$el[0].f7Picker = picker;
      picker.$containerEl.append(picker.$el);
      picker.onOpen();
      picker.onOpened();
      return;
    }
    const isPopover = picker.isPopover();
    const modalType = isPopover ? 'popover' : 'sheet';
    const modalParams = {
      targetEl: $inputEl,
      scrollToEl: $scrollToEl,
      content: picker.render(),
      backdrop: typeof params.backdrop !== 'undefined' ? params.backdrop : isPopover,
      on: {
        open() {
          const modal = this;
          picker.modal = modal;
          picker.$el = isPopover ? modal.$el.find('.picker') : modal.$el;
          picker.$el[0].f7Picker = picker;
          picker.onOpen();
        },
        opened() {
          picker.onOpened();
        },
        close() {
          picker.onClose();
        },
        closed() {
          picker.onClosed();
        },
      },
    };
    if (modalType === 'sheet') {
      modalParams.push = params.sheetPush;
      modalParams.swipeToClose = params.sheetSwipeToClose;
    }
    if (params.routableModals && picker.view) {
      picker.view.router.navigate({
        url: picker.url,
        route: {
          path: picker.url,
          [modalType]: modalParams,
        },
      });
    } else {
      picker.modal = app[modalType].create(modalParams);
      picker.modal.open();
    }
  }

  close() {
    const picker = this;
    const { opened, inline } = picker;
    if (!opened) return;
    if (inline) {
      picker.onClose();
      picker.onClosed();
      return;
    }
    if (picker.params.routableModals && picker.view) {
      picker.view.router.back();
    } else {
      picker.modal.close();
    }
  }

  init() {
    const picker = this;

    picker.initInput();

    if (picker.inline) {
      picker.open();
      picker.emit('local::init pickerInit', picker);
      return;
    }

    if (!picker.initialized && picker.params.value) {
      picker.setValue(picker.params.value);
    }

    // Attach input Events
    if (picker.$inputEl) {
      picker.attachInputEvents();
    }
    if (picker.params.closeByOutsideClick) {
      picker.attachHtmlEvents();
    }
    picker.emit('local::init pickerInit', picker);
  }

  destroy() {
    const picker = this;
    if (picker.destroyed) return;
    const { $el } = picker;
    picker.emit('local::beforeDestroy pickerBeforeDestroy', picker);
    if ($el) $el.trigger('picker:beforedestroy');

    picker.close();

    // Detach Events
    if (picker.$inputEl) {
      picker.detachInputEvents();
    }
    if (picker.params.closeByOutsideClick) {
      picker.detachHtmlEvents();
    }

    if ($el && $el.length) delete picker.$el[0].f7Picker;
    deleteProps(picker);
    picker.destroyed = true;
  }
}

export default Picker;
