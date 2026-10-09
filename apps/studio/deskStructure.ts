import type { Collection, StructureResolver } from "sanity/structure";
import { DocumentsIcon, UsersIcon, TagIcon, ClockIcon, HelpCircleIcon } from "@sanity/icons";
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
      S.documentTypeListItem("book40k").title("40k Books").icon(DocumentsIcon),
      S.documentTypeListItem("series40k").title("40k Series").icon(TagIcon),

     orderableDocumentListDeskItem({
        type: 'era40k',
        title: '40k Eras',
        icon: ClockIcon,
        S,
        context,
      }),

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
              // pick a group to see and reorder its factions; the group opens
              // the sortable list directly (no in-between "Factions" column)
              S.listItem()
                .title("Factions by Group")
                .icon(TagIcon)
                .child(
                  S.documentTypeList("factionGroup40k")
                    .title("Factions by Group")
                    .defaultOrdering([{ field: "orderRank", direction: "asc" }])
                    .child((groupId) =>
                      orderableDocumentListDeskItem({
                        type: "faction40k",
                        title: "Factions",
                        filter: '_type == "faction40k" && references($groupId)',
                        params: { groupId },
                        S,
                        context,
                      // the plugin's child is always its sortable list component
                      }).child as Collection
                    )
                ),
            ])
        ),

      S.divider(),

      // --- FAQ ---
      S.listItem()
        .title("FAQs")
        .icon(HelpCircleIcon)
        .child(
          S.list()
            .title("FAQs")
            .items([
              orderableDocumentListDeskItem({
                type: "faq",
                title: "FAQs (All)",
                icon: HelpCircleIcon,
                S,
                context,
              }),

              orderableDocumentListDeskItem({
                type: "faqCategory",
                title: "FAQ Categories",
                icon: TagIcon,
                S,
                context,
              }),

              S.divider(),

              // pick a category to see and reorder its questions; the category
              // opens the sortable list directly (no in-between "FAQs" column)
              S.listItem()
                .title("FAQs by Category")
                .icon(TagIcon)
                .child(
                  S.documentTypeList("faqCategory")
                    .title("FAQs by Category")
                    .defaultOrdering([{ field: "orderRank", direction: "asc" }])
                    .child((categoryId) =>
                      orderableDocumentListDeskItem({
                        type: "faq",
                        title: "FAQs",
                        filter: '_type == "faq" && references($categoryId)',
                        params: { categoryId },
                        S,
                        context,
                      // the plugin's child is always its sortable list component
                      }).child as Collection
                    )
                ),
            ])
        ),
    ]);
