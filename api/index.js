// The single serverless entry point. vercel.json rewrites /api/* here.
import { handle } from '../server/index.js';

export const GET = handle;
export const POST = handle;
