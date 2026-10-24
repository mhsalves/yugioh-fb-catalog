import { useEffect, useId } from "react";
import { GUARDIAN_STARS, MONSTER_TYPES, type CardQuery, type NumberRange } from "@mhsalves/yugioh-fm-catalog";
import { countFilters, hasMonsterFilters, monstersSelected, type RangeField } from "../catalogUrl";
import { CloseIcon } from "./icons";

interface FiltersProps {
    query: CardQuery;
    onChange: (query: CardQuery) => void;
    total: number;
    /** Phones show the panel as a full-screen sheet (spec 09 C-2). */
    open: boolean;
    onClose: () => void;
}

const asList = <T,>(value: T | T[] | undefined): T[] =>
    value === undefined ? [] : Array.isArray(value) ? value : [value];

function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Toggle buttons for one list field of CardQuery; options come from the library's enums. */
function ChipGroup<T extends string>(props: {
    legend: string;
    options: readonly T[];
    selected: T[];
    onChange: (selected: T[]) => void;
    disabled?: boolean;
}) {
    return (
        <fieldset className="filter-group" disabled={props.disabled}>
            <legend>{props.legend}</legend>
            <div className="chips">
                {props.options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        className="chip"
                        aria-pressed={props.selected.includes(option)}
                        onClick={() => props.onChange(toggle(props.selected, option))}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </fieldset>
    );
}

function RangeInput(props: {
    label: string;
    range?: NumberRange;
    onChange: (range: NumberRange) => void;
    max?: number;
}) {
    const id = useId();
    const set = (side: "min" | "max", value: string) =>
        props.onChange({ ...props.range, [side]: value === "" ? undefined : Number(value) });

    return (
        <div className="range" role="group" aria-labelledby={id}>
            <span id={id} className="range__label">
                {props.label}
            </span>
            <input
                type="number"
                inputMode="numeric"
                min={0}
                max={props.max}
                placeholder="Min"
                aria-label={`${props.label} minimum`}
                value={props.range?.min ?? ""}
                onChange={(event) => set("min", event.target.value)}
            />
            <span aria-hidden="true">–</span>
            <input
                type="number"
                inputMode="numeric"
                min={0}
                max={props.max}
                placeholder="Max"
                aria-label={`${props.label} maximum`}
                value={props.range?.max ?? ""}
                onChange={(event) => set("max", event.target.value)}
            />
        </div>
    );
}

export default function Filters({ query, onChange, total, open, onClose }: FiltersProps) {
    const monstersEnabled = monstersSelected(query);
    const otherTypesSelected = asList(query.cardType).some((type) => type !== "Monster");

    const update = (patch: Partial<CardQuery>) => onChange({ ...query, ...patch });
    const setRange = (field: RangeField) => (range: NumberRange) => update({ [field]: range });

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    return (
        <aside
            id="catalog-filters"
            className="filters"
            data-open={open}
            aria-label="Filters"
            role={open ? "dialog" : undefined}
            aria-modal={open ? true : undefined}
        >
            <div className="filters__head">
                <h2>Filters</h2>
                <button type="button" className="icon-button" aria-label="Close filters" onClick={onClose}>
                    <CloseIcon />
                </button>
            </div>

            <label className="checkbox">
                <input
                    type="checkbox"
                    checked={query.includeDescription ?? false}
                    onChange={(event) => update({ includeDescription: event.target.checked || undefined })}
                />
                Also search descriptions
            </label>

            {/* Outside the fieldset: a disabled fieldset disables the buttons inside it too. */}
            {!monstersEnabled && (
                <div className="filters__notice">
                    <p>Monster type, guardian star, level, ATK and DEF need “Monster” selected in “By type”.</p>
                    <button
                        type="button"
                        className="button button--small"
                        onClick={() => update({ cardType: [...asList(query.cardType), "Monster"] })}
                    >
                        Filter monsters
                    </button>
                </div>
            )}

            <fieldset className="filter-section" disabled={!monstersEnabled}>
                <legend>Monster</legend>
                {monstersEnabled && (
                    <p className="hint">
                        {otherTypesSelected && hasMonsterFilters(query)
                            ? "Monster filters hide the other card types."
                            : "These filters apply to monsters only."}
                    </p>
                )}
                <ChipGroup
                    legend="Monster type"
                    options={MONSTER_TYPES}
                    selected={asList(query.monsterType)}
                    onChange={(monsterType) => update({ monsterType })}
                />
                <ChipGroup
                    legend="Guardian star"
                    options={GUARDIAN_STARS}
                    selected={asList(query.guardianStar)}
                    onChange={(guardianStar) => update({ guardianStar })}
                />
                <RangeInput label="Level" range={query.level} onChange={setRange("level")} max={12} />
                <RangeInput label="ATK" range={query.attack} onChange={setRange("attack")} />
                <RangeInput label="DEF" range={query.defense} onChange={setRange("defense")} />
            </fieldset>

            <fieldset className="filter-section">
                <legend>Password</legend>
                <RangeInput label="Cost" range={query.cost} onChange={setRange("cost")} />
            </fieldset>

            <div className="filters__actions">
                <button
                    type="button"
                    className="button button--ghost"
                    disabled={countFilters(query) === 0}
                    onClick={() => onChange({ text: query.text, cardType: query.cardType, sort: query.sort })}
                >
                    Clear filters
                </button>
                <button type="button" className="button filters__show" onClick={onClose}>
                    Show {total} {total === 1 ? "card" : "cards"}
                </button>
            </div>
        </aside>
    );
}
