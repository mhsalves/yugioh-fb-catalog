import { images, imageSources } from "../data/catalog.generated";
import type { CardId } from "../data/card-types";
import type { IImageCrop } from "../data/relation-types";

/**
 * Card image links (spec 08 I-3). The catalog ships URLs, never images: they point at the
 * Yu-Gi-Oh! Wiki's CDN (Fandom), which requires a `Referer` (web pages send one by default; other
 * clients that download the images must send their own), or at Yugipedia's media server for the
 * cards Fandom has no picture of.
 */

/** "thumb" is 160 px wide (WebP from Fandom's CDN), "full" the original (about 300 px). */
export type ImageSize = "thumb" | "full";

export interface CardImage {
    url: string;
    /** Size of the image at `url`. */
    width: number;
    height: number;
    /**
     * Set when only part of the image is the card (Yugipedia's screenshots of the game's card screen):
     * show this rectangle of the `width` × `height` image, for example with a clipping container.
     */
    crop?: IImageCrop;
    /** Where the image is hosted, for attribution: the source's name and the image's file page. */
    source: { name: string; pageUrl: string };
}

export const THUMB_WIDTH = 160;
/** Size of a Forbidden Memories card image, used when an entry has no width and height. */
export const DEFAULT_IMAGE_SIZE = { width: 300, height: 423 };

const byCard = new Map(images.map((image) => [image.card, image]));

/** Fandom resizes when "/scale-to-width-down/<px>" follows "revision/latest"; the "?cb=" revision stays. */
const scaled = (url: string, width: number) =>
    url.replace("/revision/latest", `/revision/latest/scale-to-width-down/${width}`);

/** The file name in a wiki image URL: the segment after the md5 folders (…/<h>/<hh>/<file>). */
const fileName = (url: string) => decodeURIComponent(/\/[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/.exec(url)?.[1] ?? "");

/** A card's image, or undefined when the card has none yet (show a placeholder). */
export const getCardImage = (id: CardId, size: ImageSize = "full"): CardImage | undefined => {
    const image = byCard.get(id);
    if (!image) return undefined;
    const width = image.width ?? DEFAULT_IMAGE_SIZE.width;
    const height = image.height ?? DEFAULT_IMAGE_SIZE.height;
    const source = imageSources[image.source];
    const pageUrl = `${source.filePageUrl}${fileName(image.url)}`;
    // Only Fandom's CDN resizes, and a cropped screenshot is already small.
    const thumb = size === "thumb" && !image.crop && image.url.includes("/revision/latest") && width > THUMB_WIDTH;
    return {
        url: thumb ? scaled(image.url, THUMB_WIDTH) : image.url,
        width: thumb ? THUMB_WIDTH : width,
        height: thumb ? Math.round((height * THUMB_WIDTH) / width) : height,
        ...(image.crop && { crop: image.crop }),
        source: { name: source.name, pageUrl },
    };
};

/** A `srcset` with the thumbnail and the full image, for `<img srcset sizes>`; undefined for cropped images. */
export const getCardImageSrcSet = (id: CardId) => {
    const thumb = getCardImage(id, "thumb");
    const full = getCardImage(id, "full");
    if (!thumb || !full || full.crop) return undefined;
    return thumb.width < full.width
        ? `${thumb.url} ${thumb.width}w, ${full.url} ${full.width}w`
        : `${full.url} ${full.width}w`;
};
