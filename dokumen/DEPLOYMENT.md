# Deployment Guide

## Local Development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

## Production Build

1. Ensure environment variables are set.
2. Run `npm run build`.
3. Run `npm run start`.

## Suggested Hosting

- Vercel for fastest frontend deployment
- VPS or container deployment later when backend services are introduced

## Required Environment Variables

- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`

## Future Deployment Notes

- Add auth secrets only when auth strategy is finalized
- Add database and storage secrets only when backend integration exists
- Add CI pipeline to run lint, typecheck, and build on every push
