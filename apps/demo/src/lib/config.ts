export const APP_CONFIG = {
  api: {
    suitsbooks: "https://demo-api.example.com",
    events_dms: "https://demo-api.example.com/events",
  },
  athena: {
    db_api_url: "https://athena-db.com",
    standard_client: "railway_direct",
    api_key: process.env.NEXT_PUBLIC_ATHENA_API_KEY ?? "",
    storage_s3_id: process.env.NEXT_PUBLIC_ATHENA_STORAGE_S3_ID ?? "",
  },
};

export const S3_CLIENT_CONFIG = {
  bucket: "demo-bucket",
  region: "us-east-1",
};
