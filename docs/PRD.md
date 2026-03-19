# Product Requirements Document (PRD)

## BarHop PH — Philippine Bar & Club Listings Web App

| Field          | Details                                      |
| -------------- | -------------------------------------------- |
| **Version**    | 1.0 (MVP)                                    |
| **Author**     | _[Your Name]_                                |
| **Created**    | March 19, 2026                               |
| **Status**     | Draft                                        |
| **Target Market** | Philippines                               |

### Suggested App Names

The chosen app name is **BarHop PH**. Other candidates that were considered:

| Name              | Vibe                                                              |
| ----------------- | ----------------------------------------------------------------- |
| **NightOwl PH**   | Playful, implies nightlife discovery.                             |
| **Pulutan**        | Filipino slang for bar snacks/drinking culture — very local feel. |
| **Inuman PH**     | Tagalog for "drinking session" — instantly relatable.             |
| **BarHop PH**     | Straightforward, implies exploring multiple venues.               |
| **Tambayan**       | Tagalog for "hangout spot" — broader appeal.                     |
| **Gala PH**       | Tagalog slang for going out at night.                             |
| **Tagay PH**      | Tagalog for the communal drinking toast — culturally rooted.      |
| **LasengList**    | Cheeky/humorous ("laseng" = drunk + listing).                    |

---

## 1. Overview

BarHop PH is a web application that serves as the centralized, go-to directory for bars and clubs across the Philippines. Customers can discover, search, and filter venues by location, category, open hours, and more. Business owners can pay to promote their listings and manage them through a dedicated admin account.

---

## 2. Problem Statement

There is no single, dedicated, SEO-optimized platform for discovering bars and clubs in the Philippines. Information is scattered across social media, Google Maps reviews, and word-of-mouth. Customers struggle to find venues that match their preferences (location, vibe, hours, amenities), and bar/club owners lack a specialized channel to reach their target audience.

---

## 3. Goals & Success Metrics

### 3.1 Goals

1. **Centralized Listings** — Build the single most comprehensive directory of bars and clubs in the Philippines.
2. **SEO Dominance** — Become the #1 organic search result for Philippine bar/club discovery queries (e.g., "best bars in Makati", "clubs in Cebu") to maximize web traffic.
3. **Monetization via Promoted Listings** — Once meaningful traffic is established, generate revenue by offering business owners paid promotional tiers and self-managed admin accounts.

### 3.2 Success Metrics (KPIs)

| Metric                          | Target (6 months post-launch) |
| ------------------------------- | ----------------------------- |
| Total indexed listings          | 500+                          |
| Monthly organic traffic         | 10,000+ visits                |
| Average session duration        | > 2 minutes                   |
| Bounce rate                     | < 55%                         |
| Paid/promoted listings          | 20+                           |
| Top-10 Google ranking keywords  | 15+                           |

---

## 4. Target Users

| Persona               | Description                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| **Customer**           | Anyone in or visiting the Philippines looking for bars/clubs — locals, tourists, expats.     |
| **Business Owner**     | Bar or club owner/manager who wants to promote their venue and manage their listing.         |
| **Super Admin**        | Platform operator who manages all listings, business accounts, and platform content.         |

---

## 5. Application Sides

The app is divided into two sides: **Admin Side** and **Customer Side**.

---

## 6. Customer Side

### 6.1 Features

#### 6.1.1 Listing Browse & Discovery

- View all published bar/club listings.
- Each listing card displays: name, category, primary image, city, and open/closed status.

#### 6.1.2 Search

- Full-text search by venue name.
- Instant results as the user types (debounced).

#### 6.1.3 Filtering

Customers can filter listings by any combination of:

- **Region** (e.g., NCR, Central Visayas, Western Visayas)
- **City** (e.g., Quezon City, Makati, Cebu City)
- **Category** (e.g., Sports Bar, Rooftop Bar, Night Club, Cocktail Bar)
- **Open Hours** (e.g., "Open Now", specific day/time)

Filters should be combinable (AND logic) and URL-parameterized for SEO and shareability.

#### 6.1.4 Geolocation — Nearby Listings

- On permission grant, detect the customer's current location via the browser Geolocation API.
- Show a "Near Me" view that sorts/filters listings by proximity.
- Display approximate distance from the user.

#### 6.1.5 Listing Detail Page

The detail page is the core content page of the app and must be rich, informative, and SEO-optimized. It displays:

| Field             | Description                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| **Name**          | Venue name (H1, primary SEO keyword target).                                                        |
| **Category**      | Type of bar/club (e.g., Cocktail Bar, KTV, Night Club, Beer Garden).                                |
| **Address**       | Full address with a **Copy Address** button for easy clipboard copying.                             |
| **Region & City** | Displayed and linked for breadcrumb navigation and SEO.                                             |
| **Image(s)**      | Hero image; gallery if multiple images are available.                                               |
| **Description**   | Free-text description — contact info, vibe, history, specialties, etc.                              |
| **Tags**          | Badges such as: `24/7`, `Pet Friendly`, `Parking Available`, `Wi-Fi`, `Live Music`, `Outdoor Seating`, `LGBTQ+ Friendly`, `Happy Hour`, `Wheelchair Accessible`, `Hookah/Shisha`, `Dance Floor`, `VIP Area`, `Food Available`, `Craft Beer`, `Rooftop`. |
| **Menu / Prices** | Structured section for menu items and their prices.                                                 |
| **Events**        | Upcoming or recurring events (e.g., "Ladies Night every Wednesday", "DJ Set — March 25").           |
| **Open Hours**    | Weekly schedule displayed clearly (e.g., Mon–Thu 5 PM – 12 AM, Fri–Sat 5 PM – 3 AM, Sun Closed).   |
| **Google Map**    | Embedded interactive Google Map showing the venue's exact pin location.                             |

