This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## MongoDB Setup

Copy `.env.example` to `.env.local`, then set `MONGODB_URI` to a local MongoDB instance or MongoDB Atlas connection string. Set `AUTH_SECRET` to a random value of at least 32 characters. For example, generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`MONGODB_DB` is optional and defaults to `folio`. Restart the dev server after changing environment variables. Create an account in the app to save resumes to your MongoDB database. Passwords are hashed, sessions use HTTP-only cookies, and resume API operations are scoped to the signed-in account.

## Project Structure

- `app/page.tsx` is the route entry point.
- `app/components/resume-builder.tsx` contains the interactive editor and live preview.
- `app/components/auth-form.tsx` contains the sign-in and registration UI.
- `app/api/auth/` contains registration, login, session, and logout endpoints.
- `app/api/resumes/` contains account-scoped resume CRUD endpoints.
- `lib/` contains MongoDB connection, session, and shared resume validation code.
- `app/globals.css` contains global, editor, login, responsive, and print styles.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
