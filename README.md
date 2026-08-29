# Ur Home Taste

Production-oriented full-stack ecommerce platform for the Indian homemade pickles brand **Ur Home Taste** with the slogan **From Our Home to Yours**.

## Stack

- Frontend: Next.js App Router, React, TypeScript, SCSS Modules, CSS variables, Framer Motion, React Hook Form-ready forms, Axios-ready API layer.
- Backend: Node.js, Express.js, JWT auth, refresh tokens, secure cookies, bcrypt, Helmet, rate limiting, CSRF, centralized errors.
- Database: PostgreSQL with Prisma models for users, admins/sellers via roles, products, categories, orders, order items, addresses, payments, coupons, reviews, wishlist, inventory, blogs, newsletter, notifications, referrals, reward points.
- Payments: Razorpay order creation and signature verification with UPI, Google Pay, PhonePe, Paytm, BHIM method support.
- Deployment: Docker Compose, separate API/web Dockerfiles, Nginx reverse proxy config, GitHub Actions CI.

## Local setup

1. Copy `.env.example` to `.env` and replace secrets.
2. Install dependencies:

```bash
npm install
```

3. Start PostgreSQL:

```bash
docker compose up postgres
```

4. Generate Prisma client, migrate, and seed:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

5. Run the app:

```bash
npm run dev
```

Web: `http://localhost:3000`
API: `http://localhost:4000/health`

## Production notes

- Replace legal page placeholder copy with counsel-approved policies.
- Configure Razorpay live keys and webhook signature validation before launch.
- Add S3 adapter behind the upload service when moving beyond local uploads.
- Put Nginx behind TLS termination or add Certbot/managed certificates.
- Run `npm run lint`, `npm run build`, and an end-to-end checkout smoke test before deployment.