#### 6.1.6 SEO Requirements for Customer Side

- Every listing detail page must have a unique, keyword-rich URL slug (e.g., `/listings/makati/the-pool-bar`).
- Server-side rendering (SSR) or static site generation (SSG) for all public pages.
- Proper meta tags: `title`, `description`, Open Graph, Twitter Card.
- Structured data / JSON-LD markup (`LocalBusiness`, `BarOrPub`, `NightClub` schemas).
- Sitemap.xml auto-generation.
- Canonical URLs on all pages.
- Breadcrumb navigation (Home → Region → City → Venue).
- Region and city landing pages (e.g., `/bars/ncr`, `/bars/ncr/quezon-city`) for keyword targeting.
- Fast page load (target Lighthouse Performance score ≥ 90).
- Mobile-first responsive design.

---

## 7. Admin Side

### 7.1 Authentication & Authorization

- Login and logout functionality.
- All admin pages and API routes are protected; unauthenticated users are redirected to the login page.
- Role-based access control (RBAC) with two roles: **Super Admin** and **Admin**.

### 7.2 Roles & Permissions

#### 7.2.1 Super Admin

| Capability                        | Details                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| **Listing CRUD**                  | View all listings. Create, read, update, and delete any listing.                         |
| **Business Account CRUD**         | Create, read, update, and delete Admin (business owner) accounts.                        |
| **Promote a Listing**             | When a business owner pays, Super Admin can upgrade their listing (e.g., featured flag, richer content, priority placement) and create an Admin account so the owner can self-manage. |

#### 7.2.2 Admin (Business Owner)

| Capability                        | Details                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| **View Own Listings**             | See only the listings assigned to their account.                                         |
| **Edit Own Listings**             | Update details (description, images, hours, menu, events, tags) of their own listings.   |
| **Cannot Create/Delete Listings** | Listing creation and deletion remain Super Admin–only.                                   |
| **Cannot Manage Accounts**        | No access to account management.                                                         |

Account creation, modification, and deletion of Admin accounts is at the Super Admin's discretion.

### 7.3 Promoted Listing Benefits

When a business owner pays for promotion, their listing is upgraded with the following benefits to ensure their investment delivers clear value:

#### 7.3.1 Visibility Boosts

- **Priority Placement** — Promoted listings appear at the top of search results, browse pages, and category/region/city landing pages before all free listings.
- **Homepage Featured Section** — A dedicated "Featured Venues" carousel or grid on the homepage exclusively showcases promoted listings.
- **"Featured" Badge** — A visually distinct badge (e.g., star icon, gold border) on listing cards so customers can see it's a highlighted venue.
- **Region/City Page Spotlight** — Promoted listings get a highlighted card or banner slot on their respective region and city landing pages.

#### 7.3.2 Richer Content (Unlocked Fields)

Promoted listings unlock content fields that free listings do not have access to:

| Feature                    | Free Listing | Promoted Listing |
| -------------------------- | ------------ | ---------------- |
| Primary image              | 1 image      | 1 image          |
| Photo gallery              | —            | Up to 10 images  |
| Video embed (YouTube, FB)  | —            | 1 video          |
| Rich HTML description      | Plain text   | Rich text / HTML |
| Social media links         | —            | Facebook, Instagram, TikTok, X |
| Direct contact buttons     | —            | Phone, WhatsApp, Messenger, Email |
| Custom CTA button          | —            | e.g., "Visit Us", "See Menu", "Get Directions" |
| Highlighted events section | Basic list   | Rich cards with images and dates |
| Menu with images           | Text only    | Items with photos |

#### 7.3.3 Analytics Access

Promoted business owners (Admin accounts) gain access to a listing analytics dashboard showing:

- Total listing page views (daily, weekly, monthly).
- Click-through rate from browse/search to detail page.
- Contact button clicks (phone, WhatsApp, Messenger, etc.).
- "Get Directions" / map interaction count.
- Top referral sources (search, direct, region page, homepage).
- Comparison vs. average performance of listings in the same city.

#### 7.3.4 SEO Benefits

- Promoted listings get richer JSON-LD structured data (more fields indexed).
- Priority inclusion in `sitemap.xml` with higher change frequency signals.
- More aggressive internal linking from category, region, and city pages.
- Longer, keyword-optimized meta descriptions auto-generated from their richer content.

### 7.4 Web Traffic Analytics (Admin Dashboard)

#### 7.4.1 Super Admin Analytics

The Super Admin dashboard includes a site-wide analytics overview:

