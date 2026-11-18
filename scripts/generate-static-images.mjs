import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

const publicDirectory = join(process.cwd(), "public");
const outputDirectory = join(publicDirectory, "images", "generated");
const portraitWidths = [150, 300, 500];
const logoWidths = [160, 320];

const portraits = [
  {
    input: join(publicDirectory, "lara_canro_imagem.jpg"),
    name: "lara-canro",
  },
  {
    input: join(publicDirectory, "matheus_geambastiane_imagem.jpg"),
    name: "matheus-geambastiane",
  },
];

async function generatePortrait({ input, name }) {
  await Promise.all(
    portraitWidths.flatMap((width) => {
      const height = Math.round((width * 5) / 4);
      const image = sharp(input)
        .rotate()
        .resize({ width, height, fit: "cover", position: "centre" });

      return [
        image
          .clone()
          .avif({ quality: 55, effort: 4 })
          .toFile(join(outputDirectory, `${name}-${width}.avif`)),
        image
          .clone()
          .webp({ quality: 78, effort: 5 })
          .toFile(join(outputDirectory, `${name}-${width}.webp`)),
        image
          .clone()
          .jpeg({ quality: 82, progressive: true, mozjpeg: true })
          .toFile(join(outputDirectory, `${name}-${width}.jpg`)),
      ];
    })
  );
}

async function generateLogo() {
  const input = join(publicDirectory, "Veli_logo azul medio.png");

  await Promise.all(
    logoWidths.flatMap((width) => {
      const image = sharp(input).resize({ width, withoutEnlargement: true });

      return [
        image
          .clone()
          .webp({ lossless: true, effort: 6 })
          .toFile(join(outputDirectory, `veli-logo-${width}.webp`)),
        image
          .clone()
          .png({ compressionLevel: 9, effort: 10 })
          .toFile(join(outputDirectory, `veli-logo-${width}.png`)),
      ];
    })
  );
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all([...portraits.map(generatePortrait), generateLogo()]);

console.log(
  `Generated static image variants in ${outputDirectory.replace(`${process.cwd()}/`, "")}`
);
