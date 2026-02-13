

# Roomzy — Airbnb-style Property Rental Platform

## Overview
A modern, responsive property rental platform where hosts can list properties and guests can browse and book them. Built with React + Tailwind on the frontend and Supabase (PostgreSQL, Auth, Storage, Edge Functions) on the backend.

---

## Phase 1: Core Features (This Implementation)

### 1. Authentication & User Profiles
- Email/password signup and login with Supabase Auth
- Role selection during signup: **Guest** or **Host**
- Roles stored in a secure `user_roles` table (not on profiles)
- User profile with name, avatar upload, and bio
- Profile editing page

### 2. Property Listings (Host Features)
- **Create Listing** form: title, description, location, price per night, amenities (checkboxes), and multiple image uploads
- Images stored in Supabase Storage bucket
- **Edit & Delete** listings from a Host Dashboard
- Host can view bookings received on their properties

### 3. Browse & Search (Guest Features)
- **Home page** with a grid of listing cards (image, title, location, price)
- **Search bar** with location-based filtering and debounce
- **Price range filter** (slider)
- **Property Details page**: image gallery, description, amenities, host info, booking form

### 4. Booking System
- Select check-in and check-out dates via date picker
- Automatic total price calculation
- Date conflict validation (prevent double bookings)
- Booking confirmation with toast notification
- **Booking History** page for guests

### 5. Navigation & Layout
- Responsive navbar with logo, search, and auth buttons (login/signup or profile/logout)
- Footer with links
- Mobile-friendly hamburger menu
- Protected routes (guests can't access host dashboard, etc.)

---

## Database Schema (Supabase/PostgreSQL)

- **profiles** — id, full_name, avatar_url, bio (linked to auth.users)
- **user_roles** — user_id, role (guest/host/admin)
- **listings** — id, host_id, title, description, location, price_per_night, amenities, created_at
- **listing_images** — id, listing_id, image_url, position
- **bookings** — id, listing_id, guest_id, check_in, check_out, total_price, status, created_at

RLS policies ensure hosts manage only their own listings and guests access only their own bookings.

---

## UI Design Direction
- Clean, modern card-based layout with rounded corners and subtle shadows
- Warm color palette (earthy tones with accent color)
- Hover animations on listing cards
- Skeleton loaders while data fetches
- Toast notifications for actions (booking confirmed, listing created, etc.)
- Fully responsive — mobile-first approach

---

## Pages
1. **Home** — Search bar + featured listing grid
2. **Login / Register** — Auth forms with role selection
3. **Property Details** — Gallery, info, booking widget
4. **Create/Edit Listing** — Multi-field form with image upload
5. **Profile** — View/edit user info
6. **Booking History** — Guest's past and upcoming bookings
7. **Host Dashboard** — Host's listings + incoming bookings
8. **Not Found (404)**

---

## Future Phases (not included now)
- Admin dashboard (manage all users/listings)
- Reviews & ratings
- Map view integration
- Pagination & infinite scroll
- Payment integration

