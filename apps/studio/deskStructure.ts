import { StructureResolver } from "sanity/structure";
import { DocumentsIcon, UsersIcon, TagIcon } from "@sanity/icons";
import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";

export const deskStructure: StructureResolver = (S, context) =>
  S.list()
    .title("Content")
    .items([
      // --- BLOG ---
      S.listItem()
        .title("Blog")
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title("Blog")
            .items([
              S.documentTypeListItem("post").title("Posts"),
              S.documentTypeListItem("author").title("Authors"),
              S.documentTypeListItem("category").title("Categories"),
            ])
        ),

      S.divider(),

      // --- MAIN CONTENT ---
      S.documentTypeListItem("author40k").title("40k Authors").icon(UsersIcon),

      S.listItem()
        .title("Factions")
        .icon(TagIcon)
        .child(
          S.list()
            .title("Factions")
            .items([
              // Make the main "Groups" reorderable
              orderableDocumentListDeskItem({
                type: "factionGroup40k",
                title: "40k Faction Groups",
                icon: TagIcon,
                S,
                context,
              }),

              // Make the main "Factions" reorderable
              orderableDocumentListDeskItem({
                type: "faction40k",
                title: "40k Factions (All)",
                icon: UsersIcon,
                S,
                context,
              }),

              S.divider(),

              // --- Factions by Group ---
              S.listItem()
                .title("Factions by Group")
                .icon(TagIcon)
                .child(
                  S.documentTypeList("factionGroup40k")
                    .title("Factions by Group")
                    .child((groupId) =>
                      S.list()
                        .title("Factions")
                        .items([
                          orderableDocumentListDeskItem({
                            type: "faction40k",
                            title: "Factions",
                            filter:
                              '_type == "faction40k" && references($groupId)',
                            params: { groupId },
                            S,
                            context,
                          }),
                        ])
                    )
                ),
            ])
        ),
    ]);