- **Traffic Overview** — Total page views, unique visitors, sessions (daily/weekly/monthly trends).
- **Top Listings** — Most viewed listings ranked by page views.
- **Top Search Queries** — What customers are searching for on the platform.
- **Traffic by Region/City** — Heatmap or bar chart of traffic distribution across Philippine regions and cities.
- **Traffic Sources** — Breakdown by organic search, direct, social media, referral.
- **Bounce Rate & Session Duration** — Site-wide engagement metrics.
- **Promoted vs. Free Performance** — Comparison of average views/engagement for promoted vs. free listings (useful for sales pitches to business owners).

#### 7.4.2 Admin (Business Owner) Analytics

Business owner Admin accounts see a scoped analytics dashboard for their own listings only:

- Listing page views over time (chart).
- How users found their listing (search, browse, nearby, homepage feature).
- Contact button click counts (phone, WhatsApp, Messenger, directions).
- Comparison to average venue performance in their city (anonymized).

#### 7.4.3 Analytics Implementation (MVP)

For MVP, use a lightweight, privacy-friendly analytics solution:

- **Recommended**: Umami (open-source, self-hostable) or Plausible (hosted, GDPR-compliant).
- Track page views and custom events (contact clicks, direction clicks, search queries) via a lightweight JS snippet.
- Expose analytics data to the admin dashboard via an internal API that queries the analytics database.
- Avoid Google Analytics for MVP to keep the stack simple and privacy-friendly; can migrate later if needed.

---

## 8. Data Model (Listing Entity)

Below is the core data structure for a bar/club listing.

| Field           | Type              | Required | Notes                                                        |
| --------------- | ----------------- | -------- | ------------------------------------------------------------ |
| `id`            | UUID / Auto-inc   | Yes      | Primary key.                                                 |
| `name`          | String            | Yes      | Venue name.                                                  |
| `slug`          | String            | Yes      | URL-friendly unique identifier, auto-generated from name.    |
| `category`      | String / Enum     | Yes      | e.g., Sports Bar, Cocktail Bar, Night Club, KTV, Beer Garden, Rooftop Bar, Lounge, Pub, Wine Bar. |
| `region`        | String / Enum     | Yes      | Philippine region (e.g., NCR, Region VII).                   |
| `city`          | String            | Yes      | City or municipality (e.g., Quezon City, Makati).            |
| `address`       | String            | Yes      | Full street address.                                         |
| `latitude`      | Float             | Yes      | For map display and proximity calculations.                  |
| `longitude`     | Float             | Yes      | For map display and proximity calculations.                  |
| `description`   | Text              | Yes      | Rich text — contact info, vibe, history, etc.                |
| `image_url`     | String            | Yes      | Primary display image URL.                                   |
| `gallery`       | String[]          | No       | Additional image URLs.                                       |
| `tags`          | String[]          | No       | Array of tag strings.                                        |
| `open_hours`    | JSON              | Yes      | Weekly schedule object (see below).                          |
| `menu`          | JSON              | No       | Array of `{ item, price, description? }` objects.            |
| `events`        | JSON              | No       | Array of `{ title, date?, recurrence?, description? }` objects. |
| `is_promoted`   | Boolean           | Yes      | Whether the listing is a paid/promoted listing. Default: `false`. |
| `owner_id`      | UUID / FK         | No       | References the Admin user who owns/manages this listing (set when promoted). |
| `created_at`    | Timestamp         | Yes      | Auto-generated.                                              |
| `updated_at`    | Timestamp         | Yes      | Auto-updated.                                                |

### 8.1 Open Hours JSON Structure

```json
{
  "monday":    { "open": "17:00", "close": "00:00" },
  "tuesday":   { "open": "17:00", "close": "00:00" },
  "wednesday": { "open": "17:00", "close": "00:00" },
  "thursday":  { "open": "17:00", "close": "00:00" },
  "friday":    { "open": "17:00", "close": "03:00" },
  "saturday":  { "open": "17:00", "close": "03:00" },
  "sunday":    null
}
```

A `null` value means the venue is closed on that day.

---

## 9. User Account Data Model

| Field           | Type            | Required | Notes                                            |
| --------------- | --------------- | -------- | ------------------------------------------------ |
| `id`            | UUID / Auto-inc | Yes      | Primary key.                                     |
| `email`         | String          | Yes      | Unique. Used for login.                          |
| `password_hash` | String          | Yes      | Bcrypt or Argon2 hashed.                         |
| `role`          | Enum            | Yes      | `super_admin` or `admin`.                        |
| `name`          | String          | Yes      | Display name.                                    |
| `created_at`    | Timestamp       | Yes      | Auto-generated.                                  |
| `updated_at`    | Timestamp       | Yes      | Auto-updated.                                    |

---

## 10. API Design (High-Level)

All API routes are prefixed with `/api`.

### 10.1 Public (Customer) APIs

| Method | Endpoint                        | Description                                |
| ------ | ------------------------------- | ------------------------------------------ |
| GET    | `/api/listings`                 | List/search/filter listings (paginated).   |
| GET    | `/api/listings/:slug`           | Get a single listing by slug.              |
| GET    | `/api/listings/nearby`          | Get listings near a lat/lng coordinate.    |
| GET    | `/api/regions`                  | Get all regions with their cities.         |
| GET    | `/api/categories`               | Get all available categories.              |

### 10.2 Auth APIs

