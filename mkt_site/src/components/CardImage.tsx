import { useState } from "react";
import { getCardImage, getCardImageSrcSet, type CardId, type ImageSize } from "@mhsalves/yugioh-fb-catalog";

/**
 * A card's picture, linked from the Yu-Gi-Oh! Wiki (spec 08 I-4). Returns null when the card has no
 * image or it fails to load, so the caller's styled frame shows instead. The wiki's CDN answers 403
 * without a Referer, so this must never set referrerPolicy="no-referrer".
 */
export default function CardImage({ id, size, sizes }: { id: CardId; size: ImageSize; sizes?: string }) {
    const [failed, setFailed] = useState(false);
    const image = getCardImage(id, size);
    if (!image || failed) return null;

    // A screenshot of the game's card screen (Yugipedia): show only the card's rectangle of it.
    const { crop } = image;
    if (crop) {
        const percent = (value: number, of: number) => `${(value / of) * 100}%`;
        return (
            <span className="card-image card-image--crop" style={{ aspectRatio: `${crop.width} / ${crop.height}` }}>
                <img
                    src={image.url}
                    width={image.width}
                    height={image.height}
                    style={{
                        width: percent(image.width, crop.width),
                        left: percent(-crop.x, crop.width),
                        top: percent(-crop.y, crop.height),
                    }}
                    loading={size === "thumb" ? "lazy" : "eager"}
                    decoding="async"
                    alt=""
                    onError={() => setFailed(true)}
                />
            </span>
        );
    }

    return (
        <img
            className="card-image"
            src={image.url}
            srcSet={sizes ? getCardImageSrcSet(id) : undefined}
            sizes={sizes}
            width={image.width}
            height={image.height}
            loading={size === "thumb" ? "lazy" : "eager"}
            decoding="async"
            alt=""
            onError={() => setFailed(true)}
        />
    );
}
