import { useEffect, useId, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

interface SheetProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}

/**
 * A dialog (spec 10 F-4): full screen on phones, a centered window from md up. Built on <dialog> with showModal(),
 * so focus stays inside and returns afterwards, Esc closes it and the page behind is inert. The element marked
 * `data-autofocus` gets the focus when it opens. Back does not close it yet (the filter sheet does not either).
 */
export default function Sheet({ open, title, onClose, children }: SheetProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
            dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
        }
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={ref}
            className="sheet"
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            // A click on the backdrop lands on the <dialog> itself.
            onClick={(event) => event.target === event.currentTarget && onClose()}
        >
            <div className="sheet__head">
                <h2 id={titleId}>{title}</h2>
                <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
                    <CloseIcon />
                </button>
            </div>
            <div className="sheet__body">{open && children}</div>
        </dialog>
    );
}
