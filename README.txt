NEW YORK PIZZA PLEASANTON — WEBSITE
===================================

Plain HTML/CSS/JS. No build step, no plugins, no database. Upload the whole folder
to any static host (Vercel, Netlify, cPanel, S3, GitHub Pages) and point
newyorkpizzapleasanton.com at it.

PAGES
  index.html      Home — slider banner with SEO titles, menu highlights, deals, halal, reviews, map
  menu.html       Full menu (78 dishes, 15 categories) — one category at a time, swipe/tabs,
                  search, quick filters, tap a dish for a detail sheet
  catering.html   Catering — "Coming Soon" page
  about.html      Our story, reviews, gallery, gift cards
  contact.html    Hours & location, map, FAQ
  404.html        Not-found page (most hosts use it automatically)

ORDERING
  There is no ordering on the website. Every "Order Online" button opens:
  https://order.boons.io/site/new-york-pizza/221/y
  "Order Catering" buttons go to catering.html (Coming Soon).
  To change the ordering link later, find-and-replace that URL across the .html files.

SEO
  - Unique title + meta description on every page, canonical URLs, Open Graph/Twitter cards
  - Schema.org JSON-LD: Restaurant (address, hours, menu, order action), Menu with all
    78 items and prices, FAQ, breadcrumbs
  - sitemap.xml + robots.txt (submit sitemap.xml in Google Search Console after launch)
  - Lighthouse (mobile): SEO 100, Accessibility 100, Best Practices 100 on all pages

ACCESSIBILITY
  Bottom-left accessibility button on every page: text size, high contrast, grayscale,
  highlight links, readable font, text spacing, line height, big cursor, stop animations,
  hide images, reading guide. Settings are remembered per visitor. Links to the
  boons accessibility statement.

ASSETS
  assets/css/style.css   all styles (colours are variables at the top)
  assets/js/main.js      header, mobile menu, slider, open/closed status, carousels
  assets/js/menu.js      menu page experience
  assets/js/a11y.js      accessibility toolbar
  assets/fonts/          Anton + Figtree (self-hosted, SIL Open Font License)
  assets/img/            logo, photos, menu photos (from the live site and boons menu)

The "Open now / Closed" badges are calculated live in Pacific Time from these hours:
  Sun–Thu 10 AM–10:30 PM, Fri–Sat 10 AM–12 AM  (edit HOURS at the top of main.js)

Powered by boons.io
