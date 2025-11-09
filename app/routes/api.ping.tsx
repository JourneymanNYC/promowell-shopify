export const loader = () =>
  new Response(JSON.stringify({ ok: true, route: "/api/ping" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });


