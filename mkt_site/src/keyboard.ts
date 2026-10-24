/** The Cards page search box, which the "/" shortcut focuses. */
export const CATALOG_SEARCH_ID = "catalog-search";

/** Keys typed into a field belong to the field, not to page shortcuts. */
export const isTyping = (target: EventTarget | null) =>
    target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));
