export const APP_CONFIG = {
  api: {
    suitsbooks: "",
    events_dms: "",
  },
  athena: {
    db_api_url:
      process.env.NEXT_PUBLIC_ATHENA_DB_API_URL ?? "https://athena-db.com",
    standard_client:
      process.env.NEXT_PUBLIC_ATHENA_STANDARD_CLIENT ?? "railway_direct",
    api_key: process.env.NEXT_PUBLIC_ATHENA_API_KEY ?? "",
  },
};

export const S3_CLIENT_CONFIG = {
  bucket: process.env.NEXT_PUBLIC_ATHENA_UPLOAD_BUCKET ?? "suitsconnect",
  region: "auto",
};