| Method | Endpoint                        | Description                                |
| ------ | ------------------------------- | ------------------------------------------ |
| POST   | `/api/auth/login`               | Authenticate and return a session/token.   |
| POST   | `/api/auth/logout`              | Invalidate session/token.                  |
| GET    | `/api/auth/me`                  | Get current authenticated user info.       |

### 10.3 Protected Admin APIs

All require authentication. Super Admin–only routes are marked with 🔒.

| Method | Endpoint                        | Auth Role        | Description                             |
| ------ | ------------------------------- | ---------------- | --------------------------------------- |
| GET    | `/api/admin/listings`           | Super Admin, Admin | List listings (all for SA, own for Admin). |
| POST   | `/api/admin/listings`           | 🔒 Super Admin   | Create a new listing.                    |
| PUT    | `/api/admin/listings/:id`       | Super Admin, Admin | Update a listing (Admin: own only).      |
| DELETE | `/api/admin/listings/:id`       | 🔒 Super Admin   | Delete a listing.                        |
| GET    | `/api/admin/users`              | 🔒 Super Admin   | List all admin/business accounts.        |
| POST   | `/api/admin/users`              | 🔒 Super Admin   | Create a new admin account.              |
| PUT    | `/api/admin/users/:id`          | 🔒 Super Admin   | Update an admin account.                 |
| DELETE | `/api/admin/users/:id`          | 🔒 Super Admin   | Delete an admin account.                 |
| GET    | `/api/admin/analytics/overview`  | 🔒 Super Admin   | Site-wide traffic analytics (views, visitors, top listings, sources). |
| GET    | `/api/admin/analytics/listings/:id` | Super Admin, Admin | Listing-level analytics (Admin: own only). |

---

## 11. Page Structure

### 11.1 Customer Pages

| Page                  | Route                              | Description                                                |
| --------------------- | ---------------------------------- | ---------------------------------------------------------- |
| Home                  | `/`                                | Hero, search bar, featured/promoted listings, categories.  |
| Listings              | `/listings`                        | Browse all listings with filters, search, and pagination.  |
| Region Landing        | `/listings/:region`                | All listings within a region (SEO landing page).           |
| City Landing          | `/listings/:region/:city`          | All listings within a city (SEO landing page).             |
| Listing Detail        | `/listings/:region/:city/:slug`    | Full detail page for a single venue.                       |
| Near Me               | `/nearby`                          | Geolocation-based nearby listings.                         |

### 11.2 Admin Pages

| Page                  | Route                              | Description                                                |
| --------------------- | ---------------------------------- | ---------------------------------------------------------- |
| Login                 | `/admin/login`                     | Admin login form.                                          |
| Dashboard             | `/admin/dashboard`                 | Overview with listing count, recent activity.              |
| Manage Listings       | `/admin/listings`                  | Table of all (or own) listings with actions.               |
| Create Listing        | `/admin/listings/new`              | Form to create a new listing (Super Admin only).           |
| Edit Listing          | `/admin/listings/:id/edit`         | Form to edit an existing listing.                          |
| Manage Users          | `/admin/users`                     | Table of admin accounts (Super Admin only).                |
| Create User           | `/admin/users/new`                 | Form to create a new admin account (Super Admin only).     |
| Edit User             | `/admin/users/:id/edit`            | Form to edit an admin account (Super Admin only).          |
| Site Analytics        | `/admin/analytics`                 | Site-wide traffic dashboard (Super Admin only).            |
| Listing Analytics     | `/admin/listings/:id/analytics`    | Per-listing performance dashboard (Super Admin & Admin).   |

---

## 12. SEO Strategy

### 12.1 On-Page SEO

- Keyword-rich title tags: `[Venue Name] — Bar in [City] | BarHop PH`.
- Meta descriptions with venue category, city, and key tags.
- H1 = Venue name, H2s for sections (Menu, Events, Hours, etc.).
- Alt text on all images.
- Internal linking between region → city → venue pages.
- Breadcrumbs with structured data.

### 12.2 Technical SEO

- SSR/SSG for all public pages (frameworks like Next.js recommended).
- JSON-LD structured data on every listing (`LocalBusiness` schema).
- Auto-generated `sitemap.xml` and `robots.txt`.
- Canonical URLs.
- Core Web Vitals optimization (LCP < 2.5s, CLS < 0.1, INP < 200ms).
- Mobile-first responsive design.

### 12.3 Content & Off-Page SEO

- Region and city landing pages act as keyword hubs.
- Blog section (future iteration) for content marketing (e.g., "Top 10 Rooftop Bars in Makati").
- Encourage business owners to link back to their listing page.
- Open Graph and Twitter Card tags for social sharing.

---

## 13. Non-Functional Requirements

| Requirement       | Details                                                                 |
| ----------------- | ----------------------------------------------------------------------- |
| **Performance**   | Lighthouse score ≥ 90. Page load < 3s on 3G.                           |
| **Responsiveness**| Mobile-first. Fully responsive across phone, tablet, desktop.           |
| **Security**      | Passwords hashed (bcrypt/Argon2). HTTPS only. CSRF protection. Input sanitization. Role-based API protection. |
| **Scalability**   | Stateless API; database-backed. Easily scalable horizontally.           |
| **Accessibility** | WCAG 2.1 AA compliance target. Semantic HTML, ARIA labels, keyboard navigation. |
| **Browser Support** | Latest 2 versions of Chrome, Firefox, Safari, Edge. iOS Safari, Android Chrome. |
| **Analytics**     | Lightweight, privacy-friendly analytics (Umami or Plausible). Custom event tracking for contact clicks, searches, and map interactions. |

