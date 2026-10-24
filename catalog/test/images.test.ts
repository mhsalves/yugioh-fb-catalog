import { describe, expect, it } from "vitest";

import { getCardImage, getCardImageSrcSet, getCardList } from "../src";

/** The image API over the real catalog/data/images.json (spec 08 I-3). */

describe("getCardImage", () => {
    it("returns the stored Fandom URL and size for the full image", () => {
        expect(getCardImage(425)).toEqual({
            url: "https://static.wikia.nocookie.net/yugioh/images/e/e1/ThunderDragon-FMR-EN-VG.png/revision/latest?cb=20131221161931",
            width: 300,
            height: 423,
            source: {
                name: "Yu-Gi-Oh! Wiki (Fandom)",
                pageUrl: "https://yugioh.fandom.com/wiki/File:ThunderDragon-FMR-EN-VG.png",
            },
        });
    });

    it("asks Fandom's CDN for a 160 px thumbnail, keeping the ?cb= revision", () => {
        expect(getCardImage(425, "thumb")).toMatchObject({
            url: "https://static.wikia.nocookie.net/yugioh/images/e/e1/ThunderDragon-FMR-EN-VG.png/revision/latest/scale-to-width-down/160?cb=20131221161931",
            width: 160,
            height: 226,
        });
    });

    it("returns Yugipedia's card screen with the crop that is the card, at any size", () => {
        const full = getCardImage(580);
        expect(full).toEqual({
            url: "https://ms.yugipedia.com/e/ee/PatrolRobo-FMR-NA-VG.png",
            width: 320,
            height: 240,
            crop: { x: 4, y: 6, width: 136, height: 192 },
            source: { name: "Yugipedia", pageUrl: "https://yugipedia.com/wiki/File:PatrolRobo-FMR-NA-VG.png" },
        });
        expect(getCardImage(580, "thumb")).toEqual(full);
    });

    it("covers every card, and returns undefined for an id outside the catalog", () => {
        expect(getCardList().filter((card) => !getCardImage(card.id))).toEqual([]);
        expect(getCardImage(9999)).toBeUndefined();
    });
});

describe("getCardImageSrcSet", () => {
    it("lists the thumbnail and the full image", () => {
        expect(getCardImageSrcSet(425)).toBe(
            "https://static.wikia.nocookie.net/yugioh/images/e/e1/ThunderDragon-FMR-EN-VG.png/revision/latest/scale-to-width-down/160?cb=20131221161931 160w, " +
                "https://static.wikia.nocookie.net/yugioh/images/e/e1/ThunderDragon-FMR-EN-VG.png/revision/latest?cb=20131221161931 300w",
        );
    });

    it("has no srcset for a cropped image or a missing one", () => {
        expect(getCardImageSrcSet(580)).toBeUndefined();
        expect(getCardImageSrcSet(9999)).toBeUndefined();
    });
});
