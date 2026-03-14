import { Hono } from "hono";
import { z } from "zod";
import { AuthService } from "./auth.service";

const app = new Hono();

const registerSchema = z.object({
  email: z.email(),
  username: z.string().min(3),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

app.post("/register", async (c) => {
  const body = await c.req.json();
  const result = registerSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: z.flattenError(result.error).fieldErrors }, 400);
  }

  try {
    const { token, user } = await AuthService.register(result.data);
    // 不直接返回密码hash
    const { password:_, ...safeUser } = user
    return c.json({ token, user: safeUser }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return c.json({ error: message }, 409);
  }
});

app.post("/login", async (c) => {
  const body = await c.req.json();
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return c.json({ error: z.flattenError(result.error).fieldErrors }, 400);
  }

  try {
    const { token, user } = await AuthService.login(result.data);
    const { password:_, ...safeUser } = user
    return c.json({ token, user: safeUser }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return c.json({ error: message }, 401);
  }
});

export default app;