---

## 14. Suggested Tech Stack (MVP)

This is a recommendation; final choices are flexible.

| Layer        | Technology                                   | Rationale                                  |
| ------------ | -------------------------------------------- | ------------------------------------------ |
| Frontend     | Next.js (React) with TypeScript              | SSR/SSG for SEO, great DX, large ecosystem.|
| Styling      | Tailwind CSS                                 | Rapid UI development, mobile-first.        |
| Backend/API  | Next.js API Routes                           | Co-located with frontend for MVP speed.    |
| Database     | Amazon RDS PostgreSQL (Free Tier)            | Managed PostgreSQL with PostGIS for geo queries. |
| ORM          | Prisma                                       | Type-safe queries, migrations.             |
| Auth         | NextAuth.js or custom JWT                    | Session or token-based auth.               |
| File Storage | Amazon S3 + CloudFront                       | Image hosting with CDN delivery.           |
| Maps         | Google Maps JavaScript API                   | Map embeds on detail pages.                |
| Hosting      | AWS ECS Fargate                              | Containerized, serverless compute with blue-green deployment support. |
| CI/CD        | GitHub Actions → Amazon ECR → AWS CodeDeploy | Automated test, build, and zero-downtime deploy pipeline. |
| Load Balancer| Application Load Balancer (ALB)              | Traffic routing for blue-green swap.       |
| DNS/SSL      | Amazon Route 53 + AWS Certificate Manager    | Custom domain with free SSL.               |
| Search       | PostgreSQL full-text search (MVP) → OpenSearch (future) | Keep it simple initially. |
| Analytics    | Umami (self-hosted as ECS service) or Plausible (hosted) | Privacy-friendly, lightweight. |

---

## 15. Hosting, CI/CD & Deployment (AWS)

### 15.1 Architecture Overview

```
                        ┌──────────────────────────────────────────────┐
                        │              AWS Cloud                        │
┌──────────┐           │                                              │
│  GitHub   │──push──▶ │  ┌────────────────┐    ┌────────────────┐   │
│  Repo     │          │  │ GitHub Actions  │───▶│ Amazon ECR     │   │
└──────────┘           │  │ (lint, test,    │    │ (Docker image  │   │
                        │  │  docker build)  │    │  registry)     │   │
                        │  └────────────────┘    └───────┬────────┘   │
                        │                                │             │
                        │                    ┌───────────▼──────────┐  │
                        │                    │  AWS CodeDeploy      │  │
                        │                    │  (Blue-Green swap)   │  │
                        │                    └───────────┬──────────┘  │
                        │                                │             │
                        │          ┌─────────────────────▼──────┐     │
                        │          │  Application Load Balancer  │     │
                        │          │  (ALB)                      │     │
                        │          └──────┬──────────────┬───────┘     │
                        │                 │              │             │
                        │        ┌────────▼────┐  ┌─────▼───────┐    │
                        │        │ ECS Fargate  │  │ ECS Fargate │    │
                        │        │ BLUE (live)  │  │ GREEN (new) │    │
                        │        └────────┬────┘  └─────┬───────┘    │
                        │                 │              │             │
                        │          ┌──────▼──────────────▼──────┐     │
                        │          │  Amazon RDS PostgreSQL      │     │
                        │          │  (db.t3.micro — Free Tier)  │     │
                        │          └────────────────────────────┘     │
                        │                                              │
                        │  ┌─────────────┐    ┌──────────────────┐    │
                        │  │ Amazon S3    │───▶│ CloudFront (CDN) │    │
                        │  │ (images)     │    │ (global edge)    │    │
                        │  └─────────────┘    └──────────────────┘    │
                        │                                              │
                        │  ┌─────────────┐    ┌──────────────────┐    │
                        │  │ Route 53     │    │ ACM (SSL/TLS)    │    │
                        │  │ (DNS)        │    │ (free certs)     │    │
                        │  └─────────────┘    └──────────────────┘    │
                        └──────────────────────────────────────────────┘
```

### 15.2 Deployment Strategy: Blue-Green via ECS + CodeDeploy

Blue-green deployment ensures **zero downtime** during releases. Here's how it works:

#### 15.2.1 How Blue-Green Works

1. **Blue (current)** — The live production environment serving real traffic through the ALB.
2. **Green (new)** — When a new version is deployed, ECS Fargate spins up a new set of tasks (containers) with the updated code.
3. **Health check** — CodeDeploy runs health checks against the green environment to verify it's healthy and responsive.
4. **Traffic shift** — Once green passes health checks, the ALB shifts 100% of traffic from blue to green. This can be configured as:
   - **All-at-once** — Instant swap (recommended for MVP).
   - **Linear** — Gradual shift (e.g., 10% every minute).
   - **Canary** — Small percentage first (e.g., 10%), then all.
5. **Rollback** — If green fails health checks or errors spike, CodeDeploy automatically rolls back to blue. The old blue tasks remain available for a configurable window (e.g., 30 minutes) for instant rollback.

