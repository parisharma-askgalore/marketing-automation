export async function GET() {
  const response = await fetch(
    "https://marketing-automation-mkei.onrender.com/webhook/get-projects",
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }
  );

  const data = await response.json();
  return Response.json(data);
}
