const ENDPOINT =
  process.env.NEXT_PUBLIC_OPTIMIZELY_GRAPH_ENDPOINT ??
  "https://cg.optimizely.com/content/v2?auth=YOUR_KEY";

export async function graphQL<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`GraphQL HTTP ${res.status}:`, errorText);
    throw new Error(`GraphQL HTTP ${res.status}: ${errorText}`);
  }

  const json = await res.json();
  console.log("GraphQL response:", JSON.stringify(json, null, 2));
  if (json.errors?.length) {
    console.error("GraphQL errors:", json.errors);
    throw new Error(json.errors.map((e: any) => e.message).join("\n"));
  }

  return json.data as T;
}
