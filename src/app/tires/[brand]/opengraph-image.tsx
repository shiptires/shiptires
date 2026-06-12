import { ImageResponse } from "next/og";
import { getBrandBySlug, getModelsByBrand } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Ship.Tires brand page";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: brandSlug } = await params;
  const brandRow = await getBrandBySlug(brandSlug);
  if (!brandRow) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#141414",
            color: "#fff",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          Ship.Tires
        </div>
      ),
      size
    );
  }

  const models = await getModelsByBrand(brandSlug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#141414",
          padding: 60,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 28,
              color: "#FF6B00",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Ship.Tires
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#ffffff",
              marginTop: 20,
              lineHeight: 1.1,
            }}
          >
            {brandRow.make_name} Tires
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#9ca3af",
              marginTop: 16,
            }}
          >
            {models.length} models &bull; {brandRow.tire_count?.toLocaleString()} sizes &bull; Free shipping
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          {["In Stock", "Free Shipping", "All 50 States"].map((tag) => (
            <div
              key={tag}
              style={{
                backgroundColor: "rgba(255, 107, 0, 0.15)",
                border: "1px solid rgba(255, 107, 0, 0.4)",
                borderRadius: 9999,
                padding: "8px 24px",
                fontSize: 22,
                color: "#FF6B00",
                fontWeight: 600,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
