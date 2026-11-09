export {};

declare global {
  interface CustomJwtSessionClaims {
    role?: "authenticated";
    org_name?: string;
  }
}
