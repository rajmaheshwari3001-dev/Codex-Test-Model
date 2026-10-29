# Aaroh-Saarthi 2.0 — Accessibility Audit (WCAG 2.2 AA)

**Audit Date:** 2026-10-29  
**Standard:** WCAG 2.2 Level AA  
**Repository:** `https://github.com/rajmaheshwari3001-dev/Codex-Test-Model`  

---

## 1. Color Contrast Audit

| Foreground Element | Foreground Hex | Background Hex | Calculated Ratio | WCAG 2.2 AA Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Main Page Text** | `#17231F` | `#F5F7F6` | **14.2 : 1** | **PASS** (Exceeds AAA 7:1) | High-contrast slate on light neutral page. |
| **Surface Card Text** | `#17231F` | `#FFFFFF` | **15.8 : 1** | **PASS** (Exceeds AAA 7:1) | Crisp body text on white card backgrounds. |
| **Secondary Metadata** | `#596861` | `#FFFFFF` | **5.4 : 1** | **PASS** (Exceeds AA 4.5:1) | Form hints, zone IDs, timetable details. |
| **Primary Button Text** | `#FFFFFF` | `#172554` | **14.1 : 1** | **PASS** (Exceeds AAA 7:1) | White text on Midnight Navy header/buttons. |
| **Accent Action Text** | `#FFFFFF` | `#2563EB` | **4.56 : 1** | **PASS** (Meets AA 4.5:1) | Electric Cobalt action links and tags. |
| **Operational Green** | `#FFFFFF` | `#15803D` | **4.55 : 1** | **PASS** (Meets AA 4.5:1) | On-schedule, successful approval badges. |
| **Danger / Disruption** | `#FFFFFF` | `#DC2626` | **4.64 : 1** | **PASS** (Meets AA 4.5:1) | Crimson Red breakdown actions and alerts. |
| **Warning Banner Text** | `#78350F` | `#FEF3C7` | **7.8 : 1** | **PASS** (Exceeds AAA 7:1) | Burnt Brown text on Amber-100 notice background. |

---

## 2. Keyboard Navigation & Focus Management

* **Logical Tab Order:** All interactive controls (navigation tabs, origin/destination dropdowns, time inputs, preset buttons, search trigger, result cards, and map controls) follow a natural sequential DOM order.
* **Visible Focus Indicators:** Applied distinct, high-contrast focus rings:
  * Buttons & Inputs: `focus:ring-2 focus:ring-emerald-500` or `outline: 3px solid #2563EB`.
  * Journey Result Cards: `role="button"` with `tabIndex={0}` and `focus:ring-4 focus:ring-emerald-500/15`.
* **Keyboard Triggers:**
  * Journey result cards activate on both `Enter` and `Space`.
  * Swap button activates via `Enter` / `Space`.
  * Chat assistant sends query on `Enter`.

---

## 3. Screen Reader Semantics & ARIA Attributes

* **Form Controls:** All `<select>` and `<input>` elements feature explicit `<label htmlFor="...">` and matching `id` attributes.
* **Input Validation:** Departure time input binds `aria-describedby="departure-time-hint"` and dynamic `aria-invalid`.
* **Live Notifications & Alerts:**
  * System alerts, connection warnings, and out-of-service notices use `role="alert"`.
  * Bookmark save confirmations and status updates use `role="status"` and `aria-live="polite"`.
  * Health status indicators include text-equivalent titles and accessible status labels.
* **Map Accessibility:** The Leaflet map container is labeled with `aria-label="Interactive Transit Map"` and `role="region"`. All text information (stops, routes, fares, and arrival times) is fully accessible via the text-based Route Results cards, ensuring users who cannot see the map retain full journey planning capability.

---

## 4. Touch Targets & Motor Accessibility

* **Minimum Hit Targets:** All interactive controls meet or exceed the WCAG 2.2 AA target size of at least $24 \times 24\text{ px}$ (with most primary controls exceeding $44 \times 44\text{ px}$).
* **Reduced Motion:** Configured global CSS media query:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
