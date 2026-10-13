(() => {
  "use strict";

  const pages = ["home", "order", "scan", "outlet", "profile", "tracking"];
  const main = document.getElementById("main-content");
  const toast = document.getElementById("toast");
  let toastTimer;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function navigate(page) {
    if (!pages.includes(page)) page = "home";

    document.querySelectorAll(".page").forEach((section) => {
      section.classList.toggle("active", section.dataset.page === page);
    });

    document.querySelectorAll("[data-nav]").forEach((button) => {
      const isActive = button.dataset.nav === page;
      button.classList.toggle("active", isActive);
      if (isActive) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });

    main.scrollTop = 0;
    main.dataset.currentPage = page;
  }

  function trackShipment(inputId) {
    const input = document.getElementById(inputId);
    const waybill = input.value.trim();

    if (!waybill) {
      input.focus();
      showToast("Silakan masukkan nomor resi terlebih dahulu.");
      return;
    }

    navigate("tracking");
    const pageInput = document.getElementById("tracking-number-page");
    pageInput.value = waybill;
    document.getElementById("tracking-result").textContent =
      "Nomor resi " + waybill + " siap dilacak. Integrasi API pelacakan belum tersedia.";
  }

  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => {
      const destination = button.dataset.go;
      if (destination === "tracking") {
        navigate("tracking");
        document.getElementById("tracking-number-page").focus();
        return;
      }
      navigate(destination);
    });
  });

  document.getElementById("tracking-form").addEventListener("submit", (event) => {
    event.preventDefault();
    trackShipment("tracking-number");
  });

  document.getElementById("tracking-form-page").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.getElementById("tracking-number-page");
    const waybill = input.value.trim();
    const result = document.getElementById("tracking-result");

    if (!waybill) {
      input.focus();
      result.textContent = "Silakan masukkan nomor resi terlebih dahulu.";
      return;
    }

    result.textContent =
      "Nomor resi " + waybill + " siap dilacak. Integrasi API pelacakan belum tersedia.";
  });

  document.getElementById("notification-btn").addEventListener("click", () => {
    showToast("Belum ada notifikasi baru.");
  });

  const notificationLink = document.getElementById("notification-link");
  notificationLink.addEventListener("click", () => showToast("Belum ada informasi baru."));
  notificationLink.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showToast("Belum ada informasi baru.");
    }
  });

  document.getElementById("camera-btn").addEventListener("click", async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Browser ini tidak mendukung akses kamera.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach((track) => track.stop());
      showToast("Akses kamera berhasil. Fitur pembacaan barcode/QR belum tersedia.");
    } catch (error) {
      showToast("Kamera tidak dapat diakses. Periksa izin kamera browser.");
    }
  });

  window.addEventListener("pageshow", () => {
    if (!main.dataset.currentPage) navigate("home");
  });

  navigate("home");
})();
