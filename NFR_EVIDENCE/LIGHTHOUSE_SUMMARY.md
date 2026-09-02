# Lighthouse Summary — VU Online Voting System (Group 6)

**Date:** 27 August 2026  
**Tool:** Google Lighthouse 11.7.1 (headless Chrome)  
**Base URL:** http://127.0.0.1:5173  
**Raw reports:** `NFR_EVIDENCE/lighthouse/*.report.html` + `*.report.json`

## Scores (0–100)

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|-----------------|----------------|-----|
| Home `/` | 32 | **98** | **96** | 89 |
| Login `/login` | 42 | **98** | **96** | 89 |
| Register `/register` | 39 | **98** | **96** | 89 |
| Live `/live` | 10 | **98** | **96** | 88 |
| Help `/help` | 41 | **98** | **96** | 88 |

## Interpretation (honest)

- **Accessibility ~98** aligns with the earlier **axe** scan (0 WCAG violations on public pages).
- **Performance 10–42 on Vite dev server** is expected for unminified localhost HMR — **not** a production build score. For Capstone demo, use accessibility / best-practices / SEO as the stronger Lighthouse evidence, and cite Jest + health smoke for backend performance.
- HTML reports are suitable to attach/print to PDF for Collaborate if required.

## How to re-run

```powershell
$env:CHROME_PATH = "C:\Program Files\Google\Chrome\Application\chrome.exe"
npx lighthouse http://127.0.0.1:5173/ --chrome-path="$env:CHROME_PATH" --output=html --output=json --output-path=.\home
```
