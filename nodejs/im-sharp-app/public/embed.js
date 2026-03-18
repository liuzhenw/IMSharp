(function () {
  'use strict';

  var IMSharpEmbed = {
    _panel: null,
    _fab: null,
    _badge: null,
    _iframe: null,
    _isOpen: false,
    _options: {},
    _unreadCount: 0,

    init: function (options) {
      this._options = Object.assign({
        baseUrl: '',
        oAuthToken: '',
        theme: 'light',
        panelWidth: '360px',
        panelHeight: '520px',
        position: 'bottom-right',
      }, options);

      this._injectStyles();
      this._createWidget();
      this._listenMessages();

      return this;
    },

    _injectStyles: function () {
      var style = document.createElement('style');
      style.textContent = [
        '#imsharp-widget-container{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;align-items:flex-end;gap:12px;}',
        '#imsharp-chat-panel{width:var(--imsharp-panel-width,360px);height:var(--imsharp-panel-height,520px);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden;background:#fff;display:none;flex-direction:column;transform:scale(0.95) translateY(8px);opacity:0;transition:transform 0.2s ease,opacity 0.2s ease;}',
        '#imsharp-chat-panel.open{display:flex;transform:scale(1) translateY(0);opacity:1;}',
        '#imsharp-chat-panel iframe{width:100%;height:100%;border:none;display:block;}',
        '#imsharp-fab{width:56px;height:56px;border-radius:50%;background:#6366f1;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(99,102,241,0.4);transition:transform 0.15s ease,box-shadow 0.15s ease;position:relative;user-select:none;}',
        '#imsharp-fab:hover{transform:scale(1.08);box-shadow:0 6px 20px rgba(99,102,241,0.5);}',
        '#imsharp-fab:active{transform:scale(0.96);}',
        '#imsharp-fab svg{width:26px;height:26px;fill:#fff;pointer-events:none;}',
        '#imsharp-badge{position:absolute;top:-6px;right:-6px;min-width:22px;height:22px;border-radius:11px;background:#ef4444;color:#fff;font-size:13px;font-weight:700;display:none;align-items:center;justify-content:center;padding:0 5px;border:2px solid #fff;font-family:system-ui,sans-serif;}',
        '#imsharp-badge.visible{display:flex;}',
        '#imsharp-fab.disconnected{background:#ef4444;box-shadow:0 4px 16px rgba(239,68,68,0.4);}',
        '#imsharp-fab.disconnected:hover{box-shadow:0 6px 20px rgba(239,68,68,0.5);}',
        '#imsharp-fab.reconnecting{background:#f59e0b;box-shadow:0 4px 16px rgba(245,158,11,0.4);}',
        '#imsharp-fab.reconnecting:hover{box-shadow:0 6px 20px rgba(245,158,11,0.5);}',
        '@keyframes imsharp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
        '#imsharp-fab.reconnecting svg{animation:imsharp-spin 1.2s linear infinite;}',
      ].join('');
      document.head.appendChild(style);
    },

    _createWidget: function () {
      var container = document.createElement('div');
      container.id = 'imsharp-widget-container';
      container.style.setProperty('--imsharp-panel-width', this._options.panelWidth);
      container.style.setProperty('--imsharp-panel-height', this._options.panelHeight);

      // 聊天面板
      var panel = document.createElement('div');
      panel.id = 'imsharp-chat-panel';

      var iframe = document.createElement('iframe');
      var src = this._options.baseUrl + '/embed?oAuthToken=' + encodeURIComponent(this._options.oAuthToken);
      if (this._options.theme) src += '&theme=' + encodeURIComponent(this._options.theme);
      iframe.src = src;
      iframe.allow = 'clipboard-write';
      panel.appendChild(iframe);

      // 悬浮按钮
      var fab = document.createElement('button');
      fab.id = 'imsharp-fab';
      fab.setAttribute('aria-label', '打开聊天');
      fab.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

      var badge = document.createElement('span');
      badge.id = 'imsharp-badge';
      fab.appendChild(badge);

      this._chatIcon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
      this._closeIcon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
      this._disconnectedIcon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2 1.27-1.27L4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"/></svg>';
      this._reconnectingIcon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>';
      this._connectionState = 'Connected';

      container.appendChild(panel);
      container.appendChild(fab);
      document.body.appendChild(container);

      this._panel = panel;
      this._fab = fab;
      this._badge = badge;
      this._iframe = iframe;

      // 点击悬浮按钮切换面板
      var self = this;
      fab.addEventListener('click', function () {
        self._toggle();
      });

      // 支持拖拽
      this._makeDraggable(fab, container);
    },

    _toggle: function () {
      if (this._isOpen) {
        this._close();
      } else {
        this._open();
      }
    },

    _open: function () {
      this._isOpen = true;

      // 纠正位置：确保面板展开后不超出视口
      var container = this._panel.parentElement;
      var panelW = parseInt(this._options.panelWidth) || 360;
      var panelH = parseInt(this._options.panelHeight) || 520;
      var fabH = 56;
      var gap = 12;
      var margin = 8;
      var totalH = panelH + gap + fabH;

      var curRight = parseInt(container.style.right) || 24;
      var curBottom = parseInt(container.style.bottom) || 24;

      // 保存原始位置，关闭时恢复
      this._savedPosition = { right: curRight, bottom: curBottom };

      // 顶部溢出：bottom + totalHeight > viewportHeight
      var maxBottom = window.innerHeight - totalH - margin;
      if (curBottom > maxBottom) container.style.bottom = Math.max(margin, maxBottom) + 'px';

      // 左侧溢出：right + panelWidth > viewportWidth
      var maxRight = window.innerWidth - panelW - margin;
      if (curRight > maxRight) container.style.right = Math.max(margin, maxRight) + 'px';

      this._panel.classList.add('open');
      this._fab.setAttribute('aria-label', '关闭聊天');
      // 切换为关闭图标
      this._fab.querySelector('svg').outerHTML = this._closeIcon;
      // 通知 iframe 面板已打开
      if (this._iframe.contentWindow) {
        this._iframe.contentWindow.postMessage(
          { source: 'imsharp-host', type: 'panel-opened' },
          '*'
        );
      }
    },

    _close: function () {
      this._isOpen = false;
      this._panel.classList.remove('open');
      this._fab.setAttribute('aria-label', '打开聊天');
      // 恢复展开前的原始位置
      if (this._savedPosition) {
        var container = this._panel.parentElement;
        container.style.right = this._savedPosition.right + 'px';
        container.style.bottom = this._savedPosition.bottom + 'px';
        this._savedPosition = null;
      }
      // 根据连接状态切换图标
      var icon = this._chatIcon;
      if (this._connectionState === 'Disconnected') icon = this._disconnectedIcon;
      else if (this._connectionState === 'Reconnecting' || this._connectionState === 'Connecting') icon = this._reconnectingIcon;
      this._fab.querySelector('svg').outerHTML = icon;
    },

    _updateBadge: function (count) {
      this._unreadCount = count;
      if (count > 0) {
        this._badge.textContent = count > 99 ? '99+' : String(count);
        this._badge.classList.add('visible');
      } else {
        this._badge.classList.remove('visible');
      }
    },

    _updateConnectionState: function (state) {
      this._connectionState = state;
      this._fab.classList.remove('disconnected', 'reconnecting');

      if (state === 'Disconnected') {
        this._fab.classList.add('disconnected');
        // 面板未打开时显示断连图标
        if (!this._isOpen) {
          this._fab.querySelector('svg').outerHTML = this._disconnectedIcon;
        }
      } else if (state === 'Reconnecting' || state === 'Connecting') {
        this._fab.classList.add('reconnecting');
        if (!this._isOpen) {
          this._fab.querySelector('svg').outerHTML = this._reconnectingIcon;
        }
      } else {
        // Connected - 恢复正常图标
        if (!this._isOpen) {
          this._fab.querySelector('svg').outerHTML = this._chatIcon;
        }
      }
    },

    _listenMessages: function () {
      var self = this;
      window.addEventListener('message', function (event) {
        if (!event.data || event.data.source !== 'imsharp-embed') return;
        var type = event.data.type;
        var data = event.data.data;

        if (type === 'ready') {
          if (typeof self._options.onReady === 'function') self._options.onReady();
        } else if (type === 'unread-count-changed') {
          self._updateBadge(data && data.count != null ? data.count : 0);
        } else if (type === 'new-message') {
          if (typeof self._options.onMessage === 'function') self._options.onMessage(data);
        } else if (type === 'token-expired') {
          if (typeof self._options.onTokenExpired === 'function') self._options.onTokenExpired();
        } else if (type === 'connection-state-changed') {
          self._updateConnectionState(data && data.state ? data.state : 'Connected');
        } else if (type === 'error') {
          console.error('[IMSharpEmbed] Error from iframe:', data && data.message);
        }
      });
    },

    _makeDraggable: function (handle, container) {
      var isDragging = false;
      var startX, startY, startRight, startBottom;

      function getClientPos(e) {
        if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        return { x: e.clientX, y: e.clientY };
      }

      function onStart(e) {
        if (e.type === 'mousedown' && e.button !== 0) return;
        isDragging = false;
        var pos = getClientPos(e);
        startX = pos.x;
        startY = pos.y;
        var rect = container.getBoundingClientRect();
        startRight = window.innerWidth - rect.right;
        startBottom = window.innerHeight - rect.bottom;

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
      }

      function onMove(e) {
        var pos = getClientPos(e);
        var dx = Math.abs(pos.x - startX);
        var dy = Math.abs(pos.y - startY);
        if (!isDragging && (dx > 4 || dy > 4)) isDragging = true;
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();

        var newRight = startRight - (pos.x - startX);
        var newBottom = startBottom - (pos.y - startY);
        newRight = Math.max(8, Math.min(window.innerWidth - 72, newRight));
        newBottom = Math.max(8, Math.min(window.innerHeight - 72, newBottom));
        container.style.right = newRight + 'px';
        container.style.bottom = newBottom + 'px';
      }

      function onEnd() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
      }

      handle.addEventListener('mousedown', onStart);
      handle.addEventListener('touchstart', onStart, { passive: true });

      // 拖拽时阻止 click
      handle.addEventListener('click', function (e) {
        if (isDragging) {
          e.stopImmediatePropagation();
          isDragging = false;
        }
      }, true);
    },

    updateToken: function (oAuthToken) {
      if (this._iframe && this._iframe.contentWindow) {
        this._iframe.contentWindow.postMessage(
          { source: 'imsharp-host', type: 'update-token', data: { oAuthToken: oAuthToken } },
          '*'
        );
      }
    },

    setTheme: function (theme) {
      if (this._iframe && this._iframe.contentWindow) {
        this._iframe.contentWindow.postMessage(
          { source: 'imsharp-host', type: 'set-theme', data: { theme: theme } },
          '*'
        );
      }
    },
  };

  window.IMSharpEmbed = IMSharpEmbed;
})();