#### 15.2.2 ECS Fargate Configuration

| Setting              | Value                              | Notes                                     |
| -------------------- | ---------------------------------- | ----------------------------------------- |
| Launch type          | Fargate                            | No server management.                     |
| CPU / Memory         | 0.25 vCPU / 0.5 GB (MVP)          | Smallest Fargate size; scale up as needed. |
| Desired tasks        | 2 (1 blue, 1 green during deploy) | Minimum for blue-green.                   |
| Auto-scaling         | Min: 1, Max: 4                     | Scale on CPU/memory thresholds.           |
| Container image      | Stored in Amazon ECR               | Built and pushed by GitHub Actions.       |
| Health check path    | `/api/health`                      | Simple endpoint returning 200 OK.         |
| Deployment controller| AWS CodeDeploy                     | Manages blue-green traffic shifting.      |

#### 15.2.3 Application Load Balancer (ALB)

- Two target groups: **blue** and **green**.
- ALB listener on port 443 (HTTPS) forwards to the active target group.
- A test listener on port 8443 allows testing the green environment before traffic shift.
- SSL termination at the ALB using a free ACM certificate.

### 15.3 CI/CD Pipeline

#### 15.3.1 Pipeline Flow

```
git push to main
       │
       ▼
┌─────────────────────────────────┐
│  GitHub Actions Workflow        │
│                                 │
│  1. Checkout code               │
│  2. Install dependencies        │
│  3. Run linter (ESLint)         │
│  4. Run type check (tsc)        │
│  5. Run unit tests (Jest/Vitest)│
│  6. Build Docker image          │
│  7. Push image to Amazon ECR    │
│  8. Update ECS task definition  │
│  9. Trigger CodeDeploy          │
└─────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  AWS CodeDeploy                 │
│                                 │
│  1. Create green target group   │
│  2. Launch new Fargate tasks    │
│  3. Run health checks           │
│  4. Shift traffic blue → green  │
│  5. Terminate old blue tasks    │
└─────────────────────────────────┘
```

#### 15.3.2 GitHub Actions Configuration

| Trigger               | Branch    | Actions                                          |
| --------------------- | --------- | ------------------------------------------------ |
| Push to `main`        | `main`    | Full pipeline → deploy to **production**.         |
| Push to `develop`     | `develop` | Full pipeline → deploy to **staging**.            |
| Pull request to `main`| Any       | Lint + type check + tests only (no deploy).       |

#### 15.3.3 GitHub Actions Secrets Required

- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (or use OIDC role assumption for better security).
- `AWS_REGION` (e.g., `ap-southeast-1` for Singapore — closest to Philippines).
- `ECR_REPOSITORY` — Amazon ECR repository URI.
- `ECS_CLUSTER` — ECS cluster name.
- `ECS_SERVICE` — ECS service name.

### 15.4 Environments

| Environment  | Purpose                            | Branch    | AWS Resources                          |
| ------------ | ---------------------------------- | --------- | -------------------------------------- |
| **Production** | Live, customer-facing site.      | `main`    | ECS Fargate + ALB + RDS + CloudFront.  |
| **Staging**    | Pre-production testing.          | `develop` | Separate ECS service, shared RDS (separate DB schema) or separate RDS instance. |
| **Local**      | Developer machine.               | Any       | Docker Compose with local PostgreSQL.  |

### 15.5 AWS Region

**`ap-southeast-1` (Singapore)** — The closest AWS region to the Philippines. This ensures low latency (~20–40ms) for Filipino users. CloudFront CDN will cache static assets at edge locations globally, including Manila.

### 15.6 Dockerfile (Next.js)

The Next.js app will be containerized using a multi-stage Docker build for minimal image size:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 15.7 Database (Amazon RDS)

| Setting              | Value                              | Notes                                     |
| -------------------- | ---------------------------------- | ----------------------------------------- |
| Engine               | PostgreSQL 16                      | Latest stable. Enable PostGIS extension.  |
| Instance class       | `db.t3.micro`                      | Free Tier eligible (12 months).           |
| Storage              | 20 GB gp3                          | Free Tier includes 20 GB.                |
| Multi-AZ             | No (MVP)                           | Enable for production reliability later.  |
| Automated backups    | Enabled, 7-day retention           | Free within Free Tier.                    |
| VPC                  | Private subnet                     | Only accessible from ECS tasks.           |

### 15.8 File Storage (S3 + CloudFront)

- **S3 bucket**: Store all listing images (seeded from Google Places API photos + admin uploads).
- **CloudFront distribution**: Serve images from edge locations for fast load times. Cache TTL of 7 days for images.
- **Upload flow**: Admin uploads image → API route receives file → uploads to S3 → stores S3 URL in the listing record.
- **Image optimization**: Use Next.js `<Image>` component with a custom loader pointing to CloudFront URLs, or process images with Sharp during upload (resize, WebP conversion).

### 15.9 DNS & SSL

- **Route 53**: Register or transfer `barhop.ph` (or `.com`) domain. Create A/AAAA alias records pointing to the ALB and CloudFront.
- **AWS Certificate Manager (ACM)**: Free public SSL/TLS certificates for `barhop.ph` and `*.barhop.ph`. Auto-renewing.

