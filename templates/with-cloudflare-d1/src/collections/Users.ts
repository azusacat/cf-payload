import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Zero2 admin', value: 'Zero2 admin' },
        { label: 'Zero2 Staff', value: 'Zero2 Staff' },
        { label: 'Teacher', value: 'Teacher' },
      ],
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
  ],
}
