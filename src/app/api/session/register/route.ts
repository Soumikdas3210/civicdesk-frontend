

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

  

  return Response.json({ ok: true});
}