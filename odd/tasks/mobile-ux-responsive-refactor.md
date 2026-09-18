# Mobile UX & Responsive Refactor

## Objective
Improve mobile user experience, eliminate visual clutter, fix overlapping scroll layouts on mobile Safari/iOS, eliminate redundant loading spinners, and provide clear informative context before forms in Voluntariado and Donaciones.

## Problem & Why
- Users on mobile devices experience cognitive overload in the product catalog where bulky filter cards conceal actual products.
- On Voluntariado and Donaciones, users enter looking for information (requirements, process, what volunteering entails), but are abruptly hit by a heavy raw form that visually overlaps the header when scrolling.
- Dual loading spinners appear when logos are loading or transitioning.
- Discrepancy between "Volver" pill buttons and plain back links across public views.

## Scope
- `Frontend/Progra4-proyecto/proyecto-Cafe-UNA/src/Components/PageLoading/BrandLoader.jsx`
- `Frontend/Progra4-proyecto/proyecto-Cafe-UNA/src/Components/BackToHomeLink/BackToHomeLink.css`
- `Frontend/Progra4-proyecto/proyecto-Cafe-UNA/src/Pages/Products/Products.tsx` & `Products.css`
- `Frontend/Progra4-proyecto/proyecto-Cafe-UNA/src/Pages/Voluntariado/SolicitarVoluntariado.jsx` & `SolicitarVoluntariado.css`
- `Frontend/Progra4-proyecto/proyecto-Cafe-UNA/src/Pages/Donaciones/SolicitarDonacion.jsx` & `SolicitarDonacion.css`
- `Frontend/Progra4-proyecto/proyecto-Cafe-UNA/src/Pages/Login/Login.css`

## Task Checklist
- [x] TASK-1: Remove redundant spinner in `BrandLoader.jsx` when logo is missing/loading and show clean wordmark fallback.
- [x] TASK-2: Standardize Back navigation (`BackToHomeLink.css` & `Login.css`) with refined, accessible pill style matching mobile app patterns.
- [x] TASK-3: Refactor mobile Products catalog filters in `Products.css` (compact search/sort row, horizontally scrollable category pills).
- [x] TASK-4: Add informative context section (requirements, process, CTA) to `SolicitarVoluntariado.jsx` and fix mobile viewport/scroll flow in `SolicitarVoluntariado.css`.
- [x] TASK-5: Harmonize `SolicitarDonacion.jsx` and `SolicitarDonacion.css` narrative and mobile form presentation.
- [x] TASK-6: Verification via tests and production build (21/21 passing, build clean in 2.38s).
