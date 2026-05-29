import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { storeLogoPath } from "@/lib/brand";

export async function brandIconImageResponse(
  canvasSize: number,
): Promise<ImageResponse> {
  const file = await readFile(
    join(process.cwd(), "public", storeLogoPath.replace(/^\//, "")),
  );
  const base64 = file.toString("base64");

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
        }}
      >
        <img
          src={`data:image/png;base64,${base64}`}
          alt=""
          width={781}
          height={217}
          style={{
            maxWidth: "92%",
            maxHeight: "72%",
            objectFit: "contain",
          }}
        />
      </div>
    ),
    { width: canvasSize, height: canvasSize },
  );
}
