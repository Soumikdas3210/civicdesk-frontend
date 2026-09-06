import { cookies } from "next/headers";

const COOKIE = "civicdesk_token";

export async function POST(req: Request) {
  const res = await fetch(`${process.env.API_URL}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(await req.json()),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return Response.json(data ?? { message: "Registration failed" }, {
      status: res.status,
    });
  }

  if (data?.accessToken) {
    (await cookies()).set(COOKIE, data.accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return Response.json({ ok: true });
}