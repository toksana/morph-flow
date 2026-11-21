export const DATABASE_URL_KEY = 'DATABASE_URL';

/** Reads the Postgres connection string, failing loudly instead of connecting to nothing. */
export const readDatabaseUrl = (env: Readonly<Record<string, string | undefined>>): string => {
  const url = env[DATABASE_URL_KEY]?.trim() ?? '';
  if (url === '') {
    throw new Error(`${DATABASE_URL_KEY} is not set. Run \`vercel env pull .env.local\`.`);
  }
  return url;
};
