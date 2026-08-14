# CampusCart Setup Guide

## Default Student Login Credentials

To test the application with a student account, use the following credentials:

**Email:** `student@svcet.ac.in`  
**Password:** `password123`

### How to Create the Test Student Account

1. **Navigate to Registration:**
   - Go to http://localhost:3000/register (or the live app URL)

2. **Fill in the Registration Form:**
   - **Full Name:** Student
   - **Email:** `student@svcet.ac.in` (must use @svcet.ac.in domain)
   - **Password:** `password123`
   - **Confirm Password:** `password123`
   - **Department:** (optional)
   - **Year:** (optional)

3. **Submit and Verify:**
   - Click "Create Account"
   - You'll be logged in automatically
   - Explore the marketplace as a student

## Environment Configuration

The application is configured to only allow registrations with the college email domain:

```env
NEXT_PUBLIC_COLLEGE_EMAIL_DOMAIN=svcet.ac.in
```

All users must register with an email ending in `@svcet.ac.in`.

### To Change the College Domain

Edit the `.env` file:

```bash
NEXT_PUBLIC_COLLEGE_EMAIL_DOMAIN=yourdomain.ac.in
```

Then update your registration credentials accordingly.

## Testing Different User Roles

### As a Student Buyer
- Register and login with `student@svcet.ac.in`
- Browse products in categories
- Add items to cart
- Checkout (sandbox payment mode)

### As a Seller
- After logging in as a student, go to `/seller/dashboard`
- Set up seller profile in Settings
- Add products
- Manage inventory and orders

## Key Features to Test

- ✅ Browse categories and products
- ✅ Search and filter products
- ✅ View product details
- ✅ Add to cart
- ✅ Checkout (sandbox mode)
- ✅ User account and settings
- ✅ Seller dashboard
- ✅ Product management

## Deployed App

**Live URL:** https://campus-cart01.vercel.app

Use the same credentials there to test the production deployment.
