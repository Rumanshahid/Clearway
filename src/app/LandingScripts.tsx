"use client";

import { useEffect } from "react";

export default function LandingScripts() {
  useEffect(() => {
    const stages = [
      { d: 1400, p: "38%", t: "Conservative care: 6 wks NSAIDs + PT noted", f: "Checking neurological exam findings…", chip: "DRAFTING", chipClass: "blue", btnOp: ".45" },
      { d: 2800, p: "66%", t: "SLR positive, motor strength 4-/5 documented", f: "No missing fields detected ✓", chip: "DRAFTING", chipClass: "blue", btnOp: ".45" },
      { d: 4100, p: "89%", t: "3 of 3 CPB #0236 criteria met", f: "Denial risk: Low — all 8 components present ✓", chip: "DRAFTING", chipClass: "blue", btnOp: ".45" },
      { d: 5300, p: "100%", t: "Letter complete — ready for physician review", f: "All 8 required components present ✓", chip: "READY", chipClass: "green", btnOp: "1" },
    ];

    const heroBar = document.getElementById("heroBar");
    const heroText = document.getElementById("heroText");
    const heroFlag = document.getElementById("heroFlag");
    const heroChip = document.getElementById("heroChip");
    const heroBtn = document.getElementById("heroActionBtn") as HTMLElement | null;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function runStages() {
      stages.forEach((s) => {
        timeouts.push(
          setTimeout(() => {
            if (!heroBar || !heroText || !heroFlag || !heroChip || !heroBtn) return;
            heroBar.style.width = s.p;
            heroText.textContent = s.t;
            heroFlag.textContent = s.f;
            heroChip.textContent = s.chip;
            heroChip.className = "status-pill " + s.chipClass;
            heroBtn.style.opacity = s.btnOp;
            if (s.chip === "READY") heroFlag.style.color = "var(--success-green)";
          }, s.d)
        );
      });
    }

    runStages();
    const interval = setInterval(() => {
      if (!heroBar || !heroText || !heroFlag || !heroChip || !heroBtn) return;
      heroBar.style.transition = "none";
      heroBar.style.width = "14%";
      heroText.textContent = "Checking conservative care history…";
      heroFlag.textContent = "Scanning for missing fields…";
      heroFlag.style.color = "var(--gray-400)";
      heroChip.textContent = "DRAFTING";
      heroChip.className = "status-pill blue";
      heroBtn.style.opacity = ".45";
      timeouts.push(
        setTimeout(() => {
          heroBar.style.transition = "width 1.3s cubic-bezier(.4,0,.2,1)";
        }, 80)
      );
      timeouts.push(setTimeout(runStages, 200));
    }, 9500);

    // ---- compare carousel (continuous forward loop via a trailing clone slide) ----
    const slidesWrap = document.getElementById("cmpSlides");
    const dotsWrap = document.getElementById("cmpDots");
    const prevBtn = document.getElementById("cmpPrev");
    const nextBtn = document.getElementById("cmpNext");
    let index = 0; // can exceed realCount-1 by 1 (the clone)
    let carouselTimer: ReturnType<typeof setInterval> | undefined;
    let dots: HTMLCollectionOf<Element> | undefined;
    let cloneSnapTimeout: ReturnType<typeof setTimeout> | undefined;

    let next: () => void = () => {};
    let prev: () => void = () => {};
    let resetTimer: () => void = () => {};

    if (slidesWrap && dotsWrap) {
      const realCount = slidesWrap.children.length - 1; // excludes the trailing clone

      function updateDots(realIndex: number) {
        if (!dots) return;
        for (let j = 0; j < dots.length; j++) {
          dots[j].classList.toggle("active", j === realIndex);
        }
      }

      function goTo(i: number, animate = true) {
        index = i;
        if (slidesWrap) {
          slidesWrap.style.transition = animate ? "transform .5s cubic-bezier(.4,0,.2,1)" : "none";
          slidesWrap.style.transform = `translateX(-${index * 100}%)`;
        }
        updateDots(index % realCount);
      }

      for (let i = 0; i < realCount; i++) {
        const dot = document.createElement("button");
        dot.className = "cdot" + (i === 0 ? " active" : "");
        dot.addEventListener("click", () => {
          goTo(i);
          resetTimer();
        });
        dotsWrap.appendChild(dot);
      }
      dots = dotsWrap.children;

      // always move forward; when landing on the clone, snap invisibly back to real slide 0
      next = () => {
        goTo(index + 1);
        if (index === realCount) {
          cloneSnapTimeout = setTimeout(() => goTo(0, false), 500);
        }
      };
      prev = () => {
        const target = index === 0 ? realCount - 1 : index - 1;
        goTo(target);
      };
      resetTimer = () => {
        if (carouselTimer) clearInterval(carouselTimer);
        carouselTimer = setInterval(next, 4000);
      };
      prevBtn?.addEventListener("click", () => {
        prev();
        resetTimer();
      });
      nextBtn?.addEventListener("click", () => {
        next();
        resetTimer();
      });
      goTo(0, false);
      resetTimer();
    }

    // ---- responsive scroll header ----
    const nav = document.getElementById("siteNav");
    const floatingBtn = document.getElementById("floatingHamburger");
    const mobileBtn = document.getElementById("mobileHamburger");
    const dropdown = document.getElementById("navDropdown");
    const SCROLL_THRESHOLD = 80;
    let navHidden = false;

    function closeDropdown() {
      floatingBtn?.classList.remove("open");
      dropdown?.classList.remove("open");
    }
    function setNavHidden(on: boolean) {
      navHidden = on;
      nav?.classList.toggle("nav-hidden", on);
      floatingBtn?.classList.toggle("show", on);
      if (!on) closeDropdown();
    }
    function toggleDropdown() {
      const open = !dropdown?.classList.contains("open");
      floatingBtn?.classList.toggle("open", open && navHidden);
      dropdown?.classList.toggle("open", open);
    }
    function onScroll() {
      const y = window.scrollY;
      const shouldHide = y > SCROLL_THRESHOLD;
      if (shouldHide !== navHidden) setNavHidden(shouldHide);
    }
    function checkWidth() {
      mobileBtn?.classList.toggle("show", window.innerWidth <= 768);
    }
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdown &&
        !dropdown.contains(target) &&
        target !== floatingBtn &&
        target !== mobileBtn &&
        !floatingBtn?.contains(target) &&
        !mobileBtn?.contains(target)
      ) {
        closeDropdown();
      }
    }

    checkWidth();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", checkWidth);
    floatingBtn?.addEventListener("click", toggleDropdown);
    mobileBtn?.addEventListener("click", toggleDropdown);
    document.addEventListener("click", onDocClick);
    dropdown?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeDropdown));

    return () => {
      timeouts.forEach(clearTimeout);
      clearInterval(interval);
      if (carouselTimer) clearInterval(carouselTimer);
      if (cloneSnapTimeout) clearTimeout(cloneSnapTimeout);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", checkWidth);
      document.removeEventListener("click", onDocClick);
    };
  }, []);

  return null;
}
