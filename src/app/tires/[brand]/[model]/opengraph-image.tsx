import { ImageResponse } from "next/og";
import { getModelBySlug, tiresToModel } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Ship.Tires product page";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand: brandSlug, model: modelSlug } = await params;
  const data = await getModelBySlug(brandSlug, modelSlug);

  if (!data) {
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

  const model = tiresToModel(data.model, data.tires, data.brand);
  const hasPrice = model.priceRange[0] > 0;

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
              fontSize: 24,
              color: "#FF6B00",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {data.brand}
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: "#ffffff",
              marginTop: 16,
              lineHeight: 1.1,
            }}
          >
            {model.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              marginTop: 20,
            }}
          >
            {hasPrice ? (
              <>
                <span style={{ fontSize: 48, fontWeight: 700, color: "#ffffff" }}>
                  From ${model.priceRange[0]}
                </span>
                <span style={{ fontSize: 28, color: "#9ca3af" }}>/tire</span>
              </>
            ) : (
              <span style={{ fontSize: 36, color: "#FF6B00", fontWeight: 700 }}>
                Call for Pricing
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#9ca3af",
              marginTop: 12,
            }}
          >
            {model.sizes.length} sizes &bull; Free shipping &bull; ship.tires
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          {[
            model.type.charAt(0).toUpperCase() + model.type.slice(1).replace("-", " "),
            "In Stock",
            "Free Shipping",
          ].map((tag) => (
            <div
              key={tag}
              style={{
                backgroundColor: "rgba(255, 107, 0, 0.15)",
                border: "1px solid rgba(255, 107, 0, 0.4)",
                borderRadius: 9999,
                padding: "8px 24px",
                fontSize: 20,
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
