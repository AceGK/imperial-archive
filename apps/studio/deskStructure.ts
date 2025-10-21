// /deskStructure.ts
import {StructureResolver} from 'sanity/structure'
import {DocumentsIcon, UsersIcon, TagIcon} from '@sanity/icons'

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // --- BLOG GROUP ---
      S.listItem()
        .title('Blog')
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title('Blog')
            .items([
              S.documentTypeListItem('post').title('Posts'),
              S.documentTypeListItem('author').title('Authors'),
              S.documentTypeListItem('category').title('Categories'),
            ])
        ),

      // Divider
      S.divider(),

      // --- MAIN LIST ITEMS ---
      S.documentTypeListItem('author40k')
        .title('40k Authors')
        .icon(UsersIcon),

    ])