### 15.10 AWS Cost Estimate (MVP)

All estimates assume Free Tier eligibility (first 12 months) and MVP-level traffic (~10,000 visits/month).

| Service                  | Free Tier Allowance             | Estimated Monthly Cost |
| ------------------------ | ------------------------------- | ---------------------- |
| ECS Fargate (1 task)     | —                               | ~$9–12                 |
| ALB                      | —                               | ~$3–5                  |
| RDS PostgreSQL (t3.micro)| 750 hrs/mo (12 months)          | $0 (Free Tier)         |
| S3 (5 GB images)         | 5 GB storage, 20K GET           | $0 (Free Tier)         |
| CloudFront (15 GB out)   | 1 TB out/mo (always free)       | $0                     |
| ECR (image storage)      | 500 MB/mo                       | $0 (Free Tier)         |
| Route 53 (hosted zone)   | —                               | $0.50                  |
| ACM (SSL)                | Always free                     | $0                     |
| **Total**                |                                 | **~$13–18/mo**         |

After the 12-month Free Tier expires, RDS adds ~$13/mo, bringing the total to ~$26–31/mo. At that point, traffic and promoted listings revenue should more than cover the cost. Alternatively, you can migrate to Aurora Serverless v2 for pay-per-use pricing at low traffic.

### 15.11 Infrastructure as Code (Recommended)

For reproducibility and environment consistency, define all AWS resources using one of:

- **AWS CDK (TypeScript)** — Recommended since the app is TypeScript-based. Define ECS, ALB, RDS, S3, CloudFront, and CodeDeploy resources in code.
- **Terraform** — Alternative if you prefer provider-agnostic IaC.

Store IaC files in a `/infra` directory in the same GitHub repo.

---

## 16. Data Seeding Strategy

### 16.1 Source: Google Places API (New)

All initial listing data will be sourced legally via the **Google Places API (New)** — specifically the Text Search and Place Details endpoints. This ensures compliance with Google's Terms of Service and provides high-quality, structured data.

### 16.2 Data Available from Google Places API

The API returns the following fields that map directly to our listing data model:

| Google Places Field       | Maps To                |
| ------------------------- | ---------------------- |
| `displayName`             | `name`                 |
| `formattedAddress`        | `address`              |
| `location` (lat/lng)      | `latitude`, `longitude`|
| `primaryType` / `types`   | `category`, `tags`     |
| `regularOpeningHours`     | `open_hours`           |
| `photos`                  | `image_url`, `gallery` |
| `editorialSummary`        | `description` (base)   |
| `websiteUri`              | Additional contact info|
| `nationalPhoneNumber`     | Contact info           |
| `googleMapsUri`           | Reference link         |

Fields **not** available from the API (to be filled manually or left empty for free listings): `menu`, `events`, `tags` (beyond what `types` provides).

### 16.3 Seeding Approach

**Step 1: Query Design** — Run Text Search queries using category + city combinations:

```
"bars in Quezon City"
"night clubs in Makati"
"KTV in Pasig"
"cocktail bars in BGC Taguig"
"pubs in Cebu City"
"lounges in Davao City"
```

**Step 2: Priority Order**

| Priority | Region / Area              | Target Listings |
| -------- | -------------------------- | --------------- |
| 1        | NCR — Makati, BGC, QC, Manila, Pasig, Mandaluyong, Pasay | 120–150 |
| 2        | Region VII — Cebu City, Mandaue, Lapu-Lapu | 20–30 |
| 3        | Region III — Angeles City (Clark), San Fernando | 10–15 |
| 4        | Region XI — Davao City     | 10–15           |
| 5        | Region VI — Iloilo City, Bacolod | 10–15     |
| 6        | Other regions              | 10–20           |
| **Total** |                           | **200+**        |

**Step 3: Seeding Script** — Build a Node.js/Python script that:

1. Iterates through the query list.
2. Calls the Google Places Text Search API for each query.
3. For each result, calls Place Details to get full data (hours, photos, phone, etc.).
4. Maps the response to our listing schema.
5. Auto-generates `slug` from the venue name + city.
6. Assigns `region` and `city` based on the address or a lookup table.
7. Inserts into the database via Prisma or direct SQL.
8. Deduplicates by `google_place_id` to avoid duplicates across overlapping queries.

**Step 4: Manual Enrichment** — After automated seeding, manually review and enrich top listings (especially NCR) with better descriptions, additional tags, and curated images.

### 16.4 Google Places API Cost Estimate

| API Call          | Cost (per 1,000 calls) | Estimated Calls | Estimated Cost |
| ----------------- | ---------------------- | --------------- | -------------- |
| Text Search       | ~$32                   | ~50 queries     | ~$1.60         |
| Place Details     | ~$17                   | ~300 places     | ~$5.10         |
| Place Photos      | ~$7                    | ~300 photos     | ~$2.10         |
| **Total**         |                        |                 | **~$8.80**     |

Cost is minimal for 200+ listings. Google offers a $200/month free credit for Maps Platform, which more than covers this.

### 16.5 Data Model Addition

Add a `google_place_id` field to the listing entity to track the source and enable deduplication and future data refreshes:

