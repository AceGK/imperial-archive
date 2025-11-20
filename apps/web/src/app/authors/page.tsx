// app/authors/page.tsx
import PageHeader from "@/components/modules/PageHeader";
import Authors from "@/components/modules/SearchContent/Authors";

export const revalidate = 60;

export default async function AuthorsPage() {
  return (
    <main>
      <PageHeader
        title="Authors"
        subtitle="Discover the writers who bring the grim darkness of the far future to life across the Black Library."
        align="center"
        strongOverlay
        height="sm"
        priority
        image="/images/imperial-library-erik-nykvist.jpg"
        credit="Imperial Library by Erik Nykvist"
      />

      <Authors />
    </main>
  );
}