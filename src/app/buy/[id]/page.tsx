import { notFound } from "next/navigation";
import { getTireById, toSlug } from "@/lib/db";
import { getSitePrice } from "@/lib/pricing";
import BuyClient from "./BuyClient";
import type { CartItem } from "@/lib/types";

export default async function BuyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = parseInt(rawId);
  if (isNaN(id)) notFound();

  const tire = await getTireById(id);
  if (!tire) notFound();

  const price = await getSitePrice(tire.id, tire.price_map);
  if (price <= 0) notFound();

  const size =
    tire.width && tire.aspect_ratio && tire.rim_size
      ? `${tire.width}/${tire.aspect_ratio}R${tire.rim_size}`
      : tire.name;

  const brandSlug = toSlug(tire.make_name);
  const modelSlug = toSlug(tire.model_name);
  const productUrl = `/tires/${brandSlug}/${modelSlug}`;

  // Resolve best image
  const sources = [tire.local_thumbnail, tire.thumbnail_url, tire.image_0100_url];
  let imageUrl: string | null = null;
  for (const src of sources) {
    if (!src) continue;
    if (src.startsWith("images/") || src.startsWith("images\\")) {
      imageUrl = `https://ship.tires/${src.replace(/\\/g, "/")}`;
      break;
    }
    if (src.startsWith("http")) {
      imageUrl = src;
      break;
    }
  }

  const item: CartItem = {
    brand: tire.make_name,
    brandSlug,
    model: tire.model_name,
    modelSlug,
    size,
    price,
    quantity: 1,
    loadIndex: parseInt(tire.load_rating ?? "0") || 0,
    speedRating: tire.speed_rating ?? "",
  };

  return (
    <BuyClient
      item={item}
      brand={tire.make_name}
      model={tire.model_name}
      size={size}
      price={price}
      season={tire.season || tire.terrain || ""}
      imageUrl={imageUrl}
      productUrl={productUrl}
    />
  );
}
