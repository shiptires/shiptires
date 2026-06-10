import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const logoPath = join(process.cwd(), "public", "logo.png");
  const logoData = await readFile(logoPath);
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: "12px",
        }}
      >
        <img
          src={logoBase64}
          width={60}
          height={60}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { ...size }
  );
}
