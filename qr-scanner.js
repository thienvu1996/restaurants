(function (global) {
  "use strict";

  class QRScanner {
    constructor(target, options = {}) {
      this.root = typeof target === "string" ? document.querySelector(target) : target;
      if (!this.root) throw new Error("QRScanner: target không tồn tại.");

      this.options = {
        fps: 15,
        qrbox: 250,
        aspectRatio: 1,
        facingMode: "environment",
        duplicateCooldown: 1200,
        autoStart: false,
        maxHistory: 10,
        showHistory: true,
        title: "Quét QR Code",
        onScan: null,
        onError: null,
        ...options,
      };

      this.id = `qr-${Math.random().toString(36).slice(2, 9)}`;
      this.readerId = `${this.id}-reader`;
      this.scanner = null;
      this.running = false;
      this.lastText = "";
      this.lastScanAt = 0;
      this.history = [];
      this.cameraId = null;
      this.cameras = [];

      this.render();
      this.bindEvents();

      if (this.options.autoStart) this.start();
    }

    render() {
      this.root.classList.add("qr-scanner-component");
      this.root.innerHTML = `
        <div class="card qr-card">
          <div class="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between gap-2">
            <div>
              <h5 class="mb-0">${this.escapeHtml(this.options.title)}</h5>
              <small class="text-secondary">Đưa mã QR vào giữa khung camera</small>
            </div>
            <span class="badge text-bg-secondary qr-state">Chưa bật</span>
          </div>

          <div class="qr-camera-wrap">
            <div id="${this.readerId}" class="qr-reader"></div>
            <div class="qr-frame"></div>
          </div>

          <div class="card-body">
            <div class="d-grid gap-2 d-sm-flex mb-3">
              <button type="button" class="btn btn-primary flex-fill qr-start">Bật camera</button>
              <button type="button" class="btn btn-outline-secondary flex-fill qr-switch" disabled>Đổi camera</button>
              <button type="button" class="btn btn-outline-danger flex-fill qr-stop" disabled>Dừng</button>
            </div>

            <div class="qr-status text-secondary small mb-3">Sẵn sàng quét.</div>

            <div class="border rounded-3 p-3 bg-body-tertiary">
              <div class="small text-secondary mb-1">Kết quả gần nhất</div>
              <div class="fw-semibold qr-result-text">Chưa có dữ liệu</div>
              <div class="d-flex gap-2 mt-3">
                <button type="button" class="btn btn-sm btn-outline-primary qr-copy" disabled>Copy</button>
                <button type="button" class="btn btn-sm btn-outline-success qr-open" disabled>Mở URL</button>
              </div>
            </div>

            ${this.options.showHistory ? `
              <div class="mt-3">
                <div class="small text-secondary mb-2">Lịch sử quét</div>
                <div class="list-group qr-history"></div>
              </div>` : ""}
          </div>
        </div>`;

      this.els = {
        start: this.root.querySelector(".qr-start"),
        stop: this.root.querySelector(".qr-stop"),
        switch: this.root.querySelector(".qr-switch"),
        state: this.root.querySelector(".qr-state"),
        status: this.root.querySelector(".qr-status"),
        result: this.root.querySelector(".qr-result-text"),
        copy: this.root.querySelector(".qr-copy"),
        open: this.root.querySelector(".qr-open"),
        history: this.root.querySelector(".qr-history"),
      };
    }

    bindEvents() {
      this.els.start.addEventListener("click", () => this.start());
      this.els.stop.addEventListener("click", () => this.stop());
      this.els.switch.addEventListener("click", () => this.switchCamera());
      this.els.copy.addEventListener("click", () => this.copyResult());
      this.els.open.addEventListener("click", () => this.openResult());
    }

    async start() {
      if (this.running) return;
      if (!global.Html5Qrcode) {
        this.setStatus("Thiếu thư viện html5-qrcode.", "danger");
        return;
      }

      try {
        this.setStatus("Đang xin quyền camera...", "secondary");
        this.scanner = this.scanner || new Html5Qrcode(this.readerId, false);
        this.cameras = await Html5Qrcode.getCameras();

        const cameraConfig = this.cameraId
          ? { deviceId: { exact: this.cameraId } }
          : { facingMode: this.options.facingMode };

        await this.scanner.start(
          cameraConfig,
          {
            fps: this.options.fps,
            qrbox: typeof this.options.qrbox === "number"
              ? { width: this.options.qrbox, height: this.options.qrbox }
              : this.options.qrbox,
            aspectRatio: this.options.aspectRatio,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          },
          (text, decodedResult) => this.handleScan(text, decodedResult),
          () => {}
        );

        this.running = true;
        this.els.start.disabled = true;
        this.els.stop.disabled = false;
        this.els.switch.disabled = this.cameras.length < 2;
        this.setState("Đang quét", "success");
        this.setStatus("Camera đang hoạt động.", "success");
      } catch (err) {
        this.running = false;
        this.setState("Lỗi camera", "danger");
        this.setStatus(this.humanizeError(err), "danger");
        if (typeof this.options.onError === "function") this.options.onError(err, this);
      }
    }

    async stop() {
      if (!this.scanner || !this.running) return;
      try {
        await this.scanner.stop();
      } catch (_) {}
      this.running = false;
      this.els.start.disabled = false;
      this.els.stop.disabled = true;
      this.els.switch.disabled = true;
      this.setState("Đã dừng", "secondary");
      this.setStatus("Camera đã dừng.", "secondary");
    }

    async switchCamera() {
      if (this.cameras.length < 2) return;
      const currentIndex = this.cameras.findIndex(c => c.id === this.cameraId);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % this.cameras.length : 0;
      this.cameraId = this.cameras[nextIndex].id;
      await this.stop();
      await this.start();
    }

    handleScan(text, decodedResult) {
      const now = Date.now();
      if (text === this.lastText && now - this.lastScanAt < this.options.duplicateCooldown) return;

      this.lastText = text;
      this.lastScanAt = now;
      this.els.result.textContent = text;
      this.els.copy.disabled = false;
      this.els.open.disabled = !this.isUrl(text);
      this.setStatus(`Đã quét lúc ${new Date().toLocaleTimeString("vi-VN")}`, "success");
      this.beep();
      if (navigator.vibrate) navigator.vibrate(70);

      this.history.unshift({ text, time: new Date() });
      this.history = this.history.slice(0, this.options.maxHistory);
      this.renderHistory();

      if (typeof this.options.onScan === "function") {
        this.options.onScan(text, decodedResult, this);
      }
    }

    renderHistory() {
      if (!this.els.history) return;
      this.els.history.innerHTML = this.history.map(item => `
        <div class="list-group-item d-flex justify-content-between align-items-start gap-3">
          <span class="text-break">${this.escapeHtml(item.text)}</span>
          <small class="text-secondary text-nowrap">${item.time.toLocaleTimeString("vi-VN")}</small>
        </div>`).join("");
    }

    async copyResult() {
      if (!this.lastText) return;
      try {
        await navigator.clipboard.writeText(this.lastText);
        this.setStatus("Đã copy kết quả.", "primary");
      } catch (_) {
        this.setStatus("Không thể copy tự động trên trình duyệt này.", "warning");
      }
    }

    openResult() {
      if (this.isUrl(this.lastText)) {
        window.open(this.lastText, "_blank", "noopener,noreferrer");
      }
    }

    async destroy() {
      await this.stop();
      if (this.scanner) {
        try { await this.scanner.clear(); } catch (_) {}
      }
      this.root.innerHTML = "";
      this.root.classList.remove("qr-scanner-component");
    }

    getValue() {
      return this.lastText;
    }

    clearHistory() {
      this.history = [];
      this.renderHistory();
    }

    setStatus(text, type = "secondary") {
      this.els.status.className = `qr-status small mb-3 text-${type}`;
      this.els.status.textContent = text;
    }

    setState(text, type = "secondary") {
      this.els.state.className = `badge text-bg-${type} qr-state`;
      this.els.state.textContent = text;
    }

    isUrl(value) {
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch (_) {
        return false;
      }
    }

    beep() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        gain.gain.value = 0.04;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } catch (_) {}
    }

    humanizeError(err) {
      const msg = String(err && (err.message || err) || "");
      if (/NotAllowedError|Permission/i.test(msg)) return "Bạn chưa cấp quyền camera cho trang web.";
      if (/NotFoundError|camera/i.test(msg)) return "Không tìm thấy camera khả dụng.";
      return `Không mở được camera: ${msg || "Lỗi không xác định"}`;
    }

    escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
  }

  global.QRScanner = QRScanner;
})(window);
