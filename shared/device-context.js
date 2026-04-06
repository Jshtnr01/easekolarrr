(() => {
  const root = document.documentElement;

  function hasTouch() {
    return (
      "ontouchstart" in window ||
      (navigator.maxTouchPoints || 0) > 0 ||
      (navigator.msMaxTouchPoints || 0) > 0
    );
  }

  function detectDeviceType() {
    const width = window.innerWidth || root.clientWidth || 1024;
    const ua = (navigator.userAgent || "").toLowerCase();
    const touch = hasTouch();
    const tabletHint = /ipad|tablet|playbook|silk|kindle/.test(ua) || (touch && width >= 768 && width <= 1024);
    const mobileHint = /mobi|iphone|ipod|android/.test(ua) || (touch && width < 768);

    if (tabletHint) return "tablet";
    if (mobileHint) return "mobile";
    return "desktop";
  }

  function applyDeviceContext() {
    const type = detectDeviceType();
    const isMobile = type === "mobile";
    const isTablet = type === "tablet";
    const isDesktop = type === "desktop";

    root.dataset.device = type;
    root.classList.toggle("is-mobile", isMobile);
    root.classList.toggle("is-tablet", isTablet);
    root.classList.toggle("is-desktop", isDesktop);

    window.easeDevice = { type, isMobile, isTablet, isDesktop };
    window.dispatchEvent(new CustomEvent("ease-device-change", { detail: window.easeDevice }));
  }

  let resizeTimer = null;
  function scheduleRefresh() {
    if (resizeTimer) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(applyDeviceContext, 120);
  }

  applyDeviceContext();
  window.addEventListener("resize", scheduleRefresh, { passive: true });
  window.addEventListener("orientationchange", scheduleRefresh, { passive: true });
})();
