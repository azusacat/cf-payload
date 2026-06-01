import type { CollectionConfig } from 'payload'

export const Missions: CollectionConfig = {
  slug: 'missions',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'remarks',
      type: 'textarea',
    },
    {
      name: 'school',
      type: 'relationship',
      relationTo: 'schools',
      required: true,
    },
    {
      name: 'teacher',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      filterOptions: {
        role: {
          equals: 'Teacher',
        },
      },
    },
  ],
}
