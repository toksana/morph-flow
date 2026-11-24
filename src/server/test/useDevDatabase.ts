import { readDevDatabaseUrl } from './devDatabaseUrl';

/**
 * Points the db tests at the Neon dev branch, and only there: the dev URL overrides any value
 * already in the environment, so a shell that exports the production URL cannot leak into a run.
 */
process.env.DATABASE_URL = readDevDatabaseUrl();
