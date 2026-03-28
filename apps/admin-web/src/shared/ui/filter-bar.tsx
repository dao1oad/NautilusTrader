import { useI18n } from "../i18n/use-i18n";

type Props = {
  inputId: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
};

export function FilterBar({ inputId, label, onChange, placeholder, value }: Props) {
  const { t } = useI18n();

  return (
    <section
      style={{
        alignItems: "end",
        background: "rgba(6, 12, 20, 0.82)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "16px",
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        justifyContent: "space-between",
        padding: "14px 16px"
      }}
    >
      <div style={{ display: "grid", flex: "1 1 240px", gap: "6px", minWidth: 0 }}>
        <label className="section-panel-eyebrow" htmlFor={inputId}>
          {label}
        </label>
        <p className="section-panel-copy">{t("filters.helper")}</p>
      </div>
      <div style={{ display: "flex", flex: "1 1 280px", justifyContent: "flex-end" }}>
        <input
          id={inputId}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder={placeholder}
          style={{
            background: "rgba(8, 16, 27, 0.92)",
            border: "1px solid var(--border-strong)",
            borderRadius: "12px",
            color: "var(--text-strong)",
            colorScheme: "dark",
            padding: "10px 14px",
            width: "100%"
          }}
          type="search"
          value={value}
        />
      </div>
    </section>
  );
}