| Field             | Type   | Required | Notes                                    |
| ----------------- | ------ | -------- | ---------------------------------------- |
| `google_place_id` | String | No       | Google Places unique ID. Used for dedup and data refresh. |

---

## 17. MVP Scope & Out of Scope

### 17.1 In Scope (MVP)

- Customer-facing listing browse, search, filter, and detail pages.
- Geolocation-based nearby listings.
- Google Map embed on detail pages.
- Copy address functionality.
- Admin login/logout with role-based access.
- Super Admin: full CRUD on listings and business accounts.
- Admin (Business Owner): view and edit own listings.
- SEO foundations (SSR, structured data, sitemaps, meta tags).
- Promoted listing flag and featured placement on home page.
- Promoted listing benefits (richer content, visibility boosts, SEO priority).
- Web traffic analytics dashboard (site-wide for Super Admin, listing-scoped for Admin).
- Data seeding via Google Places API (200+ listings, NCR priority).
- AWS infrastructure (ECS Fargate, RDS, S3, CloudFront, ALB).
- Blue-green deployment via CodeDeploy for zero-downtime releases.
- CI/CD pipeline via GitHub Actions → ECR → CodeDeploy.

### 17.2 Out of Scope (Future Iterations)

- Customer registration and user accounts.
- Reviews and ratings system.
- Payment gateway integration (payments handled offline for MVP).
- Blog / content marketing section.
- Push notifications or email alerts.
- Mobile native app (iOS/Android).
- Multi-language support.
- Chat or messaging between customers and venues.

---

## 18. Risks & Mitigations

| Risk                                         | Mitigation                                                        |
| -------------------------------------------- | ----------------------------------------------------------------- |
| Low initial listing volume                   | Seed 200+ listings via Google Places API; prioritize Metro Manila. |
| SEO takes time to gain traction               | Invest in proper technical SEO from day one; focus on long-tail keywords. |
| Business owners reluctant to pay              | Demonstrate traffic/analytics value before pitching; show listing analytics comparisons. |
| Stale or inaccurate listing data             | Provide easy edit access to business owners; periodic re-sync with Google Places API; manual audits. |
| Google Maps API costs at scale               | Monitor usage; implement caching and lazy-loading for maps. Leverage $200/month free credit. |
| Google Places API data gaps                  | Menu, events, and detailed tags not available from API — require manual enrichment for top listings. |

---

## 19. Milestones (Estimated)

| Phase                      | Duration   | Deliverables                                                        |
| -------------------------- | ---------- | ------------------------------------------------------------------- |
| **Phase 1: Infra Setup**   | 1–2 weeks  | AWS account setup, ECS Fargate cluster, RDS, S3, ALB, CodeDeploy blue-green, GitHub Actions pipeline, staging environment. |
| **Phase 2: Foundation**    | 2–3 weeks  | Database schema, auth system, admin CRUD, basic API.                |
| **Phase 3: Customer UI**   | 3–4 weeks  | Listing pages, search, filters, detail page, geolocation, maps.    |
| **Phase 4: SEO & Polish**  | 1–2 weeks  | SSR optimization, structured data, sitemap, meta tags, performance tuning. |
| **Phase 5: Data Seeding**  | 1–2 weeks  | Google Places API seeding script, 200+ listings populated, manual enrichment of top NCR listings. |
| **Phase 6: Analytics**     | 1 week     | Umami/Plausible setup, event tracking, admin analytics dashboard.   |
| **Phase 7: Promotions**    | 1 week     | Promoted listing UI (badges, featured section, rich content), Admin listing analytics view. |
| **Phase 8: Launch**        | 1 week     | Deploy to production via blue-green, monitoring, bug fixes.         |
| **Total MVP**              | ~11–16 weeks |                                                                   |

---

## 20. Appendix

### 20.1 Predefined Categories

- Sports Bar
- Cocktail Bar
- Rooftop Bar
- Night Club
- KTV / Karaoke Bar
- Beer Garden
- Lounge
- Pub
- Wine Bar
- Beach Bar
- Live Music Bar
- Speakeasy
- Hookah / Shisha Bar

### 20.2 Predefined Tags

- 24/7
- Pet Friendly
- Parking Available
- Wi-Fi Available
- Live Music
- Outdoor Seating
- LGBTQ+ Friendly
- Happy Hour
- Wheelchair Accessible
- Hookah / Shisha
- Dance Floor
- VIP Area
- Food Available
- Craft Beer
- Rooftop
- Family Friendly
- Student Discount
- Ladies Night
- Sports Screening
- Pool Table
- Darts
- Board Games

### 20.3 Philippine Regions Reference

- NCR (National Capital Region)
- CAR (Cordillera Administrative Region)
- Region I – Ilocos Region
- Region II – Cagayan Valley
- Region III – Central Luzon
- Region IV-A – CALABARZON
- Region IV-B – MIMAROPA
- Region V – Bicol Region
- Region VI – Western Visayas
- Region VII – Central Visayas
- Region VIII – Eastern Visayas
- Region IX – Zamboanga Peninsula
- Region X – Northern Mindanao
- Region XI – Davao Region
- Region XII – SOCCSKSARGEN
- Region XIII – Caraga
- BARMM (Bangsamoro Autonomous Region in Muslim Mindanao)
