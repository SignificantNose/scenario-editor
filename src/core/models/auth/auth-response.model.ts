import * as v from 'valibot';
export const AuthResponseSchema = v.object({
  expires_at: v.number(),
  token: v.string(),
});
export type AuthResponse = v.InferInput<typeof AuthResponseSchema>;
