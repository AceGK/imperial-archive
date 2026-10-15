import Button from "@/components/ui/Button";
import PlusIcon from "@/components/icons/plus.svg";
import styles from "./styles.module.scss";

// Every Button variant, in every size and state, for visual QA. Hover and tab
// through them to check the hover and focus styles too.

type Variant = NonNullable<React.ComponentProps<typeof Button>["variant"]>;

const VARIANTS: { variant: Variant; use: string }[] = [
  { variant: "primary", use: "Main action on a page or form (Browse books, Sign in)" },
  { variant: "secondary", use: "Gold text; corner marks on hover (\"View all\", Open your tracker, Create account)" },
  { variant: "tertiary", use: "Same frame, plain text that turns gold on hover (beside a primary button)" },
  { variant: "outline-primary", use: "Gold outline, fills gold on hover" },
  { variant: "destructive", use: "Irreversible actions; on hover a red tint with red corner marks" },
  { variant: "ghost", use: "No fill or border; text turns gold with corner marks on hover (nav toggles)" },
  { variant: "link", use: "Inline text link styled as an action" },
];

const SIZES = ["sm", "md", "lg"] as const;

export default function ButtonsTestPage() {
  return (
    <main>
      <div className={`container ${styles.page}`}>
        <h1>Buttons</h1>
        <p className={styles.intro}>
          Every variant of <code>components/ui/Button</code>. Hover each one, and press Tab to check its focus style.
          Switch the theme in the nav to see light mode.
        </p>

        <div className={styles.table} role="table" aria-label="Button variants">
          <div className={`${styles.row} ${styles.head}`} role="row">
            <span role="columnheader">Variant</span>
            {SIZES.map((size) => (
              <span key={size} role="columnheader">
                {size}
              </span>
            ))}
            <span role="columnheader">icon</span>
            <span role="columnheader">disabled</span>
            <span role="columnheader">as link</span>
          </div>

          {VARIANTS.map(({ variant, use }) => (
            <div key={variant} className={styles.row} role="row">
              <div className={styles.name} role="rowheader">
                <code>{variant}</code>
                <span>{use}</span>
              </div>
              {SIZES.map((size) => (
                <div key={size} role="cell">
                  <Button variant={variant} size={size}>
                    Button
                  </Button>
                </div>
              ))}
              <div role="cell">
                <Button variant={variant} size="icon" title={`${variant} icon button`}>
                  <PlusIcon className={styles.icon} aria-hidden="true" />
                </Button>
              </div>
              <div role="cell">
                <Button variant={variant} disabled>
                  Disabled
                </Button>
              </div>
              <div role="cell">
                <Button variant={variant} href="/test/buttons">
                  Link
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
