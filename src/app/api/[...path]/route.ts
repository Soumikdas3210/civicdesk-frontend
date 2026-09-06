import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const BACKEND = process.env.API_URL!;
const BLOCKED = ["auth/login", "auth/register"];

async function forward(req: NextRequest, path: string[]) {
  const joined = path.join("/");

  if (BLOCKED.includes(joined)) {
    return Response.json({ message: "Not available" }, { status: 404 });
  }

  const token = (await cookies()).get("civicdesk_token")?.value;

  const headers = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  const res = await fetch(`${BACKEND}/${joined}${req.nextUrl.search}`, {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const out = new Headers();
  for (const h of ["content-type", "content-disposition", "content-length"]) {
    const v = res.headers.get(h);
    if (v) out.set(h, v);
  }

  return new Response(res.body, { status: res.status, headers: out });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(r: NextRequest, c: Ctx) {
  return forward(r, (await c.params).path);
}
export async function POST(r: NextRequest, c: Ctx) {
  return forward(r, (await c.params).path);
}
export async function PATCH(r: NextRequest, c: Ctx) {
  return forward(r, (await c.params).path);
}
export async function PUT(r: NextRequest, c: Ctx) {
  return forward(r, (await c.params).path);
}
export async function DELETE(r: NextRequest, c: Ctx) {
  return forward(r, (await c.params).path);
}