import styles from "./styles.module.scss";

type AvatarProps = {
  /** Name or email; the first character is shown when there's no image */
  name?: string | null;
  /** Profile picture URL, e.g. from Google, GitHub, or Discord */
  image?: string | null;
  size?: "sm" | "md";
  className?: string;
};

export default function Avatar({ name, image, size = "md", className }: AvatarProps) {
  return (
    <span className={`${styles.avatar} ${styles[size]} ${className ?? ""}`} aria-hidden="true">
      {image ? (
        // Plain <img>: provider avatar hosts vary, so next/image would need each domain configured
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className={styles.image} referrerPolicy="no-referrer" />
      ) : (
        name?.[0]?.toUpperCase() ?? ""
      )}
    </span>
  );
}
